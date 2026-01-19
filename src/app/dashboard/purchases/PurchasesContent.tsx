'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Download,
  CheckCircle,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  download_token: string;
  download_count: number;
  products: {
    id: string;
    name: string;
    slug: string;
    category: string;
    short_description: string;
  };
}

interface PurchasesContentProps {
  purchases: Purchase[];
}

export default function PurchasesContent({ purchases }: PurchasesContentProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  return (
    <div className="max-w-4xl">
      {/* Success Banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Payment successful!</p>
              <p className="text-sm text-green-600">Your purchase is now available for download.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[var(--black)]">My Purchases</h1>
        <p className="text-[var(--gray-600)]">Download your purchased products and access your files.</p>
      </motion.div>

      {/* Purchases List */}
      {purchases.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {purchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--black)] mb-1">
                        {purchase.products?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-[var(--gray-500)] mb-2">
                        {purchase.products?.short_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--gray-500)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(purchase.purchased_at).toLocaleDateString()}
                        </span>
                        <span>${purchase.amount} {purchase.currency}</span>
                        <span>{purchase.download_count} downloads</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${purchase.products?.slug}`}
                      className="p-2 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
                      title="View product"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/api/download/${purchase.download_token}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-[var(--gray-200)] p-12 text-center"
        >
          <ShoppingBag className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--black)] mb-2">No purchases yet</h3>
          <p className="text-[var(--gray-500)] mb-6">
            Browse our products and start building with automation templates.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] transition-colors"
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
