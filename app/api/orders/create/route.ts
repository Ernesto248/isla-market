import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Force dynamic rendering - don't evaluate at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener datos del request
    const body = await req.json();
    const { items, shippingAddress, userId } = body;

    // Validaciones básicas
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Dirección de envío requerida" },
        { status: 400 }
      );
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
      const { data: newAddress, error: addressError } = await supabase
        .from("shipping_addresses")
        .insert({
          user_id: userId,
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          house_number: shippingAddress.house_number,
          between_streets: shippingAddress.between_streets,
          neighborhood: shippingAddress.neighborhood,
          province: shippingAddress.province,
          is_default: false,
        })
        .select()
        .single();

      if (addressError || !newAddress) {
        console.error("Error al crear dirección:", addressError);
        return NextResponse.json(
          { error: "Error al crear dirección de envío" },
          { status: 500 }
        );
      }

      shippingAddressId = newAddress.id;
    }

    // 5. Calcular total
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    );

    // 6. Crear orden con estado "pending"
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        shipping_address_id: shippingAddressId,
        status: "pending",
        total_amount: totalAmount,
        notes: "Orden creada directamente sin procesador de pagos",
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

    // 7. Crear items de la orden
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
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

    // 8. Obtener orden completa con items y productos
    const { data: fullOrder, error: fullOrderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:products (
            *
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

    // 10. Enviar emails (no bloqueante) - Dynamic import to avoid build-time evaluation
    if (fullOrder && fullShippingAddress) {
      import("@/lib/email")
        .then((emailModule) => {
          return emailModule.sendOrderEmails({
            order: fullOrder as any,
            user: user as any,
            shippingAddress: fullShippingAddress as any,
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
