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

    // Verificar si el usuario es referidor
    const { data: referrer } = await supabase
      .from("referrers")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    return NextResponse.json({
      is_referrer: !!referrer,
      referrer_id: referrer?.id || null,
    });
  } catch (error: any) {
    console.error("Error checking referrer status:", error);

    if (error.message?.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ is_referrer: false }, { status: 200 });
  }
}
