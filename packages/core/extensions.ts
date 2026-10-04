import { registerLayer } from './layers';
import { registerCustomScene } from '../scenes/index';
import { keyedRandom, progress } from '../motion/index';

// Project authors can import additional registrations here. Canvas/3D underlays are
// composited with SVG typography; they use the same absolute-time frame contract.
registerCustomScene('globe', () => '');
registerLayer('globe', async (host, scene, ctx) => {
  const { createGlobe } = await import('../three/index');
  return createGlobe(host, scene, ctx);
});
registerCustomScene('particle-flow', () => '');
registerLayer('particle-flow', (host, _scene, ctx) => {
  const canvas = document.createElement('canvas');
  canvas.width = ctx.width;
  canvas.height = ctx.height;
  host.append(canvas);
  const paint = canvas.getContext('2d');
  if (!paint) throw new Error('Canvas2D is unavailable');
  return {
    update: (scene, c) => {
      paint.clearRect(0, 0, c.width, c.height);
      const count = Math.max(1, Math.min(2000, Number(scene.props.count ?? 180)));
      const opening = progress(0, 0.8, c.localTime);
      for (let i = 0; i < count; i++) {
        const phase = (keyedRandom(c.project.seed, `particle-${i}`) + c.localTime * 0.09) % 1;
        const lane = keyedRandom(c.project.seed, `lane-${i}`) - 0.5;
        const x = c.width * (0.1 + phase * 0.8),
          y = c.height * (0.55 + lane * 0.22 * Math.sin(phase * Math.PI));
        paint.globalAlpha = opening * (0.3 + 0.7 * Math.sin(phase * Math.PI));
        paint.fillStyle = c.theme.secondary;
        paint.beginPath();
        paint.arc(x, y, 2 + keyedRandom(c.project.seed, `size-${i}`) * 4, 0, Math.PI * 2);
        paint.fill();
      }
      paint.globalAlpha = 1;
    },
    dispose: () => canvas.remove(),
  };
});

registerCustomScene('document-dom', () => '');
registerLayer('document-dom', (host, _scene, ctx) => {
  const documentPanel = document.createElement('article');
  documentPanel.style.cssText = `position:absolute;left:12%;top:32%;width:76%;height:48%;padding:4%;background:${ctx.theme.paper};color:${ctx.theme.ink};font-family:${ctx.theme.fontBody};box-sizing:border-box;overflow:hidden`;
  const heading = document.createElement('h2'),
    body = document.createElement('p');
  heading.style.cssText = 'margin:0 0 24px;font-size:48px;line-height:1.35';
  body.style.cssText = 'margin:0;font-size:30px;line-height:1.6;max-width:100%';
  heading.dataset.qaText = 'true';
  body.dataset.qaText = 'true';
  documentPanel.append(heading, body);
  host.append(documentPanel);
  return {
    update: (scene, c) => {
      heading.textContent = String(scene.props.heading ?? 'Dokument jako warstwa DOM');
      body.textContent = String(
        scene.props.body ?? 'HTML, SVG, Canvas i WebGL korzystają z tej samej osi czasu.',
      );
      const p = progress(0, 0.6, c.localTime);
      documentPanel.style.opacity = String(p);
      documentPanel.style.transform = `translateY(${(1 - p) * 24}px)`;
    },
    dispose: () => documentPanel.remove(),
  };
});
