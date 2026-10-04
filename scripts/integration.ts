import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadProject } from './project.ts';
import { capture, openRenderSession } from './browser.ts';
import { hashBytes } from '../packages/assets/index.ts';
import { imageQA, videoQA } from '../packages/qa/index.ts';
import { atomicWrite } from './cache.ts';
import { renderFrames, renderVideo, frameFilename } from './render.ts';

const loaded = await loadProject(process.argv[2] ?? 'demo-fuel-prices');
const session = await openRenderSession(loaded.project.id, 640, 360);
const time = Math.min(
  loaded.project.duration / 2 + 0.137,
  loaded.project.duration - 1 / loaded.project.fps,
);
let reference: string;
try {
  const first = await session.page(),
    second = await session.page();
  const initial = await capture(first, time);
  reference = hashBytes(initial);
  await capture(first, 0);
  await capture(first, Math.max(0, loaded.project.duration - 0.1));
  assert.equal(
    hashBytes(await capture(first, time)),
    reference,
    'Out-of-order seek changed pixels',
  );
  assert.equal(
    hashBytes(await capture(second, time)),
    reference,
    'Independent workers changed pixels',
  );
  assert.equal((await imageQA(initial)).blank, false, 'Representative frame is blank');
  await atomicWrite(
    join(loaded.directory, 'renders', 'integration', 'deterministic-frame.png'),
    initial,
  );
} finally {
  await session.close();
}

const options = {
  from: 0,
  to: Math.min(0.8, loaded.project.duration),
  width: 640,
  height: 360,
  fps: 10,
  workers: 2,
};
const firstRun = await renderFrames(loaded, options);
const saved = hashBytes(await readFile(join(firstRun.directory, frameFilename(0))));
const resumed = await renderFrames(loaded, { ...options, resume: true });
assert.equal(resumed.rendered, 0, 'Resume rerendered valid frames');
assert.equal(resumed.skipped, firstRun.plan.frames.length);
await writeFile(join(firstRun.directory, frameFilename(0)), 'corrupted cached frame');
const repaired = await renderFrames(loaded, { ...options, resume: true });
assert.equal(repaired.rendered, 1, 'Resume did not repair the corrupt cached frame');
assert.equal(hashBytes(await readFile(join(firstRun.directory, frameFilename(0)))), saved);
const video = await renderVideo(loaded, 'range', { ...options, resume: true });
const issues = await videoQA(video, {
  duration: options.to,
  fps: 10,
  width: 640,
  height: 360,
  audio: Boolean(loaded.project.narration.file),
});
assert.deepEqual(issues, []);
await atomicWrite(
  join(loaded.directory, 'renders', 'integration', 'report.json'),
  JSON.stringify(
    {
      passed: true,
      seekSha256: reference,
      independentWorkers: true,
      resume: true,
      corruptFrameRepair: true,
      muxedVideo: video,
      frames: firstRun.plan.frames.length,
    },
    null,
    2,
  ),
);
console.log(
  'Integration PASS: exact out-of-order seek, independent workers, resume/corruption repair, ffmpeg video and audio QA.',
);
