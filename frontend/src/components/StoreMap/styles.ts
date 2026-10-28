import styled from 'styled-components';

export const PopupBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 210px;
  max-width: 250px;
`;

export const PopupKicker = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: var(--green-text);
  letter-spacing: .06em;
`;

export const PopupName = styled.span`
  font-size: 18px;
  font-weight: 900;
  color: var(--red-text);
  line-height: 1.15;
`;

export const PopupAddress = styled.span`
  font-size: 12px;
  color: var(--muted);
`;

export const PopupQuote = styled.span`
  font-size: 13px;
  line-height: 1.4;
`;

export const PopupFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  border-top: 2px dashed var(--line);
  padding-top: 8px;
  margin-top: 2px;
`;

/** `&&` outranks leaflet's `.leaflet-container a` colour. */
export const Directions = styled.a`
  && {
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    background: var(--btn);
    padding: 6px 10px;
  }
`;

export const PopupAction = styled.button`
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: var(--btn);
  border: 0;
  padding: 6px 10px;
  cursor: pointer;
`;
