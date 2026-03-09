'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { useCartStore } from '@/stores/cart';
import Link from 'next/link';

const SHIPPING_COST = 5;

export default function CartContent() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="h-8 w-32 bg-[var(--gray-200)] rounded animate-pulse mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--gray-200)] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shipping = items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--gray-500)] mb-8">
          <Link href="/" className="hover:text-[var(--black)] transition-colors">
            მთავარი
          </Link>
          <span>/</span>
          <span className="text-[var(--black)]">კალათა</span>
        </nav>

        <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-semibold tracking-tight text-[var(--black)] mb-10">
          კალათა
        </h1>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <GlassPanel padding="xl" rounded="2xl" className="max-w-md w-full text-center">
              <ShoppingBag className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-4" />
              <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--black)] mb-2">
                კალათა ცარიელია
              </h2>
              <p className="text-sm text-[var(--gray-500)] mb-6">
                დაამატეთ პროდუქტები კალათაში შოპინგის გასაგრძელებლად
              </p>
              <GlassButton variant="transparent" href="/collections" rightIcon={<ArrowRight className="w-4 h-4" />}>
                პროდუქტების ნახვა
              </GlassButton>
            </GlassPanel>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.variantSku}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassPanel padding="md" rounded="xl">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-lg bg-[var(--gray-100)] overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-[var(--gray-300)]" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-[var(--font-display)] text-sm font-medium text-[var(--black)] truncate">
                                {item.name}
                              </h3>
                              {item.size && (
                                <p className="text-xs text-[var(--gray-500)] mt-0.5">{item.size}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.productId, item.variantSku)}
                              className="p-1 hover:bg-[var(--gray-100)] rounded-full transition-colors"
                            >
                              <X className="w-4 h-4 text-[var(--gray-400)]" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center gap-2 border border-[var(--gray-200)] rounded-full">
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.variantSku, item.quantity - 1)
                                }
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.variantSku, item.quantity + 1)
                                }
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-sm font-medium text-[var(--black)]">
                              ₾{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassPanel>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <GlassPanel padding="lg" rounded="2xl">
                  <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--black)] mb-6">
                    შეჯამება
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--gray-600)]">ქვეჯამი</span>
                      <span className="text-[var(--black)]">₾{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--gray-600)]">მიწოდება</span>
                      <span className="text-[var(--black)]">₾{shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[var(--gray-200)] pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--black)]">სულ</span>
                        <span className="font-semibold text-[var(--black)]">₾{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <GlassButton
                    variant="transparent"
                    href="/checkout"
                    size="lg"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    შეკვეთის გაფორმება
                  </GlassButton>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
