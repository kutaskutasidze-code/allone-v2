'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  BookOpen,
  Wrench,
  Zap,
  Star,
  ArrowLeft,
  Check,
  ShieldCheck,
  Download,
  RefreshCw,
  HeadphonesIcon,
  Loader2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  price_type: 'one_time' | 'subscription';
  billing_period: string | null;
  category: 'template' | 'course' | 'tool' | 'service' | 'subscription';
  features: string[];
  thumbnail_url: string | null;
  is_featured: boolean;
}

interface ProductDetailContentProps {
  product: Product;
}

const categoryConfig = {
  template: { icon: Package, label: 'Template' },
  course: { icon: BookOpen, label: 'Course' },
  tool: { icon: Wrench, label: 'Tool' },
  service: { icon: Zap, label: 'Service' },
  subscription: { icon: Star, label: 'Subscription' },
};

export default function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const config = categoryConfig[product.category];
  const Icon = config.icon;
  const features = Array.isArray(product.features)
    ? product.features
    : typeof product.features === 'string'
      ? JSON.parse(product.features)
      : [];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email || '' });
      }
    };
    getUser();
  }, [supabase.auth]);

  const handleCheckout = async () => {
    const email = user?.email || guestEmail;

    if (!email) {
      alert('Please enter your email to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Create PayPal order
      const response = await fetch('/api/checkout/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          email,
        }),
      });

      const data = await response.json();

      if (data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-transparent border-b border-[var(--gray-200)] pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Category Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
                <Icon className="w-4 h-4" />
                {config.label}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--black)] mb-4">
                {product.name}
              </h1>

              {/* Short Description */}
              <p className="text-lg text-[var(--gray-600)] mb-8">
                {product.short_description}
              </p>

              {/* Full Description */}
              {product.description && (
                <div className="prose prose-gray max-w-none mb-8">
                  <h2 className="text-xl font-semibold text-[var(--black)] mb-4">About this {config.label.toLowerCase()}</h2>
                  <p className="text-[var(--gray-600)] whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="bg-transparent backdrop-blur-sm rounded-2xl border border-[var(--gray-200)] p-6 mb-8">
                <h2 className="text-lg font-semibold text-[var(--black)] mb-4">What&apos;s Included</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-[var(--gray-700)]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Guarantees */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 text-sm text-[var(--gray-600)]">
                  <Download className="w-5 h-5 text-[var(--accent)]" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--gray-600)]">
                  <RefreshCw className="w-5 h-5 text-[var(--accent)]" />
                  <span>Lifetime Updates</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--gray-600)]">
                  <HeadphonesIcon className="w-5 h-5 text-[var(--accent)]" />
                  <span>Email Support</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-8"
            >
              <div className="bg-transparent backdrop-blur-sm rounded-2xl border border-[var(--gray-200)] p-6">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-[var(--black)]">
                    ${product.price}
                    {product.price_type === 'subscription' && (
                      <span className="text-lg font-normal text-[var(--gray-500)]">
                        /{product.billing_period === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--gray-500)] mt-1">
                    {product.price_type === 'one_time' ? 'One-time payment' : 'Billed ' + product.billing_period}
                  </p>
                </div>

                {/* Guest Email (if not logged in) */}
                {!user && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--gray-300)] text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-black transition-colors backdrop-blur-sm"
                    />
                    <p className="text-xs text-[var(--gray-500)] mt-1.5">
                      We&apos;ll send your download link here
                    </p>
                  </div>
                )}

                {user && (
                  <div className="mb-4 p-3 bg-transparent border border-[var(--gray-300)] rounded-lg backdrop-blur-sm">
                    <p className="text-sm text-[var(--gray-600)]">
                      Signed in as <span className="font-medium text-[var(--black)]">{user.email}</span>
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || (!user && !guestEmail)}
                  className="w-full py-4 px-6 bg-transparent text-[var(--black)] font-semibold rounded-xl border border-[var(--gray-300)] hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 backdrop-blur-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.1a.641.641 0 0 1 .632-.533h6.545c2.208 0 3.799.452 4.728 1.342.938.9 1.193 2.13.75 3.654l-.008.031a5.96 5.96 0 0 1-.164.605l-.014.044.006.017c.346.916.263 2.052-.258 3.214-.527 1.173-1.406 2.203-2.58 2.922-1.154.708-2.584 1.073-4.177 1.073H8.03l-1.155 6.868h.2Zm13.04-15.64-.006.019-.014.05a8.083 8.083 0 0 1-.182.684l-.018.06a6.6 6.6 0 0 1-.296.814c-.584 1.301-1.58 2.407-2.89 3.18-1.31.773-2.93 1.168-4.678 1.168H9.26a.641.641 0 0 0-.633.533l-1.324 7.873h3.382l.84-4.98a.641.641 0 0 1 .634-.534h2.062c3.694 0 6.405-1.515 7.578-4.504.532-1.357.608-2.578.317-3.637a3.098 3.098 0 0 0-.5-.726Z"/>
                      </svg>
                      Pay with PayPal
                    </>
                  )}
                </button>

                {/* Or sign in */}
                {!user && (
                  <p className="text-center text-sm text-[var(--gray-500)] mt-4">
                    Have an account?{' '}
                    <Link href={`/login?redirect=/products/${product.slug}`} className="text-[var(--accent)] hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[var(--gray-500)]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure payment via PayPal</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
