"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/",
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user && !toastShownRef.current) {
        // Mostrar toast informativo antes de redirigir (solo una vez)
        toastShownRef.current = true;
        const t = translations["es"];
        toast.info(t.loginRequired, {
          id: "login-required",
          description: t.loginRequiredMessage,
          duration: 4000,
        });

        // Redirigir a la página principal si se requiere autenticación pero no hay usuario
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        // Redirigir si no se requiere autenticación pero hay usuario (ej: páginas de login)
        router.push(redirectTo);
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Reset del flag cuando cambia el estado de autenticación
  useEffect(() => {
    if (user) {
      toastShownRef.current = false;
    }
  }, [user]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si se requiere autenticación pero no hay usuario, no mostrar contenido
  if (requireAuth && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            Debes iniciar sesión para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  // Si no se requiere autenticación pero hay usuario, no mostrar contenido
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}
