import { defineConfig } from 'vite';
import { cp } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
export default defineConfig({
  root: '.',
  server: { host: '127.0.0.1' },
  build: { outDir: 'dist' },
  plugins: [
    {
      name: 'local-production-projects',
      async closeBundle() {
        await cp(resolve('projects'), resolve('dist/projects'), {
          recursive: true,
          filter: (path) =>
            !['renders', '.cache', 'toolchain-smoke', 'qa-template-fixture'].includes(
              basename(path),
            ),
        });
      },
    },
  ],
});
