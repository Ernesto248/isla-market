import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

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

// GET - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id");
    const isActive = searchParams.get("is_active");

    // Construir query con variantes
    let query = supabaseAdmin
      .from("products")
      .select(
        `
        *,
        categories (
          id,
          name,
          slug
        ),
        product_variants (
          id,
          sku,
          price,
          stock_quantity,
          is_active
        )
      `
      )
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: products, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error in GET /api/admin/products:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      category_id,
      images,
      stock_quantity,
      is_active,
      featured,
      has_variants,
    } = body;

    // Validaciones
    if (!name || price === undefined || !category_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, category_id" },
        { status: 400 }
      );
    }

    // Validar precio: debe ser >= 0, puede ser 0 si tiene variantes
    if (price < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number or zero" },
        { status: 400 }
      );
    }

    // Si no tiene variantes, el precio debe ser mayor a 0
    if (!has_variants && price === 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0 for products without variants" },
        { status: 400 }
      );
    }

    // Crear producto (slug se genera automáticamente por trigger)
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description: description || null,
        price,
        category_id,
        images: images || [],
        stock_quantity: stock_quantity || 0,
        is_active: is_active !== undefined ? is_active : true,
        featured: featured !== undefined ? featured : false,
        has_variants: has_variants || false,
      })
      .select(
        `
        *,
        categories (
          id,
          name,
          slug
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
