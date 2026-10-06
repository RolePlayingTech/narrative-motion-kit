import { describe, expect, it } from 'vitest';
import {
  canRedistributeHistoricalLayer,
  historicalLayerAt,
  parseHistoricalMapManifest,
} from '../packages/maps/historical';

const manifestInput = {
  version: 1,
  crs: 'EPSG:4326',
  title: 'Test historical series',
  sources: [
    {
      id: 'source-open',
      title: 'Open source',
      url: 'https://example.org/open',
      license: 'CC BY 4.0',
      attribution: 'Example Institute',
      redistribution: 'allowed',
    },
    {
      id: 'source-restricted',
      title: 'Restricted source',
      url: 'https://example.org/restricted',
      license: 'CC BY-NC 2.0',
      attribution: 'Example Archive',
      redistribution: 'restricted',
    },
  ],
  layers: [
    {
      id: 'state-1600',
      series: 'state',
      asset: 'state-1600-geojson',
      label: 'State 1600',
      kind: 'political',
      startYear: 1600,
      endYear: 1650,
      sourceIds: ['source-open'],
      confidence: 'reconstructed',
    },
    {
      id: 'state-1650',
      series: 'state',
      asset: 'state-1650-geojson',
      label: 'State 1650',
      kind: 'political',
      startYear: 1650,
      endYear: null,
      sourceIds: ['source-restricted'],
      confidence: 'documented',
    },
  ],
};

describe('historical map manifests', () => {
  it('selects half-open time layers and preserves license information', () => {
    const manifest = parseHistoricalMapManifest(manifestInput);
    expect(historicalLayerAt(manifest, 'state', 1649)?.id).toBe('state-1600');
    expect(historicalLayerAt(manifest, 'state', 1650)?.id).toBe('state-1650');
    expect(historicalLayerAt(manifest, 'missing', 1650)).toBeUndefined();
    expect(canRedistributeHistoricalLayer(manifest, manifest.layers[0])).toBe(true);
    expect(canRedistributeHistoricalLayer(manifest, manifest.layers[1])).toBe(false);
  });

  it('rejects overlapping layers within one historical series', () => {
    const input = structuredClone(manifestInput);
    input.layers[0].endYear = 1660;
    expect(() => parseHistoricalMapManifest(input)).toThrow('overlapping historical layers');
  });

  it('rejects missing sources and unsupported CRS values', () => {
    const missing = structuredClone(manifestInput);
    missing.layers[0].sourceIds = ['does-not-exist'];
    expect(() => parseHistoricalMapManifest(missing)).toThrow('unknown historical map source');

    const wrongCrs = structuredClone(manifestInput) as Record<string, unknown>;
    wrongCrs.crs = 'EPSG:3857';
    expect(() => parseHistoricalMapManifest(wrongCrs)).toThrow('EPSG:4326');
  });
});
