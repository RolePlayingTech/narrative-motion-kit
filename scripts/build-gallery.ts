import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseProject } from '../packages/schema/index';

const root = join(import.meta.dirname, '..'),
  directory = join(root, 'projects', 'scene-gallery');
const demo = parseProject(
  JSON.parse(await readFile(join(root, 'projects/demo-fuel-prices/project.json'), 'utf8')),
);
await mkdir(directory, { recursive: true });
await cp(join(root, 'projects/demo-fuel-prices/assets'), join(directory, 'assets'), {
  recursive: true,
});
const common = {
  mode: 'CONTEXT',
  thesis: 'Każda receptura korzysta z tej samej absolutnej osi czasu.',
  addedInformation: 'Galeria przedstawia gotowe receptury i sposoby rozszerzania silnika.',
  sourceIds: [],
  claimIds: [],
  beats: [
    { at: 0.5, label: 'Wprowadzenie' },
    { at: 2, label: 'Rozwinięcie' },
  ],
};
const definitions = [
  {
    ...common,
    type: 'photo',
    id: 'photo',
    title: 'Fotografia jest świadectwem',
    kicker: 'BIBLIOTEKA / PHOTO',
    asset: 'tusk',
    caption: 'Donald Tusk • fotografia KPRM z 2023 r. • archiwum',
    focus: [0.5, 0.25],
    treatment: 'archive',
    sourceIds: ['portraits'],
  },
  {
    ...common,
    type: 'timeline',
    id: 'timeline',
    title: 'Opowieść w kolejnych etapach',
    kicker: 'BIBLIOTEKA / TIMELINE',
    subtitle: 'Oś redakcyjna: odległości nie oznaczają czasu historycznego.',
    events: [
      { date: '01', label: 'NARRACJA', detail: 'czas jako punkt odniesienia' },
      { date: '02', label: 'DOWODY', detail: 'źródła i lokalne zasoby' },
      { date: '03', label: 'OBRAZ', detail: 'sceny i przejścia' },
      { date: '04', label: 'KONTROLA', detail: 'render, inspekcja, rewizja' },
    ],
  },
  {
    ...common,
    type: 'statistic',
    id: 'statistic',
    title: 'Jedna wielkość. Czytelna skala.',
    kicker: 'BIBLIOTEKA / BIG STATISTIC',
    mode: 'SCALE',
    value: 20,
    from: 0,
    decimals: 0,
    unit: 'mln b/d',
    label: 'Przepływ ropy przez Ormuz • średnia w 2024 r.',
    variant: 'editorial',
    sourceIds: ['eia-hormuz'],
  },
  {
    ...common,
    type: 'comparison',
    id: 'comparison',
    title: 'Porównuj na wspólnej podstawie',
    kicker: 'BIBLIOTEKA / COMPARISON',
    mode: 'CONTRAST',
    left: { label: 'STYCZEŃ 2024', value: 80.12, detail: 'Średnia miesięczna' },
    right: { label: 'KWIECIEŃ 2024', value: 89.94, detail: 'Średnia miesięczna' },
    unit: 'USD / baryłkę',
    dataset: 'brent-2024',
    sourceIds: ['eia-brent'],
  },
  {
    ...common,
    type: 'bar-chart',
    id: 'bars',
    title: 'Czas w sześciu ujęciach',
    kicker: 'BIBLIOTEKA / BAR CHART',
    mode: 'SCALE',
    dataset: 'demo-duration',
    xLabel: 'UJĘCIA DEMONSTRACJI',
    yLabel: 'SEKUNDY',
    sourceIds: ['gallery-data'],
  },
  {
    ...common,
    type: 'breakdown',
    id: 'parts',
    title: 'Te same dane, nowy kontekst',
    kicker: 'BIBLIOTEKA / BREAKDOWN',
    mode: 'SCALE',
    dataset: 'demo-duration',
    totalLabel: 'Całkowity czas demonstracji',
    orientation: 'horizontal',
    sourceIds: ['gallery-data'],
    transition: {
      type: 'bar-to-layer',
      duration: 0.8,
      reason: 'Długość każdego ujęcia staje się udziałem w całym filmie.',
      anchor: [0.5, 0.55],
    },
  },
  {
    ...common,
    type: 'custom',
    id: 'globe',
    title: 'Geografia zyskuje głębię',
    kicker: 'ROZSZERZENIE / THREE.JS',
    renderer: 'globe',
    props: { asset: 'world', fromLongitude: 0, toLongitude: 56, latitude: 24 },
  },
  {
    ...common,
    type: 'custom',
    id: 'canvas',
    title: 'Przepływ jako metafora',
    kicker: 'ROZSZERZENIE / CANVAS',
    subtitle: 'Ilustracja proceduralna • cząstki nie przedstawiają danych.',
    mode: 'METAPHOR',
    renderer: 'particle-flow',
    props: { count: 160 },
  },
  {
    ...common,
    type: 'custom',
    id: 'html',
    title: 'Typografia i dokumenty HTML',
    kicker: 'ROZSZERZENIE / DOM',
    mode: 'EVIDENCE',
    renderer: 'document-dom',
    props: {
      heading: 'To jest prawdziwa warstwa HTML.',
      body: 'Scena może łączyć układ dokumentu, wektorowe adnotacje i grafikę przestrzenną. Każdy stan wyznacza czas, a render czeka na gotowość warstw.',
    },
  },
];
const gallery = parseProject({
  ...demo,
  id: 'scene-gallery',
  title: 'Atlas scen • Świadek Dziejów',
  duration: definitions.length * 4,
  narration: {
    kind: 'silent-demo',
    note: 'Intentional silent component gallery, not a completed documentary.',
  },
  claims: [],
  sources: [
    ...demo.sources,
    {
      id: 'gallery-data',
      title: 'Durations read from local demo-fuel-prices/project.json',
      publisher: 'Projekt demo / pomiar osi czasu',
      url: 'https://example.org/local-project/demo-fuel-prices',
      retrieved: '2026-10-03',
      note: 'Internal fixture URL; actual source is the checked-in sibling project manifest, no external research implied.',
    },
  ],
  datasets: [
    ...demo.datasets,
    {
      id: 'demo-duration',
      title: 'Czas ujęć demonstracji',
      sourceIds: ['gallery-data'],
      unit: 's',
      status: 'verified',
      points: demo.scenes.map((s, i) => ({
        x: i,
        y: Number((s.end - s.start).toFixed(6)),
        label: ['CENA', 'INSTYTUCJE', 'PRAWO', 'ŁAŃCUCH', 'MAPA', 'BRENT'][i],
      })),
    },
  ],
  scenes: definitions.map((s, i) => ({ ...s, start: i * 4, end: (i + 1) * 4 })),
});
await writeFile(join(directory, 'project.json'), JSON.stringify(gallery, null, 2) + '\n');
console.log(`Gallery built: ${gallery.scenes.length} scenes / ${gallery.duration}s`);
