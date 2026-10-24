import styled, { css } from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';

/* ================================================================ layout */

/** Up to three equal columns that collapse to one on narrow screens. */
export const grid3 = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, max(220px, calc((100% - 48px) / 3))), 1fr));
`;

/** `$phone2` keeps two columns on phones (used for dish tiles). */
export const Grid3 = styled.div<{ $gap?: string; $phone2?: boolean }>`
  ${grid3};
  gap: ${(p) => p.$gap ?? '24px'};
  ${(p) => p.$phone2 && css`
    ${mq.xs} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  `}
`;

/** Up to four equal columns that collapse to one on narrow screens. */
export const grid4 = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, max(220px, calc((100% - 72px) / 4))), 1fr));
`;

/** Four-column variant of `Grid3`; `$phone2` keeps two columns on phones, `$min` lowers the 220px column floor so four columns fit narrower screens. */
export const Grid4 = styled.div<{ $gap?: string; $phone2?: boolean; $min?: number }>`
  ${grid4};
  ${(p) => p.$min && css`
    grid-template-columns: repeat(auto-fill, minmax(min(100%, max(${p.$min}px, calc((100% - 72px) / 4))), 1fr));
  `}
  gap: ${(p) => p.$gap ?? '24px'};
  ${(p) => p.$phone2 && css`
    ${mq.xs} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  `}
`;

/** Two columns side by side that stack below ~700px. */
export const Split = styled.div<{ $gap?: string; $min?: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, ${(p) => p.$min ?? 340}px), 1fr));
  gap: ${(p) => p.$gap ?? 'clamp(24px,4vw,48px)'};
  align-items: start;
`;

export const Container = styled.div<{ $max?: number }>`
  max-width: ${(p) => p.$max ?? 1100}px;
  margin: 0 auto;
`;

export const Section = styled.section<{ $pad?: string }>`
  padding: ${(p) => p.$pad ?? `40px ${GUTTER} 90px`};
  ${mq.xs} { padding-bottom: 64px; }
`;

export const Stack = styled.div<{ $gap?: number; $align?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.$gap ?? 14}px;
  align-items: ${(p) => p.$align ?? 'stretch'};
  min-width: 0;
`;

export const Row = styled.div<{ $gap?: string; $justify?: string; $align?: string; $wrap?: boolean }>`
  display: flex;
  gap: ${(p) => p.$gap ?? '12px'};
  justify-content: ${(p) => p.$justify ?? 'space-between'};
  align-items: ${(p) => p.$align ?? 'center'};
  flex-wrap: ${(p) => (p.$wrap ? 'wrap' : 'nowrap')};
  min-width: 0;
`;

/* ================================================================ brand surfaces */

/** The red lacquer-tray texture from the design assets (darkened in dark mode). */
export const redTexture = css`
  background-color: var(--red);
  background-image: var(--texture), url('/assets/red-texture.png');
  background-size: cover;
  background-position: center;
`;

export const BandShadow = styled.div<{ $both?: boolean; $margin?: string }>`
  position: relative;
  z-index: 2;
  margin: ${(p) => p.$margin ?? '0'};
  filter: ${(p) => (p.$both ? 'drop-shadow(0 -6px 0 var(--brown)) drop-shadow(0 6px 0 var(--brown))' : 'drop-shadow(0 7px 0 var(--brown))')};
`;

export const BandBody = styled.section<{ $clip: string; $pad: string }>`
  ${redTexture};
  padding: ${(p) => p.$pad};
  clip-path: ${(p) => p.$clip};
`;

export const Card = styled.div<{ $gap?: number }>`
  background: var(--surface);
  padding: 20px;
  box-shadow: 0 6px 0 var(--line);
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.$gap ?? 14}px;
  ${mq.xs} { padding: 16px; }
`;

export const CardTitle = styled.span`
  font-weight: 900;
  font-size: 18px;
  color: var(--green-text);
`;

/** Label/value line in totals. */
export const SumRow = styled.div<{ $size?: number; $bold?: boolean; $divider?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: ${(p) => p.$size ?? 14}px;
  font-weight: ${(p) => (p.$bold ? 900 : 'inherit')};
  ${(p) => p.$divider && css`border-top: 2px dashed var(--line); padding-top: 10px;`}
  & > span:last-child { font-weight: ${(p) => (p.$bold ? 900 : 700)}; white-space: nowrap; }
`;

export const Muted = styled.span<{ $size?: number }>`
  color: var(--muted);
  font-size: ${(p) => p.$size ?? 12}px;
  font-weight: 500;
`;

/* ================================================================ type */

export const strokeHead = css`
  color: var(--gold);
  -webkit-text-stroke: 2px var(--brown);
  paint-order: stroke fill;
  text-shadow: 0 3px 0 var(--brown);
`;

export const StrokeHeading = styled.h1<{ $size?: string; $align?: string }>`
  margin: 0;
  font-weight: 900;
  font-size: ${(p) => p.$size ?? 'clamp(30px,4vw,52px)'};
  text-align: ${(p) => p.$align ?? 'center'};
  ${strokeHead};
`;

/** Big two-tone hero words ("CƠM PHẦN", "CHỢ XÓM"). */
export const CreamWord = styled.span`
  color: var(--cream);
  -webkit-text-stroke: 3px var(--red-dark);
  paint-order: stroke fill;
  text-shadow: 0 .05em 0 var(--brown);
`;

export const GoldWord = styled.span`
  color: var(--gold);
  text-shadow: 0 .05em 0 #c2410c;
`;

export const FilterLabel = styled.span`
  font-weight: 900;
  font-size: clamp(22px,2.6vw,32px);
  color: var(--orange);
  text-shadow: 0 2px 0 var(--brown);
`;

export const FieldLabel = styled.label<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  min-width: 0;
  ${(p) => p.$wide && css`grid-column: 1 / -1;`}
`;

/** Inline error under a form field. */
export const FieldError = styled.span`
  color: var(--red-text);
  font-size: 12px;
  font-weight: 700;
`;

/** Live checklist of password rules; met rules turn green. */
export const RuleList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  li { display: flex; align-items: center; gap: 6px; opacity: .6; transition: color .2s, opacity .2s; }
  li[data-ok='true'] { color: var(--green-text); opacity: 1; }
`;

/* ================================================================ buttons */

const reset = css`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
`;

const INK_HOVER = {
  red: css`background: var(--red);`,
  green: css`background: var(--green);`,
  gold: css`background: var(--gold); color: var(--ink);`,
  dim: css`opacity: .85;`,
};

/** Small dark button ("Thêm vào giỏ", "Huỷ đơn", "Đặt lại"). */
export const InkButton = styled.button<{ $hover?: keyof typeof INK_HOVER; $round?: boolean }>`
  ${reset};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--btn);
  color: var(--cream);
  font-size: 12px;
  font-weight: 800;
  padding: 9px 14px;
  white-space: nowrap;
  border-radius: ${(p) => (p.$round ? '20px' : '0')};
  transition: background .2s, color .2s, opacity .2s;
  &:hover:not(:disabled) { ${(p) => INK_HOVER[p.$hover ?? 'red']} }
`;

/** Green button with the dashed cream inner outline. */
export const GreenButton = styled.button<{ $size?: number; $block?: boolean }>`
  ${reset};
  display: ${(p) => (p.$block ? 'block' : 'inline-block')};
  text-align: center;
  background: var(--green);
  color: var(--gold);
  font-weight: 900;
  font-size: ${(p) => p.$size ?? 18}px;
  padding: ${(p) => ((p.$size ?? 18) >= 20 ? '14px' : '10px 22px')};
  outline: 2px dashed var(--cream);
  outline-offset: -7px;
  transition: background .2s, filter .2s;
  &:hover:not(:disabled) { background: var(--green-hover); }
  &:disabled { background: var(--faint); }
`;

/** Underlined inline text button. */
export const TextButton = styled.button<{ $plain?: boolean; $size?: number }>`
  ${reset};
  font-size: ${(p) => p.$size ?? 13}px;
  font-weight: ${(p) => (p.$plain ? 700 : 800)};
  color: ${(p) => (p.$plain ? 'inherit' : 'var(--red-text)')};
  text-decoration: underline;
  text-underline-offset: 3px;
  &:hover { color: var(--red-text); }
`;

/** Rounded green filter pill. */
export const Chip = styled.button<{ $active?: boolean }>`
  ${reset};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  white-space: nowrap;
  font-weight: 800;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 2px solid ${(p) => (p.$active ? 'var(--green)' : 'var(--green-text)')};
  background: ${(p) => (p.$active ? 'var(--green)' : 'transparent')};
  color: ${(p) => (p.$active ? 'var(--gold)' : 'var(--green-text)')};
  transition: background .2s, color .2s;
  &:hover { background: var(--green); border-color: var(--green); color: var(--gold); }
`;

const ANIM = { pop: 'duPop .6s', wiggle: 'duWiggle .6s', roll: 'duRoll .7s', beat: 'duBeat .9s', bob: 'duBob .6s', nudge: 'duNudge .6s' };

/** Square icon button with a hover animation. */
export const IconButton = styled.button<{ $anim?: 'pop' | 'wiggle' | 'roll' | 'beat' | 'bob' | 'nudge'; $hoverColor?: string }>`
  ${reset};
  position: relative;
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  color: inherit;
  transition: color .2s;
  &:hover:not(:disabled) {
    color: ${(p) => p.$hoverColor ?? 'inherit'};
    ${(p) => p.$anim && css`animation: ${ANIM[p.$anim]} ease-in-out infinite;`}
  }
`;

export const CtaButton = styled.button<{ $rotate: number }>`
  ${reset};
  text-align: center;
  background: var(--green);
  color: var(--gold);
  font-weight: 900;
  font-size: clamp(20px,2.4vw,30px);
  padding: 10px 28px;
  outline: 2px dashed var(--cream);
  outline-offset: -7px;
  box-shadow: 0 0 0 4px var(--green), 0 7px 0 4px var(--green-dark);
  transform: rotate(${(p) => p.$rotate}deg);
  transition: transform .2s, background .2s;
  &:hover:not(:disabled) { background: var(--green-hover); transform: rotate(0deg) scale(1.04); }
`;

/* ================================================================ media */

/** `<img>` that fills its (positioned) parent, like next/image `fill`. */
export const FillImg = styled.img<{ $fit?: 'cover' | 'contain' }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: ${(p) => p.$fit ?? 'contain'};
  display: block;
`;

export const PhotoBox = styled.div<{ $radius?: string }>`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: ${(p) => p.$radius ?? '0'};
`;

export const ImgEmpty = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 8px;
  text-align: center;
  background: repeating-linear-gradient(-45deg, var(--stripe-a) 0 10px, var(--stripe-b) 10px 20px);
  color: var(--stripe-text);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
`;

/* ================================================================ states */

export const SpinnerBox = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 0;
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.$color};
`;

export const EmptyBox = styled.div`
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  & > b { font-weight: 900; font-size: 22px; color: var(--red-text); }
  & > span { font-size: 14px; color: var(--muted); max-width: 420px; line-height: 1.45; }
`;
