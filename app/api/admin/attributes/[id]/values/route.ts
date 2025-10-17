import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { CreateAttributeValueData } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attributes/[id]/values
 * Lista todos los valores de un atributo específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") === "true";

    // Verificar que el atributo existe
    const { data: attribute } = await supabaseAdmin
      .from("product_attributes")
      .select("id, name, display_name")
      .eq("id", id)
      .single();

    if (!attribute) {
      return NextResponse.json(
        { error: "Atributo no encontrado" },
        { status: 404 }
      );
    }

    // Obtener valores
    let query = supabaseAdmin
      .from("product_attribute_values")
      .select("*")
      .eq("attribute_id", id);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    query = query.order("display_order", { ascending: true });

    const { data: values, error } = await query;

    if (error) {
      console.error("Error fetching attribute values:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(values || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al obtener valores del atributo" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/attributes/[id]/values
 * Crea un nuevo valor para el atributo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { id } = params;
    const body: CreateAttributeValueData = await request.json();

    // Validaciones
    if (!body.value) {
      return NextResponse.json(
        { error: "El campo 'value' es requerido" },
        { status: 400 }
      );
    }

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

    // Verificar si ya existe un valor igual para este atributo
    const { data: existing } = await supabaseAdmin
      .from("product_attribute_values")
      .select("id")
      .eq("attribute_id", id)
      .eq("value", body.value.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe el valor "${body.value}" para este atributo` },
        { status: 409 }
      );
    }

    // Crear el valor
    const { data: value, error } = await supabaseAdmin
      .from("product_attribute_values")
      .insert({
        attribute_id: id,
        value: body.value.trim(),
        display_order: body.display_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating attribute value:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al crear valor del atributo" },
      { status: 500 }
    );
  }
}
