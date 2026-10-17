'use client';

import { Heart } from 'lucide-react';
import { sx } from '@/lib/sx';
import { fmt, imageOf, priceOf, tagOf } from '@/lib/format';
import { useAddToCart, useFavoriteProducts } from '@/hooks/useShop';
import type { Product } from '@/store/types';
import { Photo, Reveal } from './ui';

const WRAP = {
  today: 'background:#fff;display:flex;flex-direction:column;gap:8px;height:100%',
  fresh: 'background:#fff;padding:8px;display:flex;flex-direction:column;gap:8px;height:100%;box-shadow:0 10px 24px rgba(0,0,0,.25)',
  menu: 'background:#fff;padding:8px;display:flex;flex-direction:column;gap:8px;height:100%;box-shadow:0 2px 0 rgba(75,28,20,.12),0 10px 24px rgba(75,28,20,.08)',
};

/** Dish tile. `variant`: 'today' (landing strip), 'fresh' (menu hero), 'menu'. */
export default function DishCard({ p, variant = 'menu', index = 0 }: { p: Product; variant?: keyof typeof WRAP; index?: number }) {
  const { addProduct } = useAddToCart();
  const favs = useFavoriteProducts();
  const fav = favs.ids.has(p.id);
  const tag = tagOf(p);
  const soldOut = tag === 'Hết hàng';
  const price = priceOf(p);

  return (
    <Reveal kind="card" delay={Math.min(index, 8) * 0.08}>
      <div style={sx(WRAP[variant])}>
        <div style={sx('position:relative;aspect-ratio:1/1')}>
          <Photo src={imageOf(p)} alt={p.name} />
          {tag && (
            <span style={{ ...sx('position:absolute;top:6px;left:6px;color:#fff;font-weight:800;padding:3px 7px;border-radius:3px;pointer-events:none'), fontSize: variant === 'today' ? 14 : 10, background: soldOut ? 'var(--ink)' : 'var(--green)' }}>{tag}</span>
          )}
        </div>
        <div style={sx('display:flex;justify-content:space-between;gap:8px;align-items:flex-start;min-height:34px')}>
          <div style={sx('display:flex;flex-direction:column;gap:2px;min-width:0')}>
            <span style={sx('font-size:13px;font-weight:500;line-height:1.3')}>{p.name}</span>
            {p.store && <span style={sx('font-size:11px;color:var(--muted)')}>{p.store.name}</span>}
          </div>
          <button onClick={() => favs.toggle(p.id)} title="Yêu thích" aria-pressed={fav} className="hv-beat" style={{ ...sx('all:unset;cursor:pointer;display:grid;place-items:center;width:28px;height:28px;margin:-4px -4px 0 0;flex:none'), color: fav ? 'var(--red)' : 'var(--ink)' }}>
            <Heart size={20} fill={fav ? 'var(--red)' : 'none'} />
          </button>
        </div>
        <button onClick={() => addProduct(p)} disabled={soldOut} className="hv-bg-green" style={sx('all:unset;cursor:pointer;margin-top:auto;background:var(--ink);color:var(--cream);padding:9px;font-size:12px;font-weight:800;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px;line-height:1.4')}>
          <span style={{ whiteSpace: 'nowrap' }}>{soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
          <span style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>
            {fmt(price)}
            {p.salePrice != null && p.salePrice < p.price && <s style={{ color: '#a89a78', marginLeft: 6, fontWeight: 500 }}>{fmt(p.price)}</s>}
          </span>
        </button>
      </div>
    </Reveal>
  );
}
