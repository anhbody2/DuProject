'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { displayName } from '@/lib/format';
import { useAppDispatch, useAuth } from '@/store';
import { setCredentials } from '@/store/authSlice';
import { errorMessage, useLoginMutation, useRegisterMutation } from '@/store/api';
import { Tray } from '@/components/ui';

const input = 'font-size:15px;padding:12px 14px;border:2px solid var(--ink);background:var(--cream);border-radius:0;outline:none;width:100%';
const label = 'display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800';
const PERKS = ['Giỏ hàng lưu trên mọi thiết bị', 'Đặt món từ nhiều quán trong một đơn', 'Theo dõi đơn và đặt lại chỉ một chạm'];

type Mode = 'login' | 'register';

function Field({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return <label style={{ ...sx(label), gridColumn: wide ? '1/-1' : undefined }}>{title}{children}</label>;
}

function Password({ value, onChange, show, onToggle, autoComplete }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder="••••••••" style={{ ...sx(input), paddingRight: 48 }} />
      <button onClick={onToggle} type="button" title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="hv-pop-red" style={sx('all:unset;cursor:pointer;position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center')}>
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

// "Nguyễn Minh Anh" -> lastName "Nguyễn Minh", firstName "Anh".
const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts.pop() ?? '', lastName: parts.join(' ') || undefined };
};

function Auth() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, hydrated } = useAuth();
  // Only same-site paths: "//host" or "https://..." would be an open redirect.
  const rawNext = params.get('next') ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ login: '', password: '', password2: '', name: '', phone: '', email: '', username: '', owner: false, agree: false, remember: true });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((s) => ({ ...s, [k]: v })); setErr(''); };

  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = loggingIn || registering;
  const isLogin = mode === 'login';

  useEffect(() => { if (hydrated && token) router.replace(next); }, [hydrated, token, next, router]);

  const switchTo = (m: Mode) => { setMode(m); setErr(''); };

  const submit = async () => {
    const e = isLogin
      ? (!f.login.trim() ? 'Nhập email hoặc tên đăng nhập nhé' : !f.password ? 'Nhập mật khẩu nhé' : '')
      : !f.name.trim() ? 'Cho Dủ biết tên bạn nha'
        : !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa đúng'
          : !/^[a-zA-Z0-9_.]{3,50}$/.test(f.username) ? 'Tên đăng nhập 3–50 ký tự: chữ, số, _ hoặc .'
            : f.password.length < 8 ? 'Mật khẩu tối thiểu 8 ký tự'
              : f.password !== f.password2 ? 'Mật khẩu nhập lại chưa khớp'
                : !f.agree ? 'Bạn cần đồng ý điều khoản' : '';
    if (e) return setErr(e);

    try {
      const res = isLogin
        ? await login({ login: f.login.trim(), password: f.password }).unwrap()
        : await register({
          username: f.username, email: f.email.trim(), password: f.password,
          role: f.owner ? 'store_owner' : 'customer', phone: f.phone.trim() || undefined, ...splitName(f.name),
        }).unwrap();
      dispatch(setCredentials({ token: res.accessToken, user: res.user, remember: f.remember }));
      toast(isLogin ? 'Đăng nhập thành công' : `Chào mừng ${displayName(res.user)} vào xóm!`);
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const tabColor = (m: Mode) => (mode === m ? 'var(--gold)' : 'var(--ink)');

  return (
    <section style={sx('padding:clamp(24px,4vw,56px) clamp(16px,4vw,56px) 80px')}>
      <div style={sx('max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));border:3px solid var(--ink);box-shadow:10px 10px 0 var(--red)')}>
        <div className="red-texture" style={sx('padding:clamp(28px,4vw,48px);display:flex;flex-direction:column;justify-content:space-between;gap:28px;position:relative;overflow:hidden')}>
          <Tray rotate={-18} speed={0.05} style={sx('position:absolute;right:-70px;bottom:-60px;width:220px;opacity:.9')} />
          <h1 style={sx('position:relative;margin:0;font-weight:900;font-size:clamp(48px,6.4vw,88px);line-height:.92;display:flex;flex-direction:column')}>
            <span style={sx('color:var(--cream);-webkit-text-stroke:3px var(--red-dark);paint-order:stroke fill;text-shadow:0 .05em 0 var(--brown)')}>{isLogin ? 'CHÀO' : 'VÀO'}</span>
            <span style={sx('color:var(--gold);text-shadow:0 .05em 0 #c2410c')}>{isLogin ? 'MỪNG VỀ!' : 'XÓM NÈ!'}</span>
          </h1>
          <div style={sx('position:relative;display:flex;flex-direction:column;gap:14px')}>
            {PERKS.map((t, i) => (
              <div key={t} style={sx('display:flex;gap:12px;align-items:center')}>
                <span style={sx('width:34px;height:34px;flex:none;border-radius:50%;background:var(--gold);color:var(--red);display:grid;place-items:center;font-weight:900;font-size:14px')}>{i + 1}</span>
                <span style={sx('color:var(--cream);font-size:15px;font-weight:700;line-height:1.35')}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={sx('background:#fff;padding:clamp(24px,4vw,44px);display:flex;flex-direction:column;gap:18px')}>
          <div style={sx('position:relative;display:grid;grid-template-columns:1fr 1fr;border:3px solid var(--ink);background:var(--cream);padding:4px')}>
            <div style={{ ...sx('position:absolute;top:4px;bottom:4px;width:calc(50% - 4px);background:var(--green);transition:left .3s cubic-bezier(.2,.8,.2,1)'), left: isLogin ? '4px' : '50%' }} />
            <button type="button" onClick={() => switchTo('login')} style={{ ...sx('all:unset;cursor:pointer;position:relative;text-align:center;padding:12px 8px;font-weight:900;font-size:16px;transition:color .2s'), color: tabColor('login') }}>ĐĂNG NHẬP</button>
            <button type="button" onClick={() => switchTo('register')} style={{ ...sx('all:unset;cursor:pointer;position:relative;text-align:center;padding:12px 8px;font-weight:900;font-size:16px;transition:color .2s'), color: tabColor('register') }}>ĐĂNG KÝ</button>
          </div>

          {isLogin ? (
            <div style={sx('display:flex;flex-direction:column;gap:14px')}>
              <Field title="EMAIL HOẶC TÊN ĐĂNG NHẬP"><input value={f.login} onChange={(e) => set('login', e.target.value)} autoComplete="username" placeholder="minhanh@gmail.com" style={sx(input)} /></Field>
              <Field title="MẬT KHẨU"><Password value={f.password} onChange={(v) => set('password', v)} show={show} onToggle={() => setShow((s) => !s)} autoComplete="current-password" /></Field>
              <div style={sx('display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px')}>
                <label style={sx('display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600')}><input type="checkbox" checked={f.remember} onChange={(e) => set('remember', e.target.checked)} style={sx('width:18px;height:18px;accent-color:var(--green)')} />Ghi nhớ tôi</label>
                <button type="button" onClick={() => toast('Liên hệ quản trị viên để đặt lại mật khẩu')} style={sx('all:unset;cursor:pointer;font-weight:800;color:var(--red);text-decoration:underline')}>Quên mật khẩu?</button>
              </div>
            </div>
          ) : (
            <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:14px')}>
              <Field title="HỌ TÊN"><input value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Nguyễn Minh Anh" style={sx(input)} /></Field>
              <Field title="SỐ ĐIỆN THOẠI"><input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="09xx xxx xxx" style={sx(input)} /></Field>
              <Field title="EMAIL">
                <input type="email" value={f.email} autoComplete="email" placeholder="minhanh@gmail.com" style={sx(input)}
                  onChange={(e) => {
                    const email = e.target.value;
                    // Suggest a username from the email until the user types their own.
                    const suggested = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 50);
                    setF((s) => ({ ...s, email, username: s.username && s.username !== s.email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 50) ? s.username : suggested }));
                    setErr('');
                  }} />
              </Field>
              <Field title="TÊN ĐĂNG NHẬP"><input value={f.username} onChange={(e) => set('username', e.target.value)} autoComplete="username" placeholder="minhanh" style={sx(input)} /></Field>
              <Field title="MẬT KHẨU"><Password value={f.password} onChange={(v) => set('password', v)} show={show} onToggle={() => setShow((s) => !s)} autoComplete="new-password" /></Field>
              <Field title="NHẬP LẠI MẬT KHẨU"><Password value={f.password2} onChange={(v) => set('password2', v)} show={show} onToggle={() => setShow((s) => !s)} autoComplete="new-password" /></Field>
              <label style={sx('grid-column:1/-1;display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:700')}>
                <input type="checkbox" checked={f.owner} onChange={(e) => set('owner', e.target.checked)} style={sx('width:18px;height:18px;flex:none;accent-color:var(--green)')} />
                Tôi là chủ quán (muốn đưa quán lên Chợ Xóm)
              </label>
              <label style={sx('grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:13px;font-weight:600;line-height:1.4')}>
                <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} style={sx('width:18px;height:18px;flex:none;accent-color:var(--green);margin-top:1px')} />
                Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Dủ.
              </label>
            </div>
          )}

          {err && <p role="alert" style={sx('margin:0;background:#fde8e6;color:var(--red);font-size:13px;font-weight:800;padding:10px 12px')}>{err}</p>}
          <button type="submit" disabled={busy} className="hv-green2" style={sx('all:unset;cursor:pointer;text-align:center;background:var(--green);color:var(--gold);font-weight:900;font-size:22px;padding:14px;outline:2px dashed var(--cream);outline-offset:-7px;box-shadow:0 6px 0 var(--green-dark)')}>
            {busy ? 'ĐANG XỬ LÝ…' : isLogin ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </button>
          <p style={sx('margin:0;text-align:center;font-size:13px')}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => switchTo(isLogin ? 'register' : 'login')} style={sx('all:unset;cursor:pointer;font-weight:900;color:var(--red);text-decoration:underline')}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</button>
          </p>
        </form>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><Auth /></Suspense>;
}
