import { Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { dishHref, fmt, imageOf, priceOf, storeHref, tagOf } from '@/lib/format';
import { useFavoriteProducts } from '@/hooks/useShop';
import type { Product } from '@/redux/types';
import { IconButton, Muted, Photo, Reveal, Stack } from '@/components/ui';
import { Tile, Tag, AddButton, type Variant } from './styles';

/**
 * Dish tile. `variant`: 'today' (landing strip), 'fresh' (menu hero), 'menu'.
 * The photo, name and add button all open the dish's page, where options are picked and it is added.
 */
export default function DishCard({ p, variant = 'menu', index = 0 }: { p: Product; variant?: Variant; index?: number }) {
  const navigate = useNavigate();
  const favs = useFavoriteProducts();
  const fav = favs.ids.has(p.id);
  const tag = tagOf(p);
  const soldOut = tag === 'Hết hàng';
  const price = priceOf(p);
  const href = dishHref(p);

  return (
    <Reveal kind="card" delay={Math.min(index, 8) * 0.08}>
      <Tile $variant={variant}>
        <Link to={href} style={{ position: 'relative', aspectRatio: '1/1', display: 'block' }}>
          <Photo src={imageOf(p)} alt={p.name} />
          {tag && <Tag $big={variant === 'today'} $soldOut={soldOut}>{tag}</Tag>}
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', minHeight: 34 }}>
          <Stack $gap={2}>
            <Link to={href} style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: 'inherit', textDecoration: 'none' }}>{p.name}</Link>
            {p.store && <Link to={storeHref(p.store.id)} style={{ color: 'inherit', textDecoration: 'none' }}><Muted $size={11}>{p.store.name}</Muted></Link>}
          </Stack>
          <IconButton
            onClick={() => favs.toggle(p.id)}
            title="Yêu thích"
            aria-pressed={fav}
            $anim="beat"
            $hoverColor="var(--red-text)"
            style={{ width: 28, height: 28, margin: '-4px -4px 0 0', color: fav ? 'var(--red-text)' : 'var(--text)' }}
          >
            <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
          </IconButton>
        </div>
        <AddButton onClick={() => navigate(href)} disabled={soldOut}>
          <span>{soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
          <span style={{ color: 'var(--gold)' }}>
            {fmt(price)}
            {p.salePrice != null && p.salePrice < p.price && <s>{fmt(p.price)}</s>}
          </span>
        </AddButton>
      </Tile>
    </Reveal>
  );
}
