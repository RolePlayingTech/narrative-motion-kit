import type { Project } from '../packages/schema/index.ts';

export interface RenderPlan {
  from: number;
  to: number;
  fps: number;
  width: number;
  height: number;
  frames: { index: number; time: number }[];
}
export function framePlan(
  project: Pick<Project, 'duration' | 'fps' | 'resolution'>,
  options: { from?: number; to?: number; fps?: number; width?: number; height?: number } = {},
): RenderPlan {
  const from = options.from ?? 0,
    to = options.to ?? project.duration,
    fps = options.fps ?? project.fps;
  const width = options.width ?? project.resolution.width,
    height = options.height ?? project.resolution.height;
  if (
    ![from, to, fps, width, height].every(Number.isFinite) ||
    from < 0 ||
    to > project.duration + 1e-8 ||
    to <= from
  )
    throw new Error('Invalid render interval: require 0 ≤ from < to ≤ duration');
  if (!Number.isInteger(fps) || fps < 1 || fps > 120)
    throw new Error('FPS must be an integer in [1,120]');
  if (![width, height].every((v) => Number.isInteger(v) && v >= 240 && v <= 7680 && v % 2 === 0))
    throw new Error('Output dimensions must be even integers in [240,7680]');
  return {
    from,
    to,
    fps,
    width,
    height,
    frames: Array.from({ length: Math.ceil((to - from) * fps - 1e-9) }, (_, index) => ({
      index,
      time: from + index / fps,
    })),
  };
}

export function contactTimes(
  project: Project,
  options: { everySeconds?: number; everyFrames?: number } = {},
): number[] {
  if (options.everySeconds !== undefined && options.everyFrames !== undefined)
    throw new Error('Choose --every-seconds or --every-frames, not both');
  const interval =
    options.everySeconds ??
    (options.everyFrames !== undefined ? options.everyFrames / project.fps : undefined);
  if (
    interval !== undefined &&
    (!Number.isFinite(interval) || interval <= 0 || interval < 1 / project.fps)
  )
    throw new Error('Contact interval must be at least one frame');
  const last = Math.max(0, project.duration - 1 / project.fps);
  const times =
    interval === undefined
      ? project.scenes.flatMap((s) => [
          s.start,
          (s.start + s.end) / 2,
          Math.max(s.start, s.end - 1 / project.fps),
        ])
      : Array.from({ length: Math.floor(last / interval) + 1 }, (_, i) => i * interval);
  return [...new Set(times.map((t) => Math.max(0, Math.min(last, t))))].sort((a, b) => a - b);
}
