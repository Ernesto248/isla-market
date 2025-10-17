import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/products/[slug]/variants
 * Obtiene las variantes de un producto para visualización del cliente
 * Incluye información de atributos en formato simplificado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 1. Obtener el producto por slug
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, has_variants")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Si no tiene variantes, retornar array vacío
    if (!product.has_variants) {
      return NextResponse.json([]);
    }

    // 2. Obtener variantes con sus relaciones
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select(
        `
        id,
        product_id,
        sku,
        variant_name,
        color,
        price,
        stock_quantity,
        image_url,
        display_order,
        is_active,
        created_at,
        updated_at,
        product_variant_attributes (
          id,
          attribute_value_id,
          product_attribute_values (
            id,
            value,
            attribute_id,
            product_attributes (
              id,
              name,
              display_name
            )
          )
        )
      `
      )
      .eq("product_id", product.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (variantsError) {
      console.error("Error fetching variants:", variantsError);
      return NextResponse.json(
        { error: "Error al cargar las variantes" },
        { status: 500 }
      );
    }

    // 3. Formatear variantes para el cliente
    const formattedVariants = (variants || []).map((variant: any) => {
      // Extraer información de atributos
      const attributes = (variant.product_variant_attributes || [])
        .map((pva: any) => {
          const attrValue = pva.product_attribute_values;
          if (!attrValue) return null;

          const attr = attrValue.product_attributes;
          if (!attr) return null;

          return {
            attribute_name: attr.display_name || attr.name,
            attribute_id: attr.id,
            value_name: attrValue.value,
            value_id: attrValue.id,
          };
        })
        .filter((attr: any) => attr !== null);

      // Crear display string para los atributos
      const attributes_display = attributes
        .map((attr: any) => attr.value_name)
        .join(" • ");

      return {
        id: variant.id,
        product_id: variant.product_id,
        sku: variant.sku,
        variant_name: variant.variant_name, // NUEVO: Nombre de variante
        color: variant.color, // NUEVO: Color
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        image_url: variant.image_url,
        display_order: variant.display_order,
        is_active: variant.is_active,
        created_at: variant.created_at,
        updated_at: variant.updated_at,
        attributes, // Array de VariantAttributeInfo
        attributes_display, // String formateado
      };
    });

    return NextResponse.json(formattedVariants);
  } catch (error) {
    console.error("Error in GET /api/products/[slug]/variants:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
