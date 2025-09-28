export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
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
  role: 'client' | 'admin';
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'delivered';
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipientInfo: {
    firstName: string;
    lastName: string;
    street: string;
    houseNumber: string;
    betweenStreets: string;
    neighborhood: string;
    province: string;
  };
  createdAt: Date;
  updatedAt: Date;
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

export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark';