import { describe, expect, it } from 'vitest';
import {
  AssetSchema,
  parseProject,
  ProjectSchema,
  SceneSchema,
  type Project,
} from '../packages/schema/index';

function validProject(): Project {
  return parseProject({
    version: 1,
    id: 'schema-fixture',
    title: 'Test danych i źródeł',
    seed: 19,
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    duration: 4,
    narration: { kind: 'synthetic', file: 'narration/test.wav' },
    sources: [
      {
        id: 'source',
        title: 'Fixture observations',
        url: 'https://example.org/data',
        publisher: 'Test fixture',
        retrieved: '2026-10-03',
      },
    ],
    claims: [
      {
        id: 'claim',
        text: 'This is an explicitly illustrative test series.',
        sourceIds: ['source'],
        status: 'illustrative',
        confidence: 'high',
        usedInScenes: ['opening'],
      },
    ],
    datasets: [
      {
        id: 'series',
        title: 'Illustrative data',
        sourceIds: ['source'],
        unit: 'units',
        status: 'illustrative',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 5 },
        ],
      },
    ],
    scenes: [
      {
        id: 'opening',
        type: 'statistic',
        start: 0,
        end: 2,
        title: 'Pięć jednostek',
        mode: 'SCALE',
        thesis: 'Make the scale explicit.',
        addedInformation: 'A readable unit grounds the number.',
        sourceIds: ['source'],
        claimIds: ['claim'],
        value: 5,
        unit: 'units',
        label: 'Illustrative quantity',
      },
      {
        id: 'history',
        type: 'line-chart',
        start: 2,
        end: 4,
        title: 'Zmiana w czasie',
        mode: 'SCALE',
        thesis: 'Compare supplied observations.',
        addedInformation: 'Show the difference between two periods.',
        sourceIds: ['source'],
        dataset: 'series',
        xLabel: 'period',
        yLabel: 'units',
      },
    ],
  });
}

describe('truthful visual encodings', () => {
  it('rejects a domain that silently hides supplied chart values', () => {
    const p = validProject();
    const scene = p.scenes[1];
    if (scene.type !== 'line-chart') throw new Error('fixture');
    scene.yDomain = [3, 6];
    expect(() => parseProject(p)).toThrow(/include all supplied/);
  });
  it('rejects beats that would reveal information backwards', () => {
    const p = validProject();
    p.scenes[0].beats = [
      { at: 1, label: 'late' },
      { at: 0.5, label: 'early' },
    ];
    expect(() => parseProject(p)).toThrow(/strictly increase/);
  });
  it('rejects incompatible semantic transition shapes before opening a browser', () => {
    const p = validProject();
    p.scenes[1].transition = {
      type: 'route-to-line',
      duration: 0.4,
      reason: 'Meaningful shared line',
      anchor: [0.5, 0.5],
    };
    expect(() => parseProject(p)).toThrow(/both sides/);
  });
  it('rejects a camera flight that would be cut off before it finishes', () => {
    const p = validProject();
    p.scenes[0].camera = {
      from: { x: 0, y: 0, zoom: 1, rotation: 0 },
      to: { x: 0, y: 0, zoom: 2, rotation: 0 },
      start: 0,
      end: 3,
    };
    expect(() => parseProject(p)).toThrow(/exceeds scene duration/);
  });
});

function errors(project: unknown): string {
  const result = ProjectSchema.safeParse(project);
  return result.success ? '' : result.error.issues.map((issue) => issue.message).join('\n');
}

describe('project schema production invariants', () => {
  it('accepts a complete sourced timeline and fills stable defaults', () => {
    const project = validProject();
    expect(project.language).toBe('pl-PL');
    expect(project.theme).toBe('editorial');
    expect(project.scenes[0].beats).toEqual([]);
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it.each([
    ['gap', 2.2],
    ['overlap', 1.8],
  ])('rejects a timeline %s', (kind, start) => {
    const project = validProject();
    project.scenes[1].start = start;
    expect(errors(project)).toContain(`timeline ${kind}`);
  });

  it('requires the final scene to end at narration duration', () => {
    const project = validProject();
    project.duration = 4.5;
    expect(errors(project)).toContain('Timeline ends at 4s');
  });

  it('rejects reversed scenes, out-of-scene beats, and too-long transitions', () => {
    const project = validProject();
    project.scenes[0].beats = [{ at: 2, label: 'Too late' }];
    expect(errors(project)).toContain('Beat outside scene');
    project.scenes[0].end = 0.5;
    project.scenes[1].start = 0.5;
    project.scenes[0].transition = {
      type: 'focus-through',
      duration: 1,
      anchor: [0.5, 0.5],
      reason: 'Focus through the quantity.',
    };
    expect(errors(project)).toContain('Transition longer than scene');
    project.scenes[1].end = 0.2;
    expect(errors(project)).toContain('end must be after start');
  });

  it('rejects unresolved dataset, source, claim, and scene references', () => {
    const project = validProject();
    const chart = project.scenes[1];
    if (chart.type !== 'line-chart') throw new Error('Expected fixture chart');
    chart.dataset = 'missing-data';
    chart.sourceIds = ['missing-source'];
    chart.claimIds = ['missing-claim'];
    project.claims[0].usedInScenes = ['missing-scene'];
    const messages = errors(project);
    for (const reference of [
      'dataset: missing-data',
      'source: missing-source',
      'claim: missing-claim',
      'scene: missing-scene',
    ])
      expect(messages).toContain(`Unknown ${reference}`);
  });

  it('rejects duplicate record IDs rather than resolving whichever appears first', () => {
    const project = validProject();
    project.sources.push({ ...project.sources[0] });
    project.datasets.push({ ...project.datasets[0] });
    project.scenes[1].id = 'opening';
    expect(errors(project)).toContain('Duplicate sources id');
    expect(errors(project)).toContain('Duplicate datasets id');
    expect(errors(project)).toContain('Duplicate scenes id');
  });

  it('requires factual support for quantitative scenes even when illustrative', () => {
    const project = validProject();
    project.scenes[0].sourceIds = [];
    expect(errors(project)).toContain('Quantitative scenes require sourceIds');
  });

  it('rejects reversed line domains and non-finite data', () => {
    const project = validProject();
    const chart = project.scenes[1];
    if (chart.type !== 'line-chart') throw new Error('Expected fixture chart');
    chart.yDomain = [10, 0];
    expect(errors(project)).toContain('yDomain must be increasing');
    project.datasets[0].points[0].y = Number.NaN;
    expect(ProjectSchema.safeParse(project).success).toBe(false);
  });

  it('rejects negative or zero-total parts in a breakdown', () => {
    const project = validProject();
    const previous = project.scenes[1];
    project.scenes[1] = {
      id: previous.id,
      start: previous.start,
      end: previous.end,
      title: previous.title,
      mode: 'SCALE',
      thesis: previous.thesis,
      addedInformation: previous.addedInformation,
      sourceIds: ['source'],
      claimIds: [],
      beats: [],
      type: 'breakdown',
      dataset: 'series',
      totalLabel: 'Total',
      orientation: 'horizontal',
    };
    project.datasets[0].points[0].y = -2;
    expect(errors(project)).toContain('Breakdown requires nonnegative parts and positive sum');
    project.datasets[0].points.forEach((point) => {
      point.y = 0;
    });
    expect(errors(project)).toContain('Breakdown requires nonnegative parts and positive sum');
  });

  it('rejects missing flow endpoints', () => {
    const project = validProject();
    project.scenes[1] = {
      id: 'history',
      start: 2,
      end: 4,
      type: 'flow',
      title: 'Mechanism',
      mode: 'MECHANISM',
      thesis: 'A cause produces an effect.',
      addedInformation: 'Show the mechanism explicitly.',
      sourceIds: [],
      claimIds: [],
      beats: [],
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      edges: [{ from: 'a', to: 'missing' }],
    };
    expect(errors(project)).toContain('Unknown node: missing');
  });

  it('requires narration for production projects and even H.264 dimensions', () => {
    const project = validProject();
    delete project.narration.file;
    project.resolution.width = 1919;
    expect(errors(project)).toContain('Narration file required');
    expect(errors(project)).toContain('dimensions must be even');
  });

  it('rejects unknown keys to expose mistaken DSL assumptions', () => {
    expect(ProjectSchema.safeParse({ ...validProject(), autoPublish: true }).success).toBe(false);
  });
});

describe('asset manifest integrity', () => {
  const base = {
    id: 'image',
    file: 'assets/image.png',
    kind: 'image',
    role: 'documentary',
    acquired: '2026-10-03',
    license: 'Test fixture only',
  };

  it.each([
    '../outside.png',
    'assets/../../outside.png',
    'C:\\outside.png',
    '/outside.png',
    'https://example.org/image.png',
  ])('rejects nonlocal path %s', (file) => {
    expect(AssetSchema.safeParse({ ...base, file }).success).toBe(false);
  });

  it('requires generation prompts for generated media', () => {
    expect(AssetSchema.safeParse({ ...base, role: 'generated' }).success).toBe(false);
    expect(
      AssetSchema.safeParse({
        ...base,
        role: 'generated',
        prompt: 'An explicitly illustrative mechanism.',
      }).success,
    ).toBe(true);
  });

  it('accepts Unicode filenames while requiring a license and valid content hash', () => {
    expect(AssetSchema.safeParse({ ...base, file: 'assets/Łódź.png' }).success).toBe(true);
    expect(AssetSchema.safeParse({ ...base, license: '' }).success).toBe(false);
    expect(AssetSchema.safeParse({ ...base, sha256: 'not-a-hash' }).success).toBe(false);
  });
});

describe('factual scene integrity', () => {
  it('requires claim use to be reciprocal in both directions', () => {
    const project = validProject();
    project.scenes[0].claimIds = [];
    expect(errors(project)).toContain('scene does not reference that claim');
    project.scenes[0].claimIds = ['claim'];
    project.claims[0].usedInScenes = [];
    expect(errors(project)).toContain('claim does not list that scene');
    project.claims[0].usedInScenes = ['opening'];
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it('requires quantitative scene citations to include every dataset source', () => {
    const project = validProject();
    project.sources.push({ ...project.sources[0], id: 'second-source' });
    project.datasets[0].sourceIds.push('second-source');
    expect(errors(project)).toContain('must include dataset source second-source');
    project.scenes[1].sourceIds.push('second-source');
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it.each([0, -1])('rejects duplicated or reversed line x coordinate %s', (x) => {
    const project = validProject();
    project.datasets[0].points[1].x = x;
    expect(errors(project)).toContain('requires strictly increasing x values');
  });

  it('accepts interleaved series when each independently increases', () => {
    const project = validProject();
    project.datasets[0].points = [
      { x: 0, y: 2, series: 'A' },
      { x: 0, y: 3, series: 'B' },
      { x: 1, y: 4, series: 'A' },
      { x: 1, y: 5, series: 'B' },
    ];
    expect(ProjectSchema.safeParse(project).success).toBe(true);
    project.datasets[0].points[3].x = 0;
    expect(errors(project)).toContain('within series B');
  });

  it('does not impose a numeric x ordering on categorical bar data', () => {
    const project = validProject();
    const scene = project.scenes[1];
    if (scene.type !== 'line-chart') throw new Error('Expected chart');
    project.scenes[1] = { ...scene, type: 'bar-chart' };
    project.datasets[0].points[1].x = -1;
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it('rejects nonexistent line annotation points but accepts the final point', () => {
    const project = validProject();
    const scene = project.scenes[1];
    if (scene.type !== 'line-chart') throw new Error('Expected chart');
    scene.annotation = { index: 2, text: 'Outside' };
    expect(errors(project)).toContain('annotation index 2 is outside dataset');
    scene.annotation.index = 1;
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it('binds both comparison magnitudes to supplied dataset observations', () => {
    const project = validProject();
    const old = project.scenes[1];
    project.scenes[1] = {
      id: old.id,
      start: old.start,
      end: old.end,
      title: old.title,
      mode: 'CONTRAST',
      thesis: old.thesis,
      addedInformation: old.addedInformation,
      sourceIds: old.sourceIds,
      claimIds: [],
      beats: [],
      type: 'comparison',
      dataset: 'series',
      unit: 'units',
      left: { label: 'First', value: 2 },
      right: { label: 'Last', value: 5 },
    };
    expect(ProjectSchema.safeParse(project).success).toBe(true);
    project.scenes[1].left.value = 2.01;
    project.scenes[1].right.value = 6;
    expect(errors(project)).toContain('Comparison left value 2.01 is not present');
    expect(errors(project)).toContain('Comparison right value 6 is not present');
  });

  it('allows nonfactual custom scenes without source records or constrained custom props', () => {
    const project = validProject();
    project.claims = [];
    project.sources = [];
    project.datasets = [];
    project.scenes = [
      {
        id: 'metaphor',
        type: 'custom',
        renderer: 'metaphor',
        start: 0,
        end: 4,
        title: 'An abstract composition',
        mode: 'METAPHOR',
        thesis: 'An explicitly abstract visual.',
        addedInformation: 'Show relationships without numeric evidence.',
        sourceIds: [],
        claimIds: [],
        beats: [],
        props: { arbitrary: [-200, 800], settings: { style: 'project-specific' } },
      },
    ];
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });
});

describe('normalized framing and geographic coordinates', () => {
  const common = {
    id: 'frame',
    start: 0,
    end: 2,
    title: 'Coordinate example',
    mode: 'CONTEXT',
    thesis: 'Coordinates have explicit units.',
    addedInformation: 'Keep geographic and normalized spaces distinct.',
  };
  const image = { ...common, type: 'photo', asset: 'portrait', caption: 'Example' };
  const portrait = {
    ...common,
    type: 'portrait-duel',
    left: { asset: 'portrait', name: 'Left', role: 'Institution' },
    right: { asset: 'portrait', name: 'Right', role: 'Institution' },
  };
  const map = {
    ...common,
    type: 'geo-flow',
    asset: 'world',
    center: [56, 26],
    routes: [
      {
        id: 'route',
        points: [
          [50, 26],
          [57, 25],
        ],
        label: 'Schematic route',
      },
    ],
  };

  it('accepts normalized boundary positions and rejects out-of-range anchors/foci', () => {
    expect(SceneSchema.safeParse({ ...image, focus: [0, 1] }).success).toBe(true);
    expect(SceneSchema.safeParse({ ...image, focus: [-0.1, 0.5] }).success).toBe(false);
    expect(
      SceneSchema.safeParse({
        ...image,
        transition: {
          type: 'focus-through',
          reason: 'Follow the visual object.',
          anchor: [0.5, 1.1],
        },
      }).success,
    ).toBe(false);
    expect(
      SceneSchema.safeParse({ ...portrait, left: { ...portrait.left, position: [1.1, 0] } })
        .success,
    ).toBe(false);
  });

  it('requires source crop dimensions to be positive and contained in the source', () => {
    expect(
      SceneSchema.safeParse({ ...portrait, left: { ...portrait.left, crop: [0.1, 0.2, 0.9, 0.8] } })
        .success,
    ).toBe(true);
    for (const crop of [
      [0, 0, 0, 1],
      [0.8, 0, 0.3, 1],
      [0, 0.8, 1, 0.3],
      [-0.1, 0, 1, 1],
    ]) {
      expect(SceneSchema.safeParse({ ...portrait, left: { ...portrait.left, crop } }).success).toBe(
        false,
      );
    }
  });

  it('validates coordinate ranges in all geographic fields', () => {
    expect(
      SceneSchema.safeParse({ ...map, center: [-180, -90], fromCenter: [180, 90] }).success,
    ).toBe(true);
    const invalid = [
      { ...map, center: [181, 0] },
      { ...map, fromCenter: [0, -91] },
      {
        ...map,
        routes: [
          {
            ...map.routes[0],
            points: [
              [0, 0],
              [-181, 0],
            ],
          },
        ],
      },
      { ...map, places: [{ name: 'Impossible', coordinates: [0, 91] }] },
    ];
    for (const scene of invalid) expect(SceneSchema.safeParse(scene).success).toBe(false);
  });

  it('requires map assets to contain geography rather than any existing media', () => {
    const project = validProject();
    project.assets.push({
      id: 'world',
      file: 'assets/world.json',
      kind: 'data',
      role: 'data',
      acquired: '2026-10-03',
      license: 'Test fixture only',
    });
    const parsed = SceneSchema.parse({ ...map, id: 'history', start: 2, end: 4 });
    project.scenes[1] = parsed;
    expect(errors(project)).toContain('must have kind geojson or topojson');
    project.assets[0].kind = 'geojson';
    expect(ProjectSchema.safeParse(project).success).toBe(true);
    project.assets[0].kind = 'topojson';
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });
});
