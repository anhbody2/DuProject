import styled, { css } from 'styled-components';
import { NavLink } from 'react-router';
import { mq } from '@/theme/tokens';

/* ================================================================ shell */

export const Shell = styled.div`
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--bg);
  ${mq.md} { grid-template-columns: minmax(0, 1fr); }
`;

export const Side = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 14px;
  background: var(--red);
  background-image: var(--texture);
  border-right: 4px solid var(--brown);

  ${mq.md} {
    position: sticky;
    z-index: 20;
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 10px 12px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 4px solid var(--brown);
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 18px;
  color: var(--gold);
  font-weight: 900;
  font-size: 18px;
  letter-spacing: .04em;
  img { width: 52px; height: 42px; object-fit: contain; }
  ${mq.md} {
    padding: 0 8px 0 0;
    span { display: none; }
    img { width: 40px; height: 32px; }
  }
`;

const sideItem = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  color: var(--cream);
  font-weight: 800;
  font-size: 14px;
  letter-spacing: .03em;
  text-decoration: none;
  white-space: nowrap;
  border: 2px solid transparent;
  transition: background .2s, color .2s;

  &:hover { color: var(--gold); background: rgba(0, 0, 0, .15); }
  &.active {
    color: var(--ink);
    background: var(--gold);
    border-color: var(--brown);
    box-shadow: 3px 3px 0 var(--brown);
  }
  ${mq.md} { padding: 8px 12px; font-size: 13px; }
`;

export const SideLink = styled(NavLink)`${sideItem}`;

export const SideButton = styled.button`
  ${sideItem}
  background: none;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  font-size: 14px;
  text-align: left;
`;

export const SideFoot = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  ${mq.md} { margin: 0 0 0 auto; flex-direction: row; }
`;

export const Main = styled.main`
  min-width: 0;
  padding: 28px clamp(16px, 3vw, 40px) 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const PageHead = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;

  h1 {
    margin: 0;
    font-weight: 900;
    font-size: clamp(26px, 3.4vw, 40px);
    line-height: 1.1;
    color: var(--red-text);
  }
  p { margin: 4px 0 0; color: var(--muted); font-family: var(--font-body); font-size: 14px; }
`;

/* ================================================================ content blocks */

export const Panel = styled.section<{ $pad?: number }>`
  min-width: 0;
  background: var(--surface);
  border: 2px solid var(--edge);
  box-shadow: 4px 4px 0 var(--edge);
  padding: ${(p) => p.$pad ?? 20}px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: .03em;
  }
`;

export const PanelHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  small { color: var(--muted); font-family: var(--font-body); font-size: 12px; }
`;

export const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
`;

export const Tile = styled(Panel)<{ $hero?: boolean }>`
  gap: 6px;
  background: ${(p) => (p.$hero ? 'var(--green)' : 'var(--surface)')};
  color: ${(p) => (p.$hero ? 'var(--cream)' : 'var(--text)')};

  .label { font-size: 13px; font-weight: 700; font-family: var(--font-body); opacity: .85; }
  .value {
    font-family: var(--font-body);
    font-weight: 800;
    font-size: ${(p) => (p.$hero ? 'clamp(30px, 3.6vw, 44px)' : '28px')};
    line-height: 1.1;
    color: ${(p) => (p.$hero ? 'var(--gold)' : 'var(--text)')};
    overflow-wrap: anywhere;
  }
  .hint { font-size: 12px; font-family: var(--font-body); color: ${(p) => (p.$hero ? 'var(--cream)' : 'var(--muted)')}; }
`;

export const Grid = styled.div<{ $cols?: string }>`
  display: grid;
  grid-template-columns: ${(p) => p.$cols ?? 'repeat(2, minmax(0, 1fr))'};
  gap: 20px;
  ${mq.md} { grid-template-columns: minmax(0, 1fr); }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  > .grow { flex: 1 1 240px; }
`;

export const Muted = styled.span`
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 12px;
`;

export const Cell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  b { font-weight: 800; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

export const Thumb = styled.div`
  position: relative;
  flex: none;
  width: 44px;
  height: 44px;
  overflow: hidden;
  background: var(--surface-alt);
  border: 2px solid var(--line);
`;

/* ================================================================ charts */

export const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(90px, 30%) minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  font-family: var(--font-body);
  font-size: 13px;
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .value { font-weight: 700; font-variant-numeric: tabular-nums; }
`;

export const BarTrack = styled.div`
  height: 14px;
  background: var(--surface-alt);
  border-radius: 0 4px 4px 0;
  overflow: hidden;
`;

export const BarFill = styled.div`
  height: 100%;
  background: var(--viz-main);
  border-radius: 0 4px 4px 0;
  transition: width .6s cubic-bezier(.2, .8, .2, 1);
`;

/** 100% stacked bar; segments are separated by a 2px surface gap. */
export const Stack100 = styled.div`
  display: flex;
  gap: 2px;
  height: 22px;
  background: var(--surface);
  > div { height: 100%; min-width: 3px; transition: flex-grow .6s; }
  > div:first-child { border-radius: 4px 0 0 4px; }
  > div:last-child { border-radius: 0 4px 4px 0; }
`;

export const Legend = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-family: var(--font-body);
  font-size: 13px;
  li { display: flex; align-items: center; gap: 8px; }
  i { width: 10px; height: 10px; border-radius: 2px; flex: none; }
  b { font-weight: 700; }
`;

export const ChartTip = styled.div`
  background: var(--surface);
  border: 2px solid var(--edge);
  padding: 8px 12px;
  font-family: var(--font-body);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  b { font-size: 14px; }
`;
