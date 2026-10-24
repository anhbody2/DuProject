import { useMemo } from 'react';
import { Navigate } from 'react-router';
import { GUTTER } from '@/theme/tokens';
import { storeHref } from '@/lib/format';
import { useCategoriesQuery, useProductsQuery } from '@/redux/api';
import type { Product } from '@/redux/types';
import { useUrlParams } from '@/hooks/useUrlParams';
import DishCard from '@/components/DishCard';
import DishFilters, { SORT_KEYS, flattenCategories, type DishFilterValue } from '@/components/DishFilters';
import { Chip, Container, Empty, Grid4, Muted, RedBand, Reveal, Section, Spinner, StrokeHeading, Tray } from '@/components/ui';
import { Kicker, CatHead } from './styles';

/**
 * Every dish of every store, for discovery. Ordering happens on the dish's store page,
 * so old /menu?store=2 links redirect there.
 */
export default function MenuPage() {
  const storeId = useUrlParams().num('store');
  return storeId ? <Navigate to={storeHref(storeId)} replace /> : <Menu />;
}

/** Menu filters live in the URL: /menu?category=5&sort=price_asc&q=pho (q comes from the search panel). */
function Menu() {
  const url = useUrlParams();
  const categoryId = url.num('category');
  const sort = url.oneOf('sort', SORT_KEYS, 'newest');
  const q = url.str('q') ?? '';

  const { data: tree = [] } = useCategoriesQuery();
  const byId = useMemo(() => flattenCategories(tree), [tree]);
  const { data, isLoading, isFetching, isError } = useProductsQuery({ categoryId, sort, q: q || undefined });
  const { data: freshData, isLoading: freshLoading } = useProductsQuery({ sort: 'newest', limit: 4 });
  const products = useMemo(() => data?.items ?? [], [data]);
  const fresh = freshData?.items ?? [];

  // One section per category that has dishes, in category-name order; the server's sort holds inside each.
  const sections = useMemo(() => {
    const groups = new Map<number, Product[]>();
    for (const p of products) groups.set(p.categoryId, [...(groups.get(p.categoryId) ?? []), p]);
    return [...groups.entries()]
      .map(([id, items]) => ({ id, name: (byId.get(id)?.name ?? 'Khác').toUpperCase(), items }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [byId, products]);

  const setFilter = (patch: Partial<DishFilterValue>) => url.update({
    ...('categoryId' in patch && { category: patch.categoryId }),
    ...(patch.sort && { sort: patch.sort === 'newest' ? undefined : patch.sort }),
  }, true);
  const filtered = !!(categoryId || q);
  const clear = () => url.update({ category: undefined, q: undefined }, true);

  return (
    <div>
      <RedBand clip="polygon(0 0,100% 0,100% calc(100% - 20px),0 calc(100% - 90px))" pad="12px 0 110px">
        <Kicker>MỚI LÊN KỆ</Kicker>
        <Container $max={1280}>
          <Grid4 $phone2 $min={160} style={{ padding: `4px ${GUTTER} 16px` }}>
            {freshLoading ? <Spinner color="var(--gold)" /> : fresh.length ? fresh.map((p, i) => <DishCard key={p.id} p={p} variant="fresh" index={i} />) : (
              <span style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 14 }}>Chưa có món mới.</span>
            )}
          </Grid4>
        </Container>
      </RedBand>

      <Section $pad={`40px ${GUTTER} 80px`} style={{ position: 'relative' }}>
        <Tray rotate={-14} style={{ position: 'absolute', left: -110, top: -10, width: 'clamp(180px,24vw,280px)', zIndex: 0 }} />
        <Container $max={1280} style={{ position: 'relative' }}>
          <Reveal kind="head"><StrokeHeading style={{ marginBottom: 24 }}>THỰC ĐƠN</StrokeHeading></Reveal>

          {q && (
            <p style={{ margin: '0 0 12px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
              Kết quả cho <b style={{ color: 'var(--red-text)' }}>“{q}”</b> · <button type="button" onClick={() => url.update({ q: undefined }, true)} style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}>bỏ tìm kiếm</button>
            </p>
          )}

          <DishFilters value={{ categoryId, sort }} onChange={setFilter} sticky />

          {isLoading ? <Spinner /> : isError ? (
            <Empty title="Không tải được thực đơn" hint="Máy chủ đang bận, thử tải lại trang nhé." />
          ) : !sections.length ? (
            filtered
              ? <Empty title="Không có món nào khớp" hint="Thử bỏ bớt bộ lọc hoặc đổi từ khoá." action={<Chip onClick={clear}>XOÁ BỘ LỌC</Chip>} />
              : <Empty title="Thực đơn đang trống" hint="Các quán chưa đăng món nào." />
          ) : sections.map((c) => (
            <div key={c.id} style={{ paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 14, opacity: isFetching ? 0.55 : 1, transition: 'opacity .2s' }}>
              <CatHead><h2>{c.name}</h2><Muted>{c.items.length} món</Muted></CatHead>
              <Grid4 $phone2 $min={160}>{c.items.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}</Grid4>
            </div>
          ))}

          {data && data.meta.total > products.length && (
            <p style={{ margin: '28px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Đang hiện {products.length}/{data.meta.total} món — lọc theo loại hoặc bấm kính lúp để tìm theo tên.</p>
          )}
        </Container>
      </Section>
    </div>
  );
}
