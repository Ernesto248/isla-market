import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Código de referido requerido" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Buscar el referidor con ese código
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("id, user_id, is_active, duration_months")
      .eq("referral_code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        {
          valid: false,
          error: "Código de referido no encontrado o inactivo",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrer_id: referrer.id,
      user_id: referrer.user_id,
      duration_months: referrer.duration_months,
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    return NextResponse.json(
      { error: "Error al validar el código" },
      { status: 500 }
    );
  }
}
