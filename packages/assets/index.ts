import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { type Asset, AssetSchema, type Project } from '../schema/index.ts';
import { localFile } from '../../scripts/project.ts';
import { probeMedia } from '../audio/index.ts';

export interface AssetIssue {
  level: 'error' | 'warning';
  assetId: string;
  message: string;
}
export const hashBytes = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export async function validateAssets(project: Project, directory: string): Promise<AssetIssue[]> {
  const issues: AssetIssue[] = [],
    hashes = new Map<string, string>();
  for (const asset of project.assets) {
    try {
      const path = await localFile(directory, asset.file),
        bytes = await readFile(path);
      if (bytes.length === 0) throw new Error('Empty asset');
      const hash = hashBytes(bytes),
        duplicate = hashes.get(hash);
      if (duplicate)
        issues.push({
          level: 'warning',
          assetId: asset.id,
          message: `Identical bytes to ${duplicate}`,
        });
      hashes.set(hash, asset.id);
      if (asset.sha256 && hash !== asset.sha256)
        throw new Error('SHA-256 mismatch: asset changed after acquisition');
      if (asset.kind === 'image' || asset.kind === 'svg') {
        const metadata = await sharp(bytes).metadata();
        const width = metadata.width ?? 0,
          height = metadata.height ?? 0;
        if (!width || !height) throw new Error('Image has no decodable dimensions');
        if ((asset.width && asset.width !== width) || (asset.height && asset.height !== height))
          throw new Error(`Declared dimensions differ from actual ${width}×${height}`);
        if (asset.kind !== 'svg' && Math.min(width, height) < 480)
          issues.push({
            level: 'warning',
            assetId: asset.id,
            message: `Low resolution ${width}×${height}; inspect at intended display size`,
          });
        if (Math.max(width / height, height / width) > 5)
          issues.push({
            level: 'warning',
            assetId: asset.id,
            message: `Extreme aspect ratio ${width}×${height}; inspect crop`,
          });
      }
      if (asset.kind === 'geojson' || asset.kind === 'topojson') {
        const data: unknown = JSON.parse(bytes.toString('utf8'));
        if (!data || typeof data !== 'object' || !('type' in data))
          throw new Error('Invalid geographic data');
        if (asset.kind === 'topojson' && (data as { type: unknown }).type !== 'Topology')
          throw new Error('Expected TopoJSON Topology');
        if (
          asset.kind === 'geojson' &&
          ![
            'FeatureCollection',
            'Feature',
            'Point',
            'MultiPoint',
            'LineString',
            'MultiLineString',
            'Polygon',
            'MultiPolygon',
            'GeometryCollection',
          ].includes(String(data.type))
        )
          throw new Error('Unknown GeoJSON geometry type');
      }
      if (asset.kind === 'data' && asset.file.toLowerCase().endsWith('.json'))
        JSON.parse(bytes.toString('utf8'));
      if (asset.kind === 'video' || asset.kind === 'audio') {
        const media = await probeMedia(path);
        if (!media.streams.some((stream) => stream.codec_type === asset.kind))
          throw new Error(`Media contains no ${asset.kind} stream`);
      }
    } catch (error) {
      issues.push({ level: 'error', assetId: asset.id, message: String(error) });
    }
  }
  for (const file of [project.narration.file, project.narration.transcript].filter(
    (v): v is string => Boolean(v),
  )) {
    try {
      await localFile(directory, file);
    } catch (error) {
      issues.push({ level: 'error', assetId: 'narration', message: String(error) });
    }
  }
  return issues;
}

/** Acquisition is explicit and separate from rendering. Caller supplies reviewed license/provenance. */
export async function acquireAsset(
  directory: string,
  metadata: Asset,
  maxBytes = 64 * 1024 * 1024,
): Promise<Asset> {
  const asset = AssetSchema.parse(metadata);
  if (!asset.sourceUrl) throw new Error('Acquisition requires sourceUrl');
  const url = new URL(asset.sourceUrl);
  if (url.protocol !== 'https:') throw new Error('Asset downloads require HTTPS');
  const root = await realpath(directory),
    target = resolve(root, asset.file);
  if (!target.startsWith(root + sep)) throw new Error('Asset path escapes project');
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
  if (response.url && new URL(response.url).protocol !== 'https:')
    throw new Error('Asset redirected to an insecure URL');
  if ((response.headers.get('content-type') ?? '').includes('text/html'))
    throw new Error('Downloaded HTML instead of an asset; use the original media URL');
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Asset exceeds size limit');
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks);
  if (!bytes.length) throw new Error('Downloaded an empty asset');
  const sha256 = hashBytes(bytes);
  if (asset.sha256 && asset.sha256 !== sha256) throw new Error('Downloaded asset hash mismatch');
  const result: Asset = { ...asset, sha256 };
  if (asset.kind === 'image' || asset.kind === 'svg') {
    const m = await sharp(bytes).metadata();
    if (!m.width || !m.height) throw new Error('Downloaded image has no dimensions');
    result.width = m.width;
    result.height = m.height;
  }
  // Check each existing ancestor before creating subdirectories or writing bytes.
  let parent = root;
  for (const segment of relative(root, dirname(target)).split(sep).filter(Boolean)) {
    parent = resolve(parent, segment);
    try {
      await lstat(parent);
      const actual = await realpath(parent);
      if (actual !== root && !actual.startsWith(root + sep))
        throw new Error('Asset directory symlink escapes project');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await mkdir(parent);
    }
  }
  for (const output of [target, target + '.provenance.json']) {
    try {
      if ((await lstat(output)).isSymbolicLink())
        throw new Error('Refusing to overwrite a symlink asset');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  await writeFile(target + '.part', bytes, { flag: 'wx' });
  await rename(target + '.part', target);
  await writeFile(target + '.provenance.json', JSON.stringify(result, null, 2) + '\n');
  return result;
}

export interface ImageGenerationRequest {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
}
export interface ImageGenerationProvider {
  name: string;
  generate(
    request: ImageGenerationRequest,
  ): Promise<{ bytes: Uint8Array; mimeType: string; model: string }>;
}
