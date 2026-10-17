import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Checkbox, Input } from 'antd';
import { Eye, EyeOff } from 'lucide-react';
import { GUTTER } from '@/theme/tokens';
import { toast } from '@/lib/toast';
import { displayName } from '@/lib/format';
import { useAppDispatch, useAuth } from '@/redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { errorMessage, useLoginMutation, useRegisterMutation } from '@/redux/api';
import { matches, validators, type Validator } from '@/lib/validation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import SocialLogin from '@/components/SocialLogin';
import type { AuthResponse } from '@/redux/types';
import { CreamWord, FormField, GoldWord, GreenButton, PasswordRules, Section, TextButton, Tray } from '@/components/ui';
import { Frame, Promo, PromoTitle, Perk, Form, Tabs, RegisterGrid, ErrorLine } from './styles';

const PERKS = ['Giỏ hàng lưu trên mọi thiết bị', 'Đặt món từ nhiều quán trong một đơn', 'Theo dõi đơn và đặt lại chỉ một chạm'];

type Mode = 'login' | 'register';

const TEXT = { login: '', password: '', password2: '', name: '', phone: '', email: '', username: '' };
type TextField = keyof typeof TEXT;

// "Nguyễn Minh Anh" -> lastName "Nguyễn Minh", firstName "Anh".
const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts.pop() ?? '', lastName: parts.join(' ') || undefined };
};

const usernameFrom = (email: string) => email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 50);

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  // Only same-site paths: "//host" or "https://..." would be an open redirect.
  const rawNext = params.get('next') ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState(TEXT);
  const [flags, setFlags] = useState({ owner: false, agree: false, remember: true });
  const set = (k: TextField, v: string) => { setF((s) => ({ ...s, [k]: v })); touch(k); setErr(''); };
  const flag = (k: keyof typeof flags, v: boolean) => { setFlags((s) => ({ ...s, [k]: v })); setErr(''); };

  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = loggingIn || registering;
  const isLogin = mode === 'login';

  const rules: Partial<Record<TextField, Validator>> = isLogin
    ? { login: validators.login, password: validators.currentPassword }
    : {
      name: validators.name, phone: validators.phone, email: validators.email, username: validators.username,
      password: validators.password, password2: matches(f.password),
    };
  // Errors update on every keystroke; each field shows its own once touched.
  const { errorOf, touch, check, reset } = useFieldErrors(f, rules);
  const status = (k: TextField) => (errorOf(k) ? 'error' as const : undefined);
  const input = (k: TextField) => ({
    value: f[k], status: status(k), onBlur: () => touch(k),
    onChange: (e: { target: { value: string } }) => set(k, e.target.value),
  });

  useEffect(() => { if (token) navigate(next, { replace: true }); }, [token, next, navigate]);

  const switchTo = (m: Mode) => { setMode(m); setErr(''); reset(); };

  const submit = async () => {
    if (!check()) return;
    if (!isLogin && !flags.agree) return setErr('Bạn cần đồng ý điều khoản');

    try {
      const res = isLogin
        ? await login({ login: f.login.trim(), password: f.password }).unwrap()
        : await register({
          username: f.username, email: f.email.trim(), password: f.password,
          role: flags.owner ? 'store_owner' : 'customer', phone: f.phone.trim() || undefined, ...splitName(f.name),
        }).unwrap();
      dispatch(setCredentials({ token: res.accessToken, user: res.user, remember: flags.remember }));
      toast(isLogin ? 'Đăng nhập thành công' : `Chào mừng ${displayName(res.user)} vào xóm!`);
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const socialSuccess = (res: AuthResponse) => {
    dispatch(setCredentials({ token: res.accessToken, user: res.user, remember: flags.remember }));
    toast(`Chào mừng ${displayName(res.user)}!`);
  };

  const password = (k: 'password' | 'password2', autoComplete: string) => (
    <Input.Password
      {...input(k)}
      autoComplete={autoComplete}
      placeholder="••••••••"
      visibilityToggle={{ visible: show, onVisibleChange: setShow }}
      iconRender={(visible) => (visible ? <EyeOff size={20} /> : <Eye size={20} />)}
    />
  );

  return (
    <Section $pad={`clamp(24px,4vw,56px) ${GUTTER} 80px`}>
      <Frame>
        <Promo>
          <Tray rotate={-18} speed={0.05} style={{ position: 'absolute', right: -70, bottom: -60, width: 220, opacity: 0.9 }} />
          <PromoTitle>
            <CreamWord>{isLogin ? 'CHÀO' : 'VÀO'}</CreamWord>
            <GoldWord>{isLogin ? 'MỪNG VỀ!' : 'XÓM NÈ!'}</GoldWord>
          </PromoTitle>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map((t, i) => <Perk key={t}><i>{i + 1}</i><span>{t}</span></Perk>)}
          </div>
        </Promo>

        <Form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Tabs<Mode>
            block
            size="large"
            value={mode}
            onChange={switchTo}
            options={[{ label: 'ĐĂNG NHẬP', value: 'login' }, { label: 'ĐĂNG KÝ', value: 'register' }]}
          />

          {isLogin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField title="EMAIL HOẶC TÊN ĐĂNG NHẬP" error={errorOf('login')}><Input {...input('login')} autoComplete="username" placeholder="minhanh@gmail.com" /></FormField>
              <FormField title="MẬT KHẨU" error={errorOf('password')}>{password('password', 'current-password')}</FormField>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
                <Checkbox checked={flags.remember} onChange={(e) => flag('remember', e.target.checked)} style={{ fontWeight: 600 }}>Ghi nhớ tôi</Checkbox>
                <TextButton type="button" onClick={() => navigate(`/forgot-password${f.login.includes('@') ? `?email=${encodeURIComponent(f.login.trim())}` : ''}`)}>Quên mật khẩu?</TextButton>
              </div>
            </div>
          ) : (
            <RegisterGrid>
              <FormField title="HỌ TÊN" error={errorOf('name')}><Input {...input('name')} autoComplete="name" placeholder="Nguyễn Minh Anh" /></FormField>
              <FormField title="SỐ ĐIỆN THOẠI" error={errorOf('phone')}><Input type="tel" {...input('phone')} autoComplete="tel" placeholder="09xx xxx xxx" /></FormField>
              <FormField title="EMAIL" error={errorOf('email')}>
                <Input
                  type="email" {...input('email')} autoComplete="email" placeholder="minhanh@gmail.com"
                  onChange={(e) => {
                    const email = e.target.value;
                    // Suggest a username from the email until the user types their own.
                    setF((s) => ({ ...s, email, username: s.username && s.username !== usernameFrom(s.email) ? s.username : usernameFrom(email) }));
                    touch('email');
                    setErr('');
                  }}
                />
              </FormField>
              <FormField title="TÊN ĐĂNG NHẬP" error={errorOf('username')}><Input {...input('username')} autoComplete="username" placeholder="minhanh" /></FormField>
              <FormField title="MẬT KHẨU" error={errorOf('password')}>{password('password', 'new-password')}</FormField>
              <FormField title="NHẬP LẠI MẬT KHẨU" error={errorOf('password2')}>{password('password2', 'new-password')}</FormField>
              <PasswordRules value={f.password} wide />
              <Checkbox className="wide" checked={flags.owner} onChange={(e) => flag('owner', e.target.checked)}>Tôi là chủ quán (muốn đưa quán lên Chợ Xóm)</Checkbox>
              <Checkbox className="wide" checked={flags.agree} onChange={(e) => flag('agree', e.target.checked)} style={{ fontWeight: 600 }}>
                Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Dủ.
              </Checkbox>
            </RegisterGrid>
          )}

          {err && <ErrorLine role="alert">{err}</ErrorLine>}
          <GreenButton type="submit" $size={22} $block disabled={busy} style={{ boxShadow: '0 6px 0 var(--green-dark)' }}>
            {busy ? 'ĐANG XỬ LÝ…' : isLogin ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </GreenButton>
          <SocialLogin onSuccess={socialSuccess} onError={setErr} disabled={busy} />
          <p style={{ margin: 0, textAlign: 'center', fontSize: 13 }}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <TextButton type="button" onClick={() => switchTo(isLogin ? 'register' : 'login')} style={{ fontWeight: 900 }}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</TextButton>
          </p>
        </Form>
      </Frame>
    </Section>
  );
}
