import type { Scene, SceneOf } from '../schema/index';
import type { SceneContext } from './types';
import { statistic, lineChart, barChart, breakdown, comparison } from './data';
import { portraitDuel, photo, evidence, timeline } from './documentary';
import { flow, geoFlow } from './mechanisms';
import { chronicleSurface, footer, header } from './shared';
import { sceneTheme } from '../theme/index';
export type { SceneContext } from './types';

export type CustomSceneRenderer = (scene: SceneOf<'custom'>, context: SceneContext) => string;
const customRenderers = new Map<string, CustomSceneRenderer>();
/** Register once at startup. Each renderer must be a pure function of its arguments. */
export function registerCustomScene(name: string, renderer: CustomSceneRenderer): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(`Invalid custom renderer id: ${name}`);
  if (customRenderers.has(name)) throw new Error(`Custom renderer already registered: ${name}`);
  customRenderers.set(name, renderer);
}
export const hasCustomScene = (name: string): boolean => customRenderers.has(name);

export function renderScene(scene: Scene, ctx: SceneContext): string {
  ctx = { ...ctx, theme: sceneTheme(ctx.theme, scene.tone) };
  let content: string;
  switch (scene.type) {
    case 'statistic':
      content = statistic(scene, ctx);
      break;
    case 'portrait-duel':
      content = portraitDuel(scene, ctx);
      break;
    case 'photo':
      content = photo(scene, ctx);
      break;
    case 'evidence':
      content = evidence(scene, ctx);
      break;
    case 'flow':
      content = flow(scene, ctx);
      break;
    case 'breakdown':
      content = breakdown(scene, ctx);
      break;
    case 'line-chart':
      content = lineChart(scene, ctx);
      break;
    case 'bar-chart':
      content = barChart(scene, ctx);
      break;
    case 'geo-flow':
      content = geoFlow(scene, ctx);
      break;
    case 'timeline':
      content = timeline(scene, ctx);
      break;
    case 'comparison':
      content = comparison(scene, ctx);
      break;
    case 'custom': {
      const renderer = customRenderers.get(scene.renderer);
      if (!renderer)
        throw new Error(
          `Custom scene '${scene.id}' uses unregistered renderer '${scene.renderer}'. Register it in packages/core/extensions.ts.`,
        );
      content = renderer(scene, ctx);
      break;
    }
  }
  const background =
    scene.type === 'custom'
      ? ''
      : `<rect width="${ctx.width}" height="${ctx.height}" fill="${ctx.theme.background}"/>`;
  return `<g data-scene="${scene.id}" style="isolation:isolate">${background}${header(scene, ctx)}<g data-scene-content="${scene.type}">${content}</g>${footer(scene, ctx)}${chronicleSurface(scene, ctx)}</g>`;
}

export interface SceneRecipe {
  type: Scene['type'];
  modes: Scene['mode'][];
  purpose: string;
  requires: string[];
  avoid: string;
}
/** Decision guidance, not aliases masquerading as additional scene implementations. */
export const sceneCatalog: readonly SceneRecipe[] = [
  {
    type: 'statistic',
    modes: ['SCALE', 'CONTRAST'],
    purpose: 'Make one sourced magnitude or changing price immediately legible.',
    requires: ['value', 'unit', 'sourceIds'],
    avoid: 'Decorative counting when change itself is not the story.',
  },
  {
    type: 'portrait-duel',
    modes: ['CHARACTER', 'CONTRAST'],
    purpose: 'Introduce two actors with equal crop, color and type treatment.',
    requires: ['two authentic portraits', 'roles'],
    avoid: 'Implying guilt or assigning ideological colors.',
  },
  {
    type: 'photo',
    modes: ['EVIDENCE', 'CONTEXT', 'CHARACTER'],
    purpose: 'Show the authentic subject, place or historical context.',
    requires: ['local image', 'caption', 'provenance'],
    avoid: 'Using illustration as undocumented evidence.',
  },
  {
    type: 'evidence',
    modes: ['EVIDENCE'],
    purpose: 'Make a short source excerpt and its attribution readable.',
    requires: ['heading', 'body', 'highlight', 'attribution'],
    avoid: 'Fabricating a facsimile or implying paraphrase is an exact quotation.',
  },
  {
    type: 'flow',
    modes: ['MECHANISM'],
    purpose: 'Reveal a mechanism in stages; supplied edge values may encode relative flow.',
    requires: ['nodes', 'edges'],
    avoid: 'Arrows that assert unsupported causation.',
  },
  {
    type: 'breakdown',
    modes: ['SCALE', 'MECHANISM'],
    purpose: 'Show positive parts adding to a whole with common units.',
    requires: ['nonnegative dataset', 'totalLabel'],
    avoid: 'Stacking unrelated measures or percentages with different bases.',
  },
  {
    type: 'line-chart',
    modes: ['SCALE', 'CONTEXT', 'CONTRAST'],
    purpose: 'Trace supplied values across ordered x observations.',
    requires: ['dataset', 'axis labels'],
    avoid: 'Unsorted x values or hidden truncation of the y axis.',
  },
  {
    type: 'bar-chart',
    modes: ['SCALE', 'CONTRAST'],
    purpose: 'Compare magnitudes on a shared zero baseline, including negative values.',
    requires: ['dataset', 'axis labels'],
    avoid: 'Too many categories for legible labels.',
  },
  {
    type: 'geo-flow',
    modes: ['CONTEXT', 'MECHANISM', 'SCALE'],
    purpose: 'Orient the viewer with real geography, explicit places and supplied routes.',
    requires: ['cached geometry', 'geographic coordinates'],
    avoid: 'Treating route strength as observed traffic without data.',
  },
  {
    type: 'timeline',
    modes: ['CONTEXT', 'EVIDENCE'],
    purpose: 'Reveal an editorial sequence of dated events.',
    requires: ['dated events'],
    avoid: 'Implying equal spatial intervals measure elapsed historical time.',
  },
  {
    type: 'comparison',
    modes: ['CONTRAST', 'SCALE'],
    purpose: 'Compare two same-unit magnitudes with equal treatment.',
    requires: ['left/right', 'unit', 'dataset'],
    avoid: 'Different denominators, currencies or time windows.',
  },
  {
    type: 'custom',
    modes: ['METAPHOR', 'TRANSITION', 'MECHANISM'],
    purpose: 'Extend SVG or attach a registered Canvas/Three.js layer.',
    requires: ['registered pure renderer'],
    avoid: 'Stateful animation, live network calls or unexplained spectacle.',
  },
];
export function recommendScenes(
  mode: Scene['mode'],
  options: { hasData?: boolean; hasImages?: boolean; hasGeography?: boolean } = {},
): SceneRecipe[] {
  return sceneCatalog
    .filter((recipe) => recipe.modes.includes(mode))
    .filter(
      (recipe) =>
        !(
          ['line-chart', 'bar-chart', 'breakdown', 'comparison', 'statistic'].includes(
            recipe.type,
          ) && options.hasData === false
        ),
    )
    .filter(
      (recipe) =>
        !(['photo', 'portrait-duel'].includes(recipe.type) && options.hasImages === false),
    )
    .filter((recipe) => !(recipe.type === 'geo-flow' && options.hasGeography === false));
}
