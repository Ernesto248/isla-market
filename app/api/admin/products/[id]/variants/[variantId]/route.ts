import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import type { UpdateProductVariantDTO } from "@/lib/types";

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
 * GET /api/admin/products/[id]/variants/[variantId]
 * Obtiene una variante específica con sus atributos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const { id: productId, variantId } = params;

    // Obtener la variante con sus atributos
    const { data: variant, error } = await supabaseAdmin
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
      .eq("id", variantId)
      .eq("product_id", productId)
      .single();

    if (error || !variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error(
      "Error in GET /api/admin/products/[id]/variants/[variantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]/variants/[variantId]
 * Actualiza una variante existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const { id: productId, variantId } = params;
    const body: UpdateProductVariantDTO = await request.json();

    // Validaciones
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

    // Verificar que la variante existe
    const { data: existingVariant, error: existsError } = await supabaseAdmin
      .from("product_variants")
      .select("id, sku, product_id")
      .eq("id", variantId)
      .eq("product_id", productId)
      .single();

    if (existsError || !existingVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Si se está actualizando el SKU, verificar que no exista
    if (body.sku && body.sku !== existingVariant.sku) {
      const { data: duplicateSku } = await supabaseAdmin
        .from("product_variants")
        .select("id")
        .eq("sku", body.sku)
        .neq("id", variantId)
        .single();

      if (duplicateSku) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Si se están actualizando los atributos
    if (body.attribute_value_ids && body.attribute_value_ids.length > 0) {
      // Verificar que todos los attribute_value_ids existen y están activos
      const { data: attributeValues, error: attrError } = await supabaseAdmin
        .from("product_attribute_values")
        .select("id, attribute_id")
        .in("id", body.attribute_value_ids)
        .eq("is_active", true);

      if (
        attrError ||
        !attributeValues ||
        attributeValues.length !== body.attribute_value_ids.length
      ) {
        return NextResponse.json(
          { error: "One or more attribute values are invalid or inactive" },
          { status: 400 }
        );
      }

      // Verificar que no hay valores duplicados del mismo atributo
      const attributeIds = attributeValues.map((av) => av.attribute_id);
      const uniqueAttributeIds = new Set(attributeIds);
      if (uniqueAttributeIds.size !== attributeIds.length) {
        return NextResponse.json(
          { error: "Cannot have multiple values from the same attribute" },
          { status: 400 }
        );
      }

      // Verificar que no existe otra variante con la misma combinación
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
        .eq("product_id", productId)
        .neq("id", variantId);

      if (existingVariants) {
        const newValueIds = [...body.attribute_value_ids].sort();

        for (const variant of existingVariants) {
          const variantValueIds = variant.product_variant_attributes
            .map((pva: any) => pva.attribute_value_id)
            .sort();

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

      // Eliminar las relaciones actuales
      await supabaseAdmin
        .from("product_variant_attributes")
        .delete()
        .eq("variant_id", variantId);

      // Crear las nuevas relaciones
      const variantAttributes = body.attribute_value_ids.map(
        (valueId: string) => ({
          variant_id: variantId,
          attribute_value_id: valueId,
        })
      );

      const { error: relationError } = await supabaseAdmin
        .from("product_variant_attributes")
        .insert(variantAttributes);

      if (relationError) {
        console.error("Error updating variant attributes:", relationError);
        return NextResponse.json(
          { error: "Failed to update variant attributes" },
          { status: 500 }
        );
      }
    }

    // Actualizar la variante
    const updateData: any = {};
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.stock_quantity !== undefined)
      updateData.stock_quantity = body.stock_quantity;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.variant_name !== undefined)
      updateData.variant_name = body.variant_name;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.attributes_display !== undefined)
      updateData.attributes_display = body.attributes_display;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("product_variants")
        .update(updateData)
        .eq("id", variantId);

      if (updateError) {
        console.error("Error updating variant:", updateError);
        return NextResponse.json(
          { error: "Failed to update variant" },
          { status: 500 }
        );
      }
    }

    // Obtener la variante actualizada con sus atributos
    const { data: updatedVariant } = await supabaseAdmin
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
      .eq("id", variantId)
      .single();

    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error(
      "Error in PUT /api/admin/products/[id]/variants/[variantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]/variants/[variantId]
 * Elimina una variante (solo si no hay órdenes asociadas)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const { id: productId, variantId } = params;

    // Verificar que la variante existe
    const { data: variant, error: existsError } = await supabaseAdmin
      .from("product_variants")
      .select("id")
      .eq("id", variantId)
      .eq("product_id", productId)
      .single();

    if (existsError || !variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Verificar que no hay órdenes con esta variante
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("variant_id", variantId)
      .limit(1);

    if (ordersError) {
      console.error("Error checking orders:", ordersError);
      return NextResponse.json(
        { error: "Failed to check orders" },
        { status: 500 }
      );
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete variant with existing orders. Consider marking it as inactive instead.",
        },
        { status: 400 }
      );
    }

    // Eliminar la variante (las relaciones se eliminan por CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (deleteError) {
      console.error("Error deleting variant:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete variant" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in DELETE /api/admin/products/[id]/variants/[variantId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
