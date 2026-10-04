import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, mkdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import type { LoadedProject } from './project.ts';
import { repositoryRoot } from './project.ts';
import type { RenderEnvironment } from './environment.ts';

async function tree(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (['renders', '.cache', 'node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await tree(path)));
    else if (entry.isFile()) files.push(path);
    else if (entry.isSymbolicLink())
      throw new Error(`Render fingerprint does not accept symlinks: ${path}`);
  }
  return files;
}

/** Hash bytes, not mtimes: changes to audio, data, fonts, code and settings invalidate resume. */
export async function renderFingerprint(
  loaded: LoadedProject,
  settings: unknown,
  environment: RenderEnvironment,
): Promise<string> {
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ project: loaded.project, settings, environment, version: 2 }));
  const roots = ['apps', 'packages', 'scripts'];
  for (const directory of roots)
    for (const file of await tree(join(repositoryRoot, directory))) {
      hash.update(relative(repositoryRoot, file));
      hash.update(await readFile(file));
    }
  for (const filename of ['package.json', 'package-lock.json', 'vite.config.ts', 'index.html']) {
    try {
      hash.update(filename);
      hash.update(await readFile(join(repositoryRoot, filename)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  for (const file of await tree(loaded.directory)) {
    hash.update(relative(loaded.directory, file));
    hash.update(await readFile(file));
  }
  return hash.digest('hex');
}

export async function atomicWrite(file: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const temporary = join(dirname(file), `.${basename(file)}.${process.pid}.${randomUUID()}.part`);
  await writeFile(temporary, data, { flag: 'wx' });
  await rename(temporary, file);
}
