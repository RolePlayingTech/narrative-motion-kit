# Cena paliwa. Dwa porządki, jeden rachunek. — źródła i pochodzenie

Automatically generated from the validated project manifest.

## Factual sources

- **natural-earth**: [Natural Earth 1:10m countries — local Gulf region](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) — Natural Earth, retrieved 2026-10-04. Public-domain geographic polygons; see research/map-provenance.json. Route is schematic, not a navigation track.
- **demo**: [Przykład graficzny — cena umowna, nie obserwacja rynkowa](https://example.org/illustrative-demo) — Świadek Dziejów / demo, retrieved 2026-10-03. Internal illustrative fixture. URL is a reserved example domain; not an external factual source.
- **constitution**: [Konstytucja RP: art. 118–122](https://www.prezydent.pl/kancelaria/archiwum/andrzej-duda/prawo/konstytucja-rp/iv-sejm-i-senat) — Konstytucja RP, retrieved 2026-10-03.
- **tax-law**: [Art. 217 — podatki w drodze ustawy](https://bip.brpo.gov.pl/pl/kategoria-konstytucyjna/art-217-zasady-nakladania-podatkow?page=2) — RPO / art. 217, retrieved 2026-10-03.
- **eia-hormuz**: [Hormuz: 20 mln baryłek dziennie w 2024 r.](https://www.eia.gov/todayinenergy/detail.php?id=65504) — EIA • 16.06.2025, retrieved 2026-10-03. Dated 2024 average; schematic routes, not measured ship counts.
- **eia-brent**: [Europe Brent Spot Price FOB — monthly, I–VI 2024](https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=M) — EIA • Brent 2024, retrieved 2026-10-03. Historical monthly USD/barrel. This series does not establish causality from Hormuz.
- **eia-process**: [Oil and petroleum products explained](https://www.eia.gov/energyexplained/oil-and-petroleum-products/) — EIA / petroleum, retrieved 2026-10-03. Supply-chain diagram is qualitative. No measured component weights.
- **portraits**: [Fotografie archiwalne instytucji — osoby pełniące funkcje w 2024 r.](https://commons.wikimedia.org/wiki/File:Donald_Tusk_KPRM_HQ.jpg) — KPRM / KPRP • archiwum, retrieved 2026-10-03. Separate image provenance for each portrait in assets. Historical roles, not a statement about current officeholders.

## Claims

- **illustrative-price** [illustrative; high]: 6,49 zł/l is an illustrative pump display, not a market observation. Sources: demo. Scenes: pump. Numeric data: 6.49.
- **legal-roles** [verified; high]: Both government and president may initiate legislation; the parliamentary procedure and president’s constitutional powers matter. Sources: constitution. Scenes: institutions.
- **tax-statute** [verified; high]: The essential tax matters listed in Article 217 are regulated by statute. Sources: tax-law. Scenes: legal-evidence.
- **supply** [interpretation; high]: Refining and transport connect crude oil to consumer fuels; diagram is qualitative. Sources: eia-process. Scenes: supply-chain.
- **hormuz-scale** [estimate; high]: Hormuz oil flow averaged 20 million barrels/day in 2024, approximately 20% of global petroleum liquids consumption. Sources: eia-hormuz. Scenes: hormuz. Numeric data: 20, 20.
- **brent-history** [verified; high]: Monthly Brent spot prices rose and fell between January and June 2024. Sources: eia-brent. Scenes: brent. Numeric data: 80.12, 83.48, 85.41, 89.94, 81.75, 82.25.

## Assets

- **hormuz-geography** — `assets/hormuz-natural-earth-10m.geojson`; geojson; **data**; license: Public domain — https://www.naturalearthdata.com/about/terms-of-use/; acquired 2026-10-04. [Original source](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson). Author: Natural Earth contributors. SHA-256: `9e139661403277d5e4bd3510a18c02eedad0e252a54b969791cc3a504d032dec`.
  Full polygon components intersecting 40–68E/14–35N, no simplification; provenance in research/map-provenance.json.
- **tusk** — `assets/tusk.jpg`; image; **documentary**; license: CC BY 3.0 PL — https://creativecommons.org/licenses/by/3.0/pl/; acquired 2026-10-03. [Original source](https://commons.wikimedia.org/wiki/File:Donald_Tusk_KPRM_HQ.jpg). Author: Kancelaria Prezesa Rady Ministrów / Gov.pl. Original: Donald Tusk KPRM HQ.jpg. SHA-256: `6597225797e52a4cdf11c7ea28d0c1c0ba46effdce26615467de476445085516`.
  Portrait dated 19 December 2023, English-language Gov.pl licensed version. Screen crop and equal color treatment. Original source https://www.gov.pl/web/primeminister/donald-tusk
- **duda** — `assets/duda.jpg`; image; **documentary**; license: CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/; acquired 2026-10-03. [Original source](https://commons.wikimedia.org/wiki/File:Andrzej_Duda_Official_Portrait.jpg). Author: Jakub Szymczuk / Kancelaria Prezydenta RP (Commons attribution). Original: Andrzej Duda Official Portrait.jpg. SHA-256: `0e6979aaabfa88f100f0709161a26fdedf8da2e320a5209a950a1149bd4d4175`.
  Portrait dated 7 January 2019. Display crop/overlay adaptation under CC BY-SA 4.0. Original download retains its license; see MEDIA_LICENSE.md.
- **world** — `assets/world-50m.topo.json`; topojson; **data**; license: Natural Earth public domain; world-atlas ISC — https://www.naturalearthdata.com/about/terms-of-use/; acquired 2026-10-03. [Original source](https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json). Author: Natural Earth; world-atlas by Mike Bostock. Original: countries-50m.json. SHA-256: `04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394`.
  Simplified 1:50m land/country geometry. Illustrative routes are not navigational charts.

## Datasets

- **brent-2024**: Brent • I–VI 2024; verified; unit USD / baryłkę; sources eia-brent. Values: STY: 80.12; LUT: 83.48; MAR: 85.41; KWI: 89.94; MAJ: 81.75; CZE: 82.25. All six observations in selected continuous period. Not Polish retail price and not causal attribution.

## Narration

- Type: synthetic; file: narration/narration.wav. Microsoft Paulina Desktop, local Windows TTS. Original demo script. Synthetic narration, not an imitation of a real person.
