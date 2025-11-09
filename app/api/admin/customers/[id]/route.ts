import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Obtener información del usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", params.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener órdenes del usuario
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          products (
            id,
            name,
            images
          )
        )
      `
      )
      .eq("user_id", params.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    // Calcular estadísticas
    const stats = {
      total_orders: orders?.length || 0,
      total_spent:
        orders
          ?.filter((o) => o.status === "pagado" || o.status === "entregado")
          .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      pending_orders:
        orders?.filter((o) => o.status === "pendiente").length || 0,
      completed_orders:
        orders?.filter((o) => o.status === "pagado" || o.status === "entregado")
          .length || 0,
    };

    // Obtener información del referidor (si existe)
    const { data: referral } = await supabaseAdmin
      .from("referrals")
      .select(
        `
        referral_code,
        is_active,
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
      .eq("referred_user_id", params.id)
      .eq("is_active", true)
      .single();

    let referrerInfo = null;
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

    return NextResponse.json({
      user,
      orders: orders || [],
      stats,
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

// Actualizar rol de usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const body = await request.json();
    const { role } = body;

    if (!role || !["customer", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser 'customer' o 'admin'" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
