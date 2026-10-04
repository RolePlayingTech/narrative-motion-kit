import { parseArgs } from 'node:util';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { loadProject, localFile, repositoryRoot } from './project.ts';
import { renderFrame, renderVideo, type RenderOptions } from './render.ts';
import { contactSheet } from './contact.ts';
import { startServer } from './browser.ts';
import { runQA } from './qa.ts';
import { sourcesMarkdown } from '../packages/research/index.ts';
import { validateAssets } from '../packages/assets/index.ts';
import {
  ingestAudio,
  LocalCommandProvider,
  SuppliedTranscriptProvider,
  TimestampJsonProvider,
  type TranscriptionProvider,
} from '../packages/audio/index.ts';
import { atomicWrite } from './cache.ts';

const command = process.argv[2] ?? 'help';
const common = { project: { type: 'string' }, help: { type: 'boolean' } } as const;
const dimensions = { width: { type: 'string' }, height: { type: 'string' } } as const;
const render = {
  ...dimensions,
  fps: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  workers: { type: 'string' },
  resume: { type: 'boolean' },
} as const;
const optionsByCommand = {
  help: {},
  dev: { port: { type: 'string' } },
  new: {},
  frame: { ...dimensions, time: { type: 'string' } },
  range: render,
  draft: render,
  final: render,
  contact: { 'every-seconds': { type: 'string' }, 'every-frames': { type: 'string' } },
  assets: {},
  sources: {},
  qa: { 'static-only': { type: 'boolean' }, video: { type: 'string' } },
  audio: {
    audio: { type: 'string' },
    transcript: { type: 'string' },
    timestamps: { type: 'string' },
    'transcribe-command': { type: 'string' },
  },
} as const;

async function main(): Promise<void> {
  if (!(command in optionsByCommand))
    throw new Error(`Unknown command ${command}; see scripts/CLI.md`);
  const parsed = parseArgs({
    args: process.argv.slice(3),
    strict: true,
    allowPositionals: command === 'new',
    options: { ...common, ...optionsByCommand[command as keyof typeof optionsByCommand] },
  });
  const values: Record<string, unknown> = parsed.values,
    positionals = parsed.positionals;
  const text = (name: string) =>
    typeof values[name] === 'string' ? (values[name] as string) : undefined;
  const number = (name: string) => {
    const value = text(name);
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !value.trim()) throw new Error(`--${name} must be finite`);
    return parsed;
  };
  if (command === 'help' || values.help) {
    console.log(
      'Commands: dev, new, audio, assets, frame, range, contact, draft, final, qa, sources.\nAll accept --project ID (default demo-fuel-prices). Full options: scripts/CLI.md',
    );
    return;
  }
  if (command === 'new') {
    const id = positionals[0];
    if (positionals.length !== 1 || !id || !/^[a-z0-9][a-z0-9-]*$/.test(id))
      throw new Error('Usage: npm run new:project -- my-video');
    const template = await loadProject('template'),
      directory = join(repositoryRoot, 'projects', id);
    await mkdir(directory); // Existing projects are never overwritten.
    await cp(template.directory, directory, {
      recursive: true,
      filter: (source) =>
        !['renders', '.cache'].includes(basename(source)) &&
        !(
          dirname(source) === template.directory && /^project\.(json|ya?ml)$/.test(basename(source))
        ),
    });
    for (const folder of [
      'narration',
      'transcript',
      'assets',
      'generated',
      'research',
      'data',
      'scenes',
      'renders',
    ])
      await mkdir(join(directory, folder), { recursive: true });
    await writeFile(
      join(directory, 'project.json'),
      JSON.stringify({ ...template.project, id, title: id.split('-').join(' ') }, null, 2) + '\n',
    );
    console.log(
      `Created ${directory}. Add narration, ingest it, then align project duration/scenes.`,
    );
    return;
  }
  const loaded = await loadProject(text('project'));
  if (command === 'dev') {
    const port = number('port') ?? 5173;
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('--port must be an integer in [1,65535]');
    const server = await startServer(port);
    console.log(`Preview: http://127.0.0.1:${port}/?project=${loaded.project.id}`);
    const close = () => {
      void server.close().then(() => process.exit(0));
    };
    process.on('SIGINT', close);
    process.on('SIGTERM', close);
    return;
  }
  if (command === 'frame') {
    console.log(
      await renderFrame(loaded, number('time') ?? 0, {
        width: number('width'),
        height: number('height'),
      }),
    );
    return;
  }
  if (command === 'range' || command === 'draft' || command === 'final') {
    const options: RenderOptions = { resume: values.resume === true };
    for (const key of ['from', 'to', 'width', 'height', 'fps', 'workers'] as const) {
      const value = number(key);
      if (value !== undefined) options[key] = value;
    }
    console.log(await renderVideo(loaded, command, options));
    return;
  }
  if (command === 'contact') {
    console.log(
      (
        await contactSheet(loaded, {
          everySeconds: number('every-seconds'),
          everyFrames: number('every-frames'),
        })
      ).join('\n'),
    );
    return;
  }
  if (command === 'assets') {
    const issues = await validateAssets(loaded.project, loaded.directory);
    console.log(JSON.stringify(issues, null, 2));
    if (issues.some((i) => i.level === 'error')) process.exitCode = 1;
    return;
  }
  if (command === 'sources') {
    const output = join(loaded.directory, 'renders', 'SOURCES.md');
    await atomicWrite(output, sourcesMarkdown(loaded.project));
    console.log(output);
    return;
  }
  if (command === 'qa') {
    const result = await runQA(loaded, {
      staticOnly: values['static-only'] === true,
      video: text('video'),
    });
    console.log(
      `${result.passed ? 'PASS' : 'FAIL'}: ${result.samples} samples; ${result.issues.length} findings. ${join(loaded.directory, 'renders', 'QA.md')}`,
    );
    if (!result.passed) process.exitCode = 1;
    return;
  }
  if (command === 'audio') {
    const filename = text('audio') ?? loaded.project.narration.file;
    if (!filename) throw new Error('Set narration.file or pass --audio project-relative-file.wav');
    const supplied = ['transcript', 'timestamps', 'transcribe-command'].filter((key) => text(key));
    if (supplied.length > 1) throw new Error('Choose one transcript provider');
    let provider: TranscriptionProvider | undefined;
    if (text('transcript'))
      provider = new SuppliedTranscriptProvider(
        await localFile(loaded.directory, text('transcript')!),
      );
    if (text('timestamps'))
      provider = new TimestampJsonProvider(await localFile(loaded.directory, text('timestamps')!));
    if (text('transcribe-command')) {
      const args: unknown = JSON.parse(text('transcribe-command')!);
      if (!Array.isArray(args) || !args.every((v: unknown) => typeof v === 'string'))
        throw new Error('--transcribe-command must be a JSON array of argument strings');
      provider = new LocalCommandProvider(args);
    }
    if (!provider && loaded.project.narration.transcript) {
      const file = await localFile(loaded.directory, loaded.project.narration.transcript);
      provider = file.endsWith('.json')
        ? new TimestampJsonProvider(file)
        : new SuppliedTranscriptProvider(file);
    }
    const result = await ingestAudio(await localFile(loaded.directory, filename), provider),
      output = join(loaded.directory, 'transcript', 'analysis.json');
    await atomicWrite(output, JSON.stringify(result, null, 2) + '\n');
    console.log(
      `Audio duration: ${result.duration}s; ${result.silences.length} silences. ${output}\nSet project.duration and scene boundaries to this duration. Text-only alignment is approximate.`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
