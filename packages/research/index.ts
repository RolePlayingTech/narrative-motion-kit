import type { Project } from '../schema/index.ts';

const safe = (text: string) => text.replace(/[\r\n]+/g, ' ').replace(/[|]/g, '\\|');
export function sourcesMarkdown(project: Project): string {
  const lines = [
    `# ${project.title} — źródła i pochodzenie`,
    '',
    'Automatically generated from the validated project manifest.',
    '',
    '## Factual sources',
    '',
  ];
  for (const source of project.sources)
    lines.push(
      `- **${safe(source.id)}**: [${safe(source.title)}](${source.url}) — ${safe(source.publisher)}, retrieved ${source.retrieved}.${source.note ? ` ${safe(source.note)}` : ''}`,
    );
  lines.push('', '## Claims', '');
  for (const claim of project.claims)
    lines.push(
      `- **${claim.id}** [${claim.status}; ${claim.confidence}]: ${safe(claim.text)} Sources: ${claim.sourceIds.join(', ')}. Scenes: ${claim.usedInScenes.join(', ')}.${claim.numericData ? ` Numeric data: ${claim.numericData.join(', ')}.` : ''}${claim.notes ? ` ${safe(claim.notes)}` : ''}`,
    );
  lines.push('', '## Assets', '');
  for (const asset of project.assets) {
    lines.push(
      `- **${asset.id}** — \`${asset.file}\`; ${asset.kind}; **${asset.role}**; license: ${safe(asset.license)}; acquired ${asset.acquired}. ${asset.sourceUrl ? `[Original source](${asset.sourceUrl}).` : 'Locally supplied.'}${asset.author ? ` Author: ${safe(asset.author)}.` : ''}${asset.originalFilename ? ` Original: ${safe(asset.originalFilename)}.` : ''}${asset.sha256 ? ` SHA-256: \`${asset.sha256}\`.` : ''}`,
    );
    if (asset.prompt)
      lines.push(
        `  Generation prompt (${asset.generator ?? 'provider unspecified'}): ${safe(asset.prompt)}`,
      );
    if (asset.note) lines.push(`  ${safe(asset.note)}`);
  }
  lines.push('', '## Datasets', '');
  for (const dataset of project.datasets)
    lines.push(
      `- **${dataset.id}**: ${safe(dataset.title)}; ${dataset.status}; unit ${safe(dataset.unit)}; sources ${dataset.sourceIds.join(', ')}. Values: ${dataset.points.map((p) => `${p.label ?? p.x}: ${p.y}`).join('; ')}.${dataset.note ? ` ${safe(dataset.note)}` : ''}`,
    );
  lines.push(
    '',
    '## Narration',
    '',
    `- Type: ${project.narration.kind}; file: ${project.narration.file ?? 'none'}. ${project.narration.note ?? ''}`,
    '',
  );
  return lines.join('\n');
}
