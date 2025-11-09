import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referrers/stats
 * Obtener estadísticas globales del programa de referidos
 */
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

    const supabase = createSupabaseAdmin();

    // Parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all"; // all, month, week

    // Calcular fecha de inicio según el periodo
    let startDate: Date | null = null;
    if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    // 1. Estadísticas de referidores
    const { data: referrersData } = await supabase
      .from("referrers")
      .select("*");

    const totalReferrers = referrersData?.length || 0;
    const activeReferrers =
      referrersData?.filter((r) => r.is_active).length || 0;

    // 2. Estadísticas de referencias
    let referralsQuery = supabase.from("referrals").select("*");
    if (startDate) {
      referralsQuery = referralsQuery.gte(
        "created_at",
        startDate.toISOString()
      );
    }
    const { data: referralsData } = await referralsQuery;

    const totalReferrals = referralsData?.length || 0;
    const activeReferrals =
      referralsData?.filter(
        (r) => r.is_active && new Date(r.expires_at) > new Date()
      ).length || 0;

    // 3. Estadísticas de comisiones
    let commissionsQuery = supabase.from("referral_commissions").select("*");
    if (startDate) {
      commissionsQuery = commissionsQuery.gte(
        "created_at",
        startDate.toISOString()
      );
    }
    const { data: commissionsData } = await commissionsQuery;

    const totalCommissions =
      commissionsData?.reduce(
        (sum, c) => sum + Number(c.commission_amount),
        0
      ) || 0;

    const totalSalesFromReferrals =
      commissionsData?.reduce((sum, c) => sum + Number(c.order_total), 0) || 0;

    const totalOrders = commissionsData?.length || 0;

    // 4. Calcular promedios
    const averageCommissionPerReferrer =
      activeReferrers > 0 ? totalCommissions / activeReferrers : 0;

    const averageSalesPerReferral =
      activeReferrals > 0 ? totalSalesFromReferrals / activeReferrals : 0;

    const averageOrdersPerReferral =
      activeReferrals > 0 ? totalOrders / activeReferrals : 0;

    // 5. Comisiones por mes (últimos 6 meses)
    const commissionsPerMonth: {
      month: string;
      total: number;
      count: number;
    }[] = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyCommissions } = await supabase
      .from("referral_commissions")
      .select("created_at, commission_amount")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at");

    if (monthlyCommissions) {
      const monthsMap = new Map<string, { total: number; count: number }>();

      monthlyCommissions.forEach((c) => {
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
    }

    // 6. Configuración del programa
    const { data: config } = await supabase
      .from("referral_program_config")
      .select("*")
      .single();

    return NextResponse.json({
      period,
      program_config: config || null,
      overview: {
        total_referrers: totalReferrers,
        active_referrers: activeReferrers,
        total_referrals: totalReferrals,
        active_referrals: activeReferrals,
        total_orders: totalOrders,
        total_sales: totalSalesFromReferrals,
        total_commissions: totalCommissions,
      },
      averages: {
        commission_per_referrer: averageCommissionPerReferrer,
        sales_per_referral: averageSalesPerReferral,
        orders_per_referral: averageOrdersPerReferral,
      },
      commissions_per_month: commissionsPerMonth,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/referrers/stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
