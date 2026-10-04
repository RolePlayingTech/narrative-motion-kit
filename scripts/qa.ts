import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import { capture, openRenderSession } from './browser.ts';
import { atomicWrite } from './cache.ts';
import { type LoadedProject, localFile } from './project.ts';
import {
  imageDifference,
  imageQA,
  reportMarkdown,
  staticQA,
  videoAudit,
  type QAIssue,
  type QAReport,
} from '../packages/qa/index.ts';
import { probeMedia } from '../packages/audio/index.ts';

export async function runQA(
  loaded: LoadedProject,
  options: { staticOnly?: boolean; video?: string } = {},
): Promise<QAReport> {
  const { project, directory } = loaded,
    issues = await staticQA(project, directory);
  let samples = 0;
  if (project.narration.file) {
    try {
      const media = await probeMedia(await localFile(directory, project.narration.file));
      if (Math.abs(Number(media.format.duration) - project.duration) > 0.01)
        issues.push({
          level: 'error',
          code: 'narration-duration',
          message: `Narration ${media.format.duration}s does not match project ${project.duration}s`,
        });
    } catch (error) {
      issues.push({ level: 'error', code: 'narration', message: String(error) });
    }
  }
  if (!options.staticOnly && !issues.some((i) => i.level === 'error')) {
    const session = await openRenderSession(
      project.id,
      project.resolution.width,
      project.resolution.height,
    );
    try {
      const page = await session.page();
      const times = [
        ...new Set([
          ...Array.from({ length: Math.ceil(project.duration) }, (_, i) => i),
          ...project.scenes.flatMap((s) => [
            s.start,
            (s.start + s.end) / 2,
            Math.max(s.start, s.end - 1 / project.fps),
          ]),
        ]),
      ].sort((a, b) => a - b);
      let previous: { thumbnail: Buffer; time: number; sceneId: string } | undefined,
        stillSince = 0;
      for (const time of times) {
        const scene =
          project.scenes.find((s) => time >= s.start && time < s.end) ?? project.scenes.at(-1)!;
        const bytes = await capture(page, time),
          image = await imageQA(bytes);
        samples++;
        if (image.blank)
          issues.push({
            level: 'error',
            code: 'blank-frame',
            sceneId: scene.id,
            time,
            message: 'Frame has almost no spatial contrast',
          });
        if (
          previous?.sceneId === scene.id &&
          imageDifference(previous.thumbnail, image.thumbnail) < 0.001
        ) {
          if (time - stillSince > 3)
            issues.push({
              level: 'warning',
              code: 'stagnation',
              sceneId: scene.id,
              time,
              message: `Composition changed less than 0.1% since ${stillSince.toFixed(2)}s; inspect whether this hold is intentional`,
            });
        } else stillSince = time;
        previous = { thumbnail: image.thumbnail, time, sceneId: scene.id };
        const layout = await page.page.evaluate(() => {
          const stage = document.querySelector('#stage')!,
            bounds = stage.getBoundingClientRect();
          const findings: string[] = [];
          for (const element of stage.querySelectorAll('text,[data-qa-text]')) {
            if (element.closest('[data-qa-ignore],[data-allow-overflow],defs,clipPath,mask'))
              continue;
            let visible = true;
            for (
              let ancestor: Element | null = element;
              ancestor && ancestor !== stage;
              ancestor = ancestor.parentElement
            ) {
              const style = getComputedStyle(ancestor);
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) < 0.05
              )
                visible = false;
            }
            if (!visible) continue;
            const box = element.getBoundingClientRect();
            if (!box.width || !box.height) continue;
            const outside =
              box.left < bounds.left - 2 ||
              box.right > bounds.right + 2 ||
              box.top < bounds.top - 2 ||
              box.bottom > bounds.bottom + 2;
            if (outside)
              findings.push(
                `Text extends beyond frame: ${(element.textContent ?? '').slice(0, 100)}`,
              );
            if (
              element instanceof HTMLElement &&
              (element.scrollWidth > element.clientWidth + 2 ||
                element.scrollHeight > element.clientHeight + 2)
            )
              findings.push(`Text overflows its box: ${(element.textContent ?? '').slice(0, 100)}`);
            if (element.hasAttribute('data-qa-safe')) {
              const insetX = bounds.width * 0.045,
                insetY = bounds.height * 0.045;
              if (
                box.left < bounds.left + insetX ||
                box.right > bounds.right - insetX ||
                box.top < bounds.top + insetY ||
                box.bottom > bounds.bottom - insetY
              )
                findings.push(
                  `Marked content outside safe area: ${(element.textContent ?? '').slice(0, 100)}`,
                );
            }
          }
          for (const font of document.fonts)
            if (font.status === 'error') findings.push(`Font failed: ${font.family}`);
          return findings;
        });
        for (const message of layout)
          issues.push({ level: 'warning', code: 'layout', sceneId: scene.id, time, message });
      }
    } catch (error) {
      issues.push({ level: 'error', code: 'browser', message: String(error) });
    } finally {
      await session.close();
    }
  }
  let video = options.video;
  if (!video) {
    const candidate = `renders/final/${project.id}.mp4`;
    try {
      await stat(join(directory, candidate));
      video = candidate;
    } catch {
      /* A final need not exist for storyboard QA. */
    }
  }
  let videoResult: QAReport['video'];
  if (video) {
    try {
      videoResult = {
        file: video,
        ...(await videoAudit(await localFile(directory, video), {
          duration: project.duration,
          fps: project.fps,
          ...project.resolution,
          audio: Boolean(project.narration.file),
        })),
      };
      issues.push(...videoResult.issues);
    } catch (error) {
      issues.push({ level: 'error', code: 'video-probe', message: String(error) });
    }
  }
  const unique = issues.filter(
    (issue, index, all) =>
      all.findIndex(
        (other) =>
          `${other.code}:${other.sceneId}:${other.message}` ===
          `${issue.code}:${issue.sceneId}:${issue.message}`,
      ) === index,
  ) as QAIssue[];
  const report: QAReport = {
    project: project.id,
    generatedAt: new Date().toISOString(),
    passed: unique.every((i) => i.level !== 'error'),
    samples,
    issues: unique,
    ...(videoResult ? { video: videoResult } : {}),
  };
  await atomicWrite(join(directory, 'renders', 'qa.json'), JSON.stringify(report, null, 2) + '\n');
  await atomicWrite(join(directory, 'renders', 'QA.md'), reportMarkdown(report));
  return report;
}
