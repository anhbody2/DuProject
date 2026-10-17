import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronRight, Heart, Minus, Plus, Store as StoreIcon } from 'lucide-react';
import { GUTTER } from '@/theme/tokens';
import { fmt, priceOf, storeHref, tagOf } from '@/lib/format';
import { useAddToCart, useFavoriteProducts } from '@/hooks/useShop';
import { sanitizeHtml } from '@/lib/html';
import { useAuth } from '@/redux';
import { useMyStoresQuery, useProductQuery, useProductsQuery } from '@/redux/api';
import DishCard from '@/components/DishCard';
import DishOptions, { useDishOptions } from '@/components/DishOptions';
import {
  Container, Empty, GreenButton, Grid3, IconButton, InkButton, Muted, Photo, Reveal, Row,
  Section, Spinner, Split, Stack,
} from '@/components/ui';
import {
  Crumbs, Description, MainPhoto, Price, SectionHead, Stepper, Tag, Thumb, Thumbs, Title,
} from './styles';
import Feedback, { RatingSummary } from './Feedback';
import DescriptionEditor from './DescriptionEditor';

const MAX_QTY = 99;

/**
 * /product/:id - photos, price, options, customer feedback and more dishes from the same store.
 * Every dish link lands here (`dishHref`); this is where a dish is added to the cart.
 */
export default function ProductDetailPage() {
  const id = Number(useParams().id);
  const valid = Number.isInteger(id) && id > 0;
  const { data: p, isLoading, isError } = useProductQuery(id, { skip: !valid });
  const { addProduct, isLoading: adding } = useAddToCart();
  const favs = useFavoriteProducts();
  const { token } = useAuth();
  const { data: myStores } = useMyStoresQuery(undefined, { skip: !token });
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const options = useDishOptions(p);
  const { chosenIds, extra, missing } = options;

  // Navigating between dishes reuses this component: start fresh.
  useEffect(() => { setPhoto(0); setQty(1); }, [id]);

  if (valid && isLoading) return <Spinner />;
  if (!valid || isError || !p) {
    return (
      <Section>
        <Empty title="Không tìm thấy món" hint="Món này không tồn tại hoặc đã ngừng bán." action={<GreenButton as={Link} to="/menu">Xem thực đơn</GreenButton>} />
      </Section>
    );
  }

  const images = p.images ?? [];
  const tag = tagOf(p);
  const soldOut = tag === 'Hết hàng';
  const onSale = p.salePrice != null && p.salePrice < p.price;
  const maxQty = Math.max(1, Math.min(MAX_QTY, p.stock));
  const fav = favs.ids.has(p.id);
  const unitPrice = priceOf(p) + extra;
  const isOwner = !!myStores?.some((m) => m.role === 'owner' && m.store.id === p.storeId);

  return (
    <>
      <Section $pad={`32px ${GUTTER} 56px`}>
        <Container>
          <Crumbs aria-label="Breadcrumb">
            <Link to="/menu">Thực đơn</Link>
            {p.store && (<><ChevronRight size={14} /><Link to={storeHref(p.store.id)}>{p.store.name}</Link></>)}
            <ChevronRight size={14} />
            <span>{p.name}</span>
          </Crumbs>

          <Split $min={320}>
            <Reveal kind="block">
              <MainPhoto>
                <Photo src={images[photo]?.imageUrl} alt={p.name} />
                {tag && <Tag $soldOut={soldOut}>{tag}</Tag>}
              </MainPhoto>
              {images.length > 1 && (
                <Thumbs>
                  {images.map((img, i) => (
                    <Thumb key={img.id} $active={i === photo} onClick={() => setPhoto(i)} aria-label={`Ảnh ${i + 1}`}>
                      <Photo src={img.imageUrl} alt={p.name} />
                    </Thumb>
                  ))}
                </Thumbs>
              )}
            </Reveal>

            <Stack $gap={18}>
              <Stack $gap={8}>
                <Row $align="flex-start">
                  <Title>{p.name}</Title>
                  <IconButton
                    onClick={() => favs.toggle(p.id)}
                    title="Yêu thích"
                    aria-pressed={fav}
                    $anim="beat"
                    $hoverColor="var(--red-text)"
                    style={{ color: fav ? 'var(--red-text)' : 'var(--text)' }}
                  >
                    <Heart size={26} fill={fav ? 'currentColor' : 'none'} />
                  </IconButton>
                </Row>
                {p.store && (
                  <Link to={storeHref(p.store.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    <StoreIcon size={16} /> {p.store.name}
                  </Link>
                )}
                <RatingSummary productId={p.id} />
              </Stack>

              <Price>
                {fmt(unitPrice)}
                {onSale && <s>{fmt(p.price + extra)}</s>}
              </Price>

              {p.description && <Description dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }} />}

              <DishOptions {...options} />

              <Row $justify="flex-start" $gap="16px" $wrap>
                <Stepper>
                  <IconButton onClick={() => setQty((q) => q - 1)} disabled={soldOut || qty <= 1} aria-label="Bớt"><Minus size={16} /></IconButton>
                  <span aria-live="polite">{qty}</span>
                  <IconButton onClick={() => setQty((q) => q + 1)} disabled={soldOut || qty >= maxQty} aria-label="Thêm"><Plus size={16} /></IconButton>
                </Stepper>
                <GreenButton onClick={() => addProduct(p, qty, chosenIds)} disabled={soldOut || adding || !!missing} style={{ flex: 1, minWidth: 200 }}>
                  {soldOut ? 'Hết hàng' : missing ? `Chọn ${missing.name.toLowerCase()}` : `Thêm vào giỏ · ${fmt(unitPrice * qty)}`}
                </GreenButton>
              </Row>
              {!soldOut && p.stock <= 10 && <Muted $size={13}>Chỉ còn {p.stock} phần</Muted>}
            </Stack>
          </Split>
        </Container>
      </Section>

      <Section $pad={`0 ${GUTTER} 56px`}>
        <Container $max={800}>
          {isOwner && (
            <div style={{ marginBottom: 32 }}>
              <DescriptionEditor productId={p.id} description={p.description} />
            </div>
          )}
          <Feedback productId={p.id} />
        </Container>
      </Section>

      {p.store && <MoreFromStore storeId={p.store.id} storeName={p.store.name} excludeId={p.id} />}
    </>
  );
}

function MoreFromStore({ storeId, storeName, excludeId }: { storeId: number; storeName: string; excludeId: number }) {
  const { data } = useProductsQuery({ storeId, sort: 'newest', limit: 4 });
  const more = (data?.items ?? []).filter((x) => x.id !== excludeId).slice(0, 3);
  if (!more.length) return null;
  return (
    <Section $pad={`0 ${GUTTER} 90px`}>
      <Container>
        <Row style={{ marginBottom: 20 }}>
          <SectionHead style={{ margin: 0 }}>Thêm từ {storeName}</SectionHead>
          <InkButton as={Link} to={storeHref(storeId)} $round>Xem tất cả</InkButton>
        </Row>
        <Grid3 $phone2>
          {more.map((x, i) => <DishCard key={x.id} p={x} index={i} />)}
        </Grid3>
      </Container>
    </Section>
  );
}
