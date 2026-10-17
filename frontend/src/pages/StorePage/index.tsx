import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Heart, MapPin, MessageCircle, ShoppingBag, Star } from 'lucide-react';
import { GUTTER } from '@/theme/tokens';
import { fmt, primaryLocation } from '@/lib/format';
import { useAppDispatch, useAuth } from '@/redux';
import { useCartQuery, useCategoriesQuery, useProductsQuery, useStoreQuery } from '@/redux/api';
import { setCartOpen } from '@/redux/slices/uiSlice';
import type { Product } from '@/redux/types';
import { useFavoriteStores } from '@/hooks/useShop';
import { useStartChat } from '@/hooks/useStartChat';
import { useUrlParams } from '@/hooks/useUrlParams';
import DishCard from '@/components/DishCard';
import { flattenCategories } from '@/components/DishFilters';
import { Chip, Container, Empty, GreenButton, Grid3, Muted, Photo, RedBand, Reveal, Section, Spinner, Stack, StrokeHeading } from '@/components/ui';
import { CartBar, CartNote, CatHead, Cover, Hero, HeroButton, Meta, StoreName, Tag } from './styles';

/**
 * /store/:id - the store's menu and a cart bar. Dish tiles open /product/:id, where the
 * dish is added; old ?dish=<productId> links redirect there.
 */
export default function StorePage() {
  const id = Number(useParams().id);
  const valid = Number.isInteger(id) && id > 0;
  const dishId = useUrlParams().num('dish');
  const dispatch = useAppDispatch();
  const { token, user } = useAuth();

  const { data: store, isLoading, isError } = useStoreQuery(id, { skip: !valid });
  const { data: tree = [] } = useCategoriesQuery();
  const byId = useMemo(() => flattenCategories(tree), [tree]);
  const { data: dishes, isLoading: dishesLoading } = useProductsQuery({ storeId: id, sort: 'newest' }, { skip: !valid });
  const { data: cart } = useCartQuery(undefined, { skip: !token });
  const favs = useFavoriteStores();
  const chat = useStartChat();

  // One section per dish category, in category-name order (as on the menu).
  const sections = useMemo(() => {
    const groups = new Map<number, Product[]>();
    for (const p of dishes?.items ?? []) groups.set(p.categoryId, [...(groups.get(p.categoryId) ?? []), p]);
    return [...groups.entries()]
      .map(([cid, items]) => ({ id: cid, name: (byId.get(cid)?.name ?? 'Khác').toUpperCase(), items }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [byId, dishes]);

  if (dishId) return <Navigate to={`/product/${dishId}`} replace />;
  if (valid && isLoading) return <Spinner />;
  if (!valid || isError || !store) {
    return (
      <Section>
        <Empty title="Không tìm thấy quán" hint="Quán này không tồn tại hoặc đang tạm nghỉ." action={<GreenButton as={Link} to="/menu" $size={16}>XEM THỰC ĐƠN</GreenButton>} />
      </Section>
    );
  }

  const loc = primaryLocation(store);
  const fav = favs.ids.has(store.id);
  const cartCount = cart?.itemCount ?? 0;
  const cartHere = cartCount > 0 && cart?.store?.id === store.id;
  const otherStore = cartCount > 0 && cart?.store && cart.store.id !== store.id ? cart.store : null;
  const jump = (cid: number) => document.getElementById(`cat-${cid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      <RedBand clip="polygon(0 0,100% 0,100% calc(100% - 60px),0 100%)" pad={`30px ${GUTTER} 100px`}>
        <Container>
          <Hero>
            <Cover><Photo src={store.coverUrl ?? store.logoUrl} alt={store.name} /></Cover>
            <Stack $gap={14}>
              {!!store.categories?.length && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{store.categories.map((c) => <Tag key={c.id}>{c.name}</Tag>)}</div>
              )}
              <StoreName>{store.name}</StoreName>
              <Meta>
                <span><Star size={16} fill="var(--gold)" color="var(--gold)" />{store.rating.count ? `${store.rating.average.toFixed(1)} (${store.rating.count} đánh giá)` : 'Chưa có đánh giá'}</span>
                {loc && <span><MapPin size={16} />{[loc.addressLine, loc.ward ?? loc.district].filter(Boolean).join(', ')} · <Link to={`/market?store=${store.id}`}>bản đồ</Link></span>}
              </Meta>
              {store.description && <p style={{ margin: 0, color: 'var(--cream)', fontSize: 14, lineHeight: 1.5 }}>“{store.description}”</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <HeroButton $on={fav} onClick={() => favs.toggle(store.id)} aria-pressed={fav}>
                  <Heart size={15} fill={fav ? 'currentColor' : 'none'} />{fav ? 'QUÁN RUỘT' : 'LƯU QUÁN'}
                </HeroButton>
                {store.ownerId !== user?.id && (
                  <HeroButton onClick={() => chat.withStore(store.id)} disabled={chat.busy}><MessageCircle size={15} />NHẮN QUÁN</HeroButton>
                )}
              </div>
            </Stack>
          </Hero>
        </Container>
      </RedBand>

      <Section $pad={`32px ${GUTTER} 120px`}>
        <Container>
          {otherStore && (
            <CartNote>
              Giỏ hàng đang có món của <b>{otherStore.name}</b>. Mỗi đơn chỉ đặt từ một quán: thêm món ở đây sẽ bắt đầu giỏ mới.
            </CartNote>
          )}
          <Reveal kind="head"><StrokeHeading style={{ marginBottom: 20 }}>THỰC ĐƠN</StrokeHeading></Reveal>
          {sections.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {sections.map((c) => <Chip key={c.id} onClick={() => jump(c.id)}>{c.name}</Chip>)}
            </div>
          )}
          {dishesLoading ? <Spinner /> : !sections.length ? (
            <Empty title="Quán chưa có món" hint="Quán chưa đăng món nào, ghé lại sau nhé." />
          ) : sections.map((c) => (
            <div key={c.id} style={{ paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <CatHead id={`cat-${c.id}`}><h2>{c.name}</h2><Muted>{c.items.length} món</Muted></CatHead>
              <Grid3 $phone2>{c.items.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}</Grid3>
            </div>
          ))}
        </Container>
      </Section>

      {cartHere && (
        <CartBar onClick={() => dispatch(setCartOpen(true))}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={20} />XEM GIỎ · {cartCount} món</span>
          <b>{fmt(cart!.subtotal)}</b>
        </CartBar>
      )}
    </div>
  );
}
