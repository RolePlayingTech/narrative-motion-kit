/* global fetch, console */
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Pinned upstream evidence. No image synthesis or coastline simplification.
const commit = 'ca96624a56bd078437bca8184e78163e5039ad19';
const url = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${commit}/geojson/ne_10m_admin_0_countries.geojson`;
const bbox = [40, 14, 68, 35];
const root = resolve('projects/demo-fuel-prices');
const cache = resolve(root, '.cache/natural-earth-10m-countries.geojson');
await mkdir(resolve(root, '.cache'), { recursive: true });
let original;
try {
  original = await readFile(cache);
} catch {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Natural Earth download failed: ${response.status}`);
  original = Buffer.from(await response.arrayBuffer());
  await writeFile(cache, original);
}
const input = JSON.parse(original.toString('utf8'));
function intersects(polygon) {
  const ring = polygon[0];
  const xs = ring.map((point) => point[0]);
  const ys = ring.map((point) => point[1]);
  return (
    Math.min(...xs) <= bbox[2] &&
    Math.max(...xs) >= bbox[0] &&
    Math.min(...ys) <= bbox[3] &&
    Math.max(...ys) >= bbox[1]
  );
}
const features = input.features.flatMap((item) => {
  const polygons =
    item.geometry.type === 'Polygon' ? [item.geometry.coordinates] : item.geometry.coordinates;
  const kept = polygons.filter(intersects);
  if (!kept.length) return [];
  return [
    {
      type: 'Feature',
      id: item.properties.ADM0_A3,
      properties: { name: item.properties.ADMIN, iso_a3: item.properties.ADM0_A3 },
      geometry: { type: 'MultiPolygon', coordinates: kept },
    },
  ];
});
const output = Buffer.from(JSON.stringify({ type: 'FeatureCollection', features }) + '\n');
const file = 'assets/hormuz-natural-earth-10m.geojson';
await mkdir(resolve(root, 'assets'), { recursive: true });
await writeFile(resolve(root, file), output);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const provenance = {
  file,
  author: 'Natural Earth; Nathaniel Vaughn Kelso, Tom Patterson and contributors',
  title: 'Natural Earth 1:10 million Admin 0 Countries — Hormuz region subset',
  publisher: 'Natural Earth',
  sourceUrl: url,
  sourcePage:
    'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/',
  license: 'Public domain',
  licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
  retrievedAt: new Date().toISOString(),
  upstreamCommit: commit,
  upstreamSha256: sha256(original),
  sha256: sha256(output),
  bytes: output.byteLength,
  selectedBoundingBox: bbox,
  transformation:
    'Retain complete Polygon components whose bounding boxes intersect [40E,14N,68E,35N]; preserve every coordinate and hole; omit remote components; retain country name and ADM0_A3. No clipping, resampling, smoothing or generated coastline.',
  coordinateSystem: 'WGS84 longitude/latitude degrees',
  scale: '1:10,000,000 (not 10-metre accuracy)',
  countries: features.map((item) => item.properties.name),
};
await mkdir(resolve(root, 'research'), { recursive: true });
await writeFile(
  resolve(root, 'research/map-provenance.json'),
  JSON.stringify(provenance, null, 2) + '\n',
);
console.log(JSON.stringify(provenance, null, 2));
