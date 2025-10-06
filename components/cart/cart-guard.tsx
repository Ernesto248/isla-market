"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";

/**
 * Componente que limpia el carrito cuando el usuario no está autenticado
 */
export function CartGuard() {
  const { user } = useAuth();
  const { cart, clearCart } = useAppStore();

  useEffect(() => {
    // Si no hay usuario y hay items en el carrito, limpiar el carrito
    if (!user && cart.length > 0) {
      clearCart();
    }
  }, [user, cart.length, clearCart]);

  return null;
}
