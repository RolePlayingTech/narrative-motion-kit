import { parse as yaml } from 'yaml';
import { parseProject, type Project } from '../../packages/schema/index';
import { normalizeGeometry } from '../../packages/maps/index';
import type { FeatureCollection } from 'geojson';

export async function loadResources(id: string): Promise<{
  project: Project;
  geometry: Record<string, FeatureCollection>;
  assetUrl: (id: string) => string;
  base: string;
}> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Invalid project identifier');
  const base = `/projects/${id}/`;
  let raw: unknown;
  for (const extension of ['json', 'yaml', 'yml']) {
    const response = await fetch(`${base}project.${extension}`);
    if (!response.ok) continue;
    const text = await response.text();
    if (text.trimStart().startsWith('<')) continue;
    raw = extension === 'json' ? JSON.parse(text) : yaml(text);
    break;
  }
  if (!raw) throw new Error(`No project.json or project.yaml found for ${id}`);
  const project = parseProject(raw),
    geometry: Record<string, FeatureCollection> = {};
  const assetUrl = (key: string) => {
    const asset = project.assets.find((a) => a.id === key);
    if (!asset) throw new Error(`Unknown asset ${key}`);
    return `${base}${asset.file.split(/[\\/]/).map(encodeURIComponent).join('/')}`;
  };
  await Promise.all(
    project.assets.map(async (asset) => {
      const url = assetUrl(asset.id);
      if (['image', 'svg'].includes(asset.kind)) {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (!image.naturalWidth) throw new Error(`Image is empty: ${asset.file}`);
      } else if (['geojson', 'topojson'].includes(asset.kind)) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Cannot load ${url}`);
        geometry[asset.id] = normalizeGeometry(await response.json());
      }
    }),
  );
  await Promise.all([
    document.fonts.load('600 80px "Barlow Condensed"', 'Świadek Dziejów'),
    document.fonts.load('700 80px "Barlow Condensed"', 'Świadek Dziejów'),
    document.fonts.load('500 32px "Manrope Variable"', 'Zażółć gęślą jaźń'),
    document.fonts.load('400 32px "IBM Plex Mono"', 'Zażółć gęślą jaźń'),
  ]);
  await document.fonts.ready;
  if (
    !document.fonts.check('700 80px "Barlow Condensed"') ||
    !document.fonts.check('500 32px "Manrope Variable"') ||
    !document.fonts.check('400 32px "IBM Plex Mono"')
  )
    throw new Error('Local production fonts failed to load');
  return { project, geometry, assetUrl, base };
}
