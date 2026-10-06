import type { SceneOf } from '../schema/index';
import { paragraph, text } from '../typography/index';
import { mapPaths } from '../maps/index';
import type { SceneContext } from './types';
import { beatReveal, beatTime, layout, line, rect, reveal } from './shared';
import { mechanismSymbol } from './symbols';

/** Longest-path ranks produce a flow direction; cycles fall back to declared order. */
export function flowPositions(
  scene: SceneOf<'flow'>,
  ctx: SceneContext,
): Map<string, [number, number]> {
  const { x, y, width: w, height: h, vertical, s } = layout(ctx);
  const ranks = new Map(scene.nodes.map((node) => [node.id, 0]));
  let cyclic = false;
  for (let step = 0; step < scene.nodes.length; step++) {
    let changed = false;
    for (const edge of scene.edges)
      if (ranks.get(edge.to)! <= ranks.get(edge.from)!) {
        ranks.set(edge.to, ranks.get(edge.from)! + 1);
        changed = true;
      }
    if (!changed) break;
    if (step === scene.nodes.length - 1) cyclic = true;
  }
  if (cyclic) scene.nodes.forEach((node, i) => ranks.set(node.id, i));
  const maxRank = Math.max(...ranks.values()),
    positions = new Map<string, [number, number]>();
  for (const node of scene.nodes) {
    const rank = ranks.get(node.id)!,
      peers = scene.nodes.filter((n) => ranks.get(n.id) === rank),
      index = peers.indexOf(node);
    positions.set(
      node.id,
      vertical
        ? [
            x + w * 0.12 + index * w * 0.38,
            y + 45 * s + ((h - 130 * s) * rank) / Math.max(1, maxRank),
          ]
        : [
            x + (w / (maxRank + 1)) * (rank + 0.5),
            y + h * (0.34 + (0.34 * index) / Math.max(1, peers.length - 1)),
          ],
    );
  }
  return positions;
}

export function flow(scene: SceneOf<'flow'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme,
    pos = flowPositions(scene, ctx),
    max = Math.max(1, ...scene.edges.map((e) => e.value ?? 1));
  const arrow = `flow-arrow-${scene.id}`;
  let svg = `<defs><marker id="${arrow}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${t.secondary}"/></marker></defs>`;
  svg += scene.edges
    .map((edge, i) => {
      const [ax, ay] = pos.get(edge.from)!,
        [bx, by] = pos.get(edge.to)!,
        p = reveal(
          ctx.localTime,
          beatTime(scene, Math.min(i + 1, scene.nodes.length - 1), scene.nodes.length) - 0.42,
          0.68,
        );
      const nodeRadius = scene.nodes.some((n) => n.icon) ? 125 : 38;
      const path = vertical
        ? `M${ax},${ay + 36 * s}C${ax},${(ay + by) / 2} ${bx},${(ay + by) / 2} ${bx},${by - 43 * s}`
        : `M${ax + nodeRadius * s},${ay}C${(ax + bx) / 2},${ay} ${(ax + bx) / 2},${by} ${bx - (nodeRadius + 8) * s},${by}`;
      return (
        `<path d="${path}" fill="none" stroke="${t.secondary}" stroke-width="${(edge.value ? 3 + (edge.value / max) * 8 : 3) * s}" opacity="${p * 0.7}" pathLength="1" stroke-dasharray="${p} 1" marker-end="url(#${arrow})"/>` +
        (edge.label
          ? text(edge.label, {
              x: vertical ? (ax + bx) / 2 - 19 * s : (ax + bx) / 2,
              y: vertical ? (ay + by) / 2 : (ay + by) / 2 - 26 * s,
              size: 18 * s,
              width: vertical ? w * 0.17 : Math.abs(bx - ax) * 0.8,
              font: t.fontBody,
              fill: t.secondary,
              anchor: vertical ? 'end' : 'middle',
              opacity: p,
            })
          : '')
      );
    })
    .join('');
  svg += scene.nodes
    .map((node, i) => {
      const [px, py] = pos.get(node.id)!,
        p = beatReveal(scene, ctx.localTime, i, scene.nodes.length, 0.75),
        labelWidth = vertical
          ? w * 0.69
          : Math.min((w / Math.min(scene.nodes.length, 5)) * 0.9, 430 * s);
      const tx = vertical ? px + 58 * s : px,
        anchor = vertical ? 'start' : 'middle';
      return (
        `<g data-flow-node="${node.id}" opacity="${p}" transform="translate(0 ${(1 - p) * 35 * s})">` +
        (node.icon && !vertical
          ? `<g transform="translate(${px - 112 * s} ${py - 108 * s}) scale(${1.4 * s})">${mechanismSymbol(node.icon, t.text, t.accent)}</g>`
          : `<circle cx="${px}" cy="${py}" r="${34 * s}" fill="${t.background}" stroke="${t.accent}" stroke-width="${3 * s}"/>`) +
        text(String(i + 1).padStart(2, '0'), {
          x: px,
          y: node.icon && !vertical ? py - 137 * s : py + 10 * s,
          size: 25 * s,
          width: 55 * s,
          font: t.fontMono,
          fill: t.accent,
          anchor: 'middle',
        }) +
        paragraph(node.label, {
          x: tx,
          y: vertical ? py + 8 * s : py + (node.icon ? 185 : 112) * s,
          size: vertical ? 43 * s : 56 * s,
          width: labelWidth,
          font: t.fontDisplay,
          weight: 600,
          fill: t.text,
          anchor,
          maxLines: 2,
        }) +
        (node.detail
          ? paragraph(node.detail, {
              x: tx,
              y: vertical ? py + 60 * s : py + (node.icon ? 250 : 203) * s,
              size: 28 * s,
              width: labelWidth,
              font: t.fontBody,
              fill: t.muted,
              anchor,
              maxLines: 2,
            })
          : '') +
        '</g>'
      );
    })
    .join('');
  return svg + line(x, y + h - 12 * s, x + w, y + h - 12 * s, t.grid, s);
}

export function mapFrame(scene: SceneOf<'geo-flow'>, ctx: SceneContext) {
  const l = layout(ctx),
    atlas = scene.composition === 'atlas';
  const x = atlas && !l.vertical ? l.x + l.width * 0.3 : l.x;
  const y = l.y,
    width = atlas && !l.vertical ? l.width * 0.7 : l.width;
  const height = atlas && l.vertical ? l.height * 0.69 : l.height;
  const p = reveal(ctx.localTime, 0.05, Math.min(1.25, (scene.end - scene.start) * 0.36));
  const geometry = ctx.geometry[scene.asset];
  if (!geometry) throw new Error(`Missing prepared geometry for map asset: ${scene.asset}`);
  const center: [number, number] = [
    scene.center[0] + ((scene.fromCenter ?? scene.center)[0] - scene.center[0]) * (1 - p),
    scene.center[1] + ((scene.fromCenter ?? scene.center)[1] - scene.center[1]) * (1 - p),
  ];
  const zoom = Math.exp(
    Math.log(scene.fromZoom ?? scene.zoom) * (1 - p) + Math.log(scene.zoom) * p,
  );
  return {
    x,
    y,
    width,
    height,
    center,
    zoom,
    map: mapPaths(geometry, { width, height, center, zoom, projection: scene.projection }),
  };
}

export function geoFlow(scene: SceneOf<'geo-flow'>, ctx: SceneContext): string {
  const f = mapFrame(scene, ctx),
    { x, y, width: w, height: h, map } = f;
  const l = layout(ctx),
    { s, vertical } = l,
    t = ctx.theme,
    atlas = scene.composition === 'atlas',
    chronicle = ctx.project.theme === 'chronicle';
  const clip = `map-${scene.id}`,
    land = atlas ? (chronicle ? '#d8ccae' : '#ded6bd') : t.panel;
  const water = atlas ? (chronicle ? '#aebfc0' : '#b9d4d6') : '#152c36',
    ink = atlas ? (chronicle ? '#2d302a' : '#28464c') : t.text;
  const routeColor = atlas ? (chronicle ? t.accent : '#b4472b') : t.accent;
  let svg = `<defs><clipPath id="${clip}">${rect(x, y, w, h, 'white')}</clipPath></defs>`;
  svg += `<g clip-path="url(#${clip})"><g transform="translate(${x} ${y})">`;
  svg +=
    rect(0, 0, w, h, water) +
    `<path d="${map.graticule}" fill="none" stroke="${ink}" stroke-width="${s}" opacity=".12"/>`;
  svg += `<path data-map-land="true" d="${map.land}" fill="${land}" stroke="${atlas ? '#899884' : t.muted}" stroke-width="${1.4 * s}" stroke-linejoin="round"/>`;
  svg += scene.routes
    .map((route, i) => {
      const a = reveal(ctx.localTime, 0.12 + i * 0.12, 1.0),
        path = map.route(route.points);
      return (
        `<path data-route-halo="true" d="${path}" fill="none" stroke="${atlas ? '#fff8e9' : t.background}" stroke-width="${10 * s}" stroke-linecap="round" pathLength="1" stroke-dasharray="${a} 1"/>` +
        `<path data-anchor="geo-route" d="${path}" fill="none" stroke="${routeColor}" stroke-width="${(3 + route.strength * 3) * s}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="${a} 1"/>`
      );
    })
    .join('');
  svg += scene.places
    .map((place, i) => {
      const [px, py] = map.project(place.coordinates),
        a = reveal(ctx.localTime, 0.1 + i * 0.025, 0.35);
      const dx = (place.offset?.[0] ?? (place.emphasis ? 45 : 0)) * s;
      const dy = (place.offset?.[1] ?? (place.emphasis ? -40 : 0)) * s;
      const country = place.kind === 'country',
        waterLabel = place.kind === 'water';
      const fontSize = place.emphasis ? 29 : country ? 30 : waterLabel ? 23 : 19;
      return (
        `<g opacity="${a}">` +
        (place.emphasis
          ? `<circle cx="${px}" cy="${py}" r="${7 * s}" fill="${routeColor}" stroke="${land}" stroke-width="${3 * s}"/><path d="M${px},${py}L${px + dx - 10 * s},${py + dy + 6 * s}h${160 * s}" fill="none" stroke="${routeColor}" stroke-width="${1.5 * s}"/>`
          : '') +
        text(place.name, {
          x: px + dx,
          y: py + dy,
          size: fontSize * s,
          width: Math.min(350 * s, w * 0.5),
          font: country ? t.fontDisplay : t.fontBody,
          fill: place.emphasis ? routeColor : ink,
          weight: country ? 600 : 500,
          tracking: country ? 3 * s : 0,
          anchor: place.emphasis ? 'start' : 'middle',
          safe: false,
        }) +
        '</g>'
      );
    })
    .join('');
  // With longitude-only rotation, north remains up in the supported projections; the scale is local.
  const pixelsPerDegree = Math.abs(
    map.project([f.center[0] + 1, f.center[1]])[0] - map.project(f.center)[0],
  );
  const km = f.zoom >= 20 ? 100 : 500;
  const scaleWidth = (pixelsPerDegree * km) / (111.32 * Math.cos((f.center[1] * Math.PI) / 180));
  svg +=
    `<g transform="translate(${w - 48 * s} ${40 * s})"><path d="M0 34V0l-7 13h14L0 0" fill="none" stroke="${ink}" stroke-width="${2 * s}"/>` +
    text('N', { x: 0, y: 58 * s, size: 16 * s, font: t.fontMono, fill: ink, anchor: 'middle' }) +
    '</g>';
  svg +=
    `<g transform="translate(${w - scaleWidth - 40 * s} ${h - 40 * s})"><path d="M0 -6v6h${scaleWidth}v-6M${scaleWidth / 2} 0v-4" fill="none" stroke="${ink}" stroke-width="${2 * s}"/>` +
    text(`${km} km`, {
      x: scaleWidth / 2,
      y: -12 * s,
      size: 16 * s,
      font: t.fontMono,
      fill: ink,
      anchor: 'middle',
    }) +
    '</g>';
  svg += '</g></g>';
  if (scene.metric) {
    const p = reveal(ctx.localTime, scene.beats.at(-1)?.at ?? 0.8, 0.45);
    const sx = atlas && !vertical ? l.x : x + 24 * s;
    const sy = atlas && !vertical ? y + 115 * s : y + h + (atlas ? 145 : -140) * s;
    const sw = atlas && !vertical ? l.width * 0.26 : w * 0.88;
    if (!atlas) svg += rect(sx - 10 * s, sy - 78 * s, sw, 160 * s, t.background);
    svg +=
      `<g opacity="${p}">` +
      text(scene.metric.value, {
        x: sx,
        y: sy,
        size: (atlas ? 144 : 78) * s,
        width: sw,
        font: t.fontDisplay,
        weight: 600,
        fill: t.accent,
      }) +
      paragraph(scene.metric.label, {
        x: sx,
        y: sy + 49 * s,
        size: 26 * s,
        width: sw,
        font: t.fontBody,
        fill: t.text,
        maxLines: 3,
        lineHeight: 1.25,
      }) +
      (scene.metric.context
        ? paragraph(scene.metric.context, {
            x: sx,
            y: sy + 160 * s,
            size: 21 * s,
            width: sw,
            font: t.fontBody,
            fill: t.muted,
            maxLines: 2,
          })
        : '') +
      '</g>';
    if (atlas && !vertical && scene.locatorAsset && ctx.geometry[scene.locatorAsset]) {
      const iw = sw,
        ih = 175 * s,
        iy = y + h - ih - 25 * s;
      const locator = mapPaths(ctx.geometry[scene.locatorAsset], {
        width: iw,
        height: ih,
        center: [scene.center[0] - 6, scene.center[1]],
        zoom: 3.7,
        projection: scene.projection,
      });
      const locatorId = `${clip}-locator`;
      const point = locator.project(scene.center);
      svg +=
        text('LOKALIZACJA REGIONU', {
          x: sx,
          y: iy - 18 * s,
          size: 16 * s,
          font: t.fontMono,
          fill: t.muted,
          width: sw,
        }) +
        `<defs><clipPath id="${locatorId}">${rect(sx, iy, iw, ih, 'white')}</clipPath></defs><g clip-path="url(#${locatorId})"><g transform="translate(${sx} ${iy})">${rect(0, 0, iw, ih, t.panel)}<path d="${locator.land}" fill="${t.muted}" opacity=".5"/><circle cx="${point[0]}" cy="${point[1]}" r="${7 * s}" fill="${t.accent}"/><circle cx="${point[0]}" cy="${point[1]}" r="${20 * s}" fill="none" stroke="${t.accent}" stroke-width="${2 * s}"/></g></g>`;
    }
  }
  svg += text(scene.cartographyLabel ?? scene.routes.map((r) => r.label).join(' / '), {
    x,
    y: y + h + 25 * s,
    size: 14 * s,
    width: w,
    font: t.fontMono,
    fill: t.muted,
  });
  return svg;
}
