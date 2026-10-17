import styled from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';
import { Container, Reveal, InkButton, grid3, strokeHead } from '@/components/ui';

export const HeroStage = styled.div`
  position: relative;
  height: clamp(300px,52vw,600px);
  max-width: 1200px;
  margin: 0 auto;
  ${mq.xs} { height: 330px; }
`;

export const HeroTitle = styled.h1`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  text-align: center;
  font-weight: 900;
  font-size: clamp(54px,13.5vw,196px);
  line-height: .9;
  letter-spacing: -.01em;
  pointer-events: none;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0 .22em;
  ${mq.xs} { font-size: 64px; }
`;

export const Tagline = styled.p`
  margin: 0;
  color: var(--orange);
  font-weight: 800;
  font-size: clamp(13px,1.4vw,17px);
  letter-spacing: .04em;
  text-align: center;
`;

export const Centered = styled.div<{ $gap?: number; $mt?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(p) => p.$gap ?? 18}px;
  margin-top: ${(p) => p.$mt ?? 0}px;
`;

export const TrayStage = styled.section<{ $h: string }>`
  position: relative;
  height: ${(p) => p.$h};
  overflow: hidden;
`;

export const NoFeedback = styled(TrayStage)`
  display: grid;
  place-items: center;
  padding: 0 24px;
  margin-top: -40px;
  h2 {
    position: relative;
    margin: 0;
    text-align: center;
    font-weight: 900;
    font-size: clamp(22px,3.4vw,44px);
    line-height: 1.1;
    ${strokeHead};
    text-wrap: balance;
    max-width: 760px;
  }
`;

export const Oracle = styled.section`
  background: var(--green);
  border-top: 4px solid var(--red-dark);
  border-bottom: 4px solid var(--red-dark);
  padding: clamp(32px,5vw,64px) ${GUTTER};
`;

export const OracleGrid = styled(Container)`
  ${grid3};
  gap: clamp(24px,4vw,56px);
  align-items: center;
`;

export const OracleCard = styled.div`
  background: var(--cream);
  color: var(--ink);
  padding: 16px 18px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  transform: rotate(-1deg);
  box-shadow: 0 6px 0 var(--green-dark);
  small { font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--green); }
  b { font-size: 22px; font-weight: 900; color: var(--red); }
  ${InkButton} { background: var(--ink); }
`;

export const OracleLink = styled.button`
  all: unset;
  cursor: pointer;
  color: var(--gold);
  font-weight: 800;
  font-size: clamp(14px,1.4vw,18px);
  line-height: 1.5;
  border-bottom: 2px solid var(--gold);
  transition: color .2s, border-color .2s;
  &:hover { color: #fff; border-color: #fff; }
`;

export const WhiteBox = styled.div`
  width: 100%;
  background: var(--surface);
  padding: 12px;
`;

export const Badge = styled(Reveal)`
  position: relative;
  width: clamp(110px,14vw,160px);
  aspect-ratio: 1 / 1;
`;

export const HealthyTitle = styled.h2`
  margin: 0;
  text-align: center;
  font-weight: 900;
  line-height: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: clamp(34px,5.4vw,70px);
  span:first-child { color: var(--cream); -webkit-text-stroke: 2px var(--brown); paint-order: stroke fill; text-shadow: 0 4px 0 var(--brown); }
  span:last-child { color: var(--orange); text-shadow: 0 4px 0 var(--brown); }
`;
