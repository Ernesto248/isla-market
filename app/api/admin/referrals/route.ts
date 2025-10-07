import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// Schema de validación para crear referencia
const createReferralSchema = z.object({
  referrer_id: z.string().uuid("ID de referidor inválido"),
  referred_user_id: z.string().uuid("ID de usuario inválido"),
});

/**
 * GET /api/admin/referrals
 * Lista todas las referencias con filtros opcionales
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

    // Parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const referrerId = searchParams.get("referrer_id");
    const isActive = searchParams.get("is_active");
    const isExpired = searchParams.get("is_expired");

    // Construir query
    let query = supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    // Filtros opcionales
    if (referrerId) {
      query = query.eq("referrer_id", referrerId);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: referrals, error } = await query;

    if (error) {
      console.error("Error fetching referrals:", error);
      return NextResponse.json(
        { error: "Error al obtener referencias" },
        { status: 500 }
      );
    }

    // Filtrar expiradas si se solicita
    let filteredReferrals = referrals || [];
    if (isExpired === "true") {
      filteredReferrals = filteredReferrals.filter(
        (r) => new Date(r.expires_at) <= new Date()
      );
    } else if (isExpired === "false") {
      filteredReferrals = filteredReferrals.filter(
        (r) => new Date(r.expires_at) > new Date()
      );
    }

    // Obtener información de usuarios referidos y referidores
    if (filteredReferrals.length > 0) {
      const referrerIds = Array.from(
        new Set(filteredReferrals.map((r) => r.referrer_id))
      );
      const referredUserIds = Array.from(
        new Set(filteredReferrals.map((r) => r.referred_user_id))
      );

      const { data: referrersData } = await supabase
        .from("referrers")
        .select("id, referral_code, user_id")
        .in("id", referrerIds);

      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", referredUserIds);

      const referrersMap = new Map(referrersData?.map((r) => [r.id, r]) || []);
      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

      filteredReferrals.forEach((referral: any) => {
        const referrer = referrersMap.get(referral.referrer_id);
        referral.referrer = referrer
          ? { id: referrer.id, referral_code: referrer.referral_code }
          : null;
        referral.referred_user =
          usersMap.get(referral.referred_user_id) || null;
      });
    }

    return NextResponse.json({
      referrals: filteredReferrals,
      total: filteredReferrals.length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/referrals:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/referrals
 * Crear una nueva referencia manualmente
 */
export async function POST(request: NextRequest) {
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

    // Validar body
    const body = await request.json();
    const validation = createReferralSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { referrer_id, referred_user_id } = validation.data;

    // Verificar que el referidor existe y está activo
    const { data: referrer, error: referrerError } = await supabase
      .from("referrers")
      .select("*")
      .eq("id", referrer_id)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: "Referidor no encontrado" },
        { status: 404 }
      );
    }

    if (!referrer.is_active) {
      return NextResponse.json(
        { error: "El referidor no está activo" },
        { status: 400 }
      );
    }

    // Verificar que el usuario referido existe
    const { data: referredUser, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", referred_user_id)
      .single();

    if (userError || !referredUser) {
      return NextResponse.json(
        { error: "Usuario referido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no exista ya una referencia activa
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrer_id)
      .eq("referred_user_id", referred_user_id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: "Ya existe una referencia entre este referidor y usuario" },
        { status: 409 }
      );
    }

    // Crear referencia
    // El trigger set_referral_expiry calculará automáticamente expires_at
    const { data: newReferral, error: createError } = await supabase
      .from("referrals")
      .insert({
        referrer_id,
        referred_user_id,
        referral_code: referrer.referral_code,
        commission_rate: referrer.commission_rate,
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating referral:", createError);
      return NextResponse.json(
        { error: "Error al crear referencia" },
        { status: 500 }
      );
    }

    // Agregar información de referidor y usuario referido
    if (newReferral) {
      newReferral.referrer = {
        id: referrer.id,
        referral_code: referrer.referral_code,
      };
      newReferral.referred_user = referredUser;
    }

    return NextResponse.json(
      {
        message: "Referencia creada exitosamente",
        referral: newReferral,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/referrals:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
