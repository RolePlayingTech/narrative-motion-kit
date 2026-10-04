import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { run } from '../../scripts/process.ts';

export interface MediaStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
  nb_frames?: string;
  nb_read_frames?: string;
  avg_frame_rate?: string;
  sample_rate?: string;
  channels?: number;
}
export interface MediaProbe {
  format: { duration: string; format_name?: string };
  streams: MediaStream[];
}
export async function probeMedia(file: string, countFrames = false): Promise<MediaProbe> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    ...(countFrames ? ['-count_frames'] : []),
    '-show_format',
    '-show_streams',
    '-of',
    'json',
    file,
  ]);
  const probe = JSON.parse(stdout) as MediaProbe;
  if (!Number.isFinite(Number(probe.format?.duration)) || Number(probe.format.duration) <= 0)
    throw new Error(`Cannot determine media duration: ${file}`);
  return probe;
}

export const SegmentSchema = z
  .object({
    start: z.number().finite().nonnegative(),
    end: z.number().finite().positive(),
    text: z.string().min(1),
    words: z
      .array(
        z
          .object({
            start: z.number().finite().nonnegative(),
            end: z.number().finite().positive(),
            text: z.string().min(1),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
export type TranscriptSegment = z.infer<typeof SegmentSchema>;
export interface Transcript {
  provider: string;
  alignment: 'approximate' | 'supplied' | 'model';
  segments: TranscriptSegment[];
}
export interface TranscriptionProvider {
  transcribe(audioFile: string, duration: number): Promise<Transcript>;
}

export function validateSegments(value: unknown, duration: number): TranscriptSegment[] {
  const segments = z.array(SegmentSchema).parse(value);
  let cursor = 0;
  for (const segment of segments) {
    if (
      segment.start < cursor - 0.001 ||
      segment.end <= segment.start ||
      segment.end > duration + 0.05
    )
      throw new Error('Transcript segment is overlapping, reversed or outside narration');
    cursor = segment.end;
    let wordEnd = segment.start;
    for (const word of segment.words ?? []) {
      if (word.start < wordEnd - 0.001 || word.end <= word.start || word.end > segment.end + 0.05)
        throw new Error('Invalid word timestamps');
      wordEnd = word.end;
    }
  }
  return segments;
}

/** Text has no timing evidence: estimates are deliberately labeled for mandatory human review. */
export class SuppliedTranscriptProvider implements TranscriptionProvider {
  constructor(private readonly file: string) {}
  async transcribe(_audioFile: string, duration: number): Promise<Transcript> {
    const text = (await readFile(this.file, 'utf8')).trim();
    if (!text) throw new Error('Supplied transcript is empty');
    const phrases = text
      .match(/[^.!?\n]+[.!?]?/gu)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [text];
    const weights = phrases.map((s) => s.split(/\s+/).length),
      total = weights.reduce((a, b) => a + b, 0);
    let cursor = 0;
    const segments = phrases.map((text, i) => {
      const start = cursor;
      cursor += (duration * weights[i]) / total;
      return { start, end: cursor, text };
    });
    return { provider: 'supplied-text', alignment: 'approximate', segments };
  }
}

export class TimestampJsonProvider implements TranscriptionProvider {
  constructor(private readonly file: string) {}
  async transcribe(_audioFile: string, duration: number): Promise<Transcript> {
    const value: unknown = JSON.parse(await readFile(this.file, 'utf8'));
    const segments =
      value && typeof value === 'object' && 'segments' in value ? value.segments : value;
    return {
      provider: 'supplied-timestamps',
      alignment: 'supplied',
      segments: validateSegments(segments, duration),
    };
  }
}

/** Local adapters print JSON {segments:[...]} to stdout. Never invokes a shell. */
export class LocalCommandProvider implements TranscriptionProvider {
  constructor(private readonly command: string[]) {
    if (!command.length) throw new Error('Local transcription command is empty');
  }
  async transcribe(audioFile: string, duration: number): Promise<Transcript> {
    const [executable, ...args] = this.command.map((arg) => arg.replaceAll('{audio}', audioFile));
    const { stdout } = await run(executable, args);
    const value: unknown = JSON.parse(stdout);
    const segments =
      value && typeof value === 'object' && 'segments' in value ? value.segments : value;
    return {
      provider: executable,
      alignment: 'model',
      segments: validateSegments(segments, duration),
    };
  }
}

export interface AudioAnalysis {
  duration: number;
  codec: string;
  sampleRate: number;
  channels: number;
  silences: { start: number; end: number }[];
  intensity: { time: number; rmsDb: number }[];
  suggestedEditPoints: number[];
  transcript?: Transcript;
}
export function parseAudioLog(
  log: string,
  duration: number,
): Pick<AudioAnalysis, 'silences' | 'intensity' | 'suggestedEditPoints'> {
  const silences: AudioAnalysis['silences'] = [],
    intensity: AudioAnalysis['intensity'] = [];
  let silenceStart: number | undefined,
    time = 0;
  for (const line of log.split('\n')) {
    const start = line.match(/silence_start:\s*([\d.]+)/),
      end = line.match(/silence_end:\s*([\d.]+)/);
    if (start) silenceStart = Number(start[1]);
    if (end) {
      silences.push({ start: silenceStart ?? 0, end: Math.min(Number(end[1]), duration) });
      silenceStart = undefined;
    }
    const timestamp = line.match(/pts_time:([\d.]+)/);
    if (timestamp) time = Number(timestamp[1]);
    const rms = line.match(/lavfi\.astats\.Overall\.RMS_level=(-?[\d.]+|-inf)/);
    if (rms)
      intensity.push({ time, rmsDb: rms[1] === '-inf' ? -100 : Math.max(-100, Number(rms[1])) });
  }
  if (silenceStart !== undefined && silenceStart < duration)
    silences.push({ start: silenceStart, end: duration });
  return { silences, intensity, suggestedEditPoints: silences.map((s) => (s.start + s.end) / 2) };
}

export async function ingestAudio(
  file: string,
  provider?: TranscriptionProvider,
): Promise<AudioAnalysis> {
  const probe = await probeMedia(file),
    stream = probe.streams.find((s) => s.codec_type === 'audio');
  if (!stream) throw new Error('Narration file contains no audio stream');
  const duration = Number(probe.format.duration);
  const { stderr } = await run('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    file,
    '-vn',
    '-af',
    'aresample=48000,asetnsamples=n=4800,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level,silencedetect=noise=-35dB:d=0.25',
    '-f',
    'null',
    '-',
  ]);
  return {
    duration,
    codec: stream.codec_name ?? 'unknown',
    sampleRate: Number(stream.sample_rate),
    channels: stream.channels ?? 1,
    ...parseAudioLog(stderr, duration),
    ...(provider ? { transcript: await provider.transcribe(file, duration) } : {}),
  };
}
