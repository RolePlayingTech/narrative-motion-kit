import type { Project } from '../../packages/schema/index';
import { sampleTimeline } from '../../packages/timeline/index';
import { getTheme } from '../../packages/theme/index';
import { renderScene, type SceneContext } from '../../packages/scenes/index';
import { transitionFrame } from '../../packages/transitions/index';
import { cameraAt, cameraTransform } from '../../packages/camera/index';
import { getLayer, type CustomLayer } from '../../packages/core/layers';
import '../../packages/core/extensions';
import type { FeatureCollection } from 'geojson';

export interface FrameResult {
  sceneId: string;
  issues: string[];
}
export class FrameEngine {
  private layer: CustomLayer | undefined;
  private layerId: string | undefined;
  private pending: Promise<unknown> = Promise.resolve();
  constructor(
    private stage: HTMLElement,
    readonly project: Project,
    private geometry: Record<string, FeatureCollection>,
    private assetUrl: (id: string) => string,
    private width: number,
    private height: number,
  ) {}
  renderAt(time: number): Promise<FrameResult> {
    const next = this.pending.then(() => this.paint(time));
    this.pending = next.catch(() => undefined);
    return next;
  }
  private async paint(time: number): Promise<FrameResult> {
    const sample = sampleTimeline(this.project, time),
      theme = getTheme(this.project.theme);
    const context: SceneContext = {
      project: this.project,
      time: sample.time,
      localTime: sample.localTime,
      width: this.width,
      height: this.height,
      theme,
      geometry: this.geometry,
      assetUrl: this.assetUrl,
    };
    const scene = sample.scene;
    if (
      scene.transition &&
      scene.transition.type !== 'cut' &&
      ((scene.type === 'custom' && getLayer(scene.renderer)) ||
        (sample.previous?.type === 'custom' && getLayer(sample.previous.renderer)))
    )
      throw new Error(
        'Custom layers require a cut transition; their pixels cannot be morphed by the SVG compositor.',
      );
    let markup = renderScene(scene, context);
    if (scene.camera)
      markup = `<g transform="${cameraTransform(cameraAt(scene.camera, sample.localTime), this.width, this.height)}">${markup}</g>`;
    if (sample.previous && sample.transitionProgress < 1 && scene.transition?.type !== 'cut') {
      const previousContext = {
        ...context,
        time: sample.previous.end - 1 / this.project.fps,
        localTime: sample.previous.end - sample.previous.start - 1 / this.project.fps,
      };
      let previous = renderScene(sample.previous, previousContext);
      if (sample.previous.camera)
        previous = `<g transform="${cameraTransform(cameraAt(sample.previous.camera, previousContext.localTime), this.width, this.height)}">${previous}</g>`;
      markup = transitionFrame(
        previous,
        markup,
        sample.previous,
        scene,
        sample.transitionProgress,
        context,
      );
    }
    const custom = scene.type === 'custom' ? getLayer(scene.renderer) : undefined;
    if (this.layerId !== scene.id) {
      this.layer?.dispose();
      this.layer = undefined;
      this.layerId = scene.id;
      this.stage.replaceChildren();
    }
    let host = this.stage.querySelector<HTMLElement>('.custom-layer');
    if (!host) {
      host = document.createElement('div');
      host.className = 'custom-layer';
      this.stage.append(host);
    }
    host.style.width = `${this.width}px`;
    host.style.height = `${this.height}px`;
    host.style.transformOrigin = 'top left';
    host.style.transform = `scale(${this.stage.clientWidth / this.width})`;
    if (custom && scene.type === 'custom') {
      if (!this.layer) this.layer = await custom(host, scene, context);
      await this.layer.update(scene, context);
    }
    let svg = this.stage.querySelector<SVGSVGElement>(':scope > svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.stage.append(svg);
    }
    svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    svg.setAttribute('width', String(this.width));
    svg.setAttribute('height', String(this.height));
    svg.innerHTML = markup;
    this.stage.style.background = theme.background;
    // Waiting for image decode is idempotent and does not advance the timeline.
    await Promise.all(
      Array.from(svg.querySelectorAll('image')).map(async (node) => {
        const href = node.getAttribute('href');
        if (href) {
          const image = new Image();
          image.src = href;
          await image.decode();
        }
      }),
    );
    const issues = this.measureIssues();
    return { sceneId: scene.id, issues };
  }
  private measureIssues(): string[] {
    const box = this.stage.getBoundingClientRect(),
      issues: string[] = [];
    for (const element of this.stage.querySelectorAll<SVGTextElement | HTMLElement>(
      '[data-text],[data-qa-text]',
    )) {
      if (element.closest('[data-qa-ignore],[data-allow-overflow]')) continue;
      let visible = true;
      let current: Element | null = element;
      while (current && current !== this.stage) {
        const style = getComputedStyle(current);
        if (
          Number(style.opacity) < 0.03 ||
          style.display === 'none' ||
          style.visibility === 'hidden'
        )
          visible = false;
        current = current.parentElement;
      }
      if (!visible) continue;
      const rect = element.getBoundingClientRect();
      if (
        rect.width > 0 &&
        (rect.left < box.left - 2 ||
          rect.right > box.right + 2 ||
          rect.top < box.top - 2 ||
          rect.bottom > box.bottom + 2)
      )
        issues.push(`Text outside frame: ${element.textContent?.slice(0, 80)}`);
      if (
        element instanceof HTMLElement &&
        (element.scrollWidth > element.clientWidth + 2 ||
          element.scrollHeight > element.clientHeight + 2)
      )
        issues.push(`Text overflows layout box: ${element.textContent?.slice(0, 80)}`);
    }
    return issues;
  }
  dispose(): void {
    this.layer?.dispose();
  }
}
