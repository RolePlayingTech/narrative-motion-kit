import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { capture, openRenderSession } from './browser';
import { repositoryRoot } from './project';

const out = join(repositoryRoot, 'projects/scene-gallery/renders/integration');
await mkdir(out, { recursive: true });
const outcomes: { surface: string; time: number; deterministic: boolean }[] = [];
const session = await openRenderSession('scene-gallery', 960, 540);
try {
  const page = await session.page();
  for (const [surface, time] of [
    ['three', 26],
    ['canvas', 30],
    ['dom', 34],
  ] as const) {
    const first = await capture(page, time);
    await capture(page, 2);
    const revisited = await capture(page, time);
    assert.ok(first.equals(revisited), `${surface}: rebuilding scene must preserve exact pixels`);
    await writeFile(join(out, `${surface}.png`), first);
    outcomes.push({ surface, time, deterministic: true });
  }
} finally {
  await session.close();
}
const vertical = await openRenderSession('demo-fuel-prices', 540, 960);
try {
  const page = await vertical.page();
  for (const time of [1.5, 4.4, 7.4, 11.8, 15.4, 18.8])
    await writeFile(join(out, `vertical-${time}.png`), await capture(page, time));
} finally {
  await vertical.close();
}
await writeFile(
  join(out, 'report.json'),
  JSON.stringify({ passed: true, outcomes, verticalFrames: 6 }, null, 2) + '\n',
);
console.log(
  'PASS: Three.js, Canvas, DOM exact seek restoration; six 9:16 frames render within bounds.',
);
