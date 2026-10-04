import type { Scene } from '../schema/index';
import type { SceneContext } from '../scenes/types';
import { chartRect, lineProgress } from '../scenes/data';
import { mapFrame } from '../scenes/mechanisms';
import { beatReveal, clamp01, getDataset, layout } from '../scenes/shared';
import {
  barGeometry,
  groupSeries,
  lineGeometry,
  polyline,
  scale,
  type Rect,
} from '../charts/index';
import { greatCircle } from '../maps/index';
import { sceneTheme } from '../theme/index';

type Point = [number, number];
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (p: number) => p * p * (3 - 2 * p);

/** Arc-length resampling makes route and data-line point counts independent. */
export function resamplePath(points: readonly Point[], count = 48): Point[] {
  if (points.length === 0) throw new Error('Cannot resample an empty path');
  if (count < 2) throw new Error('A resampled path requires at least two points');
  if (points.length === 1) return Array.from({ length: count }, () => [...points[0]] as Point);
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  const total = lengths.at(-1)!;
  if (total === 0) return Array.from({ length: count }, () => [...points[0]] as Point);
  return Array.from({ length: count }, (_, i) => {
    const distance = (total * i) / (count - 1);
    let segment = 1;
    while (segment < lengths.length - 1 && lengths[segment] < distance) segment++;
    const p = (distance - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1] || 1);
    return [
      mix(points[segment - 1][0], points[segment][0], p),
      mix(points[segment - 1][1], points[segment][1], p),
    ] as Point;
  });
}
export function morphPath(
  from: readonly Point[],
  to: readonly Point[],
  p: number,
  count = 48,
): Point[] {
  const a = resamplePath(from, count),
    b = resamplePath(to, count),
    phase = clamp01(p);
  return a.map((point, i) => [mix(point[0], b[i][0], phase), mix(point[1], b[i][1], phase)]);
}
function sourceLine(scene: Scene, ctx: SceneContext): Point[] | undefined {
  if (scene.type === 'line-chart') {
    const dataset = getDataset(scene.dataset, ctx),
      rect = chartRect(ctx),
      geometry = lineGeometry(dataset, rect, scene.yDomain),
      // Follow one actual series. Joining the last point of one series to the first
      // of another would manufacture a line the chart itself never draws.
      points = groupSeries(dataset)[0].points.map((point): Point => [
        scale(point.x, geometry.xDomain, rect.x, rect.x + rect.width),
        scale(point.y, geometry.yDomain, rect.y + rect.height, rect.y),
      ]);
    const boundary = rect.x + rect.width * lineProgress(scene, ctx.localTime),
      partial: Point[] = [points[0]];
    if (boundary <= points[0][0]) return [points[0], points[0]];
    for (let i = 1; i < points.length; i++) {
      if (points[i][0] <= boundary) partial.push(points[i]);
      else {
        const ratio = (boundary - points[i - 1][0]) / (points[i][0] - points[i - 1][0] || 1);
        partial.push([boundary, mix(points[i - 1][1], points[i][1], ratio)]);
        break;
      }
    }
    return partial;
  }
  if (scene.type === 'geo-flow' && scene.routes.length) {
    const f = mapFrame(scene, ctx),
      points = scene.routes[0].points;
    // d3's geographic route follows great-circle arcs between supplied waypoints.
    // Densify those arcs, rather than substituting straight projected shortcuts.
    const geographic = points
      .slice(1)
      .flatMap((point, i) => greatCircle(points[i], point, 25).slice(i === 0 ? 0 : 1));
    return geographic.map((p) => {
      const v = f.map.project(p);
      return [v[0] + f.x, v[1] + f.y] as Point;
    });
  }
  return undefined;
}
function dataRects(scene: Scene, ctx: SceneContext): Rect[] | undefined {
  if (scene.type === 'bar-chart') {
    const data = getDataset(scene.dataset, ctx),
      geometry = barGeometry(data, chartRect(ctx));
    return geometry.rects.map((rect, i) => {
      const p = beatReveal(scene, ctx.localTime, i, data.points.length, 0.75);
      return {
        ...rect,
        y: data.points[i].y >= 0 ? geometry.zero - rect.height * p : geometry.zero,
        height: rect.height * p,
      };
    });
  }
  if (scene.type === 'breakdown') {
    const data = getDataset(scene.dataset, ctx),
      { x, y, width: w, height: h, s, vertical } = layout(ctx),
      sum = data.points.reduce((acc, p) => acc + p.y, 0);
    let cursor = 0;
    return data.points.map((point, i) => {
      const ratio = point.y / sum,
        offset = cursor,
        p = beatReveal(scene, ctx.localTime, i, data.points.length, 0.65);
      cursor += ratio;
      return vertical || scene.orientation === 'vertical'
        ? {
            x,
            y: y + 95 * s + offset * (h - 155 * s),
            width: w * 0.23,
            height: ratio * (h - 155 * s) * p,
          }
        : { x: x + offset * w, y: y + 95 * s, width: ratio * w * p, height: (h - 155 * s) * 0.39 };
    });
  }
  return undefined;
}

/** Include every original corner in the correspondence, so endpoint paths retain
 * the supplied geometry instead of cutting across bends during resampling. */
function cornerPreservingMorph(from: Point[], to: Point[], p: number): Point[] {
  const measure = (points: Point[]) => {
    const distances = [0];
    for (let i = 1; i < points.length; i++)
      distances.push(
        distances[i - 1] +
          Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
      );
    const total = distances.at(-1)!;
    return { points, fractions: distances.map((distance) => (total ? distance / total : 0)) };
  };
  const a = measure(from),
    b = measure(to);
  const knots = [...new Set([0, 1, ...a.fractions, ...b.fractions])].sort((x, y) => x - y);
  const at = (path: ReturnType<typeof measure>, fraction: number): Point => {
    let i = 1;
    while (i < path.points.length - 1 && path.fractions[i] < fraction) i++;
    if (path.points.length === 1 || path.fractions.at(-1) === 0) return path.points[0];
    const q = clamp01(
      (fraction - path.fractions[i - 1]) / (path.fractions[i] - path.fractions[i - 1] || 1),
    );
    return [
      mix(path.points[i - 1][0], path.points[i][0], q),
      mix(path.points[i - 1][1], path.points[i][1], q),
    ];
  };
  return knots.map((knot) => {
    const first = at(a, knot),
      last = at(b, knot);
    return [mix(first[0], last[0], p), mix(first[1], last[1], p)];
  });
}

function mixColor(from: string, to: string, p: number): string {
  if (!/^#[\da-f]{6}$/i.test(from) || !/^#[\da-f]{6}$/i.test(to)) return p < 0.5 ? from : to;
  const channels = [1, 3, 5].map((i) =>
    Math.round(mix(parseInt(from.slice(i, i + 2), 16), parseInt(to.slice(i, i + 2), 16), p)),
  );
  return `rgb(${channels.join(',')})`;
}

function removeAnchors(markup: string, all = false): string {
  // The selected route's contrast casing must leave with its center stroke.
  markup = markup.replace(/<path\b[^>]*\bdata-route-halo="true"[^>]*\/>/, '');
  const pattern =
    /<(?:path|rect)\b[^>]*\bdata-anchor="(?:geo-route|data-line|data-bar|data-layer)"[^>]*\/>/g;
  if (all) return markup.replace(pattern, '');
  // A map can carry several routes; only the first is selected by sourceLine.
  const first = pattern.exec(markup);
  return first
    ? markup.slice(0, first.index) + markup.slice(first.index + first[0].length)
    : markup;
}

/**
 * Every transition has exact endpoints. The bridge carries a supplied primitive;
 * it is editorial continuity, never a claim that geographic distance equals price.
 */
export function transitionFrame(
  previousMarkup: string,
  currentMarkup: string,
  previous: Scene,
  current: Scene,
  progress: number,
  ctx: SceneContext,
): string {
  const p = clamp01(progress),
    transition = current.transition;
  if (!transition || transition.type === 'cut' || p >= 1) return currentMarkup;
  if (p <= 0) return previousMarkup;
  const q = ease(p),
    [nx, ny] = transition.anchor,
    ax = nx * ctx.width,
    ay = ny * ctx.height;
  const oldTheme = sceneTheme(ctx.theme, previous.tone),
    newTheme = sceneTheme(ctx.theme, current.tone),
    previousTime = Math.max(0, previous.end - previous.start - 1 / ctx.project.fps),
    oldContext = {
      ...ctx,
      theme: oldTheme,
      time: previous.start + previousTime,
      localTime: previousTime,
    },
    newContext = { ...ctx, theme: newTheme },
    prefix = `transition-${previous.id}-${current.id}`;
  const content = layout(ctx);
  const aperture = (before: string, after: string, width: number, height: number): string => {
    const x = ax * (1 - width),
      y = ay * (1 - height);
    const bottom = content.y + content.height,
      top = Math.max(content.y, y),
      revealBottom = Math.min(bottom, y + ctx.height * height),
      chromeBands = `<rect width="${ctx.width}" height="${content.y}"/><rect y="${bottom}" width="${ctx.width}" height="${ctx.height - bottom}"/>`,
      incomingPlane =
        current.type === 'custom' || !after
          ? `<rect width="${ctx.width}" height="${ctx.height}" fill="${newTheme.background}"/>`
          : '';
    // The aperture operates on artwork. Header and source bands change as whole
    // units: clipping through two titles creates an accidental combined sentence.
    // Reusing the original markup also preserves any authored camera transform.
    return (
      `<defs><clipPath id="${prefix}-incoming"><rect x="${x}" y="${top}" width="${ctx.width * width}" height="${Math.max(0, revealBottom - top)}"/>${p >= 0.5 ? chromeBands : ''}</clipPath></defs>` +
      `<g data-qa-ignore="true"><rect width="${ctx.width}" height="${ctx.height}" fill="${oldTheme.background}"/>${before}</g>` +
      `<g data-qa-ignore="true" clip-path="url(#${prefix}-incoming)">${incomingPlane}${after}</g>`
    );
  };
  const bridgeClip = `<defs><clipPath id="${prefix}-content"><rect x="${content.x}" y="${content.y}" width="${content.width}" height="${content.height}"/></clipPath></defs>`;
  if (transition.type === 'route-to-line') {
    const from = sourceLine(previous, oldContext),
      to = sourceLine(current, newContext);
    if (!from || !to)
      throw new Error(
        `route-to-line requires geo-flow or line-chart scenes: ${previous.id} → ${current.id}`,
      );
    const phase = ease(clamp01((p - 0.08) / 0.8)),
      path = polyline(cornerPreservingMorph(from, to, phase)),
      previousWidth = previous.type === 'geo-flow' ? 2 + previous.routes[0].strength * 5 : 5,
      currentWidth = current.type === 'geo-flow' ? 2 + current.routes[0].strength * 5 : 5;
    return (
      aperture(
        removeAnchors(previousMarkup),
        removeAnchors(currentMarkup),
        ease(clamp01(p / 0.8)),
        1,
      ) +
      bridgeClip +
      `<g clip-path="url(#${prefix}-content)"><path data-transition-bridge="route" d="${path}" fill="none" stroke="${mixColor(oldTheme.accent, newTheme.accent, phase)}" stroke-width="${mix(previousWidth, currentWidth, phase) * content.s}" stroke-linecap="round" stroke-linejoin="round"/></g>`
    );
  }
  if (transition.type === 'bar-to-layer') {
    const from = dataRects(previous, oldContext),
      to = dataRects(current, newContext);
    if (!from || !to || from.length !== to.length)
      throw new Error(
        `bar-to-layer requires bar-chart/breakdown scenes with equal data item counts: ${previous.id} → ${current.id}`,
      );
    const oldColors = [
        oldTheme.accent,
        oldTheme.secondary,
        oldTheme.danger,
        oldTheme.text,
        oldTheme.muted,
      ],
      newColors = [
        newTheme.accent,
        newTheme.secondary,
        newTheme.danger,
        newTheme.text,
        newTheme.muted,
      ];
    return (
      aperture(removeAnchors(previousMarkup, true), removeAnchors(currentMarkup, true), q, 1) +
      bridgeClip +
      `<g data-transition-bridge="bars" clip-path="url(#${prefix}-content)">` +
      from
        .map(
          (rect, i) =>
            `<rect x="${mix(rect.x, to[i].x, q)}" y="${mix(rect.y, to[i].y, q)}" width="${mix(rect.width, to[i].width, q)}" height="${mix(rect.height, to[i].height, q)}" fill="${mixColor(oldColors[i % oldColors.length], newColors[i % newColors.length], q)}"/>`,
        )
        .join('') +
      '</g>'
    );
  }
  if (transition.type === 'focus-through') {
    // Open the next evidence plane from the authored point of attention. Width
    // leads height slightly, like moving from a highlighted phrase to its page.
    return aperture(
      previousMarkup,
      currentMarkup,
      ease(clamp01(p / 0.82)),
      ease(clamp01((p - 0.03) / 0.93)),
    );
  }
  // The focal axis stays fixed as the incoming composition takes over. No zoomed
  // text, lowered scene opacity, or empty pause between shots.
  return aperture(previousMarkup, currentMarkup, q, 1);
}
