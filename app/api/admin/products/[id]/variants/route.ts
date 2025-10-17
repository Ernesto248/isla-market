import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import type { CreateProductVariantDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

// Crear cliente de Supabase con Service Role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * GET /api/admin/products/[id]/variants
 * Lista todas las variantes de un producto con sus atributos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const productId = params.id;

    // Verificar que el producto existe
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, has_variants")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Obtener variantes con sus atributos
    const { data: variants, error } = await supabaseAdmin
      .from("product_variants")
      .select(
        `
        *,
        product_variant_attributes (
          id,
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
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching variants:", error);
      return NextResponse.json(
        { error: "Failed to fetch variants" },
        { status: 500 }
      );
    }

    return NextResponse.json(variants || []);
  } catch (error) {
    console.error("Error in GET /api/admin/products/[id]/variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[id]/variants
 * Crea una nueva variante para el producto
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const productId = params.id;
    const body: CreateProductVariantDTO = await request.json();

    // Validar campos requeridos
    if (!body.sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { error: "Price cannot be negative" },
        { status: 400 }
      );
    }

    if (body.stock_quantity !== undefined && body.stock_quantity < 0) {
      return NextResponse.json(
        { error: "Stock quantity cannot be negative" },
        { status: 400 }
      );
    }

    // Verificar que el producto existe y tiene has_variants = true
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, has_variants")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.has_variants) {
      return NextResponse.json(
        {
          error:
            "Product does not support variants. Set has_variants to true first.",
        },
        { status: 400 }
      );
    }

    // Verificar que el SKU no existe
    const { data: existingSku } = await supabaseAdmin
      .from("product_variants")
      .select("id")
      .eq("sku", body.sku)
      .single();

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      );
    }

    // Si se proporcionan attribute_value_ids, validarlos
    let attributeValues = null;
    if (body.attribute_value_ids && body.attribute_value_ids.length > 0) {
      // Verificar que todos los attribute_value_ids existen y están activos
      const { data: attrVals, error: attrError } = await supabaseAdmin
        .from("product_attribute_values")
        .select("id, attribute_id")
        .in("id", body.attribute_value_ids)
        .eq("is_active", true);

      if (
        attrError ||
        !attrVals ||
        attrVals.length !== body.attribute_value_ids.length
      ) {
        return NextResponse.json(
          { error: "One or more attribute values are invalid or inactive" },
          { status: 400 }
        );
      }

      attributeValues = attrVals;

      // Verificar que no hay valores duplicados del mismo atributo
      const attributeIds = attributeValues.map((av) => av.attribute_id);
      const uniqueAttributeIds = new Set(attributeIds);
      if (uniqueAttributeIds.size !== attributeIds.length) {
        return NextResponse.json(
          { error: "Cannot have multiple values from the same attribute" },
          { status: 400 }
        );
      }

      // Verificar que no existe una variante con la misma combinación de atributos
      const { data: existingVariants } = await supabaseAdmin
        .from("product_variants")
        .select(
          `
          id,
          product_variant_attributes (
            attribute_value_id
          )
        `
        )
        .eq("product_id", productId);

      if (existingVariants) {
        for (const variant of existingVariants) {
          const variantValueIds = variant.product_variant_attributes
            .map((pva: any) => pva.attribute_value_id)
            .sort();
          const newValueIds = [...body.attribute_value_ids].sort();

          if (JSON.stringify(variantValueIds) === JSON.stringify(newValueIds)) {
            return NextResponse.json(
              {
                error:
                  "A variant with this combination of attributes already exists",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Crear la variante
    const { data: variant, error: variantError } = await supabaseAdmin
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: body.sku,
        price: body.price,
        stock_quantity: body.stock_quantity || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        variant_name: body.variant_name || null,
        color: body.color || null,
        attributes_display: body.attributes_display || null,
      })
      .select()
      .single();

    if (variantError || !variant) {
      console.error("Error creating variant:", variantError);
      return NextResponse.json(
        { error: "Failed to create variant" },
        { status: 500 }
      );
    }

    // Crear las relaciones con los atributos (solo si se proporcionaron)
    if (body.attribute_value_ids && body.attribute_value_ids.length > 0) {
      const variantAttributes = body.attribute_value_ids.map((valueId) => ({
        variant_id: variant.id,
        attribute_value_id: valueId,
      }));

      const { error: relationError } = await supabaseAdmin
        .from("product_variant_attributes")
        .insert(variantAttributes);

      if (relationError) {
        // Si falla, eliminar la variante creada
        await supabaseAdmin
          .from("product_variants")
          .delete()
          .eq("id", variant.id);

        console.error("Error creating variant attributes:", relationError);
        return NextResponse.json(
          { error: "Failed to create variant attributes" },
          { status: 500 }
        );
      }
    }

    // Obtener la variante completa con sus atributos
    const { data: fullVariant } = await supabaseAdmin
      .from("product_variants")
      .select(
        `
        *,
        product_variant_attributes (
          id,
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
      .eq("id", variant.id)
      .single();

    return NextResponse.json(fullVariant, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products/[id]/variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
