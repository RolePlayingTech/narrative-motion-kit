import { join } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { atomicWrite } from './cache.ts';
import { capture, openRenderSession } from './browser.ts';
import { contactTimes } from './render-plan.ts';
import type { LoadedProject } from './project.ts';

const escape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export async function contactSheet(
  loaded: LoadedProject,
  options: { everySeconds?: number; everyFrames?: number } = {},
): Promise<string[]> {
  const times = contactTimes(loaded.project, options),
    portrait = loaded.project.resolution.height > loaded.project.resolution.width;
  const width = portrait ? 270 : 480,
    height =
      Math.round((width * loaded.project.resolution.height) / loaded.project.resolution.width / 2) *
      2;
  const columns = portrait ? 5 : 3,
    perSheet = columns * 5,
    footer = 36;
  const session = await openRenderSession(loaded.project.id, width, height),
    outputs: string[] = [];
  try {
    const page = await session.page();
    for (let offset = 0; offset < times.length; offset += perSheet) {
      const slice = times.slice(offset, offset + perSheet),
        rows = Math.ceil(slice.length / columns),
        composites: OverlayOptions[] = [];
      for (const [index, time] of slice.entries()) {
        const x = (index % columns) * width,
          y = Math.floor(index / columns) * (height + footer);
        const png = await capture(page, time),
          scene =
            loaded.project.scenes.find((s) => time >= s.start && time < s.end) ??
            loaded.project.scenes.at(-1);
        composites.push({ input: png, left: x, top: y });
        const label = `<svg width="${width}" height="${footer}"><rect width="100%" height="100%" fill="#171d25"/><text x="12" y="23" fill="#e6e8ee" font-family="sans-serif" font-size="14">${time.toFixed(3)} s · ${escape(scene?.id ?? '')}</text></svg>`;
        composites.push({ input: Buffer.from(label), left: x, top: y + height });
      }
      const output = join(
        loaded.directory,
        'renders',
        'contact',
        `contact-${String(outputs.length + 1).padStart(2, '0')}.jpg`,
      );
      const bytes = await sharp({
        create: {
          width: columns * width,
          height: rows * (height + footer),
          channels: 3,
          background: '#0c1017',
        },
      })
        .composite(composites)
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();
      await atomicWrite(output, bytes);
      outputs.push(output);
      console.log(`Contact sheet ${outputs.length}: ${slice.length} samples`);
    }
    await atomicWrite(
      join(loaded.directory, 'renders', 'contact', 'samples.json'),
      JSON.stringify(
        times.map((time) => ({
          time,
          sceneId: (
            loaded.project.scenes.find((s) => time >= s.start && time < s.end) ??
            loaded.project.scenes.at(-1)
          )?.id,
        })),
        null,
        2,
      ),
    );
  } finally {
    await session.close();
  }
  return outputs;
}
