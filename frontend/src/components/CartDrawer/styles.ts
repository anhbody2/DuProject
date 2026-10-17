import styled from 'styled-components';
import { redTexture } from '@/components/ui';

export const Head = styled.div`
  ${redTexture};
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  b { font-weight: 900; font-size: 28px; color: var(--gold); text-shadow: 0 3px 0 var(--brown); }
  small { font-size: 13px; font-weight: 800; color: var(--cream); margin-left: 10px; }
`;

export const FeeNote = styled.div`
  padding: 14px 20px;
  border-bottom: 2px dashed var(--line);
  font-size: 12px;
  font-weight: 800;
  color: var(--green-text);
`;

export const Lines = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px;
`;

export const Line = styled.div<{ $off: boolean }>`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  padding: 14px 0;
  border-bottom: 2px dashed var(--line);
  opacity: ${(p) => (p.$off ? 0.55 : 1)};
`;

export const Qty = styled.div`
  display: flex;
  align-items: center;
  border: 2px solid var(--edge);
  background: var(--surface);
  span { min-width: 28px; text-align: center; font-weight: 900; font-size: 14px; }
  button {
    all: unset;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 18px;
    transition: background .2s, color .2s;
    &:hover:not(:disabled) { background: var(--gold); color: var(--ink); }
  }
`;

export const Foot = styled.div`
  border-top: 3px solid var(--edge);
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
`;
