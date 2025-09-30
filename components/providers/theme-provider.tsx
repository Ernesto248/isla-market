"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, isHydrated } = useAppStore();

  useEffect(() => {
    if (isHydrated) {
      // Aplicar tema después de la hidratación
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, isHydrated]);

  return <>{children}</>;
}
