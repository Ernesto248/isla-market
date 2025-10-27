import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderCancellationAdminEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Crear cliente de Supabase con Service Role para operaciones admin
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el token de autorización
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autorización requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar el token y obtener el usuario
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Obtener la orden con sus items, productos y dirección de envío
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          product:products (
            id,
            name,
            price,
            images
          )
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", user.id) // Verificar que la orden pertenece al usuario
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Obtener la dirección de envío
    const { data: shippingAddress, error: addressError } = await supabaseAdmin
      .from("shipping_addresses")
      .select("*")
      .eq("id", order.shipping_address_id)
      .single();

    if (addressError || !shippingAddress) {
      console.error("Error obteniendo dirección:", addressError);
      return NextResponse.json(
        { error: "Dirección de envío no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la orden esté en estado "pendiente"
    if (order.status !== "pendiente") {
      return NextResponse.json(
        {
          error: "Solo se pueden cancelar órdenes en estado pendiente",
          currentStatus: order.status,
        },
        { status: 400 }
      );
    }

    // Restaurar el stock de los productos/variantes
    for (const item of order.order_items) {
      if (item.variant_id) {
        // Primero obtener el stock actual de la variante
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          // Restaurar stock de la variante
          await supabaseAdmin
            .from("product_variants")
            .update({
              stock_quantity: variant.stock_quantity + item.quantity,
            })
            .eq("id", item.variant_id);
        }
      } else {
        // Primero obtener el stock actual del producto
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (product) {
          // Restaurar stock del producto
          await supabaseAdmin
            .from("products")
            .update({
              stock_quantity: product.stock_quantity + item.quantity,
            })
            .eq("id", item.product_id);
        }
      }
    }

    // Actualizar el estado de la orden a "cancelado"
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Error al cancelar la orden" },
        { status: 500 }
      );
    }

    // Enviar email al admin notificando la cancelación
    try {
      await sendOrderCancellationAdminEmail({
        order: order as any,
        user: {
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          user_metadata: user.user_metadata,
        },
        shippingAddress: shippingAddress as any,
      });
      console.log("✅ Email de cancelación enviado al admin");
    } catch (emailError) {
      console.error("❌ Error al enviar email de cancelación:", emailError);
      // No bloqueamos la cancelación si falla el email
    }

    return NextResponse.json({
      message: "Orden cancelada exitosamente",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Error al cancelar la orden" },
      { status: 500 }
    );
  }
}
