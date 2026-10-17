import type { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus, Product, Role, Store, UserStatus } from '@/redux/types';

/** antd Tag preset colours: they have their own light/dark variants. */
type TagColor = 'default' | 'success' | 'processing' | 'warning' | 'error' | 'gold' | 'purple' | 'cyan';

export interface Labelled { label: string; color: TagColor }

export const ROLE: Record<Role, Labelled> = {
  customer: { label: 'Khách hàng', color: 'default' },
  member: { label: 'Thành viên', color: 'cyan' },
  store_owner: { label: 'Chủ quán', color: 'gold' },
  admin: { label: 'Quản trị', color: 'purple' },
};

export const USER_STATUS: Record<UserStatus, Labelled> = {
  active: { label: 'Hoạt động', color: 'success' },
  inactive: { label: 'Ngừng', color: 'default' },
  suspended: { label: 'Bị khoá', color: 'error' },
};

export const STORE_STATUS: Record<Store['status'], Labelled> = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  active: { label: 'Đang bán', color: 'success' },
  inactive: { label: 'Tạm nghỉ', color: 'default' },
  suspended: { label: 'Đình chỉ', color: 'error' },
};

export const PRODUCT_STATUS: Record<Product['status'], Labelled> = {
  active: { label: 'Đang bán', color: 'success' },
  out_of_stock: { label: 'Hết hàng', color: 'warning' },
  inactive: { label: 'Ẩn', color: 'default' },
};

export const ORDER_STATUS: Record<OrderStatus, Labelled> = {
  pending: { label: 'Chờ xác nhận', color: 'warning' },
  confirmed: { label: 'Đã nhận', color: 'processing' },
  preparing: { label: 'Đang nấu', color: 'processing' },
  ready: { label: 'Chờ shipper', color: 'cyan' },
  delivering: { label: 'Đang giao', color: 'cyan' },
  completed: { label: 'Hoàn tất', color: 'success' },
  cancelled: { label: 'Đã huỷ', color: 'error' },
};

export const PAYMENT_STATUS: Record<PaymentStatus, Labelled> = {
  pending: { label: 'Chưa trả', color: 'warning' },
  paid: { label: 'Đã trả', color: 'success' },
  failed: { label: 'Thất bại', color: 'error' },
  refunded: { label: 'Hoàn tiền', color: 'default' },
};

export const DELIVERY_STATUS: Record<DeliveryStatus, Labelled> = {
  pending: { label: 'Chờ giao', color: 'default' },
  assigned: { label: 'Đã gán', color: 'processing' },
  picked_up: { label: 'Đã lấy hàng', color: 'processing' },
  delivering: { label: 'Đang giao', color: 'cyan' },
  delivered: { label: 'Đã giao', color: 'success' },
  cancelled: { label: 'Đã huỷ', color: 'error' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', momo: 'MoMo', vnpay: 'VNPay', zalopay: 'ZaloPay', card: 'Thẻ',
};

/** Mirrors the backend's STORE_ORDER_TRANSITIONS / PAYMENT_TRANSITIONS so only valid moves are offered. */
export const STORE_ORDER_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering'],
  delivering: ['completed'],
  completed: [],
  cancelled: [],
};

export const PAYMENT_NEXT: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'failed'],
  failed: ['pending'],
  paid: ['refunded'],
  refunded: [],
};

export const DELIVERY_NEXT: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned', 'picked_up', 'delivering', 'delivered', 'cancelled'],
  assigned: ['picked_up', 'delivering', 'delivered', 'cancelled'],
  picked_up: ['delivering', 'delivered', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

/** Select options from a label map, in declaration order. */
export const optionsOf = <K extends string>(map: Record<K, Labelled>, keys?: K[]) =>
  (keys ?? (Object.keys(map) as K[])).map((value) => ({ value, label: map[value].label }));

/** 1.284.000đ -> 1,3tr; used where space is tight (axes, tiles). */
export function compactVND(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k`;
  return v.toLocaleString('vi-VN');
}
