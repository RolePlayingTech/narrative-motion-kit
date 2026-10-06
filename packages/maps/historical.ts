export type HistoricalBoundaryConfidence = 'documented' | 'reconstructed' | 'approximate';
export type HistoricalBoundaryKind =
  | 'political'
  | 'administrative'
  | 'military-control'
  | 'territorial-claim'
  | 'cultural'
  | 'trade'
  | 'other';
export type RedistributionStatus = 'allowed' | 'restricted' | 'unknown';

export interface HistoricalMapSource {
  id: string;
  title: string;
  url: string;
  license: string;
  attribution: string;
  publisher?: string;
  acquiredAt?: string;
  redistribution: RedistributionStatus;
  notes?: string;
}

export interface HistoricalBoundaryLayer {
  id: string;
  series: string;
  asset: string;
  label: string;
  kind: HistoricalBoundaryKind;
  startYear: number;
  /** Exclusive. Use null when the layer remains valid indefinitely. */
  endYear: number | null;
  sourceIds: string[];
  confidence: HistoricalBoundaryConfidence;
  cartographyLabel?: string;
  notes?: string;
}

export interface HistoricalMapManifest {
  version: 1;
  crs: 'EPSG:4326';
  title: string;
  sources: HistoricalMapSource[];
  layers: HistoricalBoundaryLayer[];
}

const ID = /^[a-z0-9][a-z0-9._-]*$/;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}
function idValue(value: unknown, label: string): string {
  const valueAsString = stringValue(value, label);
  if (!ID.test(valueAsString)) throw new Error(`${label} must match ${ID}`);
  return valueAsString;
}
function integerValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new Error(`${label} must be an integer year`);
  return value;
}
function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return stringValue(value, label);
}
function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${label} must be a non-empty array`);
  return value.map((item, index) => idValue(item, `${label}[${index}]`));
}

const confidenceValues = new Set<HistoricalBoundaryConfidence>([
  'documented',
  'reconstructed',
  'approximate',
]);
const kindValues = new Set<HistoricalBoundaryKind>([
  'political',
  'administrative',
  'military-control',
  'territorial-claim',
  'cultural',
  'trade',
  'other',
]);
const redistributionValues = new Set<RedistributionStatus>(['allowed', 'restricted', 'unknown']);

function enumValue<T extends string>(value: unknown, label: string, allowed: Set<T>): T {
  const item = stringValue(value, label) as T;
  if (!allowed.has(item)) throw new Error(`${label} has unsupported value: ${item}`);
  return item;
}

/**
 * Parse and semantically validate the sidecar manifest used for historical map assets.
 *
 * The manifest intentionally lives outside the main project schema: one historical
 * dataset can be reused by many films, and its provenance/licensing must survive
 * independently of any one project.
 */
export function parseHistoricalMapManifest(input: unknown): HistoricalMapManifest {
  const root = record(input, 'historical map manifest');
  if (root.version !== 1) throw new Error('historical map manifest version must be 1');
  if (root.crs !== 'EPSG:4326') throw new Error('historical map manifest CRS must be EPSG:4326');
  const title = stringValue(root.title, 'title');

  if (!Array.isArray(root.sources)) throw new Error('sources must be an array');
  const sources: HistoricalMapSource[] = root.sources.map((raw, index) => {
    const item = record(raw, `sources[${index}]`);
    return {
      id: idValue(item.id, `sources[${index}].id`),
      title: stringValue(item.title, `sources[${index}].title`),
      url: stringValue(item.url, `sources[${index}].url`),
      license: stringValue(item.license, `sources[${index}].license`),
      attribution: stringValue(item.attribution, `sources[${index}].attribution`),
      publisher: optionalString(item.publisher, `sources[${index}].publisher`),
      acquiredAt: optionalString(item.acquiredAt, `sources[${index}].acquiredAt`),
      redistribution: enumValue(
        item.redistribution,
        `sources[${index}].redistribution`,
        redistributionValues,
      ),
      notes: optionalString(item.notes, `sources[${index}].notes`),
    };
  });

  if (!Array.isArray(root.layers) || root.layers.length === 0)
    throw new Error('layers must be a non-empty array');
  const layers: HistoricalBoundaryLayer[] = root.layers.map((raw, index) => {
    const item = record(raw, `layers[${index}]`);
    const endYear =
      item.endYear === null ? null : integerValue(item.endYear, `layers[${index}].endYear`);
    const layer: HistoricalBoundaryLayer = {
      id: idValue(item.id, `layers[${index}].id`),
      series: idValue(item.series, `layers[${index}].series`),
      asset: idValue(item.asset, `layers[${index}].asset`),
      label: stringValue(item.label, `layers[${index}].label`),
      kind: enumValue(item.kind, `layers[${index}].kind`, kindValues),
      startYear: integerValue(item.startYear, `layers[${index}].startYear`),
      endYear,
      sourceIds: stringArray(item.sourceIds, `layers[${index}].sourceIds`),
      confidence: enumValue(
        item.confidence,
        `layers[${index}].confidence`,
        confidenceValues,
      ),
      cartographyLabel: optionalString(
        item.cartographyLabel,
        `layers[${index}].cartographyLabel`,
      ),
      notes: optionalString(item.notes, `layers[${index}].notes`),
    };
    if (layer.endYear !== null && layer.endYear <= layer.startYear)
      throw new Error(`${layer.id}: endYear must be greater than startYear`);
    return layer;
  });

  const unique = <T extends { id: string }>(items: T[], label: string) => {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) throw new Error(`duplicate ${label} id: ${item.id}`);
      ids.add(item.id);
    }
    return ids;
  };
  const sourceIds = unique(sources, 'source');
  unique(layers, 'layer');

  for (const layer of layers)
    for (const sourceId of layer.sourceIds)
      if (!sourceIds.has(sourceId))
        throw new Error(`${layer.id}: unknown historical map source: ${sourceId}`);

  const bySeries = new Map<string, HistoricalBoundaryLayer[]>();
  for (const layer of layers) {
    const list = bySeries.get(layer.series) ?? [];
    list.push(layer);
    bySeries.set(layer.series, list);
  }
  for (const [series, list] of bySeries) {
    const ordered = [...list].sort((a, b) => a.startYear - b.startYear);
    for (let i = 1; i < ordered.length; i++) {
      const previous = ordered[i - 1];
      const current = ordered[i];
      if (previous.endYear === null || previous.endYear > current.startYear)
        throw new Error(
          `${series}: overlapping historical layers ${previous.id} and ${current.id}`,
        );
    }
  }

  return { version: 1, crs: 'EPSG:4326', title, sources, layers };
}

export function historicalLayerAt(
  manifest: HistoricalMapManifest,
  series: string,
  year: number,
): HistoricalBoundaryLayer | undefined {
  if (!Number.isInteger(year)) throw new Error('historical map lookup year must be an integer');
  return manifest.layers.find(
    (layer) =>
      layer.series === series &&
      year >= layer.startYear &&
      (layer.endYear === null || year < layer.endYear),
  );
}

export function historicalLayerSources(
  manifest: HistoricalMapManifest,
  layer: HistoricalBoundaryLayer,
): HistoricalMapSource[] {
  const byId = new Map(manifest.sources.map((source) => [source.id, source]));
  return layer.sourceIds.map((id) => {
    const source = byId.get(id);
    if (!source) throw new Error(`${layer.id}: missing source ${id}`);
    return source;
  });
}

/**
 * Repo-safe means the source explicitly allows redistribution. This does not decide
 * whether a film or other downstream use is permitted; agents must still read the license.
 */
export function canRedistributeHistoricalLayer(
  manifest: HistoricalMapManifest,
  layer: HistoricalBoundaryLayer,
): boolean {
  return historicalLayerSources(manifest, layer).every(
    (source) => source.redistribution === 'allowed',
  );
}
