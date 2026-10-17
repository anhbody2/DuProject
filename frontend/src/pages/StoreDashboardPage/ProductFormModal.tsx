import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { toast } from '@/lib/toast';
import { errorMessage, useCategoriesQuery, useCreateStoreProductMutation, useEditStoreProductMutation } from '@/redux/api';
import type { AdminProduct, Category, Store } from '@/redux/types';
import ImageUpload from '@/components/ImageUpload';

interface ProductValues {
  name: string;
  categoryId: number;
  price: number;
  salePrice?: number | null;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
}

const flatten = (cats: Category[] = [], depth = 0): (Category & { depth: number })[] =>
  cats.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)]);

const money = { min: 0, step: 1000, style: { width: '100%' }, addonAfter: 'đ' } as const;

/**
 * Add or edit a dish. `product` is 'new' to add, a product to edit, null when closed.
 * New dishes get the default S/M size options from the API.
 */
export default function ProductFormModal({ store, product, onClose }: {
  store: Store;
  product: AdminProduct | 'new' | null;
  onClose: () => void;
}) {
  const { data: tree } = useCategoriesQuery();
  const [create, { isLoading: creating }] = useCreateStoreProductMutation();
  const [edit, { isLoading: saving }] = useEditStoreProductMutation();
  const [form] = Form.useForm<ProductValues>();
  const editing = product && product !== 'new' ? product : null;
  // The API returns images primary-first.
  const photo = editing?.images?.[0];

  const submit = async ({ imageUrl, description, salePrice, ...v }: ProductValues) => {
    const name = v.name.trim();
    try {
      if (editing) {
        await edit({
          ...v,
          id: editing.id,
          name,
          description: description?.trim() || null,
          salePrice: salePrice ?? null,
          image: { current: photo, next: imageUrl ?? null },
        }).unwrap();
        toast(`Đã lưu "${name}"`);
      } else {
        await create({
          ...v,
          storeId: store.id,
          name,
          description: description?.trim() || undefined,
          salePrice: salePrice ?? undefined,
          status: v.stock > 0 ? 'active' : 'out_of_stock',
          images: imageUrl ? [{ imageUrl, isPrimary: true }] : undefined,
        }).unwrap();
        toast(`Đã thêm "${name}"`);
      }
      onClose();
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const initialValues: Partial<ProductValues> = editing
    ? {
      name: editing.name,
      categoryId: editing.categoryId,
      price: editing.price,
      salePrice: editing.salePrice,
      stock: editing.stock,
      description: editing.description,
      imageUrl: photo?.imageUrl ?? null,
    }
    : { stock: 50 };

  return (
    <Modal
      open={product !== null}
      title={editing ? `Sửa món "${editing.name}"` : `Thêm món cho ${store.name}`}
      okText={editing ? 'Lưu' : 'Thêm món'} cancelText="Huỷ"
      confirmLoading={creating || saving}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} initialValues={initialValues} preserve={false}>
        <Form.Item name="name" label="Tên món" rules={[{ required: true, whitespace: true, message: 'Nhập tên món' }, { max: 255 }]}>
          <Input autoFocus placeholder="Bún riêu cua" />
        </Form.Item>
        <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn danh mục"
            options={flatten(tree).map((c) => ({ value: c.id, label: `${'— '.repeat(c.depth)}${c.name}` }))}
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0 12px' }}>
          <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}>
            <InputNumber {...money} placeholder="45000" />
          </Form.Item>
          <Form.Item
            name="salePrice"
            label="Giá khuyến mãi"
            dependencies={['price']}
            rules={[({ getFieldValue }) => ({
              validator: (_, v) => v == null || getFieldValue('price') == null || v <= getFieldValue('price')
                ? Promise.resolve()
                : Promise.reject(new Error('Không được cao hơn giá gốc')),
            })]}
          >
            <InputNumber {...money} placeholder="(không có)" />
          </Form.Item>
          <Form.Item name="stock" label="Tồn kho" rules={[{ required: true, message: 'Nhập tồn kho' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item name="imageUrl" label="Ảnh món">
          <ImageUpload alt="Ảnh món" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Nước dùng cua đồng, ăn kèm rau sống…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
