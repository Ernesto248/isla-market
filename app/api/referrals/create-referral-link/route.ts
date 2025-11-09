import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Forzar modo dinámico para esta ruta
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getAuthenticatedUser(request);
    console.log("[CREATE-REFERRAL] User authenticated:", user.id, user.email);

    const body = await request.json();
    const { referral_code } = body;

    console.log("[CREATE-REFERRAL] Referral code received:", referral_code);

    if (!referral_code) {
      return NextResponse.json(
        { error: "Código de referido requerido" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Validar que el código existe y está activo
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("id, user_id, duration_months, referral_code, commission_rate")
      .eq("referral_code", referral_code.toUpperCase())
      .eq("is_active", true)
      .single();

    console.log("[CREATE-REFERRAL] Referrer lookup result:", {
      found: !!referrer,
      error: referrerError?.message,
      referrerId: referrer?.id,
    });

    if (referrerError || !referrer) {
      console.error("[CREATE-REFERRAL] Referrer not found:", {
        referral_code,
        error: referrerError,
      });
      return NextResponse.json(
        { error: "Código de referido no válido o inactivo" },
        { status: 404 }
      );
    }

    // Validar que los campos críticos existen
    if (!referrer.referral_code || !referrer.commission_rate) {
      console.error("Missing referrer fields:", referrer);
      return NextResponse.json(
        { error: "Datos de referidor incompletos" },
        { status: 500 }
      );
    }

    // 2. Verificar que el usuario no sea el mismo que el referidor
    if (referrer.user_id === user.id) {
      return NextResponse.json(
        { error: "No puedes usar tu propio código de referido" },
        { status: 400 }
      );
    }

    // 3. Verificar que este usuario no haya sido referido antes
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .single();

    console.log("[CREATE-REFERRAL] Existing referral check:", {
      exists: !!existingReferral,
      userId: user.id,
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: "Este usuario ya fue referido anteriormente" },
        { status: 400 }
      );
    }

    // 4. Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + referrer.duration_months);

    // 5. Preparar datos del referral
    const referralData = {
      referrer_id: referrer.id,
      referred_user_id: user.id,
      referral_code: referrer.referral_code,
      commission_rate: referrer.commission_rate,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    };

    console.log("Creating referral with data:", referralData);

    // 6. Crear la relación de referido
    const { data: newReferral, error: createError } = await supabase
      .from("referrals")
      .insert(referralData)
      .select()
      .single();

    if (createError) {
      console.error("Error creating referral:", createError);
      console.error("Referral data was:", referralData);
      return NextResponse.json(
        {
          error: "Error al crear la relación de referido",
          details: createError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referral: newReferral,
      message: "Relación de referido creada exitosamente",
    });
  } catch (error: any) {
    console.error("Error in create-referral-link:", error);

    if (error.message?.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
