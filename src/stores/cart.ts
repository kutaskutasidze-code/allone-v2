'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantSku: string) => void;
  updateQuantity: (productId: string, variantSku: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantSku === item.variantSku
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantSku === item.variantSku
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantSku) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantSku === variantSku)
          ),
        })),

      updateQuantity: (productId, variantSku, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.variantSku === variantSku)
                )
              : state.items.map((i) =>
                  i.productId === productId && i.variantSku === variantSku
                    ? { ...i, quantity }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'allone-cart',
    }
  )
);
