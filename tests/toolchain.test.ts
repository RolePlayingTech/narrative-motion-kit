import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { framePlan, contactTimes } from '../scripts/render-plan.ts';
import { localFile } from '../scripts/project.ts';
import { hashBytes, validateAssets } from '../packages/assets/index.ts';
import { parseProject, type Project } from '../packages/schema/index.ts';
import {
  parseAudioLog,
  validateSegments,
  SuppliedTranscriptProvider,
  TimestampJsonProvider,
} from '../packages/audio/index.ts';
import { evaluateVideoProbe, imageDifference, imageQA } from '../packages/qa/index.ts';
import { renderFingerprint } from '../scripts/cache.ts';
import type { RenderEnvironment } from '../scripts/environment.ts';
import { sourcesMarkdown } from '../packages/research/index.ts';

const temporary: string[] = [];
async function temp(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'motion-toolchain-'));
  temporary.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
function project(): Project {
  return parseProject({
    version: 1,
    id: 'unit',
    title: 'Żółć — test',
    seed: 42,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    duration: 2.01,
    narration: { kind: 'silent-demo' },
    scenes: [
      {
        id: 'evidence',
        type: 'evidence',
        start: 0,
        end: 2.01,
        title: 'Dokument',
        mode: 'EVIDENCE',
        thesis: 'One dominant thesis',
        addedInformation: 'A source adds useful context',
        heading: 'Dowód',
        body: ['Treść'],
        highlight: 'Treść',
        attribution: 'Test',
      },
    ],
  });
}

describe('render planning', () => {
  it('covers fractional audio duration without sampling beyond endpoint', () => {
    const plan = framePlan(project());
    expect(plan.frames).toHaveLength(61);
    expect(plan.frames[60].time).toBe(2);
    expect(plan.frames[0]).toEqual({ index: 0, time: 0 });
  });
  it('ranges seek absolute time but number files from zero', () => {
    const plan = framePlan(project(), { from: 0.7, to: 1.3, fps: 10 });
    expect(plan.frames).toHaveLength(6);
    expect(plan.frames[0]).toEqual({ index: 0, time: 0.7 });
    expect(plan.frames[5].time).toBeCloseTo(1.2);
  });
  it('rejects invalid intervals, odd dimensions and invalid FPS', () => {
    expect(() => framePlan(project(), { from: 1, to: 0 })).toThrow();
    expect(() => framePlan(project(), { to: 3 })).toThrow();
    expect(() => framePlan(project(), { width: 1919 })).toThrow();
    expect(() => framePlan(project(), { fps: 29.97 })).toThrow();
    expect(() => framePlan(project(), { from: NaN })).toThrow();
  });
  it('samples scene boundaries and intervals deterministically', () => {
    expect(contactTimes(project())).toEqual([0, 1.005, 2.01 - 1 / 30]);
    expect(contactTimes(project(), { everySeconds: 1 })).toEqual([0, 1]);
    expect(contactTimes(project(), { everyFrames: 30 })).toEqual([0, 1]);
    expect(() => contactTimes(project(), { everySeconds: 0 })).toThrow();
  });
});

describe('asset registry and paths', () => {
  it('allows local files but rejects traversal and missing files', async () => {
    const directory = await temp();
    await mkdir(join(directory, 'assets'));
    await writeFile(join(directory, 'assets', 'data.json'), '{}');
    expect(await localFile(directory, 'assets/data.json')).toContain('data.json');
    await expect(localFile(directory, '../outside.json')).rejects.toThrow('escapes');
    await expect(localFile(directory, 'https://example.org/file')).rejects.toThrow('relative');
    await expect(localFile(directory, 'missing')).rejects.toThrow();
  });
  it('detects duplicates, hash tampering and low image resolution', async () => {
    const directory = await temp(),
      bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#f00' } })
        .png()
        .toBuffer();
    await writeFile(join(directory, 'one.png'), bytes);
    await writeFile(join(directory, 'two.png'), bytes);
    const p = project();
    p.assets = ['one', 'two'].map((id) => ({
      id,
      file: `${id}.png`,
      kind: 'image',
      role: 'illustrative',
      acquired: '2026-10-03',
      license: 'Test fixture',
      sha256: id === 'one' ? hashBytes(bytes) : '0'.repeat(64),
    }));
    const issues = await validateAssets(p, directory);
    expect(issues.some((i) => i.message.includes('Identical'))).toBe(true);
    expect(issues.some((i) => i.message.includes('Low resolution'))).toBe(true);
    expect(issues.some((i) => i.level === 'error' && i.message.includes('SHA-256'))).toBe(true);
  });
  it('rejects undecodable downloads rather than trusting file extensions', async () => {
    const directory = await temp();
    await writeFile(join(directory, 'fake.png'), '<html>Error</html>');
    const p = project();
    p.assets = [
      {
        id: 'fake',
        file: 'fake.png',
        kind: 'image',
        role: 'documentary',
        acquired: '2026-10-03',
        license: 'Unknown',
      },
    ];
    expect((await validateAssets(p, directory))[0].level).toBe('error');
  });
});

describe('audio adapters', () => {
  it('validates timestamps and word ordering against narration', () => {
    expect(
      validateSegments(
        [{ start: 0, end: 1, text: 'Polska', words: [{ start: 0.1, end: 0.8, text: 'Polska' }] }],
        2,
      ),
    ).toHaveLength(1);
    expect(() => validateSegments([{ start: 0, end: 3, text: 'Too long' }], 2)).toThrow();
    expect(() =>
      validateSegments(
        [
          { start: 0, end: 1, text: 'Overlap' },
          { start: 0.5, end: 1.5, text: 'Overlap' },
        ],
        2,
      ),
    ).toThrow();
    expect(() =>
      validateSegments(
        [{ start: 0, end: 1, text: 'Word', words: [{ start: 0.5, end: 1.4, text: 'Word' }] }],
        2,
      ),
    ).toThrow();
  });
  it('marks proportional text timing approximate and preserves Polish characters', async () => {
    const directory = await temp(),
      file = join(directory, 'transcript.txt');
    await writeFile(file, 'Żółć i ropa. Cena rośnie!');
    const transcript = await new SuppliedTranscriptProvider(file).transcribe('unused', 10);
    expect(transcript.alignment).toBe('approximate');
    expect(transcript.segments[0].text).toBe('Żółć i ropa.');
    expect(transcript.segments.at(-1)?.end).toBe(10);
  });
  it('accepts externally supplied segment envelopes', async () => {
    const directory = await temp(),
      file = join(directory, 'timestamps.json');
    await writeFile(file, JSON.stringify({ segments: [{ start: 0, end: 1, text: 'Ropa' }] }));
    expect((await new TimestampJsonProvider(file).transcribe('unused', 2)).alignment).toBe(
      'supplied',
    );
  });
  it('extracts silence cut suggestions and handles digital silence intensity', () => {
    const analysis = parseAudioLog(
      'silence_start: 0.5\nsilence_end: 1.5\nframe:0 pts:0 pts_time:0\nlavfi.astats.Overall.RMS_level=-inf\nsilence_start: 2',
      3,
    );
    expect(analysis.silences).toEqual([
      { start: 0.5, end: 1.5 },
      { start: 2, end: 3 },
    ]);
    expect(analysis.suggestedEditPoints).toEqual([1, 2.5]);
    expect(analysis.intensity).toEqual([{ time: 0, rmsDb: -100 }]);
  });
});

describe('QA and provenance', () => {
  it('records actual video probe metadata and fails unknown timing rather than accepting NaN', () => {
    const expected = { duration: 1, fps: 30, width: 640, height: 360, audio: true };
    const observed = {
      format: { duration: '1.000' },
      streams: [
        {
          codec_type: 'video',
          width: 640,
          height: 360,
          nb_read_frames: '30',
          avg_frame_rate: '30/1',
        },
        { codec_type: 'audio', duration: '1', sample_rate: '48000' },
      ],
    };
    const audit = evaluateVideoProbe(observed, expected);
    expect(audit.issues).toEqual([]);
    expect(audit.observed).toBe(observed);
    expect(audit.toleranceSeconds).toBeCloseTo(1 / 30 + 0.01);
    observed.streams[0].avg_frame_rate = '0/0';
    observed.streams[1].duration = 'N/A';
    const invalid = evaluateVideoProbe(observed, expected);
    expect(invalid.issues.map((i) => i.code)).toEqual(['fps', 'audio-duration']);
  });
  it('invalidates cache when execution environment or local asset bytes change', async () => {
    const directory = await temp();
    await writeFile(join(directory, 'asset.txt'), 'first');
    const loaded = { project: project(), directory, config: join(directory, 'project.json') };
    const environment: RenderEnvironment = {
      node: '22',
      platform: 'win32',
      architecture: 'x64',
      osRelease: 'test',
      chromium: '153',
      playwright: '1',
      ffmpeg: 'test',
      ffmpegBuildSha256: 'abc',
      ffprobe: 'test',
    };
    const first = await renderFingerprint(loaded, { fps: 30 }, environment);
    const otherBrowser = await renderFingerprint(
      loaded,
      { fps: 30 },
      { ...environment, chromium: '154' },
    );
    expect(first).not.toBe(otherBrowser);
    await writeFile(join(directory, 'asset.txt'), 'second');
    expect(await renderFingerprint(loaded, { fps: 30 }, environment)).not.toBe(first);
  });
  it('detects blank images and normalized frame differences', async () => {
    const bytes = await sharp({
      create: { width: 80, height: 80, channels: 3, background: '#000' },
    })
      .png()
      .toBuffer();
    expect((await imageQA(bytes)).blank).toBe(true);
    expect(imageDifference(new Uint8Array([0, 0]), new Uint8Array([255, 255]))).toBe(1);
    expect(() => imageDifference(new Uint8Array(), new Uint8Array())).toThrow();
  });
  it('includes roles and generated prompts in provenance', () => {
    const p = project();
    p.assets = [
      {
        id: 'concept',
        file: 'concept.png',
        kind: 'image',
        role: 'generated',
        acquired: '2026-10-03',
        license: 'Internal illustration',
        prompt: 'Stylized refinery cross-section',
        generator: 'example-model',
      },
    ];
    const text = sourcesMarkdown(p);
    expect(text).toContain('**generated**');
    expect(text).toContain('Stylized refinery cross-section');
    expect(text).toContain('Żółć');
  });
});
