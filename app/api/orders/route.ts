import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");

    let query = supabaseAdmin
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
      .order("created_at", { ascending: false });

    // Filtros
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (sessionId) {
      query = query.eq("stripe_session_id", sessionId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformar los datos al formato esperado
    const transformedOrders =
      orders?.map((order: any) => ({
        ...order,
        email: order.users?.email,
        full_name: order.users?.full_name,
        recipientInfo: order.shipping_addresses
          ? {
              first_name: order.shipping_addresses.first_name,
              last_name: order.shipping_addresses.last_name,
              phone: order.shipping_addresses.phone,
              street: order.shipping_addresses.street,
              house_number: order.shipping_addresses.house_number,
              between_streets: order.shipping_addresses.between_streets,
              neighborhood: order.shipping_addresses.neighborhood,
              province: order.shipping_addresses.province,
            }
          : null,
        items:
          order.order_items?.map((item: any) => ({
            ...item,
            product: item.products
              ? {
                  id: item.products.id,
                  name: item.products.name,
                  price: item.products.price,
                  image: item.products.images?.[0] || "/placeholder-image.png",
                }
              : null,
          })) || [],
      })) || [];

    return NextResponse.json({ orders: transformedOrders });
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
    const { user_id, shipping_address, items, total_amount, notes } = body;

    if (!user_id || !shipping_address || !items || !total_amount) {
      return NextResponse.json(
        {
          error:
            "user_id, shipping_address, items, and total_amount are required",
        },
        { status: 400 }
      );
    }

    // Crear dirección de envío
    const { data: shippingAddress, error: shippingError } = await supabaseAdmin
      .from("shipping_addresses")
      .insert([shipping_address])
      .select()
      .single();

    if (shippingError) {
      console.error("Error creating shipping address:", shippingError);
      return NextResponse.json(
        { error: shippingError.message },
        { status: 500 }
      );
    }

    // Crear orden
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          user_id,
          shipping_address_id: shippingAddress.id,
          total_amount,
          notes,
          status: "pendiente",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Crear items de la orden
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Obtener orden completa con relaciones
    const { data: fullOrder, error: fullOrderError } = await supabaseAdmin
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
      .eq("id", order.id)
      .single();

    if (fullOrderError) {
      console.error("Error fetching full order:", fullOrderError);
      return NextResponse.json(
        { error: fullOrderError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
