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
      const { data: referral } = await supabaseAdmin
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
        .eq("referred_user_id", userId)
        .eq("is_active", true)
        .single();

      if (!referral || !referral.referrers || referral.referrers.length === 0)
        return null;

      const referrerData = Array.isArray(referral.referrers)
        ? referral.referrers[0]
        : referral.referrers;
      const userData = Array.isArray(referrerData.users)
        ? referrerData.users[0]
        : referrerData.users;

      return {
        referral_code: referrerData.referral_code,
        referrer_name: userData.full_name,
        referrer_email: userData.email,
      };
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
      const { data: referral } = await supabaseAdmin
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
        .eq("referred_user_id", userId)
        .eq("is_active", true)
        .single();

      if (!referral || !referral.referrers || referral.referrers.length === 0)
        return null;

      const referrerData = Array.isArray(referral.referrers)
        ? referral.referrers[0]
        : referral.referrers;
      const userData = Array.isArray(referrerData.users)
        ? referrerData.users[0]
        : referrerData.users;

      return {
        referral_code: referrerData.referral_code,
        referrer_name: userData.full_name,
        referrer_email: userData.email,
      };
    };

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
