import { describe, expect, test } from 'vitest';
import sharp from 'sharp';
import { parseProject, type Scene } from '../packages/schema/index';
import { getTheme } from '../packages/theme/index';
import { transitionFrame } from '../packages/transitions/index';
import type { SceneContext } from '../packages/scenes/types';

function fixture(type: 'focus-through' | 'match-cut' | 'cut') {
  const project = parseProject({
    version: 1,
    id: 'transition-fixture',
    title: 'Transition fixture',
    seed: 1,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    duration: 2,
    narration: { kind: 'silent-demo' },
    scenes: [
      {
        id: 'next',
        type: 'evidence',
        start: 0,
        end: 2,
        title: 'Next scene',
        mode: 'EVIDENCE',
        thesis: 'Inspect the next page.',
        addedInformation: 'An attributed document carries the explanation.',
        heading: 'Evidence',
        body: ['One fact.'],
        highlight: 'One fact.',
        attribution: 'Fixture',
        transition: {
          type,
          duration: 0.5,
          anchor: [0.35, 0.62],
          reason: 'The focus opens the next page.',
        },
      },
    ],
  });
  const current = project.scenes[0],
    previous: Scene = { ...current, id: 'before', tone: 'dark' };
  const ctx: SceneContext = {
    project,
    time: 0.25,
    localTime: 0.25,
    width: 1920,
    height: 1080,
    theme: getTheme('editorial'),
    geometry: {},
    assetUrl: (id) => id,
  };
  return { current, previous, ctx };
}

const before = '<rect width="1920" height="1080" fill="#ff0000"/>',
  after = '<rect width="1920" height="1080" fill="#0000ff"/>';

describe('opaque editorial transitions', () => {
  test.each(['focus-through', 'match-cut'] as const)(
    '%s keeps complete header and source bands throughout the wipe',
    async (type) => {
      const { current, previous, ctx } = fixture(type);
      for (const p of [0.15, 0.49, 0.5, 0.75]) {
        const markup = transitionFrame(before, after, previous, current, p, ctx);
        const { data, info } = await sharp(
          Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">${markup}</svg>`,
          ),
        )
          .resize(192, 108)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const expected = p < 0.5 ? [255, 0, 0] : [0, 0, 255];
        for (const y of [10, 25, 98, 105]) {
          for (let x = 0; x < info.width; x++) {
            const i = (y * info.width + x) * info.channels;
            expect([...data.subarray(i, i + 3)]).toEqual(expected);
          }
        }
      }
    },
  );

  test.each(['focus-through', 'match-cut'] as const)(
    '%s replaces pixels without a fade gap',
    async (type) => {
      const { current, previous, ctx } = fixture(type);
      for (const p of [0.01, 0.15, 0.35, 0.5, 0.75, 0.99]) {
        const markup = transitionFrame(before, after, previous, current, p, ctx);
        const { data } = await sharp(
          Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">${markup}</svg>`,
          ),
        )
          .resize(192, 108)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        for (let i = 0; i < data.length; i += 4) {
          expect(data[i + 3], `alpha at p=${p}`).toBe(255);
          expect(data[i + 1], `no intermediate paper/grey flash at p=${p}`).toBe(0);
          expect(data[i] + data[i + 2], `no black seam at p=${p}`).toBeGreaterThanOrEqual(254);
        }
      }
    },
  );

  test.each(['focus-through', 'match-cut'] as const)(
    '%s preserves exact endpoints and random access',
    (type) => {
      const { current, previous, ctx } = fixture(type);
      expect(transitionFrame(before, after, previous, current, 0, ctx)).toBe(before);
      expect(transitionFrame(before, after, previous, current, 1, ctx)).toBe(after);
      const first = transitionFrame(before, after, previous, current, 0.4, ctx);
      transitionFrame(before, after, previous, current, 0.8, ctx);
      expect(transitionFrame(before, after, previous, current, 0.4, ctx)).toBe(first);
      expect(first).not.toContain('opacity=');
      expect(first).not.toContain('<circle');
    },
  );

  test('a cut never holds an outgoing frame at the incoming boundary', () => {
    const { current, previous, ctx } = fixture('cut');
    expect(transitionFrame(before, after, previous, current, 0, ctx)).toBe(after);
  });

  test('incoming paper tone supplies its own opaque plane', () => {
    const { current, previous, ctx } = fixture('focus-through');
    const markup = transitionFrame('', '', previous, { ...current, tone: 'paper' }, 0.5, ctx);
    expect(markup).toContain(`fill="${ctx.theme.paper}"`);
    expect(markup).toContain(`fill="${ctx.theme.background}"`);
  });
});
