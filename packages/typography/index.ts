/** SVG text utilities. No DOM measurements are needed to render a frame. */
export const escapeXml = (value: unknown): string =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!,
  );

/** Conservative width estimate; the browser QA additionally checks actual glyph bounds. */
export function estimateTextWidth(value: string, size: number, condensed = false): number {
  let units = 0;
  for (const char of value)
    units += /[ilI1.,:;'|!\s]/u.test(char)
      ? 0.32
      : /[MW@%ÓOŻŹĄĘ]/u.test(char)
        ? 0.84
        : /[A-ZŁŚĆŃ]/u.test(char)
          ? 0.67
          : 0.59;
  return units * size * (condensed ? 0.84 : 1);
}

export function fitText(
  value: string,
  width: number,
  requestedSize: number,
  condensed = false,
): number {
  return Math.min(
    requestedSize,
    (requestedSize * width) / Math.max(1, estimateTextWidth(value, requestedSize, condensed)),
  );
}

export interface TextOptions {
  x: number;
  y: number;
  size: number;
  width?: number;
  fill?: string;
  font?: string;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  tracking?: number;
  opacity?: number;
  safe?: boolean;
  condensed?: boolean;
}

/** x/y is the baseline; all supplied content and attributes are XML escaped. */
export function text(value: string, o: TextOptions): string {
  const condensed = o.condensed ?? o.font?.includes('Condensed') ?? false;
  const trackingWidth = (o.tracking ?? 0) * Math.max(0, value.length - 1);
  const size =
    o.width === undefined
      ? o.size
      : fitText(value, Math.max(1, o.width - trackingWidth), o.size, condensed);
  return `<text data-text="${escapeXml(value)}"${o.safe === false ? ' data-allow-overflow="true"' : ' data-safe="true"'} x="${o.x}" y="${o.y}" font-family="${escapeXml(o.font ?? 'Manrope')}" font-size="${size}" font-weight="${o.weight ?? 500}" fill="${escapeXml(o.fill ?? 'currentColor')}" text-anchor="${o.anchor ?? 'start'}" letter-spacing="${o.tracking ?? 0}" opacity="${o.opacity ?? 1}">${escapeXml(value)}</text>`;
}

export function wrapText(value: string, width: number, size: number, condensed = false): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of value.trim().split(/\s+/u)) {
    const next = line ? `${line} ${word}` : word;
    if (line && estimateTextWidth(next, size, condensed) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function paragraph(
  value: string,
  o: TextOptions & { lineHeight?: number; maxLines?: number },
): string {
  const width = o.width ?? 800;
  let size = o.size;
  const condensed = o.condensed ?? o.font?.includes('Condensed') ?? false;
  let lines = wrapText(value, width, size, condensed);
  while (o.maxLines && lines.length > o.maxLines && size > 1) {
    size *= 0.94;
    lines = wrapText(value, width, size, condensed);
  }
  const lineHeight = (o.lineHeight ?? 1.16) * size;
  return lines.map((line, i) => text(line, { ...o, size, y: o.y + i * lineHeight })).join('');
}
