import { useState } from 'react';
import { Link } from 'react-router';
import { Input } from 'antd';
import { ArrowRight } from 'lucide-react';
import { toast } from '@/lib/toast';
import { FacebookIcon, IconButton, InstagramIcon } from '@/components/ui';
import { Wrap, Top, Links, Col, Newsletter, Bottom, LogoTilt, Legal, Social } from './styles';

export default function Footer() {
  const [email, setEmail] = useState('');
  // There is no newsletter endpoint yet, so this only validates and acknowledges.
  const subscribe = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Nhập email hợp lệ nhé');
    setEmail('');
    toast('Cảm ơn! Dủ sẽ gửi tin mới cho bạn');
  };

  return (
    <Wrap>
      <Top>
        <Links>
          <Col><b>Cửa hàng</b><Link to="/menu">Thực đơn</Link><Link to="/market">Chợ xóm</Link><Link to="/account">Đơn hàng</Link></Col>
          <Col><b>Thông tin</b><Link to="/">Về Dủ</Link><Link to="/">Khu vực giao</Link><Link to="/">Liên hệ</Link><Link to="/account">Tài khoản</Link></Col>
          <Col><b>Điều khoản</b><Link to="/">Chính sách đổi trả</Link><Link to="/">Bảo mật</Link></Col>
        </Links>
        <Newsletter>
          <h3>Đăng ký nhận tin — món mới mỗi tuần.</h3>
          <form onSubmit={(e) => { e.preventDefault(); subscribe(); }}>
            <Input type="email" variant="borderless" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email của bạn" aria-label="Email" />
            <IconButton type="submit" aria-label="Đăng ký" $anim="nudge"><ArrowRight size={22} strokeWidth={2.6} /></IconButton>
          </form>
        </Newsletter>
      </Top>
      <Bottom>
        <LogoTilt><img src="/assets/logo.png" alt="Dủ" loading="lazy" /></LogoTilt>
        <Legal>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}><span>Chính sách bảo mật</span><span>Điều khoản dịch vụ</span><span>© {new Date().getFullYear()} Dủ</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Social title="Facebook"><FacebookIcon /></Social>
            <Social title="Instagram"><InstagramIcon /></Social>
          </div>
        </Legal>
      </Bottom>
    </Wrap>
  );
}
