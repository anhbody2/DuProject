import { useEffect, useState } from 'react';
import { App, Input } from 'antd';
import { MessageCircle, MessageSquareHeart, Pencil, Star, Trash2 } from 'lucide-react';
import { dateVN } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useRequireLogin } from '@/hooks/useShop';
import { useAuth } from '@/redux';
import {
  errorMessage, useCreateProductReviewMutation, useCreateReviewReplyMutation, useDeleteProductReviewMutation,
  useDeleteReviewReplyMutation, useMyProductReviewsQuery, useProductReviewsQuery, useUpdateProductReviewMutation,
} from '@/redux/api';
import type { Review, ReviewAuthor, ReviewReply } from '@/redux/types';
import { Card, GreenButton, IconButton, Muted, Row, Spinner, Stack, TextButton } from '@/components/ui';
import {
  Avatar, Bar, Composer, OwnBadge, Replies, ReplyItem, ReviewItem, ScoreBig, SectionHead, StarPick, Stars, Summary,
} from './styles';

const PAGE = 5;
const MAX_COMMENT = 2000;
const MAX_REPLY = 1000;
const RATING_LABEL = ['', 'Tệ', 'Chưa ổn', 'Tạm được', 'Ngon', 'Tuyệt vời'];

const authorName = (u?: ReviewAuthor) =>
  [u?.profile?.lastName, u?.profile?.firstName].filter(Boolean).join(' ') || u?.username || 'Khách';

function AuthorAvatar({ u, name, size }: { u?: ReviewAuthor; name: string; size?: number }) {
  const style = size ? { width: size, height: size, fontSize: size * 0.44 } : undefined;
  return <Avatar style={style}>{u?.profile?.avatarUrl ? <img src={u.profile.avatarUrl} alt="" /> : name[0].toUpperCase()}</Avatar>;
}

export function StarRow({ value, size }: { value: number; size?: number }) {
  return (
    <Stars $size={size} aria-label={`${value} / 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />)}
    </Stars>
  );
}

/** Average rating next to the title; shares the cache entry with the first page of <Feedback>. */
export function RatingSummary({ productId }: { productId: number }) {
  const { data } = useProductReviewsQuery({ id: productId });
  if (!data?.meta.total) return <Muted $size={13}>Chưa có phản hồi</Muted>;
  return (
    <Row $justify="flex-start" $gap="8px">
      <StarRow value={data.averageRating} />
      <Muted $size={13}>{data.averageRating.toFixed(1)} · {data.meta.total} phản hồi</Muted>
    </Row>
  );
}

/**
 * Customer feedback: rating breakdown, a form for anyone with a completed order
 * of this dish, and the list (own entries can be edited or deleted). Any signed-in
 * user can reply under an existing feedback.
 */
export default function Feedback({ productId }: { productId: number }) {
  const { token, user } = useAuth();
  const [shown, setShown] = useState(1);
  const [editing, setEditing] = useState<Review | null>(null);
  // "Xem thêm" grows the page size instead of paging, so a refetch after posting
  // or editing always returns one consistent list. Page 1 shares RatingSummary's cache entry.
  const { data, isFetching } = useProductReviewsQuery(shown === 1 ? { id: productId } : { id: productId, limit: PAGE * shown });
  const { data: mine } = useMyProductReviewsQuery(productId, { skip: !token });

  useEffect(() => { setShown(1); setEditing(null); }, [productId]);

  const total = data?.meta.total ?? 0;
  const canWrite = !!mine?.reviewableOrderIds.length;

  return (
    <Card $gap={20}>
      <Row $justify="flex-start" $gap="10px">
        <MessageSquareHeart size={24} color="var(--green-text)" />
        <SectionHead style={{ margin: 0 }}>Phản hồi từ khách{total ? ` (${total})` : ''}</SectionHead>
      </Row>

      {total > 0 && data && (
        <Summary>
          <Stack $gap={4} $align="center">
            <ScoreBig>{data.averageRating.toFixed(1)}</ScoreBig>
            <StarRow value={data.averageRating} size={18} />
            <Muted>{total} phản hồi</Muted>
          </Stack>
          <Stack $gap={6}>
            {[5, 4, 3, 2, 1].map((r) => {
              const n = data.ratingCounts?.[r] ?? 0;
              return (
                <Bar key={r} $pct={total ? (n / total) * 100 : 0}>
                  <span>{r}<Star size={12} fill="currentColor" /></span>
                  <div />
                  <span>{n}</span>
                </Bar>
              );
            })}
          </Stack>
        </Summary>
      )}

      {editing ? (
        <FeedbackForm key={editing.id} productId={productId} review={editing} onDone={() => setEditing(null)} />
      ) : canWrite ? (
        <FeedbackForm key={`new-${mine!.reviewableOrderIds[0]}`} productId={productId} orderId={mine!.reviewableOrderIds[0]} />
      ) : (
        <WriteHint loggedIn={!!token} reviewed={!!mine?.reviews.length} />
      )}

      {!data && isFetching ? <Spinner /> : !data?.items.length ? (
        <Muted $size={14}>Chưa có phản hồi nào. Hãy là người đầu tiên chia sẻ cảm nhận về món này!</Muted>
      ) : (
        <div>
          {data.items.map((r) => (
            <FeedbackRow key={r.id} r={r} userId={user?.id} onEdit={() => setEditing(r)} editing={editing?.id === r.id} />
          ))}
          {data.items.length < total && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <TextButton onClick={() => setShown((n) => n + 1)} disabled={isFetching}>{isFetching ? 'Đang tải…' : 'Xem thêm phản hồi'}</TextButton>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function WriteHint({ loggedIn, reviewed }: { loggedIn: boolean; reviewed: boolean }) {
  const requireLogin = useRequireLogin();
  if (reviewed) return null;
  return (
    <Composer as="div">
      {loggedIn ? (
        <Muted $size={14}>Nhận món thành công là bạn có thể gửi phản hồi cho món này.</Muted>
      ) : (
        <Row $wrap>
          <Muted $size={14}>Đã thưởng thức món này? Chia sẻ cảm nhận của bạn nhé.</Muted>
          <TextButton onClick={() => requireLogin('Đăng nhập để gửi phản hồi')}>Đăng nhập để phản hồi</TextButton>
        </Row>
      )}
    </Composer>
  );
}

/** New feedback (needs `orderId`) or an edit of `review`. */
function FeedbackForm({ productId, orderId, review, onDone }: { productId: number; orderId?: number; review?: Review; onDone?: () => void }) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [create, { isLoading: creating }] = useCreateProductReviewMutation();
  const [update, { isLoading: updating }] = useUpdateProductReviewMutation();
  const busy = creating || updating;
  const shownRating = hover || rating;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast('Chọn số sao trước nhé');
    const text = comment.trim();
    try {
      if (review) {
        await update({ id: review.id, rating, comment: text }).unwrap();
        toast('Đã cập nhật phản hồi');
      } else {
        await create({ productId, orderId: orderId!, rating, ...(text && { comment: text }) }).unwrap();
        toast('Cảm ơn bạn đã phản hồi!');
        setRating(0);
        setComment('');
      }
      onDone?.();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <Composer onSubmit={submit}>
      <b style={{ fontSize: 15 }}>{review ? 'Sửa phản hồi của bạn' : 'Bạn thấy món này thế nào?'}</b>
      <Row $justify="flex-start" $gap="10px" $wrap>
        <StarPick role="radiogroup" aria-label="Số sao" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} sao`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
            >
              <Star size={28} fill={n <= shownRating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </StarPick>
        <Muted $size={14} style={{ fontWeight: 700 }}>{RATING_LABEL[shownRating]}</Muted>
      </Row>
      <Input.TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Hương vị, khẩu phần, đóng gói… (không bắt buộc)"
        autoSize={{ minRows: 3, maxRows: 8 }}
        maxLength={MAX_COMMENT}
        showCount
      />
      <Row $justify="flex-end" $gap="16px" style={{ marginTop: 8 }}>
        {onDone && <TextButton type="button" $plain onClick={onDone}>Huỷ</TextButton>}
        <GreenButton type="submit" $size={15} disabled={busy || !rating}>{busy ? 'Đang gửi…' : review ? 'Lưu' : 'Gửi phản hồi'}</GreenButton>
      </Row>
    </Composer>
  );
}

function FeedbackRow({ r, userId, editing, onEdit }: { r: Review; userId?: number; editing: boolean; onEdit: () => void }) {
  const { modal } = App.useApp();
  const [remove, { isLoading: removing }] = useDeleteProductReviewMutation();
  const [replying, setReplying] = useState(false);
  const requireLogin = useRequireLogin();
  const own = r.userId === userId;
  const name = authorName(r.user);
  const replies = r.replies ?? [];
  const edited = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 1000;

  const confirmRemove = () => modal.confirm({
    title: 'Xoá phản hồi này?',
    content: 'Phản hồi sẽ bị xoá vĩnh viễn.',
    okText: 'Xoá',
    okButtonProps: { danger: true },
    cancelText: 'Giữ lại',
    onOk: () => remove(r.id).unwrap().then(() => toast('Đã xoá phản hồi')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <ReviewItem style={editing ? { opacity: 0.5 } : undefined}>
      <Row $align="flex-start">
        <Row $justify="flex-start" $gap="10px">
          <AuthorAvatar u={r.user} name={name} />
          <Stack $gap={2}>
            <Row $justify="flex-start" $gap="8px">
              <b style={{ fontSize: 14 }}>{name}</b>
              {own && <OwnBadge>Của bạn</OwnBadge>}
            </Row>
            <Row $justify="flex-start" $gap="8px" $wrap>
              <StarRow value={r.rating} size={13} />
              <Muted>{dateVN(r.createdAt)}{edited && ' · đã sửa'}</Muted>
            </Row>
          </Stack>
        </Row>
        {own && !editing && (
          <Row $gap="0">
            <IconButton onClick={onEdit} title="Sửa" aria-label="Sửa phản hồi" $anim="wiggle" $hoverColor="var(--green-text)" style={{ width: 32, height: 32, color: 'var(--muted)' }}>
              <Pencil size={16} />
            </IconButton>
            <IconButton onClick={confirmRemove} disabled={removing} title="Xoá" aria-label="Xoá phản hồi" $anim="wiggle" $hoverColor="var(--red-text)" style={{ width: 32, height: 32, color: 'var(--muted)' }}>
              <Trash2 size={16} />
            </IconButton>
          </Row>
        )}
      </Row>
      {r.comment && <p>{r.comment}</p>}
      {!editing && !replying && (
        <div>
          <TextButton $plain onClick={() => requireLogin('Đăng nhập để trả lời phản hồi') && setReplying(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
            <MessageCircle size={13} />Trả lời{replies.length ? ` (${replies.length})` : ''}
          </TextButton>
        </div>
      )}
      {(replies.length > 0 || replying) && (
        <Replies>
          {replies.map((c) => <ReplyRow key={c.id} c={c} own={c.userId === userId} reviewAuthor={c.userId === r.userId} />)}
          {replying && <ReplyForm reviewId={r.id} to={name} onDone={() => setReplying(false)} />}
        </Replies>
      )}
    </ReviewItem>
  );
}

function ReplyRow({ c, own, reviewAuthor }: { c: ReviewReply; own: boolean; reviewAuthor: boolean }) {
  const { modal } = App.useApp();
  const [remove, { isLoading: removing }] = useDeleteReviewReplyMutation();
  const name = authorName(c.user);

  const confirmRemove = () => modal.confirm({
    title: 'Xoá bình luận này?',
    okText: 'Xoá',
    okButtonProps: { danger: true },
    cancelText: 'Giữ lại',
    onOk: () => remove(c.id).unwrap().then(() => toast('Đã xoá bình luận')).catch((e) => toast(errorMessage(e))),
  });

  return (
    <ReplyItem>
      <AuthorAvatar u={c.user} name={name} size={26} />
      <Stack $gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Row $justify="flex-start" $gap="8px" $wrap>
          <b style={{ fontSize: 13 }}>{name}</b>
          {own ? <OwnBadge>Của bạn</OwnBadge> : reviewAuthor && <OwnBadge>Tác giả</OwnBadge>}
          <Muted $size={12}>{dateVN(c.createdAt)}</Muted>
        </Row>
        <p>{c.comment}</p>
      </Stack>
      {own && (
        <IconButton onClick={confirmRemove} disabled={removing} title="Xoá" aria-label="Xoá bình luận" $anim="wiggle" $hoverColor="var(--red-text)" style={{ width: 28, height: 28, color: 'var(--muted)', flex: 'none' }}>
          <Trash2 size={14} />
        </IconButton>
      )}
    </ReplyItem>
  );
}

function ReplyForm({ reviewId, to, onDone }: { reviewId: number; to: string; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const [create, { isLoading }] = useCreateReviewReplyMutation();
  const text = comment.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    try {
      await create({ reviewId, comment: text }).unwrap();
      toast('Đã gửi bình luận');
      onDone();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit}>
      <Input.TextArea
        autoFocus
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onDone(); }}
        placeholder={`Trả lời ${to}…`}
        autoSize={{ minRows: 2, maxRows: 6 }}
        maxLength={MAX_REPLY}
      />
      <Row $justify="flex-end" $gap="16px" style={{ marginTop: 8 }}>
        <TextButton type="button" $plain onClick={onDone}>Huỷ</TextButton>
        <GreenButton type="submit" $size={14} disabled={isLoading || !text}>{isLoading ? 'Đang gửi…' : 'Gửi'}</GreenButton>
      </Row>
    </form>
  );
}
