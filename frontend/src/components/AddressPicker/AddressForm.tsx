import { useState } from 'react';
import { Input } from 'antd';
import { toast } from '@/lib/toast';
import { useAuth } from '@/redux';
import { errorMessage, useCreateAddressMutation, useUpdateAddressMutation } from '@/redux/api';
import type { Address } from '@/redux/types';
import { FieldLabel, InkButton, Stack, TextButton } from '@/components/ui';
import AddressPicker, { EMPTY_PLACE, type PlaceValue } from '.';
import { Fields } from './styles';

/** Create (no `address`) or edit a saved delivery address. */
export default function AddressForm({ address, isFirst, onSaved, onCancel }: {
  address?: Address;
  /** The user's first address becomes the default. */
  isFirst?: boolean;
  onSaved?: (a: Address) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const [create, { isLoading: creating }] = useCreateAddressMutation();
  const [update, { isLoading: updating }] = useUpdateAddressMutation();
  const [who, setWho] = useState({
    label: address?.label ?? '',
    // Prefill a new address with the account's own name and phone.
    recipientName: address?.recipientName ?? [user?.profile?.lastName, user?.profile?.firstName].filter(Boolean).join(' '),
    phone: address?.phone ?? user?.profile?.phone ?? '',
  });
  const [place, setPlace] = useState<PlaceValue>(address
    ? { addressLine: address.addressLine, ward: address.ward, city: address.city, latitude: address.latitude, longitude: address.longitude }
    : EMPTY_PLACE);

  const save = async () => {
    if (!who.recipientName.trim() || !who.phone.trim() || !place.addressLine.trim()) return toast('Điền đủ tên, số điện thoại và địa chỉ nhé');
    // null (not undefined) so clearing a field on edit really clears it.
    const body = {
      label: who.label.trim() || null,
      recipientName: who.recipientName.trim(),
      phone: who.phone.trim(),
      addressLine: place.addressLine.trim(),
      ward: place.ward?.trim() || null,
      city: place.city?.trim() || null,
      latitude: place.latitude,
      longitude: place.longitude,
    };
    try {
      const saved = address
        // Saving in the 2-level format drops the pre-reform district.
        ? await update({ id: address.id, ...body, district: null }).unwrap()
        : await create({ ...body, isDefault: isFirst || undefined }).unwrap();
      toast(address ? 'Đã cập nhật địa chỉ' : 'Đã lưu địa chỉ');
      onSaved?.(saved);
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  return (
    <Stack $gap={12}>
      <Fields>
        <FieldLabel>NGƯỜI NHẬN<Input value={who.recipientName} onChange={(e) => setWho({ ...who, recipientName: e.target.value })} autoComplete="name" maxLength={150} /></FieldLabel>
        <FieldLabel>SỐ ĐIỆN THOẠI<Input type="tel" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" maxLength={30} /></FieldLabel>
        <FieldLabel>TÊN GỢI NHỚ<Input value={who.label} onChange={(e) => setWho({ ...who, label: e.target.value })} placeholder="Nhà, Công ty…" maxLength={50} /></FieldLabel>
      </Fields>
      <AddressPicker value={place} onChange={setPlace} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <InkButton $hover="green" onClick={save} disabled={creating || updating} style={{ color: 'var(--gold)', fontSize: 13, padding: '13px 14px' }}>
          {creating || updating ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </InkButton>
        {onCancel && <TextButton $plain onClick={onCancel}>Huỷ</TextButton>}
      </div>
    </Stack>
  );
}
