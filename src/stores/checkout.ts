'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ShippingInfo } from '@/types';

type CheckoutStep = 'shipping' | 'review' | 'confirmation';

interface CheckoutState {
  shippingInfo: Partial<ShippingInfo>;
  step: CheckoutStep;
  orderId: string | null;
  setShippingInfo: (info: Partial<ShippingInfo>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setOrderId: (id: string) => void;
  reset: () => void;
}

const stepOrder: CheckoutStep[] = ['shipping', 'review', 'confirmation'];

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      shippingInfo: {},
      step: 'shipping',
      orderId: null,

      setShippingInfo: (info) =>
        set((state) => ({
          shippingInfo: { ...state.shippingInfo, ...info },
        })),

      nextStep: () =>
        set((state) => {
          const currentIndex = stepOrder.indexOf(state.step);
          const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
          return { step: stepOrder[nextIndex] };
        }),

      prevStep: () =>
        set((state) => {
          const currentIndex = stepOrder.indexOf(state.step);
          const prevIndex = Math.max(currentIndex - 1, 0);
          return { step: stepOrder[prevIndex] };
        }),

      setOrderId: (id) => set({ orderId: id }),

      reset: () =>
        set({
          shippingInfo: {},
          step: 'shipping',
          orderId: null,
        }),
    }),
    {
      name: 'allone-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
