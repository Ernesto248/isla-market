export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string;
  images: string[] | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Relaciones
  categories?: Category;
  // Para compatibilidad con código existente
  image?: string;
  category?: string;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Para compatibilidad con código existente
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "admin";
  createdAt: Date;
}

// Tipos basados en la estructura real de Supabase
export interface Order {
  id: string;
  user_id: string;
  shipping_address_id: string;
  status: "pendiente" | "pagado" | "entregado" | "cancelado";
  total_amount: number;
  customer_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Datos relacionados que vienen del JOIN
  email?: string;
  full_name?: string;
  // Información del destinatario (de shipping_addresses)
  recipientInfo?: {
    first_name: string;
    last_name: string;
    phone: string;
    street: string;
    house_number: string;
    between_streets: string;
    neighborhood: string;
    province: string;
  };
  // Items de la orden
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Datos del producto (del JOIN)
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  totalCategories: number;
  salesByDay: { date: string; sales: number }[];
  salesByWeek: { week: string; sales: number }[];
  salesByMonth: { month: string; sales: number }[];
  topProducts: { product: Product; sales: number }[];
}

export type Language = "en" | "es";
export type Theme = "light" | "dark";

// ========================================
// TIPOS PARA SISTEMA DE REFERIDOS
// ========================================

export interface ReferralProgramConfig {
  id: string;
  default_commission_rate: number;
  default_duration_months: number;
  is_program_active: boolean;
  updated_at: string;
  updated_by?: string | null;
}

export interface Referrer {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
  notes?: string | null;
  // Estadísticas agregadas
  total_referrals: number;
  active_referrals: number;
  total_orders: number;
  total_sales: number;
  total_commissions: number;
  // Datos del usuario (JOIN)
  user?: {
    email: string;
    full_name: string;
  };
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  commission_rate: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  // Estadísticas de este referido
  total_orders: number;
  total_spent: number;
  total_commission_generated: number;
  last_order_at?: string | null;
  // Datos relacionados (JOIN)
  referrer?: {
    id: string;
    referral_code: string;
    user?: {
      email: string;
      full_name: string;
    };
  };
  referred_user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface ReferralCommission {
  id: string;
  referral_id: string;
  referrer_id: string;
  order_id: string;
  referred_user_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  // Datos relacionados (JOIN)
  referrer?: {
    referral_code: string;
    user?: {
      email: string;
      full_name: string;
    };
  };
  referred_user?: {
    email: string;
    full_name: string;
  };
  order?: {
    id: string;
    status: string;
  };
}

// Tipos para APIs y formularios
export interface CreateReferrerData {
  user_id: string;
  referral_code: string;
  commission_rate?: number;
  duration_months?: number;
  notes?: string;
}

export interface UpdateReferrerData {
  referral_code?: string;
  commission_rate?: number;
  duration_months?: number;
  is_active?: boolean;
  notes?: string;
}

export interface ReferrerStats {
  total_referrers: number;
  active_referrers: number;
  total_referrals: number;
  active_referrals: number;
  total_commissions_generated: number;
  total_sales_from_referrals: number;
  average_commission_per_referrer: number;
}

export interface ReferrerRanking {
  referrer_id: string;
  referral_code: string;
  user_email: string;
  user_name: string;
  total_referrals: number;
  total_sales: number;
  total_commissions: number;
  rank: number;
}
