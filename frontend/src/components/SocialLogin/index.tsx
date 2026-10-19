import { useEffect, useRef, useState } from 'react';
import { errorMessage, useFacebookLoginMutation, useGoogleLoginMutation, useSocialConfigQuery } from '@/redux/api';
import type { AuthResponse } from '@/redux/types';
import { FacebookIcon } from '@/components/ui';
import { Divider, GoogleFace, GoogleOverlay, Hint, SocialButton, Wrap } from './styles';

// Just the parts of the provider SDKs we call.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(o: { client_id: string; callback: (r: { credential?: string }) => void }): void;
          renderButton(el: HTMLElement, o: Record<string, unknown>): void;
        };
      };
    };
    FB?: {
      init(o: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }): void;
      login(cb: (r: { authResponse?: { accessToken: string } | null }) => void, o: { scope: string }): void;
    };
  }
}

const FB_VERSION = 'v21.0';

/** Injects a third-party script once; later calls reuse the same promise. */
const scripts = new Map<string, Promise<void>>();
const loadScript = (src: string) => {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => { scripts.delete(src); reject(new Error(`Failed to load ${src}`)); };
      document.head.appendChild(el);
    }));
  }
  return scripts.get(src)!;
};

let fbAppId: string | undefined;

/**
 * "Continue with Google / Facebook". The provider SDK signs the user in and hands us a
 * token; the API verifies it and answers with our own token, exactly like /auth/login.
 * Renders nothing when the server has neither provider configured.
 */
export default function SocialLogin({ onSuccess, onError, disabled }: {
  onSuccess: (res: AuthResponse) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const { data: config } = useSocialConfigQuery();
  const [googleLogin, { isLoading: g }] = useGoogleLoginMutation();
  const [facebookLogin, { isLoading: f }] = useFacebookLoginMutation();
  const googleBox = useRef<HTMLDivElement>(null);
  const [fbReady, setFbReady] = useState(false);
  const busy = disabled || g || f;

  // Latest callbacks, so the Google SDK (initialised once) never calls a stale closure.
  const handlers = useRef({ onSuccess, onError });
  handlers.current = { onSuccess, onError };

  const exchange = (call: Promise<AuthResponse>) =>
    call.then((res) => handlers.current.onSuccess(res), (x) => handlers.current.onError(errorMessage(x)));

  // Google only issues ID tokens through its own button, so we render it into googleBox.
  useEffect(() => {
    const clientId = config?.google;
    if (!clientId) return;
    let cancelled = false;
    loadScript('https://accounts.google.com/gsi/client').then(() => {
      const box = googleBox.current;
      if (cancelled || !box || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) exchange(googleLogin({ idToken: credential }).unwrap());
        },
      });
      box.replaceChildren();
      // Invisible (see GoogleOverlay), so it only has to cover our button.
      window.google.accounts.id.renderButton(box, {
        type: 'standard', size: 'large', text: 'continue_with', shape: 'rectangular',
        locale: 'vi', width: Math.min(box.clientWidth || 400, 400),
      });
    }).catch(() => handlers.current.onError('Không tải được đăng nhập Google'));
    return () => { cancelled = true; };
  }, [config?.google]);

  // Load the Facebook SDK up front: FB.login must run synchronously in the click,
  // or the browser blocks its popup.
  useEffect(() => {
    const appId = config?.facebook;
    if (!appId) return;
    loadScript('https://connect.facebook.net/vi_VN/sdk.js').then(() => {
      if (!window.FB) return;
      if (fbAppId !== appId) { window.FB.init({ appId, version: FB_VERSION, cookie: false, xfbml: false }); fbAppId = appId; }
      setFbReady(true);
    }).catch(() => handlers.current.onError('Không tải được đăng nhập Facebook'));
  }, [config?.facebook]);

  const loginWithFacebook = () => {
    window.FB?.login((r) => {
      const accessToken = r.authResponse?.accessToken;
      if (accessToken) exchange(facebookLogin({ accessToken }).unwrap());
      // No token: the user closed the popup; nothing to report.
    }, { scope: 'public_profile,email' });
  };

  // An unconfigured provider still shows a disabled button, so the option is visible.
  return (
    <Wrap aria-busy={busy}>
      <Divider><span>HOẶC</span></Divider>
      {config?.google ? (
        <GoogleFace $busy={!!busy}>
          <GoogleIcon />
          TIẾP TỤC VỚI GOOGLE
          <GoogleOverlay ref={googleBox} />
        </GoogleFace>
      ) : (
        <SocialButton type="button" disabled title="Chưa cấu hình GOOGLE_CLIENT_ID trên server">
          <GoogleIcon />
          TIẾP TỤC VỚI GOOGLE
        </SocialButton>
      )}
      <SocialButton
        type="button"
        onClick={loginWithFacebook}
        disabled={!config?.facebook || busy || !fbReady}
        title={config?.facebook ? undefined : 'Chưa cấu hình FACEBOOK_APP_ID / FACEBOOK_APP_SECRET trên server'}
      >
        <FacebookIcon size={20} color="#1877f2" />
        TIẾP TỤC VỚI FACEBOOK
      </SocialButton>
      {config && (!config.google || !config.facebook) && <Hint>Đăng nhập mạng xã hội chưa được bật trên server.</Hint>}
    </Wrap>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);
