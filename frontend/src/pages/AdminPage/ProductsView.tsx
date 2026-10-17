import { App, Button, Input, InputNumber, Select, Table, Tag, Tooltip } from 'antd';
import { Search, Trash2, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { fmt, imageOf } from '@/lib/format';
import {
  errorMessage,
  useAdminProductsQuery,
  useAdminStoresQuery,
  useCategoriesQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
  type AdminProductsQuery,
} from '@/redux/api';
import type { AdminProduct, Category, Product } from '@/redux/types';
import { Photo } from '@/components/ui';
import { PRODUCT_STATUS, STORE_STATUS, optionsOf } from './labels';
import { Cell, Muted, PageHead, Panel, Thumb, Toolbar } from './styles';
import { PAGE_SIZE, useListParams } from './useListParams';

const flatten = (cats: Category[] = [], depth = 0): { value: string; label: string }[] =>
  cats.flatMap((c) => [{ value: String(c.id), label: `${'— '.repeat(depth)}${c.name}` }, ...flatten(c.children, depth + 1)]);

export default function ProductsView() {
  const { modal } = App.useApp();
  const list = useListParams(['status', 'storeId', 'categoryId'] as const);
  const { data, isFetching } = useAdminProductsQuery({
    ...list.query,
    storeId: list.filters.storeId ? Number(list.filters.storeId) : undefined,
    categoryId: list.filters.categoryId ? Number(list.filters.categoryId) : undefined,
  } as AdminProductsQuery);
  const { data: stores } = useAdminStoresQuery({ limit: 100 });
  const { data: categories } = useCategoriesQuery();
  const [update] = useUpdateProductMutation();
  const [remove] = useDeleteProductMutation();

  const save = (p: AdminProduct, patch: Partial<Pick<Product, 'status' | 'stock'>>) =>
    update({ id: p.id, ...patch }).unwrap()
      .then(() => toast(`Đã cập nhật "${p.name}"`))
      .catch((e) => toast(errorMessage(e)));

  const confirmDelete = (p: AdminProduct) => modal.confirm({
    title: `Xoá món "${p.name}"?`,
    content: 'Món sẽ bị gỡ khỏi mọi giỏ hàng. Các đơn cũ vẫn giữ tên và giá đã lưu.',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(p.id).unwrap().then(() => toast('Đã xoá món')).catch((e) => toast(errorMessage(e))),
  });

  const storeFilter = list.filters.storeId;
  const storeName = stores?.items.find((s) => String(s.id) === storeFilter)?.name;

  return (
    <>
      <PageHead>
        <div>
          <h1>SẢN PHẨM</h1>
          <p>{data?.meta.total ?? '…'} món{storeName && ` của ${storeName}`} · ẩn món vi phạm, chỉnh tồn kho</p>
        </div>
      </PageHead>

      <Panel>
        <Toolbar>
          <Input className="grow" allowClear prefix={<Search size={16} />} placeholder="Tìm theo tên món" value={list.text} onChange={(e) => list.setText(e.target.value)} />
          <Select
            allowClear showSearch optionFilterProp="label" placeholder="Cửa hàng" style={{ width: 200 }}
            value={storeFilter} onChange={(v) => list.setFilter('storeId', v)}
            options={stores?.items.map((s) => ({ value: String(s.id), label: s.name })) ?? []}
          />
          <Select
            allowClear showSearch optionFilterProp="label" placeholder="Danh mục" style={{ width: 180 }}
            value={list.filters.categoryId} onChange={(v) => list.setFilter('categoryId', v)}
            options={flatten(categories)}
          />
          <Select allowClear placeholder="Trạng thái" style={{ width: 150 }} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={optionsOf(PRODUCT_STATUS)} />
          {storeFilter && <Button icon={<X size={14} />} onClick={() => list.setFilter('storeId', undefined)}>Bỏ lọc quán</Button>}
        </Toolbar>

        <Table<AdminProduct>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 980 }}
          pagination={{ current: list.page, pageSize: PAGE_SIZE, total: data?.meta.total ?? 0, onChange: list.setPage, showSizeChanger: false }}
          columns={[
            {
              title: 'Món',
              render: (_, p) => (
                <Cell>
                  <Thumb><Photo src={imageOf(p)} alt={p.name} /></Thumb>
                  <div style={{ minWidth: 0 }}>
                    <b>{p.name}</b>
                    <Muted>{p.category?.name ?? '—'}</Muted>
                  </div>
                </Cell>
              ),
            },
            {
              title: 'Cửa hàng',
              width: 190,
              render: (_, p) => p.store && (
                <div>
                  <b style={{ fontWeight: 700 }}>{p.store.name}</b>
                  {p.store.status !== 'active' && <> <Tag color={STORE_STATUS[p.store.status].color}>{STORE_STATUS[p.store.status].label}</Tag></>}
                </div>
              ),
            },
            {
              title: 'Giá',
              width: 130,
              align: 'right',
              render: (_, p) => p.salePrice != null
                ? <div><b>{fmt(p.salePrice)}</b><br /><Muted style={{ textDecoration: 'line-through' }}>{fmt(p.price)}</Muted></div>
                : <b>{fmt(p.price)}</b>,
            },
            {
              title: 'Tồn kho',
              width: 120,
              render: (_, p) => (
                <InputNumber
                  size="small" min={0} style={{ width: 90 }} defaultValue={p.stock} key={`${p.id}-${p.stock}`}
                  onBlur={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 0 && v !== p.stock) save(p, { stock: v }); }}
                  onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                />
              ),
            },
            {
              title: 'Trạng thái',
              width: 150,
              render: (_, p) => <Select size="small" style={{ width: 130 }} value={p.status} onChange={(status) => save(p, { status })} options={optionsOf(PRODUCT_STATUS)} />,
            },
            {
              title: '',
              width: 56,
              render: (_, p) => (
                <Tooltip title="Xoá món">
                  <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(p)} aria-label={`Xoá ${p.name}`} />
                </Tooltip>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
