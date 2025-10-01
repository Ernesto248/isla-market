import { createSupabaseAdmin } from "./supabase";

/**
 * Verifica si un usuario tiene rol de administrador
 * @param userId - ID del usuario a verificar
 * @returns true si es admin, false en caso contrario
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdmin();

    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking admin role:", error);
      return false;
    }

    return user?.role === "admin";
  } catch (error) {
    console.error("Error in isUserAdmin:", error);
    return false;
  }
}

/**
 * Verifica si el usuario actual en el request tiene rol de admin
 * Utiliza el header de autorización o cookies de Supabase
 */
export async function verifyAdminFromRequest(
  request: Request
): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    // Obtener el token de autenticación
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return { isAdmin: false, error: "No authorization token" };
    }

    const supabase = createSupabaseAdmin();

    // Verificar el token y obtener el usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { isAdmin: false, error: "Invalid token" };
    }

    // Verificar si es admin
    const isAdmin = await isUserAdmin(user.id);

    return {
      isAdmin,
      userId: user.id,
    };
  } catch (error) {
    console.error("Error verifying admin:", error);
    return { isAdmin: false, error: "Verification failed" };
  }
}

/**
 * Middleware helper para proteger rutas de admin en API routes
 * Uso: const adminCheck = await requireAdmin(request);
 *      if (!adminCheck.isAdmin) return NextResponse.json(...)
 */
export async function requireAdmin(request: Request): Promise<{
  isAdmin: boolean;
  userId?: string;
  error?: string;
}> {
  const result = await verifyAdminFromRequest(request);

  if (!result.isAdmin) {
    return {
      isAdmin: false,
      error: result.error || "Admin access required",
    };
  }

  return result;
}
