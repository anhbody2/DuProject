import styled from 'styled-components';
import { mq } from '@/theme/tokens';

export const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: clamp(20px, 4vw, 48px);
  align-items: center;
  ${mq.sm} { grid-template-columns: 1fr; }
`;

export const Cover = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  border: 3px solid var(--cream);
  box-shadow: 10px 10px 0 rgba(75, 28, 20, .45);
`;

export const StoreName = styled.h1`
  margin: 0;
  color: var(--cream);
  font-family: var(--font);
  font-weight: 900;
  font-size: clamp(30px, 5vw, 60px);
  line-height: 1;
  text-wrap: balance;
`;

export const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  color: var(--cream);
  font-size: 14px;
  font-weight: 700;
  span { display: inline-flex; align-items: center; gap: 6px; }
  a { color: var(--gold); }
`;

export const Tag = styled.span`
  padding: 3px 9px;
  background: var(--gold);
  color: var(--ink);
  font-size: 12px;
  font-weight: 900;
`;

export const HeroButton = styled.button<{ $on?: boolean }>`
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid var(--cream);
  background: ${(p) => (p.$on ? 'var(--gold)' : 'transparent')};
  color: ${(p) => (p.$on ? 'var(--ink)' : 'var(--cream)')};
  font-weight: 900;
  font-size: 12px;
  transition: transform .15s;
  &:hover:not(:disabled) { transform: rotate(-2deg); }
  &:disabled { opacity: .5; cursor: wait; }
`;

/** "Your cart is from another store" notice under the hero. */
export const CartNote = styled.p`
  margin: 0 0 20px;
  padding: 10px 14px;
  border: 2px dashed var(--edge);
  background: var(--surface-alt);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  b { color: var(--red-text); }
`;

export const CatHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  scroll-margin-top: 140px;
  h2 { margin: 0; color: var(--green-text); font-weight: 900; font-size: 22px; }
`;

/** Sticky "view cart" bar; leaves room on the right for the chat launcher. */
export const CartBar = styled.button`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  position: fixed;
  left: 16px;
  right: 92px;
  bottom: 20px;
  z-index: 800;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: var(--green);
  color: var(--cream);
  border: 3px solid var(--edge);
  box-shadow: 0 6px 0 var(--green-dark);
  font-weight: 900;
  font-size: 15px;
  transition: transform .15s;
  &:hover { transform: translateY(-2px); }
  b { color: var(--gold); }
  ${mq.xs} { bottom: 14px; right: 84px; font-size: 13px; padding: 12px 14px; }
`;
