import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/400.css';
import './style.css';
import { loadResources } from './resources';
import { FrameEngine, type FrameResult } from './frame';
import type { Project } from '../../packages/schema/index';
import { sampleTimeline } from '../../packages/timeline/index';

declare global {
  interface Window {
    motion: {
      ready: boolean;
      project?: Project;
      renderAt: (time: number) => Promise<FrameResult>;
      error?: string;
    };
  }
}
const params = new URLSearchParams(location.search),
  renderMode = params.get('render') === '1';
const app = document.querySelector<HTMLDivElement>('#app')!;
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]!,
  );
window.motion = {
  ready: false,
  renderAt: async () => {
    throw new Error('Project is loading');
  },
};

async function boot(): Promise<void> {
  const { project, geometry, assetUrl, base } = await loadResources(
    params.get('project') ?? 'demo-fuel-prices',
  );
  // Rendering resolution controls pixels; composition keeps an aspect-aware design space.
  const outputWidth = Number(params.get('width') ?? project.resolution.width),
    outputHeight = Number(params.get('height') ?? project.resolution.height);
  if (
    !Number.isFinite(outputWidth) ||
    !Number.isFinite(outputHeight) ||
    outputWidth < 1 ||
    outputHeight < 1
  )
    throw new Error('Invalid viewport dimensions');
  const ratio = outputWidth / outputHeight,
    designWidth = ratio >= 1 ? 1920 : 1080,
    designHeight = Math.round(designWidth / ratio);
  if (renderMode) {
    document.body.classList.add('render');
    app.innerHTML = '<div id="stage"></div>';
  } else
    app.innerHTML = `<header class="studio-header"><a class="wordmark" href="?project=demo-fuel-prices"><span class="mark">ŚD</span><span>ŚWIADEK DZIEJÓW<small>MOTION STUDIO / 01</small></span></a><div class="project-title">${escape(project.title)}<span>LOCAL PROJECT · ${project.fps} FPS</span></div><span class="status">● ASSETS READY</span></header><main class="workspace"><aside class="scene-rail"><div class="rail-heading">SEKWENCJA <span>${project.scenes.length.toString().padStart(2, '0')}</span></div><div id="scenes">${project.scenes.map((s, i) => `<button class="scene-item" data-time="${s.start}" data-id="${s.id}"><span class="scene-index">${String(i + 1).padStart(2, '0')}</span><span><strong>${escape(s.title)}</strong><small>${s.start.toFixed(2)} — ${s.end.toFixed(2)} s · ${escape(s.type)}</small></span></button>`).join('')}</div><div class="rail-foot">ABSOLUTE TIMELINE<br><span>Każda klatka. Dowolny moment.</span></div></aside><section class="viewer"><div class="viewer-top"><span id="current-scene">MONITOR</span><span>${project.resolution.width} × ${project.resolution.height} / ${escape(project.theme)}</span></div><div class="stage-area"><div id="stage-wrap"><div id="stage"></div></div></div><div class="transport"><button id="play" aria-label="Play or pause">▶</button><output id="time">00:00.00</output><input id="scrub" aria-label="Timeline" type="range" min="0" max="${project.duration}" step="${1 / project.fps}" value="0"><span class="duration">${project.duration.toFixed(2)} s</span><button id="safe" title="Toggle safe area">SAFE</button></div><div class="timeline">${project.scenes.map((s) => `<button style="flex:${s.end - s.start}" data-time="${s.start}" title="${escape(s.thesis)}"><span>${escape(s.kicker ?? s.type)}</span><b>${escape(s.title)}</b></button>`).join('')}</div><div class="frame-notes"><span id="mode">FRAME</span><p id="thesis"></p></div></section><aside class="inspector"><div class="rail-heading">REŻYSERIA</div><h2 id="shot-title"></h2><label>CO DODAJE OBRAZ</label><p id="added"></p><label>POŁĄCZENIE SCEN</label><p id="transition"></p><label>ŹRÓDŁA</label><div id="sources"></div><div class="inspector-foot">${escape(project.narration.kind)}<br><span>${escape(project.language)} · seed ${project.seed}</span></div></aside></main><footer class="studio-footer"><span>ŚD / FRAMEWORK</span><span>← → Klatka &nbsp; · &nbsp; SPACJA Odtwarzanie &nbsp; · &nbsp; Przeciągnij, aby sprawdzić dowolny moment</span><span>OFFLINE RENDER READY</span></footer>`;
  const stage = document.querySelector<HTMLElement>('#stage')!;
  stage.style.width = `${designWidth}px`;
  stage.style.height = `${designHeight}px`;
  if (renderMode) {
    stage.style.width = `${outputWidth}px`;
    stage.style.height = `${outputHeight}px`;
  }
  const engine = new FrameEngine(stage, project, geometry, assetUrl, designWidth, designHeight);
  let time = 0,
    playing = false,
    busy = false,
    origin = 0,
    originTime = 0;
  const audio = project.narration.file ? new Audio(`${base}${project.narration.file}`) : undefined;
  if (audio) {
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      window.motion.error = 'Narration could not be decoded';
    });
  }
  const updateUi = () => {
    if (renderMode) return;
    const { scene } = sampleTimeline(project, time);
    document.querySelector<HTMLOutputElement>('#time')!.value =
      `${String(Math.floor(time / 60)).padStart(2, '0')}:${(time % 60).toFixed(2).padStart(5, '0')}`;
    document.querySelector<HTMLInputElement>('#scrub')!.value = String(time);
    for (const element of document.querySelectorAll<HTMLElement>('.scene-item'))
      element.classList.toggle('active', element.dataset.id === scene.id);
    const set = (id: string, text: string) => {
      document.querySelector(id)!.textContent = text;
    };
    set('#current-scene', `${scene.id.toUpperCase()} / ${scene.mode}`);
    set('#shot-title', scene.title);
    set('#mode', scene.mode);
    set('#thesis', scene.thesis);
    set('#added', scene.addedInformation);
    set('#transition', scene.transition?.reason ?? 'Pierwsze ujęcie: ustala pytanie filmu.');
    document.querySelector('#sources')!.innerHTML = scene.sourceIds
      .map((id) => {
        const source = project.sources.find((s) => s.id === id)!;
        return `<a href="${escape(source.url)}" target="_blank" rel="noreferrer">${escape(source.publisher)}<small>${escape(source.title)}</small></a>`;
      })
      .join('');
  };
  const seek = async (t: number) => {
    time = Math.max(0, Math.min(project.duration, t));
    const result = await engine.renderAt(time);
    updateUi();
    return result;
  };
  window.motion = { ready: false, project, renderAt: seek };
  await seek(Number(params.get('time') ?? 0));
  window.motion.ready = true;
  if (renderMode) return;
  const fit = () => {
    const area = document.querySelector<HTMLElement>('.stage-area')!,
      wrap = document.querySelector<HTMLElement>('#stage-wrap')!;
    const scale = Math.min(
      (area.clientWidth - 40) / designWidth,
      (area.clientHeight - 32) / designHeight,
    );
    stage.style.transform = `scale(${scale})`;
    wrap.style.width = `${designWidth * scale}px`;
    wrap.style.height = `${designHeight * scale}px`;
  };
  new ResizeObserver(fit).observe(document.querySelector('.stage-area')!);
  fit();
  const play = document.querySelector<HTMLButtonElement>('#play')!;
  const stop = () => {
    playing = false;
    audio?.pause();
    play.textContent = '▶';
  };
  const toggle = async () => {
    if (playing) {
      stop();
      return;
    }
    if (time >= project.duration) await seek(0);
    playing = true;
    origin = performance.now();
    originTime = time;
    if (audio) {
      audio.currentTime = time;
      try {
        await audio.play();
      } catch (error) {
        stop();
        throw error;
      }
    }
    play.textContent = 'Ⅱ';
  };
  play.addEventListener('click', () => void toggle());
  document.querySelector<HTMLInputElement>('#scrub')!.addEventListener('input', (event) => {
    stop();
    void seek(Number((event.target as HTMLInputElement).value));
  });
  document.querySelectorAll<HTMLElement>('[data-time]').forEach((button) =>
    button.addEventListener('click', () => {
      stop();
      void seek(Number(button.dataset.time));
    }),
  );
  document
    .querySelector('#safe')!
    .addEventListener('click', () => stage.classList.toggle('show-safe'));
  document.addEventListener('keydown', (event) => {
    if ((event.target as HTMLElement).tagName === 'INPUT') return;
    if (event.code === 'Space') {
      event.preventDefault();
      void toggle();
    }
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
      event.preventDefault();
      stop();
      void seek(time + (event.code === 'ArrowRight' ? 1 : -1) / project.fps);
    }
  });
  const tick = async () => {
    if (playing && !busy) {
      busy = true;
      try {
        const t = audio ? audio.currentTime : originTime + (performance.now() - origin) / 1000;
        await seek(t);
        if (t >= project.duration - 1 / project.fps || audio?.ended) stop();
      } finally {
        busy = false;
      }
    }
    requestAnimationFrame(() => void tick());
  };
  requestAnimationFrame(() => void tick());
}
boot().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  window.motion.error = message;
  app.innerHTML = `<pre class="fatal">Project failed to load\n\n${escape(message)}</pre>`;
  console.error(error);
});
