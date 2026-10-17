import { Tag } from 'antd';
import styled from 'styled-components';
import { mq } from '@/theme/tokens';
import { grid3 } from '@/components/ui';

export const AddStore = styled.aside`
  ${grid3};
  gap: 14px 24px;
  align-items: start;
  background: var(--surface);
  border: 3px solid var(--edge);
  box-shadow: 8px 8px 0 var(--red);
  padding: 22px;
  scroll-margin-top: 24px;
  ${mq.xs} { padding: 16px; box-shadow: 5px 5px 0 var(--red); }

  h2 {
    grid-column: 1 / -1;
    margin: 0;
    font-weight: 900;
    font-size: 26px;
    line-height: 1.1;
    color: var(--gold);
    -webkit-text-stroke: 1.5px var(--brown);
    paint-order: stroke fill;
    text-shadow: 0 2px 0 var(--brown);
  }
  .full { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.5; }
  .full a { font-weight: 900; color: var(--red-text); text-decoration: underline; }
`;

/** Square ink-bordered toggle for store categories. */
export const CatTag = styled(Tag.CheckableTag)`
  &.ant-tag {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    padding: 5px 10px;
    border: 2px solid var(--edge);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font);
  }
  &.ant-tag-checkable-checked { background: var(--btn); color: var(--gold); border-color: var(--btn); }
`;
