import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referrers/ranking
 * Obtener ranking de referidores ordenados por diferentes métricas
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
    const sortBy = searchParams.get("sort_by") || "total_commissions"; // total_commissions, total_sales, total_referrals, total_orders
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeInactive = searchParams.get("include_inactive") === "true";

    // Validar sortBy
    const validSortFields = [
      "total_commissions",
      "total_sales",
      "total_referrals",
      "total_orders",
      "active_referrals",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "total_commissions";

    // Construir query
    let query = supabase
      .from("referrers")
      .select("*")
      .order(sortField, { ascending: false })
      .limit(limit);

    // Filtrar activos si es necesario
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: referrers, error } = await query;

    if (error) {
      console.error("Error fetching ranking:", error);
      return NextResponse.json(
        { error: "Error al obtener ranking" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios
    const ranking: any[] = [];
    if (referrers && referrers.length > 0) {
      const userIds = referrers.map((r) => r.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

      referrers.forEach((referrer, index) => {
        const user = usersMap.get(referrer.user_id);
        ranking.push({
          rank: index + 1,
          referrer_id: referrer.id,
          referral_code: referrer.referral_code,
          user_email: user?.email || "N/A",
          user_name: user?.full_name || "N/A",
          commission_rate: referrer.commission_rate,
          is_active: referrer.is_active,
          total_referrals: referrer.total_referrals,
          active_referrals: referrer.active_referrals,
          total_orders: referrer.total_orders,
          total_sales: Number(referrer.total_sales),
          total_commissions: Number(referrer.total_commissions),
          created_at: referrer.created_at,
        });
      });
    }

    return NextResponse.json({
      sort_by: sortField,
      limit,
      include_inactive: includeInactive,
      total_results: ranking.length,
      ranking,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/referrers/ranking:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
