import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Extraer token del header Authorization
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token de autorización no proporcionado");
  }

  const token = authHeader.substring(7);
  const supabase = createSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Token inválido o usuario no encontrado");
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getAuthenticatedUser(request);
    const supabase = createSupabaseAdmin();

    console.log("[check-status] ========== START ==========");
    console.log("[check-status] User ID:", user.id);
    console.log("[check-status] User email:", user.email);

    // Verificar si el usuario es referidor
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("id, is_active, referral_code")
      .eq("user_id", user.id)
      .single();

    console.log("[check-status] Query completed");
    console.log("[check-status] Referrer found:", !!referrer);
    console.log("[check-status] Referrer data:", referrer);
    console.log("[check-status] Error:", referrerError);
    console.log("[check-status] Error code:", referrerError?.code);

    // Si hay error y es diferente a "no rows", lanzar error
    if (referrerError && referrerError.code !== "PGRST116") {
      console.error(
        "[check-status] Database error (not 'no rows'):",
        referrerError
      );
      throw referrerError;
    }

    // Si el error es PGRST116, significa que no hay referrer
    if (referrerError?.code === "PGRST116") {
      console.log("[check-status] No referrer found (PGRST116 - no rows)");
    }

    // Retornar true si existe el referrer
    const isReferrer = !!referrer;

    console.log("[check-status] Final isReferrer value:", isReferrer);
    console.log("[check-status] ========== END ==========");

    const response = {
      is_referrer: isReferrer,
      referrer_id: referrer?.id || null,
      is_active: referrer?.is_active || false,
      debug: {
        user_id: user.id,
        user_email: user.email,
        found_referrer: !!referrer,
        referrer_is_active: referrer?.is_active,
        referrer_data: referrer,
        had_error: !!referrerError,
        error_code: referrerError?.code,
      },
    };

    console.log(
      "[check-status] Sending response:",
      JSON.stringify(response, null, 2)
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[check-status] ========== ERROR ==========");
    console.error("[check-status] Caught error:", error);
    console.error("[check-status] Error message:", error.message);
    console.error("[check-status] ========== ERROR END ==========");

    if (error.message?.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        is_referrer: false,
        error: error.message || "Error desconocido",
      },
      { status: 200 }
    );
  }
}
