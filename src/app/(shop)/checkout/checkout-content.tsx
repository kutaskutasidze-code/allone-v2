'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ShoppingBag,
  Edit3,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useCartStore } from '@/stores/cart';
import { useCheckoutStore } from '@/stores/checkout';
import { shippingInfoSchema } from '@/lib/validations/checkout';
import type { ShippingInfo } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SHIPPING_COST = 5;

export default function CheckoutContent() {
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { items, getSubtotal, clearCart } = useCartStore();
  const {
    shippingInfo,
    step,
    orderId,
    setShippingInfo,
    nextStep,
    prevStep,
    setOrderId,
    reset,
  } = useCheckoutStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to cart if empty (except on confirmation)
  useEffect(() => {
    if (mounted && items.length === 0 && step !== 'confirmation') {
      router.push('/cart');
    }
  }, [mounted, items.length, step, router]);

  const subtotal = getSubtotal();
  const shipping = items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  const handleFieldChange = useCallback(
    (field: keyof ShippingInfo, value: string) => {
      setShippingInfo({ [field]: value });
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [setShippingInfo, errors]
  );

  const validateShipping = useCallback(() => {
    const result = shippingInfoSchema.safeParse(shippingInfo);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [shippingInfo]);

  const handleContinue = () => {
    if (validateShipping()) {
      nextStep();
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping: shippingInfo,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            variantSku: item.variantSku,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            personalization: item.personalization,
          })),
          subtotal,
          shippingCost: shipping,
          total,
        }),
      });

      if (!res.ok) {
        throw new Error('Order failed');
      }

      const { orderId: newOrderId } = await res.json();
      setOrderId(newOrderId);
      clearCart();
      nextStep();
    } catch (err) {
      console.error('Checkout error:', err);
      setErrors({ _form: 'შეკვეთის გაფორმება ვერ მოხერხდა. სცადეთ თავიდან.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-8 w-64 bg-[var(--gray-200)] rounded animate-pulse mb-8" />
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 h-96 bg-[var(--gray-200)] rounded-2xl animate-pulse" />
            <div className="lg:col-span-2 h-64 bg-[var(--gray-200)] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--gray-500)] mb-8">
          <Link href="/" className="hover:text-[var(--black)] transition-colors">
            მთავარი
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-[var(--black)] transition-colors">
            კალათა
          </Link>
          <span>/</span>
          <span className="text-[var(--black)]">შეკვეთა</span>
        </nav>

        {/* Step indicator */}
        {step !== 'confirmation' && (
          <div className="flex items-center gap-3 mb-10">
            <div
              className={`text-xs uppercase tracking-wider font-medium ${
                step === 'shipping' ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
              }`}
            >
              მიწოდება
            </div>
            <div className="w-8 h-px bg-[var(--gray-300)]" />
            <div
              className={`text-xs uppercase tracking-wider font-medium ${
                step === 'review' ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
              }`}
            >
              გადახედვა
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Shipping */}
          {step === 'shipping' && (
            <motion.div
              key="shipping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-semibold tracking-tight text-[var(--black)] mb-10">
                მიწოდების ინფორმაცია
              </h1>

              <div className="grid lg:grid-cols-5 gap-8">
                {/* Form */}
                <div className="lg:col-span-3">
                  <GlassPanel padding="lg" rounded="2xl">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Input
                        label="სახელი"
                        placeholder="გიორგი"
                        value={shippingInfo.firstName || ''}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        error={errors.firstName}
                      />
                      <Input
                        label="გვარი"
                        placeholder="ბერიძე"
                        value={shippingInfo.lastName || ''}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        error={errors.lastName}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 mt-6">
                      <Input
                        label="ელფოსტა"
                        type="email"
                        placeholder="giorgi@example.com"
                        value={shippingInfo.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        error={errors.email}
                      />
                      <Input
                        label="ტელეფონი"
                        type="tel"
                        placeholder="+995 5XX XX XX XX"
                        value={shippingInfo.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        error={errors.phone}
                      />
                    </div>
                    <div className="mt-6">
                      <Input
                        label="მისამართი"
                        placeholder="რუსთაველის გამზირი 12"
                        value={shippingInfo.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        error={errors.address}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 mt-6">
                      <Input
                        label="ქალაქი"
                        placeholder="თბილისი"
                        value={shippingInfo.city || ''}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        error={errors.city}
                      />
                      <Input
                        label="საფოსტო კოდი"
                        placeholder="0108"
                        value={shippingInfo.postalCode || ''}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        error={errors.postalCode}
                      />
                    </div>
                    <div className="mt-6">
                      <Textarea
                        label="შენიშვნა (არასავალდებულო)"
                        placeholder="მიწოდების დამატებითი ინსტრუქციები..."
                        value={shippingInfo.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        error={errors.notes}
                      />
                    </div>

                    {errors._form && (
                      <p className="mt-4 text-sm text-red-600">{errors._form}</p>
                    )}

                    <div className="mt-8">
                      <GlassButton
                        variant="transparent"
                        onClick={handleContinue}
                        size="lg"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        გაგრძელება
                      </GlassButton>
                    </div>
                  </GlassPanel>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-2">
                  <OrderSummary items={items} subtotal={subtotal} shipping={shipping} total={total} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-semibold tracking-tight text-[var(--black)] mb-10">
                შეკვეთის გადახედვა
              </h1>

              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  {/* Shipping Summary */}
                  <GlassPanel padding="lg" rounded="2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wider text-[var(--gray-600)]">
                        მიწოდების ინფორმაცია
                      </h2>
                      <button
                        onClick={prevStep}
                        className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--gray-500)] hover:text-[var(--black)] transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        რედაქტირება
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-[var(--gray-700)]">
                      <p className="font-medium text-[var(--black)]">
                        {shippingInfo.firstName} {shippingInfo.lastName}
                      </p>
                      <p>{shippingInfo.address}</p>
                      <p>
                        {shippingInfo.city}, {shippingInfo.postalCode}
                      </p>
                      <p>{shippingInfo.phone}</p>
                      <p>{shippingInfo.email}</p>
                      {shippingInfo.notes && (
                        <p className="text-[var(--gray-500)] mt-2 italic">
                          {shippingInfo.notes}
                        </p>
                      )}
                    </div>
                  </GlassPanel>

                  {/* Cart Items */}
                  <GlassPanel padding="lg" rounded="2xl">
                    <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wider text-[var(--gray-600)] mb-4">
                      პროდუქტები
                    </h2>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={`${item.productId}-${item.variantSku}`}
                          className="flex gap-4 items-center"
                        >
                          <div className="w-14 h-14 rounded-lg bg-[var(--gray-100)] overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-[var(--gray-300)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--black)] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[var(--gray-500)]">
                              {item.size && `${item.size} · `}x{item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-[var(--black)]">
                            ₾{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassPanel>

                  {errors._form && (
                    <p className="text-sm text-red-600">{errors._form}</p>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      უკან
                    </button>
                    <GlassButton
                      variant="transparent"
                      onClick={handlePlaceOrder}
                      isLoading={isSubmitting}
                      size="lg"
                      rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
                    >
                      შეკვეთის გაფორმება
                    </GlassButton>
                  </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-2">
                  <OrderSummary items={items} subtotal={subtotal} shipping={shipping} total={total} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <GlassPanel padding="xl" rounded="2xl" className="max-w-lg w-full text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                </motion.div>

                <h1 className="font-[var(--font-display)] text-2xl md:text-3xl font-semibold tracking-tight text-[var(--black)] mb-3">
                  შეკვეთა მიღებულია!
                </h1>

                <p className="text-sm text-[var(--gray-600)] mb-2">
                  მადლობა შეკვეთისთვის
                </p>

                {orderId && (
                  <p className="text-xs font-mono text-[var(--gray-500)] mb-8">
                    შეკვეთის ნომერი: {orderId.slice(0, 8).toUpperCase()}
                  </p>
                )}

                <GlassButton
                  variant="transparent"
                  href="/collections"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => reset()}
                >
                  შოპინგის გაგრძელება
                </GlassButton>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Order Summary sidebar component
function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
}: {
  items: { productId: string; name: string; image: string; quantity: number; price: number; size: string }[];
  subtotal: number;
  shipping: number;
  total: number;
}) {
  return (
    <div className="sticky top-28">
      <GlassPanel padding="lg" rounded="2xl">
        <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wider text-[var(--gray-600)] mb-4">
          შეკვეთის შეჯამება
        </h2>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={`${item.productId}`}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--gray-100)] overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-3 h-3 text-[var(--gray-300)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--black)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--gray-500)]">x{item.quantity}</p>
              </div>
              <span className="text-xs font-medium text-[var(--black)]">
                ₾{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--gray-200)] pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--gray-600)]">ქვეჯამი</span>
            <span className="text-[var(--black)]">₾{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--gray-600)]">მიწოდება</span>
            <span className="text-[var(--black)]">₾{shipping.toFixed(2)}</span>
          </div>
          <div className="border-t border-[var(--gray-200)] pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-medium text-[var(--black)]">სულ</span>
              <span className="font-semibold text-[var(--black)]">₾{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
