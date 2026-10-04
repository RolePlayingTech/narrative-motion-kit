import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { parseProject, type Project } from '../packages/schema/index.ts';

export const repositoryRoot = resolve(import.meta.dirname, '..');
export interface LoadedProject {
  project: Project;
  directory: string;
  config: string;
}

export async function localFile(directory: string, filename: string): Promise<string> {
  if (/^(?:[a-z]+:|\/|\\)/i.test(filename))
    throw new Error(`Expected local relative path: ${filename}`);
  const root = await realpath(directory);
  const candidate = resolve(root, filename);
  if (!candidate.startsWith(root + sep)) throw new Error(`Path escapes project: ${filename}`);
  const actual = await realpath(candidate);
  if (!actual.startsWith(root + sep)) throw new Error(`Symlink escapes project: ${filename}`);
  if (!(await stat(actual)).isFile()) throw new Error(`Not a file: ${filename}`);
  return actual;
}

export async function loadProject(id = 'demo-fuel-prices'): Promise<LoadedProject> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid project id: ${id}`);
  const directory = resolve(repositoryRoot, 'projects', id);
  for (const name of ['project.json', 'project.yaml', 'project.yml']) {
    const config = resolve(directory, name);
    let raw: string;
    try {
      raw = await readFile(config, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    const project = parseProject(name.endsWith('.json') ? JSON.parse(raw) : parse(raw));
    if (project.id !== id)
      throw new Error(`Project id ${project.id} does not match directory ${id}`);
    return { project, directory, config };
  }
  throw new Error(`No project.json or project.yaml in ${directory}`);
}
