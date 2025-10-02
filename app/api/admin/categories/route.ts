import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // 'active', 'inactive', o null (todos)

    let query = supabaseAdmin.from("categories").select("*");

    // Filtro por búsqueda (nombre o descripción)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filtro por estado
    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }
    // Si no hay status, devuelve todas

    // Ordenar por nombre
    query = query.order("name");

    const { data: categories, error } = await query;

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contar productos por categoría
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabaseAdmin
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id);

        return {
          ...category,
          products_count: count || 0,
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
