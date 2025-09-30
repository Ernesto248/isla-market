import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: product, error } = await supabaseAdmin
      .from("products")
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
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      is_active,
      weight,
      dimensions,
    } = body;

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({
        name,
        description,
        price,
        category_id,
        images,
        stock_quantity,
        is_active,
        weight,
        dimensions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
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
      console.error("Error updating product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
