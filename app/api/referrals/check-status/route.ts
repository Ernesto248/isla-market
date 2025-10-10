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

    console.log("[check-status] Checking referrer status for user:", user.id);

    // Verificar si el usuario es referidor
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("id, is_active, referral_code")
      .eq("user_id", user.id)
      .single();

    console.log("[check-status] Referrer query result:", {
      found: !!referrer,
      is_active: referrer?.is_active,
      referral_code: referrer?.referral_code,
      error: referrerError?.message,
    });

    // Si hay error y es diferente a "no rows", lanzar error
    if (referrerError && referrerError.code !== "PGRST116") {
      console.error("[check-status] Database error:", referrerError);
      throw referrerError;
    }

    // Retornar true si existe el referrer (sin importar is_active para debug)
    // En producción, considerar solo is_active: true
    const isReferrer = !!referrer;

    return NextResponse.json({
      is_referrer: isReferrer,
      referrer_id: referrer?.id || null,
      is_active: referrer?.is_active || false,
      debug: {
        user_id: user.id,
        found_referrer: !!referrer,
        referrer_is_active: referrer?.is_active,
      },
    });
  } catch (error: any) {
    console.error("[check-status] Error checking referrer status:", error);

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
