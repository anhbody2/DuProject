import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Input } from 'antd';
import { toast } from '@/lib/toast';
import { useAppDispatch, useAuth } from '@/redux';
import { setUser } from '@/redux/slices/authSlice';
import { errorMessage, useCategoriesQuery, useCreateStoreMutation, useLazyMeQuery, useMyStoresQuery } from '@/redux/api';
import type { Category, Store } from '@/redux/types';
import { FieldLabel, GreenButton, Muted, Stack } from '@/components/ui';
import ImageUpload from '@/components/ImageUpload';
import AddressPicker, { EMPTY_PLACE, pointOf, useFillFromPoint, type LatLng, type PlaceValue } from '@/components/AddressPicker';
import { AddStore, CatTag } from './styles';

const STATUS: Record<string, string> = { pending: 'Chờ duyệt', active: 'Đang bán', inactive: 'Tạm nghỉ', suspended: 'Bị khoá' };

const allCategories = (tree: Category[]): Category[] => tree.flatMap((c) => [c, ...allCategories(c.children ?? [])]);

/**
 * "Add a store" section. The location pin is either controlled by the parent
 * (MarketPage picks it on its big map) or, without `onPick`, chosen on the
 * AddressPicker's own map. Either way the address fields follow the pin.
 */
export default function AddStoreForm({ picked: pickedProp, onPick, onCreated, id, style }: {
  picked?: LatLng | null;
  onPick?: (latlng: LatLng | null) => void;
  onCreated?: (store: Store) => void;
  id?: string;
  style?: CSSProperties;
}) {
  const { token, user } = useAuth();
  const dispatch = useAppDispatch();
  const [loadMe] = useLazyMeQuery();
  const { data: tree = [] } = useCategoriesQuery();
  const { data: mine } = useMyStoresQuery(undefined, { skip: !token });
  const [createStore, { isLoading: creating }] = useCreateStoreMutation();

  const ownMap = !onPick;
  const [place, setPlace] = useState<PlaceValue>(EMPTY_PLACE);
  const fillFromPoint = useFillFromPoint();

  // A pin dropped on the parent's map fills in the address (a pin we pushed there ourselves is skipped).
  useEffect(() => {
    const cur = pointOf(place);
    if (ownMap || !pickedProp || (cur && cur[0] === pickedProp[0] && cur[1] === pickedProp[1])) return;
    let live = true;
    fillFromPoint(place, pickedProp).then((v) => live && setPlace(v));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProp]);

  const changePlace = (v: PlaceValue) => {
    setPlace(v);
    const point = pointOf(v);
    if (onPick && point) onPick(point); // e.g. a search result: show it on the parent's map
  };

  const [form, setForm] = useState({ name: '', categoryIds: [] as number[], description: '', coverUrl: '' });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !place.addressLine.trim()) return toast('Điền tên và địa chỉ quán nhé');
    const point = pointOf(place);
    if (!point) return toast(`Ghim vị trí quán trên bản đồ ${ownMap ? 'bên dưới' : 'phía trên'} nhé`);
    const [latitude, longitude] = point;
    try {
      const store = await createStore({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverUrl: form.coverUrl || undefined,
        categoryIds: form.categoryIds.length ? form.categoryIds : undefined,
        location: { addressLine: place.addressLine.trim(), ward: place.ward || undefined, city: place.city || undefined, latitude, longitude },
      }).unwrap();
      toast(user?.role === 'customer' ? 'Đã gửi! Bạn đã trở thành thành viên của xóm.' : 'Đã gửi! Quán sẽ lên chợ khi được duyệt.');
      // The role may have changed (customer -> member), so refresh the stored user.
      loadMe(undefined, false).unwrap().then((u) => dispatch(setUser(u))).catch(() => {});
      setForm((f) => ({ ...f, name: '', description: '', coverUrl: '' }));
      setPlace(EMPTY_PLACE);
      onPick?.(null);
      onCreated?.(store);
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  return (
    <AddStore id={id} style={style}>
      <h2>THÊM QUÁN RUỘT</h2>
      {!token ? (
        <p className="full"><Link to="/login?next=/market">Đăng nhập</Link> để giới thiệu quán ruột của bạn lên chợ.</p>
      ) : (
        <>
          <p className="full" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45, marginBottom: 6 }}>Quán mới sẽ ở trạng thái chờ duyệt cho tới khi quản trị viên xác nhận. Thêm quán đầu tiên là bạn thành <b>thành viên</b> của xóm — xem lại các quán đã thêm ở <Link to="/account?tab=stores">trang cá nhân</Link>. Tìm địa chỉ hoặc bấm vào bản đồ {ownMap ? 'bên dưới' : 'phía trên'} để ghim đúng vị trí quán.</p>
          <FieldLabel>TÊN QUÁN<Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Bún riêu Cô Hai" /></FieldLabel>
          <div className="full"><AddressPicker value={place} onChange={changePlace} map={ownMap} mapHeight="260px" /></div>
          <FieldLabel as="div">LOẠI
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allCategories(tree).map((c) => {
                const on = form.categoryIds.includes(c.id);
                return <CatTag key={c.id} checked={on} onChange={() => set('categoryIds', on ? form.categoryIds.filter((x) => x !== c.id) : [...form.categoryIds, c.id])}>{c.name}</CatTag>;
              })}
            </div>
          </FieldLabel>
          <FieldLabel>VÌ SAO BẠN MÊ QUÁN NÀY?<Input.TextArea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Nước dùng ngọt, cô chủ dễ thương…" /></FieldLabel>
          <FieldLabel as="div">ẢNH QUÁN<ImageUpload value={form.coverUrl} onChange={(v) => set('coverUrl', v ?? '')} alt="Ảnh quán" height={120} /></FieldLabel>
          <GreenButton $size={20} $block onClick={submit} disabled={creating} style={{ alignSelf: 'end', padding: 12 }}>{creating ? 'ĐANG GỬI…' : 'GỬI CHO CẢ XÓM'}</GreenButton>
          {!!mine?.length && (
            <Stack $gap={6} className="full" style={{ borderTop: '2px dashed var(--line)', paddingTop: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>QUÁN CỦA BẠN</span>
              {mine.map(({ store, role }) => (
                <div key={store.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>{store.name} <Muted $size={14}>· {role}</Muted></span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: store.status === 'active' ? 'var(--green-text)' : 'var(--red-text)' }}>{STATUS[store.status] ?? store.status}</span>
                </div>
              ))}
            </Stack>
          )}
        </>
      )}
    </AddStore>
  );
}
