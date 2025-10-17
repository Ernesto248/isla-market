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
        featured,
        has_variants
      `
      )
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(4);

    if (relatedError) {
      console.error("Error fetching related products:", relatedError);
    }

    // Para productos con variantes, obtener el precio mínimo
    const enrichedRelatedProducts = await Promise.all(
      (relatedProducts || []).map(async (prod) => {
        if (prod.has_variants) {
          // Obtener variantes para calcular precio mínimo y stock total
          const { data: variants } = await supabase
            .from("product_variants")
            .select("price, stock_quantity")
            .eq("product_id", prod.id);

          if (variants && variants.length > 0) {
            const minPrice = Math.min(...variants.map((v) => v.price));
            const totalStock = variants.reduce(
              (sum, v) => sum + (v.stock_quantity || 0),
              0
            );
            return {
              ...prod,
              price: minPrice,
              stock_quantity: totalStock,
            };
          }
        }
        return prod;
      })
    );

    return NextResponse.json({
      product,
      relatedProducts: enrichedRelatedProducts,
    });
  } catch (error) {
    console.error("Error in product API:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}
