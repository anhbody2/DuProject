import styled, { css } from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  &::before, &::after { content: ''; flex: 1; border-top: 2px solid var(--edge); opacity: .25; }
`;

/** Shared look of both provider buttons: the site's square, hard-shadowed style in the brand face. */
const face = css`
  all: unset;
  box-sizing: border-box;
  position: relative;
  align-self: center;
  width: min(100%, 400px);
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 3px solid var(--edge);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--edge);
  transition: transform .15s, box-shadow .15s, background .2s;
  svg { flex: none; }
  &:hover { background: var(--surface-alt); transform: translateY(-1px); box-shadow: 0 5px 0 var(--edge); }
  &:active { transform: translateY(2px); box-shadow: 0 2px 0 var(--edge); }
`;

export const SocialButton = styled.button`
  ${face};
  &:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: 0 4px 0 var(--edge); background: var(--surface); }
`;

/**
 * Google only issues ID tokens through its own button, which lives in an iframe we can't
 * restyle (it always draws Google Sans). So our button is the visible face and Google's
 * real button sits on top of it, transparent, taking the click.
 */
export const GoogleFace = styled.div<{ $busy: boolean }>`
  ${face};
  &:focus-within { outline: 3px solid var(--gold); outline-offset: 2px; }
  ${({ $busy }) => $busy && css`opacity: .6; cursor: not-allowed; > div:last-child { pointer-events: none; }`}
`;

export const GoogleOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: .01;
`;

export const Hint = styled.p`
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
`;
