// Este archivo ya no se usa - los datos se obtienen de Supabase
// Mantenido por compatibilidad pero puede ser eliminado

import { Product, Category, Order, DashboardStats } from "./types";

export const mockCategories: Category[] = [];
export const mockProducts: Product[] = [];
export const mockOrders: Order[] = [];

export const mockDashboardStats: DashboardStats = {
  totalSales: 0,
  totalOrders: 0,
  pendingOrders: 0,
  deliveredOrders: 0,
  totalProducts: 0,
  totalCategories: 0,
  salesByDay: [],
  salesByWeek: [],
  salesByMonth: [],
  topProducts: [],
};
