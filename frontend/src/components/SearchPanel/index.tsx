import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { Input } from 'antd';
import { Plus, Search, X } from 'lucide-react';
import { dishHref, fmt, imageOf, priceOf, primaryLocation, storeHref } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/redux';
import { useProductsQuery, useStoresQuery } from '@/redux/api';
import { toggleSearch } from '@/redux/slices/uiSlice';
import { useDebounced } from '@/hooks/useDebounced';
import DishFilters, { SORT_KEYS, menuHref, type DishFilterValue, type Sort } from '@/components/DishFilters';
import { Chip, Container, IconButton, InkButton, Muted, Photo, Spinner, Stack } from '@/components/ui';
import { Panel, SearchBox, Results, ColTitle, ResultRow, DishLink, AddBtn, OutlineBtn } from './styles';

const SUGGESTS = ['Cơm tấm', 'Canh chua', 'Cá kho', 'Bánh mì', 'Chè'];

export default function SearchPanel() {
  const open = useAppSelector((s) => s.ui.searchOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<DishFilterValue>({ sort: 'newest' });
  const query = useDebounced(q.trim());

  // Same filter as the menu page; results show once there's a search term or a category.
  const active = !!(query || filter.categoryId);
  const dishes = useProductsQuery({ q: query || undefined, categoryId: filter.categoryId, sort: filter.sort, limit: 6 }, { skip: !open || !active });
  const stores = useStoresQuery({ q: query || undefined, categoryId: filter.categoryId, limit: 5 }, { skip: !open || !active });

  // Opening on the menu page starts from its filters; closing resets the panel.
  useEffect(() => {
    if (!open) { setQ(''); setFilter({ sort: 'newest' }); return; }
    if (pathname !== '/menu') return;
    const p = new URLSearchParams(search);
    const sort = p.get('sort') as Sort | null;
    setQ(p.get('q') ?? '');
    setFilter({ categoryId: Number(p.get('category')) || undefined, sort: sort && SORT_KEYS.includes(sort) ? sort : 'newest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const close = () => dispatch(toggleSearch());
  const seeAll = () => { close(); navigate(menuHref(filter, query)); };
  const go = (to: string) => { close(); navigate(to); };

  return (
    <AnimatePresence>
      {open && (
        <Panel initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
          <Container $max={1100}>
            <Stack $gap={16}>
              <SearchBox>
                <Search size={22} color="var(--red-text)" strokeWidth={2.6} style={{ flex: 'none' }} />
                <Input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm món ăn hoặc quán ở Chợ Xóm…"
                  variant="borderless"
                  aria-label="Tìm kiếm"
                />
                {q && <IconButton onClick={() => setQ('')} aria-label="Xoá" $hoverColor="var(--red-text)" style={{ color: 'var(--muted)', width: 36, height: 36 }}><X size={18} strokeWidth={2.6} /></IconButton>}
                <InkButton onClick={close} style={{ padding: '8px 12px' }}>ĐÓNG</InkButton>
              </SearchBox>

              <DishFilters value={filter} onChange={(patch) => setFilter((f) => ({ ...f, ...patch }))} />

              {!q.trim() && !filter.categoryId ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 10px' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.06em' }}>GỢI Ý</span>
                  {SUGGESTS.map((g) => <Chip key={g} onClick={() => setQ(g)}>{g}</Chip>)}
                </div>
              ) : (
                <Results>
                  <Stack $gap={6}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <ColTitle>MÓN ĂN · {dishes.data?.meta.total ?? 0}</ColTitle>
                      {!!dishes.data?.meta.total && <OutlineBtn onClick={seeAll}>XEM TẤT CẢ →</OutlineBtn>}
                    </div>
                    {dishes.isFetching ? <Spinner /> : !dishes.data?.items.length && <Muted $size={13}>Không có món nào khớp.</Muted>}
                    {!dishes.isFetching && dishes.data?.items.map((d) => (
                      <ResultRow key={d.id}>
                        {/* Dishes are ordered from their store: both targets open the store page on this dish. */}
                        <DishLink to={dishHref(d)} onClick={close} title={`Xem ${d.name}`}>
                          <div style={{ width: 48, height: 48, overflow: 'hidden' }}><Photo src={imageOf(d)} alt="" /></div>
                          <Stack $gap={2}>
                            <span className="name" style={{ fontSize: 14, fontWeight: 700 }}>{d.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--red-text)' }}>
                              {fmt(priceOf(d))}{d.store && <Muted $size={13}> · {d.store.name}</Muted>}
                            </span>
                          </Stack>
                        </DishLink>
                        <AddBtn onClick={() => go(dishHref(d))} aria-label="Thêm vào giỏ" title="Thêm vào giỏ"><Plus size={18} strokeWidth={3} /></AddBtn>
                      </ResultRow>
                    ))}
                  </Stack>
                  <Stack $gap={6}>
                    <ColTitle>QUÁN Ở CHỢ XÓM · {stores.data?.meta.total ?? 0}</ColTitle>
                    {stores.isFetching ? <Spinner /> : !stores.data?.items.length && <Muted $size={13}>Chưa có quán nào khớp.</Muted>}
                    {!stores.isFetching && stores.data?.items.map((s) => {
                      const loc = primaryLocation(s);
                      return (
                        <ResultRow key={s.id}>
                          <Stack $gap={2}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--red-text)' }}>{s.name}</span>
                            <Muted>{[s.categories?.[0]?.name, loc?.ward ?? loc?.district].filter(Boolean).join(' · ')}</Muted>
                          </Stack>
                          <OutlineBtn onClick={() => go(storeHref(s.id))}>XEM</OutlineBtn>
                        </ResultRow>
                      );
                    })}
                  </Stack>
                </Results>
              )}
            </Stack>
          </Container>
        </Panel>
      )}
    </AnimatePresence>
  );
}
