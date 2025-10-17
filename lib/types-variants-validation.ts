// ========================================
// VALIDACIÓN DE TIPOS - SISTEMA DE VARIANTES
// Este archivo demuestra el uso correcto de los tipos
// ========================================

import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductVariant,
  ProductWithVariants,
  CreateProductWithVariantsData,
  CartItem, // CAMBIADO: CartItem ahora incluye variant opcionalmente
} from "@/lib/types";

// ========================================
// EJEMPLO 1: Atributo "Capacidad"
// ========================================

const capacidadAttribute: ProductAttribute = {
  id: "attr-001",
  name: "capacidad",
  display_name: "Capacidad",
  display_order: 1,
  is_active: true,
  created_at: "2025-10-17T00:00:00Z",
  updated_at: "2025-10-17T00:00:00Z",
  values: [
    {
      id: "val-001",
      attribute_id: "attr-001",
      value: "9 litros",
      display_order: 1,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
    {
      id: "val-002",
      attribute_id: "attr-001",
      value: "11 litros",
      display_order: 2,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
    {
      id: "val-003",
      attribute_id: "attr-001",
      value: "17 litros",
      display_order: 3,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
  ],
};

// ========================================
// EJEMPLO 2: Atributo "Color"
// ========================================

const colorAttribute: ProductAttribute = {
  id: "attr-002",
  name: "color",
  display_name: "Color",
  display_order: 2,
  is_active: true,
  created_at: "2025-10-17T00:00:00Z",
  updated_at: "2025-10-17T00:00:00Z",
  values: [
    {
      id: "val-004",
      attribute_id: "attr-002",
      value: "Blanco",
      display_order: 1,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
    {
      id: "val-005",
      attribute_id: "attr-002",
      value: "Negro",
      display_order: 2,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
  ],
};

// ========================================
// EJEMPLO 3: Variante "9L + Blanco"
// ========================================

const variant9LBlanco: ProductVariant = {
  id: "var-001",
  product_id: "prod-001",
  sku: "REF-X-9L-WHITE",
  price: 500.0,
  stock_quantity: 10,
  image_url: null, // Usa las imágenes del producto padre
  display_order: 1,
  is_active: true,
  created_at: "2025-10-17T00:00:00Z",
  updated_at: "2025-10-17T00:00:00Z",
  attribute_values: [
    {
      id: "val-001",
      attribute_id: "attr-001",
      value: "9 litros",
      display_order: 1,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
    {
      id: "val-004",
      attribute_id: "attr-002",
      value: "Blanco",
      display_order: 1,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
    },
  ],
  attributes_display: "9 litros • Blanco",
};

// ========================================
// EJEMPLO 4: Producto completo con variantes
// ========================================

const refrigeradorConVariantes: ProductWithVariants = {
  id: "prod-001",
  name: "Refrigerador Marca X",
  slug: "refrigerador-marca-x",
  description:
    "Mini refrigerador compacto perfecto para oficinas y dormitorios",
  price: 500.0, // Precio base (mínimo de las variantes)
  category_id: "cat-001",
  images: [
    "https://example.com/refrigerador-1.jpg",
    "https://example.com/refrigerador-2.jpg",
  ],
  stock_quantity: null, // NULL porque el stock está en las variantes
  is_active: true,
  featured: true,
  has_variants: true, // IMPORTANTE: Indica que tiene variantes
  created_at: "2025-10-17T00:00:00Z",
  updated_at: "2025-10-17T00:00:00Z",

  // Variantes del producto
  variants: [
    {
      id: "var-001",
      product_id: "prod-001",
      sku: "REF-X-9L-WHITE",
      price: 500.0,
      stock_quantity: 10,
      image_url: null,
      display_order: 1,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
      attributes_display: "9 litros • Blanco",
    },
    {
      id: "var-002",
      product_id: "prod-001",
      sku: "REF-X-9L-BLACK",
      price: 520.0,
      stock_quantity: 5,
      image_url: null,
      display_order: 2,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
      attributes_display: "9 litros • Negro",
    },
    {
      id: "var-003",
      product_id: "prod-001",
      sku: "REF-X-11L-WHITE",
      price: 650.0,
      stock_quantity: 8,
      image_url: null,
      display_order: 3,
      is_active: true,
      created_at: "2025-10-17T00:00:00Z",
      updated_at: "2025-10-17T00:00:00Z",
      attributes_display: "11 litros • Blanco",
    },
  ],

  // Atributos disponibles
  attributes: [capacidadAttribute, colorAttribute],
};

// ========================================
// EJEMPLO 5: Crear producto con variantes (Admin)
// ========================================

const crearProductoConVariantes: CreateProductWithVariantsData = {
  product: {
    name: "Split Aire Acondicionado",
    slug: "split-aire-acondicionado",
    description: "Split inverter de alta eficiencia energética",
    category_id: "cat-002",
    images: [
      "https://example.com/split-1.jpg",
      "https://example.com/split-2.jpg",
    ],
    is_active: true,
    featured: false,
  },
  attributes: [
    {
      attribute_id: "attr-003", // Tonelaje
      value_ids: ["val-010", "val-011"], // ["1 tonelada", "2 toneladas"]
    },
    {
      attribute_id: "attr-002", // Color
      value_ids: ["val-004", "val-005"], // ["Blanco", "Negro"]
    },
  ],
  variants: [
    {
      attribute_value_ids: ["val-010", "val-004"], // 1 ton + Blanco
      price: 1200.0,
      stock_quantity: 5,
      sku: "SPLIT-1T-WHITE",
    },
    {
      attribute_value_ids: ["val-010", "val-005"], // 1 ton + Negro
      price: 1250.0,
      stock_quantity: 3,
      sku: "SPLIT-1T-BLACK",
    },
    {
      attribute_value_ids: ["val-011", "val-004"], // 2 ton + Blanco
      price: 1800.0,
      stock_quantity: 2,
      sku: "SPLIT-2T-WHITE",
    },
    {
      attribute_value_ids: ["val-011", "val-005"], // 2 ton + Negro
      price: 1850.0,
      stock_quantity: 1,
      sku: "SPLIT-2T-BLACK",
    },
  ],
};

// ========================================
// EJEMPLO 6: Item del carrito con variante
// ========================================

const itemCarritoConVariante: CartItem = {
  product: {
    id: "prod-001",
    name: "Refrigerador Marca X",
    slug: "refrigerador-marca-x",
    description: "Mini refrigerador compacto",
    price: 500.0,
    category_id: "cat-001",
    images: ["https://example.com/refrigerador-1.jpg"],
    stock_quantity: null,
    is_active: true,
    featured: true,
    has_variants: true,
    created_at: "2025-10-17T00:00:00Z",
    updated_at: "2025-10-17T00:00:00Z",
  },
  quantity: 2,
  variant: variant9LBlanco, // Variante específica seleccionada
  variant_id: "var-001", // Para persistir en la orden
};

// ========================================
// EJEMPLO 7: Funciones helper útiles
// ========================================

/**
 * Genera el string de visualización de atributos de una variante
 * Ejemplo: "9 litros • Blanco"
 */
function getVariantDisplayString(variant: ProductVariant): string {
  if (!variant.attribute_values || variant.attribute_values.length === 0) {
    return "";
  }

  return variant.attribute_values.map((av) => av.value).join(" • ");
}

/**
 * Encuentra la variante que coincide con la selección de atributos
 */
function findMatchingVariant(
  product: ProductWithVariants,
  selectedAttributeValues: string[] // IDs de attribute_values
): ProductVariant | null {
  return (
    product.variants.find((variant) => {
      const variantValueIds =
        variant.attribute_values?.map((av) => av.id) || [];
      return (
        variantValueIds.length === selectedAttributeValues.length &&
        variantValueIds.every((id) => selectedAttributeValues.includes(id))
      );
    }) || null
  );
}

/**
 * Obtiene el rango de precios de un producto con variantes
 */
function getPriceRange(product: ProductWithVariants): {
  min: number;
  max: number;
} {
  const prices = product.variants.map((v) => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Verifica si una variante está disponible (tiene stock)
 */
function isVariantAvailable(variant: ProductVariant): boolean {
  return variant.is_active && variant.stock_quantity > 0;
}

/**
 * Obtiene el stock total de todas las variantes
 */
function getTotalStock(product: ProductWithVariants): number {
  return product.variants.reduce(
    (total, variant) => total + variant.stock_quantity,
    0
  );
}

// ========================================
// VALIDACIÓN DE TIPOS
// ========================================

// Estos ejemplos demuestran que los tipos están correctamente definidos
// Si TypeScript compila este archivo sin errores, los tipos son válidos

export {
  capacidadAttribute,
  colorAttribute,
  variant9LBlanco,
  refrigeradorConVariantes,
  crearProductoConVariantes,
  itemCarritoConVariante,
  getVariantDisplayString,
  findMatchingVariant,
  getPriceRange,
  isVariantAvailable,
  getTotalStock,
};
