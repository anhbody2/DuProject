import { addressText } from '@/lib/format';
import type { AddressSnapshot } from '@/redux/types';

/** Recipient + address of an order (the snapshot taken at checkout), with a map link when pinned. */
export default function DeliveryAddress({ addr }: { addr?: AddressSnapshot | null }) {
  // Only orders placed before snapshots existed, whose address was then deleted, have none.
  if (!addr) return <div>Không còn thông tin địa chỉ</div>;
  const pinned = addr.latitude != null && addr.longitude != null;
  return (
    <>
      <div>{addr.recipientName} · <a href={`tel:${addr.phone}`}>{addr.phone}</a></div>
      <div>{addressText(addr)}</div>
      {pinned && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
          Xem vị trí trên bản đồ ↗
        </a>
      )}
    </>
  );
}
