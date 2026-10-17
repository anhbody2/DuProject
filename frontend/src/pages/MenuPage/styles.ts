import styled from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';

export const Kicker = styled.p`
  max-width: 1100px;
  margin: 0 auto 14px;
  padding: 0 ${GUTTER};
  color: var(--gold);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: .08em;
`;

export const CatHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  h2 { margin: 0; color: var(--green-text); font-weight: 900; font-size: 22px; }
`;
