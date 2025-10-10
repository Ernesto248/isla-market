import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Forzar modo dinámico para esta ruta
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/referrals/my-stats
 * Obtener estadísticas del usuario como referidor (si lo es)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();

    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar si el usuario es un referidor
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        {
          is_referrer: false,
          message: "Este usuario no es un referidor",
        },
        { status: 200 }
      );
    }

    // Obtener todas las referencias del referidor
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", referrer.id)
      .order("created_at", { ascending: false });

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
      return NextResponse.json(
        { error: "Error al obtener referencias" },
        { status: 500 }
      );
    }

    // Obtener usuarios referidos
    if (referrals && referrals.length > 0) {
      const userIds = referrals.map((r: any) => r.referred_user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);
      referrals.forEach((referral: any) => {
        referral.referred_user =
          usersMap.get(referral.referred_user_id) || null;
      });
    }

    // Separar referencias activas y expiradas
    const now = new Date();
    const activeReferrals =
      referrals?.filter((r) => r.is_active && new Date(r.expires_at) > now) ||
      [];
    const expiredReferrals =
      referrals?.filter((r) => !r.is_active || new Date(r.expires_at) <= now) ||
      [];

    // Obtener comisiones del referidor
    const { data: commissions, error: commissionsError } = await supabase
      .from("referral_commissions")
      .select("*")
      .eq("referrer_id", referrer.id)
      .order("created_at", { ascending: false });

    if (commissionsError) {
      console.error("Error fetching commissions:", commissionsError);
    }

    // Obtener usuarios y órdenes para las comisiones
    if (commissions && commissions.length > 0) {
      const userIds = commissions.map((c: any) => c.referred_user_id);
      const orderIds = commissions.map((c: any) => c.order_id);

      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, created_at")
        .in("id", orderIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);
      const ordersMap = new Map(orders?.map((o) => [o.id, o]) || []);

      commissions.forEach((commission: any) => {
        commission.referred_user =
          usersMap.get(commission.referred_user_id) || null;
        commission.order = ordersMap.get(commission.order_id) || null;
      });
    }

    // Calcular estadísticas del mes actual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCommissions =
      commissions?.filter((c) => new Date(c.created_at) >= currentMonth) || [];

    const monthlyTotal = monthlyCommissions.reduce(
      (sum, c) => sum + Number(c.commission_amount),
      0
    );

    // Comisiones por mes (últimos 6 meses)
    const commissionsPerMonth: {
      month: string;
      total: number;
      count: number;
    }[] = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentCommissions =
      commissions?.filter((c) => new Date(c.created_at) >= sixMonthsAgo) || [];

    const monthsMap = new Map<string, { total: number; count: number }>();
    recentCommissions.forEach((c) => {
      const date = new Date(c.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { total: 0, count: 0 });
      }

      const data = monthsMap.get(monthKey)!;
      data.total += Number(c.commission_amount);
      data.count += 1;
    });

    monthsMap.forEach((value, key) => {
      commissionsPerMonth.push({
        month: key,
        total: value.total,
        count: value.count,
      });
    });

    // Ordenar por mes
    commissionsPerMonth.sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      is_referrer: true,
      referrer: {
        id: referrer.id,
        referral_code: referrer.referral_code,
        commission_rate: referrer.commission_rate,
        duration_months: referrer.duration_months,
        is_active: referrer.is_active,
        created_at: referrer.created_at,
      },
      overview: {
        total_referrals: referrer.total_referrals,
        active_referrals: activeReferrals.length,
        expired_referrals: expiredReferrals.length,
        total_orders: referrer.total_orders,
        total_sales: Number(referrer.total_sales),
        total_commissions: Number(referrer.total_commissions),
        monthly_commissions: monthlyTotal,
      },
      referrals: {
        active: activeReferrals,
        expired: expiredReferrals,
      },
      commissions: {
        recent: commissions?.slice(0, 10) || [],
        total: commissions?.length || 0,
        per_month: commissionsPerMonth,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/referrals/my-stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
