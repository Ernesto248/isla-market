import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        users (
          id,
          email,
          full_name
        ),
        shipping_addresses (
          *
        ),
        order_items (
          *,
          products (
            id,
            name,
            price,
            images
          )
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("📦 [API] Orden encontrada:", {
      id: order.id,
      itemsCount: order.order_items?.length || 0,
      items: order.order_items,
    });

    return NextResponse.json(order);
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
    const { status, notes } = body;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(
        `
        *,
        users (
          id,
          email,
          full_name
        ),
        shipping_addresses (
          *
        ),
        order_items (
          *,
          products (
            id,
            name,
            price,
            images
          )
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
