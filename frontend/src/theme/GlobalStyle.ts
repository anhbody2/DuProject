import { createGlobalStyle } from 'styled-components';
import { brand } from './tokens';

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `--${kebab(k)}: ${v};`).join('\n');

/**
 * Theme-dependent CSS variables and page colours. Static rules (fonts, keyframes,
 * Leaflet/antd overrides) live in `styles/base.css` so a theme switch doesn't
 * re-inject @font-face and flash the fonts.
 */
export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: ${(p) => p.theme.mode};
    ${vars(brand)}
    ${(p) => vars(p.theme.c)}
  }

  html, body {
    background: var(--bg);
    color: var(--text);
    /* Background only: a colour transition would also fade text in from black on first paint. */
    transition: background-color .3s ease;
  }
`;
