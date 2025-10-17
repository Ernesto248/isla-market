import { apiClient } from "./api";
import { supabase } from "./supabase";
import { Product, Category } from "./types";
import { Order } from "./types";

// Adaptadores para convertir datos de la DB al formato esperado por los componentes
export class DataService {
  // Adaptar producto de DB a formato de componente
  static adaptProduct(dbProduct: any): Product {
    return {
      ...dbProduct,
      // Mapear campos de DB a formato esperado
      image: dbProduct.images?.[0] || "",
      category: dbProduct.category_id,
      stock: dbProduct.stock_quantity || 0,
      featured: dbProduct.featured || false,
      createdAt: new Date(dbProduct.created_at),
      updatedAt: new Date(dbProduct.updated_at),
    };
  }

  // Adaptar categoría de DB a formato de componente
  static adaptCategory(dbCategory: any): Category {
    return {
      ...dbCategory,
      // Mapear campos de DB a formato esperado
      image: dbCategory.image_url || "",
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
    };
  }

  // Obtener todas las categorías
  static async getCategories(): Promise<Category[]> {
    try {
      const dbCategories = await apiClient.getCategories();
      return dbCategories.map(this.adaptCategory);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  // Obtener todos los productos
  static async getProducts(params?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    search?: string;
  }): Promise<Product[]> {
    try {
      const dbProducts = await apiClient.getProducts(params);
      return dbProducts.map(this.adaptProduct);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Obtener productos destacados
  static async getFeaturedProducts(): Promise<Product[]> {
    try {
      // Usar el API endpoint que ya tiene la lógica de variantes
      const response = await fetch("/api/products?featured=true&limit=8");

      if (!response.ok) {
        throw new Error("Failed to fetch featured products");
      }

      const data = await response.json();
      return (data || []).map((product: any) => this.adaptProduct(product));
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }
  }

  // Obtener un producto por ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const dbProduct = await apiClient.getProduct(id);
      return dbProduct ? this.adaptProduct(dbProduct) : null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  // Obtener órdenes de un usuario con información completa
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`/api/orders?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  }
}
