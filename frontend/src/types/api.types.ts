// ─── Common ─────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Auth ───────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isProfileCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: Pick<User, 'id' | 'email' | 'role'>;
}

// ─── Products ───────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  variants: ProductVariant[];
  _count: { reviews: number };
}

export interface ProductDetail extends Product {
  isActive: boolean;
  createdAt: string;
  reviews: Review[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: string;
  stock: number;
}

// ─── Categories ─────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  _count: { products: number };
}

// ─── Cart ───────────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: string;
  product: { id: string; name: string; imageUrl: string | null; isActive: boolean };
  variant: { id: string; name: string; price: string; stock: number } | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  holdReference: string | null;
  holdAmount: number | null;
  total: number;
}

// ─── Orders ─────────────────────────────────────────
export interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface Order {
  id: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  pointsRedeemed: number;
  addressSnapshot: any;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    id: string;
    status: string;
    amount: string;
    createdAt: string;
  };
}

// ─── Reviews ────────────────────────────────────────
export interface Review {
  id: string;
  rating: number;
  content: string | null;
  imageUrl: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null };
}

// ─── Loyalty ────────────────────────────────────────
export interface LoyaltyProfile {
  pointsBalance: number | null;
  tier: any;
  badges: any[];
  available: boolean;
}

export interface CustomerBalance {
  totalPointsBalance: number;
  totalPointsValue: number;
  avaliablePointsBalance: number; // Gameball API typo — missing 'i'
  avaliablePointsValue: number;   // Gameball API typo — missing 'i'
  pendingPoints: number;
  pendingPointsValue: number;
  currency: string;
  pointsName: string;
  nextExpiringPointsAmount: number;
  nextExpiringPointsValue: number;
  nextExpiringPointsDate: string | null;
  totalEarnedPoints: number;
}

export interface TierState {
  order: number;
  name: string;
  minProgress: number;
  icon: string;
}

export interface TierBenefit {
  type: string;
  description: string | null;
  hyperLink: string | null;
  rankReward: number;
  walletReward: number;
  rewardWalletFactor: number | null; // Gameball API field name (points multiplier)
  couponReward: any | null;
}

export interface TierConfig {
  name: string;
  minProgress: number;
  order: number;
  icon: string;
  benefits: TierBenefit[];
}

export interface TierProgress {
  current: TierState | null;
  next: TierState | null;
  progress: number;
  tiers: TierConfig[];
}

// ─── Addresses ──────────────────────────────────────
export interface Address {
  id: string;
  label: string | null;
  street: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}
