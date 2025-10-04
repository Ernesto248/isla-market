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
 * Utiliza el token de autorización del header
 */
export async function verifyAdminFromRequest(
  request: Request
): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return { isAdmin: false, error: "No authorization header" };
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createSupabaseAdmin();

    // Verificar el token y obtener el usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Invalid token or user not found");
      return { isAdmin: false, error: "Invalid authentication" };
    }

    // Verificar si es admin
    const isAdmin = await isUserAdmin(user.id);

    if (!isAdmin) {
      console.log("User is not admin:", user.email);
    }

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
