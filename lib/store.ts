"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Product,
  CartItem,
  User,
  Language,
  Theme,
  ProductVariant,
} from "./types";

interface AppState {
  // Hydration
  isHydrated: boolean;
  setHydrated: () => void;

  // Theme and Language
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant | null
  ) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Hydration
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),

      // Theme and Language
      theme: "light",
      language: "es",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      // User
      user: null,
      setUser: (user) => set({ user }),

      // Cart
      cart: [],
      addToCart: (product, quantity = 1, variant = null) => {
        const { cart } = get();

        // Crear ID único para el item: productId + variantId (si existe)
        const itemKey = variant ? `${product.id}-${variant.id}` : product.id;

        // Buscar item existente (mismo producto Y misma variante)
        const existingItem = cart.find((item) => {
          const existingKey = item.variant_id
            ? `${item.product.id}-${item.variant_id}`
            : item.product.id;
          return existingKey === itemKey;
        });

        // Obtener stock disponible (variante o producto)
        const availableStock = variant
          ? variant.stock_quantity || 0
          : product.stock_quantity || product.stock || 0;

        const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
        const totalRequestedQuantity = currentQuantityInCart + quantity;

        if (totalRequestedQuantity > availableStock) {
          console.warn(
            `Not enough stock for ${product.name}${
              variant ? ` (${variant.attributes_display})` : ""
            }. Available: ${availableStock}, Requested: ${totalRequestedQuantity}`
          );
          return;
        }

        if (existingItem) {
          // Actualizar cantidad del item existente
          set({
            cart: cart.map((item) => {
              const existingKey = item.variant_id
                ? `${item.product.id}-${item.variant_id}`
                : item.product.id;
              return existingKey === itemKey
                ? { ...item, quantity: item.quantity + quantity }
                : item;
            }),
          });
        } else {
          // Agregar nuevo item al carrito
          set({
            cart: [
              ...cart,
              {
                product,
                quantity,
                variant_id: variant?.id || null,
                variant: variant || null,
              },
            ],
          });
        }
      },
      removeFromCart: (productId, variantId = null) => {
        set({
          cart: get().cart.filter((item) => {
            // Si se especifica variantId, filtrar por producto Y variante
            if (variantId) {
              return !(
                item.product.id === productId && item.variant_id === variantId
              );
            }
            // Si no, filtrar solo por producto (compatibilidad hacia atrás)
            return item.product.id !== productId;
          }),
        });
      },
      updateQuantity: (productId, quantity, variantId = null) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantId);
          return;
        }

        const { cart } = get();

        // Buscar el item específico (producto + variante si aplica)
        const item = cart.find((item) => {
          if (variantId) {
            return (
              item.product.id === productId && item.variant_id === variantId
            );
          }
          return item.product.id === productId && !item.variant_id;
        });

        if (item) {
          // Obtener stock disponible (variante o producto)
          const availableStock = item.variant
            ? item.variant.stock_quantity || 0
            : item.product.stock_quantity || item.product.stock || 0;

          if (quantity > availableStock) {
            console.warn(
              `Not enough stock for ${item.product.name}${
                item.variant ? ` (${item.variant.attributes_display})` : ""
              }. Available: ${availableStock}, Requested: ${quantity}`
            );
            return;
          }
        }

        set({
          cart: get().cart.map((item) => {
            // Actualizar el item que coincida con producto (y variante si aplica)
            if (variantId) {
              return item.product.id === productId &&
                item.variant_id === variantId
                ? { ...item, quantity }
                : item;
            }
            return item.product.id === productId && !item.variant_id
              ? { ...item, quantity }
              : item;
          }),
        });
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          // Usar precio de variante si existe, sino precio del producto
          const price = item.variant ? item.variant.price : item.product.price;
          return total + price * item.quantity;
        }, 0);
      },
      getCartItemsCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "isla-market-store",
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        cart: state.cart,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
