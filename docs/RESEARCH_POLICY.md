# Research and factual integrity

Keep four concepts separate: a **source** is a publication; a **claim** is a statement supported or attributed by sources; a **dataset** is observations with units and period; an **asset** is a local media file with provenance. A photograph's license does not establish a factual claim, and a claim's citation does not license a photograph.

## Source and claim records

Sources require `id`, `title`, `url`, `publisher`, and `retrieved` (`YYYY-MM-DD`); use `note` for publication date, scope, table/section, or a stable archived link. Claims require text, source IDs, status, confidence, notes when needed, and scene IDs. A source URL alone is insufficient if the page does not actually support the rendered statement.

Use statuses deliberately:

| Status            | Meaning                                         | Viewer treatment                                             |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `verified`        | Checked against an appropriate source           | State with date/unit/context                                 |
| `estimate`        | A source or calculation estimates a quantity    | Say “estimated,” show uncertainty where material             |
| `interpretation`  | Analysis connecting facts                       | Attribute or signal interpretation                           |
| `political-claim` | A political actor asserts or proposes something | Identify the actor; do not make it narrator-established fact |
| `illustrative`    | Constructed example or scenario                 | Visibly label the example/scenario                           |

Confidence records editorial confidence in the support, not an objective probability. A political claim can be high-confidence as an attribution while its underlying allegation remains unverified.

## Research sequence

Start with the exact claim, unit, region, and time period. Prefer primary institutions, original datasets, archives, statutes, and original documents. Read the relevant source section; a search snippet can omit a denominator or qualification. Confirm freshness for active laws, officeholders, and current events. Preserve retrieval date separately from event and publication dates.

For numbers, keep enough detail to reproduce the calculation. For a chart assembled from a table, save the supplied observations and describe selection/aggregation. Do not interpolate missing measurements as observations. Label estimates and mark missing values explicitly in source preparation.

## Political topics

Distinguish institutional powers, public promises, bills, enacted laws, implementation, and measured effects. A diagram can accidentally convert “may” into “will.” Review arrow labels and the implied causal direction. Show balanced evidence and equivalent portrait treatment. Do not use composition or animation to suggest guilt, incompetence, or popularity without support.

## Provenance and final review

Link every factual visual to source and claim records. Quantitative scene source requirements are validated; whether the source supports the exact claim still needs human/agent editorial review. Generate the source list for each final output, and preserve asset provenance and generation prompts alongside it.

Ask during review: could this frame be shared without audio and mislead someone about what happened, when, or how certain it is? If yes, add the missing qualifier or redesign it.
