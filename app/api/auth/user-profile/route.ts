import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Forzar ejecución dinámica para esta API route
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Usar cliente admin para verificar el token y obtener el usuario
    const adminClient = createSupabaseAdmin();
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Consultar la tabla users con el mismo cliente admin
    const { data: userData, error: dbError } = await adminClient
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("Error fetching user profile:", dbError);
      return NextResponse.json(
        { error: "Error fetching profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      role: userData?.role || "customer",
      full_name: userData?.full_name || "",
    });
  } catch (error) {
    console.error("Error in user-profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
