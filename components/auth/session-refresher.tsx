"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/**
 * Componente que maneja el refresco automático de sesiones
 * y la detección de sesiones expiradas
 */
export function SessionRefresher() {
  const router = useRouter();

  useEffect(() => {
    // Verificar sesión cada 5 minutos
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.warn("Sesión inválida detectada, redirigiendo...");
        // Solo limpiar si estamos en una ruta protegida
        const currentPath = window.location.pathname;
        if (
          currentPath.startsWith("/admin") ||
          currentPath.startsWith("/orders") ||
          currentPath.startsWith("/profile")
        ) {
          await supabase.auth.signOut({ scope: "local" });
          router.push("/");
        }
      }
    };

    // Verificar inmediatamente
    checkSession();

    // Luego verificar cada 5 minutos
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Escuchar eventos de storage para detectar cambios en otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("supabase.auth.token")) {
        console.log("Cambio de sesión detectado en otra pestaña");
        checkSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Manejar cuando la pestaña vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Pestaña visible, verificando sesión...");
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null; // Este componente no renderiza nada
}
