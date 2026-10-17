import styled from 'styled-components';
import { mq } from '@/theme/tokens';

export const HeroTitle = styled.h1`
  margin: 0;
  font-weight: 900;
  font-size: clamp(56px,11vw,150px);
  line-height: .9;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 .2em;
`;

export const AddStoreCta = styled.button`
  all: unset;
  cursor: pointer;
  background: var(--green);
  color: var(--gold);
  font-weight: 900;
  font-size: clamp(18px,2vw,26px);
  padding: 10px 26px;
  outline: 2px dashed var(--cream);
  outline-offset: -7px;
  box-shadow: 0 0 0 4px var(--green), 0 7px 0 4px var(--green-dark);
  transform: rotate(-1.5deg);
  margin-top: 8px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform .2s, background .2s;
  &:hover { background: var(--green-hover); transform: rotate(0) scale(1.04); }
`;

export const MapFrame = styled.div`
  position: relative;
  z-index: 0;
  border: 3px solid var(--edge);
  box-shadow: 8px 8px 0 var(--red);
  background: var(--stripe-a);
  ${mq.xs} { box-shadow: 5px 5px 0 var(--red); }
`;

export const StoreCard = styled.div<{ $focus: boolean }>`
  background: var(--surface);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  box-shadow: 0 2px 0 var(--shadow), 0 10px 24px var(--shadow-soft);
  outline: ${(p) => (p.$focus ? '3px solid var(--gold)' : 'none')};
`;

export const Pill = styled.span<{ $dark?: boolean; $right?: boolean }>`
  position: absolute;
  top: 6px;
  ${(p) => (p.$right ? 'right: 6px;' : 'left: 6px;')}
  background: ${(p) => (p.$dark ? 'var(--ink)' : 'var(--gold)')};
  color: ${(p) => (p.$dark ? 'var(--gold)' : 'var(--ink)')};
  font-size: 10px;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 3px;
  pointer-events: none;
`;

export const ChatButton = styled.button`
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border: 2px solid var(--edge);
  background: var(--gold);
  color: var(--ink);
  font-weight: 900;
  font-size: 11px;
  transition: transform .15s;
  &:hover:not(:disabled) { transform: rotate(-3deg); }
  &:disabled { opacity: .5; cursor: wait; }
  &:focus-visible { outline: 2px solid var(--green-text); outline-offset: 2px; }
`;

export const LoveButton = styled.button<{ $on: boolean }>`
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
  min-width: 44px;
  padding: 5px 6px;
  border: 2px solid var(--green-text);
  font-weight: 900;
  font-size: 11px;
  line-height: 1.1;
  background: ${(p) => (p.$on ? 'var(--green)' : 'var(--surface)')};
  color: ${(p) => (p.$on ? 'var(--gold)' : 'var(--green-text)')};
  &:hover { animation: duBob .6s ease-in-out infinite; }
`;
