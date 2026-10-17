import { motion } from 'framer-motion';
import styled from 'styled-components';
import { redTexture } from '@/components/ui';
import { mq } from '@/theme/tokens';

export const Fab = styled.button<{ $open: boolean }>`
  all: unset;
  box-sizing: border-box;
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 900;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  cursor: pointer;
  background: var(--gold);
  color: var(--ink);
  border: 3px solid var(--edge);
  box-shadow: 5px 5px 0 var(--brown);
  transition: transform .15s, box-shadow .15s;
  &:hover { transform: translate(-2px, -2px) rotate(-4deg); box-shadow: 7px 7px 0 var(--brown); }
  &:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--brown); }
  &:focus-visible { outline: 3px solid var(--green-text); outline-offset: 3px; }
  ${mq.xs} {
    right: 14px;
    bottom: 14px;
    width: 54px;
    height: 54px;
    /* The panel is full-screen here and has its own close button. */
    display: ${(p) => (p.$open ? 'none' : 'grid')};
  }
`;

export const Panel = styled(motion.section)`
  position: fixed;
  right: 20px;
  bottom: 96px;
  z-index: 900;
  width: min(390px, calc(100vw - 32px));
  height: min(600px, calc(100dvh - 120px));
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 3px solid var(--edge);
  box-shadow: 8px 8px 0 rgba(153, 36, 40, .9);
  overflow: hidden;
  ${mq.xs} {
    inset: 0;
    width: auto;
    height: auto;
    border: 0;
    box-shadow: none;
  }
`;

export const Head = styled.header`
  ${redTexture};
  flex: none;
  padding: 12px 12px 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  .title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  b {
    font-weight: 900;
    font-size: 20px;
    color: var(--gold);
    text-shadow: 0 2px 0 var(--brown);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  small { font-size: 12px; font-weight: 700; color: var(--cream); }
`;

export const Tabs = styled.div`
  flex: none;
  display: flex;
  border-bottom: 3px solid var(--edge);
  button {
    all: unset;
    flex: 1;
    cursor: pointer;
    text-align: center;
    padding: 10px 8px;
    font-weight: 900;
    font-size: 13px;
    letter-spacing: .04em;
    color: var(--muted);
    &[aria-selected='true'] { background: var(--gold); color: var(--ink); }
    &:focus-visible { outline: 2px solid var(--green-text); outline-offset: -4px; }
  }
  button + button { border-left: 3px solid var(--edge); }
`;

export const SearchBox = styled.div`
  flex: none;
  padding: 12px 14px;
  border-bottom: 2px dashed var(--line);
`;

export const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const Row = styled.button<{ $unread?: boolean }>`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  cursor: pointer;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 2px dashed var(--line);
  transition: background .15s;
  &:hover { background: var(--surface); }
  &:focus-visible { outline: 2px solid var(--green-text); outline-offset: -3px; }
  .name {
    font-weight: ${(p) => (p.$unread ? 900 : 800)};
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .preview {
    font-family: var(--font-body);
    font-size: 12px;
    color: ${(p) => (p.$unread ? 'var(--text)' : 'var(--muted)')};
    font-weight: ${(p) => (p.$unread ? 800 : 500)};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: 11px; color: var(--muted); }
`;

export const Dot = styled.span`
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  background: var(--red);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
`;

export const SectionLabel = styled.div`
  padding: 12px 14px 4px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  color: var(--muted);
`;

export const Messages = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DayLabel = styled.div`
  align-self: center;
  margin: 10px 0 6px;
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
`;

export const Bubble = styled.div<{ $mine: boolean; $tail: boolean }>`
  max-width: 80%;
  align-self: ${(p) => (p.$mine ? 'flex-end' : 'flex-start')};
  padding: 8px 12px;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border: 2px solid var(--edge);
  background: ${(p) => (p.$mine ? 'var(--gold)' : 'var(--surface)')};
  color: ${(p) => (p.$mine ? 'var(--ink)' : 'var(--text)')};
  box-shadow: ${(p) => (p.$tail ? `${p.$mine ? '3px' : '-3px'} 3px 0 var(--edge)` : 'none')};
  margin-bottom: ${(p) => (p.$tail ? '6px' : '0')};
  time { display: block; margin-top: 2px; font-size: 10px; font-weight: 700; opacity: .65; text-align: right; }
`;

export const Sender = styled.span<{ $mine: boolean }>`
  align-self: ${(p) => (p.$mine ? 'flex-end' : 'flex-start')};
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
  margin-top: 6px;
`;

export const Typing = styled.div`
  flex: none;
  padding: 0 16px 6px;
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  color: var(--muted);
  min-height: 20px;
`;

export const Composer = styled.form`
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 3px solid var(--edge);
  background: var(--surface);
  textarea { font-size: 14px; }
`;

export const SendButton = styled.button`
  all: unset;
  box-sizing: border-box;
  flex: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  cursor: pointer;
  background: var(--green);
  color: #fff;
  border: 2px solid var(--edge);
  transition: background .15s, transform .15s;
  &:hover:not(:disabled) { background: var(--green-hover); transform: rotate(-6deg); }
  &:disabled { opacity: .45; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--green-text); outline-offset: 2px; }
`;

export const Older = styled.button`
  all: unset;
  align-self: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  color: var(--green-text);
  padding: 4px 10px;
  margin-bottom: 8px;
  &:hover { text-decoration: underline; }
  &:disabled { opacity: .5; cursor: wait; }
`;
