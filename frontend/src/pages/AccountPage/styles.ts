import styled from 'styled-components';
import { Segmented } from 'antd';
import { mq } from '@/theme/tokens';
import { IconButton, Reveal } from '@/components/ui';

export const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
`;

export const Step = styled.div<{ $state: 'done' | 'now' | 'todo' }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  &::before {
    content: '';
    height: 6px;
    border-radius: 3px;
    background: ${(p) => (p.$state === 'todo' ? 'var(--line)' : 'var(--green)')};
    transition: background .4s;
  }
  span {
    font-size: 11px;
    font-weight: 700;
    color: ${(p) => (p.$state === 'now' ? 'var(--green-text)' : p.$state === 'done' ? 'var(--text)' : 'var(--faint)')};
  }
`;

export const StatusStrip = styled.div`
  background: var(--surface-alt);
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const Avatar = styled(Reveal)`
  position: relative;
  width: clamp(140px,22vw,260px);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: var(--green);
  overflow: hidden;
  flex: none;
  ${mq.xs} { width: 120px; }
`;

/** Fallback when the user has no uploaded photo: their initial on the green disc. */
export const AvatarInitial = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--gold);
  font-family: var(--font);
  font-weight: 900;
  font-size: clamp(64px,10vw,120px);
  line-height: 1;
  user-select: none;
`;

export const Name = styled.h1`
  margin: 0;
  color: var(--gold);
  font-weight: 900;
  font-size: clamp(40px,6vw,80px);
  line-height: 1.05;
  overflow-wrap: anywhere;
  ${mq.xs} { font-size: 34px; }
`;

export const Pill = styled.span<{ $variant: 'gold' | 'outline' | 'cream' }>`
  font-size: 12px;
  font-weight: 800;
  padding: ${(p) => (p.$variant === 'gold' ? '6px 12px' : '4px 12px')};
  border-radius: 20px;
  background: ${(p) => (p.$variant === 'gold' ? 'var(--gold)' : 'transparent')};
  color: ${(p) => (p.$variant === 'gold' ? 'var(--ink)' : p.$variant === 'cream' ? 'var(--cream)' : 'var(--gold)')};
  border: ${(p) => (p.$variant === 'gold' ? '0' : `2px solid ${p.$variant === 'cream' ? 'var(--cream)' : 'var(--gold)'}`)};
`;

export const HistoryRow = styled.div`
  background: var(--surface);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 14px;
  align-items: center;
  box-shadow: 0 4px 0 var(--line);
`;

export const Tabs = styled(Segmented)`
  align-self: flex-start;
  border: 3px solid var(--edge);
  .ant-segmented-item-label { font-weight: 900; font-size: 16px; font-family: var(--font); }
  .ant-segmented-item-selected .ant-segmented-item-label,
  .ant-segmented-item-selected { color: var(--gold) !important; }
  ${mq.xs} { align-self: stretch; }
` as typeof Segmented;

export const AvatarWrap = styled.div`
  position: relative;
  flex: none;
`;

/** Round camera / trash buttons pinned to the avatar's bottom edge. */
export const AvatarAction = styled(IconButton)<{ $side: 'right' | 'left' }>`
  position: absolute;
  bottom: 6%;
  ${(p) => p.$side}: 6%;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--gold);
  border: 3px solid var(--gold);
  box-shadow: 0 3px 0 rgba(0, 0, 0, .25);
  &:disabled { opacity: .6; cursor: wait; }
  ${mq.xs} { width: 36px; height: 36px; }
`;
