'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Box, LineChart, ShieldCheck, ArrowRight } from 'lucide-react';

const products = [
  {
    name: "allone-compress",
    tagline: "Tensor Network LLM Compression",
    description: "Achieve 90% memory reduction with <3% accuracy loss. Using iPEPS and MPO tensor decomposition to deploy billion-parameter models on edge hardware.",
    features: ["93% Parameter Reduction", "Native Matrix Factorization", "Hardware-Agnostic"],
    icon: <Box className="w-6 h-6 text-accent" />,
    status: "Beta"
  },
  {
    name: "Q-Resonance",
    tagline: "Quantum Financial Forecasting",
    description: "Predicting financial time-series with Quantum Reservoir Computing. Exploiting exponential state-space expansion for superior volatility modeling.",
    features: ["Non-linear Dynamics", "Real-time Inference", "High Directional Accuracy"],
    icon: <LineChart className="w-6 h-6 text-accent" />,
    status: "R&D"
  }
];

export function LabProducts() {
  return (
    <section className="py-24 lg:py-32 bg-white border-t border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center lg:text-left"
        >
          <p className="mono-label mb-4">The Output</p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-heading tracking-tight mb-6">
            Lab Products
          </h2>
          <p className="text-muted max-w-xl text-lg">
            Turning theoretical advantage into tangible enterprise value.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="p-10 border-border-light bg-surface-2 h-full flex flex-col relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl transition-all group-hover:bg-accent/10" />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-border-light flex items-center justify-center shadow-sm">
                    {product.icon}
                  </div>
                  <Badge className="bg-accent/10 text-accent border-accent/20">
                    {product.status}
                  </Badge>
                </div>

                <h3 className="text-3xl font-semibold text-heading mb-2">
                  {product.name}
                </h3>
                <p className="text-accent font-medium mb-6">
                  {product.tagline}
                </p>
                <p className="text-muted mb-8 leading-relaxed flex-1">
                  {product.description}
                </p>

                <div className="space-y-3 mb-10">
                  {product.features.map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-heading font-medium">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button className="w-full justify-between h-12 bg-heading hover:bg-black group">
                  Learn More
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
