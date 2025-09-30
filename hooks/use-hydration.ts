"use client";

import { useEffect, useState } from "react";

/**
 * Hook para manejar la hidratación y evitar errores de SSR/Client mismatch
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
