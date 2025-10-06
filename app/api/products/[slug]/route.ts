import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Obtener el producto por slug con su categoría
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (
          id,
          name,
          slug,
          description,
          image_url
        )
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener productos relacionados de la misma categoría
    const { data: relatedProducts, error: relatedError } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        description,
        price,
        images,
        stock_quantity,
        featured
      `
      )
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(4);

    if (relatedError) {
      console.error("Error fetching related products:", relatedError);
    }

    return NextResponse.json({
      product,
      relatedProducts: relatedProducts || [],
    });
  } catch (error) {
    console.error("Error in product API:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}
