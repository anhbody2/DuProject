import styled from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';

export const Wrap = styled.footer`
  padding: 40px ${GUTTER} 0;
  position: relative;
  overflow: hidden;
  background-color: var(--bg);
`;

export const Top = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: space-between;
  align-items: flex-start;
`;

export const Links = styled.div`
  padding: 24px 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 24px;
  flex: 1 1 380px;
  max-width: 580px;
  font-size: 12px;
  ${mq.xs} { padding: 8px 0; grid-template-columns: repeat(2, 1fr); }
`;

export const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  b { font-weight: 900; font-size: 13px; }
  a { color: inherit; &:hover { color: var(--red-text); } }
`;

export const Newsletter = styled.div`
  padding: 24px 28px;
  flex: 1 1 280px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  ${mq.xs} { padding: 8px 0; }
  h3 { margin: 0; font-weight: 900; font-size: 22px; line-height: 1.15; }
  form { display: flex; border-bottom: 2px solid var(--edge); padding-bottom: 6px; gap: 8px; }
  .ant-input { flex: 1; min-width: 0; background: transparent; font-size: 14px; padding-left: 0; height: 40px; }
`;

export const Bottom = styled.div`
  max-width: 1200px;
  margin: 30px auto 0;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
`;

export const LogoTilt = styled.div`
  position: relative;
  width: clamp(150px,24vw,280px);
  aspect-ratio: 102 / 81;
  transform: translate(0, 12%) rotate(8deg);
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
`;

export const Legal = styled.div`
  flex: 1;
  min-width: 220px;
  border-top: 2px solid var(--red);
  padding: 14px 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
`;

export const Social = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--btn);
  color: var(--cream);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background .2s;
  &:hover { animation: duPop .6s ease-in-out infinite; background: var(--red); }
`;
