import { describe, expect, it } from 'vitest';
import {
  bezier,
  cinematic,
  clamp,
  elastic,
  inverseLerp,
  keyframes,
  keyedRandom,
  lerp,
  mapRange,
  morphPoints,
  noise,
  overshoot,
  pathPoint,
  progress,
  seededRandom,
  sequence,
  shake,
  smoothstep,
  spring,
  stagger,
} from '../packages/motion/index';
import { cameraAt, frameBounds, trackTarget } from '../packages/camera/index';
import {
  frameToTime,
  meaningfulBeats,
  recommendScenes,
  sampleTimeline,
  timeToFrame,
} from '../packages/timeline/index';
import { geoCameraFlight, greatCircle, mapPaths, normalizeGeometry } from '../packages/maps/index';
import { parseProject } from '../packages/schema/index';

describe('absolute-time interpolation', () => {
  it('maps intervals and clamps progress at both boundaries', () => {
    expect(lerp(10, 30, 0.25)).toBe(15);
    expect(inverseLerp(10, 30, 15)).toBe(0.25);
    expect(mapRange(15, 10, 30, 0, 100)).toBe(25);
    expect(progress(2, 4, 1)).toBe(0);
    expect(progress(2, 4, 3)).toBe(0.5);
    expect(progress(2, 4, 5)).toBe(1);
    expect(progress(2, 2, 1)).toBe(0);
    expect(progress(2, 2, 2)).toBe(1);
    expect(clamp(-5, -2, 7)).toBe(-2);
  });

  it('uses exact endpoints and symmetric cinematic easing', () => {
    for (const ease of [smoothstep, cinematic, elastic, overshoot, spring]) {
      expect(ease(0)).toBeCloseTo(0, 12);
      expect(ease(1)).toBeCloseTo(1, 12);
      expect(Number.isFinite(ease(0.35))).toBe(true);
    }
    expect(cinematic(0.25)).toBeCloseTo(1 - cinematic(0.75), 12);
    expect(cinematic(0.001)).toBeLessThan(0.000001);
  });

  it('evaluates keyframes correctly out of order and rejects ambiguous keys', () => {
    const keys = [
      [0, 2],
      [2, 10],
      [4, 6],
    ] as const;
    expect(keyframes(3, keys)).toBe(8);
    expect(keyframes(1, keys)).toBe(6);
    expect(keyframes(3, keys)).toBe(8);
    expect(keyframes(-1, keys)).toBe(2);
    expect(keyframes(5, keys)).toBe(6);
    expect(() => keyframes(1, [])).toThrow();
    expect(() =>
      keyframes(1, [
        [0, 2],
        [0, 3],
      ]),
    ).toThrow();
  });

  it('computes paths by distance rather than by segment index', () => {
    const points = [
      [0, 0],
      [3, 0],
      [3, 4],
    ] as const;
    expect(pathPoint(points, 3 / 7)).toEqual([3, 0]);
    expect(pathPoint(points, 5 / 7)).toEqual([3, 2]);
    expect(pathPoint(points, 2)).toEqual([3, 4]);
    expect(
      pathPoint(
        [
          [5, 6],
          [5, 6],
        ],
        0.5,
      ),
    ).toEqual([5, 6]);
    expect(() => pathPoint([], 0.2)).toThrow();
    expect(bezier([0, 0], [1, 2], [3, 2], [4, 0], 0.5)).toEqual([2, 1.5]);
  });

  it('resamples morph endpoints and returns stable sequence timing', () => {
    const from = [
        [0, 0],
        [4, 0],
      ] as const,
      to = [
        [0, 0],
        [0, 4],
      ] as const;
    expect(morphPoints(from, to, 0.5, 3)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
    expect(() => morphPoints(from, to, 0.5, 1)).toThrow();
    expect(sequence(2, [2, 3])).toEqual({ index: 1, localTime: 0, progress: 0 });
    expect(sequence(6, [2, 3])).toEqual({ index: 1, localTime: 3, progress: 1 });
    expect(() => sequence(1, [0, 2])).toThrow();
    expect(stagger(3, 0.2, 0.5)).toBeCloseTo(1.1);
  });
});

describe('randomness and camera seeking', () => {
  it('keeps object randomness independent of evaluation order', () => {
    const original = keyedRandom(41, 'route-1');
    for (let i = 0; i < 100; i++) keyedRandom(41, `extra-${i}`);
    expect(keyedRandom(41, 'route-1')).toBe(original);
    expect(keyedRandom(42, 'route-1')).not.toBe(original);
    const a = seededRandom(41),
      b = seededRandom(41);
    const sequenceA = Array.from({ length: 32 }, () => a());
    expect(sequenceA).toEqual(Array.from({ length: 32 }, () => b()));
    expect(sequenceA.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('produces bounded continuous noise and deterministic shake', () => {
    for (const time of [-1.3, 0, 0.5, 1, 17.42])
      expect(Math.abs(noise(time, 5))).toBeLessThanOrEqual(1);
    expect(Math.abs(noise(1 - 1e-6, 5) - noise(1 + 1e-6, 5))).toBeLessThan(1e-8);
    expect(shake(12.4, 0.1, 9)).toEqual(shake(12.4, 0.1, 9));
    expect(shake(12.4, 0, 9).every((value) => value === 0)).toBe(true);
  });

  it('interpolates zoom logarithmically and frames a target symmetrically', () => {
    const camera = {
      start: 0,
      end: 2,
      from: { x: 0, y: 0, zoom: 1, rotation: 0 },
      to: { x: 0.2, y: -0.1, zoom: 4, rotation: 10 },
    };
    expect(cameraAt(camera, 1)).toEqual({ x: 0.1, y: -0.05, zoom: 2, rotation: 5 });
    expect(cameraAt(camera, 4)).toEqual(camera.to);
    expect(trackTarget([960, 540], 1920, 1080)).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 });
    expect(frameBounds({ x: 480, y: 270, width: 960, height: 540 }, 1920, 1080, 0)).toEqual({
      x: 0,
      y: 0,
      zoom: 2,
      rotation: 0,
    });
  });
});

describe('timeline random-access selection', () => {
  const common = {
    type: 'custom',
    renderer: 'test',
    title: 'A test scene',
    mode: 'METAPHOR',
    thesis: 'A deterministic selection.',
    addedInformation: 'Exercise the scene boundary.',
  };
  const project = parseProject({
    version: 1,
    id: 'timeline-test',
    title: 'Timeline test',
    seed: 1,
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    duration: 4,
    narration: { kind: 'silent-demo' },
    scenes: [
      { ...common, id: 'a', start: 0, end: 2, beats: [{ at: 1.25, label: 'First reveal' }] },
      {
        ...common,
        id: 'b',
        start: 2,
        end: 4,
        transition: { type: 'focus-through', duration: 0.5, reason: 'Continue the same object.' },
      },
    ],
  });

  it('owns boundaries with the incoming scene and clamps editor endpoints', () => {
    expect(sampleTimeline(project, 1.999).scene.id).toBe('a');
    expect(sampleTimeline(project, 2).scene.id).toBe('b');
    expect(sampleTimeline(project, 2).localTime).toBe(0);
    expect(sampleTimeline(project, 2.25).transitionProgress).toBe(0.5);
    expect(sampleTimeline(project, 2.5).transitionProgress).toBe(1);
    expect(sampleTimeline(project, -1).scene.id).toBe('a');
    expect(sampleTimeline(project, 4).scene.id).toBe('b');
    expect(sampleTimeline(project, 100).localTime).toBeLessThan(2);
    expect(() => sampleTimeline(project, Number.NaN)).toThrow();
  });

  it('maps frames and authored beats without accumulated timing drift', () => {
    expect(frameToTime(300, 24)).toBe(12.5);
    expect(timeToFrame(12.5, 24)).toBe(300);
    expect(meaningfulBeats(project).map((beat) => beat.time)).toEqual([0, 1.25, 2]);
    expect(recommendScenes('EVIDENCE')).toContain('evidence');
    expect(recommendScenes('MECHANISM')).toContain('flow');
  });
});

describe('geographic geometry and camera', () => {
  it('normalizes supported feature input and rejects invalid topology', () => {
    const feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [56, 26] },
    };
    expect(normalizeGeometry(feature).features).toHaveLength(1);
    expect(() => normalizeGeometry({ type: 'Topology', objects: {} })).toThrow('no objects');
    expect(() => normalizeGeometry({ type: 'not-geometry' })).toThrow();
  });

  it('projects the chosen map center into its viewport center', () => {
    const geometry = normalizeGeometry({ type: 'FeatureCollection', features: [] });
    const map = mapPaths(geometry, { width: 1000, height: 500, center: [56, 26], zoom: 5 });
    const center = map.project([56, 26]);
    expect(center[0]).toBeCloseTo(500, 10);
    expect(center[1]).toBeCloseTo(250, 10);
    expect(map.project([57, 26])[0]).toBeGreaterThan(center[0]);
    expect(map.project([56, 27])[1]).toBeLessThan(center[1]);
  });

  it('preserves geographic flight endpoints and spherical route endpoints', () => {
    const from = { center: [0, 0] as [number, number], zoom: 1 },
      to = { center: [56, 26] as [number, number], zoom: 9 };
    expect(geoCameraFlight(from, to, 0)).toEqual(from);
    const end = geoCameraFlight(from, to, 1);
    expect(end.center[0]).toBeCloseTo(56, 10);
    expect(end.center[1]).toBeCloseTo(26, 10);
    expect(end.zoom).toBeCloseTo(9, 10);
    expect(geoCameraFlight(from, to, 0.5).zoom).toBeCloseTo(3, 10);
    const route = greatCircle([0, 0], [90, 0], 3);
    expect(route[1][0]).toBeCloseTo(45, 10);
    expect(route[2][0]).toBeCloseTo(90, 10);
    expect(route.every((point) => point.every(Number.isFinite))).toBe(true);
  });
});
