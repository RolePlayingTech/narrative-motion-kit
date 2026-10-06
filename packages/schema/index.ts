import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const finite = z.number().finite();
const localPath = z
  .string()
  .min(1)
  .refine(
    (s) => !/^(?:[a-z]+:|\/|\\)/i.test(s) && !s.split(/[\\/]/).includes('..'),
    'Use a project-relative local path without ..',
  );
const normalizedPoint = z.tuple([finite.min(0).max(1), finite.min(0).max(1)]);
const geographicPoint = z.tuple([finite.min(-180).max(180), finite.min(-90).max(90)]);
const normalizedCrop = z
  .tuple([
    finite.min(0).max(1),
    finite.min(0).max(1),
    finite.positive().max(1),
    finite.positive().max(1),
  ])
  .superRefine(([x, y, width, height], ctx) => {
    if (x + width > 1 + 1e-9)
      ctx.addIssue({ code: 'custom', message: 'Crop x + width must not exceed 1' });
    if (y + height > 1 + 1e-9)
      ctx.addIssue({ code: 'custom', message: 'Crop y + height must not exceed 1' });
  });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const SourceSchema = z
  .object({
    id,
    title: z.string().min(1),
    url: z.string().url(),
    publisher: z.string(),
    retrieved: date,
    note: z.string().optional(),
  })
  .strict();
export const AssetSchema = z
  .object({
    id,
    file: localPath,
    kind: z.enum(['image', 'svg', 'geojson', 'topojson', 'data', 'video', 'audio']),
    role: z.enum(['documentary', 'illustrative', 'generated', 'data']),
    sourceUrl: z.string().url().optional(),
    acquired: date,
    author: z.string().optional(),
    license: z.string().min(1),
    originalFilename: z.string().optional(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    width: finite.positive().optional(),
    height: finite.positive().optional(),
    prompt: z.string().optional(),
    generator: z.string().optional(),
    note: z.string().optional(),
  })
  .strict()
  .superRefine((asset, ctx) => {
    if (asset.role === 'generated' && !asset.prompt)
      ctx.addIssue({
        code: 'custom',
        message: 'Generated assets require the generation prompt',
        path: ['prompt'],
      });
  });
export const ClaimSchema = z
  .object({
    id,
    text: z.string().min(1),
    sourceIds: z.array(id).min(1),
    status: z.enum(['verified', 'estimate', 'interpretation', 'political-claim', 'illustrative']),
    confidence: z.enum(['high', 'medium', 'low']),
    notes: z.string().optional(),
    numericData: z.array(finite).optional(),
    usedInScenes: z.array(id),
  })
  .strict();
export const DatasetSchema = z
  .object({
    id,
    title: z.string(),
    sourceIds: z.array(id).min(1),
    unit: z.string(),
    status: z.enum(['verified', 'estimate', 'illustrative']),
    points: z
      .array(
        z
          .object({
            x: finite,
            y: finite,
            label: z.string().optional(),
            series: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
    note: z.string().optional(),
  })
  .strict();
export const CameraSchema = z
  .object({
    from: z
      .object({
        x: finite.default(0),
        y: finite.default(0),
        zoom: finite.positive().default(1),
        rotation: finite.default(0),
      })
      .strict(),
    to: z
      .object({
        x: finite.default(0),
        y: finite.default(0),
        zoom: finite.positive().default(1),
        rotation: finite.default(0),
      })
      .strict(),
    start: finite.nonnegative().default(0),
    end: finite.positive(),
  })
  .strict();
export const TransitionSchema = z
  .object({
    type: z.enum(['cut', 'match-cut', 'focus-through', 'route-to-line', 'bar-to-layer']),
    duration: finite.min(0).max(1.5).default(0.45),
    reason: z.string().min(8),
    anchor: normalizedPoint.default([0.5, 0.5]),
  })
  .strict();
const common = {
  id,
  start: finite.nonnegative(),
  end: finite.positive(),
  title: z.string().min(1).max(160),
  kicker: z.string().max(100).optional(),
  subtitle: z.string().max(240).optional(),
  tone: z.enum(['dark', 'paper']).optional(),
  mode: z.enum([
    'EVIDENCE',
    'MECHANISM',
    'SCALE',
    'CONTEXT',
    'CHARACTER',
    'CONTRAST',
    'METAPHOR',
    'TRANSITION',
  ]),
  thesis: z.string().min(8),
  addedInformation: z.string().min(8),
  sourceIds: z.array(id).default([]),
  claimIds: z.array(id).default([]),
  beats: z
    .array(z.object({ at: finite.nonnegative(), label: z.string().min(1) }).strict())
    .default([]),
  transition: TransitionSchema.optional(),
  camera: CameraSchema.optional(),
  vertical: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      hidden: z.array(z.string()).default([]),
    })
    .strict()
    .optional(),
};
const person = z
  .object({
    asset: id,
    name: z.string(),
    role: z.string(),
    position: normalizedPoint.optional(),
    crop: normalizedCrop.optional(),
  })
  .strict();
const node = z
  .object({
    id,
    label: z.string(),
    detail: z.string().optional(),
    icon: z.enum(['oil', 'refinery', 'ship', 'pump', 'money', 'document']).optional(),
  })
  .strict();
export const SceneSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...common,
      type: z.literal('statistic'),
      value: finite,
      from: finite.default(0),
      decimals: z.number().int().min(0).max(4).default(0),
      unit: z.string(),
      label: z.string(),
      variant: z.enum(['editorial', 'pump', 'split']).default('editorial'),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('portrait-duel'),
      left: person,
      right: person,
      centerLabel: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('photo'),
      asset: id,
      caption: z.string(),
      focus: normalizedPoint.default([0.5, 0.5]),
      treatment: z.enum(['archive', 'fullbleed', 'cutout']).default('archive'),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('evidence'),
      heading: z.string(),
      body: z.array(z.string()).min(1).max(8),
      highlight: z.string(),
      attribution: z.string(),
      asset: id.optional(),
      documentLabel: z.string().default('DOKUMENT ŹRÓDŁOWY'),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('flow'),
      nodes: z.array(node).min(2).max(8),
      edges: z
        .array(
          z
            .object({
              from: id,
              to: id,
              label: z.string().optional(),
              value: finite.positive().optional(),
            })
            .strict(),
        )
        .min(1),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('breakdown'),
      dataset: id,
      totalLabel: z.string(),
      orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('line-chart'),
      dataset: id,
      yDomain: z.tuple([finite, finite]).optional(),
      xLabel: z.string(),
      yLabel: z.string(),
      annotation: z
        .object({ index: z.number().int().nonnegative(), text: z.string() })
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('bar-chart'),
      dataset: id,
      xLabel: z.string(),
      yLabel: z.string(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('geo-flow'),
      asset: id,
      center: geographicPoint,
      zoom: finite.positive().default(1),
      projection: z.enum(['mercator', 'equal-earth']).default('mercator'),
      fromCenter: geographicPoint.optional(),
      fromZoom: finite.positive().optional(),
      composition: z.enum(['map', 'atlas']).default('map'),
      locatorAsset: id.optional(),
      cartographyLabel: z.string().max(140).optional(),
      routes: z.array(
        z
          .object({
            id,
            points: z.array(geographicPoint).min(2),
            label: z.string(),
            strength: finite.min(0).max(1).default(1),
            surface: z.enum(['schematic', 'sea']).default('schematic'),
          })
          .strict(),
      ),
      places: z
        .array(
          z
            .object({
              name: z.string(),
              coordinates: geographicPoint,
              emphasis: z.boolean().default(false),
              kind: z.enum(['place', 'country', 'water']).default('place'),
              offset: z.tuple([finite.min(-500).max(500), finite.min(-500).max(500)]).optional(),
            })
            .strict(),
        )
        .default([]),
      metric: z
        .object({ value: z.string(), label: z.string(), context: z.string().optional() })
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('timeline'),
      events: z
        .array(
          z
            .object({
              date: z.string(),
              label: z.string(),
              detail: z.string().optional(),
              asset: id.optional(),
            })
            .strict(),
        )
        .min(2)
        .max(8),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('comparison'),
      left: z.object({ label: z.string(), value: finite, detail: z.string().optional() }).strict(),
      right: z.object({ label: z.string(), value: finite, detail: z.string().optional() }).strict(),
      unit: z.string(),
      dataset: id,
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal('custom'),
      renderer: id,
      props: z.record(z.unknown()).default({}),
    })
    .strict(),
]);
export const ProjectSchema = z
  .object({
    version: z.literal(1),
    id,
    title: z.string().min(1),
    language: z.string().default('pl-PL'),
    seed: z.number().int(),
    resolution: z
      .object({
        width: z.number().int().min(240).max(7680),
        height: z.number().int().min(240).max(7680),
      })
      .strict(),
    fps: z.number().int().min(1).max(120),
    duration: finite.positive(),
    theme: z.enum(['editorial', 'archive', 'technical', 'reportage', 'atlas']).default('editorial'),
    narration: z
      .object({
        file: localPath.optional(),
        transcript: localPath.optional(),
        kind: z.enum(['recorded', 'synthetic', 'silent-demo']),
        note: z.string().optional(),
      })
      .strict(),
    assets: z.array(AssetSchema).default([]),
    sources: z.array(SourceSchema).default([]),
    claims: z.array(ClaimSchema).default([]),
    datasets: z.array(DatasetSchema).default([]),
    scenes: z.array(SceneSchema).min(1),
  })
  .strict()
  .superRefine((p, ctx) => {
    const issue = (message: string, path: (string | number)[] = []) =>
      ctx.addIssue({ code: 'custom', message, path });
    const unique = (items: { id: string }[], name: string) => {
      const set = new Set<string>();
      items.forEach((v, i) => {
        if (set.has(v.id)) issue(`Duplicate ${name} id: ${v.id}`, [name, i]);
        set.add(v.id);
      });
      return set;
    };
    const assets = unique(p.assets, 'assets'),
      sources = unique(p.sources, 'sources'),
      claims = unique(p.claims, 'claims'),
      datasets = unique(p.datasets, 'datasets'),
      scenes = unique(p.scenes, 'scenes');
    const refs = (refs: string[], set: Set<string>, label: string, path: (string | number)[]) =>
      refs.forEach((ref) => {
        if (!set.has(ref)) issue(`Unknown ${label}: ${ref}`, path);
      });
    if (p.resolution.width % 2 || p.resolution.height % 2)
      issue('H.264 resolution dimensions must be even', ['resolution']);
    if (p.narration.kind !== 'silent-demo' && !p.narration.file)
      issue('Narration file required for recorded/synthetic projects', ['narration']);
    p.datasets.forEach((d, i) => refs(d.sourceIds, sources, 'source', ['datasets', i]));
    p.claims.forEach((c, i) => {
      refs(c.sourceIds, sources, 'source', ['claims', i]);
      refs(c.usedInScenes, scenes, 'scene', ['claims', i]);
      c.usedInScenes.forEach((sceneId) => {
        const scene = p.scenes.find((s) => s.id === sceneId);
        if (scene && !scene.claimIds.includes(c.id))
          issue(
            `Claim ${c.id} lists scene ${sceneId}, but the scene does not reference that claim`,
            ['claims', i, 'usedInScenes'],
          );
      });
    });
    let cursor = 0;
    p.scenes.forEach((s, i) => {
      const path = ['scenes', i];
      if (Math.abs(s.start - cursor) > 1e-6)
        issue(
          `${s.id}: timeline ${s.start < cursor ? 'overlap' : 'gap'} at ${cursor.toFixed(3)}s`,
          path,
        );
      if (s.end <= s.start) issue(`${s.id}: end must be after start`, path);
      cursor = s.end;
      refs(s.sourceIds, sources, 'source', path);
      refs(s.claimIds, claims, 'claim', path);
      s.claimIds.forEach((claimId) => {
        const claim = p.claims.find((c) => c.id === claimId);
        if (claim && !claim.usedInScenes.includes(s.id))
          issue(
            `Scene ${s.id} references claim ${claimId}, but the claim does not list that scene`,
            [...path, 'claimIds'],
          );
      });
      if (s.camera && s.camera.end <= s.camera.start) issue('Camera end must exceed start', path);
      if (s.camera && s.camera.end > s.end - s.start)
        issue('Camera animation exceeds scene duration', path);
      if (s.beats.some((b) => b.at >= s.end - s.start)) issue('Beat outside scene', path);
      if (s.beats.some((b, index) => index > 0 && b.at <= s.beats[index - 1].at))
        issue('Beat times must strictly increase', path);
      if (s.transition && s.transition.duration > s.end - s.start)
        issue('Transition longer than scene', path);
      if (i > 0 && s.transition && s.transition.type !== 'cut') {
        const previous = p.scenes[i - 1];
        const layered = (scene: typeof s) =>
          scene.type === 'custom' &&
          ['globe', 'particle-flow', 'document-dom'].includes(scene.renderer);
        if (layered(previous) || layered(s))
          issue('Layered custom scenes require cut transitions', path);
        if (
          s.transition.type === 'route-to-line' &&
          (!['geo-flow', 'line-chart'].includes(previous.type) ||
            !['geo-flow', 'line-chart'].includes(s.type))
        )
          issue('route-to-line requires geographic or chart lines on both sides', path);
        if (
          s.transition.type === 'bar-to-layer' &&
          (!['bar-chart', 'breakdown'].includes(previous.type) ||
            !['bar-chart', 'breakdown'].includes(s.type))
        )
          issue('bar-to-layer requires bar-chart or breakdown on both sides', path);
      }
      if ('dataset' in s) {
        refs([s.dataset], datasets, 'dataset', path);
        const dataset = p.datasets.find((d) => d.id === s.dataset);
        if (dataset)
          dataset.sourceIds.forEach((sourceId) => {
            if (!s.sourceIds.includes(sourceId))
              issue(`Scene ${s.id} must include dataset source ${sourceId}`, [
                ...path,
                'sourceIds',
              ]);
          });
      }
      if ('asset' in s && s.asset) refs([s.asset], assets, 'asset', path);
      if (s.type === 'portrait-duel') refs([s.left.asset, s.right.asset], assets, 'asset', path);
      if (s.type === 'timeline')
        refs(
          s.events.flatMap((e) => (e.asset ? [e.asset] : [])),
          assets,
          'asset',
          path,
        );
      if (
        ['statistic', 'comparison', 'breakdown', 'line-chart', 'bar-chart'].includes(s.type) &&
        s.sourceIds.length === 0
      )
        issue('Quantitative scenes require sourceIds, including illustrative examples', path);
      if (s.type === 'line-chart' && s.yDomain && s.yDomain[0] >= s.yDomain[1])
        issue('yDomain must be increasing', path);
      if (s.type === 'line-chart') {
        const dataset = p.datasets.find((d) => d.id === s.dataset);
        if (dataset) {
          if (
            s.yDomain &&
            dataset.points.some((point) => point.y < s.yDomain![0] || point.y > s.yDomain![1])
          )
            issue(
              'yDomain must include all supplied observations; do not silently crop data',
              path,
            );
          const previousX = new Map<string, number>();
          dataset.points.forEach((point, index) => {
            const series = point.series ?? '',
              previous = previousX.get(series);
            if (previous !== undefined && point.x <= previous)
              issue(
                `Line-chart ${s.id} requires strictly increasing x values within series ${series || '(default)'}; point ${index} is out of order or duplicated`,
                [...path, 'dataset'],
              );
            previousX.set(series, point.x);
          });
          if (s.annotation && s.annotation.index >= dataset.points.length)
            issue(
              `Line-chart annotation index ${s.annotation.index} is outside dataset ${dataset.id}`,
              [...path, 'annotation', 'index'],
            );
        }
      }
      if (s.type === 'comparison') {
        if (s.left.value < 0 || s.right.value < 0)
          issue('Comparison magnitudes must be nonnegative; use bar-chart for signed values', path);
        const dataset = p.datasets.find((d) => d.id === s.dataset);
        if (dataset)
          for (const side of ['left', 'right'] as const) {
            if (!dataset.points.some((point) => point.y === s[side].value))
              issue(
                `Comparison ${side} value ${s[side].value} is not present in dataset ${dataset.id}`,
                [...path, side, 'value'],
              );
          }
      }
      if (s.type === 'geo-flow') {
        if (s.locatorAsset) refs([s.locatorAsset], assets, 'asset', path);
        const asset = p.assets.find((a) => a.id === s.asset);
        if (asset && !['geojson', 'topojson'].includes(asset.kind))
          issue(`geo-flow asset ${asset.id} must have kind geojson or topojson`, [
            ...path,
            'asset',
          ]);
      }
      if (s.type === 'flow') {
        const nodes = new Set(s.nodes.map((n) => n.id));
        if (nodes.size !== s.nodes.length) issue('Duplicate flow node', path);
        s.edges.forEach((e) => refs([e.from, e.to], nodes, 'node', path));
      }
      if (s.type === 'breakdown') {
        const d = p.datasets.find((d) => d.id === s.dataset);
        if (d && (d.points.some((v) => v.y < 0) || d.points.reduce((a, v) => a + v.y, 0) <= 0))
          issue('Breakdown requires nonnegative parts and positive sum', path);
      }
    });
    if (Math.abs(cursor - p.duration) > 1e-6)
      issue(`Timeline ends at ${cursor}s, narration duration is ${p.duration}s`, ['duration']);
  });
export type Project = z.infer<typeof ProjectSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type SceneOf<T extends Scene['type']> = Extract<Scene, { type: T }>;
export type Transition = z.infer<typeof TransitionSchema>;
export type CameraSpec = z.infer<typeof CameraSchema>;
export function parseProject(value: unknown): Project {
  return ProjectSchema.parse(value);
}
