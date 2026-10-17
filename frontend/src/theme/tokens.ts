/** Brand colours from the design. These stay the same in light and dark mode. */
export const brand = {
  red: '#992428',
  redDark: '#6e1519',
  brown: '#4b1c14',
  cream: '#f6f4de',
  gold: '#fcc12d',
  orange: '#f7931e',
  green: '#1d9563',
  greenDark: '#0e5a3b',
  greenHover: '#23a870',
  ink: '#2b1d2a',
};

export type ThemeMode = 'light' | 'dark';

/**
 * Semantic colours that switch with the theme. Every one becomes a CSS variable
 * (`surfaceAlt` -> `--surface-alt`), so styled components just use `var(--...)`.
 */
const light = {
  bg: brand.cream,
  surface: '#ffffff',
  surfaceAlt: brand.cream,
  field: brand.cream,
  text: brand.ink,
  muted: '#7a6a4a',
  faint: '#a89a78',
  line: '#e3dbb8',
  /** Strong borders (the brutalist frames). */
  edge: brand.ink,
  /** Dark buttons. */
  btn: brand.ink,
  /** Brand red/green used as text colour (lightened in dark mode for contrast). */
  redText: brand.red,
  greenText: brand.green,
  shadow: 'rgba(75,28,20,.12)',
  shadowSoft: 'rgba(75,28,20,.08)',
  mask: 'rgba(43,29,42,.55)',
  stripeA: '#efe7cf',
  stripeB: '#e9e0c3',
  stripeText: '#a89a78',
  errorBg: '#fde8e6',
  /** Layer painted over the red lacquer texture. */
  texture: 'linear-gradient(transparent, transparent)',
  /** Charts: single-series marks, then categorical slots in fixed order (CVD-validated). */
  vizMain: brand.green,
  viz1: '#2a78d6',
  viz2: '#eb6834',
  viz3: '#1baf7a',
  vizGrid: '#ece5c8',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#17100f',
  surface: '#241a19',
  surfaceAlt: '#1c1413',
  field: '#1c1413',
  text: '#f3ecd6',
  muted: '#b5a582',
  faint: '#85775c',
  line: '#3b2e2b',
  edge: '#d9cda8',
  btn: '#3d2d2c',
  redText: '#f26b63',
  greenText: '#3fc58d',
  shadow: 'rgba(0,0,0,.45)',
  shadowSoft: 'rgba(0,0,0,.3)',
  mask: 'rgba(0,0,0,.65)',
  stripeA: '#2a1f1d',
  stripeB: '#251b19',
  stripeText: '#7d6f55',
  errorBg: '#3b1719',
  texture: 'linear-gradient(rgba(10,4,4,.3), rgba(10,4,4,.3))',
  vizMain: '#3fc58d',
  viz1: '#3987e5',
  viz2: '#d95926',
  viz3: '#199e70',
  vizGrid: '#33272a',
};

export const palettes: Record<ThemeMode, Palette> = { light, dark };

export interface AppTheme {
  mode: ThemeMode;
  c: Palette;
}

/** Max-width media queries (mobile-first overrides), matching antd's breakpoints. */
export const mq = {
  xs: '@media (max-width: 575px)',
  sm: '@media (max-width: 767px)',
  md: '@media (max-width: 991px)',
};

/** Horizontal page padding used by every section. */
export const GUTTER = 'clamp(16px,4vw,56px)';

export const FONT_DISPLAY = "'Cocogoose', 'Lexend', system-ui, sans-serif";
export const FONT_TEXT = "'Lexend', system-ui, sans-serif";
