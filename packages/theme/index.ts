export interface Theme {
  background: string;
  panel: string;
  paper: string;
  ink: string;
  text: string;
  muted: string;
  accent: string;
  secondary: string;
  danger: string;
  grid: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  safe: number;
  stroke: number;
  grain: number;
  vignette: number;
  motion: number;
}
const editorial: Theme = {
  background: '#101c22',
  panel: '#192b32',
  paper: '#efe7d5',
  ink: '#101c22',
  text: '#f1ecdf',
  muted: '#90a5aa',
  accent: '#e9b85e',
  secondary: '#70bac1',
  danger: '#df7868',
  grid: '#2a3e44',
  fontDisplay: 'Barlow Condensed',
  fontBody: 'Manrope Variable',
  fontMono: 'IBM Plex Mono',
  safe: 0.055,
  stroke: 2,
  grain: 0.035,
  vignette: 0.2,
  motion: 1,
};
export const themes: Record<string, Theme> = {
  editorial,
  reportage: {
    ...editorial,
    background: '#101719',
    panel: '#202e31',
    paper: '#f1eadb',
    ink: '#172b30',
    text: '#f5f0e5',
    muted: '#a8bab7',
    accent: '#ed704b',
    secondary: '#9fc7bb',
    grid: '#324447',
    grain: 0.022,
    vignette: 0.1,
    safe: 0.048,
  },
  atlas: {
    ...editorial,
    background: '#102b39',
    panel: '#254957',
    paper: '#eee9d9',
    ink: '#183746',
    accent: '#edc375',
    secondary: '#8ad4cd',
    muted: '#b0c3c8',
    grid: '#385a66',
  },
  archive: {
    ...editorial,
    background: '#26251f',
    panel: '#38362d',
    accent: '#d9ad70',
    secondary: '#a4b8aa',
    grid: '#4a483d',
    muted: '#aaa695',
    grain: 0.06,
  },
  chronicle: {
    ...editorial,
    background: '#171916',
    panel: '#242620',
    paper: '#e8dec7',
    ink: '#25251f',
    text: '#f1e9d8',
    muted: '#a79b85',
    accent: '#a94b3a',
    secondary: '#c2a15f',
    danger: '#d06754',
    grid: '#3c3b31',
    fontDisplay: 'Barlow Condensed',
    fontBody: 'Manrope Variable',
    fontMono: 'IBM Plex Mono',
    safe: 0.055,
    stroke: 1.8,
    grain: 0.045,
    vignette: 0.14,
    motion: 0.88,
  },
  technical: {
    ...editorial,
    background: '#0e1825',
    panel: '#142638',
    accent: '#73cbd0',
    secondary: '#edbd76',
    grid: '#26384b',
    grain: 0.015,
  },
};
/** A light evidence/data page within the chosen art direction. Never mutates a preset. */
export function sceneTheme(theme: Theme, tone?: 'dark' | 'paper'): Theme {
  if (tone !== 'paper') return { ...theme };
  return {
    ...theme,
    background: theme.paper,
    panel: '#e3ddcf',
    text: theme.ink,
    muted: '#5b6867',
    accent: '#b44427',
    secondary: '#3d7773',
    grid: '#cdc8bc',
    vignette: 0,
    grain: 0.018,
  };
}
export function getTheme(name: string): Theme {
  const theme = themes[name];
  if (!theme) throw new Error(`Unknown theme: ${name}`);
  return { ...theme };
}
export function safeRect(
  width: number,
  height: number,
  theme: Theme,
): { x: number; y: number; width: number; height: number } {
  const margin = Math.min(width, height) * theme.safe;
  return { x: margin, y: margin, width: width - 2 * margin, height: height - 2 * margin };
}
