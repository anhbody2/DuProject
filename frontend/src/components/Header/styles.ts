import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';
import { redTexture } from '@/components/ui';

/** Sticks to the top once the page scrolls; it stays in the flow, so nothing jumps. */
export const Top = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
`;

/** Solid brand red (no texture image); --texture still dims it in dark mode. */
export const Bar = styled.header`
  background-color: var(--red);
  background-image: var(--texture);
  position: relative;
  z-index: 5;
  padding: 18px ${GUTTER};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  color: #1a0f10;

  ${mq.sm} {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    padding-top: 12px;
    padding-bottom: 12px;
  }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px clamp(14px,2.6vw,36px);
  ${mq.sm} { display: none; }
`;

const navLink = css<{ $active?: boolean }>`
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: .05em;
  color: var(--gold);
  padding: 6px 0;
  border-bottom: 2px solid ${(p) => (p.$active ? 'var(--gold)' : 'transparent')};
  transition: color .2s;
  &:hover { color: #fff; }
`;

export const NavLink = styled(Link)<{ $active?: boolean }>`${navLink}`;

export const Logo = styled(Link)<{ $mobile?: boolean }>`
  display: block;
  line-height: 0;
  &:hover { animation: duWiggle .6s ease-in-out infinite; }
  img { width: 68px; height: 54px; object-fit: contain; }
  ${(p) => p.$mobile ? css`
    display: none;
    ${mq.sm} { display: block; justify-self: center; img { width: 56px; height: 44px; } }
  ` : ''}
`;

export const Icons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  ${mq.sm} { gap: 2px; }
`;

export const OnlyMobile = styled.div`
  display: none;
  ${mq.sm} { display: flex; }
`;

export const HideXs = styled.span`
  display: contents;
  ${mq.xs} { display: none; }
`;

/* ---------- mobile drawer ---------- */

export const DrawerBody = styled.div`
  ${redTexture};
  min-height: 100%;
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--gold);
`;

export const DrawerLink = styled(Link)<{ $active?: boolean }>`
  ${navLink};
  font-size: 26px;
  font-weight: 900;
  padding: 12px 0;
  border-bottom: 2px dashed ${(p) => (p.$active ? 'var(--gold)' : 'rgba(246,244,222,.25)')};
  text-shadow: 0 3px 0 var(--brown);
`;

export const DrawerAction = styled.button`
  all: unset;
  cursor: pointer;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  font-size: 15px;
  color: var(--cream);
  &:hover { color: var(--gold); }
`;
