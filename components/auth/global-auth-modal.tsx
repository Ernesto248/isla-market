"use client";

import { useEffect } from "react";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";
import { AuthModal } from "@/components/auth/auth-modal";
import { toast } from "sonner";

export function GlobalAuthModal() {
  const {
    isOpen,
    mode,
    closeAuthModal,
    openAuthModal,
    pendingProduct,
    setPendingProduct,
  } = useAuthModal();
  const { user } = useAuth();
  const { addToCart } = useAppStore();

  // Efecto para agregar automáticamente el producto pendiente después del login
  useEffect(() => {
    if (user && pendingProduct) {
      // Usuario acaba de iniciar sesión y hay un producto pendiente
      addToCart(pendingProduct);
      toast.success("Producto agregado al carrito", {
        description: pendingProduct.name,
      });
      // Limpiar el producto pendiente
      setPendingProduct(null);
      // Cerrar el modal
      closeAuthModal();
    }
  }, [user, pendingProduct, addToCart, setPendingProduct, closeAuthModal]);

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={closeAuthModal}
      mode={mode}
      onModeChange={openAuthModal}
    />
  );
}
