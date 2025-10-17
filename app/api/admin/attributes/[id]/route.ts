import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { UpdateAttributeData } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attributes/[id]
 * Obtiene un atributo específico con sus valores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id } = params;

    const { data: attribute, error } = await supabaseAdmin
      .from("product_attributes")
      .select(
        `
        id,
        name,
        display_name,
        display_order,
        is_active,
        created_at,
        updated_at,
        product_attribute_values:product_attribute_values (
          id,
          attribute_id,
          value,
          display_order,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching attribute:", error);
      return NextResponse.json(
        { error: "Atributo no encontrado" },
        { status: 404 }
      );
    }

    // Ordenar valores por display_order
    const attributeWithSortedValues = {
      ...attribute,
      values: attribute.product_attribute_values
        ? [...attribute.product_attribute_values].sort(
            (a, b) => a.display_order - b.display_order
          )
        : [],
      product_attribute_values: undefined,
    };

    return NextResponse.json(attributeWithSortedValues);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al obtener atributo" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/attributes/[id]
 * Actualiza un atributo existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id } = params;
    const body: UpdateAttributeData = await request.json();

    // Verificar que el atributo existe
    const { data: existing } = await supabaseAdmin
      .from("product_attributes")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Atributo no encontrado" },
        { status: 404 }
      );
    }

    // Si se actualiza el nombre, verificar que no existe otro con ese nombre
    if (body.name && body.name !== existing.name) {
      const normalizedName = body.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

      const { data: duplicate } = await supabaseAdmin
        .from("product_attributes")
        .select("id")
        .eq("name", normalizedName)
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Ya existe otro atributo con el nombre "${normalizedName}"`,
          },
          { status: 409 }
        );
      }

      body.name = normalizedName;
    }

    // Actualizar el atributo
    const { data: attribute, error } = await supabaseAdmin
      .from("product_attributes")
      .update({
        ...(body.name && { name: body.name }),
        ...(body.display_name && { display_name: body.display_name }),
        ...(body.display_order !== undefined && {
          display_order: body.display_order,
        }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating attribute:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al actualizar atributo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/attributes/[id]
 * Elimina un atributo (solo si no tiene variantes asociadas)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id } = params;

    // Verificar que el atributo existe
    const { data: attribute } = await supabaseAdmin
      .from("product_attributes")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!attribute) {
      return NextResponse.json(
        { error: "Atributo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene valores asociados
    const { data: values } = await supabaseAdmin
      .from("product_attribute_values")
      .select("id")
      .eq("attribute_id", id)
      .limit(1);

    if (values && values.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el atributo porque tiene valores asociados. Elimina primero los valores.",
        },
        { status: 409 }
      );
    }

    // Eliminar el atributo
    const { error } = await supabaseAdmin
      .from("product_attributes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting attribute:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Atributo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al eliminar atributo" },
      { status: 500 }
    );
  }
}
