import type { SceneOf } from '../schema/index';
import {
  barGeometry,
  formatNumber,
  groupSeries,
  lineGeometry,
  polyline,
  ticks,
  scale,
} from '../charts/index';
import { paragraph, text } from '../typography/index';
import type { SceneContext } from './types';
import { beatReveal, clamp01, getDataset, layout, palette, rect, reveal, line } from './shared';

export function statistic(scene: SceneOf<'statistic'>, ctx: SceneContext): string {
  const l = layout(ctx),
    { x, y, width: w, height: h, s, vertical } = l,
    t = ctx.theme;
  const p = reveal(ctx.localTime, 0.16, Math.min(1.2, (scene.end - scene.start) * 0.45));
  const value = formatNumber(
    scene.from + (scene.value - scene.from) * p,
    scene.decimals,
    ctx.project.language,
  );
  if (scene.variant === 'pump') {
    const heroWidth = vertical ? w : w * 0.65,
      baseline = y + h * (vertical ? 0.29 : 0.53),
      pumpScale = Math.min((vertical ? h * 0.39 : h * 0.81) / 490, (w * 0.31) / 370),
      px = vertical ? x + w * 0.38 : x + w * 0.76,
      py = vertical ? y + h * 0.57 : y + h * 0.025,
      enter = reveal(ctx.localTime, 0.08, 0.85),
      pumpId = `pump-finish-${scene.id}`;
    return (
      `<defs><linearGradient id="${pumpId}" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${t.paper}"/><stop offset=".8" stop-color="${t.paper}"/><stop offset="1" stop-color="${t.secondary}"/></linearGradient></defs>` +
      `<g transform="translate(0 ${(1 - enter) * 24 * s})">` +
      text('CENA / LITR', {
        x: x + 5 * s,
        y: y + 42 * s,
        size: 22 * s,
        width: heroWidth,
        font: t.fontBody,
        fill: t.secondary,
        tracking: 3 * s,
      }) +
      text(value, {
        x: x - 6 * s,
        y: baseline,
        size: vertical ? 285 * s : 370 * s,
        width: heroWidth * 0.89,
        font: t.fontDisplay,
        fill: t.paper,
        weight: 600,
        tracking: -9 * s,
      }) +
      text(scene.unit, {
        x: x + 6 * s,
        y: baseline + 68 * s,
        size: 46 * s,
        width: heroWidth,
        font: t.fontBody,
        fill: t.accent,
      }) +
      line(x, baseline + 102 * s, x + heroWidth * 0.87, baseline + 102 * s, t.grid, 2 * s) +
      paragraph(scene.label, {
        x: x + 5 * s,
        y: baseline + 148 * s,
        size: 23 * s,
        width: heroWidth * 0.94,
        font: t.fontBody,
        fill: t.muted,
        maxLines: 2,
      }) +
      `<g transform="translate(${px + (1 - enter) * 35 * s} ${py}) scale(${pumpScale})" opacity="${enter}">` +
      `<ellipse cx="118" cy="495" rx="179" ry="15" fill="#000000" opacity=".22"/>` +
      `<path d="M203 88H233L275 130V362Q275 415 319 415Q355 415 355 371V194" fill="none" stroke="${t.ink}" stroke-width="24" stroke-linecap="round"/>` +
      `<path d="M203 88H233L275 130V362Q275 415 319 415Q355 415 355 371V194" fill="none" stroke="${t.muted}" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M-10 20Q-10 0 12 0H188Q210 0 210 20V473H-10Z" fill="url(#${pumpId})"/>` +
      `<path d="M210 20L235 43V473H210Z" fill="${t.secondary}"/>` +
      `<path d="M-10 20Q-10 0 12 0H188Q210 0 210 20V49H-10Z" fill="${t.accent}"/>` +
      `<rect x="12" y="76" width="175" height="106" rx="4" fill="${t.ink}"/>` +
      `<rect x="25" y="92" width="147" height="49" rx="2" fill="${t.secondary}"/>` +
      text(value, {
        x: 163,
        y: 131,
        size: 43,
        width: 125,
        font: t.fontDisplay,
        fill: t.ink,
        anchor: 'end',
        weight: 600,
      }) +
      `<path d="M35 161H86M143 161H164" stroke="${t.muted}" stroke-width="4"/>` +
      `<path d="M92 240C84 257 65 276 65 294A29 29 0 0 0 123 294C123 276 105 257 96 240Z" fill="${t.accent}"/>` +
      `<path d="M44 376H158M44 388H158M44 400H158" stroke="${t.ink}" stroke-opacity=".2" stroke-width="3"/>` +
      `<path d="M-22 473H239V493H-22Z" fill="${t.accent}"/>` +
      `<path d="M337 157L361 171V220H339L328 192L312 174L285 166L293 150L318 155L331 173H343V184H350V175L328 162Z" fill="${t.accent}" stroke="${t.ink}" stroke-width="4" stroke-linejoin="round"/>` +
      '</g>' +
      '</g>'
    );
  }
  const isPercent = scene.variant === 'split' && scene.unit.trim() === '%';
  const baseline = y + h * (vertical ? 0.36 : 0.48);
  const headline = text(value, {
    x,
    y: baseline,
    size: vertical ? 230 * s : 285 * s,
    width: w * (vertical ? 0.95 : 0.7),
    font: t.fontDisplay,
    fill: t.accent,
    weight: 600,
  });
  return (
    headline +
    text(scene.unit, {
      x: x + w * (vertical ? 0.02 : 0.76),
      y: vertical ? baseline + 80 * s : baseline,
      size: vertical ? 52 * s : 65 * s,
      width: w * (vertical ? 0.95 : 0.24),
      font: t.fontDisplay,
      fill: t.text,
    }) +
    paragraph(scene.label, {
      x,
      y: y + h * (vertical ? 0.66 : 0.73),
      size: vertical ? 47 * s : 44 * s,
      width: w * 0.85,
      font: t.fontBody,
      fill: t.text,
      maxLines: 2,
    }) +
    (isPercent
      ? rect(x, y + h * 0.9, w, 12 * s, t.grid) +
        rect(x, y + h * 0.9, w * Math.max(0, Math.min(1, scene.value / 100)) * p, 12 * s, t.accent)
      : line(x, y + h * 0.92, x + w * p, y + h * 0.92, t.grid, 2 * s))
  );
}

export function chartRect(ctx: SceneContext) {
  const { x, y, width: w, height: h, s } = layout(ctx);
  return { x: x + 88 * s, y: y + 35 * s, width: w - 118 * s, height: h - 140 * s };
}

/** The last authored beat completes the trace; otherwise reserve a final reading hold. */
export function lineProgress(scene: SceneOf<'line-chart'>, localTime: number): number {
  const finish = scene.beats.at(-1)?.at ?? (scene.end - scene.start) * 0.78;
  return clamp01((localTime - 0.08) / Math.max(0.01, finish - 0.08));
}

export function lineChart(scene: SceneOf<'line-chart'>, ctx: SceneContext): string {
  const data = getDataset(scene.dataset, ctx),
    r = chartRect(ctx),
    t = ctx.theme,
    { s, x, y, width: w, height: h } = layout(ctx),
    colors = palette(ctx);
  const g = lineGeometry(data, r, scene.yDomain),
    p = lineProgress(scene, ctx.localTime);
  const chartId = `plot-${scene.id}`,
    areaId = `plot-wash-${scene.id}`;
  let svg = `<defs><clipPath id="${chartId}">${rect(r.x - 9 * s, r.y - 9 * s, (r.width + 18 * s) * p, r.height + 18 * s, 'white')}</clipPath><linearGradient id="${areaId}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${t.accent}" stop-opacity=".2"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient></defs>`;
  svg += ticks(g.yDomain)
    .map((tick) => {
      const py = scale(tick, g.yDomain, r.y + r.height, r.y);
      return (
        line(r.x, py, r.x + r.width, py, t.grid, s, 'stroke-dasharray="3 8"') +
        text(formatNumber(tick, Number.isInteger(tick) ? 0 : 2), {
          x: r.x - 17 * s,
          y: py + 7 * s,
          size: 23 * s,
          width: 75 * s,
          font: t.fontBody,
          fill: t.muted,
          anchor: 'end',
        })
      );
    })
    .join('');
  const xPoints = [...new Map(data.points.map((point) => [point.x, point])).values()].sort(
    (a, b) => a.x - b.x,
  );
  const stride = Math.max(1, Math.ceil(xPoints.length / (ctx.height > ctx.width ? 4 : 7)));
  svg += xPoints
    .map((point, i) =>
      i % stride === 0 || i === xPoints.length - 1
        ? text(point.label ?? formatNumber(point.x, 0), {
            x: scale(point.x, g.xDomain, r.x, r.x + r.width),
            y: r.y + r.height + 40 * s,
            size: 25 * s,
            width: (r.width / Math.min(xPoints.length, 7)) * 0.9,
            font: t.fontBody,
            fill: t.text,
            anchor: i === 0 ? 'start' : i === xPoints.length - 1 ? 'end' : 'middle',
          })
        : '',
    )
    .join('');
  const series = groupSeries(data);
  svg += line(r.x, r.y + r.height, r.x + r.width, r.y + r.height, t.muted, 1.5 * s);
  svg +=
    `<g clip-path="url(#${chartId})">` +
    series
      .map((seriesData, index) => {
        const coordinates = seriesData.points.map(
          (point) =>
            [
              scale(point.x, g.xDomain, r.x, r.x + r.width),
              scale(point.y, g.yDomain, r.y + r.height, r.y),
            ] as [number, number],
        );
        const path = polyline(coordinates),
          color = colors[index % colors.length];
        const area =
          path +
          ` L${coordinates.at(-1)![0]},${r.y + r.height}L${coordinates[0][0]},${r.y + r.height}Z`;
        return (
          (series.length === 1 ? `<path d="${area}" fill="url(#${areaId})"/>` : '') +
          `<path data-anchor="data-line" d="${path}" fill="none" stroke="${color}" stroke-width="${6 * s}" stroke-linecap="round" stroke-linejoin="round"/>` +
          coordinates
            .map(
              (point) =>
                `<circle cx="${point[0]}" cy="${point[1]}" r="${7 * s}" fill="${t.background}" stroke="${color}" stroke-width="${4 * s}"/>`,
            )
            .join('')
        );
      })
      .join('') +
    '</g>';
  // Values enter only after their own observation is reached; no future labels leak through the trace.
  if (series.length === 1 && data.points.length <= (ctx.height > ctx.width ? 5 : 9)) {
    svg += data.points
      .map((point, index) => {
        if (index === scene.annotation?.index) return '';
        const [px, py] = g.points[index],
          visible = p >= 1 || (p > 0 && px < r.x + r.width * p),
          edge = index === 0 ? 'start' : index === data.points.length - 1 ? 'end' : 'middle';
        return text(formatNumber(point.y, 2), {
          x: px,
          y: Math.max(r.y + 30 * s, py - 25 * s),
          size: 31 * s,
          width: r.width / Math.max(3, data.points.length),
          font: t.fontDisplay,
          fill: t.text,
          anchor: edge,
          opacity: visible ? 1 : 0,
        });
      })
      .join('');
  }
  svg += text(scene.yLabel, {
    x,
    y: y - 6 * s,
    size: 22 * s,
    width: w * 0.5,
    font: t.fontBody,
    fill: t.text,
  });
  svg += text(scene.xLabel, {
    x: r.x + r.width,
    y: y + h - 12 * s,
    size: 20 * s,
    width: series.length > 1 ? r.width * 0.45 : r.width,
    font: t.fontBody,
    fill: t.muted,
    anchor: 'end',
  });
  if (series.length > 1)
    svg += series
      .map((d, i) =>
        text(d.title, {
          x: r.x + ((r.width * 0.52) / series.length) * i,
          y: y + h - 12 * s,
          size: 19 * s,
          width: ((r.width * 0.52) / series.length) * 0.85,
          font: t.fontBody,
          fill: colors[i % colors.length],
        }),
      )
      .join('');
  if (scene.annotation && g.points[scene.annotation.index]) {
    const [px, py] = g.points[scene.annotation.index],
      finish = scene.beats.at(-1)?.at ?? (scene.end - scene.start) * 0.78,
      pointTime = 0.08 + ((px - r.x) / r.width) * Math.max(0.01, finish - 0.08),
      a = reveal(
        ctx.localTime,
        Math.max(pointTime, scene.beats[1]?.at ?? (scene.end - scene.start) * 0.57),
        0.4,
      ),
      right = px < r.x + r.width * 0.65;
    const labelY = Math.min(r.y + r.height - 65 * s, Math.max(r.y + 36 * s, py - 52 * s));
    const labelX = right
      ? Math.min(px + 24 * s, r.x + r.width * 0.6)
      : Math.max(px - 24 * s, r.x + r.width * 0.4);
    svg +=
      `<g data-chart-annotation="true" opacity="${a}">` +
      `<circle cx="${px}" cy="${py}" r="${12 * s}" fill="${t.background}" stroke="${t.accent}" stroke-width="${3 * s}"/>` +
      `<circle cx="${px}" cy="${py}" r="${5 * s}" fill="${t.accent}"/>` +
      line(px, py - 16 * s, px, labelY + 12 * s, t.accent, 1.5 * s) +
      text(scene.annotation.text, {
        x: labelX,
        y: labelY,
        size: 40 * s,
        width: r.width * 0.4,
        font: t.fontDisplay,
        weight: 600,
        fill: t.accent,
        anchor: right ? 'start' : 'end',
      }) +
      '</g>';
  }
  return svg;
}

export function barChart(scene: SceneOf<'bar-chart'>, ctx: SceneContext): string {
  const data = getDataset(scene.dataset, ctx),
    r = chartRect(ctx),
    g = barGeometry(data, r),
    t = ctx.theme,
    { s, x, y, width: w, height: h } = layout(ctx),
    colors = palette(ctx);
  let svg = ticks(g.domain)
    .map((tick) => {
      const py = scale(tick, g.domain, r.y + r.height, r.y);
      return (
        line(r.x, py, r.x + r.width, py, t.grid, s) +
        text(formatNumber(tick, Number.isInteger(tick) ? 0 : 2), {
          x: r.x - 17 * s,
          y: py + 7 * s,
          size: 20 * s,
          width: 75 * s,
          font: t.fontMono,
          fill: t.muted,
          anchor: 'end',
        })
      );
    })
    .join('');
  svg += g.rects
    .map((bar, i) => {
      const p = beatReveal(scene, ctx.localTime, i, data.points.length, 0.75),
        positive = data.points[i].y >= 0;
      return (
        rect(
          bar.x,
          positive ? g.zero - bar.height * p : g.zero,
          bar.width,
          bar.height * p,
          colors[i % colors.length],
          'data-anchor="data-bar"',
        ) +
        text(formatNumber(data.points[i].y), {
          x: bar.x + bar.width / 2,
          y: positive ? bar.y - 16 * s : bar.y + bar.height + 27 * s,
          size: 29 * s,
          width: bar.width + 15 * s,
          font: t.fontDisplay,
          fill: t.text,
          anchor: 'middle',
          opacity: p,
        }) +
        paragraph(data.points[i].label ?? formatNumber(data.points[i].x, 0), {
          x: bar.x + bar.width / 2,
          y: r.y + r.height + 44 * s,
          size: 22 * s,
          width: (r.width / data.points.length) * 0.9,
          font: t.fontBody,
          fill: t.muted,
          anchor: 'middle',
          maxLines: 2,
        })
      );
    })
    .join('');
  return (
    svg +
    text(scene.yLabel, {
      x,
      y: y - 6 * s,
      size: 21 * s,
      width: w * 0.5,
      font: t.fontBody,
      fill: t.muted,
    }) +
    text(scene.xLabel, {
      x: r.x + r.width,
      y: y + h - 8 * s,
      size: 20 * s,
      width: r.width,
      font: t.fontBody,
      fill: t.muted,
      anchor: 'end',
    })
  );
}

export function breakdown(scene: SceneOf<'breakdown'>, ctx: SceneContext): string {
  const data = getDataset(scene.dataset, ctx),
    { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme,
    colors = palette(ctx);
  const total = data.points.reduce((sum, p) => sum + p.y, 0),
    isVertical = vertical || scene.orientation === 'vertical';
  let cursor = 0;
  const top = y + 95 * s,
    trackHeight = h - 155 * s,
    trackWidth = isVertical ? w * 0.23 : w;
  let svg =
    text(scene.totalLabel, {
      x,
      y: y + 29 * s,
      size: 32 * s,
      width: w * 0.72,
      font: t.fontBody,
      fill: t.text,
    }) +
    text(`${formatNumber(total, 2)} ${data.unit}`, {
      x: x + w,
      y: y + 32 * s,
      size: 38 * s,
      width: w * 0.3,
      font: t.fontDisplay,
      fill: t.accent,
      anchor: 'end',
    });
  svg += data.points
    .map((point, i) => {
      const part = point.y / total,
        p = beatReveal(scene, ctx.localTime, i, data.points.length, 0.65),
        offset = cursor;
      cursor += part;
      const color = colors[i % colors.length];
      if (isVertical) {
        const py = top + offset * trackHeight,
          bh = part * trackHeight;
        return (
          rect(x, py, trackWidth, bh * p, color, 'data-anchor="data-layer"') +
          line(
            x + trackWidth + 10 * s,
            py + bh / 2,
            x + trackWidth + 35 * s,
            py + bh / 2,
            color,
            2 * s,
          ) +
          text(point.label ?? String(point.x), {
            x: x + trackWidth + 50 * s,
            y: py + bh / 2 - 2 * s,
            size: 26 * s,
            width: w - trackWidth - 60 * s,
            font: t.fontBody,
            fill: t.text,
            opacity: p,
          }) +
          text(`${formatNumber(point.y, 2)} ${data.unit} · ${formatNumber(part * 100, 1)}%`, {
            x: x + trackWidth + 50 * s,
            y: py + bh / 2 + 32 * s,
            size: 23 * s,
            width: w - trackWidth - 60 * s,
            font: t.fontMono,
            fill: color,
            opacity: p,
          })
        );
      }
      const px = x + offset * w,
        bw = part * w;
      const labelX = x + (w / data.points.length) * i,
        labelY = top + trackHeight * 0.64;
      return (
        rect(px, top, bw * p, trackHeight * 0.39, color, 'data-anchor="data-layer"') +
        `<path d="M${px + bw / 2},${top + trackHeight * 0.39 + 8 * s}V${labelY - 40 * s}H${labelX + 15 * s}V${labelY - 14 * s}" stroke="${color}" stroke-width="${1.5 * s}" fill="none" opacity="${p}"/>` +
        paragraph(point.label ?? String(point.x), {
          x: labelX,
          y: labelY,
          size: 27 * s,
          width: (w / data.points.length) * 0.9,
          font: t.fontBody,
          fill: t.text,
          maxLines: 2,
          opacity: p,
        }) +
        text(`${formatNumber(point.y, 2)} ${data.unit}`, {
          x: labelX,
          y: labelY + 79 * s,
          size: 34 * s,
          width: (w / data.points.length) * 0.9,
          font: t.fontDisplay,
          fill: color,
          opacity: p,
        })
      );
    })
    .join('');
  return svg;
}

export function comparison(scene: SceneOf<'comparison'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme;
  const max = Math.max(Math.abs(scene.left.value), Math.abs(scene.right.value), 1);
  return [scene.left, scene.right]
    .map((item, i) => {
      const px = vertical ? x : x + i * w * 0.54,
        py = vertical ? y + i * h * 0.5 : y,
        bw = vertical ? w : w * 0.46,
        bh = vertical ? h * 0.45 : h;
      const p = reveal(ctx.localTime, i * 0.16, 0.85);
      return (
        text(item.label, {
          x: px,
          y: py + 40 * s,
          size: 38 * s,
          width: bw,
          font: t.fontBody,
          fill: t.text,
        }) +
        text(formatNumber(item.value * p), {
          x: px,
          y: py + bh * 0.55,
          size: Math.min(190 * s, bh * 0.42),
          width: bw,
          font: t.fontDisplay,
          fill: t.accent,
          weight: 600,
        }) +
        text(scene.unit, {
          x: px,
          y: py + bh * 0.68,
          size: 31 * s,
          width: bw,
          font: t.fontBody,
          fill: t.muted,
        }) +
        rect(px, py + bh * 0.77, bw, 7 * s, t.grid) +
        rect(px, py + bh * 0.77, ((bw * Math.abs(item.value)) / max) * p, 7 * s, t.accent) +
        (item.detail
          ? paragraph(item.detail, {
              x: px,
              y: py + bh * 0.9,
              size: 23 * s,
              width: bw,
              font: t.fontBody,
              fill: t.muted,
              maxLines: 2,
            })
          : '')
      );
    })
    .join('');
}
