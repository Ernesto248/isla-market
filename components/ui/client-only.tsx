"use client";

import { useHydration } from "@/hooks/use-hydration";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que solo renderiza sus hijos en el cliente
 * para evitar errores de hidratación
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
