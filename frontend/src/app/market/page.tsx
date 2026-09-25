'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ChevronUp, LocateFixed, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { sx } from '@/lib/sx';
import { DISTRICTS, primaryLocation } from '@/lib/format';
import { useAuth } from '@/store';
import { errorMessage, useCategoriesQuery, useCreateStoreMutation, useMyStoresQuery, useStoresQuery } from '@/store/api';
import type { Category } from '@/store/types';
import { useFavoriteStores } from '@/hooks/useShop';
import { Empty, GRID3, Photo, Reveal, Spinner } from '@/components/ui';

// Leaflet touches `window`, so the map only renders in the browser.
const StoreMap = dynamic(() => import('@/components/StoreMap'), { ssr: false, loading: () => <Spinner label="Đang mở bản đồ…" /> });

const field = 'font-size:15px;padding:10px 12px;border:2px solid var(--ink);background:var(--cream);border-radius:0;outline:none;width:100%';
const label = 'display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800';
const chip = 'all:unset;cursor:pointer;font-weight:800;font-size:14px;padding:6px 12px;border-radius:20px;border:2px solid var(--green);display:inline-flex;align-items:center;gap:6px';
const STATUS: Record<string, string> = { pending: 'Chờ duyệt', active: 'Đang bán', inactive: 'Tạm nghỉ', suspended: 'Bị khoá' };

const allCategories = (tree: Category[]): Category[] => tree.flatMap((c) => [c, ...allCategories(c.children ?? [])]);

function Market() {
  const focusId = Number(useSearchParams().get('store')) || undefined;
  const { token, user } = useAuth();
  const canCreate = user?.role === 'store_owner' || user?.role === 'admin';

  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const { data: tree = [] } = useCategoriesQuery();
  const { data, isFetching, isError } = useStoresQuery({ categoryId, ...(near ?? {}), radiusKm: near ? 5 : undefined });
  const stores = useMemo(() => data?.items ?? [], [data]);
  const favs = useFavoriteStores();
  const { data: mine } = useMyStoresQuery(undefined, { skip: !canCreate });

  const [form, setForm] = useState({ name: '', addressLine: '', district: 'Quận 1', categoryIds: [] as number[], description: '', coverUrl: '' });
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const locateMe = () => {
    if (near) return setNear(null);
    if (!navigator.geolocation) return toast('Trình duyệt không hỗ trợ định vị');
    navigator.geolocation.getCurrentPosition(
      (p) => setNear({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast('Không lấy được vị trí của bạn'),
    );
  };

  const submit = async () => {
    if (!form.name.trim() || !form.addressLine.trim()) return toast('Điền tên và địa chỉ quán nhé');
    const [latitude, longitude] = picked ?? DISTRICTS[form.district];
    try {
      await createStore({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        categoryIds: form.categoryIds.length ? form.categoryIds : undefined,
        location: { addressLine: form.addressLine.trim(), district: form.district, city: 'Hồ Chí Minh', latitude, longitude },
      }).unwrap();
      toast('Đã gửi! Quán sẽ lên chợ khi được duyệt.');
      setForm((f) => ({ ...f, name: '', addressLine: '', description: '', coverUrl: '' }));
      setPicked(null);
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const jumpToForm = () => document.getElementById('add-store')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      <div style={sx('filter:drop-shadow(0 7px 0 var(--brown));position:relative;z-index:2')}>
        <section className="red-texture" style={sx('padding:30px clamp(16px,4vw,56px) 130px;clip-path:polygon(0 0,100% 0,100% calc(100% - 90px),0 100%)')}>
          <div style={sx('max-width:1100px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center')}>
            <h1 style={sx('margin:0;font-weight:900;font-size:clamp(56px,11vw,150px);line-height:.9;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .2em')}>
              <span style={sx('color:var(--cream);-webkit-text-stroke:3px var(--red-dark);paint-order:stroke fill;text-shadow:0 .05em 0 var(--brown)')}>CHỢ</span>
              <span style={sx('color:var(--gold);text-shadow:0 .05em 0 #c2410c')}>XÓM</span>
            </h1>
            <p style={sx('margin:0;color:var(--orange);font-weight:800;font-size:clamp(13px,1.4vw,17px);letter-spacing:.04em;text-wrap:balance')}>QUÁN RUỘT CỦA BẠN — CẢ XÓM CÙNG BIẾT</p>
            <button onClick={jumpToForm} className="hv-cta" style={sx('all:unset;cursor:pointer;background:var(--green);color:var(--gold);font-weight:900;font-size:clamp(18px,2vw,26px);padding:10px 26px;outline:2px dashed var(--cream);outline-offset:-7px;box-shadow:0 0 0 4px var(--green),0 7px 0 4px var(--green-dark);transform:rotate(-1.5deg);margin-top:8px;white-space:nowrap;display:flex;align-items:center;gap:10px')}>
              <Plus size={24} strokeWidth={3} />THÊM CỬA HÀNG
            </button>
          </div>
        </section>
      </div>

      <section style={sx('padding:40px clamp(16px,4vw,56px) 90px')}>
        <div style={sx('max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:40px')}>
          <div style={sx('display:flex;flex-direction:column;gap:20px')}>
            <div style={sx('display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 18px')}>
              <span style={sx('font-weight:900;font-size:clamp(22px,2.6vw,32px);color:var(--orange);text-shadow:0 2px 0 var(--brown)')}>LỌC</span>
              {[{ id: undefined as number | undefined, name: 'Tất cả' }, ...tree].map((c) => {
                const on = categoryId === c.id;
                return <button key={c.name} onClick={() => setCategoryId(c.id)} style={{ ...sx(chip), background: on ? 'var(--green)' : 'transparent', color: on ? 'var(--gold)' : 'var(--green)' }}>{c.name}</button>;
              })}
              <button onClick={locateMe} style={{ ...sx(chip), background: near ? 'var(--green)' : 'transparent', color: near ? 'var(--gold)' : 'var(--green)' }}><LocateFixed size={15} />Gần tôi (5km)</button>
            </div>

            <div style={sx('display:flex;flex-direction:column;gap:8px')}>
              <div style={sx('display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap')}>
                <span style={sx('font-weight:900;font-size:clamp(20px,2.2vw,28px);color:var(--green)')}>BẢN ĐỒ XÓM</span>
                <span style={sx('font-size:12px;font-weight:700;color:var(--muted)')}>{stores.length} quán · bấm vào điểm để xem{canCreate && ' · bấm vào bản đồ để chọn vị trí quán mới'}</span>
              </div>
              <div className="du-map" style={sx('position:relative;z-index:0;border:3px solid var(--ink);box-shadow:8px 8px 0 var(--red);background:#efe7cf')}>
                <StoreMap stores={stores} focusId={focusId} picked={canCreate ? picked : null} onPick={canCreate ? setPicked : undefined} />
              </div>
            </div>

            {isFetching && !stores.length ? <Spinner /> : isError ? (
              <Empty title="Không tải được danh sách quán" hint="Thử tải lại trang nhé." />
            ) : !stores.length ? (
              <Empty title={near ? 'Chưa có quán nào quanh bạn' : 'Chợ đang vắng'} hint="Chưa có quán nào được duyệt ở đây. Giới thiệu quán ruột của bạn bên dưới!" />
            ) : (
              <div style={sx(`${GRID3};gap:24px`)}>
                {stores.map((s, i) => {
                  const loc = primaryLocation(s);
                  const fav = favs.ids.has(s.id);
                  return (
                    <Reveal key={s.id} kind="card" delay={Math.min(i, 8) * 0.08}>
                      <div style={{ ...sx('background:#fff;padding:8px;display:flex;flex-direction:column;gap:10px;height:100%;box-shadow:0 2px 0 rgba(75,28,20,.12),0 10px 24px rgba(75,28,20,.08)'), outline: s.id === focusId ? '3px solid var(--gold)' : undefined }}>
                        <div style={sx('position:relative;aspect-ratio:4/3')}>
                          <Photo src={s.coverUrl ?? s.logoUrl} alt={s.name} />
                          {s.categories?.[0] && <span style={sx('position:absolute;top:6px;left:6px;background:var(--gold);color:var(--ink);font-size:10px;font-weight:800;padding:3px 7px;border-radius:3px;pointer-events:none')}>{s.categories[0].name}</span>}
                          {s.distanceKm != null && <span style={sx('position:absolute;top:6px;right:6px;background:var(--ink);color:var(--gold);font-size:10px;font-weight:800;padding:3px 7px;border-radius:3px;pointer-events:none')}>{Number(s.distanceKm).toFixed(1)} km</span>}
                        </div>
                        <div style={sx('display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:0 4px')}>
                          <div style={sx('display:flex;flex-direction:column;gap:3px;min-width:0')}>
                            <span style={sx('font-size:16px;font-weight:900;color:var(--red);line-height:1.2')}>{s.name}</span>
                            <span style={sx('font-size:12px;color:var(--muted);font-weight:500')}>{[loc?.addressLine, loc?.district].filter(Boolean).join(' · ')}</span>
                          </div>
                          <button onClick={() => favs.toggle(s.id)} title={fav ? 'Bỏ quán ruột' : 'Thêm vào quán ruột'} aria-pressed={fav} className="hv-bob" style={{ ...sx('all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:44px;padding:5px 6px;border:2px solid var(--green);font-weight:900;font-size:11px;line-height:1.1'), background: fav ? 'var(--green)' : '#fff', color: fav ? 'var(--gold)' : 'var(--green)' }}>
                            <ChevronUp size={16} strokeWidth={3} />MÊ
                          </button>
                        </div>
                        {s.description && <p style={sx('margin:0;padding:0 4px;font-size:13px;line-height:1.45;text-wrap:pretty')}>“{s.description}”</p>}
                        <Link href={`/menu?store=${s.id}`} style={sx('padding:0 4px 4px;font-size:11px;color:var(--green);font-weight:700;margin-top:auto')}>Xem món →</Link>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>

          <Reveal kind="block">
            <aside id="add-store" style={sx(`background:#fff;border:3px solid var(--ink);box-shadow:8px 8px 0 var(--red);padding:22px;${GRID3};gap:14px 24px;align-items:start;scroll-margin-top:24px`)}>
              <h2 style={sx('grid-column:1/-1;margin:0;font-weight:900;font-size:26px;line-height:1.1;color:var(--gold);-webkit-text-stroke:1.5px var(--brown);paint-order:stroke fill;text-shadow:0 2px 0 var(--brown)')}>THÊM QUÁN RUỘT</h2>
              {!token ? (
                <p style={sx('grid-column:1/-1;margin:0;font-size:14px;line-height:1.5')}><Link href="/login?next=/market" style={{ fontWeight: 900, color: 'var(--red)', textDecoration: 'underline' }}>Đăng nhập</Link> bằng tài khoản chủ quán để đưa quán lên chợ.</p>
              ) : !canCreate ? (
                <p style={sx('grid-column:1/-1;margin:0;font-size:14px;line-height:1.5')}>Chỉ tài khoản <b>chủ quán</b> mới thêm được cửa hàng. Tạo một tài khoản chủ quán ở trang <Link href="/login?mode=register" style={{ fontWeight: 900, color: 'var(--red)', textDecoration: 'underline' }}>đăng ký</Link>.</p>
              ) : (
                <>
                  <p style={sx('grid-column:1/-1;margin:0 0 6px;font-size:13px;color:var(--muted);line-height:1.45')}>Quán mới sẽ ở trạng thái chờ duyệt cho tới khi quản trị viên xác nhận. Bấm vào bản đồ phía trên để đặt vị trí chính xác (mặc định là trung tâm quận).</p>
                  <label style={sx(label)}>TÊN QUÁN<input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Bún riêu Cô Hai" style={sx(field)} /></label>
                  <label style={sx(label)}>ĐỊA CHỈ<input value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} placeholder="Số nhà, tên đường" style={sx(field)} /></label>
                  <label style={sx(label)}>QUẬN
                    <select value={form.district} onChange={(e) => set('district', e.target.value)} style={sx(field)}>
                      {Object.keys(DISTRICTS).map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </label>
                  <div style={sx('display:flex;flex-direction:column;gap:6px')}>
                    <span style={sx('font-size:12px;font-weight:800')}>LOẠI</span>
                    <div style={sx('display:flex;flex-wrap:wrap;gap:6px')}>
                      {allCategories(tree).map((c) => {
                        const on = form.categoryIds.includes(c.id);
                        return (
                          <button key={c.id} onClick={() => set('categoryIds', on ? form.categoryIds.filter((x) => x !== c.id) : [...form.categoryIds, c.id])} style={{ ...sx('all:unset;cursor:pointer;font-size:13px;font-weight:700;padding:5px 10px;border:2px solid var(--ink)'), background: on ? 'var(--ink)' : '#fff', color: on ? 'var(--gold)' : 'var(--ink)' }}>{c.name}</button>
                        );
                      })}
                    </div>
                  </div>
                  <label style={sx(label)}>VÌ SAO BẠN MÊ QUÁN NÀY?<textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Nước dùng ngọt, cô chủ dễ thương…" style={{ ...sx(field), resize: 'vertical' }} /></label>
                  <label style={sx(label)}>ẢNH QUÁN (URL)<input value={form.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} placeholder="https://…" inputMode="url" style={sx(field)} /></label>
                  <button onClick={submit} disabled={creating} className="hv-green2" style={sx('all:unset;cursor:pointer;text-align:center;background:var(--green);color:var(--gold);font-weight:900;font-size:20px;padding:12px;outline:2px dashed var(--cream);outline-offset:-7px;align-self:end')}>{creating ? 'ĐANG GỬI…' : 'GỬI CHO CẢ XÓM'}</button>
                  {!!mine?.length && (
                    <div style={sx('grid-column:1/-1;display:flex;flex-direction:column;gap:6px;border-top:2px dashed var(--line);padding-top:12px')}>
                      <span style={sx('font-size:12px;font-weight:800')}>QUÁN CỦA BẠN</span>
                      {mine.map(({ store, role }) => (
                        <div key={store.id} style={sx('display:flex;justify-content:space-between;gap:10px;font-size:14px')}>
                          <span style={{ fontWeight: 700 }}>{store.name} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {role}</span></span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: store.status === 'active' ? 'var(--green)' : 'var(--red)' }}>{STATUS[store.status] ?? store.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </aside>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export default function MarketPage() {
  return <Suspense fallback={<Spinner />}><Market /></Suspense>;
}
