import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Cliente con service role para operaciones admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function PATCH(request: NextRequest) {
  try {
    // Obtener el token de autorización
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autorización requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar el token y obtener el usuario
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Obtener los datos del body
    const body = await request.json();
    const { first_name, last_name } = body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Construir el nombre completo
    const full_name = `${first_name} ${last_name}`;

    // Actualizar en la tabla users
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user in database:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el usuario en la base de datos" },
        { status: 500 }
      );
    }

    // Actualizar también el user_metadata en Auth para consistencia
    const { error: metadataError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          first_name,
          last_name,
          full_name,
        },
      });

    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      // No retornamos error aquí porque ya se actualizó en la BD
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/users/profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
