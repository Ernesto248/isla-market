import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attributes/[id]/values/[valueId]
 * Obtiene un valor específico de un atributo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id, valueId } = params;

    const { data: value, error } = await supabaseAdmin
      .from("product_attribute_values")
      .select("*")
      .eq("id", valueId)
      .eq("attribute_id", id)
      .single();

    if (error || !value) {
      return NextResponse.json(
        { error: "Valor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(value);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al obtener valor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/attributes/[id]/values/[valueId]
 * Actualiza un valor de atributo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id, valueId } = params;
    const body = await request.json();

    // Verificar que el valor existe
    const { data: existing } = await supabaseAdmin
      .from("product_attribute_values")
      .select("id, value")
      .eq("id", valueId)
      .eq("attribute_id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Valor no encontrado" },
        { status: 404 }
      );
    }

    // Si se actualiza el valor, verificar que no existe otro con el mismo valor
    if (body.value && body.value !== existing.value) {
      const { data: duplicate } = await supabaseAdmin
        .from("product_attribute_values")
        .select("id")
        .eq("attribute_id", id)
        .eq("value", body.value.trim())
        .neq("id", valueId)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: `Ya existe el valor "${body.value}" para este atributo` },
          { status: 409 }
        );
      }
    }

    // Actualizar el valor
    const { data: value, error } = await supabaseAdmin
      .from("product_attribute_values")
      .update({
        ...(body.value && { value: body.value.trim() }),
        ...(body.display_order !== undefined && {
          display_order: body.display_order,
        }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
      })
      .eq("id", valueId)
      .eq("attribute_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating value:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(value);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al actualizar valor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/attributes/[id]/values/[valueId]
 * Elimina un valor de atributo (solo si no está en uso)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id, valueId } = params;

    // Verificar que el valor existe
    const { data: value } = await supabaseAdmin
      .from("product_attribute_values")
      .select("id, value")
      .eq("id", valueId)
      .eq("attribute_id", id)
      .single();

    if (!value) {
      return NextResponse.json(
        { error: "Valor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si está en uso en alguna variante
    const { data: inUse } = await supabaseAdmin
      .from("product_variant_attributes")
      .select("id")
      .eq("attribute_value_id", valueId)
      .limit(1);

    if (inUse && inUse.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el valor porque está siendo usado en variantes de productos",
        },
        { status: 409 }
      );
    }

    // Eliminar el valor
    const { error } = await supabaseAdmin
      .from("product_attribute_values")
      .delete()
      .eq("id", valueId)
      .eq("attribute_id", id);

    if (error) {
      console.error("Error deleting value:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Valor eliminado exitosamente",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al eliminar valor" },
      { status: 500 }
    );
  }
}
