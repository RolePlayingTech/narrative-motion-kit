import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { capture, openRenderSession, type RenderPage } from './browser.ts';
import { atomicWrite, renderFingerprint } from './cache.ts';
import { framePlan, type RenderPlan } from './render-plan.ts';
import { localFile, type LoadedProject } from './project.ts';
import { run } from './process.ts';
import { probeMedia } from '../packages/audio/index.ts';
import { videoAudit } from '../packages/qa/index.ts';
import { sourcesMarkdown } from '../packages/research/index.ts';
import { validateAssets } from '../packages/assets/index.ts';
import { renderEnvironment, type RenderEnvironment } from './environment.ts';

export interface RenderOptions {
  from?: number;
  to?: number;
  width?: number;
  height?: number;
  fps?: number;
  workers?: number;
  resume?: boolean;
}
export const frameFilename = (index: number) => `frame-${String(index).padStart(8, '0')}.png`;

async function assertAssets(loaded: LoadedProject): Promise<void> {
  const issues = await validateAssets(loaded.project, loaded.directory),
    errors = issues.filter((i) => i.level === 'error');
  if (errors.length) throw new Error(errors.map((i) => `${i.assetId}: ${i.message}`).join('\n'));
}

export async function renderFrame(
  loaded: LoadedProject,
  time: number,
  options: Pick<RenderOptions, 'width' | 'height'> = {},
): Promise<string> {
  if (!Number.isFinite(time) || time < 0 || time > loaded.project.duration)
    throw new Error('Frame time must be between 0 and narration duration');
  const plan = framePlan(loaded.project, options);
  await assertAssets(loaded);
  const session = await openRenderSession(loaded.project.id, plan.width, plan.height);
  const output = join(
    loaded.directory,
    'renders',
    'frames',
    `t-${time.toFixed(4)}-${plan.width}x${plan.height}.png`,
  );
  try {
    const page = await session.page();
    await atomicWrite(output, await capture(page, time));
  } finally {
    await session.close();
  }
  return output;
}

async function validCachedFrame(file: string, width: number, height: number): Promise<boolean> {
  try {
    if (!(await stat(file)).isFile()) return false;
    const bytes = await readFile(file);
    const metadata = await sharp(bytes).metadata();
    if (metadata.width !== width || metadata.height !== height) return false;
    await sharp(bytes).stats();
    return true;
  } catch {
    return false;
  }
}

export async function renderFrames(
  loaded: LoadedProject,
  options: RenderOptions = {},
): Promise<{
  directory: string;
  plan: RenderPlan;
  fingerprint: string;
  rendered: number;
  skipped: number;
  environment: RenderEnvironment;
}> {
  const plan = framePlan(loaded.project, options),
    workers = options.workers ?? 2;
  if (!Number.isInteger(workers) || workers < 1 || workers > 16)
    throw new Error('--workers must be an integer in [1,16]');
  await assertAssets(loaded);
  const settings = {
    from: plan.from,
    to: plan.to,
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
  };
  const session = await openRenderSession(loaded.project.id, plan.width, plan.height);
  try {
    const environment = await renderEnvironment(session.browserVersion);
    const fingerprint = await renderFingerprint(loaded, settings, environment);
    const directory = join(loaded.directory, 'renders', '.cache', fingerprint);
    await mkdir(directory, { recursive: true });
    await atomicWrite(
      join(directory, 'manifest.json'),
      JSON.stringify(
        {
          fingerprint,
          project: loaded.project.id,
          from: plan.from,
          to: plan.to,
          fps: plan.fps,
          width: plan.width,
          height: plan.height,
          frameCount: plan.frames.length,
          environment,
        },
        null,
        2,
      ),
    );
    let next = 0,
      rendered = 0,
      skipped = 0,
      stopped = false;
    const progress = () => {
      const complete = rendered + skipped;
      if (
        complete % Math.max(1, Math.floor(plan.frames.length / 20)) === 0 ||
        complete === plan.frames.length
      )
        console.log(`Frames ${complete}/${plan.frames.length} (${skipped} reused)`);
    };
    const outcomes = await Promise.allSettled(
      Array.from({ length: Math.min(workers, plan.frames.length) }, async () => {
        let page: RenderPage | undefined;
        try {
          page = await session.page();
          while (!stopped) {
            const job = plan.frames[next++];
            if (!job) break;
            const file = join(directory, frameFilename(job.index));
            if (options.resume && (await validCachedFrame(file, plan.width, plan.height))) {
              skipped++;
              progress();
              continue;
            }
            await atomicWrite(file, await capture(page, job.time));
            rendered++;
            progress();
          }
        } catch (error) {
          stopped = true;
          throw error;
        } finally {
          await page?.page.close();
        }
      }),
    );
    const failure = outcomes.find(
      (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
    );
    if (failure) throw failure.reason;
    if ((await renderFingerprint(loaded, settings, environment)) !== fingerprint)
      throw new Error(
        'Project or renderer files changed during rendering. Rerun with stable inputs; this cache will not be used for the changed project.',
      );
    return { directory, plan, fingerprint, rendered, skipped, environment };
  } finally {
    await session.close();
  }
}

export async function renderVideo(
  loaded: LoadedProject,
  mode: 'draft' | 'final' | 'range',
  options: RenderOptions = {},
): Promise<string> {
  let audio: string | undefined;
  if (loaded.project.narration.file) {
    audio = await localFile(loaded.directory, loaded.project.narration.file);
    const media = await probeMedia(audio);
    if (!media.streams.some((s) => s.codec_type === 'audio'))
      throw new Error('Narration contains no audio');
    const duration = Number(media.format.duration);
    if (Math.abs(duration - loaded.project.duration) > 0.01)
      throw new Error(
        `Narration is ${duration}s but project duration is ${loaded.project.duration}s. Run audio:ingest and align the timeline to the audio.`,
      );
  }
  const draftScale = Math.min(
    1,
    Math.max(
      0.5,
      240 / Math.min(loaded.project.resolution.width, loaded.project.resolution.height),
    ),
  );
  const defaults =
    mode === 'draft'
      ? {
          width: Math.round((loaded.project.resolution.width * draftScale) / 2) * 2,
          height: Math.round((loaded.project.resolution.height * draftScale) / 2) * 2,
          fps: Math.min(15, loaded.project.fps),
        }
      : {};
  const result = await renderFrames(loaded, { ...defaults, ...options }),
    { plan } = result;
  const directory = join(loaded.directory, 'renders', mode);
  await mkdir(directory, { recursive: true });
  const basename =
    mode === 'range'
      ? `${loaded.project.id}-${plan.from.toFixed(3)}-${plan.to.toFixed(3)}`
      : loaded.project.id;
  const output = join(directory, `${basename}.mp4`),
    temporary = join(directory, `${basename}.${process.pid}.part.mp4`);
  const duration = plan.to - plan.from;
  await run('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-framerate',
    String(plan.fps),
    '-start_number',
    '0',
    '-i',
    join(result.directory, 'frame-%08d.png'),
    ...(audio ? ['-ss', String(plan.from), '-i', audio] : []),
    '-map',
    '0:v:0',
    ...(audio ? ['-map', '1:a:0'] : []),
    '-t',
    String(duration),
    '-c:v',
    'libx264',
    '-preset',
    mode === 'final' ? 'medium' : 'veryfast',
    '-crf',
    mode === 'final' ? '18' : '25',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(plan.fps),
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k'] : []),
    '-movflags',
    '+faststart',
    temporary,
  ]);
  const audit = await videoAudit(temporary, {
    duration,
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
    audio: Boolean(audio),
  });
  const { issues } = audit;
  await writeFile(
    join(directory, 'technical-qa.json'),
    JSON.stringify(
      {
        output,
        fingerprint: result.fingerprint,
        environment: result.environment,
        ...audit,
        passed: issues.every((i) => i.level !== 'error'),
      },
      null,
      2,
    ) + '\n',
  );
  if (issues.some((i) => i.level === 'error'))
    throw new Error(`Encoded video failed QA: ${issues.map((i) => i.message).join('; ')}`);
  const { rename } = await import('node:fs/promises');
  await rename(temporary, output);
  await atomicWrite(
    join(directory, 'render-manifest.json'),
    JSON.stringify(
      {
        project: loaded.project.id,
        fingerprint: result.fingerprint,
        environment: result.environment,
        settings: {
          from: plan.from,
          to: plan.to,
          fps: plan.fps,
          width: plan.width,
          height: plan.height,
          frameCount: plan.frames.length,
        },
        output,
        audio: loaded.project.narration.file ?? null,
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(join(directory, 'SOURCES.md'), sourcesMarkdown(loaded.project));
  return output;
}
