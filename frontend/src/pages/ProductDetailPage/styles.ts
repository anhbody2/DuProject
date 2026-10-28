import styled, { css } from 'styled-components';
import { mq } from '@/theme/tokens';

export const Crumbs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 20px;
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--red-text); }
  span:last-child { color: var(--text); }
`;

// Square, but capped so it doesn't fill a whole column on wide screens or when the
// layout drops to one column.
export const MainPhoto = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  background: var(--surface);
  padding: 10px;
  box-shadow: 0 2px 0 var(--shadow), 0 10px 24px var(--shadow-soft);
`;

export const Thumbs = styled.div`
  display: flex;
  gap: 10px;
  max-width: 440px;
  margin: 12px auto 0;
  overflow-x: auto;
`;

export const Thumb = styled.button<{ $active: boolean }>`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  flex: none;
  width: 72px;
  height: 72px;
  padding: 3px;
  background: var(--surface);
  outline: 2px solid ${(p) => (p.$active ? 'var(--green)' : 'transparent')};
  outline-offset: -2px;
  transition: outline-color .2s;
  &:hover { outline-color: var(--green-text); }
`;

export const Tag = styled.span<{ $soldOut: boolean }>`
  position: absolute;
  top: 18px;
  left: 18px;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 4px 9px;
  border-radius: 3px;
  background: ${(p) => (p.$soldOut ? 'var(--ink)' : 'var(--green)')};
`;

export const Title = styled.h1`
  margin: 0;
  font-weight: 900;
  font-size: clamp(26px, 3.4vw, 40px);
  line-height: 1.15;
  color: var(--green-text);
`;

export const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-weight: 900;
  font-size: 28px;
  color: var(--red-text);
  s { font-size: 16px; font-weight: 600; color: var(--faint); }
`;

/** Sanitized description HTML; the same rules style the editor's content area. */
export const richText = css`
  font-size: 15px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  & > :first-child { margin-top: 0; }
  & > :last-child { margin-bottom: 0; }
  p { margin: 0 0 .6em; }
  h2 { font-size: 20px; font-weight: 900; margin: 1em 0 .4em; }
  h3 { font-size: 17px; font-weight: 800; margin: .9em 0 .3em; }
  ul, ol { margin: 0 0 .6em; padding-left: 1.4em; }
  li p { margin: 0; }
  blockquote { margin: 0 0 .6em; padding: 2px 0 2px 12px; border-left: 3px solid var(--green); color: var(--muted); }
  hr { border: 0; border-top: 2px dashed var(--line); margin: 1em 0; }
  a { color: var(--green-text); font-weight: 700; }
`;

export const Description = styled.div`${richText}`;

export const EditorBox = styled.div<{ $focused: boolean }>`
  border: 2px solid ${(p) => (p.$focused ? 'var(--green)' : 'var(--edge)')};
  background: var(--bg);
  transition: border-color .2s;
  .tiptap {
    ${richText}
    min-height: 180px;
    max-height: 480px;
    overflow-y: auto;
    padding: 14px 16px;
    outline: none;
  }
  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: var(--muted);
    pointer-events: none;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px;
  border-bottom: 2px solid var(--edge);
  background: var(--surface);
  position: sticky;
  top: var(--header-h, 0px);
  z-index: 1;
`;

export const ToolButton = styled.button<{ $active?: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: ${(p) => (p.$active ? 'var(--gold)' : 'var(--text)')};
  background: ${(p) => (p.$active ? 'var(--green)' : 'transparent')};
  transition: background .15s;
  &:hover:not(:disabled) { background: ${(p) => (p.$active ? 'var(--green)' : 'var(--surface-alt)')}; }
  &:disabled { opacity: .35; cursor: default; }
  &:focus-visible { outline: 2px solid var(--green-text); outline-offset: -2px; }
`;

export const ToolSep = styled.span`
  width: 2px;
  margin: 4px 4px;
  background: var(--edge);
`;

export const Stepper = styled.div`
  display: inline-flex;
  align-items: center;
  border: 2px solid var(--edge);
  button { width: 40px; height: 40px; }
  button:disabled { opacity: .35; cursor: default; }
  span { min-width: 36px; text-align: center; font-weight: 800; }
`;

export const Stars = styled.span<{ $size?: number }>`
  display: inline-flex;
  gap: 2px;
  color: var(--gold);
  svg { width: ${(p) => p.$size ?? 16}px; height: ${(p) => p.$size ?? 16}px; }
`;

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 0;
  border-top: 2px dashed var(--line);
  &:first-child { border-top: none; padding-top: 0; }
  p { margin: 0; font-size: 14px; line-height: 1.5; }
`;

export const Avatar = styled.span`
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--green);
  color: var(--gold);
  font-weight: 900;
  font-size: 14px;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const SectionHead = styled.h2`
  margin: 0 0 20px;
  font-weight: 900;
  font-size: 22px;
  color: var(--green-text);
  ${mq.xs} { font-size: 19px; }
`;

/** Average score beside the per-star bars; stacks on phones. */
export const Summary = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
  padding: 16px 20px;
  background: var(--surface-alt);
  ${mq.xs} { grid-template-columns: 1fr; gap: 16px; }
`;

export const ScoreBig = styled.span`
  font-weight: 900;
  font-size: 44px;
  line-height: 1;
  color: var(--green-text);
`;

export const Bar = styled.div<{ $pct: number }>`
  display: grid;
  grid-template-columns: 34px 1fr 28px;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  span:first-child { display: inline-flex; align-items: center; gap: 3px; color: var(--gold); }
  span:first-child::first-letter { color: var(--text); }
  span:last-child { text-align: right; }
  div {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, var(--gold) ${(p) => p.$pct}%, var(--line) ${(p) => p.$pct}%);
  }
`;

export const Composer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 2px dashed var(--line);
`;

export const StarPick = styled.div`
  display: inline-flex;
  gap: 2px;
  color: var(--gold);
  button {
    all: unset;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: transform .15s;
  }
  button:hover { transform: scale(1.15); }
  button:focus-visible { outline: 2px solid var(--green-text); outline-offset: 2px; }
`;

export const OwnBadge = styled.span`
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--green);
  color: var(--gold);
`;

/** Replies hang under the feedback, indented past its avatar. */
export const Replies = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 4px 0 0 42px;
  padding-left: 12px;
  border-left: 2px solid var(--line);
  ${mq.xs} { margin-left: 16px; }
`;

export const ReplyItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  p { margin: 2px 0 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
`;
