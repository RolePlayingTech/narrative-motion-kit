/* global fetch, console */
// Research/bootstrap only. Final rendering never runs this script or accesses the web.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
const dir = new URL('../projects/demo-fuel-prices/assets/', import.meta.url);
await mkdir(dir, { recursive: true });
const files = [
  ['Donald_Tusk_KPRM_HQ.jpg', 'tusk.jpg'],
  ['Andrzej_Duda_Official_Portrait.jpg', 'duda.jpg'],
];
for (const [name, local] of files) {
  const hash = createHash('md5').update(name).digest('hex');
  const url = `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SwiadekDziejowMotion/0.1 (documentary demonstration research)' },
  });
  if (!res.ok) throw new Error(`${res.status}: ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(new URL(local, dir), bytes);
  console.log(
    `${local}: ${bytes.length} bytes, sha256 ${createHash('sha256').update(bytes).digest('hex')}`,
  );
}
const mapUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const map = await fetch(mapUrl);
if (!map.ok) throw new Error(`Map download failed: ${map.status}`);
const bytes = Buffer.from(await map.arrayBuffer());
JSON.parse(bytes.toString());
await writeFile(new URL('world-50m.topo.json', dir), bytes);
console.log(
  `world-50m.topo.json: ${bytes.length} bytes, sha256 ${createHash('sha256').update(bytes).digest('hex')}`,
);
