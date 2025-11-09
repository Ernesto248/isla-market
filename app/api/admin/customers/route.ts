import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role"); // 'customer', 'admin', o null (todos)

    let query = supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, created_at, updated_at");

    // Filtro por búsqueda (nombre o email)
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Filtro por rol
    if (role) {
      query = query.eq("role", role);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order("created_at", { ascending: false });

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener estadísticas por usuario (número de órdenes y total gastado)
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Contar órdenes
        const { count: ordersCount } = await supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Calcular total gastado - incluir órdenes pagadas y entregadas
        const { data: orders } = await supabaseAdmin
          .from("orders")
          .select("total_amount")
          .eq("user_id", user.id)
          .in("status", ["pagado", "entregado"]); // Órdenes confirmadas

        const totalSpent =
          orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
          0;

        // Obtener información del referidor (si existe)
        let referrerInfo = null;
        try {
          const { data: referral, error: referralError } = await supabaseAdmin
            .from("referrals")
            .select("referrer_id, referral_code, is_active")
            .eq("referred_user_id", user.id)
            .eq("is_active", true)
            .single();

          if (referral && !referralError) {
            // Obtener información del referidor
            const { data: referrer } = await supabaseAdmin
              .from("referrers")
              .select("referral_code, user_id")
              .eq("id", referral.referrer_id)
              .single();

            if (referrer) {
              // Obtener información del usuario referidor
              const { data: referrerUser } = await supabaseAdmin
                .from("users")
                .select("full_name, email")
                .eq("id", referrer.user_id)
                .single();

              if (referrerUser) {
                referrerInfo = {
                  referral_code: referrer.referral_code,
                  referrer_name: referrerUser.full_name,
                  referrer_email: referrerUser.email,
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching referrer for user ${user.id}:`, error);
        }

        return {
          ...user,
          orders_count: ordersCount || 0,
          total_spent: totalSpent,
          referrer: referrerInfo,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
