import { Link } from 'react-router';
import { App, Button, Input, Segmented, Select, Space, Table, Tag, Tooltip } from 'antd';
import { Check, Package, Search, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { addressText, dateVN, primaryLocation } from '@/lib/format';
import { errorMessage, useAdminStoresQuery, useDeleteStoreMutation, useUpdateStoreStatusMutation, type AdminStoresQuery } from '@/redux/api';
import type { AdminStore, Store } from '@/redux/types';
import { Photo } from '@/components/ui';
import { STORE_STATUS, optionsOf } from './labels';
import { Cell, Muted, PageHead, Panel, Thumb, Toolbar } from './styles';
import { PAGE_SIZE, useListParams } from './useListParams';

type Status = Store['status'];

export default function StoresView() {
  const { modal } = App.useApp();
  const list = useListParams(['status'] as const);
  const { data, isFetching } = useAdminStoresQuery(list.query as AdminStoresQuery);
  const [setStatus] = useUpdateStoreStatusMutation();
  const [remove] = useDeleteStoreMutation();

  const changeStatus = (s: AdminStore, status: Status) =>
    setStatus({ id: s.id, status }).unwrap()
      .then(() => toast(`${s.name}: ${STORE_STATUS[status].label}`))
      .catch((e) => toast(errorMessage(e)));

  const confirmDelete = (s: AdminStore) => modal.confirm({
    title: `Xoá cửa hàng "${s.name}"?`,
    content: 'Quán và toàn bộ món bị gỡ khỏi chợ (xoá mềm, lịch sử đơn hàng vẫn giữ). Quán còn đơn đang xử lý thì không xoá được.',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(s.id).unwrap().then(() => toast('Đã xoá cửa hàng')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <>
      <PageHead>
        <div>
          <h1>CỬA HÀNG</h1>
          <p>{data?.meta.total ?? '…'} quán · duyệt quán mới, tạm ngưng hoặc đình chỉ</p>
        </div>
      </PageHead>

      <Panel>
        <Toolbar>
          <Input className="grow" allowClear prefix={<Search size={16} />} placeholder="Tìm theo tên quán" value={list.text} onChange={(e) => list.setText(e.target.value)} />
          <Segmented<string>
            value={list.filters.status ?? ''}
            onChange={(v) => list.setFilter('status', v || undefined)}
            options={[{ value: '', label: 'Tất cả' }, ...optionsOf(STORE_STATUS)]}
          />
        </Toolbar>

        <Table<AdminStore>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 1000 }}
          pagination={{ current: list.page, pageSize: PAGE_SIZE, total: data?.meta.total ?? 0, onChange: list.setPage, showSizeChanger: false }}
          columns={[
            {
              title: 'Cửa hàng',
              render: (_, s) => (
                <Cell>
                  <Thumb><Photo src={s.logoUrl ?? s.coverUrl} alt={s.name} /></Thumb>
                  <div style={{ minWidth: 0 }}>
                    <b>{s.name}</b>
                    <Muted>{(primaryLocation(s) ? addressText(primaryLocation(s)!) : '') || `/${s.slug}`}</Muted>
                  </div>
                </Cell>
              ),
            },
            { title: 'Chủ quán', width: 170, render: (_, s) => s.owner ? <div><b>{s.owner.username}</b><br /><Muted>{s.owner.email}</Muted></div> : <Muted>—</Muted> },
            { title: 'Danh mục', width: 180, render: (_, s) => s.categories?.length ? s.categories.map((c) => <Tag key={c.id}>{c.name}</Tag>) : <Muted>—</Muted> },
            { title: 'Món', dataIndex: 'productCount', width: 70, align: 'right' },
            { title: 'Đơn', dataIndex: 'orderCount', width: 70, align: 'right' },
            { title: 'Tạo lúc', dataIndex: 'createdAt', width: 140, render: (d: string) => <Muted>{dateVN(d)}</Muted> },
            {
              title: 'Trạng thái',
              width: 150,
              render: (_, s) => <Select size="small" style={{ width: 130 }} value={s.status} onChange={(v) => changeStatus(s, v)} options={optionsOf(STORE_STATUS)} />,
            },
            {
              title: '',
              width: 130,
              render: (_, s) => (
                <Space size={2}>
                  {s.status === 'pending' && (
                    <Tooltip title="Duyệt quán">
                      <Button type="text" icon={<Check size={16} />} style={{ color: 'var(--green-text)' }} onClick={() => changeStatus(s, 'active')} aria-label={`Duyệt ${s.name}`} />
                    </Tooltip>
                  )}
                  <Tooltip title="Xem món của quán">
                    <Link to={`/admin/products?storeId=${s.id}`}><Button type="text" icon={<Package size={16} />} aria-label={`Món của ${s.name}`} /></Link>
                  </Tooltip>
                  <Tooltip title="Xoá cửa hàng">
                    <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(s)} aria-label={`Xoá ${s.name}`} />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
