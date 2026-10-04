import { geoArea, geoContains, geoMercator, geoPath, geoGraticule, geoInterpolate } from 'd3-geo';
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

export interface GeometryOptions {
  /** Explicit object selection for topologies containing multiple map layers. */
  objectName?: string;
  /** Preserve only for intentionally authored spherical polygons larger than a hemisphere. */
  winding?: 'small-polygons' | 'preserve';
}

/** D3 uses the opposite ring winding to RFC 7946 GeoJSON. Never mutate source geometry. */
function orientRings(rings: Position[][]): Position[][] {
  // Judge the complete polygon, including holes. World-atlas represents the
  // Antarctic polar cap with a sphere boundary and a complementary ring;
  // reversing rings individually turns that valid cap into the entire ocean.
  const reverse = geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI;
  return rings.map((ring) => (reverse ? [...ring].reverse() : [...ring]));
}

function orientGeometry(geometry: Geometry | null): Geometry | null {
  if (!geometry) return null;
  if (geometry.type === 'Polygon')
    return { ...geometry, coordinates: orientRings(geometry.coordinates) };
  if (geometry.type === 'MultiPolygon')
    return { ...geometry, coordinates: geometry.coordinates.map(orientRings) };
  if (geometry.type === 'GeometryCollection')
    return { ...geometry, geometries: geometry.geometries.map((part) => orientGeometry(part)!) };
  return geometry;
}

/** Prepare smaller-than-hemisphere land polygons in either D3 or RFC 7946 winding. */
export function normalizeGeometry(
  input: unknown,
  options: GeometryOptions = {},
): FeatureCollection {
  let value = input as { type?: string; objects?: Record<string, unknown> };
  if (value?.type === 'Topology') {
    const topology = input as Topology<{ [key: string]: GeometryCollection }>;
    const keys = Object.keys(topology.objects);
    if (!keys.length) throw new Error('TopoJSON has no objects');
    const key =
      options.objectName ??
      (keys.includes('countries') ? 'countries' : keys.includes('land') ? 'land' : keys[0]);
    if (!topology.objects[key]) throw new Error(`TopoJSON has no object named ${key}`);
    if (!options.objectName && keys.length > 1 && !['countries', 'land'].includes(key))
      throw new Error(
        'Ambiguous TopoJSON layers: supply objectName or prepare a single-object asset',
      );
    value = feature(topology, topology.objects[key]);
  }
  const collection: FeatureCollection =
    value?.type === 'FeatureCollection'
      ? (value as FeatureCollection)
      : value?.type === 'Feature'
        ? { type: 'FeatureCollection', features: [value as Feature] }
        : (() => {
            throw new Error(
              'Map asset must be GeoJSON Feature/FeatureCollection or TopoJSON Topology',
            );
          })();
  if (!Array.isArray(collection.features))
    throw new Error('Map FeatureCollection requires features');
  return {
    ...collection,
    features: collection.features
      .filter((item) => item.geometry !== null)
      .map((item) => ({
        ...item,
        geometry: options.winding === 'preserve' ? item.geometry : orientGeometry(item.geometry)!,
      })),
  };
}

/** Land classification against the same prepared polygons used for drawing. */
export function classifyLand(geometry: FeatureCollection, coordinates: [number, number]): boolean {
  return geoContains(geometry, coordinates);
}

/** Sample the actual geodesic segments, not just waypoints. Coastline resolution
 * still limits this check; it is a cartographic guard, never navigation advice. */
export function routeLandCrossings(
  geometry: FeatureCollection,
  points: [number, number][],
  samplesPerSegment = 100,
): { segment: number; coordinates: [number, number] }[] {
  return points.slice(1).flatMap((point, index) =>
    greatCircle(points[index], point, samplesPerSegment)
      .filter((coordinate) => classifyLand(geometry, coordinate))
      .map((coordinates) => ({ segment: index, coordinates })),
  );
}

export interface MapOptions {
  width: number;
  height: number;
  center: [number, number];
  zoom: number;
}
export function mapPaths(
  geometry: FeatureCollection,
  options: MapOptions,
): {
  land: string;
  graticule: string;
  project: (coordinates: [number, number]) => [number, number];
  route: (points: [number, number][]) => string;
} {
  if (![options.width, options.height, options.zoom].every((n) => Number.isFinite(n) && n > 0))
    throw new Error('Map width, height and zoom must be finite and positive');
  if (!options.center.every(Number.isFinite) || Math.abs(options.center[1]) >= 85.05112878)
    throw new Error('Mercator map center must be finite and between 85.05°S and 85.05°N');
  const projection = geoMercator()
    // Rotate the antimeridian with the central longitude so Pacific maps remain continuous.
    .rotate([-options.center[0], 0])
    .center([0, options.center[1]])
    .scale((options.width / (2 * Math.PI)) * options.zoom)
    .translate([options.width / 2, options.height / 2])
    .clipExtent([
      [0, 0],
      [options.width, options.height],
    ])
    .precision(0.25);
  const path = geoPath(projection);
  const gridStep = options.zoom >= 20 ? 1 : options.zoom >= 6 ? 5 : 10;
  return {
    land: path(geometry) ?? '',
    graticule: path(geoGraticule().step([gridStep, gridStep])()) ?? '',
    project: (coordinates) => projection(coordinates) ?? [0, 0],
    route: (points) => path({ type: 'LineString', coordinates: points }) ?? '',
  };
}
export function greatCircle(
  from: [number, number],
  to: [number, number],
  samples = 40,
): [number, number][] {
  if (!Number.isInteger(samples) || samples < 2)
    throw new Error('A great-circle route needs at least two samples');
  const interpolate = geoInterpolate(from, to);
  return Array.from({ length: samples }, (_, i) => interpolate(i / (samples - 1)));
}
export function geoCameraFlight(
  from: { center: [number, number]; zoom: number },
  to: { center: [number, number]; zoom: number },
  p: number,
): { center: [number, number]; zoom: number } {
  if (![from.zoom, to.zoom].every((n) => Number.isFinite(n) && n > 0) || !Number.isFinite(p))
    throw new Error('Geographic flight requires positive zooms and a finite progress');
  const progress = Math.max(0, Math.min(1, p));
  const interpolate = geoInterpolate(from.center, to.center);
  return {
    center: interpolate(progress),
    zoom: Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * progress),
  };
}
