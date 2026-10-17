// Shapes returned by the NestJS API (`backend/`). Money fields arrive as numbers.

export type Role = 'customer' | 'store_owner' | 'admin';

export interface Profile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
  profile?: Profile | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  children?: Category[];
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface StoreSummary {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  status?: string;
}

export interface Product {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  store?: StoreSummary;
  images?: ProductImage[];
}

export interface StoreLocation {
  id: number;
  addressLine: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  categories?: Category[];
  locations?: StoreLocation[];
  distanceKm?: number;
}

export interface CartLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'salePrice' | 'stock' | 'status' | 'storeId'> & {
    store?: StoreSummary;
    images?: Pick<ProductImage, 'imageUrl'>[];
  };
}

export interface Cart {
  id: number;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
}

export interface Address {
  id: number;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  isDefault: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay' | 'card';

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface StoreOrder {
  id: number;
  storeId: number;
  subtotal: number;
  deliveryFee: number;
  status: OrderStatus;
  store?: StoreSummary;
  items?: OrderItem[];
}

export interface Delivery {
  id: number;
  status: string;
  estimatedAt: string | null;
  deliveredAt: string | null;
}

export interface Order {
  id: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  storeOrders?: StoreOrder[];
  delivery?: Delivery | null;
  deliveryAddress?: Address | null;
}

export interface FavoriteProduct {
  id: number;
  productId: number;
  product?: Product;
}

export interface FavoriteStore {
  id: number;
  storeId: number;
  store?: StoreSummary;
}

/** NestJS error body. */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
