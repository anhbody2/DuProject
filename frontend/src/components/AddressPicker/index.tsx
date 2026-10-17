import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AutoComplete, Input, Select } from 'antd';
import { LocateFixed } from 'lucide-react';
import { toast } from '@/lib/toast';
import { DEFAULT_CENTER } from '@/lib/format';
import { useDebounced } from '@/hooks/useDebounced';
import { errorMessage, useGeoAutocompleteQuery, useGeoConfigQuery, useLazyGeoPlaceQuery, useLazyGeoReverseQuery } from '@/redux/api';
import { FieldLabel, Muted, Spinner, TextButton } from '@/components/ui';
import { filterName, matchName, useProvinces, type Province } from './adminUnits';
import { Fields, PickMap } from './styles';

// Leaflet is heavy, so the map is split into its own chunk.
const StoreMap = lazy(() => import('@/components/StoreMap'));

export type LatLng = [number, number];

/** The location part of an Address / StoreLocation, in Vietnam's 2-level scheme (ward -> province). */
export interface PlaceValue {
  addressLine: string;
  ward: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const EMPTY_PLACE: PlaceValue = { addressLine: '', ward: null, city: null, latitude: null, longitude: null };

export const pointOf = (v: PlaceValue): LatLng | null =>
  v.latitude != null && v.longitude != null ? [Number(v.latitude), Number(v.longitude)] : null;

/** Snaps VietMap's spelling of the ward / province onto the dropdown entries; unknown names are kept. */
function canonical(v: PlaceValue, provinces: Province[] | null): PlaceValue {
  if (!provinces) return v;
  const province = provinces.find((p) => p.name === matchName(provinces.map((x) => x.name), v.city));
  if (!province) return v;
  return { ...v, city: province.name, ward: matchName(province.wards, v.ward) ?? v.ward };
}

/** Options for a dropdown, plus the current value if it isn't in the list (e.g. a pre-2025 ward). */
const optionsOf = (names: string[], current: string | null) =>
  [...(current && !names.includes(current) ? [current] : []), ...names].map((n) => ({ value: n, label: n }));

/**
 * Moves `v` to a map point and, when VietMap is configured, fills the street,
 * ward and province from reverse geocoding. Lookup failures keep the typed text.
 */
export function useFillFromPoint() {
  const { data: cfg } = useGeoConfigQuery();
  const [reverse] = useLazyGeoReverseQuery();
  return useCallback(async (v: PlaceValue, [lat, lng]: LatLng): Promise<PlaceValue> => {
    const moved = { ...v, latitude: lat, longitude: lng };
    if (!cfg?.geocoding) return moved;
    try {
      const p = await reverse({ lat, lng }, true).unwrap();
      return { ...moved, addressLine: p.addressLine || v.addressLine, ward: p.ward ?? v.ward, city: p.city ?? v.city };
    } catch {
      return moved;
    }
  }, [cfg?.geocoding, reverse]);
}

/**
 * Street (free text, doubling as VietMap search) + province and ward dropdowns,
 * and optionally a map to drop the pin on. Picking a suggestion or a map point
 * fills all three. Without VietMap the street is plain text and the map only pins.
 */
export default function AddressPicker({ value, onChange, map = true, mapHeight = '240px' }: {
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  /** false when the parent already shows a map and feeds its pin through `value`. */
  map?: boolean;
  mapHeight?: string;
}) {
  const { data: cfg } = useGeoConfigQuery();
  const provinces = useProvinces();
  // Suggestions only while the user is typing the street, not after one was picked.
  const [typing, setTyping] = useState(false);
  const query = useDebounced(typing ? value.addressLine.trim() : '', 300);
  const focus = pointOf(value) ?? DEFAULT_CENTER;
  const { currentData: hits = [], isFetching } = useGeoAutocompleteQuery(
    // The chosen province narrows the search to the right city.
    { text: [query, value.ward, value.city].filter(Boolean).join(', '), lat: focus[0], lng: focus[1] },
    { skip: !cfg?.geocoding || query.length < 2 },
  );
  const province = provinces?.find((p) => p.name === value.city);

  // Saved addresses may spell the province differently (older ones say "Hồ Chí Minh"): snap once the list loads.
  useEffect(() => {
    if (!provinces || !value.city || province) return;
    const snapped = canonical(value, provinces);
    if (snapped.city !== value.city) onChange(snapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces, value.city]);
  const [loadPlace] = useLazyGeoPlaceQuery();
  const fillFromPoint = useFillFromPoint();
  const [locating, setLocating] = useState(false);

  const typeStreet = (text: string) => {
    // AutoComplete reports the picked option's value (a refId) as input; `choose` handles that.
    if (hits.some((h) => h.refId === text)) return;
    setTyping(true);
    onChange({ ...value, addressLine: text });
  };
  // A ward only makes sense inside its province.
  const setProvince = (city: string | null) => {
    const wards = provinces?.find((p) => p.name === city)?.wards ?? [];
    onChange({ ...value, city, ward: value.ward && wards.includes(value.ward) ? value.ward : null });
  };

  const choose = async (refId: string) => {
    try {
      const p = await loadPlace(refId, true).unwrap();
      setTyping(false);
      onChange(canonical({ addressLine: p.addressLine, ward: p.ward, city: p.city, latitude: p.latitude, longitude: p.longitude }, provinces));
    } catch (e) {
      toast(errorMessage(e, 'Không tìm được địa chỉ này'));
    }
  };

  const pick = async (point: LatLng) => onChange(canonical(await fillFromPoint(value, point), provinces));

  const locate = () => {
    if (!navigator.geolocation) return toast('Trình duyệt không hỗ trợ định vị');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => pick([p.coords.latitude, p.coords.longitude]).finally(() => setLocating(false)),
      () => { setLocating(false); toast('Không lấy được vị trí của bạn'); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <Fields>
      <FieldLabel as="div" $wide>SỐ NHÀ, TÊN ĐƯỜNG
        <AutoComplete
          value={value.addressLine}
          onChange={typeStreet}
          onSelect={(refId: string) => choose(refId)}
          onBlur={() => setTyping(false)}
          options={cfg?.geocoding ? hits.map((h) => ({ value: h.refId, label: <><b>{h.name}</b><br /><Muted $size={12}>{h.address}</Muted></> })) : []}
          notFoundContent={cfg?.geocoding && query.length >= 2 ? (isFetching ? <Spinner label="Đang tìm…" /> : 'Không thấy địa chỉ nào') : null}
          filterOption={false}
        >
          <Input placeholder={cfg?.geocoding ? 'Số nhà, tên đường — gõ để tìm' : 'Số nhà, tên đường'} autoComplete="street-address" aria-label="Số nhà, tên đường" />
        </AutoComplete>
      </FieldLabel>
      <FieldLabel as="div">TỈNH / THÀNH PHỐ
        <Select
          showSearch={{ filterOption: filterName }}
          allowClear
          value={value.city ?? undefined}
          onChange={(v?: string) => setProvince(v ?? null)}
          options={optionsOf(provinces?.map((p) => p.name) ?? [], value.city)}
          loading={!provinces}
          placeholder="Chọn tỉnh / thành phố"
          aria-label="Tỉnh / thành phố"
        />
      </FieldLabel>
      <FieldLabel as="div">PHƯỜNG / XÃ
        <Select
          showSearch={{ filterOption: filterName }}
          allowClear
          value={value.ward ?? undefined}
          onChange={(v?: string) => onChange({ ...value, ward: v ?? null })}
          options={optionsOf(province?.wards ?? [], value.ward)}
          disabled={!province}
          placeholder={province ? 'Chọn phường / xã' : 'Chọn tỉnh trước'}
          aria-label="Phường / xã"
        />
      </FieldLabel>
      {map && (
        <PickMap className="du-map">
          <Suspense fallback={<Spinner label="Đang mở bản đồ…" />}>
            <StoreMap stores={[]} picked={pointOf(value)} onPick={pick} height={mapHeight} />
          </Suspense>
        </PickMap>
      )}
      <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px' }}>
        <TextButton $plain onClick={locate} disabled={locating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LocateFixed size={15} />{locating ? 'Đang định vị…' : 'Dùng vị trí hiện tại'}
        </TextButton>
        <Muted $size={12}>{pointOf(value) ? 'Đã ghim vị trí — bấm bản đồ để chỉnh.' : 'Bấm vào bản đồ để ghim chính xác chỗ giao.'}</Muted>
      </div>
    </Fields>
  );
}
