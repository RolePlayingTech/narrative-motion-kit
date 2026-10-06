import type { Scene, Dataset } from '../schema/index';
import { text, paragraph, escapeXml } from '../typography/index';
import type { SceneContext } from './types';

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const reveal = (time: number, delay = 0, duration = 0.65) => {
  const p = clamp01((time - delay) / duration);
  return 1 - Math.pow(1 - p, 3);
};

/** Explicit narration beats win; otherwise distribute developments across the shot. */
export function beatTime(scene: Scene, index: number, count: number): number {
  if (scene.beats[index]) return scene.beats[index].at;
  const duration = scene.end - scene.start;
  if (scene.beats.length) {
    const last = Math.max(...scene.beats.map((beat) => beat.at));
    const lastStart = Math.max(last, duration - Math.min(0.8, duration * 0.2));
    const remaining = Math.max(1, count - scene.beats.length);
    return last + ((index - scene.beats.length + 1) / remaining) * (lastStart - last);
  }
  return Math.min(0.25, duration * 0.06) + (index / Math.max(1, count - 1)) * duration * 0.68;
}
/** Short shots and late authored beats must still settle before their outgoing cut. */
export function beatReveal(
  scene: Scene,
  time: number,
  index: number,
  count: number,
  duration = 0.65,
): number {
  const delay = beatTime(scene, index, count);
  return reveal(
    time,
    delay,
    Math.max(0.001, Math.min(duration, (scene.end - scene.start - delay) * 0.9)),
  );
}
export function layout(ctx: SceneContext) {
  const { width: w, height: h, theme } = ctx,
    vertical = h > w,
    s = Math.min(w, h) / 1080;
  const pad = Math.max(w * theme.safe, 52 * s);
  return {
    w,
    h,
    s,
    pad,
    vertical,
    x: pad,
    y: vertical ? h * 0.265 : h * 0.285,
    width: w - pad * 2,
    height: vertical ? h * 0.59 : h * 0.565,
  };
}
export function getDataset(id: string, ctx: SceneContext): Dataset {
  const dataset = ctx.project.datasets.find((d) => d.id === id);
  if (!dataset) throw new Error(`Scene references missing dataset: ${id}`);
  return dataset;
}
export function palette(ctx: SceneContext): string[] {
  return [ctx.theme.accent, ctx.theme.secondary, ctx.theme.danger, ctx.theme.text, ctx.theme.muted];
}
export function header(scene: Scene, ctx: SceneContext): string {
  const { w, h, s, pad, vertical } = layout(ctx),
    t = ctx.theme;
  const title = vertical ? (scene.vertical?.title ?? scene.title) : scene.title;
  const subtitle = vertical ? (scene.vertical?.subtitle ?? scene.subtitle) : scene.subtitle;
  const hidden = vertical ? (scene.vertical?.hidden ?? []) : [];
  const p = reveal(ctx.localTime, 0, 0.45);
  const chapter = String(ctx.project.scenes.findIndex((s) => s.id === scene.id) + 1).padStart(
    2,
    '0',
  );
  const titleSize = vertical ? 88 * s : 88 * s;
  const titleLines = vertical ? 3 : 2;
  return (
    `<g transform="translate(0 ${(1 - p) * 12 * s})">` +
    `<rect x="${pad}" y="${pad + 4 * s}" width="${30 * s}" height="${5 * s}" fill="${t.accent}"/>` +
    text(`${chapter}  /  ${scene.kicker ?? scene.mode}`, {
      x: pad + 48 * s,
      y: pad + 22 * s,
      size: 18 * s,
      width: w - pad * 2 - 320 * s,
      font: t.fontMono,
      fill: t.accent,
      tracking: 1.2 * s,
    }) +
    text('ŚWIADEK DZIEJÓW', {
      x: w - pad,
      y: pad + 22 * s,
      size: 18 * s,
      width: 245 * s,
      font: t.fontBody,
      fill: t.muted,
      anchor: 'end',
      tracking: 2 * s,
    }) +
    paragraph(title, {
      x: pad,
      y: pad + (vertical ? 140 : 124) * s,
      size: titleSize,
      width: w - 2 * pad,
      font: t.fontDisplay,
      fill: t.text,
      weight: 600,
      maxLines: titleLines,
      lineHeight: 1.0,
    }) +
    (subtitle && !hidden.includes('subtitle')
      ? paragraph(subtitle, {
          x: pad,
          y: vertical ? h * 0.235 : h * 0.247,
          size: vertical ? 25 * s : 23 * s,
          width: w - pad * 2,
          font: t.fontBody,
          fill: t.muted,
          maxLines: 2,
          lineHeight: 1.12,
        })
      : '') +
    '</g>'
  );
}
export function footer(scene: Scene, ctx: SceneContext): string {
  const { w, h, s, pad } = layout(ctx),
    t = ctx.theme;
  const sources = scene.sourceIds.map(
    (id) => ctx.project.sources.find((source) => source.id === id)?.publisher ?? id,
  );
  const labels = [...new Set(sources)].join(' · ');
  const status = scene.claimIds
    .map((id) => ctx.project.claims.find((c) => c.id === id)?.status)
    .filter(Boolean);
  if ('dataset' in scene) status.push(getDataset(scene.dataset, ctx).status);
  const qualifier = status.includes('illustrative')
    ? 'SCHEMAT ILUSTRACYJNY'
    : status.includes('political-claim')
      ? 'DEKLARACJA POLITYCZNA'
      : status.includes('estimate')
        ? 'SZACUNEK'
        : '';
  const line = labels ? `ŹRÓDŁA: ${labels}${qualifier ? '   /   ' + qualifier : ''}` : qualifier;
  return (
    `<path d="M${pad},${h - pad - 31 * s}H${w - pad}" stroke="${t.grid}" stroke-width="${s}"/>` +
    text(line, {
      x: pad,
      y: h - pad,
      size: 18 * s,
      width: w - pad * 2 - 80 * s,
      font: t.fontBody,
      fill: t.muted,
    }) +
    text(
      `${String(ctx.project.scenes.indexOf(scene) + 1).padStart(2, '0')} / ${String(ctx.project.scenes.length).padStart(2, '0')}`,
      {
        x: w - pad,
        y: h - pad,
        size: 15 * s,
        width: 76 * s,
        font: t.fontMono,
        fill: t.muted,
        anchor: 'end',
      },
    )
  );
}
export const image = (
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extra = '',
) =>
  `<image href="${escapeXml(url)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" ${extra}/>`;
export const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  extra = '',
) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  extra = '',
) =>
  `<rect x="${x}" y="${y}" width="${Math.max(0, width)}" height="${Math.max(0, height)}" fill="${color}" ${extra}/>`;
/**
 * Deterministic finishing surface for the chronicle art direction.
 * Avoids animated noise, fake scratches and evidence-altering filters.
 */
export function chronicleSurface(scene: Scene, ctx: SceneContext): string {
  if (ctx.project.theme !== 'chronicle') return '';
  const light = scene.tone === 'paper',
    t = ctx.theme,
    grainId = `chronicle-grain-${scene.id}`,
    vignetteId = `chronicle-vignette-${scene.id}`,
    grainColor = light ? t.ink : t.text,
    edgeColor = light ? t.ink : '#000000',
    grainOpacity = Math.max(0, Math.min(0.08, t.grain)),
    vignetteOpacity = Math.max(0, Math.min(0.25, t.vignette));
  return (
    `<defs><pattern id="${grainId}" width="64" height="64" patternUnits="userSpaceOnUse">` +
    `<circle cx="7" cy="11" r=".75" fill="${grainColor}"/><circle cx="39" cy="18" r=".55" fill="${grainColor}"/>` +
    `<circle cx="21" cy="47" r=".65" fill="${grainColor}"/><circle cx="57" cy="53" r=".45" fill="${grainColor}"/>` +
    `<path d="M4 33h9M46 38h6M29 5h5" stroke="${grainColor}" stroke-width=".45"/>` +
    `</pattern><radialGradient id="${vignetteId}" cx="50%" cy="48%" r="72%">` +
    `<stop offset="54%" stop-color="${edgeColor}" stop-opacity="0"/><stop offset="100%" stop-color="${edgeColor}" stop-opacity="1"/>` +
    `</radialGradient></defs>` +
    `<g data-qa-ignore="true" pointer-events="none"><rect width="${ctx.width}" height="${ctx.height}" fill="url(#${grainId})" opacity="${grainOpacity}"/>` +
    `<rect width="${ctx.width}" height="${ctx.height}" fill="url(#${vignetteId})" opacity="${vignetteOpacity}"/></g>`
  );
}

export function contentLabel(
  value: string,
  x: number,
  y: number,
  width: number,
  ctx: SceneContext,
  size = 25,
): string {
  return text(value, {
    x,
    y,
    width,
    size: size * layout(ctx).s,
    font: ctx.theme.fontBody,
    fill: ctx.theme.text,
  });
}
