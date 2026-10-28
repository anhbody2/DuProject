import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronUp, LocateFixed, MessageCircle, Plus } from 'lucide-react';
import { GUTTER } from '@/theme/tokens';
import { toast } from '@/lib/toast';
import { primaryLocation, storeHref } from '@/lib/format';
import { useAuth } from '@/redux';
import { useCategoriesQuery, useStoresQuery } from '@/redux/api';
import { useFavoriteStores } from '@/hooks/useShop';
import { useStartChat } from '@/hooks/useStartChat';
import { useUrlParams } from '@/hooks/useUrlParams';
import AddStoreForm from '@/components/AddStoreForm';
import { Chip, Container, CreamWord, Empty, FilterLabel, GoldWord, Grid3, Muted, Photo, RedBand, Reveal, Section, Spinner, Stack } from '@/components/ui';
import { HeroTitle, AddStoreCta, MapFrame, StoreCard, Pill, LoveButton, ChatButton } from './styles';

// Leaflet is heavy, so the map is split into its own chunk.
const StoreMap = lazy(() => import('@/components/StoreMap'));

export default function MarketPage() {
  // Filters live in the URL (/market?category=3&near=1). Coordinates stay in memory,
  // so a shared link asks the viewer for their own location instead of leaking ours.
  const url = useUrlParams();
  const focusId = url.num('store');
  const categoryId = url.num('category');
  const nearOn = url.str('near') === '1';
  const { user } = useAuth();
  // Any signed-in user can add a store; the API promotes customers to 'member'.
  const canCreate = !!user;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const near = nearOn ? coords : null;
  const { data: tree = [] } = useCategoriesQuery();
  const { data, isFetching, isError } = useStoresQuery({ categoryId, ...(near ?? {}), radiusKm: near ? 5 : undefined });
  const stores = useMemo(() => data?.items ?? [], [data]);
  const favs = useFavoriteStores();
  const chat = useStartChat();

  const [picked, setPicked] = useState<[number, number] | null>(null);

  // Resolve ?near=1 into coordinates (also when arriving from a shared link); drop it if we can't.
  useEffect(() => {
    if (!nearOn || coords) return;
    const fail = (msg: string) => { toast(msg); url.update({ near: undefined }); };
    if (!navigator.geolocation) return fail('Trình duyệt không hỗ trợ định vị');
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => fail('Không lấy được vị trí của bạn'),
    );
  }, [nearOn, coords, url.update]);

  const locateMe = () => url.update({ near: nearOn ? undefined : 1 }, true);

  const jumpToForm = () => {
    const form = document.getElementById('add-store');
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  };
  // The CTA starts at the map (drop a pin, then its popup leads to the form); signed-out users go to the form's login link.
  const startAdding = () => {
    if (!canCreate) return jumpToForm();
    document.getElementById('market-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Bấm vào bản đồ để ghim vị trí quán');
  };

  return (
    <div>
      <RedBand clip="polygon(0 0,100% 0,100% calc(100% - 90px),0 100%)" pad={`30px ${GUTTER} 130px`}>
        <Container>
          <Stack $gap={18} $align="center" style={{ textAlign: 'center' }}>
            <HeroTitle><CreamWord>CHỢ</CreamWord><GoldWord>XÓM</GoldWord></HeroTitle>
            <p style={{ margin: 0, color: 'var(--orange)', fontWeight: 800, fontSize: 'clamp(13px,1.4vw,17px)', letterSpacing: '.04em', textWrap: 'balance' }}>QUÁN RUỘT CỦA BẠN — CẢ XÓM CÙNG BIẾT</p>
            <AddStoreCta onClick={startAdding}><Plus size={24} strokeWidth={3} />THÊM CỬA HÀNG</AddStoreCta>
          </Stack>
        </Container>
      </RedBand>

      <Section>
        <Container $max={1200}>
          <Stack $gap={40}>
            <Stack $gap={20}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '10px 18px' }}>
                <FilterLabel>LỌC</FilterLabel>
                {[{ id: undefined as number | undefined, name: 'Tất cả' }, ...tree].map((c) => (
                  <Chip key={c.name} $active={categoryId === c.id} onClick={() => url.update({ category: c.id }, true)}>{c.name}</Chip>
                ))}
                <Chip $active={nearOn} onClick={locateMe}><LocateFixed size={15} />Gần tôi (5km)</Chip>
              </div>

              <Stack $gap={8} id="market-map">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 900, fontSize: 'clamp(20px,2.2vw,28px)', color: 'var(--green-text)' }}>BẢN ĐỒ XÓM</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{stores.length} quán · bấm vào điểm để xem{canCreate && ' · bấm vào bản đồ để chọn vị trí quán mới'}</span>
                </div>
                <MapFrame className="du-map">
                  <Suspense fallback={<Spinner label="Đang mở bản đồ…" />}>
                    <StoreMap stores={stores} focusId={focusId} picked={canCreate ? picked : null} onPick={canCreate ? setPicked : undefined} onPickedClick={jumpToForm} />
                  </Suspense>
                </MapFrame>
              </Stack>

              {isFetching && !stores.length ? <Spinner /> : isError ? (
                <Empty title="Không tải được danh sách quán" hint="Thử tải lại trang nhé." />
              ) : !stores.length ? (
                <Empty title={near ? 'Chưa có quán nào quanh bạn' : 'Chợ đang vắng'} hint="Chưa có quán nào được duyệt ở đây. Giới thiệu quán ruột của bạn bên dưới!" />
              ) : (
                <Grid3>
                  {stores.map((s, i) => {
                    const loc = primaryLocation(s);
                    const fav = favs.ids.has(s.id);
                    return (
                      <Reveal key={s.id} kind="card" delay={Math.min(i, 8) * 0.08}>
                        <StoreCard $focus={s.id === focusId}>
                          <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                            <Photo src={s.coverUrl ?? s.logoUrl} alt={s.name} />
                            {s.categories?.[0] && <Pill>{s.categories[0].name}</Pill>}
                            {s.distanceKm != null && <Pill $dark $right>{Number(s.distanceKm).toFixed(1)} km</Pill>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', padding: '0 4px' }}>
                            <Stack $gap={3}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--red-text)', lineHeight: 1.2 }}>{s.name}</span>
                              <Muted>{[loc?.addressLine, loc?.ward ?? loc?.district].filter(Boolean).join(' · ')}</Muted>
                            </Stack>
                            <LoveButton $on={fav} onClick={() => favs.toggle(s.id)} title={fav ? 'Bỏ quán ruột' : 'Thêm vào quán ruột'} aria-pressed={fav}>
                              <ChevronUp size={16} strokeWidth={3} />MÊ
                            </LoveButton>
                          </div>
                          {s.description && <p style={{ margin: 0, padding: '0 4px', fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>“{s.description}”</p>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '0 4px 4px', marginTop: 'auto' }}>
                            <Link to={storeHref(s.id)} style={{ fontSize: 11, fontWeight: 700 }}>Xem món →</Link>
                            {s.ownerId !== user?.id && (
                              <ChatButton onClick={() => chat.withStore(s.id)} disabled={chat.busy} title={`Nhắn tin cho ${s.name}`}>
                                <MessageCircle size={14} strokeWidth={2.8} />NHẮN QUÁN
                              </ChatButton>
                            )}
                          </div>
                        </StoreCard>
                      </Reveal>
                    );
                  })}
                </Grid3>
              )}
            </Stack>

            <Reveal kind="block">
              <AddStoreForm id="add-store" picked={picked} onPick={setPicked} />
            </Reveal>
          </Stack>
        </Container>
      </Section>
    </div>
  );
}
