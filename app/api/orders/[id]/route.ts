import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Función para obtener información del referidor
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

    // Obtener información del referidor
    const referrerInfo = order.user_id
      ? await getReferrerInfo(order.user_id)
      : null;

    return NextResponse.json({
      ...order,
      referrer: referrerInfo,
    });
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

    // Función para obtener información del referidor
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
          return null;
        }

        // Obtener información del referidor
        const { data: referrer } = await supabaseAdmin
          .from("referrers")
          .select("referral_code, user_id")
          .eq("id", referral.referrer_id)
          .single();

        if (!referrer) {
          return null;
        }

        // Obtener información del usuario referidor
        const { data: referrerUser } = await supabaseAdmin
          .from("users")
          .select("full_name, email")
          .eq("id", referrer.user_id)
          .single();

        if (!referrerUser) {
          return null;
        }

        return {
          referral_code: referrer.referral_code,
          referrer_name: referrerUser.full_name,
          referrer_email: referrerUser.email,
        };
      } catch (error) {
        console.error(`[GET-REFERRER-PUT] Error:`, error);
        return null;
      }
    };

    // Actualizar la orden
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

    // Log para cambios de estado a "entregado"
    if (status === "entregado") {
      console.log(
        `[ORDER-UPDATE] Orden ${params.id} marcada como ENTREGADA. El trigger de BD reducirá el stock automáticamente.`
      );
    }

    // Obtener información del referidor
    const referrerInfo = order.user_id
      ? await getReferrerInfo(order.user_id)
      : null;

    return NextResponse.json({
      ...order,
      referrer: referrerInfo,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
