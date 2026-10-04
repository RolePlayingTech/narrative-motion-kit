# Asset acquisition and provenance

Production media is local. Research may use the internet; final rendering must not request live websites. Store assets under the project and register their relative paths. Never point a render-critical image at an expiring download URL.

## Choose the right material

| Need                                       | Preferred material                                                      | Important check                              |
| ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------- |
| Identify a real person                     | Authentic licensed portrait                                             | Date, identity, neutral crop                 |
| Establish real geography                   | Cached geographic data and authentic location photos                    | Projection, period, disputed boundaries      |
| Show evidence                              | Original document, screenshot, archive scan, or labeled typeset excerpt | Exact excerpt and context                    |
| Explain an invisible process               | Diagram or clearly illustrative generated image                         | No implication that it is documentary proof  |
| Reconstruct a missing historical viewpoint | Explicitly labeled reconstruction                                       | Separate known details from artistic choices |

Prefer official institutions, museums, archives, Wikimedia Commons, and other sources with usable rights. Search for story relevance, not only keyword resemblance. Check the individual file's license; a site's logo or government domain does not make every image freely reusable.

## Manifest

Each asset includes `id`, local `file`, `kind`, `role`, acquisition date, and a meaningful `license` or usage note. Preserve `sourceUrl`, `author`, `originalFilename`, dimensions, and SHA-256 when known. Use `note` for modifications, crop rationale, restrictions, and verification details.

Roles are `documentary`, `illustrative`, `generated`, and `data`. Generated assets also require `prompt`; preserve generator/provider/model details in `generator` and `note`. Do not remove the provenance when cropping or recoloring. A modified derivative remains linked to its original source and rights.

## Generated asset workflow

Define the visual function first: background, metaphor, explanatory cross-section, transition shape, or stylized reconstruction. Write a prompt describing composition, focal area, negative space for labels, period constraints, and desired output dimensions. Use whichever image-generation provider the current environment offers; the engine does not require a particular paid service.

Save the returned image locally, inspect it, and register the exact prompt and generator. Check text artifacts, anatomy, visual contradictions, and accidental documentary cues. Use real material for identifiable politicians and evidentiary documents. Do not silently manufacture authentic-looking proof.

The manifest is the provider-neutral ingestion contract. `ImageGenerationProvider` in `packages/assets/index.ts` defines a generation interface returning image bytes, MIME type, and model information; no provider is bundled. Agents can acquire files with their available tools, then pass local files to the renderer. `acquireAsset` separately downloads an HTTPS original and writes a provenance sidecar from reviewed metadata.

## Quality checks

Run asset checks before rendering. Fix missing/corrupt files, broken references, insufficient effective resolution after crop/zoom, and unexpected dimensions. Duplicate hashes can reveal redundant downloads, but legitimate reuse is allowed. A large source image may still become soft after a deep crop; inspect the actual final frame.

Keep filenames stable and descriptive. Do not overwrite user originals. Cache a new derived file and record the transformation. Network screenshots should show only needed evidence and preserve URL/date; label a reconstructed layout rather than passing it off as an original screenshot.
