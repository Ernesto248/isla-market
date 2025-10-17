import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");

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
          price,
          stock_quantity,
          is_active
        )
      `
      )
      .eq("is_active", true);

    // Filtros
    if (category) {
      query = query.eq("category_id", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order("created_at", { ascending: false });

    // Límite
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: products, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Procesar productos para calcular precio mínimo de variantes
    const processedProducts =
      products?.map((product: any) => {
        // Si tiene variantes activas, usar el precio mínimo
        if (product.has_variants && product.product_variants?.length > 0) {
          const activeVariants = product.product_variants.filter(
            (v: any) => v.is_active !== false
          );

          if (activeVariants.length > 0) {
            const minPrice = Math.min(
              ...activeVariants.map((v: any) => v.price)
            );
            return {
              ...product,
              price: minPrice, // Mostrar precio mínimo
              _originalPrice: product.price, // Guardar precio original por si acaso
            };
          }
        }

        // Si no tiene variantes o no hay activas, devolver tal cual
        return product;
      }) || [];

    // Si se solicitan productos destacados, filtrar por featured
    let filteredProducts = processedProducts;
    if (featured === "true") {
      // Como no tenemos campo featured en la DB, usaremos los primeros productos
      filteredProducts = processedProducts?.slice(0, 4) || [];
    }

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const body = await request.json();
    const {
      name,
      description,
      price,
      category_id,
      images,
      stock_quantity,
      weight,
      dimensions,
    } = body;

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: "Name, price, and category_id are required" },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert([
        {
          name,
          description,
          price,
          category_id,
          images: images || [],
          stock_quantity: stock_quantity || 0,
          weight,
          dimensions,
          is_active: true,
        },
      ])
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
