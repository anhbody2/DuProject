'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { FacebookIcon, InstagramIcon } from './ui';

const col = 'display:flex;flex-direction:column;gap:8px';
const head = 'font-weight:900;font-size:13px';
const social = 'width:32px;height:32px;border-radius:50%;background:var(--ink);color:var(--cream);display:grid;place-items:center;cursor:pointer';
const link = { color: 'inherit' };

export default function Footer() {
  const [email, setEmail] = useState('');
  // There is no newsletter endpoint yet, so this only validates and acknowledges.
  const subscribe = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Nhập email hợp lệ nhé');
    setEmail('');
    toast('Cảm ơn! Dủ sẽ gửi tin mới cho bạn');
  };

  return (
    <footer style={sx('padding:40px clamp(16px,4vw,56px) 0;position:relative;overflow:hidden;background-color:var(--cream)')}>
      <div style={sx('max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;align-items:flex-start')}>
        <div style={sx('padding:24px 28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:24px;flex:1 1 380px;max-width:580px;font-size:12px')}>
          <div style={sx(col)}><span style={sx(head)}>Cửa hàng</span><Link href="/menu" style={link}>Thực đơn</Link><Link href="/market" style={link}>Chợ xóm</Link><Link href="/account" style={link}>Đơn hàng</Link></div>
          <div style={sx(col)}><span style={sx(head)}>Thông tin</span><Link href="/" style={link}>Về Dủ</Link><Link href="/" style={link}>Khu vực giao</Link><Link href="/" style={link}>Liên hệ</Link><Link href="/account" style={link}>Tài khoản</Link></div>
          <div style={sx(col)}><span style={sx(head)}>Điều khoản</span><Link href="/" style={link}>Chính sách đổi trả</Link><Link href="/" style={link}>Bảo mật</Link></div>
        </div>
        <div style={sx('padding:24px 28px;flex:1 1 280px;max-width:420px;display:flex;flex-direction:column;gap:18px')}>
          <h3 style={sx('margin:0;font-weight:900;font-size:22px;line-height:1.15')}>Đăng ký nhận tin — món mới mỗi tuần.</h3>
          <form onSubmit={(e) => { e.preventDefault(); subscribe(); }} style={sx('display:flex;border-bottom:2px solid var(--ink);padding-bottom:6px;gap:8px')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email của bạn" style={sx('flex:1;min-width:0;border:0;background:transparent;font-size:14px;outline:none')} />
            <button type="submit" title="Đăng ký" className="hv-nudge" style={sx('all:unset;cursor:pointer;display:grid;place-items:center')}><ArrowRight size={22} strokeWidth={2.6} /></button>
          </form>
        </div>
      </div>
      <div style={sx('max-width:1200px;margin:30px auto 0;position:relative;display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap')}>
        <div style={sx('position:relative;width:clamp(150px,24vw,280px);aspect-ratio:102/81;transform:translate(0,12%) rotate(8deg)')}>
          <Image src="/assets/logo.png" alt="Dủ" fill sizes="280px" style={{ objectFit: 'contain' }} />
        </div>
        <div style={sx('flex:1;min-width:220px;border-top:2px solid var(--red);padding:14px 0 18px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;font-size:12px')}>
          <div style={sx('display:flex;gap:18px')}><span>Chính sách bảo mật</span><span>Điều khoản dịch vụ</span><span>© {new Date().getFullYear()} Dủ</span></div>
          <div style={sx('display:flex;gap:8px')}>
            <span title="Facebook" className="hv-pop-bgred" style={sx(social)}><FacebookIcon /></span>
            <span title="Instagram" className="hv-pop-bgred" style={sx(social)}><InstagramIcon /></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
