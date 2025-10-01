"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Si aún está cargando la autenticación, esperar
      if (loading) {
        return;
      }

      // Si no hay usuario, redirigir a home
      if (!user) {
        toast.error("Acceso Denegado", {
          description:
            "Debes iniciar sesión para acceder al panel de administración",
        });
        router.push("/");
        return;
      }

      // Verificar si el usuario es admin
      // El campo 'role' viene del contexto de autenticación
      if (user.role === "admin") {
        setIsAdmin(true);
        setIsVerifying(false);
      } else {
        toast.error("Acceso Denegado", {
          description: "No tienes permisos de administrador",
        });
        router.push("/");
      }
    };

    verifyAdmin();
  }, [user, loading, router]);

  // Mostrar loading mientras se verifica
  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, mostrar mensaje de error
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>
      </div>
    );
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>;
}
