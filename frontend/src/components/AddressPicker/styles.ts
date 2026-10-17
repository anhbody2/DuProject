import styled from 'styled-components';

export const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
`;

/** Leaflet panes use high z-indexes; keep them under dropdowns and modals. */
export const PickMap = styled.div`
  grid-column: 1 / -1;
  position: relative;
  z-index: 0;
  border: 3px solid var(--edge);
  background: var(--stripe-a);
`;
