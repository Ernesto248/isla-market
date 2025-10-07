import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// Schema de validación para crear referidor
const createReferrerSchema = z.object({
  user_id: z.string().uuid("ID de usuario inválido"),
  referral_code: z
    .string()
    .min(6, "Código debe tener al menos 6 caracteres")
    .max(15, "Código debe tener máximo 15 caracteres")
    .regex(
      /^[A-Z0-9]+$/,
      "Código debe contener solo letras mayúsculas y números"
    ),
  commission_rate: z
    .number()
    .min(0.01, "Comisión debe ser al menos 0.01%")
    .max(50, "Comisión no puede exceder 50%")
    .optional(),
  duration_months: z
    .number()
    .int()
    .min(1, "Duración debe ser al menos 1 mes")
    .max(36, "Duración no puede exceder 36 meses")
    .optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/admin/referrers
 * Lista todos los referidores con sus estadísticas
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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("is_active");
    const search = searchParams.get("search");

    // Construir query para referrers
    let query = supabase
      .from("referrers")
      .select("*")
      .order("created_at", { ascending: false });

    // Filtros opcionales
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (search) {
      query = query.ilike("referral_code", `%${search}%`);
    }

    const { data: referrers, error } = await query;

    if (error) {
      console.error("Error fetching referrers:", error);
      return NextResponse.json(
        { error: "Error al obtener referidores" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios manualmente
    if (referrers && referrers.length > 0) {
      const userIds = referrers.map((r) => r.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      // Mapear usuarios a referrers
      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);
      referrers.forEach((referrer: any) => {
        referrer.user = usersMap.get(referrer.user_id) || null;
      });
    }

    return NextResponse.json({
      referrers,
      total: referrers?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/referrers:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/referrers
 * Crear un nuevo referidor
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
    const validation = createReferrerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { user_id, referral_code, commission_rate, duration_months, notes } =
      validation.data;

    // Verificar que el usuario existe
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario no sea ya un referidor
    const { data: existingReferrer } = await supabase
      .from("referrers")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existingReferrer) {
      return NextResponse.json(
        { error: "Este usuario ya es un referidor" },
        { status: 409 }
      );
    }

    // Verificar que el código no esté en uso
    const { data: existingCode } = await supabase
      .from("referrers")
      .select("id")
      .eq("referral_code", referral_code)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: "Este código de referido ya está en uso" },
        { status: 409 }
      );
    }

    // Crear referidor
    const { data: newReferrer, error: createError } = await supabase
      .from("referrers")
      .insert({
        user_id,
        referral_code: referral_code.toUpperCase(),
        commission_rate: commission_rate || 3.0,
        duration_months: duration_months || 6,
        notes,
        created_by: adminCheck.userId,
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating referrer:", createError);
      return NextResponse.json(
        { error: "Error al crear referidor" },
        { status: 500 }
      );
    }

    // Agregar información del usuario
    if (newReferrer) {
      newReferrer.user = targetUser;
    }

    return NextResponse.json(
      {
        message: "Referidor creado exitosamente",
        referrer: newReferrer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/referrers:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
