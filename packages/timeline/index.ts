import type { Project, Scene } from '../schema/index';
import { clamp } from '../motion/index';

export interface SceneSample {
  scene: Scene;
  index: number;
  time: number;
  localTime: number;
  duration: number;
  previous?: Scene;
  transitionProgress: number;
}
/** Half-open scene intervals. The final endpoint shows the final frame for the editor. */
export function sampleTimeline(project: Project, time: number): SceneSample {
  if (!Number.isFinite(time)) throw new Error('Timeline time must be finite');
  const t = clamp(time, 0, Math.max(0, project.duration - 1e-9));
  let low = 0,
    high = project.scenes.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (project.scenes[mid].start <= t) low = mid;
    else high = mid - 1;
  }
  const scene = project.scenes[low],
    localTime = t - scene.start;
  return {
    scene,
    index: low,
    time: t,
    localTime,
    duration: scene.end - scene.start,
    previous: project.scenes[low - 1],
    transitionProgress:
      scene.transition && scene.transition.duration > 0
        ? clamp(localTime / scene.transition.duration)
        : 1,
  };
}
export const frameToTime = (frame: number, fps: number): number => frame / fps;
export const timeToFrame = (time: number, fps: number): number => Math.floor(time * fps + 1e-8);
export function meaningfulBeats(
  project: Project,
): { time: number; label: string; sceneId: string }[] {
  return project.scenes.flatMap((s) => [
    { time: s.start, label: s.title, sceneId: s.id },
    ...s.beats.map((b) => ({ time: s.start + b.at, label: b.label, sceneId: s.id })),
  ]);
}
export function pacingWarnings(project: Project, maxHold = 3.5): string[] {
  return project.scenes.flatMap((s) => {
    const times = [0, ...s.beats.map((b) => b.at), s.end - s.start].sort((a, b) => a - b);
    return times
      .slice(1)
      .flatMap((t, i) =>
        t - times[i] > maxHold
          ? [`${s.id}: ${(t - times[i]).toFixed(1)}s without an authored information beat`]
          : [],
      );
  });
}
export function recommendScenes(mode: Scene['mode']): Scene['type'][] {
  const choices: Record<Scene['mode'], Scene['type'][]> = {
    EVIDENCE: ['evidence', 'photo'],
    MECHANISM: ['flow', 'breakdown'],
    SCALE: ['statistic', 'line-chart', 'bar-chart', 'geo-flow'],
    CONTEXT: ['geo-flow', 'timeline', 'photo'],
    CHARACTER: ['photo', 'portrait-duel'],
    CONTRAST: ['comparison', 'portrait-duel', 'bar-chart'],
    METAPHOR: ['custom', 'flow'],
    TRANSITION: ['custom', 'geo-flow'],
  };
  return choices[mode];
}
