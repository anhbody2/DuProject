import { useState } from 'react';
import { App } from 'antd';
import { toast } from '@/lib/toast';
import { addressText } from '@/lib/format';
import { errorMessage, useAddressesQuery, useDeleteAddressMutation, useSetDefaultAddressMutation } from '@/redux/api';
import type { Address } from '@/redux/types';
import AddressForm from '@/components/AddressPicker/AddressForm';
import { Card, CardTitle, Empty, Grid3, Muted, Spinner, Stack, TextButton } from '@/components/ui';
import { Pill } from './styles';

/** Saved delivery addresses: add, edit, delete, pick the default. */
export default function AddressBook() {
  const { modal } = App.useApp();
  const { data: addresses = [], isLoading } = useAddressesQuery();
  const [remove] = useDeleteAddressMutation();
  const [setDefault, { isLoading: defaulting }] = useSetDefaultAddressMutation();
  // 'new', an address id being edited, or null.
  const [editing, setEditing] = useState<'new' | number | null>(null);

  if (isLoading) return <Spinner />;

  const confirmDelete = (a: Address) => modal.confirm({
    title: 'Xoá địa chỉ này?',
    // Orders keep their own copy of the address, so deleting never affects them.
    content: 'Các đơn đã đặt vẫn giữ nguyên địa chỉ giao.',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(a.id).unwrap().then(() => toast('Đã xoá địa chỉ')).catch((e) => toast(errorMessage(e))),
  });
  const makeDefault = (a: Address) => setDefault(a.id).unwrap().then(() => toast('Đã đặt làm mặc định')).catch((e) => toast(errorMessage(e)));

  return (
    <Stack $gap={20}>
      {editing === 'new' ? (
        <Card>
          <CardTitle>ĐỊA CHỈ MỚI</CardTitle>
          <AddressForm isFirst={!addresses.length} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        </Card>
      ) : (
        <TextButton onClick={() => setEditing('new')} style={{ alignSelf: 'flex-start' }}>+ Thêm địa chỉ mới</TextButton>
      )}
      {!addresses.length ? (
        editing !== 'new' && <Empty title="Chưa có địa chỉ nào" hint="Lưu sẵn địa chỉ để đặt món nhanh hơn." />
      ) : (
        <Grid3>
          {addresses.map((a) => editing === a.id ? (
            <Card key={a.id} style={{ gridColumn: '1 / -1' }}>
              <CardTitle>SỬA ĐỊA CHỈ</CardTitle>
              <AddressForm address={a} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
            </Card>
          ) : (
            <Card key={a.id} $gap={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>{a.label || a.recipientName}</span>
                {a.isDefault && <Pill $variant="gold">Mặc định</Pill>}
              </div>
              <span style={{ fontSize: 14 }}>{a.recipientName} · {a.phone}</span>
              <Muted $size={14}>{addressText(a)}</Muted>
              {a.district && <Muted>Địa chỉ theo đơn vị hành chính cũ — sửa để cập nhật phường, tỉnh mới.</Muted>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 4 }}>
                <TextButton $plain onClick={() => setEditing(a.id)}>Sửa</TextButton>
                {!a.isDefault && <TextButton $plain onClick={() => makeDefault(a)} disabled={defaulting}>Đặt mặc định</TextButton>}
                <TextButton $plain onClick={() => confirmDelete(a)} style={{ color: 'var(--red-text)' }}>Xoá</TextButton>
              </div>
            </Card>
          ))}
        </Grid3>
      )}
    </Stack>
  );
}
