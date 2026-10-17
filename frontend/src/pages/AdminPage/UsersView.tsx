import { App, Button, Input, Select, Table, Tag, Tooltip } from 'antd';
import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { useStartChat } from '@/hooks/useStartChat';
import { toast } from '@/lib/toast';
import { dateVN, displayName } from '@/lib/format';
import { useAuth } from '@/redux';
import { errorMessage, useAdminUsersQuery, useDeleteUserMutation, useUpdateUserMutation, type AdminUsersQuery } from '@/redux/api';
import type { Role, User, UserStatus } from '@/redux/types';
import { ROLE, USER_STATUS, optionsOf } from './labels';
import { Cell, Muted, PageHead, Panel, Toolbar } from './styles';
import { PAGE_SIZE, useListParams } from './useListParams';

export default function UsersView() {
  const { modal } = App.useApp();
  const { user: me } = useAuth();
  const list = useListParams(['role', 'status'] as const);
  const { data, isFetching } = useAdminUsersQuery(list.query as AdminUsersQuery);
  const [update] = useUpdateUserMutation();
  const [remove] = useDeleteUserMutation();
  const chat = useStartChat();

  const save = (u: User, patch: { role?: Role; status?: UserStatus }) =>
    update({ id: u.id, ...patch }).unwrap()
      .then(() => toast(`Đã cập nhật ${u.username}`))
      .catch((e) => toast(errorMessage(e)));

  const confirmDelete = (u: User) => modal.confirm({
    title: `Xoá tài khoản ${u.username}?`,
    content: 'Không thể xoá tài khoản còn sở hữu cửa hàng hoặc có đơn hàng — hãy khoá tài khoản thay vào đó.',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(u.id).unwrap().then(() => toast('Đã xoá tài khoản')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <>
      <PageHead>
        <div>
          <h1>NGƯỜI DÙNG</h1>
          <p>{data?.meta.total ?? '…'} tài khoản · đổi vai trò, khoá hoặc mở khoá</p>
        </div>
      </PageHead>

      <Panel>
        <Toolbar>
          <Input className="grow" allowClear prefix={<Search size={16} />} placeholder="Tìm theo tên đăng nhập hoặc email" value={list.text} onChange={(e) => list.setText(e.target.value)} />
          <Select allowClear placeholder="Vai trò" style={{ width: 160 }} value={list.filters.role} onChange={(v) => list.setFilter('role', v)} options={optionsOf(ROLE)} />
          <Select allowClear placeholder="Trạng thái" style={{ width: 160 }} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={optionsOf(USER_STATUS)} />
        </Toolbar>

        <Table<User>
          rowKey="id"
          loading={isFetching}
          dataSource={data?.items ?? []}
          scroll={{ x: 860 }}
          pagination={{ current: list.page, pageSize: PAGE_SIZE, total: data?.meta.total ?? 0, onChange: list.setPage, showSizeChanger: false }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            {
              title: 'Tài khoản',
              render: (_, u) => (
                <Cell>
                  <div style={{ minWidth: 0 }}>
                    <b>{displayName(u)}</b>
                    <Muted>@{u.username} · {u.email}</Muted>
                  </div>
                </Cell>
              ),
            },
            { title: 'SĐT', render: (_, u) => u.profile?.phone ?? <Muted>—</Muted>, width: 130 },
            {
              title: 'Vai trò',
              width: 170,
              // Customer / member / store owner are switchable here; admin accounts show as a tag.
              render: (_, u) => u.role === 'admin'
                ? <Tag color={ROLE.admin.color}>{ROLE.admin.label}{u.id === me?.id && ' (bạn)'}</Tag>
                : <Select size="small" style={{ width: 150 }} value={u.role} onChange={(role) => save(u, { role })} options={optionsOf(ROLE, ['customer', 'member', 'store_owner'])} />,
            },
            {
              title: 'Trạng thái',
              width: 160,
              render: (_, u) => u.id === me?.id
                ? <Tag color={USER_STATUS[u.status as UserStatus]?.color}>{USER_STATUS[u.status as UserStatus]?.label ?? u.status}</Tag>
                : <Select size="small" style={{ width: 140 }} value={u.status as UserStatus} onChange={(status) => save(u, { status })} options={optionsOf(USER_STATUS)} />,
            },
            { title: 'Tham gia', dataIndex: 'createdAt', width: 150, render: (d: string) => <Muted>{dateVN(d)}</Muted> },
            {
              title: '',
              width: 96,
              render: (_, u) => u.id !== me?.id && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {/* Admins reach a user through that user's support thread (shared by all admins). */}
                  {u.role !== 'admin' && (
                    <Tooltip title="Nhắn tin hỗ trợ">
                      <Button type="text" icon={<MessageCircle size={16} />} onClick={() => chat.supportFor(u.id)} disabled={chat.busy} aria-label={`Nhắn tin cho ${u.username}`} />
                    </Tooltip>
                  )}
                  <Tooltip title="Xoá tài khoản">
                    <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(u)} aria-label={`Xoá ${u.username}`} />
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
