import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { localFile } from '../../scripts/project.ts';
import { normalizeGeometry, routeLandCrossings } from '../maps/index.ts';
import type { Project } from '../schema/index.ts';
import { validateAssets } from '../assets/index.ts';
import { probeMedia, type MediaProbe } from '../audio/index.ts';

export interface QAIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
  sceneId?: string;
  time?: number;
}
export interface QAReport {
  project: string;
  generatedAt: string;
  passed: boolean;
  issues: QAIssue[];
  samples?: number;
  video?: VideoAudit & { file: string };
}
export async function staticQA(project: Project, directory: string): Promise<QAIssue[]> {
  const issues: QAIssue[] = (await validateAssets(project, directory)).map((a) => ({
    level: a.level,
    code: 'asset',
    message: `${a.assetId}: ${a.message}`,
  }));
  if (project.narration.kind === 'silent-demo')
    issues.push({
      level: 'warning',
      code: 'silent-demo',
      message: 'This demonstration has no recorded narration. Replace it before publication.',
    });
  for (const scene of project.scenes) {
    if (scene.type === 'geo-flow' && scene.routes.some((route) => route.surface === 'sea')) {
      try {
        const asset = project.assets.find((asset) => asset.id === scene.asset)!;
        const geometry = normalizeGeometry(
          JSON.parse(await readFile(await localFile(directory, asset.file), 'utf8')),
        );
        for (const route of scene.routes.filter((route) => route.surface === 'sea')) {
          const crossings = routeLandCrossings(geometry, route.points);
          if (crossings.length)
            issues.push({
              level: 'error',
              code: 'sea-route-crosses-land',
              sceneId: scene.id,
              message: `Sea route ${route.id} crosses supplied land geometry near ${crossings[0].coordinates.map((c) => c.toFixed(4)).join(', ')}. Review waypoints and coastline resolution.`,
            });
        }
      } catch (error) {
        issues.push({
          level: 'error',
          code: 'map-data',
          sceneId: scene.id,
          message: String(error),
        });
      }
    }
    const duration = scene.end - scene.start;
    if (duration > 3 && scene.beats.length === 0)
      issues.push({
        level: 'warning',
        code: 'pacing',
        sceneId: scene.id,
        message: `${duration.toFixed(1)}s scene has no explicit development beats; inspect for a static hold`,
      });
    if (scene.type === 'comparison' && Math.min(scene.left.value, scene.right.value) < 0)
      issues.push({
        level: 'warning',
        code: 'comparison',
        sceneId: scene.id,
        message: 'Negative comparison values need a zero-baseline chart; inspect visual encoding',
      });
    if (scene.type === 'portrait-duel') {
      const left = project.assets.find((a) => a.id === scene.left.asset),
        right = project.assets.find((a) => a.id === scene.right.asset);
      if (left?.role !== right?.role)
        issues.push({
          level: 'warning',
          code: 'political-parity',
          sceneId: scene.id,
          message:
            'Portrait roles differ; review documentary authenticity and balanced visual treatment',
        });
    }
  }
  return issues;
}

export async function imageQA(bytes: Buffer): Promise<{ blank: boolean; thumbnail: Buffer }> {
  const stats = await sharp(bytes).stats();
  const blank = stats.channels.slice(0, 3).every((channel) => channel.stdev < 2);
  const thumbnail = await sharp(bytes)
    .resize(160, 90, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();
  return { blank, thumbnail };
}

export function imageDifference(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length || a.length === 0)
    throw new Error('Difference requires equal nonempty image buffers');
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length / 255;
}

export interface VideoExpectation {
  duration: number;
  fps: number;
  width: number;
  height: number;
  audio: boolean;
}
export interface VideoAudit {
  expected: VideoExpectation;
  observed: MediaProbe;
  issues: QAIssue[];
  toleranceSeconds: number;
}

export function evaluateVideoProbe(media: MediaProbe, expected: VideoExpectation): VideoAudit {
  const video = media.streams.find((s) => s.codec_type === 'video'),
    audio = media.streams.find((s) => s.codec_type === 'audio');
  const issues: QAIssue[] = [],
    error = (code: string, message: string) => issues.push({ level: 'error', code, message });
  const sampleRate = Number(audio?.sample_rate ?? 48000);
  const tolerance =
    Math.max(
      1 / expected.fps,
      1024 / (Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 48000),
    ) + 0.01;
  const result = () => ({ expected, observed: media, issues, toleranceSeconds: tolerance });
  if (!video) {
    error('video', 'Missing video stream');
    return result();
  }
  if (video.width !== expected.width || video.height !== expected.height)
    error(
      'resolution',
      `Expected ${expected.width}×${expected.height}; got ${video.width}×${video.height}`,
    );
  if (
    !Number.isFinite(Number(media.format.duration)) ||
    Math.abs(Number(media.format.duration) - expected.duration) > tolerance
  )
    error(
      'duration',
      `Expected ${expected.duration}s; got ${media.format.duration}s (tolerance ${tolerance.toFixed(4)}s)`,
    );
  const expectedFrames = Math.ceil(expected.duration * expected.fps - 1e-9),
    frameCount = Number(video.nb_read_frames ?? video.nb_frames);
  if (frameCount !== expectedFrames)
    error('frame-count', `Expected ${expectedFrames} frames; got ${frameCount}`);
  const [numerator, denominator] = (video.avg_frame_rate ?? '0/1').split('/').map(Number);
  if (
    !Number.isFinite(numerator / denominator) ||
    Math.abs(numerator / denominator - expected.fps) > 0.001
  )
    error('fps', `Expected ${expected.fps} FPS; got ${video.avg_frame_rate}`);
  if (Boolean(audio) !== expected.audio)
    error('audio', expected.audio ? 'Missing narration audio stream' : 'Unexpected audio stream');
  if (
    audio &&
    (!Number.isFinite(Number(audio.duration)) ||
      Math.abs(Number(audio.duration) - expected.duration) > tolerance)
  )
    error(
      'audio-duration',
      `Audio lasts ${audio.duration ?? 'unknown'}s; expected ${expected.duration}s`,
    );
  return result();
}

export async function videoAudit(file: string, expected: VideoExpectation): Promise<VideoAudit> {
  return evaluateVideoProbe(await probeMedia(file, true), expected);
}

export async function videoQA(file: string, expected: VideoExpectation): Promise<QAIssue[]> {
  return (await videoAudit(file, expected)).issues;
}

export function reportMarkdown(report: QAReport): string {
  return [
    `# QA — ${report.project}`,
    '',
    `Result: **${report.passed ? 'PASS' : 'FAIL'}**. ${report.samples ?? 0} visual samples.`,
    '',
    ...report.issues.map(
      (issue) =>
        `- **${issue.level.toUpperCase()} · ${issue.code}**${issue.sceneId ? ` ${issue.sceneId}` : ''}${issue.time !== undefined ? ` @ ${issue.time.toFixed(3)}s` : ''}: ${issue.message}`,
    ),
    '',
    'Automated QA cannot judge factual correctness, editorial fairness or cinematic quality. Complete the creative rubric and inspect the contact sheet.',
    '',
  ].join('\n');
}
