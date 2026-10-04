import type { SceneOf } from '../schema/index';
import type { SceneContext } from '../scenes/index';

/** For DOM, Canvas or WebGL extensions. update must assign EVERY animated property. */
export interface CustomLayer {
  update(scene: SceneOf<'custom'>, context: SceneContext): void | Promise<void>;
  dispose(): void;
}
export type LayerFactory = (
  host: HTMLElement,
  scene: SceneOf<'custom'>,
  context: SceneContext,
) => CustomLayer | Promise<CustomLayer>;
const layers = new Map<string, LayerFactory>();
export function registerLayer(id: string, factory: LayerFactory): void {
  if (layers.has(id)) throw new Error(`Custom layer already registered: ${id}`);
  layers.set(id, factory);
}
export function getLayer(id: string): LayerFactory | undefined {
  return layers.get(id);
}
