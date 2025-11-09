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

    // Función para obtener información del referidor de una orden
    const getReferrerInfo = async (userId: string) => {
      try {
        // Obtener referral
        const { data: referral, error: referralError } = await supabaseAdmin
          .from("referrals")
          .select("referrer_id, referral_code, is_active")
          .eq("referred_user_id", userId)
          .eq("is_active", true)
          .single();

        if (!referral || referralError) {
          console.log(`[GET-REFERRER] No referral found for user ${userId}`);
          return null;
        }

        // Obtener información del referidor
        const { data: referrer } = await supabaseAdmin
          .from("referrers")
          .select("referral_code, user_id")
          .eq("id", referral.referrer_id)
          .single();

        if (!referrer) {
          console.log(
            `[GET-REFERRER] No referrer found with id ${referral.referrer_id}`
          );
          return null;
        }

        // Obtener información del usuario referidor
        const { data: referrerUser } = await supabaseAdmin
          .from("users")
          .select("full_name, email")
          .eq("id", referrer.user_id)
          .single();

        if (!referrerUser) {
          console.log(
            `[GET-REFERRER] No user found with id ${referrer.user_id}`
          );
          return null;
        }

        console.log(`[GET-REFERRER] Found referrer for user ${userId}:`, {
          code: referrer.referral_code,
          name: referrerUser.full_name,
        });

        return {
          referral_code: referrer.referral_code,
          referrer_name: referrerUser.full_name,
          referrer_email: referrerUser.email,
        };
      } catch (error) {
        console.error(
          `[GET-REFERRER] Error fetching referrer for user ${userId}:`,
          error
        );
        return null;
      }
    };

    // Temporal: Obtener variantes por separado para evitar caché de PostgREST
    const ordersWithVariants = async (orders: any[]) => {
      for (const order of orders) {
        if (order.order_items) {
          for (const item of order.order_items) {
            if (item.variant_id) {
              const { data: variant } = await supabaseAdmin
                .from("product_variants")
                .select("id, sku, price, image_url, attributes_display")
                .eq("id", item.variant_id)
                .single();
              item.variant = variant;
            }
          }
        }
      }
      return orders;
    };

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

    // Cargar variantes por separado
    const ordersWithVariantsData = orders
      ? await ordersWithVariants(orders)
      : [];

    // Obtener información del referidor para cada orden
    const ordersWithReferrers = await Promise.all(
      ordersWithVariantsData.map(async (order: any) => {
        const referrerInfo = order.user_id
          ? await getReferrerInfo(order.user_id)
          : null;
        return {
          ...order,
          referrer: referrerInfo,
        };
      })
    );

    // Transformar los datos al formato esperado
    const transformedOrders =
      ordersWithReferrers?.map((order: any) => ({
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
