// Shapes returned by the NestJS API (`backend/`). Money fields arrive as numbers.

/** 'member': a customer who has added a store to the market. */
export type Role = 'customer' | 'member' | 'store_owner' | 'admin';

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

export interface ProductOption {
  id: number;
  optionGroupId: number;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
}

export interface OptionGroup {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  required: boolean;
  options?: ProductOption[];
}

/** GET /products/:id - adds the category and option groups to the list shape. */
export interface ProductDetail extends Product {
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  optionGroups?: OptionGroup[];
}

export interface Review {
  id: number;
  userId: number;
  orderId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: ReviewAuthor;
  /** Other users' comments on this review, oldest first (product reviews only). */
  replies?: ReviewReply[];
}

export type ReviewAuthor = Pick<User, 'id' | 'username'> & { profile?: Pick<Profile, 'firstName' | 'lastName' | 'avatarUrl'> | null };

export interface ReviewReply {
  id: number;
  reviewId: number;
  userId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: ReviewAuthor;
}

export type ReviewPage = Paginated<Review> & {
  averageRating: number;
  /** Number of reviews per star, keys 1-5. */
  ratingCounts: Record<number, number>;
};

/** GET /products/:id/reviews/mine */
export interface MyProductReviews {
  reviews: Review[];
  /** Completed orders containing the product that the user hasn't reviewed yet (newest first). */
  reviewableOrderIds: number[];
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
  ownerId?: number;
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
  createdAt: string;
}

/** GET /stores/:id - an active store with its review summary. */
export interface StoreDetail extends Store {
  rating: { average: number; count: number };
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
  /** Chosen options (e.g. size); already included in `unitPrice`. */
  options?: Pick<ProductOption, 'id' | 'optionGroupId' | 'name' | 'priceModifier' | 'isAvailable'>[];
}

export interface Cart {
  id: number;
  /** A cart holds one store's dishes; null when empty. */
  store: StoreSummary | null;
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
  /** Only on addresses saved before the 2025 reform; new ones are ward + province. */
  district: string | null;
  /** Province / centrally-run city. */
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

/** Copy of an address frozen onto an order at checkout; null on old orders whose address was deleted. */
export type AddressSnapshot = Omit<Address, 'id' | 'isDefault'>;

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
  deliveryAddress?: AddressSnapshot | null;
  /** The customer's checkout note, null when left blank. */
  note?: string | null;
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

// ---------------------------------------------------------------- admin

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';

export interface AdminStats {
  totals: {
    users: number;
    newUsers: number;
    stores: number;
    products: number;
    orders: number;
    /** Sum of completed orders. */
    revenue: number;
    /** Sum of orders still in progress. */
    pendingRevenue: number;
    commission: number;
  };
  /** Zero-filled, oldest first. Revenue excludes cancelled orders. */
  daily: { date: string; orders: number; revenue: number }[];
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  usersByRole: Partial<Record<Role, number>>;
  storesByStatus: Partial<Record<Store['status'], number>>;
  productsByStatus: Partial<Record<Product['status'], number>>;
  payments: { method: PaymentMethod; count: number; amount: number }[];
  topStores: { id: number; name: string; logoUrl: string | null; orders: number; revenue: number }[];
  topProducts: { productId: number | null; name: string; storeName: string; quantity: number; revenue: number }[];
}

export interface AdminStore extends Store {
  ownerId: number;
  createdAt: string;
  owner?: Pick<User, 'id' | 'username' | 'email'>;
  productCount: number;
  orderCount: number;
}

export interface AdminProduct extends Product {
  store?: StoreSummary & { status: Store['status'] };
  category?: Pick<Category, 'id' | 'name'>;
}

export interface Payment {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  paidAt: string | null;
}

export interface AdminOrder extends Omit<Order, 'delivery'> {
  user?: Pick<User, 'id' | 'username' | 'email'>;
  payments?: Payment[];
  delivery?: (Delivery & { status: DeliveryStatus }) | null;
}

// ---------------------------------------------------------------- store dashboard

export type StoreMemberRole = 'owner' | 'manager' | 'staff';

export interface StoreStats {
  totals: {
    orders: number;
    products: number;
    /** Distinct customers with a non-cancelled order. */
    customers: number;
    /** Subtotal of completed store orders. */
    revenue: number;
    /** Platform commission on completed store orders. */
    commission: number;
    /** Subtotal of store orders still in progress. */
    pendingRevenue: number;
    rating: number;
    reviews: number;
  };
  /** Zero-filled, oldest first. Revenue excludes cancelled store orders. */
  daily: { date: string; orders: number; revenue: number }[];
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  productsByStatus: Partial<Record<Product['status'], number>>;
  topProducts: { productId: number | null; name: string; quantity: number; revenue: number }[];
  lowStock: { id: number; name: string; stock: number; status: Product['status'] }[];
}

/** One store's slice of an order, as the store sees it. */
export interface StoreOrderRow extends StoreOrder {
  orderId: number;
  commissionAmount: number;
  createdAt: string;
  order?: {
    id: number;
    status: OrderStatus;
    createdAt: string;
    user?: Pick<User, 'id' | 'username'> & { profile?: { firstName: string | null; lastName: string | null; phone: string | null } | null };
    deliveryAddress?: AddressSnapshot | null;
    note?: string | null;
  };
  items?: (OrderItem & { options?: { id: number; optionName: string; priceModifier: number }[] })[];
}

// --- chat ---

/** Public card of a chat user (the API never sends their email). */
export interface ChatPeer {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

/** 'direct': two users. 'support': a user and the admin team. */
export interface Conversation {
  id: number;
  type: 'direct' | 'support';
  /** Direct: the other user. Support: the customer (admin view), or null (the customer's view: the admin team). */
  peer: ChatPeer | null;
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
  unread: number;
}

export interface ChatMessagesPage {
  items: ChatMessage[];
  hasMore: boolean;
}
