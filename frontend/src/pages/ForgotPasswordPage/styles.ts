import styled from 'styled-components';

export const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  span { height: 6px; background: var(--edge); opacity: .15; transition: opacity .25s, background .25s; }
  span[data-on='true'] { background: var(--green); opacity: 1; }
`;

export const Hint = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  b { font-weight: 900; word-break: break-all; }
`;
