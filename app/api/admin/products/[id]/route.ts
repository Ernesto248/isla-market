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

// GET - Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { data: product, error } = await supabaseAdmin
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
          image_url,
          attributes_display,
          is_active,
          display_order,
          variant_name,
          color
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json(
        { error: "Product not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error in GET /api/admin/products/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    // Actualizar producto
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(category_id !== undefined && { category_id }),
        ...(images !== undefined && { images }),
        ...(stock_quantity !== undefined && { stock_quantity }),
        ...(is_active !== undefined && { is_active }),
        ...(featured !== undefined && { featured }),
        ...(has_variants !== undefined && { has_variants }),
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
      return NextResponse.json(
        { error: "Failed to update product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error in PUT /api/admin/products/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Verificar si el producto tiene órdenes asociadas
    const { data: orderItems, error: orderError } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("product_id", params.id)
      .limit(1);

    if (orderError) {
      console.error("Error checking orders:", orderError);
      return NextResponse.json(
        { error: "Failed to check product orders" },
        { status: 500 }
      );
    }

    // Si tiene órdenes, solo desactivar en lugar de eliminar
    if (orderItems && orderItems.length > 0) {
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single();

      if (error) {
        console.error("Error deactivating product:", error);
        return NextResponse.json(
          { error: "Failed to deactivate product" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Product has orders, it was deactivated instead of being deleted",
        product,
      });
    }

    // Si no tiene órdenes, eliminar permanentemente
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/products/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
