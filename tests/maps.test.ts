import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { geoArea } from 'd3-geo';
import sharp from 'sharp';
import type { Feature, Polygon } from 'geojson';
import {
  classifyLand,
  geoCameraFlight,
  greatCircle,
  mapPaths,
  normalizeGeometry,
  routeLandCrossings,
} from '../packages/maps/index';

const rfcPolygon: Feature<Polygon> = {
  type: 'Feature',
  properties: { name: 'RFC 7946 exterior and hole' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [2, 2],
        [2, 4],
        [4, 4],
        [4, 2],
        [2, 2],
      ],
    ],
  },
};

describe('geographic data preparation', () => {
  it('accepts RFC 7946 and D3 winding without turning the ocean into land', () => {
    const original = structuredClone(rfcPolygon);
    const a = normalizeGeometry(rfcPolygon);
    const reversed = structuredClone(rfcPolygon);
    reversed.geometry.coordinates.forEach((ring) => ring.reverse());
    const b = normalizeGeometry(reversed);
    for (const geometry of [a, b]) {
      expect(classifyLand(geometry, [6, 6])).toBe(true);
      expect(classifyLand(geometry, [3, 3])).toBe(false);
      expect(classifyLand(geometry, [-20, 0])).toBe(false);
      expect(geoArea(geometry)).toBeLessThan(0.04);
    }
    expect(a).toEqual(b);
    expect(rfcPolygon).toEqual(original);
  });

  it('can preserve intentional spherical regions larger than a hemisphere', () => {
    const geometry = normalizeGeometry(rfcPolygon, { winding: 'preserve' });
    expect(geoArea(geometry)).toBeGreaterThan(2 * Math.PI);
  });

  it('selects country layers by name and wraps single-feature topologies', () => {
    const topology = {
      type: 'Topology',
      objects: {
        unrelated: { type: 'Point', coordinates: [90, 0] },
        countries: { type: 'Polygon', arcs: [[0]] },
      },
      arcs: [
        [
          [0, 0],
          [0, 10],
          [10, 10],
          [10, 0],
          [0, 0],
        ],
      ],
    };
    const geometry = normalizeGeometry(topology);
    expect(geometry.features).toHaveLength(1);
    expect(classifyLand(geometry, [5, 5])).toBe(true);
    expect(
      normalizeGeometry(topology, { objectName: 'unrelated' }).features[0].geometry?.type,
    ).toBe('Point');
    expect(() => normalizeGeometry(topology, { objectName: 'missing' })).toThrow('no object named');
    expect(() =>
      normalizeGeometry({
        ...topology,
        objects: {
          rivers: topology.objects.unrelated,
          lakes: topology.objects.unrelated,
        },
      }),
    ).toThrow('Ambiguous');
  });
});

describe('real Hormuz coastline regressions', () => {
  const regional = normalizeGeometry(
    JSON.parse(
      readFileSync(
        new URL(
          '../projects/demo-fuel-prices/assets/hormuz-natural-earth-10m.geojson',
          import.meta.url,
        ),
        'utf8',
      ),
    ),
  );
  const global = normalizeGeometry(
    JSON.parse(
      readFileSync(
        new URL('../projects/demo-fuel-prices/assets/world-50m.topo.json', import.meta.url),
        'utf8',
      ),
    ),
  );
  const locations: [string, [number, number], boolean][] = [
    ['Iran mainland', [57, 28], true],
    ['Musandam peninsula / Khasab', [56.25, 26.18], true],
    ['UAE mainland', [55.5, 24.8], true],
    ['Qeshm island', [55.75, 26.72], true],
    ['Strait of Hormuz channel', [56.5, 26.55], false],
    ['Persian Gulf', [52.5, 26.5], false],
    ['Gulf of Oman', [58.5, 25], false],
    ['Arabian Sea', [62, 20], false],
  ];

  it.each(locations)(
    'classifies %s correctly in the local 10m geography',
    (_, coordinate, expected) => {
      expect(classifyLand(regional, coordinate)).toBe(expected);
    },
  );

  it('keeps existing world-atlas geography correctly oriented', () => {
    expect(classifyLand(global, [57, 28])).toBe(true);
    expect(classifyLand(global, [56.5, 26.55])).toBe(false);
    expect(classifyLand(global, [62, 20])).toBe(false);
  });

  it('preserves polar-cap topology in the global locator raster', async () => {
    const map = mapPaths(global, { width: 445, height: 175, center: [50, 27], zoom: 3.7 });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="445" height="175"><rect width="445" height="175" fill="#000"/><path d="${map.land}" fill="#fff"/></svg>`;
    const { data, info } = await sharp(Buffer.from(svg))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const [coordinate, isLand] of [
      [[62, 20], false],
      [[57, 28], true],
    ] as [[number, number], boolean][]) {
      const [x, y] = map.project(coordinate).map(Math.round);
      expect(data[(y * 445 + x) * info.channels] > 127).toBe(isLand);
    }
  });

  it('detects a sea route crossing land between offshore endpoints', () => {
    expect(
      routeLandCrossings(regional, [
        [54, 25],
        [58.5, 25],
      ]),
    ).not.toHaveLength(0);
    const project = JSON.parse(
      readFileSync(new URL('../projects/demo-fuel-prices/project.json', import.meta.url), 'utf8'),
    );
    const route = project.scenes.find((scene: { id: string }) => scene.id === 'hormuz').routes[0];
    expect(routeLandCrossings(regional, route.points)).toHaveLength(0);
  });

  it('renders Iran as land and both gulf waters as water in the actual SVG path', async () => {
    const width = 1000,
      height = 650;
    const map = mapPaths(regional, { width, height, center: [56.3, 26.3], zoom: 32 });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/><path d="${map.land}" fill="#fff"/></svg>`;
    const { data, info } = await sharp(Buffer.from(svg))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const [name, coordinate, expected] of locations.slice(0, 7)) {
      const [x, y] = map.project(coordinate).map(Math.round);
      expect(x, name).toBeGreaterThanOrEqual(0);
      expect(y, name).toBeGreaterThanOrEqual(0);
      expect(x, name).toBeLessThan(width);
      expect(y, name).toBeLessThan(height);
      const pixel = data[(y * width + x) * info.channels];
      expect(pixel > 127, name).toBe(expected);
    }
  });
});

describe('geographic projection and flights', () => {
  const empty = normalizeGeometry({ type: 'FeatureCollection', features: [] });

  it('keeps Pacific routes continuous when the viewport is centered on the antimeridian', () => {
    const map = mapPaths(empty, { width: 800, height: 500, center: [180, 0], zoom: 10 });
    expect(map.project([180, 0])).toEqual([400, 250]);
    expect(Math.abs(map.project([179, 0])[0] - map.project([-179, 0])[0])).toBeLessThan(50);
    const path = map.route([
      [179, 0],
      [-179, 0],
    ]);
    expect(path.match(/M/g)).toHaveLength(1);
    expect(path).not.toMatch(/NaN|Infinity/);
  });

  it('supports an equal-area projection for historical area comparisons', () => {
    const map = mapPaths(empty, {
      width: 800,
      height: 500,
      center: [0, 0],
      zoom: 4,
      projection: 'equal-earth',
    });
    const [centerX, centerY] = map.project([0, 0]);
    expect(centerX).toBeCloseTo(400);
    expect(centerY).toBeCloseTo(250);
    expect(map.land).not.toMatch(/NaN|Infinity/);
    expect(map.graticule).not.toMatch(/NaN|Infinity/);
    expect(() =>
      mapPaths(empty, {
        width: 800,
        height: 500,
        center: [0, 91],
        zoom: 4,
        projection: 'equal-earth',
      }),
    ).toThrow('90°S');
  });

  it('clips projected routes to the viewport and keeps north up', () => {
    const map = mapPaths(empty, { width: 800, height: 500, center: [0, 0], zoom: 10 });
    expect(
      map.route([
        [-45, 0],
        [45, 0],
      ]),
    ).toMatch(/^M0,250.*800,250$/);
    expect(map.project([0, 1])[1]).toBeLessThan(250);
    expect(() => mapPaths(empty, { width: 800, height: 500, center: [0, 90], zoom: 10 })).toThrow(
      'Mercator',
    );
    expect(() => mapPaths(empty, { width: 800, height: 500, center: [0, 0], zoom: 0 })).toThrow(
      'positive',
    );
  });

  it('clamps the whole camera flight, including zoom, and rejects invalid route sampling', () => {
    const from = { center: [0, 0] as [number, number], zoom: 1 };
    const to = { center: [56, 26] as [number, number], zoom: 9 };
    expect(geoCameraFlight(from, to, -1)).toEqual(from);
    expect(geoCameraFlight(from, to, 2).zoom).toBeCloseTo(9);
    expect(() => greatCircle([0, 0], [90, 0], 1)).toThrow('two samples');
  });
});
