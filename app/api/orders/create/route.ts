import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Force dynamic rendering - don't evaluate at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener datos del request
    const body = await req.json();
    const {
      items,
      shippingAddress,
      userId,
      customerPhone,
      deliveryType = "home_delivery",
    } = body;

    // Validaciones básicas
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Información del destinatario requerida" },
        { status: 400 }
      );
    }

    // Validar que si es home_delivery, tenga dirección completa
    if (deliveryType === "home_delivery") {
      if (
        !shippingAddress.street ||
        !shippingAddress.house_number ||
        !shippingAddress.between_streets ||
        !shippingAddress.neighborhood ||
        !shippingAddress.province
      ) {
        return NextResponse.json(
          { error: "Dirección completa requerida para entrega a domicilio" },
          { status: 400 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // 2. Crear cliente de Supabase Admin (para operaciones del servidor)
    const supabase = createSupabaseAdmin();

    // 3. Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 4. Crear o obtener dirección de envío
    let shippingAddressId = shippingAddress.id;

    if (!shippingAddressId) {
      // Crear nueva dirección
      const addressData: any = {
        user_id: userId,
        first_name: shippingAddress.first_name,
        last_name: shippingAddress.last_name,
        phone: shippingAddress.phone,
        is_default: false,
      };

      // Solo agregar campos de dirección si es home_delivery
      if (deliveryType === "home_delivery") {
        addressData.street = shippingAddress.street;
        addressData.house_number = shippingAddress.house_number;
        addressData.between_streets = shippingAddress.between_streets;
        addressData.neighborhood = shippingAddress.neighborhood;
        addressData.province = shippingAddress.province;
      }

      const { data: newAddress, error: addressError } = await supabase
        .from("shipping_addresses")
        .insert(addressData)
        .select()
        .single();

      if (addressError || !newAddress) {
        console.error("Error al crear dirección:", addressError);
        return NextResponse.json(
          { error: "Error al crear información del destinatario" },
          { status: 500 }
        );
      }

      shippingAddressId = newAddress.id;
    }

    // 5. Calcular total (usando price_at_time que viene del checkout)
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price_at_time * item.quantity,
      0
    );

    // Calcular cargo de envío ($5 para domicilio, $0 para recogida)
    const SHIPPING_FEE_HOME_DELIVERY = 5.0;
    const shippingFee =
      deliveryType === "home_delivery" ? SHIPPING_FEE_HOME_DELIVERY : 0;
    const totalAmount = subtotal + shippingFee;

    // 6. Crear orden con estado "pendiente"
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        shipping_address_id: shippingAddressId,
        status: "pendiente",
        delivery_type: deliveryType, // NUEVO: Tipo de entrega
        shipping_fee: shippingFee, // NUEVO: Cargo de envío
        total_amount: totalAmount,
        customer_phone: customerPhone || null, // Guardar teléfono del comprador si existe
        notes:
          deliveryType === "store_pickup"
            ? "Orden para recogida en tienda"
            : "Orden creada directamente sin procesador de pagos",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error al crear orden:", orderError);
      return NextResponse.json(
        { error: "Error al crear la orden" },
        { status: 500 }
      );
    }

    // 7. Crear items de la orden (usando datos del checkout)
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null, // NUEVO: Incluir variant_id si existe
      quantity: item.quantity,
      unit_price: item.price_at_time,
      total_price: item.price_at_time * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error al crear items:", itemsError);
      // Rollback: eliminar orden
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Error al crear items de la orden" },
        { status: 500 }
      );
    }

    // 7.5. El trigger de Supabase reduce el stock automáticamente
    // Ver: supabase/migrations/013_add_variant_id_to_order_items.sql
    console.log(
      "✅ Order items creados. El trigger reduce el stock automáticamente."
    );

    // 8. Obtener orden completa con items, productos Y variantes
    const { data: fullOrder, error: fullOrderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:products (
            *
          ),
          variant:product_variants (
            id,
            sku,
            price,
            image_url,
            attributes_display
          )
        )
      `
      )
      .eq("id", order.id)
      .single();

    if (fullOrderError || !fullOrder) {
      console.error("Error al obtener orden completa:", fullOrderError);
      // Aún así retornamos éxito porque la orden se creó
    }

    // 9. Obtener dirección de envío completa
    const { data: fullShippingAddress } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("id", shippingAddressId)
      .single();

    // 9.5. Obtener información del referidor (si existe)
    let referrerInfo = null;
    try {
      const { data: referral } = await supabase
        .from("referrals")
        .select(
          `
          referral_code,
          is_active,
          referrer_id,
          referrers!inner (
            referral_code,
            user_id,
            users!inner (
              full_name,
              email
            )
          )
        `
        )
        .eq("referred_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (referral && referral.referrers && referral.referrers.length > 0) {
        const referrerData = Array.isArray(referral.referrers)
          ? referral.referrers[0]
          : referral.referrers;
        const userData = Array.isArray(referrerData.users)
          ? referrerData.users[0]
          : referrerData.users;

        referrerInfo = {
          referral_code: referrerData.referral_code,
          referrer_name: userData.full_name,
          referrer_email: userData.email,
        };
      }
    } catch (error) {
      console.error("Error al obtener referidor (no crítico):", error);
    }

    // 10. Enviar emails (no bloqueante) - Dynamic import to avoid build-time evaluation
    if (fullOrder && fullShippingAddress) {
      import("@/lib/email")
        .then((emailModule) => {
          return emailModule.sendOrderEmails({
            order: fullOrder as any,
            user: user as any,
            shippingAddress: fullShippingAddress as any,
            referrer: referrerInfo,
          });
        })
        .catch((error: any) => {
          console.error("Error al enviar emails (no crítico):", error);
        });
    }

    // 11. Retornar orden creada
    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
        },
        message: "Orden creada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en /api/orders/create:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
