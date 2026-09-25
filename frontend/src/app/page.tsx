'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sx } from '@/lib/sx';
import { fmt, priceOf } from '@/lib/format';
import { useProductsQuery } from '@/store/api';
import { useAddToCart } from '@/hooks/useShop';
import DishCard from '@/components/DishCard';
import { Cta, Empty, GRID3, Parallax, Reveal, Spinner, Tray } from '@/components/ui';

const redSection = (clip: string, pad: string) => ({ ...sx(`padding:${pad};clip-path:${clip}`) });

export default function LandingPage() {
  const router = useRouter();
  const goMenu = () => router.push('/menu');
  const { data, isLoading } = useProductsQuery({ sort: 'newest' });
  const products = data?.items ?? [];
  const today = products.slice(0, 3);
  const { addProduct } = useAddToCart();
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
      <div style={sx('filter:drop-shadow(0 7px 0 var(--brown));position:relative;z-index:2')}>
        <section className="red-texture" style={redSection('polygon(0 0,100% 0,100% calc(100% - 70px),0 100%)', '0 clamp(16px,4vw,56px) clamp(90px,10vw,140px)')}>
          <div style={sx('position:relative;height:clamp(300px,52vw,600px);max-width:1200px;margin:0 auto')}>
            <Parallax speed={0.16} style={sx('position:absolute;left:0;top:4%;width:40%;aspect-ratio:504/456')}>
              <Image src="/assets/chopstick-basket.png" alt="Rổ đũa" fill priority sizes="40vw" style={{ objectFit: 'contain', transform: 'rotate(-6deg)', filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.35))' }} />
            </Parallax>
            <Parallax speed={0.32} style={sx('position:absolute;left:37%;top:2%;width:17%;aspect-ratio:214/143')}>
              <Image src="/assets/shakers.png" alt="Lọ tiêu" fill priority sizes="17vw" style={{ objectFit: 'contain', filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.35))' }} />
            </Parallax>
            <Parallax speed={-0.1} style={sx('position:absolute;right:0;top:0;width:46%;aspect-ratio:668/533')}>
              <Image src="/assets/pho-bowl.png" alt="Tô phở" fill priority sizes="46vw" style={{ objectFit: 'contain', filter: 'drop-shadow(0 18px 22px rgba(0,0,0,.4))' }} />
            </Parallax>
            <h1 style={sx('position:absolute;left:0;right:0;bottom:0;margin:0;text-align:center;font-weight:900;font-size:clamp(54px,13.5vw,196px);line-height:.9;letter-spacing:-.01em;pointer-events:none;display:flex;justify-content:center;flex-wrap:wrap;gap:0 .22em')}>
              <span style={sx('color:var(--cream);-webkit-text-stroke:3px var(--red-dark);paint-order:stroke fill;text-shadow:0 .05em 0 var(--brown)')}>CƠM</span>
              <span style={sx('color:var(--gold);text-shadow:0 .05em 0 #c2410c')}>PHẦN</span>
            </h1>
          </div>
          <div style={sx('display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:28px')}>
            <Cta onClick={goMenu}>THỬ NGAY</Cta>
            <p style={sx('margin:0;color:var(--orange);font-weight:800;font-size:clamp(13px,1.4vw,17px);letter-spacing:.04em')}>PHẦN CƠM CHO NGƯỜI BẬN RỘN</p>
          </div>
        </section>
      </div>

      {/* ---------- no feedback yet ---------- */}
      <section style={sx('position:relative;height:clamp(360px,46vw,540px);display:grid;place-items:center;padding:0 24px;margin-top:-40px;overflow:hidden')}>
        <Tray rotate={22} style={sx('position:absolute;left:-90px;top:30px;width:clamp(180px,26vw,300px)')} />
        <Tray rotate={-8} speed={-0.12} style={sx('position:absolute;right:5%;bottom:20px;width:clamp(160px,22vw,260px)')} />
        <Reveal kind="head">
          <h2 style={sx('position:relative;margin:0;text-align:center;font-weight:900;font-size:clamp(22px,3.4vw,44px);line-height:1.1;color:var(--gold);-webkit-text-stroke:2px var(--brown);paint-order:stroke fill;text-shadow:0 3px 0 var(--brown);text-wrap:balance;max-width:760px')}>MỚI MỞ CHƯA CÓ FEEDBACK KHÁCH HÀNG MÔ</h2>
        </Reveal>
      </section>

      {/* ---------- oracle ---------- */}
      <section style={sx('background:var(--green);border-top:4px solid var(--red-dark);border-bottom:4px solid var(--red-dark);padding:clamp(32px,5vw,64px) clamp(16px,4vw,56px)')}>
        <div style={sx(`max-width:1100px;margin:0 auto;${GRID3};gap:clamp(24px,4vw,56px);align-items:center`)}>
          <Reveal kind="pop" style={sx('position:relative;aspect-ratio:4/3;border:3px solid var(--cream)')}>
            <Image src="/images/green-band.webp" alt="Cơm phần" fill sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
          </Reveal>
          <div style={sx('display:flex;flex-direction:column;gap:18px;align-items:flex-start')}>
            <Reveal kind="head"><h2 style={sx('margin:0;color:var(--gold);font-weight:900;font-size:clamp(26px,3.4vw,46px);line-height:1.08;text-wrap:balance')}>HÔM NAY E HONG BIẾT ĂN GÌ CẢA</h2></Reveal>
            <button onClick={askOracle} disabled={!products.length} className="hv-link" style={sx('all:unset;cursor:pointer;color:var(--gold);font-weight:800;font-size:clamp(14px,1.4vw,18px);line-height:1.5;border-bottom:2px solid var(--gold)')}>NHẬN NGAY THÔNG ĐIỆP VŨ TRỤ TẠI ĐÂY</button>
            {oracle && (
              <Reveal kind="pop" key={oracle.id}>
               <div style={sx('background:var(--cream);padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;transform:rotate(-1deg);box-shadow:0 6px 0 var(--green-dark)')}>
                <div style={sx('display:flex;flex-direction:column;gap:2px')}>
                  <span style={sx('font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--green)')}>VŨ TRỤ BẢO HÔM NAY ĂN</span>
                  <span style={sx('font-size:22px;font-weight:900;color:var(--red)')}>{oracle.name}</span>
                </div>
                <button onClick={() => addProduct(oracle)} className="hv-bg-red" style={sx('all:unset;cursor:pointer;background:var(--ink);color:var(--cream);font-size:12px;font-weight:800;padding:9px 14px;display:flex;gap:8px')}>Thêm vào giỏ <span style={{ color: 'var(--gold)' }}>{fmt(priceOf(oracle))}</span></button>
                <button onClick={askOracle} style={sx('all:unset;cursor:pointer;font-size:12px;font-weight:700;text-decoration:underline')}>Hỏi lại</button>
               </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <section style={sx('height:clamp(260px,32vw,380px);display:grid;place-items:center;overflow:hidden')}>
        <Tray rotate={28} style={sx('width:clamp(170px,24vw,280px)')} />
      </section>

      {/* ---------- today's dishes ---------- */}
      <div style={sx('filter:drop-shadow(0 -6px 0 var(--brown)) drop-shadow(0 6px 0 var(--brown));margin:40px 0')}>
        <section className="red-texture" style={redSection('polygon(0 40px,100% 0,100% calc(100% - 40px),0 100%)', 'clamp(70px,8vw,100px) clamp(16px,4vw,56px)')}>
          <div style={sx('max-width:1100px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:32px')}>
            <Reveal kind="head"><h2 style={sx('margin:0;color:var(--orange);font-weight:900;font-size:clamp(24px,3vw,40px);text-align:center')}>MÓN NGON HÔM NAY</h2></Reveal>
            <div style={sx('width:100%;background:#fff;padding:12px')}>
              {isLoading ? <Spinner /> : today.length ? (
                <div style={sx(`${GRID3};gap:20px`)}>{today.map((p, i) => <DishCard key={p.id} p={p} variant="today" index={i} />)}</div>
              ) : (
                <Empty title="Bếp đang lên món" hint="Các quán trong xóm chưa đăng món nào. Ghé lại sau nhé!" />
              )}
            </div>
            <Cta onClick={goMenu} rotate={1}>THỬ NGAY</Cta>
          </div>
        </section>
      </div>

      <section style={sx('height:clamp(200px,26vw,320px);position:relative;overflow:hidden')}>
        <Tray rotate={12} style={sx('position:absolute;left:6%;top:0;width:clamp(150px,22vw,260px)')} />
        <Tray rotate={-16} speed={-0.12} style={sx('position:absolute;right:-40px;top:10px;width:clamp(150px,22vw,260px)')} />
      </section>

      {/* ---------- healthy ---------- */}
      <div style={sx('filter:drop-shadow(0 -6px 0 var(--brown)) drop-shadow(0 6px 0 var(--brown));margin:20px 0 60px')}>
        <section className="red-texture" style={redSection('polygon(0 60px,100% 0,100% 100%,0 calc(100% - 60px))', 'clamp(90px,10vw,140px) clamp(16px,4vw,56px)')}>
          <div style={sx('max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:28px')}>
            <Reveal kind="pop" style={sx('position:relative;width:clamp(110px,14vw,160px);aspect-ratio:1/1')}>
              <Image src="/assets/badge-song-khoe.png" alt="For real sống khỏe" fill sizes="160px" style={{ transform: 'rotate(-14deg)' }} />
            </Reveal>
            <Reveal kind="head">
              <h2 style={sx('margin:0;text-align:center;font-weight:900;line-height:1;display:flex;flex-direction:column;gap:4px')}>
                <span style={sx('color:var(--cream);-webkit-text-stroke:2px var(--brown);paint-order:stroke fill;text-shadow:0 4px 0 var(--brown);font-size:clamp(34px,5.4vw,70px)')}>ĂN UỐNG<br />HEALTHY TÍ</span>
                <span style={sx('color:var(--orange);text-shadow:0 4px 0 var(--brown);font-size:clamp(34px,5.4vw,70px)')}>CÓ HẠI GÌ ĐÂU?</span>
              </h2>
            </Reveal>
            <Reveal kind="pop" delay={0.1} style={sx('position:relative;width:clamp(110px,14vw,160px);aspect-ratio:1/1')}>
              <Image src="/assets/badge-vua-tui-tien.png" alt="Vừa túi tiền" fill sizes="160px" style={{ transform: 'rotate(12deg)' }} />
            </Reveal>
            <div style={sx('flex-basis:100%;display:flex;justify-content:center;margin-top:12px')}><Cta onClick={goMenu} rotate={-1}>THỬ NGAY</Cta></div>
          </div>
        </section>
      </div>
    </div>
  );
}
