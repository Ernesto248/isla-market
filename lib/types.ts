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
