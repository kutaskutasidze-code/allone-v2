'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';
import Link from 'next/link';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, clearAll } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      addToCart({
        productId: item.id,
        name: item.name,
        image: item.image,
        variantSku: item.variantSku,
        size: item.size,
        quantity: 1,
        price: item.price,
      });
    });
  };

  const handleAddToCart = (item: (typeof items)[0]) => {
    addToCart({
      productId: item.id,
      name: item.name,
      image: item.image,
      variantSku: item.variantSku,
      size: item.size,
      quantity: 1,
      price: item.price,
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-8 w-48 bg-[var(--gray-200)] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[var(--gray-200)] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--gray-500)] mb-8">
          <Link href="/" className="hover:text-[var(--black)] transition-colors">
            მთავარი
          </Link>
          <span>/</span>
          <span className="text-[var(--black)]">სურვილები</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-semibold tracking-tight text-[var(--black)]">
              სურვილები
            </h1>
            {items.length > 0 && (
              <span className="text-sm text-[var(--gray-500)]">
                ({items.length})
              </span>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <GlassButton
                variant="transparent"
                size="sm"
                onClick={handleAddAllToCart}
                leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
              >
                ყველას დამატება
              </GlassButton>
              <GlassButton
                variant="transparent"
                size="sm"
                onClick={clearAll}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                გასუფთავება
              </GlassButton>
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <GlassPanel padding="xl" rounded="2xl" className="max-w-md w-full text-center">
              <Heart className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-4" />
              <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--black)] mb-2">
                სურვილების სია ცარიელია
              </h2>
              <p className="text-sm text-[var(--gray-500)] mb-6">
                დაამატეთ პროდუქტები გულის ხატულაზე დაჭერით
              </p>
              <GlassButton variant="transparent" href="/collections" rightIcon={<ArrowRight className="w-4 h-4" />}>
                პროდუქტების ნახვა
              </GlassButton>
            </GlassPanel>
          </motion.div>
        )}

        {/* Product Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassPanel padding="none" rounded="2xl" hover>
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-[var(--gray-100)] rounded-t-2xl overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-[var(--gray-300)]" />
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors group"
                      >
                        <X className="w-4 h-4 text-[var(--gray-500)] group-hover:text-[var(--black)]" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-[var(--font-display)] text-sm font-medium text-[var(--black)] truncate mb-1">
                        {item.name}
                      </h3>
                      {item.size && (
                        <p className="text-xs text-[var(--gray-500)] mb-2">{item.size}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--black)]">
                          ₾{item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="text-xs uppercase tracking-wider text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
                        >
                          კალათაში
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
