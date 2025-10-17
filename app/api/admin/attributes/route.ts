import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { CreateAttributeData } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attributes
 * Lista todos los atributos con sus valores
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const includeValues = searchParams.get("include_values") !== "false"; // Por defecto true
    const activeOnly = searchParams.get("active_only") === "true"; // Por defecto false

    // Query base
    let selectQuery = `
      *
      ${
        includeValues
          ? `,
      product_attribute_values (
        *
      )`
          : ""
      }
    `;

    let query = supabaseAdmin.from("product_attributes").select(selectQuery);

    // Filtrar solo activos si se solicita
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    // Ordenar por display_order
    query = query.order("display_order", { ascending: true });

    const { data: attributes, error } = await query;

    if (error) {
      console.error("Error fetching attributes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si se incluyen valores, ordenarlos también
    const attributesWithSortedValues = (attributes as any)?.map(
      (attr: any) => ({
        ...attr,
        values: attr.product_attribute_values
          ? [...attr.product_attribute_values].sort(
              (a: any, b: any) => a.display_order - b.display_order
            )
          : undefined,
        product_attribute_values: undefined, // Limpiar el campo con nombre largo
      })
    );

    return NextResponse.json(attributesWithSortedValues || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al obtener atributos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/attributes
 * Crea un nuevo atributo
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const body: CreateAttributeData = await request.json();

    // Validaciones
    if (!body.name || !body.display_name) {
      return NextResponse.json(
        { error: "name y display_name son requeridos" },
        { status: 400 }
      );
    }

    // Normalizar el nombre (lowercase, sin espacios)
    const normalizedName = body.name.toLowerCase().trim().replace(/\s+/g, "_");

    // Verificar si ya existe un atributo con ese nombre
    const { data: existing } = await supabaseAdmin
      .from("product_attributes")
      .select("id")
      .eq("name", normalizedName)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un atributo con el nombre "${normalizedName}"` },
        { status: 409 }
      );
    }

    // Crear el atributo
    const { data: attribute, error } = await supabaseAdmin
      .from("product_attributes")
      .insert({
        name: normalizedName,
        display_name: body.display_name,
        display_order: body.display_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating attribute:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(attribute, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error al crear atributo" },
      { status: 500 }
    );
  }
}
