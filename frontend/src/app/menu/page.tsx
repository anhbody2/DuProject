'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { sx } from '@/lib/sx';
import { useCategoriesQuery, useProductsQuery } from '@/store/api';
import type { Category, Product } from '@/store/types';
import DishCard from '@/components/DishCard';
import { Empty, GRID3, Reveal, Spinner, Tray, strokeHead } from '@/components/ui';

function flatten(nodes: Category[], out = new Map<number, Category>()) {
  for (const n of nodes) { out.set(n.id, n); if (n.children) flatten(n.children, out); }
  return out;
}

function Menu() {
  const storeId = Number(useSearchParams().get('store')) || undefined;
  const { data: tree } = useCategoriesQuery();
  const { data, isLoading, isError } = useProductsQuery({ sort: 'newest', storeId });
  const products = useMemo(() => data?.items ?? [], [data]);
  const [active, setActive] = useState<number | null>(null);

  // One section per category that actually has dishes, in category-name order.
  const sections = useMemo(() => {
    const byId = flatten(tree ?? []);
    const groups = new Map<number, Product[]>();
    for (const p of products) groups.set(p.categoryId, [...(groups.get(p.categoryId) ?? []), p]);
    return [...groups.entries()]
      .map(([id, items]) => ({ id, name: (byId.get(id)?.name ?? 'Khác').toUpperCase(), items }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [tree, products]);

  // Highlight the filter chip of the section currently under the sticky bar.
  useEffect(() => {
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(Number((top.target as HTMLElement).dataset.cat));
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    sections.forEach((s) => { const el = document.getElementById(`cat-${s.id}`); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  const jump = (id: number) => {
    setActive(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
  };

  const fresh = products.slice(0, 3);
  const current = active ?? sections[0]?.id;

  return (
    <div>
      <div style={sx('filter:drop-shadow(0 7px 0 var(--brown));position:relative;z-index:2')}>
        <section className="red-texture" style={sx('padding:12px 0 110px;clip-path:polygon(0 0,100% 0,100% calc(100% - 20px),0 calc(100% - 90px))')}>
          <p style={sx('max-width:1100px;margin:0 auto 14px;padding:0 clamp(16px,4vw,56px);color:var(--gold);font-weight:800;font-size:13px;letter-spacing:.08em')}>MỚI LÊN KỆ</p>
          <div style={sx(`max-width:1100px;margin:0 auto;${GRID3};gap:24px;padding:4px clamp(16px,4vw,56px) 16px`)}>
            {isLoading ? <Spinner color="var(--gold)" /> : fresh.length ? fresh.map((p, i) => <DishCard key={p.id} p={p} variant="fresh" index={i} />) : (
              <span style={sx('color:var(--cream);font-weight:700;font-size:14px')}>Chưa có món mới.</span>
            )}
          </div>
        </section>
      </div>

      <section style={sx('position:relative;padding:40px clamp(16px,4vw,56px) 80px')}>
        <Tray rotate={-14} style={sx('position:absolute;left:-110px;top:-10px;width:clamp(180px,24vw,280px);z-index:0')} />
        <div style={sx('position:relative;max-width:1100px;margin:0 auto')}>
          <Reveal kind="head"><h1 style={sx(`margin:0 0 24px;text-align:center;font-weight:900;font-size:clamp(30px,4vw,52px);${strokeHead}`)}>THỰC ĐƠN</h1></Reveal>

          {storeId && (
            <p style={sx('margin:0 0 12px;text-align:center;font-size:14px;font-weight:700')}>
              Món của quán <b style={{ color: 'var(--red)' }}>{products[0]?.store?.name ?? ''}</b> · <Link href="/menu" style={{ textDecoration: 'underline' }}>xem tất cả</Link>
            </p>
          )}

          {sections.length > 0 && (
            <div style={sx('position:sticky;top:0;z-index:4;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 26px;padding:12px 0;border-bottom:2px solid #e6dfbf;background:var(--cream)')}>
              <span style={sx('font-weight:900;font-size:clamp(22px,2.6vw,32px);color:var(--orange);text-shadow:0 2px 0 var(--brown)')}>LỌC</span>
              {sections.map((c) => (
                <button key={c.id} onClick={() => jump(c.id)} style={{ ...sx('all:unset;cursor:pointer;font-weight:800;font-size:14px;padding:6px 12px;border-radius:20px;border:2px solid var(--green)'), background: current === c.id ? 'var(--green)' : 'transparent', color: current === c.id ? 'var(--gold)' : 'var(--green)' }}>{c.name}</button>
              ))}
            </div>
          )}

          {isLoading ? <Spinner /> : isError ? (
            <Empty title="Không tải được thực đơn" hint="Máy chủ đang bận, thử tải lại trang nhé." />
          ) : !sections.length ? (
            <Empty title="Thực đơn đang trống" hint="Các quán chưa đăng món nào." />
          ) : sections.map((c) => (
            <div key={c.id} id={`cat-${c.id}`} data-cat={c.id} style={sx('padding-top:28px;display:flex;flex-direction:column;gap:14px')}>
              <div style={sx('display:flex;align-items:baseline;gap:12px')}>
                <h2 style={sx('margin:0;color:var(--green);font-weight:900;font-size:22px')}>{c.name}</h2>
                <span style={sx('font-size:12px;color:var(--muted);font-weight:500')}>{c.items.length} món</span>
              </div>
              <div style={sx(`${GRID3};gap:24px`)}>{c.items.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}</div>
            </div>
          ))}

          {data && data.meta.total > products.length && (
            <p style={sx('margin:28px 0 0;text-align:center;font-size:13px;color:var(--muted)')}>Đang hiện {products.length}/{data.meta.total} món mới nhất — dùng ô tìm kiếm để tìm món khác.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function MenuPage() {
  return <Suspense fallback={<Spinner />}><Menu /></Suspense>;
}
