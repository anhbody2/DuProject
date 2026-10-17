import styled from 'styled-components';

export const Frame = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 2px dashed var(--line);
  background: var(--surface-alt);

  > :first-child:not(.empty) { position: absolute; inset: 0; }
  .empty { color: var(--muted); font-size: 13px; }
  .actions { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 6px; }
`;
