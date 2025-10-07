import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// Schema de validación para actualizar referidor
const updateReferrerSchema = z.object({
  referral_code: z
    .string()
    .min(6, "Código debe tener al menos 6 caracteres")
    .max(15, "Código debe tener máximo 15 caracteres")
    .regex(
      /^[A-Z0-9]+$/,
      "Código debe contener solo letras mayúsculas y números"
    )
    .optional(),
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
  is_active: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/admin/referrers/[id]
 * Obtener detalles de un referidor específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obtener referidor
    const { data: referrer, error } = await supabase
      .from("referrers")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !referrer) {
      return NextResponse.json(
        { error: "Referidor no encontrado" },
        { status: 404 }
      );
    }

    // Obtener información del usuario
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", referrer.user_id)
      .single();

    referrer.user = user || null;

    // Obtener estadísticas adicionales de sus referidos
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", params.id)
      .order("created_at", { ascending: false });

    // Obtener usuarios referidos
    if (referrals && referrals.length > 0) {
      const userIds = referrals.map((r) => r.referred_user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);
      referrals.forEach((referral: any) => {
        referral.referred_user =
          usersMap.get(referral.referred_user_id) || null;
      });
    }

    // Obtener comisiones
    const { data: commissions } = await supabase
      .from("referral_commissions")
      .select("*")
      .eq("referrer_id", params.id)
      .order("created_at", { ascending: false });

    // Obtener usuarios de comisiones
    if (commissions && commissions.length > 0) {
      const userIds = commissions.map((c) => c.referred_user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]) || []);
      commissions.forEach((commission: any) => {
        commission.referred_user =
          usersMap.get(commission.referred_user_id) || null;
      });
    }

    return NextResponse.json({
      ...referrer,
      referrals: referrals || [],
      commissions: commissions || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/referrers/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/referrers/[id]
 * Actualizar un referidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validation = updateReferrerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Si se cambia el código, verificar que no esté en uso
    if (updateData.referral_code) {
      const { data: existingCode } = await supabase
        .from("referrers")
        .select("id")
        .eq("referral_code", updateData.referral_code)
        .neq("id", params.id)
        .single();

      if (existingCode) {
        return NextResponse.json(
          { error: "Este código de referido ya está en uso" },
          { status: 409 }
        );
      }

      updateData.referral_code = updateData.referral_code.toUpperCase();
    }

    // Actualizar referidor
    const { data: updatedReferrer, error: updateError } = await supabase
      .from("referrers")
      .update(updateData)
      .eq("id", params.id)
      .select("*")
      .single();

    if (updateError || !updatedReferrer) {
      console.error("Error updating referrer:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar referidor" },
        { status: 500 }
      );
    }

    // Obtener información del usuario
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", updatedReferrer.user_id)
      .single();

    updatedReferrer.user = user || null;

    return NextResponse.json({
      message: "Referidor actualizado exitosamente",
      referrer: updatedReferrer,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/referrers/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/referrers/[id]
 * Desactivar un referidor (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Desactivar referidor (soft delete)
    const { data: deactivatedReferrer, error: deleteError } = await supabase
      .from("referrers")
      .update({ is_active: false })
      .eq("id", params.id)
      .select()
      .single();

    if (deleteError || !deactivatedReferrer) {
      return NextResponse.json(
        { error: "Error al desactivar referidor" },
        { status: 500 }
      );
    }

    // También desactivar todas sus referencias activas
    await supabase
      .from("referrals")
      .update({ is_active: false })
      .eq("referrer_id", params.id)
      .eq("is_active", true);

    return NextResponse.json({
      message: "Referidor desactivado exitosamente",
      referrer: deactivatedReferrer,
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/referrers/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
