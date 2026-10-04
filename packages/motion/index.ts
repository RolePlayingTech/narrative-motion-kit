/** Absolute-time motion. No state, wall clock or unseeded random is consulted. */
export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const inverseLerp = (a: number, b: number, value: number): number =>
  a === b ? (value >= b ? 1 : 0) : (value - a) / (b - a);
export const progress = (start: number, end: number, time: number): number =>
  clamp(inverseLerp(start, end, time));
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
export const smoothstep = (p: number): number => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (p: number): number => 1 - (1 - clamp(p)) ** 3;
export const easeInOutCubic = (p: number): number => {
  const t = clamp(p);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
export const cinematic = (p: number): number => {
  const t = clamp(p);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const overshoot = (p: number, amount = 1.2): number => {
  const t = clamp(p) - 1;
  return 1 + (amount + 1) * t * t * t + amount * t * t;
};
export const elastic = (p: number): number => {
  const t = clamp(p);
  return t === 0 || t === 1
    ? t
    : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1;
};
/** Normalized damped step response with exact endpoints, not a numerical integrator. */
export function spring(p: number, damping = 7, frequency = 12): number {
  const sample = (t: number) =>
    1 -
    Math.exp(-damping * t) *
      (Math.cos(frequency * t) + (damping / frequency) * Math.sin(frequency * t));
  return p <= 0 ? 0 : p >= 1 ? 1 : sample(p) / sample(1);
}
export type Easing = (p: number) => number;
export type Keyframe = readonly [number, number];
export function keyframes(
  time: number,
  keys: readonly Keyframe[],
  ease: Easing = smoothstep,
): number {
  if (!keys.length) throw new Error('keyframes requires at least one key');
  for (let i = 1; i < keys.length; i++)
    if (keys[i][0] <= keys[i - 1][0]) throw new Error('Keyframe times must strictly increase');
  if (time <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (time < keys[i][0])
      return lerp(keys[i - 1][1], keys[i][1], ease(progress(keys[i - 1][0], keys[i][0], time)));
  return keys[keys.length - 1][1];
}
/** Stable keyed random: adding an element never changes another element's randomness. */
export function keyedRandom(seed: number, key: string | number): number {
  let h = seed >>> 0;
  for (const char of String(key)) {
    h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Local streams only. Recreate per frame or use keyedRandom for render elements. */
export function seededRandom(seed: number): () => number {
  let i = 0;
  return () => keyedRandom(seed, i++);
}
export function noise(time: number, seed = 1): number {
  const i = Math.floor(time);
  return lerp(keyedRandom(seed, i), keyedRandom(seed, i + 1), smoothstep(time - i)) * 2 - 1;
}
export function shake(time: number, amplitude = 1, seed = 1, frequency = 18): [number, number] {
  return [
    noise(time * frequency, seed) * amplitude,
    noise(time * frequency, seed + 19) * amplitude,
  ];
}
export const stagger = (index: number, delay: number, start = 0): number => start + index * delay;
export function sequence(
  time: number,
  durations: readonly number[],
): { index: number; localTime: number; progress: number } {
  if (!durations.length || durations.some((d) => d <= 0))
    throw new Error('sequence requires positive durations');
  let start = 0;
  for (let i = 0; i < durations.length; i++) {
    const end = start + durations[i];
    if (time < end || i === durations.length - 1)
      return {
        index: i,
        localTime: clamp(time - start, 0, durations[i]),
        progress: progress(start, end, time),
      };
    start = end;
  }
  throw new Error('Unreachable');
}
export type Point = readonly [number, number];
export function bezier(a: Point, b: Point, c: Point, d: Point, p: number): [number, number] {
  const t = clamp(p),
    u = 1 - t;
  return [0, 1].map(
    (i) => u ** 3 * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t ** 3 * d[i],
  ) as [number, number];
}
export function pathPoint(points: readonly Point[], p: number): [number, number] {
  if (!points.length) throw new Error('pathPoint needs points');
  const lengths = points
    .slice(1)
    .map((v, i) => Math.hypot(v[0] - points[i][0], v[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = clamp(p) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] && lengths[i] > 0) {
      const t = distance / lengths[i];
      return [lerp(points[i][0], points[i + 1][0], t), lerp(points[i][1], points[i + 1][1], t)];
    }
    distance -= lengths[i];
  }
  return [...points[points.length - 1]];
}
export function morphPoints(
  from: readonly Point[],
  to: readonly Point[],
  p: number,
  samples = 48,
): [number, number][] {
  if (samples < 2) throw new Error('Morph needs at least two samples');
  return Array.from({ length: samples }, (_, i) => {
    const a = pathPoint(from, i / (samples - 1)),
      b = pathPoint(to, i / (samples - 1));
    return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
  });
}
export const revealMask = (p: number, axis: 'x' | 'y' = 'x'): string =>
  axis === 'x' ? `inset(0 ${(1 - clamp(p)) * 100}% 0 0)` : `inset(0 0 ${(1 - clamp(p)) * 100}% 0)`;
