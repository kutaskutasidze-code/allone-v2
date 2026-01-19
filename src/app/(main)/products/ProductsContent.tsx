'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  BookOpen,
  Wrench,
  Zap,
  Star,
  ArrowRight,
  Check,
  Filter
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

interface ProductsContentProps {
  products: Product[];
}

const categoryConfig = {
  template: { icon: Package, label: 'Template', color: 'blue' },
  course: { icon: BookOpen, label: 'Course', color: 'purple' },
  tool: { icon: Wrench, label: 'Tool', color: 'green' },
  service: { icon: Zap, label: 'Service', color: 'orange' },
  subscription: { icon: Star, label: 'Subscription', color: 'yellow' },
};

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
};

export default function ProductsContent({ products }: ProductsContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const featuredProducts = filteredProducts.filter(p => p.is_featured);
  const regularProducts = filteredProducts.filter(p => !p.is_featured);

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--gray-200)] pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1
            className="text-4xl font-bold text-[var(--black)] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Templates & Resources
          </motion.h1>
          <motion.p
            className="text-lg text-[var(--gray-600)] max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Ready-to-use automation templates, comprehensive courses, and tools to accelerate your AI journey.
          </motion.p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[var(--gray-600)]">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-[var(--black)] text-white'
                : 'bg-white text-[var(--gray-600)] hover:bg-[var(--gray-100)] border border-[var(--gray-200)]'
            }`}
          >
            All
          </button>
          {categories.map(cat => {
            const config = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--black)] text-white'
                    : 'bg-white text-[var(--gray-600)] hover:bg-[var(--gray-100)] border border-[var(--gray-200)]'
                }`}
              >
                {config.label}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-xl font-semibold text-[var(--black)] mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredProducts.map((product, index) => (
              <FeaturedProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Products */}
      {regularProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          <h2 className="text-xl font-semibold text-[var(--black)] mb-6">All Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Package className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--gray-600)]">No products found</h3>
          <p className="text-[var(--gray-500)] mt-2">Check back soon for new products!</p>
        </div>
      )}
    </div>
  );
}

function FeaturedProductCard({ product, index }: { product: Product; index: number }) {
  const config = categoryConfig[product.category];
  const Icon = config.icon;
  const features = Array.isArray(product.features)
    ? product.features
    : typeof product.features === 'string'
      ? JSON.parse(product.features)
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white mb-3`}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            <p className="text-white/80 text-sm">{product.short_description}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.slice(0, 4).map((feature: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--gray-600)]">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Price and CTA */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-[var(--black)]">
              ${product.price}
            </span>
            {product.price_type === 'subscription' && (
              <span className="text-[var(--gray-500)] text-sm ml-1">
                /{product.billing_period === 'monthly' ? 'mo' : 'yr'}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const config = categoryConfig[product.category];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block bg-white rounded-xl border border-[var(--gray-200)] p-6 hover:border-[var(--accent)] hover:shadow-lg transition-all group"
      >
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          {product.is_featured && (
            <Star className="w-4 h-4 text-yellow-500" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-[var(--black)] mb-2 group-hover:text-[var(--accent)] transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-[var(--gray-500)] mb-4 line-clamp-2">
          {product.short_description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-[var(--black)]">
              ${product.price}
            </span>
            {product.price_type === 'subscription' && (
              <span className="text-[var(--gray-500)] text-sm ml-1">
                /{product.billing_period === 'monthly' ? 'mo' : 'yr'}
              </span>
            )}
          </div>
          <span className="text-[var(--accent)] text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            View Details
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
