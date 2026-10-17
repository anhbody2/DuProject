import { useState } from 'react';
import { Link } from 'react-router';
import { App, Button, Input, InputNumber, Select, Table, Tag, Tooltip } from 'antd';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { fmt, imageOf } from '@/lib/format';
import { errorMessage, useDeleteStoreProductMutation, useStoreProductsQuery, useUpdateStoreProductMutation } from '@/redux/api';
import type { AdminProduct, Product } from '@/redux/types';
import { Photo } from '@/components/ui';
import { PRODUCT_STATUS, optionsOf } from '@/pages/AdminPage/labels';
import { Cell, Muted, PageHead, Panel, Thumb, Toolbar } from '@/pages/AdminPage/styles';
import { PAGE_SIZE, useListParams } from '@/pages/AdminPage/useListParams';
import ProductFormModal from './ProductFormModal';
import type { StoreViewProps } from '.';

export default function ProductsView({ store, canManage }: StoreViewProps) {
  const { modal } = App.useApp();
  const list = useListParams(['status'] as const);
  const { data, isFetching } = useStoreProductsQuery({
    storeId: store.id,
    page: list.page,
    limit: PAGE_SIZE,
    q: list.q || undefined,
    status: list.filters.status as Product['status'] | undefined,
  });
  const [update] = useUpdateStoreProductMutation();
  const [remove] = useDeleteStoreProductMutation();
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);

  const save = (p: AdminProduct, patch: Partial<Pick<Product, 'status' | 'stock'>>) =>
    update({ id: p.id, ...patch }).unwrap()
      .then(() => toast(`Đã cập nhật "${p.name}"`))
      .catch((e) => toast(errorMessage(e)));

  const confirmDelete = (p: AdminProduct) => modal.confirm({
    title: `Xoá món "${p.name}"?`,
    content: 'Món sẽ biến mất khỏi thực đơn và mọi giỏ hàng. Các đơn cũ vẫn giữ tên và giá đã lưu. Muốn tạm ngừng bán thì chọn "Ẩn".',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(p.id).unwrap().then(() => toast('Đã xoá món')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <>
      <PageHead>
        <div>
          <h1>MÓN ĂN</h1>
          <p>{data?.meta.total ?? '…'} món · {canManage ? 'thêm, sửa, xoá món, chỉnh tồn kho, ẩn hoặc mở bán lại' : 'chỉ chủ quán và quản lý được chỉnh sửa'}</p>
        </div>
        {canManage && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>Thêm món</Button>}
      </PageHead>

      <Panel>
        <Toolbar>
          <Input className="grow" allowClear prefix={<Search size={16} />} placeholder="Tìm theo tên món" value={list.text} onChange={(e) => list.setText(e.target.value)} />
          <Select allowClear placeholder="Trạng thái" style={{ width: 150 }} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={optionsOf(PRODUCT_STATUS)} />
        </Toolbar>

        <Table<AdminProduct>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 760 }}
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
              render: (_, p) => canManage ? (
                <InputNumber
                  size="small" min={0} style={{ width: 90 }} defaultValue={p.stock} key={`${p.id}-${p.stock}`}
                  onBlur={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 0 && v !== p.stock) save(p, { stock: v }); }}
                  onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                />
              ) : p.stock,
            },
            {
              title: 'Trạng thái',
              width: 150,
              render: (_, p) => canManage
                ? <Select size="small" style={{ width: 130 }} value={p.status} onChange={(status) => save(p, { status })} options={optionsOf(PRODUCT_STATUS)} />
                : <Tag color={PRODUCT_STATUS[p.status].color}>{PRODUCT_STATUS[p.status].label}</Tag>,
            },
            {
              title: '',
              width: 132,
              render: (_, p) => (
                <div style={{ display: 'flex' }}>
                  {p.status !== 'inactive' && store.status === 'active' && (
                    <Tooltip title="Xem trên cửa hàng">
                      <Link to={`/product/${p.id}`}><Button type="text" icon={<ExternalLink size={16} />} aria-label={`Xem ${p.name}`} /></Link>
                    </Tooltip>
                  )}
                  {canManage && (
                    <Tooltip title="Sửa món">
                      <Button type="text" icon={<Pencil size={16} />} onClick={() => setEditing(p)} aria-label={`Sửa ${p.name}`} />
                    </Tooltip>
                  )}
                  {canManage && (
                    <Tooltip title="Xoá món">
                      <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(p)} aria-label={`Xoá ${p.name}`} />
                    </Tooltip>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>

      {canManage && <ProductFormModal store={store} product={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
