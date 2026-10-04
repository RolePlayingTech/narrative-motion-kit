import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import type { Project } from '../packages/schema/index.ts';
import { repositoryRoot } from './project.ts';

export interface BrowserMotion {
  ready: boolean;
  project: Project;
  renderAt(time: number): Promise<{ sceneId: string; issues: string[] }>;
}
export interface RenderPage {
  page: Page;
  errors: string[];
}
export interface RenderSession {
  url: string;
  browserVersion: string;
  page(): Promise<RenderPage>;
  close(): Promise<void>;
}

export async function startServer(port = 0): Promise<ViteDevServer> {
  const server = await createServer({
    root: repositoryRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: port !== 0 },
    clearScreen: false,
  });
  await server.listen();
  return server;
}

export async function openRenderSession(
  projectId: string,
  width: number,
  height: number,
): Promise<RenderSession> {
  const server = await startServer();
  let browser: Browser;
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    await server.close();
    throw new Error('Preview server did not acquire a port');
  }
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--force-color-profile=srgb',
      ],
    });
  } catch (error) {
    await server.close();
    throw new Error(
      `Chromium could not start. Run npx playwright install chromium. ${String(error)}`,
    );
  }
  return {
    url: origin,
    browserVersion: browser.version(),
    async page() {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
        locale: 'pl-PL',
        timezoneId: 'UTC',
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
        serviceWorkers: 'block',
      });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
      });
      page.on('requestfailed', (request) =>
        errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText ?? ''}`),
      );
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol))
          await route.continue();
        else {
          errors.push(`Offline renderer blocked external request: ${url.href}`);
          await route.abort('blockedbyclient');
        }
      });
      await page.goto(
        `${origin}/?project=${encodeURIComponent(projectId)}&render=1&width=${width}&height=${height}`,
        { waitUntil: 'networkidle', timeout: 60_000 },
      );
      await page.waitForFunction(
        () => {
          const motion = (window as unknown as { motion?: BrowserMotion & { error?: string } })
            .motion;
          if (motion?.error) throw new Error(motion.error);
          return motion?.ready === true;
        },
        undefined,
        { timeout: 60_000 },
      );
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (const font of document.fonts)
          if (font.status === 'error') throw new Error(`Font failed to load: ${font.family}`);
      });
      if (errors.length) throw new Error(errors.join('\n'));
      return { page, errors };
    },
    async close() {
      await browser.close();
      await server.close();
    },
  };
}

export async function seek(
  renderPage: RenderPage,
  time: number,
): Promise<{ sceneId: string; issues: string[] }> {
  const result = await renderPage.page.evaluate(async (seconds) => {
    const api = (window as unknown as { motion: BrowserMotion }).motion;
    return api.renderAt(seconds);
  }, time);
  if (renderPage.errors.length) throw new Error(renderPage.errors.join('\n'));
  if (result.issues.length)
    throw new Error(`Frame ${time.toFixed(4)}s: ${result.issues.join('; ')}`);
  return result;
}

export async function capture(renderPage: RenderPage, time: number): Promise<Buffer> {
  await seek(renderPage, time);
  return renderPage.page
    .locator('#stage')
    .screenshot({ type: 'png', animations: 'disabled', caret: 'hide', timeout: 30_000 });
}
