import { arch, platform, release } from 'node:os';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { run } from './process.ts';

export interface RenderEnvironment {
  node: string;
  platform: string;
  architecture: string;
  osRelease: string;
  chromium: string;
  playwright: string;
  ffmpeg: string;
  ffmpegBuildSha256: string;
  ffprobe: string;
}

export async function renderEnvironment(chromiumVersion: string): Promise<RenderEnvironment> {
  const require = createRequire(import.meta.url);
  const [ffmpeg, ffprobe, packageText] = await Promise.all([
    run('ffmpeg', ['-version']),
    run('ffprobe', ['-version']),
    readFile(require.resolve('playwright/package.json'), 'utf8'),
  ]);
  const pkg = JSON.parse(packageText) as { version: string };
  return {
    node: process.version,
    platform: platform(),
    architecture: arch(),
    osRelease: release(),
    chromium: chromiumVersion,
    playwright: pkg.version,
    ffmpeg: ffmpeg.stdout.split(/\r?\n/)[0],
    ffmpegBuildSha256: createHash('sha256').update(ffmpeg.stdout).digest('hex'),
    ffprobe: ffprobe.stdout.split(/\r?\n/)[0],
  };
}
