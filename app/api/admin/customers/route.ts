import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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

        // Calcular total gastado
        const { data: orders } = await supabaseAdmin
          .from("orders")
          .select("total_amount")
          .eq("user_id", user.id)
          .eq("status", "delivered"); // Solo órdenes completadas

        const totalSpent =
          orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
          0;

        return {
          ...user,
          orders_count: ordersCount || 0,
          total_spent: totalSpent,
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
