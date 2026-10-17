import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GUTTER } from '@/theme/tokens';
import { dishHref, fmt, priceOf } from '@/lib/format';
import { useProductsQuery } from '@/redux/api';
import DishCard from '@/components/DishCard';
import { Container, CreamWord, Cta, Empty, FillImg, GoldWord, Grid3, InkButton, Parallax, RedBand, Reveal, Spinner, TextButton, Tray } from '@/components/ui';
import { HeroStage, HeroTitle, Tagline, Centered, TrayStage, NoFeedback, Oracle, OracleGrid, OracleCard, OracleLink, WhiteBox, Badge, HealthyTitle } from './styles';

export default function LandingPage() {
  const navigate = useNavigate();
  const goMenu = () => navigate('/menu');
  const { data, isLoading } = useProductsQuery({ sort: 'newest' });
  const products = data?.items ?? [];
  const today = products.slice(0, 3);
  const [oracleId, setOracleId] = useState<number | null>(null);
  const oracle = products.find((p) => p.id === oracleId);

  const askOracle = () => {
    if (!products.length) return;
    const pool = products.length > 1 ? products.filter((p) => p.id !== oracleId) : products;
    setOracleId(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <div>
      {/* ---------- hero ---------- */}
      <RedBand clip="polygon(0 0,100% 0,100% calc(100% - 70px),0 100%)" pad={`0 ${GUTTER} clamp(90px,10vw,140px)`}>
        <HeroStage>
          <Parallax speed={0.16} style={{ position: 'absolute', left: 0, top: '4%', width: '40%', aspectRatio: '504/456' }}>
            <FillImg src="/assets/chopstick-basket.png" alt="Rổ đũa" style={{ transform: 'rotate(-6deg)', filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.35))' }} />
          </Parallax>
          <Parallax speed={0.32} style={{ position: 'absolute', left: '37%', top: '2%', width: '17%', aspectRatio: '214/143' }}>
            <FillImg src="/assets/shakers.png" alt="Lọ tiêu" style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.35))' }} />
          </Parallax>
          <Parallax speed={-0.1} style={{ position: 'absolute', right: 0, top: 0, width: '46%', aspectRatio: '668/533' }}>
            <FillImg src="/assets/pho-bowl.png" alt="Tô phở" style={{ filter: 'drop-shadow(0 18px 22px rgba(0,0,0,.4))' }} />
          </Parallax>
          <HeroTitle><CreamWord>CƠM</CreamWord><GoldWord>PHẦN</GoldWord></HeroTitle>
        </HeroStage>
        <Centered $mt={28}>
          <Cta onClick={goMenu}>THỬ NGAY</Cta>
          <Tagline>PHẦN CƠM CHO NGƯỜI BẬN RỘN</Tagline>
        </Centered>
      </RedBand>

      {/* ---------- no feedback yet ---------- */}
      <NoFeedback $h="clamp(360px,46vw,540px)">
        <Tray rotate={22} style={{ position: 'absolute', left: -90, top: 30, width: 'clamp(180px,26vw,300px)' }} />
        <Tray rotate={-8} speed={-0.12} style={{ position: 'absolute', right: '5%', bottom: 20, width: 'clamp(160px,22vw,260px)' }} />
        <Reveal kind="head"><h2>MỚI MỞ CHƯA CÓ FEEDBACK KHÁCH HÀNG MÔ</h2></Reveal>
      </NoFeedback>

      {/* ---------- oracle ---------- */}
      <Oracle>
        <OracleGrid>
          <Reveal kind="pop" style={{ position: 'relative', aspectRatio: '4/3', border: '3px solid var(--cream)' }}>
            <FillImg src="/images/green-band.webp" alt="Cơm phần" $fit="cover" loading="lazy" />
          </Reveal>
          <Centered style={{ alignItems: 'flex-start' }}>
            <Reveal kind="head">
              <h2 style={{ margin: 0, color: 'var(--gold)', fontWeight: 900, fontSize: 'clamp(26px,3.4vw,46px)', lineHeight: 1.08, textWrap: 'balance' }}>HÔM NAY E HONG BIẾT ĂN GÌ CẢA</h2>
            </Reveal>
            <OracleLink onClick={askOracle} disabled={!products.length}>NHẬN NGAY THÔNG ĐIỆP VŨ TRỤ TẠI ĐÂY</OracleLink>
            {oracle && (
              <Reveal kind="pop" key={oracle.id}>
                <OracleCard>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <small>VŨ TRỤ BẢO HÔM NAY ĂN</small>
                    <b>{oracle.name}</b>
                  </div>
                  <InkButton onClick={() => navigate(dishHref(oracle))}>Thêm vào giỏ <span style={{ color: 'var(--gold)' }}>{fmt(priceOf(oracle))}</span></InkButton>
                  <TextButton $plain $size={12} onClick={askOracle} style={{ color: 'var(--ink)' }}>Hỏi lại</TextButton>
                </OracleCard>
              </Reveal>
            )}
          </Centered>
        </OracleGrid>
      </Oracle>

      <TrayStage $h="clamp(260px,32vw,380px)" style={{ display: 'grid', placeItems: 'center' }}>
        <Tray rotate={28} style={{ width: 'clamp(170px,24vw,280px)' }} />
      </TrayStage>

      {/* ---------- today's dishes ---------- */}
      <RedBand both margin="40px 0" clip="polygon(0 40px,100% 0,100% calc(100% - 40px),0 100%)" pad={`clamp(70px,8vw,100px) ${GUTTER}`}>
        <Container>
          <Centered $gap={32}>
            <Reveal kind="head"><h2 style={{ margin: 0, color: 'var(--orange)', fontWeight: 900, fontSize: 'clamp(24px,3vw,40px)', textAlign: 'center' }}>MÓN NGON HÔM NAY</h2></Reveal>
            <WhiteBox>
              {isLoading ? <Spinner /> : today.length ? (
                <Grid3 $gap="20px" $phone2>{today.map((p, i) => <DishCard key={p.id} p={p} variant="today" index={i} />)}</Grid3>
              ) : (
                <Empty title="Bếp đang lên món" hint="Các quán trong xóm chưa đăng món nào. Ghé lại sau nhé!" />
              )}
            </WhiteBox>
            <Cta onClick={goMenu} rotate={1}>THỬ NGAY</Cta>
          </Centered>
        </Container>
      </RedBand>

      <TrayStage $h="clamp(200px,26vw,320px)">
        <Tray rotate={12} style={{ position: 'absolute', left: '6%', top: 0, width: 'clamp(150px,22vw,260px)' }} />
        <Tray rotate={-16} speed={-0.12} style={{ position: 'absolute', right: -40, top: 10, width: 'clamp(150px,22vw,260px)' }} />
      </TrayStage>

      {/* ---------- healthy ---------- */}
      <RedBand both margin="20px 0 60px" clip="polygon(0 60px,100% 0,100% 100%,0 calc(100% - 60px))" pad={`clamp(90px,10vw,140px) ${GUTTER}`}>
        <Container $max={1000} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <Badge kind="pop"><FillImg src="/assets/badge-song-khoe.png" alt="For real sống khỏe" loading="lazy" style={{ transform: 'rotate(-14deg)' }} /></Badge>
          <Reveal kind="head">
            <HealthyTitle><span>ĂN UỐNG<br />HEALTHY TÍ</span><span>CÓ HẠI GÌ ĐÂU?</span></HealthyTitle>
          </Reveal>
          <Badge kind="pop" delay={0.1}><FillImg src="/assets/badge-vua-tui-tien.png" alt="Vừa túi tiền" loading="lazy" style={{ transform: 'rotate(12deg)' }} /></Badge>
          <div style={{ flexBasis: '100%', display: 'flex', justifyContent: 'center', marginTop: 12 }}><Cta onClick={goMenu} rotate={-1}>THỬ NGAY</Cta></div>
        </Container>
      </RedBand>
    </div>
  );
}
