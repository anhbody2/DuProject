import { useEffect, useState } from 'react';
import { App } from 'antd';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, NotebookPen, Quote, Redo2, Strikethrough,
  Underline, Undo2,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { isHtml, sanitizeHtml, textToHtml } from '@/lib/html';
import { errorMessage, useUpdateProductDescriptionMutation } from '@/redux/api';
import { Card, GreenButton, Muted, Row, TextButton } from '@/components/ui';
import { EditorBox, SectionHead, ToolButton, Toolbar, ToolSep } from './styles';

const MAX_CHARS = 5000;

const toEditor = (s: string | null) => (!s ? '' : isHtml(s) ? sanitizeHtml(s) : textToHtml(s));
/** The editor rewrites HTML on load, so "unchanged" is judged in its own output format. */
const htmlOf = (e: Editor) => (e.isEmpty ? '' : e.getHTML());

/**
 * Store owner only: rich-text editor for the dish description. The shopper-facing
 * copy above re-renders from the patched cache as soon as the save succeeds.
 */
export default function DescriptionEditor({ productId, description }: { productId: number; description: string | null }) {
  const { modal } = App.useApp();
  const [save, { isLoading }] = useUpdateProductDescriptionMutation();
  const [saved, setSaved] = useState('');
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: 'Nguyên liệu, cách chế biến, khẩu phần, lưu ý dị ứng…' }),
    ],
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  // First load, another dish (same component instance) or a fresh server copy.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(toEditor(description), { emitUpdate: false });
    setSaved(htmlOf(editor));
  }, [productId, description, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ html: e ? htmlOf(e) : '', chars: e?.getText().length ?? 0 }),
  });
  const html = state?.html ?? '';
  const chars = state?.chars ?? 0;
  const dirty = html !== saved;
  const tooLong = chars > MAX_CHARS;

  const submit = async () => {
    try {
      await save({ id: productId, description: html }).unwrap();
      setSaved(html);
      toast('Đã cập nhật mô tả món');
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const discard = () => modal.confirm({
    title: 'Bỏ các thay đổi?',
    content: 'Mô tả sẽ trở về bản đã lưu gần nhất.',
    okText: 'Bỏ thay đổi',
    okButtonProps: { danger: true },
    cancelText: 'Tiếp tục sửa',
    onOk: () => { editor?.commands.setContent(saved, { emitUpdate: false }); },
  });

  return (
    <Card $gap={16}>
      <Row $justify="flex-start" $gap="10px">
        <NotebookPen size={24} color="var(--green-text)" />
        <SectionHead style={{ margin: 0 }}>Cập nhật mô tả món</SectionHead>
      </Row>
      <Muted $size={13}>Chỉ chủ quán nhìn thấy mục này. Mô tả mới hiển thị cho khách ngay sau khi lưu.</Muted>

      <EditorBox $focused={focused}>
        {editor && <EditorToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </EditorBox>

      <Row $wrap>
        <Muted $size={13} style={tooLong ? { color: 'var(--red-text)', fontWeight: 700 } : undefined}>
          {chars.toLocaleString('vi-VN')} / {MAX_CHARS.toLocaleString('vi-VN')} ký tự
        </Muted>
        <Row $gap="16px">
          {dirty && <TextButton type="button" $plain onClick={discard} disabled={isLoading}>Huỷ thay đổi</TextButton>}
          <GreenButton type="button" $size={15} onClick={submit} disabled={!dirty || tooLong || isLoading}>
            {isLoading ? 'Đang lưu…' : 'Lưu mô tả'}
          </GreenButton>
        </Row>
      </Row>
    </Card>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Đường dẫn (để trống để gỡ liên kết)', prev ?? 'https://');
    if (url === null) return;
    const href = url.trim();
    if (!href || href === 'https://') return chain().extendMarkRange('link').unsetLink().run();
    if (!/^(https?:\/\/|mailto:)/i.test(href)) return toast('Liên kết phải bắt đầu bằng http(s)://');
    chain().extendMarkRange('link').setLink({ href }).run();
  };

  const tools: ({ key: string; label: string; icon: React.ReactNode; on?: boolean; disabled?: boolean; run: () => void } | '|')[] = [
    { key: 'b', label: 'In đậm (Ctrl+B)', icon: <Bold size={16} />, on: s.bold, run: () => chain().toggleBold().run() },
    { key: 'i', label: 'In nghiêng (Ctrl+I)', icon: <Italic size={16} />, on: s.italic, run: () => chain().toggleItalic().run() },
    { key: 'u', label: 'Gạch chân (Ctrl+U)', icon: <Underline size={16} />, on: s.underline, run: () => chain().toggleUnderline().run() },
    { key: 's', label: 'Gạch ngang', icon: <Strikethrough size={16} />, on: s.strike, run: () => chain().toggleStrike().run() },
    '|',
    { key: 'h2', label: 'Tiêu đề lớn', icon: <Heading2 size={16} />, on: s.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: 'Tiêu đề nhỏ', icon: <Heading3 size={16} />, on: s.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { key: 'ul', label: 'Danh sách', icon: <List size={16} />, on: s.bullet, run: () => chain().toggleBulletList().run() },
    { key: 'ol', label: 'Danh sách đánh số', icon: <ListOrdered size={16} />, on: s.ordered, run: () => chain().toggleOrderedList().run() },
    { key: 'q', label: 'Trích dẫn', icon: <Quote size={16} />, on: s.quote, run: () => chain().toggleBlockquote().run() },
    { key: 'hr', label: 'Đường kẻ ngang', icon: <Minus size={16} />, run: () => chain().setHorizontalRule().run() },
    { key: 'a', label: 'Chèn liên kết', icon: <Link2 size={16} />, on: s.link, run: setLink },
    '|',
    { key: 'undo', label: 'Hoàn tác (Ctrl+Z)', icon: <Undo2 size={16} />, disabled: !s.canUndo, run: () => chain().undo().run() },
    { key: 'redo', label: 'Làm lại (Ctrl+Y)', icon: <Redo2 size={16} />, disabled: !s.canRedo, run: () => chain().redo().run() },
  ];

  return (
    <Toolbar role="toolbar" aria-label="Định dạng mô tả">
      {tools.map((t, i) => t === '|' ? <ToolSep key={`sep-${i}`} /> : (
        <ToolButton
          key={t.key}
          type="button"
          title={t.label}
          aria-label={t.label}
          aria-pressed={t.on}
          $active={t.on}
          disabled={t.disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={t.run}
        >
          {t.icon}
        </ToolButton>
      ))}
    </Toolbar>
  );
}
