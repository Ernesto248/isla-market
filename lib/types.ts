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
  has_variants: boolean | null; // NUEVO: Indica si el producto tiene variantes
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
  variant_id?: string | null; // ID de la variante seleccionada (si aplica)
  variant?: ProductVariant | null; // Información de la variante (para mostrar en UI)
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
  delivery_type: "home_delivery" | "store_pickup"; // NUEVO: Tipo de entrega
  shipping_fee: number; // NUEVO: Cargo adicional por envío
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
    street?: string; // Opcional para store_pickup
    house_number?: string; // Opcional para store_pickup
    between_streets?: string; // Opcional para store_pickup
    neighborhood?: string; // Opcional para store_pickup
    province?: string; // Opcional para store_pickup
  };
  // Información del referidor (si aplica)
  referrer?: {
    referral_code: string;
    referrer_name: string;
    referrer_email: string;
  } | null;
  // Items de la orden
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null; // NUEVO: ID de la variante (si aplica)
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
  // Datos de la variante (del JOIN) - NUEVO
  variant?: {
    id: string;
    sku: string | null;
    price: number;
    image_url: string | null;
    attributes_display: string | null; // "11 litros", "2 Ton • Negro", etc.
  } | null;
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

// ========================================
// TIPOS PARA SISTEMA DE VARIANTES DE PRODUCTOS
// ========================================

/**
 * Atributo de producto (ej: "Capacidad", "Color", "Tonelaje")
 * Define los TIPOS de características que pueden variar en un producto
 */
export interface ProductAttribute {
  id: string;
  name: string; // Nombre técnico único (ej: "capacidad")
  display_name: string; // Nombre para mostrar en UI (ej: "Capacidad del Refrigerador")
  display_order: number; // Orden de visualización (menor = primero)
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relación opcional con sus valores
  values?: ProductAttributeValue[];
}

/**
 * Valor específico de un atributo (ej: "9 litros", "Blanco", "1 tonelada")
 * Define las OPCIONES disponibles para cada tipo de atributo
 */
export interface ProductAttributeValue {
  id: string;
  attribute_id: string; // FK a product_attributes
  value: string; // Valor específico (ej: "9 litros")
  display_order: number; // Orden de visualización dentro del atributo
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relación opcional con el atributo padre
  attribute?: ProductAttribute;
}

/**
 * Atributo con su valor para una variante específica (para UI del cliente)
 * Simplifica el acceso a nombre de atributo y valor sin hacer múltiples joins
 */
export interface VariantAttributeInfo {
  attribute_name: string; // Ej: "Capacidad"
  attribute_id: string;
  value_name: string; // Ej: "9 litros"
  value_id: string;
}

/**
 * Variante específica de un producto con precio y stock individual
 * Representa una combinación única de valores de atributos
 * Ejemplo: "Refrigerador X - 9 litros + Blanco"
 */
export interface ProductVariant {
  id: string;
  product_id: string; // FK a products
  sku: string | null; // SKU único de la variante (ej: "REF-X-9L-WHITE")
  price: number; // Precio específico de esta variante
  stock_quantity: number; // Stock disponible de esta variante
  image_url: string | null; // Imagen específica (opcional, NULL usa las del producto)
  display_order: number; // Orden de visualización
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Campos para sistema ultra-simple (sin atributos estructurados)
  variant_name?: string | null; // Ej: "11 Litros", "1 Tonelada"
  color?: string | null; // Ej: "Blanco", "Negro"
  // Relaciones opcionales
  product?: Product; // Producto padre
  attribute_values?: ProductAttributeValue[]; // Valores de atributos de esta variante
  // Para facilitar el renderizado en UI del cliente
  attributes?: VariantAttributeInfo[]; // Información simplificada de atributos
  attributes_display?: string; // Ej: "9 litros • Blanco"
}

/**
 * Relación N:N entre variantes y valores de atributos
 * Indica qué valores específicos tiene cada variante
 */
export interface ProductVariantAttribute {
  id: string;
  variant_id: string; // FK a product_variants
  attribute_value_id: string; // FK a product_attribute_values
  created_at: string;
  // Relaciones opcionales
  variant?: ProductVariant;
  attribute_value?: ProductAttributeValue;
}

/**
 * Producto completo con todas sus variantes (para admin y cliente)
 * Extiende Product e incluye toda la información de variantes
 */
export interface ProductWithVariants extends Product {
  has_variants: boolean; // Indica si el producto tiene variantes
  variants: ProductVariant[]; // Array de variantes del producto
  attributes: ProductAttribute[]; // Atributos disponibles para este producto
}

/**
 * Datos para crear un nuevo atributo (Admin)
 */
export interface CreateAttributeData {
  name: string;
  display_name: string;
  display_order?: number;
}

/**
 * Datos para actualizar un atributo existente (Admin)
 */
export interface UpdateAttributeData {
  name?: string;
  display_name?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Datos para crear un nuevo valor de atributo (Admin)
 */
export interface CreateAttributeValueData {
  attribute_id: string;
  value: string;
  display_order?: number;
}

/**
 * Datos para crear una nueva variante (Admin)
 */
export interface CreateVariantData {
  product_id: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  attribute_value_ids: string[]; // IDs de los valores de atributos
  display_order?: number;
  is_active?: boolean;
  // Campos adicionales para variantes simples
  variant_name?: string;
  color?: string;
  attributes_display?: string;
}

/**
 * Datos para actualizar una variante existente (Admin)
 */
export interface UpdateVariantData {
  sku?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  attribute_value_ids?: string[]; // IDs de los valores de atributos
  display_order?: number;
  is_active?: boolean;
  // Campos adicionales para variantes simples
  variant_name?: string;
  color?: string;
  attributes_display?: string;
}

// Aliases para DTOs (Data Transfer Objects) - nombres más explícitos para APIs
export type CreateProductVariantDTO = CreateVariantData;
export type UpdateProductVariantDTO = UpdateVariantData;

/**
 * Datos para crear un producto completo con sus variantes en una sola operación (Admin)
 */
export interface CreateProductWithVariantsData {
  product: {
    name: string;
    slug?: string;
    description?: string;
    category_id: string;
    images?: string[];
    is_active?: boolean;
    featured?: boolean;
  };
  attributes: {
    attribute_id: string;
    value_ids: string[]; // IDs de los valores seleccionados para este atributo
  }[];
  variants: {
    attribute_value_ids: string[]; // Combinación específica de valores
    price: number;
    stock_quantity: number;
    sku?: string;
    image_url?: string;
  }[];
}

/**
 * CartItem incluye variante opcionalmente
 * Ya no necesitamos CartItemWithVariant
 */
