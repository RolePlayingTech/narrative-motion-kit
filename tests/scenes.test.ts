import { describe, expect, test } from 'vitest';
import { parseProject, type Scene } from '../packages/schema/index';
import { getTheme } from '../packages/theme/index';
import {
  renderScene,
  registerCustomScene,
  recommendScenes,
  type SceneContext,
} from '../packages/scenes/index';
import { transitionFrame, morphPath, resamplePath } from '../packages/transitions/index';
import { barGeometry, lineGeometry, ticks } from '../packages/charts/index';
import { escapeXml, paragraph, fitText } from '../packages/typography/index';
import { beatReveal, beatTime } from '../packages/scenes/shared';
import { lineProgress } from '../packages/scenes/data';

const base = {
  id: 'shot',
  start: 0,
  end: 4,
  title: 'Świadek Dziejów: źródła i skala',
  mode: 'CONTEXT',
  thesis: 'One clear visual thesis.',
  addedInformation: 'Additional context beyond narration.',
  sourceIds: ['source'],
};
function projectWith(scene: Record<string, unknown>) {
  return parseProject({
    version: 1,
    id: 'fixture',
    title: 'Fixture',
    seed: 17,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    duration: 4,
    narration: { kind: 'silent-demo' },
    assets: [
      {
        id: 'photo',
        file: 'photo.jpg',
        kind: 'image',
        role: 'documentary',
        acquired: '2026-10-03',
        license: 'Test fixture',
      },
      {
        id: 'map',
        file: 'map.json',
        kind: 'geojson',
        role: 'data',
        acquired: '2026-10-03',
        license: 'Test fixture',
      },
    ],
    sources: [
      {
        id: 'source',
        title: 'Fixture source',
        url: 'https://example.com/source',
        publisher: 'Fixture publisher',
        retrieved: '2026-10-03',
      },
    ],
    datasets: [
      {
        id: 'data',
        title: 'Observed values',
        sourceIds: ['source'],
        unit: 'PLN',
        status: 'illustrative',
        points: [
          { x: 2020, y: 2, label: '2020' },
          { x: 2021, y: 4, label: '2021' },
          { x: 2022, y: 6, label: '2022' },
        ],
      },
    ],
    scenes: [{ ...base, ...scene }],
  });
}
function fixture(
  scene: Record<string, unknown>,
  vertical = false,
): { scene: Scene; ctx: SceneContext } {
  const project = projectWith(scene);
  return {
    scene: project.scenes[0],
    ctx: {
      project,
      width: vertical ? 1080 : 1920,
      height: vertical ? 1920 : 1080,
      time: 1.3,
      localTime: 1.3,
      theme: getTheme('editorial'),
      assetUrl: (id) => `/fixture/${id}.jpg`,
      geometry: {
        map: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Fixture' },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [40, 20],
                    [40, 40],
                    [60, 40],
                    [60, 20],
                    [40, 20],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
  };
}
const recipes: Record<string, unknown>[] = [
  { type: 'statistic', value: 6.12, unit: 'zł/l', label: 'Cena paliwa', variant: 'pump' },
  {
    type: 'portrait-duel',
    left: { asset: 'photo', name: 'Osoba pierwsza', role: 'Rola' },
    right: { asset: 'photo', name: 'Osoba druga', role: 'Rola' },
  },
  { type: 'photo', asset: 'photo', caption: 'Źródło dokumentalne.' },
  {
    type: 'evidence',
    heading: 'Treść dokumentu',
    body: ['Akapit pierwszy.', 'Akapit drugi.'],
    highlight: 'Fakt & znaczenie < 10',
    attribution: 'Źródło i data',
  },
  {
    type: 'flow',
    nodes: [
      { id: 'a', label: 'Początek' },
      { id: 'b', label: 'Następstwo' },
      { id: 'c', label: 'Wynik' },
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ],
  },
  { type: 'breakdown', dataset: 'data', totalLabel: 'Całość' },
  { type: 'line-chart', dataset: 'data', xLabel: 'Rok', yLabel: 'PLN' },
  { type: 'bar-chart', dataset: 'data', xLabel: 'Rok', yLabel: 'PLN' },
  {
    type: 'geo-flow',
    asset: 'map',
    center: [50, 30],
    zoom: 3,
    routes: [
      {
        id: 'route',
        points: [
          [45, 25],
          [48, 28],
          [55, 32],
        ],
        label: 'Szlak',
      },
    ],
    places: [{ name: 'Miejsce', coordinates: [50, 30] }],
  },
  {
    type: 'timeline',
    events: [
      { date: '2020', label: 'Początek' },
      { date: '2021', label: 'Zmiana' },
    ],
  },
  {
    type: 'comparison',
    dataset: 'data',
    left: { label: 'Przed', value: 2 },
    right: { label: 'Po', value: 6 },
    unit: 'PLN',
  },
];

describe('deterministic SVG scene library', () => {
  test('partial authored beats keep later elements chronological and settle before the cut', () => {
    const { scene } = fixture({
      ...recipes[4],
      beats: [
        { at: 0.5, label: 'first' },
        { at: 2, label: 'second' },
      ],
    });
    const times = [0, 1, 2, 3].map((i) => beatTime(scene, i, 4));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[2]).toBeGreaterThan(2);
    expect(beatReveal(scene, 3.99, 3, 4, 0.75)).toBe(1);
    const late = { ...scene, beats: [{ at: 3.9, label: 'late start' }] };
    expect(beatReveal(late, 3.999, 2, 3, 0.75)).toBe(1);
  });
  test('line trace finishes on the last beat and annotations wait for their observation', () => {
    const { scene, ctx } = fixture({
      ...recipes[6],
      beats: [{ at: 3.2, label: 'complete series' }],
      annotation: { index: 2, text: 'Latest observation' },
    });
    if (scene.type !== 'line-chart') throw new Error('Expected chart');
    expect(lineProgress(scene, 3.2)).toBe(1);
    expect(lineProgress(scene, 0)).toBe(0);
    const early = renderScene(scene, { ...ctx, time: 2.8, localTime: 2.8 });
    expect(early).toContain('clip-path="url(#plot-shot)"');
    expect(early).toContain('data-chart-annotation="true" opacity="0"');
    expect(renderScene(scene, { ...ctx, time: 3.8, localTime: 3.8 })).toContain(
      'data-chart-annotation="true" opacity="1"',
    );
  });
  test('series share one set of x-axis labels and illustrative datasets are visibly qualified', () => {
    const { scene, ctx } = fixture(recipes[6]);
    const data = ctx.project.datasets[0];
    data.points = [
      ...data.points.map((point) => ({ ...point, series: 'A' })),
      ...data.points.map((point) => ({ ...point, series: 'B', y: point.y + 2 })),
    ];
    const output = renderScene(scene, ctx);
    expect(output.match(/>2021<\/text>/g)).toHaveLength(1);
    expect(output).toContain('SCHEMAT ILUSTRACYJNY');
  });
  test('portrait illustrations cannot silently assume a documentary role', () => {
    const { scene, ctx } = fixture(recipes[1]);
    ctx.project.assets[0].role = 'generated';
    expect(renderScene(scene, ctx)).toContain('ILUSTRACJA GENEROWANA');
  });
  test('flow developments follow narration beats and remain independent of previous renders', () => {
    const { scene, ctx } = fixture({
      ...recipes[4],
      beats: [
        { at: 0.3, label: 'first' },
        { at: 1.4, label: 'second' },
        { at: 2.8, label: 'third' },
      ],
    });
    expect(beatTime(scene, 2, 3)).toBe(2.8);
    const early = renderScene(scene, { ...ctx, localTime: 1, time: 1 });
    expect(early).toMatch(/data-flow-node="c" opacity="0"/);
    const late = renderScene(scene, { ...ctx, localTime: 3.6, time: 3.6 });
    expect(late).toMatch(/data-flow-node="c" opacity="1"/);
    expect(renderScene(scene, { ...ctx, localTime: 1, time: 1 })).toBe(early);
  });
  test.each(recipes.map((recipe) => [recipe.type as string, recipe]))(
    '%s renders independently in both aspect ratios',
    (_name, recipe) => {
      for (const vertical of [false, true]) {
        const { scene, ctx } = fixture(recipe, vertical),
          first = renderScene(scene, ctx);
        renderScene(scene, { ...ctx, time: 3.7, localTime: 3.7 });
        expect(renderScene(scene, ctx)).toBe(first);
        expect(first).toContain('data-scene="shot"');
        expect(first).toContain('ŚWIADEK DZIEJÓW');
        expect(first).not.toMatch(/NaN|Infinity|undefined/);
      }
    },
  );
  test('custom renderers preserve composition and fail clearly if absent', () => {
    const { scene, ctx } = fixture({ type: 'custom', renderer: 'test-supplied' });
    expect(() => renderScene(scene, ctx)).toThrow('unregistered renderer');
    registerCustomScene(
      'test-supplied',
      (_scene, ctx) => `<circle cx="${ctx.width / 2}" cy="${ctx.height / 2}" r="10"/>`,
    );
    expect(renderScene(scene, ctx)).toContain('<circle');
    expect(() => registerCustomScene('test-supplied', () => '')).toThrow('already registered');
  });
  test('untrusted text remains text in document scenes', () => {
    const { scene, ctx } = fixture({ ...recipes[3], highlight: '<script>alert("X")</script>' });
    expect(renderScene(scene, ctx)).not.toContain('<script>');
    expect(renderScene(scene, ctx)).toContain('&lt;script&gt;');
  });
  test('recommendations exclude absent inputs', () => {
    expect(recommendScenes('CONTRAST', { hasData: false, hasImages: false })).toEqual([]);
    expect(
      recommendScenes('MECHANISM', { hasGeography: false }).some((s) => s.type === 'geo-flow'),
    ).toBe(false);
  });
});

describe('quantitative geometry', () => {
  test('axis ticks retain exact rounded steps on a supplied truncated domain', () => {
    expect(ticks({ min: 70, max: 95 })).toEqual([70, 75, 80, 85, 90, 95]);
    expect(ticks({ min: -3, max: 6 })).toContain(0);
  });
  test('negative bars share a true zero baseline', () => {
    const { ctx } = fixture(recipes[7]),
      data = {
        ...ctx.project.datasets[0],
        points: [
          { x: 0, y: -3 },
          { x: 1, y: 6 },
        ],
      };
    const g = barGeometry(data, { x: 0, y: 0, width: 400, height: 300 });
    expect(g.zero).toBe(200);
    expect(g.rects[0]).toMatchObject({ y: 200, height: 100 });
    expect(g.rects[1]).toMatchObject({ y: 0, height: 200 });
  });
  test('constant domains still produce finite coordinates', () => {
    const { ctx } = fixture(recipes[6]),
      data = { ...ctx.project.datasets[0], points: [{ x: 1, y: 0 }] };
    const g = lineGeometry(data, { x: 0, y: 0, width: 400, height: 300 });
    expect(g.points[0][0]).toBeCloseTo(200);
    expect(g.points[0][1]).toBe(150);
  });
});

describe('semantic transitions', () => {
  test('arc-length sampling is stable and handles repeated vertices', () => {
    expect(
      resamplePath(
        [
          [0, 0],
          [0, 0],
          [10, 0],
        ],
        3,
      ),
    ).toEqual([
      [0, 0],
      [5, 0],
      [10, 0],
    ]);
    expect(
      morphPath(
        [
          [0, 0],
          [10, 0],
        ],
        [
          [0, 10],
          [10, 10],
        ],
        0.5,
        3,
      ),
    ).toEqual([
      [0, 5],
      [5, 5],
      [10, 5],
    ]);
  });
  test('route-to-line has exact endpoints and independent intermediate output', () => {
    const a = fixture(recipes[8]),
      b = fixture({
        ...recipes[6],
        transition: {
          type: 'route-to-line',
          duration: 0.5,
          reason: 'Route becomes the observed data line.',
        },
      });
    expect(transitionFrame('previous', 'current', a.scene, b.scene, 0, b.ctx)).toBe('previous');
    expect(transitionFrame('previous', 'current', a.scene, b.scene, 1, b.ctx)).toBe('current');
    const mid = transitionFrame('previous', 'current', a.scene, b.scene, 0.5, b.ctx);
    expect(mid).toContain('<path');
    expect(mid).not.toMatch(/NaN|Infinity/);
    expect(transitionFrame('previous', 'current', a.scene, b.scene, 0.5, b.ctx)).toBe(mid);
  });
  test('incompatible semantic transitions fail instead of pretending to morph', () => {
    const a = fixture(recipes[0]),
      b = fixture({
        ...recipes[6],
        transition: {
          type: 'route-to-line',
          duration: 0.5,
          reason: 'This pair is deliberately invalid.',
        },
      });
    expect(() => transitionFrame('a', 'b', a.scene, b.scene, 0.5, b.ctx)).toThrow(
      'requires geo-flow or line-chart',
    );
  });
});

describe('Polish typography and escaping', () => {
  test('fitting respects explicit width and wraps rather than truncating facts', () => {
    expect(fitText('Źródło oraz wartość', 100, 100)).toBeLessThan(100);
    const markup = paragraph('Zażółć gęślą jaźń. Łódź i Śląsk.', {
      x: 0,
      y: 0,
      size: 36,
      width: 200,
      maxLines: 3,
    });
    expect(markup).toContain('Zażółć');
    expect(markup).toContain('Śląsk.');
    expect(escapeXml('"<&>')).toBe('&quot;&lt;&amp;&gt;');
  });
});
