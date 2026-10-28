import styled, { css } from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';

export const FilterBar = styled.div<{ $sticky?: boolean }>`
  ${(p) => p.$sticky && css`
    position: sticky;
    top: var(--header-h, 0px);
    z-index: 4;
    background: var(--bg);
  `}
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 26px;
  padding: 12px 0;
  border-bottom: 2px solid var(--line);

  /* On phones the chips scroll sideways so the bar stays one line tall. */
  ${mq.sm} {
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 calc(-1 * ${GUTTER});
    padding: 10px ${GUTTER};
    &::-webkit-scrollbar { display: none; }
  }
`;

export const SubChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;

  ${mq.sm} {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

export const Tools = styled.div<{ $single?: boolean }>`
  display: grid;
  grid-template-columns: ${(p) => (p.$single ? '180px' : 'minmax(0, 1fr) 180px')};
  justify-content: end;
  gap: 10px;
  padding-top: 14px;

  ${mq.sm} { grid-template-columns: ${(p) => (p.$single ? '150px' : 'minmax(0, 1fr) 150px')}; }
`;
