import styled, { css } from 'styled-components';
import { mq } from '@/theme/tokens';

export type Variant = 'today' | 'fresh' | 'menu';

const WRAP: Record<Variant, ReturnType<typeof css>> = {
  today: css``,
  fresh: css`padding: 8px; box-shadow: 0 10px 24px rgba(0,0,0,.25);`,
  menu: css`padding: 8px; box-shadow: 0 2px 0 var(--shadow), 0 10px 24px var(--shadow-soft);`,
};

export const Tile = styled.div<{ $variant: Variant }>`
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  ${(p) => WRAP[p.$variant]};
`;

export const Tag = styled.span<{ $big: boolean; $soldOut: boolean }>`
  position: absolute;
  top: 6px;
  left: 6px;
  color: #fff;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 3px;
  pointer-events: none;
  font-size: ${(p) => (p.$big ? 14 : 10)}px;
  background: ${(p) => (p.$soldOut ? 'var(--ink)' : 'var(--green)')};
  ${mq.xs} { font-size: 10px; }
`;

export const AddButton = styled.button`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  margin-top: auto;
  background: var(--btn);
  color: var(--cream);
  padding: 9px;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 8px;
  line-height: 1.4;
  text-align: center;
  transition: background .2s;
  &:hover:not(:disabled) { background: var(--green); }
  span { white-space: nowrap; }
  s { color: var(--faint); margin-left: 6px; font-weight: 500; }
`;
