'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User, Language, Theme } from './types';

interface AppState {
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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme and Language
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Cart
      cart: [],
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, quantity }] });
        }
      },
      removeFromCart: (productId) => {
        set({ cart: get().cart.filter(item => item.product.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set({
          cart: get().cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      },
      getCartItemsCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'isla-market-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        cart: state.cart,
        user: state.user,
      }),
    }
  )
);