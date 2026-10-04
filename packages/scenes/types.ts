import type { FeatureCollection } from 'geojson';
import type { Project } from '../schema/index';
import type { Theme } from '../theme/index';
export interface SceneContext {
  project: Project;
  time: number;
  localTime: number;
  width: number;
  height: number;
  theme: Theme;
  assetUrl: (id: string) => string;
  geometry: Record<string, FeatureCollection>;
}
