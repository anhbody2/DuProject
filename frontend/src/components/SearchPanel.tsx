'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { sx } from '@/lib/sx';
import { fmt, imageOf, priceOf, primaryLocation } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store';
import { useProductsQuery, useStoresQuery } from '@/store/api';
import { toggleSearch } from '@/store/uiSlice';
import { useAddToCart } from '@/hooks/useShop';
import { Photo, Spinner } from './ui';

const SUGGESTS = ['Cơm tấm', 'Canh chua', 'Cá kho', 'Bánh mì', 'Chè'];

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

export default function SearchPanel() {
  const open = useAppSelector((s) => s.ui.searchOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [q, setQ] = useState('');
  const query = useDebounced(q.trim());
  const { addProduct } = useAddToCart();

  const dishes = useProductsQuery({ q: query, limit: 6 }, { skip: !open || !query });
  const stores = useStoresQuery({ q: query, limit: 5 }, { skip: !open || !query });

  useEffect(() => { if (!open) setQ(''); }, [open]);
  const close = () => dispatch(toggleSearch());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}
          style={sx('position:relative;z-index:4;background:var(--cream);border-bottom:3px solid var(--ink);padding:20px clamp(16px,4vw,56px) 24px;box-shadow:0 10px 0 rgba(75,28,20,.12)')}
        >
          <div style={sx('max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:16px')}>
            <div style={sx('display:flex;align-items:center;gap:12px;background:#fff;border:3px solid var(--ink);box-shadow:6px 6px 0 var(--red);padding:0 8px 0 16px')}>
              <Search size={22} color="var(--red)" strokeWidth={2.6} />
              <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Tìm món ăn hoặc quán ở Chợ Xóm…" style={sx('flex:1;min-width:0;border:0;outline:none;background:transparent;font-size:clamp(16px,1.8vw,20px);font-weight:700;padding:14px 0')} />
              {q && <button onClick={() => setQ('')} title="Xoá" className="hv-red" style={sx('all:unset;cursor:pointer;width:36px;height:36px;display:grid;place-items:center;color:var(--muted)')}><X size={18} strokeWidth={2.6} /></button>}
              <button onClick={close} className="hv-bg-red" style={sx('all:unset;cursor:pointer;font-size:12px;font-weight:800;padding:8px 12px;background:var(--ink);color:var(--cream)')}>ĐÓNG</button>
            </div>

            {!q.trim() ? (
              <div style={sx('display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px')}>
                <span style={sx('font-size:12px;font-weight:800;color:var(--muted);letter-spacing:.06em')}>GỢI Ý</span>
                {SUGGESTS.map((g) => <button key={g} onClick={() => setQ(g)} className="hv-green-chip" style={sx('all:unset;cursor:pointer;font-weight:800;font-size:14px;padding:6px 12px;border-radius:20px;border:2px solid var(--green);color:var(--green)')}>{g}</button>)}
              </div>
            ) : (
              <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px 32px')}>
                <div style={sx('display:flex;flex-direction:column;gap:6px')}>
                  <span style={sx('font-weight:900;font-size:18px;color:var(--green)')}>MÓN ĂN · {dishes.data?.meta.total ?? 0}</span>
                  {dishes.isFetching ? <Spinner /> : !dishes.data?.items.length && <span style={sx('font-size:13px;color:var(--muted)')}>Không có món nào khớp.</span>}
                  {!dishes.isFetching && dishes.data?.items.map((d) => (
                    <div key={d.id} style={sx('display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-bottom:2px dashed var(--line)')}>
                      <div style={sx('width:48px;height:48px')}><Photo src={imageOf(d)} alt="" sizes="48px" /></div>
                      <div style={sx('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                        <span style={sx('font-size:14px;font-weight:700')}>{d.name}</span>
                        <span style={sx('font-size:13px;font-weight:800;color:var(--red)')}>{fmt(priceOf(d))}{d.store && <span style={sx('color:var(--muted);font-weight:500')}> · {d.store.name}</span>}</span>
                      </div>
                      <button onClick={() => addProduct(d)} title="Thêm vào giỏ" className="hv-add" style={sx('all:unset;cursor:pointer;width:38px;height:38px;display:grid;place-items:center;background:var(--ink);color:var(--gold)')}><Plus size={18} strokeWidth={3} /></button>
                    </div>
                  ))}
                </div>
                <div style={sx('display:flex;flex-direction:column;gap:6px')}>
                  <span style={sx('font-weight:900;font-size:18px;color:var(--green)')}>QUÁN Ở CHỢ XÓM · {stores.data?.meta.total ?? 0}</span>
                  {stores.isFetching ? <Spinner /> : !stores.data?.items.length && <span style={sx('font-size:13px;color:var(--muted)')}>Chưa có quán nào khớp.</span>}
                  {!stores.isFetching && stores.data?.items.map((s) => {
                    const loc = primaryLocation(s);
                    return (
                      <div key={s.id} style={sx('display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-bottom:2px dashed var(--line)')}>
                        <div style={sx('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                          <span style={sx('font-size:14px;font-weight:900;color:var(--red)')}>{s.name}</span>
                          <span style={sx('font-size:12px;color:var(--muted)')}>{[s.categories?.[0]?.name, loc?.district].filter(Boolean).join(' · ')}</span>
                        </div>
                        <button onClick={() => { close(); router.push(`/market?store=${s.id}`); }} className="hv-dark" style={sx('all:unset;cursor:pointer;font-size:12px;font-weight:800;padding:8px 12px;border:2px solid var(--ink)')}>XEM</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
