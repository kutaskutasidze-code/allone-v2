'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  variantSku: string;
  size: string;
}

interface WishlistState {
  items: WishlistProduct[];
  addItem: (item: WishlistProduct) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearAll: () => set({ items: [] }),

      isInWishlist: (id) => get().items.some((i) => i.id === id),
    }),
    {
      name: 'allone-wishlist',
    }
  )
);
