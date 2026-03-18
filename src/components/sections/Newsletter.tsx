'use client';

import { motion } from 'framer-motion';
import { NewsletterForm } from '@/components/forms';

export function Newsletter() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl lg:text-3xl font-light text-zinc-900 mb-4">
            Stay updated on AI automation
          </h2>
          <p className="text-zinc-600 mb-8">
            Get weekly insights, tips, and trends delivered to your inbox.
          </p>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
