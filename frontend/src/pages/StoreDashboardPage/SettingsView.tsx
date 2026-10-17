import { useState } from 'react';
import { useNavigate } from 'react-router';
import { App, Button, Form, Input, Select } from 'antd';
import { Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { errorMessage, useCategoriesQuery, useDeleteStoreMutation, useManageStoreQuery, useUpdateStoreMutation } from '@/redux/api';
import type { Category, Store } from '@/redux/types';
import { Spinner } from '@/components/ui';
import ImageUpload from '@/components/ImageUpload';
import AddressPicker, { EMPTY_PLACE, pointOf, type PlaceValue } from '@/components/AddressPicker';
import { PageHead, Panel } from '@/pages/AdminPage/styles';
import type { StoreViewProps } from '.';

interface SettingsValues {
  name: string;
  phone?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  categoryIds: number[];
}

const flatten = (cats: Category[] = [], depth = 0): (Category & { depth: number })[] =>
  cats.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)]);

/** Store details (owner / manager) and, for the owner only, deleting the store. */
export default function SettingsView({ store: summary, role }: StoreViewProps) {
  const { data: store, isLoading } = useManageStoreQuery(summary.id);
  if (isLoading || !store) return <Spinner />;
  // Keyed so switching stores resets the form and the map pin.
  return <SettingsForm key={store.id} store={store} isOwner={role === 'owner'} />;
}

function SettingsForm({ store, isOwner }: { store: Store; isOwner: boolean }) {
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { data: tree } = useCategoriesQuery();
  const [update, { isLoading: saving }] = useUpdateStoreMutation();
  const [remove] = useDeleteStoreMutation();
  const [form] = Form.useForm<SettingsValues>();

  // The API returns locations primary-first.
  const location = store.locations?.[0];
  // The address lives outside the antd form: AddressPicker edits all its fields together.
  const [place, setPlace] = useState<PlaceValue>(location
    ? { addressLine: location.addressLine, ward: location.ward, city: location.city, latitude: location.latitude, longitude: location.longitude }
    : EMPTY_PLACE);

  const submit = async ({ name, phone, description, coverUrl, logoUrl, categoryIds }: SettingsValues) => {
    if (!place.addressLine.trim()) return toast('Nhập địa chỉ quán nhé');
    const point = pointOf(place);
    if (!point) return toast('Ghim vị trí quán trên bản đồ nhé');
    const [latitude, longitude] = point;
    try {
      await update({
        id: store.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        description: description?.trim() || null,
        coverUrl: coverUrl ?? null,
        logoUrl: logoUrl ?? null,
        categoryIds,
        locationId: location?.id,
        // Saving in the 2-level format drops the pre-reform district.
        location: { addressLine: place.addressLine.trim(), ward: place.ward, district: null, city: place.city, latitude, longitude },
      }).unwrap();
      toast('Đã lưu thông tin quán');
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const confirmDelete = () => modal.confirm({
    title: `Xoá quán "${store.name}"?`,
    content: 'Quán và toàn bộ món sẽ biến mất khỏi chợ và khỏi giỏ hàng của khách. Lịch sử đơn hàng vẫn được giữ lại. Không xoá được khi quán còn đơn đang xử lý.',
    okText: 'Xoá quán', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(store.id).unwrap()
      .then(() => { toast('Đã xoá quán'); navigate('/my-store', { replace: true }); })
      .catch((e: { status?: number }) => toast(e?.status === 409
        ? 'Quán còn đơn đang xử lý. Hoàn tất hoặc huỷ các đơn đó rồi thử lại nhé.'
        : errorMessage(e))),
  });

  return (
    <>
      <PageHead>
        <div>
          <h1>THÔNG TIN QUÁN</h1>
          <p>Tên, ảnh, loại món và địa chỉ khách thấy trên chợ</p>
        </div>
      </PageHead>

      <Panel $pad={20}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          initialValues={{
            name: store.name,
            phone: store.phone,
            description: store.description,
            coverUrl: store.coverUrl,
            logoUrl: store.logoUrl,
            categoryIds: store.categories?.map((c) => c.id) ?? [],
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 16px' }}>
            <Form.Item name="name" label="Tên quán" rules={[{ required: true, whitespace: true, message: 'Nhập tên quán' }, { max: 255 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ max: 30 }]}>
              <Input inputMode="tel" placeholder="090…" />
            </Form.Item>
          </div>
          <Form.Item name="categoryIds" label="Loại món">
            <Select
              mode="multiple"
              optionFilterProp="label"
              placeholder="Chọn loại món"
              options={flatten(tree).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Giới thiệu">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
            <Form.Item name="coverUrl" label="Ảnh bìa"><ImageUpload alt="Ảnh bìa" height={140} /></Form.Item>
            <Form.Item name="logoUrl" label="Logo"><ImageUpload alt="Logo" height={140} /></Form.Item>
          </div>
          <Form.Item label="Địa chỉ quán">
            {location?.district && <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 13 }}>Địa chỉ đang theo đơn vị hành chính cũ ({location.district}). Lưu lại để chuyển sang phường, tỉnh mới.</p>}
            <AddressPicker value={place} onChange={setPlace} mapHeight="260px" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Lưu thay đổi</Button>
        </Form>
      </Panel>

      {isOwner && (
        <Panel $pad={20} style={{ borderColor: 'var(--red)' }}>
          <h3 style={{ margin: '0 0 6px', color: 'var(--red-text)' }}>Xoá quán</h3>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
            Quán và món ăn sẽ bị gỡ khỏi chợ. Lịch sử đơn hàng và doanh thu vẫn được giữ. Chỉ chủ quán mới xoá được.
          </p>
          <Button danger icon={<Trash2 size={16} />} onClick={confirmDelete}>Xoá quán này</Button>
        </Panel>
      )}
    </>
  );
}
