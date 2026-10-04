# Data visualization rules

Every chart begins with a question and supplied observations. A rising curve is a factual statement even if no numbers are printed beside it. Do not invent decorative data.

## Dataset contract

A dataset has an ID, title, source IDs, unit, status, and points. Each point has numeric `x`, numeric `y`, and optional label/series. Preserve dates and category labels explicitly. Use `note` for period, transformations, aggregation, uncertainty, and denominator. Source IDs must resolve in the project.

The current chart recipes use the supplied point order; prepare and review it deliberately. The line-chart recipe groups points by optional `series` and gives groups distinct colors and labels on shared axes. Use a few comparable series; inspect legend/axis crowding, and use a custom component when the question requires independent scales or a different encoding.

## Choose the form

| Question                            | Preferred form | Guardrail                                                                     |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| How did a quantity change?          | line-chart     | Ordered x values, visible period and unit                                     |
| How do categories compare?          | bar-chart      | Comparable categories, honest baseline                                        |
| What are parts of a total?          | breakdown      | Nonnegative, mutually compatible parts; define total                          |
| Which of two quantities is larger?  | comparison     | Same unit, comparable periods, supplied dataset                               |
| What scale should be remembered?    | statistic      | Source, denominator, meaningful rounding                                      |
| How do transfers or causes connect? | flow           | Arrows are relationships unless quantitative weights are explicitly supported |

## Scale and meaning

Bar lengths imply magnitude from a baseline; use zero for ordinary positive bar comparisons. A line-chart y-axis may exclude zero when ticks and context make the scale clear. Do not silently truncate to exaggerate change. Do not use area or diameter inconsistently to encode a quantity.

Show currency, price basis, geography, and time where relevant. “USD/barrel, monthly Brent, I–VI 2024” is a different quantity from “PLN/litre, Polish retail diesel, today.” A transition between them does not establish a conversion or causal relationship.

For indexed comparisons explain the base period and base value. For percentages name the denominator. For a total ensure parts share the same universe and period. A tax rate applied to a base is not necessarily the same as its share of a final gross price.

## Animation

Reveal in reading order and preserve the final data geometry. Animate an interpolated display only as a reveal; do not imply intermediate counter values were measured. Reveal a line along its actual points rather than reshaping it into a more dramatic curve. Keep reference axes stable while values emerge.

Annotation should explain the important observation, not narrate every point. If a caveat changes interpretation, put it on screen. A tiny citation cannot repair a misleading title.

## Verification

Compare at least first, last, minimum, maximum, and annotated values to source data. Review labels and axis domains in the rendered frame. Schema validation checks structure and references; it cannot determine whether your data selection is fair or whether an external source supports the claim.
