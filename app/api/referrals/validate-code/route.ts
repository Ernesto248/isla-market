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

    // Buscar el referidor con ese código e incluir el nombre del usuario
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select(
        `
        id, 
        user_id, 
        is_active, 
        duration_months,
        profiles:user_id (
          full_name,
          email
        )
      `
      )
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

    // Extraer el nombre del referidor
    const profiles = referrer.profiles as any;
    const referrerName = Array.isArray(profiles)
      ? profiles[0]?.full_name || profiles[0]?.email || "referidor"
      : profiles?.full_name || profiles?.email || "referidor";

    return NextResponse.json({
      valid: true,
      referrer_id: referrer.id,
      user_id: referrer.user_id,
      referrer_name: referrerName,
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
