// API client para consumir las rutas de Supabase
export class ApiClient {
  private baseUrl: string;

  constructor() {
    // En producción, usar rutas relativas o detectar automáticamente
    // En desarrollo, usar localhost
    if (typeof window !== "undefined") {
      // Cliente side: usar el origen actual
      this.baseUrl = window.location.origin;
    } else {
      // Server side: usar rutas relativas o localhost en dev
      this.baseUrl =
        process.env.NODE_ENV === "production"
          ? "" // Rutas relativas en producción
          : "http://localhost:3000";
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Categories
  async getCategories() {
    return this.request<any[]>("/categories");
  }

  async getCategory(id: string) {
    return this.request<any>(`/categories/${id}`);
  }

  async createCategory(category: any) {
    return this.request<any>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: any) {
    return this.request<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Products
  async getProducts(params?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.append("category", params.category);
    if (params?.featured) searchParams.append("featured", "true");
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);

    const query = searchParams.toString();
    const endpoint = query ? `/products?${query}` : "/products";

    return this.request<any[]>(endpoint);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request<any>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any) {
    return this.request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Orders
  async getOrders(params?: { userId?: string; status?: string }) {
    const searchParams = new URLSearchParams();

    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.status) searchParams.append("status", params.status);

    const query = searchParams.toString();
    const endpoint = query ? `/orders?${query}` : "/orders";

    return this.request<any[]>(endpoint);
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(order: any) {
    return this.request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  async updateOrder(id: string, order: any) {
    return this.request<any>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Hooks para React Query (opcional, para cache y estado)
export const useCategories = () => {
  // Aquí podrías usar React Query o SWR para cache
  return apiClient.getCategories();
};

export const useProducts = (
  params?: Parameters<typeof apiClient.getProducts>[0]
) => {
  return apiClient.getProducts(params);
};

export const useOrders = (
  params?: Parameters<typeof apiClient.getOrders>[0]
) => {
  return apiClient.getOrders(params);
};
