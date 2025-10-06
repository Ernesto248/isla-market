"use client";

import React, { createContext, useContext, useState } from "react";
import { Product } from "@/lib/types";

interface AuthModalContextType {
  isOpen: boolean;
  mode: "login" | "signup" | "forgot-password";
  pendingProduct: Product | null;
  openAuthModal: (
    mode: "login" | "signup" | "forgot-password",
    product?: Product
  ) => void;
  closeAuthModal: () => void;
  setPendingProduct: (product: Product | null) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined
);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">(
    "login"
  );
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  const openAuthModal = (
    newMode: "login" | "signup" | "forgot-password",
    product?: Product
  ) => {
    setMode(newMode);
    setIsOpen(true);
    if (product) {
      setPendingProduct(product);
    }
  };

  const closeAuthModal = () => {
    setIsOpen(false);
    // No limpiar pendingProduct aquí, lo haremos después de agregar al carrito
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        pendingProduct,
        openAuthModal,
        closeAuthModal,
        setPendingProduct,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
