import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/customers/[id]/referrer
 * Asigna o cambia el referidor de un cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const body = await request.json();
    const { referrerId } = body;

    const userId = params.id;

    console.log("[ASSIGN-REFERRER] Request:", {
      userId,
      referrerId,
    });

    // Validar que el usuario existe
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("[ASSIGN-REFERRER] User not found:", userError);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si referrerId es null, eliminar el referido
    if (!referrerId) {
      console.log("[ASSIGN-REFERRER] Removing referrer from user:", userId);

      // Buscar referral existente
      const { data: existingReferral } = await supabaseAdmin
        .from("referrals")
        .select("id")
        .eq("referred_user_id", userId)
        .single();

      if (existingReferral) {
        // Eliminar el referral
        const { error: deleteError } = await supabaseAdmin
          .from("referrals")
          .delete()
          .eq("id", existingReferral.id);

        if (deleteError) {
          console.error(
            "[ASSIGN-REFERRER] Error deleting referral:",
            deleteError
          );
          return NextResponse.json(
            { error: "Error al eliminar referidor" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Referidor eliminado correctamente",
      });
    }

    // Validar que el referidor existe y está activo
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from("referrers")
      .select("id, referral_code, user_id, is_active")
      .eq("id", referrerId)
      .single();

    if (referrerError || !referrer) {
      console.error("[ASSIGN-REFERRER] Referrer not found:", referrerError);
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

    // Validar que no se esté auto-refiriendo
    if (referrer.user_id === userId) {
      return NextResponse.json(
        { error: "Un usuario no puede ser su propio referidor" },
        { status: 400 }
      );
    }

    // Buscar si ya existe un referral para este usuario
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id, referrer_id")
      .eq("referred_user_id", userId)
      .single();

    if (existingReferral) {
      // Actualizar el referral existente
      console.log("[ASSIGN-REFERRER] Updating existing referral:", {
        referralId: existingReferral.id,
        oldReferrerId: existingReferral.referrer_id,
        newReferrerId: referrerId,
      });

      const { error: updateError } = await supabaseAdmin
        .from("referrals")
        .update({
          referrer_id: referrerId,
          referral_code: referrer.referral_code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReferral.id);

      if (updateError) {
        console.error(
          "[ASSIGN-REFERRER] Error updating referral:",
          updateError
        );
        return NextResponse.json(
          { error: "Error al actualizar referidor" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Referidor actualizado correctamente",
      });
    } else {
      // Crear nuevo referral
      console.log("[ASSIGN-REFERRER] Creating new referral:", {
        userId,
        referrerId,
      });

      const { error: insertError } = await supabaseAdmin
        .from("referrals")
        .insert({
          referrer_id: referrerId,
          referred_user_id: userId,
          referral_code: referrer.referral_code,
          is_active: true,
        });

      if (insertError) {
        console.error(
          "[ASSIGN-REFERRER] Error creating referral:",
          insertError
        );
        return NextResponse.json(
          { error: "Error al asignar referidor" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Referidor asignado correctamente",
      });
    }
  } catch (error) {
    console.error("[ASSIGN-REFERRER] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
