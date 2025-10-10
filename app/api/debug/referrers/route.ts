import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();

    // Obtener todos los referidores activos
    const { data: referrers, error } = await supabase
      .from("referrers")
      .select(
        `
        id,
        user_id,
        referral_code,
        is_active,
        commission_rate,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Obtener información de usuarios
    const userIds = referrers?.map((r) => r.user_id) || [];
    const { data: users } = await supabase.auth.admin.listUsers();

    const referrersWithEmails = referrers?.map((referrer) => {
      const user = users?.users?.find((u) => u.id === referrer.user_id);
      return {
        ...referrer,
        email: user?.email || "Unknown",
      };
    });

    return NextResponse.json({
      success: true,
      total_referrers: referrers?.length || 0,
      referrers: referrersWithEmails,
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (error: any) {
    console.error("[debug-referrers] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
