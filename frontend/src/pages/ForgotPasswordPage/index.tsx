import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Input } from 'antd';
import { Eye, EyeOff } from 'lucide-react';
import { GUTTER } from '@/theme/tokens';
import { toast } from '@/lib/toast';
import { matches, validators, type Validator } from '@/lib/validation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useAppDispatch } from '@/redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { errorMessage, useForgotPasswordMutation, useResetPasswordMutation, useVerifyResetCodeMutation } from '@/redux/api';
import { CreamWord, FormField, GoldWord, GreenButton, PasswordRules, Section, TextButton, Tray } from '@/components/ui';
import { ErrorLine, Form, Frame, Perk, Promo, PromoTitle } from '../LoginPage/styles';
import { Hint, Steps } from './styles';

type Step = 'email' | 'code' | 'password';

const STEPS: { key: Step; label: string }[] = [
  { key: 'email', label: 'Nhập email đã đăng ký' },
  { key: 'code', label: 'Nhập mã 6 số gửi tới email' },
  { key: 'password', label: 'Đặt mật khẩu mới' },
];

/** Matches the API's resend cooldown. */
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>('email');
  const [f, setF] = useState({ email: params.get('email') ?? '', code: '', password: '', password2: '' });
  type TextField = keyof typeof f;
  const email = f.email.trim();
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [requestCode, { isLoading: sending }] = useForgotPasswordMutation();
  const [verifyCode, { isLoading: verifying }] = useVerifyResetCodeMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();
  const busy = sending || verifying || resetting;

  // Only the current step's fields are validated; errors update on every keystroke.
  const rules: Partial<Record<TextField, Validator>> =
    step === 'email' ? { email: validators.email }
      : step === 'code' ? { code: validators.resetCode }
        : { password: validators.password, password2: matches(f.password) };
  const { errorOf, touch, check, reset: resetErrors } = useFieldErrors(f, rules);
  const set = (k: TextField, v: string) => { setF((s) => ({ ...s, [k]: v })); touch(k); setErr(''); };
  const goTo = (next: Step) => { setStep(next); resetErrors(); };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    if (validators.email(f.email)) return;
    try {
      await requestCode({ email }).unwrap();
      setCooldown(RESEND_SECONDS);
      setF((s) => ({ ...s, code: '' }));
      goTo('code');
      toast('Nếu email đã đăng ký, mã sẽ tới trong giây lát');
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  // Takes the value explicitly: the OTP input verifies straight from onChange, before state updates.
  const verify = async (value = f.code) => {
    if (validators.resetCode(value)) return;
    try {
      await verifyCode({ email, code: value }).unwrap();
      goTo('password');
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const reset = async () => {
    try {
      const res = await resetPassword({ email, code: f.code, newPassword: f.password }).unwrap();
      dispatch(setCredentials({ token: res.accessToken, user: res.user, remember: true }));
      toast('Đã đổi mật khẩu, chào mừng bạn trở lại!');
      navigate('/', { replace: true });
    } catch (x) {
      setErr(errorMessage(x));
      // The code may have expired or run out of attempts meanwhile: start over from the code step.
      goTo('code');
    }
  };

  const submit = () => {
    setErr('');
    if (!check()) return;
    if (step === 'email') send();
    else if (step === 'code') verify();
    else reset();
  };

  const password = (k: 'password' | 'password2') => (
    <Input.Password
      value={f[k]}
      status={errorOf(k) ? 'error' : undefined}
      onChange={(e) => set(k, e.target.value)}
      onBlur={() => touch(k)}
      autoComplete="new-password"
      placeholder="••••••••"
      visibilityToggle={{ visible: show, onVisibleChange: setShow }}
      iconRender={(visible) => (visible ? <EyeOff size={20} /> : <Eye size={20} />)}
    />
  );

  const current = STEPS.findIndex((s) => s.key === step);

  return (
    <Section $pad={`clamp(24px,4vw,56px) ${GUTTER} 80px`}>
      <Frame>
        <Promo>
          <Tray rotate={-18} speed={0.05} style={{ position: 'absolute', right: -70, bottom: -60, width: 220, opacity: 0.9 }} />
          <PromoTitle>
            <CreamWord>QUÊN</CreamWord>
            <GoldWord>MẬT KHẨU?</GoldWord>
          </PromoTitle>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {STEPS.map((s, i) => <Perk key={s.key} style={{ opacity: i <= current ? 1 : 0.55 }}><i>{i + 1}</i><span>{s.label}</span></Perk>)}
          </div>
        </Promo>

        <Form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Steps aria-hidden>{STEPS.map((s, i) => <span key={s.key} data-on={i <= current} />)}</Steps>

          {step === 'email' && (
            <>
              <Hint>Nhập email bạn dùng để đăng ký. Dủ sẽ gửi một mã 6 số để đặt lại mật khẩu.</Hint>
              <FormField title="EMAIL" error={errorOf('email')}>
                <Input
                  type="email" value={f.email} status={errorOf('email') ? 'error' : undefined} autoComplete="email" placeholder="minhanh@gmail.com" autoFocus
                  onChange={(e) => set('email', e.target.value)} onBlur={() => touch('email')}
                />
              </FormField>
            </>
          )}

          {step === 'code' && (
            <>
              <Hint>Mã đã được gửi tới <b>{email}</b>. Mã có hiệu lực trong 10 phút.</Hint>
              <FormField title="MÃ XÁC NHẬN" error={errorOf('code')}>
                <Input.OTP
                  length={6}
                  value={f.code}
                  status={errorOf('code') ? 'error' : undefined}
                  autoFocus
                  formatter={(v) => v.replace(/\D/g, '')}
                  onChange={(v) => { set('code', v); if (v.length === 6) verify(v); }}
                />
              </FormField>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
                <TextButton type="button" onClick={() => { goTo('email'); setErr(''); }}>Đổi email</TextButton>
                <TextButton type="button" disabled={cooldown > 0 || busy} onClick={() => { setErr(''); send(); }}>
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
                </TextButton>
              </div>
            </>
          )}

          {step === 'password' && (
            <>
              <Hint>Mã hợp lệ! Giờ đặt mật khẩu mới cho tài khoản <b>{email}</b>.</Hint>
              <FormField title="MẬT KHẨU MỚI" error={errorOf('password')}>{password('password')}</FormField>
              <PasswordRules value={f.password} />
              <FormField title="NHẬP LẠI MẬT KHẨU" error={errorOf('password2')}>{password('password2')}</FormField>
            </>
          )}

          {err && <ErrorLine role="alert">{err}</ErrorLine>}
          <GreenButton type="submit" $size={22} $block disabled={busy} style={{ boxShadow: '0 6px 0 var(--green-dark)' }}>
            {busy ? 'ĐANG XỬ LÝ…' : step === 'email' ? 'GỬI MÃ' : step === 'code' ? 'XÁC NHẬN MÃ' : 'ĐỔI MẬT KHẨU'}
          </GreenButton>
          <p style={{ margin: 0, textAlign: 'center', fontSize: 13 }}>
            Nhớ ra rồi?{' '}
            <TextButton type="button" onClick={() => navigate('/login')} style={{ fontWeight: 900 }}>Đăng nhập</TextButton>
          </p>
        </Form>
      </Frame>
    </Section>
  );
}
