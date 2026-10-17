import { useState } from 'react';
import { App, Button, Form, Input, Modal, Select, Table, Tooltip } from 'antd';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  errorMessage,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
  type CategoryBody,
} from '@/redux/api';
import type { Category } from '@/redux/types';
import { Muted, PageHead, Panel } from './styles';

/** Ids of a category and all its descendants (a category can't be moved under itself). */
const subtree = (c: Category): number[] => [c.id, ...(c.children ?? []).flatMap(subtree)];
/** antd shows an expand toggle for any `children` array, so drop the empty ones. */
const prune = (cats: Category[] = []): Category[] =>
  cats.map(({ children, ...c }) => (children?.length ? { ...c, children: prune(children) } : c));
const flatten = (cats: Category[] = [], depth = 0): (Category & { depth: number })[] =>
  cats.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)]);

export default function CategoriesView() {
  const { modal } = App.useApp();
  const { data: tree, isFetching } = useCategoriesQuery();
  const [create, { isLoading: creating }] = useCreateCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [form] = Form.useForm<CategoryBody>();

  const open = (c: Category | 'new', parentId?: number) => {
    setEditing(c);
    form.setFieldsValue(c === 'new' ? { name: '', slug: '', parentId: parentId ?? null } : { name: c.name, slug: c.slug, parentId: c.parentId });
  };

  const submit = async (values: CategoryBody) => {
    const body = { ...values, slug: values.slug?.trim() || undefined, parentId: values.parentId ?? null };
    try {
      if (editing === 'new') await create(body).unwrap();
      else if (editing) await update({ id: editing.id, ...body }).unwrap();
      toast(editing === 'new' ? 'Đã thêm danh mục' : 'Đã lưu danh mục');
      setEditing(null);
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const confirmDelete = (c: Category) => modal.confirm({
    title: `Xoá danh mục "${c.name}"?`,
    content: 'Danh mục đang có món hoặc danh mục con thì không xoá được.',
    okText: 'Xoá', cancelText: 'Huỷ',
    okButtonProps: { danger: true },
    onOk: () => remove(c.id).unwrap().then(() => toast('Đã xoá danh mục')).catch((e) => toast(errorMessage(e))),
  });

  const blocked = editing && editing !== 'new' ? subtree(editing) : [];
  const parents = flatten(tree).filter((c) => !blocked.includes(c.id));

  return (
    <>
      <PageHead>
        <div>
          <h1>DANH MỤC</h1>
          <p>Cây danh mục dùng cho món ăn và cửa hàng</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => open('new')}>Thêm danh mục</Button>
      </PageHead>

      <Panel>
        <Table<Category>
          rowKey="id"
          loading={isFetching}
          dataSource={prune(tree)}
          pagination={false}
          expandable={{ childrenColumnName: 'children', defaultExpandAllRows: true }}
          scroll={{ x: 560 }}
          columns={[
            { title: 'Tên', dataIndex: 'name', render: (n: string) => <b>{n}</b> },
            { title: 'Slug', dataIndex: 'slug', render: (s: string) => <Muted>{s}</Muted> },
            {
              title: '',
              width: 140,
              render: (_, c) => (
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Tooltip title="Thêm danh mục con"><Button type="text" icon={<Plus size={16} />} onClick={() => open('new', c.id)} aria-label={`Thêm danh mục con của ${c.name}`} /></Tooltip>
                  <Tooltip title="Sửa"><Button type="text" icon={<Pencil size={16} />} onClick={() => open(c)} aria-label={`Sửa ${c.name}`} /></Tooltip>
                  <Tooltip title="Xoá"><Button type="text" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(c)} aria-label={`Xoá ${c.name}`} /></Tooltip>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Thêm danh mục' : 'Sửa danh mục'}
        okText="Lưu" cancelText="Huỷ"
        confirmLoading={creating || updating}
        onOk={() => form.submit()}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, whitespace: true, message: 'Nhập tên danh mục' }, { max: 100 }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="slug" label="Slug (để trống để tự tạo)" rules={[{ pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Chỉ chữ thường, số và dấu gạch ngang' }]}>
            <Input placeholder="vd: com-tam" />
          </Form.Item>
          <Form.Item name="parentId" label="Danh mục cha">
            <Select allowClear placeholder="(Cấp gốc)" options={parents.map((c) => ({ value: c.id, label: `${'— '.repeat(c.depth)}${c.name}` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
