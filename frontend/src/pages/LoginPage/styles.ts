import { Segmented } from 'antd';
import styled from 'styled-components';
import { mq } from '@/theme/tokens';
import { redTexture } from '@/components/ui';

export const Frame = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  border: 3px solid var(--edge);
  box-shadow: 10px 10px 0 var(--red);
  ${mq.xs} { box-shadow: 6px 6px 0 var(--red); }
`;

export const Promo = styled.div`
  ${redTexture};
  padding: clamp(28px,4vw,48px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  position: relative;
  overflow: hidden;
  ${mq.xs} { padding: 24px 20px; gap: 20px; }
`;

export const PromoTitle = styled.h1`
  position: relative;
  margin: 0;
  font-weight: 900;
  font-size: clamp(48px,6.4vw,88px);
  line-height: .92;
  display: flex;
  flex-direction: column;
  ${mq.xs} { font-size: 44px; }
`;

export const Perk = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  i { width: 34px; height: 34px; flex: none; border-radius: 50%; background: var(--gold); color: var(--red); display: grid; place-items: center; font-weight: 900; font-size: 14px; font-style: normal; }
  span { color: var(--cream); font-size: 15px; font-weight: 700; line-height: 1.35; }
  ${mq.xs} { i { width: 28px; height: 28px; font-size: 12px; } span { font-size: 13px; } }
`;

export const Form = styled.form`
  background: var(--surface);
  padding: clamp(24px,4vw,44px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  ${mq.xs} { padding: 20px 16px; }
`;

export const Tabs = styled(Segmented)`
  border: 3px solid var(--edge);
  .ant-segmented-item-label { font-weight: 900; font-size: 16px; font-family: var(--font); }
  .ant-segmented-item-selected .ant-segmented-item-label,
  .ant-segmented-item-selected { color: var(--gold) !important; }
` as typeof Segmented;

export const RegisterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 14px;
  .wide { grid-column: 1 / -1; font-size: 13px; font-weight: 700; line-height: 1.4; }
`;

export const ErrorLine = styled.p`
  margin: 0;
  background: var(--error-bg);
  color: var(--red-text);
  font-size: 13px;
  font-weight: 800;
  padding: 10px 12px;
`;
