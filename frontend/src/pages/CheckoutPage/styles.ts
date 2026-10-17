import { Input, Radio } from 'antd';
import styled from 'styled-components';

export const Choices = styled(Radio.Group)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  .ant-radio-wrapper { font-size: 14px; line-height: 1.4; align-items: flex-start; margin: 0; }
  .ant-radio { align-self: flex-start; margin-top: 1px; }
`;

export const NewAddress = styled.div`
  border-top: 2px dashed var(--line);
  padding-top: 12px;
`;

/** Full width at every breakpoint; 16px text keeps iOS Safari from zooming in on focus. */
export const NoteBox = styled(Input.TextArea)`
  width: 100%;
  &, textarea { font-size: 16px; line-height: 1.5; }
`;
