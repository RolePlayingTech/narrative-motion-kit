import type { SceneOf } from '../schema/index';
import { text, paragraph, escapeXml } from '../typography/index';
import type { SceneContext } from './types';
import { beatReveal, image, layout, line, rect, reveal } from './shared';

/** Cover a crop using a normalized subject focus, preserving the original aspect ratio. */
export function focusedImage(
  id: string,
  box: { x: number; y: number; width: number; height: number },
  focus: [number, number],
  ctx: SceneContext,
  clip: string,
  crop: [number, number, number, number] = [0, 0, 1, 1],
): string {
  const asset = ctx.project.assets.find((a) => a.id === id),
    aw = asset?.width ?? box.width,
    ah = asset?.height ?? box.height;
  const croppedWidth = aw * crop[2],
    croppedHeight = ah * crop[3];
  const ratio = Math.max(box.width / croppedWidth, box.height / croppedHeight),
    width = aw * ratio,
    height = ah * ratio;
  const x =
      box.x -
      aw * crop[0] * ratio -
      (croppedWidth * ratio - box.width) * Math.max(0, Math.min(1, focus[0])),
    y =
      box.y -
      ah * crop[1] * ratio -
      (croppedHeight * ratio - box.height) * Math.max(0, Math.min(1, focus[1]));
  return `<defs><clipPath id="${clip}">${rect(box.x, box.y, box.width, box.height, 'white')}</clipPath></defs><g clip-path="url(#${clip})">${image(ctx.assetUrl(id), x, y, width, height)}</g>`;
}

export function portraitDuel(scene: SceneOf<'portrait-duel'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme;
  const gap = vertical ? 24 * s : w * 0.12,
    pw = (w - gap) / 2,
    ph = vertical ? h * 0.58 : h * 0.79,
    pictureWidth = Math.min(pw, ph * (vertical ? 0.83 : 1.04)),
    captionHeight = vertical ? 152 * s : 104 * s,
    centerY = y + ph + captionHeight + (vertical ? 92 : 34) * s;
  let svg = line(x + w / 2, y + 35 * s, x + w / 2, y + ph + captionHeight - 15 * s, t.grid, s);
  for (const [i, person] of [scene.left, scene.right].entries()) {
    const p = reveal(ctx.localTime, 0.04, 0.72),
      px = x + i * (pw + gap),
      imageX = px + (pw - pictureWidth) / 2,
      clip = `portrait-${scene.id}-${i}`,
      curtain = `portrait-curtain-${scene.id}-${i}`;
    const assetRole = ctx.project.assets.find((asset) => asset.id === person.asset)?.role;
    const roleLabel =
      assetRole === 'generated'
        ? 'ILUSTRACJA GENEROWANA'
        : assetRole === 'illustrative'
          ? 'ILUSTRACJA'
          : '';
    svg +=
      `<defs><clipPath id="${curtain}">${rect(imageX, y + ph * (1 - p), pictureWidth, ph * p + captionHeight, 'white')}</clipPath></defs>` +
      `<g clip-path="url(#${curtain})" transform="translate(0 ${(1 - p) * 18 * s})">` +
      rect(imageX - 1, y - 1, pictureWidth + 2, ph + captionHeight + 2, t.paper) +
      focusedImage(
        person.asset,
        { x: imageX, y, width: pictureWidth, height: ph },
        person.position ?? [0.5, 0.35],
        ctx,
        clip,
        person.crop,
      ) +
      (roleLabel
        ? rect(imageX, y + ph - 31 * s, pictureWidth, 31 * s, t.background) +
          text(roleLabel, {
            x: imageX + pictureWidth / 2,
            y: y + ph - 10 * s,
            size: 15 * s,
            width: pictureWidth - 16 * s,
            font: t.fontBody,
            fill: t.accent,
            anchor: 'middle',
          })
        : '') +
      rect(imageX, y + ph, pictureWidth, captionHeight, t.paper) +
      rect(imageX, y + ph, 6 * s, captionHeight, t.accent) +
      text(person.name, {
        x: imageX + 24 * s,
        y: y + ph + (vertical ? 64 : 56) * s,
        size: vertical ? 46 * s : 57 * s,
        width: pictureWidth - 48 * s,
        font: t.fontDisplay,
        weight: 600,
        fill: t.ink,
      }) +
      paragraph(person.role, {
        x: imageX + 24 * s,
        y: y + ph + (vertical ? 107 : 93) * s,
        size: 21 * s,
        width: pictureWidth - 48 * s,
        font: t.fontBody,
        fill: t.ink,
        maxLines: vertical ? 2 : 1,
      }) +
      '</g>';
  }
  if (scene.centerLabel) {
    const a = reveal(ctx.localTime, scene.beats[1]?.at ?? 0.85, 0.4);
    svg +=
      line(
        x + w * 0.26,
        centerY - 35 * s,
        x + w * 0.74,
        centerY - 35 * s,
        t.accent,
        2 * s,
        `opacity="${a}"`,
      ) +
      text(scene.centerLabel, {
        x: x + w / 2,
        y: centerY,
        size: 26 * s,
        width: w * 0.9,
        font: t.fontBody,
        fill: t.secondary,
        anchor: 'middle',
        opacity: a,
      });
  }
  return svg;
}

export function photo(scene: SceneOf<'photo'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s } = layout(ctx),
    t = ctx.theme,
    p = reveal(ctx.localTime, 0.07, 0.65),
    archive = scene.treatment === 'archive';
  const inset = archive ? 20 * s : 0,
    box = { x: x + inset, y: y + inset, width: w - inset * 2, height: h - 100 * s - inset * 2 };
  const clip = `photo-${scene.id}`;
  const asset = ctx.project.assets.find((a) => a.id === scene.asset);
  const role =
    asset?.role === 'generated'
      ? 'ILUSTRACJA GENEROWANA'
      : asset?.role === 'illustrative'
        ? 'ILUSTRACJA'
        : '';
  return (
    `<g opacity="${p}" transform="translate(0 ${(1 - p) * 18 * s})">` +
    (archive ? rect(x, y, w, h - 100 * s, t.paper) : '') +
    (scene.treatment === 'cutout'
      ? image(
          ctx.assetUrl(scene.asset),
          box.x,
          box.y,
          box.width,
          box.height,
          'style="mix-blend-mode:normal"',
        )
      : focusedImage(scene.asset, box, scene.focus, ctx, clip)) +
    paragraph(scene.caption, {
      x,
      y: y + h - 56 * s,
      size: 28 * s,
      width: w * 0.88,
      font: t.fontBody,
      fill: t.text,
      maxLines: 2,
    }) +
    (role
      ? text(role, {
          x: x + w,
          y: y + h - 12 * s,
          size: 16 * s,
          width: w * 0.55,
          font: t.fontMono,
          fill: t.accent,
          anchor: 'end',
        })
      : '') +
    '</g>'
  );
}

export function evidence(scene: SceneOf<'evidence'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme,
    p = reveal(ctx.localTime, 0.02, 0.65);
  const dx = x,
    dw = w,
    dy = y + 5 * s,
    dh = h - 15 * s,
    pad = vertical ? 34 * s : 72 * s;
  const innerWidth = dw - pad * 2,
    headingSize = vertical ? 52 * s : 58 * s;
  const bodySize = Math.min(36 * s, (dh * 0.27) / (Math.max(scene.body.length, 1) * 1.8));
  const bodyTop = dy + dh * (vertical ? 0.38 : 0.43);
  const body = scene.body
    .map((value, i) =>
      paragraph(value, {
        x: dx + pad,
        y: bodyTop + i * ((dh * 0.23) / scene.body.length),
        size: bodySize,
        width: innerWidth,
        font: t.fontBody,
        fill: t.ink,
        maxLines: vertical ? 3 : 2,
        lineHeight: 1.18,
      }),
    )
    .join('');
  const mark = reveal(ctx.localTime, scene.beats.at(-1)?.at ?? 0.56, 0.45);
  return (
    `<g transform="translate(0 ${(1 - p) * 20 * s})" opacity="${p}">` +
    rect(dx, dy, dw, dh, t.paper) +
    rect(dx, dy, 6 * s, dh, t.accent) +
    (scene.asset
      ? `<g opacity=".13">${focusedImage(scene.asset, { x: dx, y: dy, width: dw, height: dh }, [0.5, 0.15], ctx, `doc-${scene.id}`)}</g>`
      : '') +
    text(scene.documentLabel, {
      x: dx + pad,
      y: dy + 42 * s,
      size: 17 * s,
      width: innerWidth,
      font: t.fontMono,
      fill: t.ink,
      tracking: 2 * s,
    }) +
    line(dx + pad, dy + 63 * s, dx + dw - pad, dy + 63 * s, t.ink, s, 'opacity=".18"') +
    paragraph(scene.heading, {
      x: dx + pad,
      y: dy + dh * (vertical ? 0.19 : 0.26),
      size: headingSize,
      width: innerWidth,
      font: t.fontDisplay,
      fill: t.ink,
      weight: 600,
      maxLines: 2,
      lineHeight: 1.05,
    }) +
    body +
    `<g opacity="${0.3 + 0.7 * mark}" transform="translate(0 ${(1 - mark) * 7 * s})">` +
    paragraph(scene.highlight, {
      x: dx + pad,
      y: dy + dh * (vertical ? 0.7 : 0.77),
      size: vertical ? 70 * s : 84 * s,
      width: innerWidth,
      font: t.fontDisplay,
      fill: t.accent,
      weight: 600,
      maxLines: vertical ? 2 : 1,
      lineHeight: 1.02,
    }) +
    '</g>' +
    line(dx + pad, dy + dh * 0.83, dx + pad + innerWidth * mark, dy + dh * 0.83, t.accent, 3 * s) +
    text(scene.attribution, {
      x: dx + pad,
      y: dy + dh - 29 * s,
      size: 18 * s,
      width: innerWidth,
      font: t.fontBody,
      fill: t.ink,
    }) +
    '</g>'
  );
}

export function timeline(scene: SceneOf<'timeline'>, ctx: SceneContext): string {
  const { x, y, width: w, height: h, s, vertical } = layout(ctx),
    t = ctx.theme,
    n = scene.events.length;
  const p = reveal(ctx.localTime, 0.1, 1.1),
    axisY = y + h * 0.35,
    axisX = x + 24 * s;
  let svg = vertical
    ? line(axisX, y + 20 * s, axisX, y + h * p, t.grid, 3 * s)
    : line(x, axisY, x + w * p, axisY, t.grid, 3 * s);
  svg += scene.events
    .map((event, i) => {
      const a = beatReveal(scene, ctx.localTime, i, n, 0.5),
        px = vertical ? axisX : x + ((w - 35 * s) * i) / (n - 1),
        py = vertical ? y + 24 * s + ((h - 70 * s) * i) / n : axisY;
      const textX = vertical ? px + 42 * s : px,
        textW = vertical ? w - 90 * s : (w / n) * 0.91;
      const anchor = vertical ? 'start' : i === n - 1 ? 'end' : 'start';
      return (
        `<g opacity="${a}"><circle cx="${px}" cy="${py}" r="${8 * s}" fill="${t.accent}"/>` +
        text(event.date, {
          x: textX,
          y: vertical ? py + 8 * s : py - 40 * s,
          size: vertical ? 38 * s : 49 * s,
          width: textW,
          font: t.fontDisplay,
          fill: t.accent,
          anchor,
        }) +
        paragraph(event.label, {
          x: textX,
          y: vertical ? py + 47 * s : py + 55 * s,
          size: 27 * s,
          width: textW,
          font: t.fontBody,
          fill: t.text,
          maxLines: 2,
          anchor,
        }) +
        (event.detail
          ? paragraph(event.detail, {
              x: textX,
              y: vertical ? py + 87 * s : py + 135 * s,
              size: 20 * s,
              width: textW,
              font: t.fontBody,
              fill: t.muted,
              maxLines: 2,
              anchor,
            })
          : '') +
        (event.asset && !vertical
          ? image(
              ctx.assetUrl(event.asset),
              i === n - 1 ? px - textW : px,
              py + 193 * s,
              textW,
              Math.min(115 * s, h * 0.2),
            )
          : '') +
        '</g>'
      );
    })
    .join('');
  return svg;
}

/** Visible errors are useful in preview; final validation rejects unregistered renderers. */
export function unavailableCustom(renderer: string, ctx: SceneContext): string {
  const { x, y, width: w, s } = layout(ctx);
  return text(`Renderer not registered: ${escapeXml(renderer)}`, {
    x,
    y: y + 100 * s,
    size: 40 * s,
    width: w,
    font: ctx.theme.fontBody,
    fill: ctx.theme.danger,
  });
}
