import { motion } from 'framer-motion';
import { Link } from 'react-router';
import styled from 'styled-components';
import { GUTTER, mq } from '@/theme/tokens';
import { InkButton } from '@/components/ui';

export const Panel = styled(motion.div)`
  position: relative;
  z-index: 4;
  background: var(--bg);
  border-bottom: 3px solid var(--edge);
  padding: 20px ${GUTTER} 24px;
  box-shadow: 0 10px 0 var(--shadow);
`;

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 3px solid var(--edge);
  box-shadow: 6px 6px 0 var(--red);
  padding: 0 8px 0 16px;
  ${mq.xs} { gap: 6px; padding-left: 12px; box-shadow: 4px 4px 0 var(--red); }

  .ant-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    font-size: clamp(16px,1.8vw,20px);
    font-weight: 700;
    padding: 14px 0;
    height: auto;
  }
`;

export const Results = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 20px 32px;
`;

export const ColTitle = styled.span`
  font-weight: 900;
  font-size: 18px;
  color: var(--green-text);
`;

export const ResultRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 2px dashed var(--line);
`;

export const DishLink = styled(Link)`
  display: grid;
  grid-template-columns: 48px minmax(0,1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  img { transition: transform .25s; }
  &:hover .name { color: var(--red-text); text-decoration: underline; }
  &:hover img { transform: scale(1.06); }
  &:focus-visible { outline: 2px solid var(--red-text); outline-offset: 3px; }
`;

export const AddBtn = styled(InkButton)`
  width: 38px;
  height: 38px;
  padding: 0;
  color: var(--gold);
  &:hover:not(:disabled) { background: var(--green); animation: duPop .6s ease-in-out infinite; }
`;

export const OutlineBtn = styled.button`
  all: unset;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 12px;
  border: 2px solid var(--edge);
  transition: background .2s, color .2s;
  &:hover { background: var(--btn); color: var(--gold); border-color: var(--btn); }
`;

