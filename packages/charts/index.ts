import type { Dataset } from '../schema/index';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Domain {
  min: number;
  max: number;
}
export const extent = (values: number[]): Domain => ({
  min: Math.min(...values),
  max: Math.max(...values),
});
export function nonzeroDomain(domain: Domain): Domain {
  if (domain.min === domain.max) {
    const padding = Math.abs(domain.min) * 0.1 || 1;
    return { min: domain.min - padding, max: domain.max + padding };
  }
  return domain;
}
export const scale = (value: number, domain: Domain, from: number, to: number): number =>
  from + ((value - domain.min) / (domain.max - domain.min)) * (to - from);
export function ticks(domain: Domain, count = 5): number[] {
  const rawStep = (domain.max - domain.min) / Math.max(1, count - 1);
  if (!(rawStep > 0)) return [domain.min];
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factors = [1, 2, 2.5, 5, 10];
  const factor = factors.reduce((best, next) =>
    Math.abs(next - rawStep / magnitude) < Math.abs(best - rawStep / magnitude) ? next : best,
  );
  const step = factor * magnitude;
  const first = Math.ceil(domain.min / step - 1e-10);
  const last = Math.floor(domain.max / step + 1e-10);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) =>
    Number(((first + i) * step).toPrecision(12)),
  );
}
export function formatNumber(value: number, decimals?: number, language = 'pl-PL'): string {
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? (Math.abs(value) < 10 ? 1 : 0),
  }).format(value);
}
export function lineGeometry(dataset: Dataset, rect: Rect, domain?: [number, number]) {
  const xDomain = nonzeroDomain(extent(dataset.points.map((p) => p.x)));
  const rawY = extent(dataset.points.map((p) => p.y));
  const yDomain = domain
    ? { min: domain[0], max: domain[1] }
    : nonzeroDomain({ min: Math.min(0, rawY.min), max: Math.max(0, rawY.max) });
  return {
    xDomain,
    yDomain,
    points: dataset.points.map(
      (p) =>
        [
          scale(p.x, xDomain, rect.x, rect.x + rect.width),
          scale(p.y, yDomain, rect.y + rect.height, rect.y),
        ] as [number, number],
    ),
  };
}
export function polyline(points: [number, number][]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');
}
export function groupSeries(dataset: Dataset): Dataset[] {
  const names = [...new Set(dataset.points.map((point) => point.series ?? ''))];
  return names.map((name) => ({
    ...dataset,
    title: name || dataset.title,
    points: dataset.points.filter((p) => (p.series ?? '') === name),
  }));
}
export function barGeometry(
  dataset: Dataset,
  rect: Rect,
): { rects: Rect[]; domain: Domain; zero: number } {
  const raw = extent(dataset.points.map((p) => p.y));
  const domain = nonzeroDomain({ min: Math.min(0, raw.min), max: Math.max(0, raw.max) });
  const zero = scale(0, domain, rect.y + rect.height, rect.y);
  const stride = rect.width / dataset.points.length;
  return {
    domain,
    zero,
    rects: dataset.points.map((p, i) => {
      const y = scale(p.y, domain, rect.y + rect.height, rect.y);
      return {
        x: rect.x + i * stride + stride * 0.17,
        y: Math.min(y, zero),
        width: stride * 0.66,
        height: Math.abs(y - zero),
      };
    }),
  };
}
