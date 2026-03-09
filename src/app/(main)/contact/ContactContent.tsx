'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms';

interface ContactInfo {
  email: string;
  location: string;
  phone?: string;
}

interface ContactContentProps {
  contactInfo: ContactInfo;
}

export function ContactContent({ contactInfo }: ContactContentProps) {
  return (
    <section className="min-h-screen bg-white pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <p className="mono-label mb-4">Get in touch</p>
          <h1 className="text-4xl lg:text-5xl font-semibold text-[var(--black)] tracking-[-0.03em] mb-4">
            Contact
          </h1>
          <p className="text-lg text-muted">
            Ready to automate? Let&apos;s talk about your project.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <a
              href={`mailto:${contactInfo.email}`}
              className="group flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-black/[0.04]">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[var(--black)] group-hover:text-accent transition-colors text-sm">
                {contactInfo.email}
              </span>
            </a>

            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="group flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-black/[0.04]">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[var(--black)] group-hover:text-accent transition-colors text-sm">
                  {contactInfo.phone}
                </span>
              </a>
            )}

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border">
              <div className="p-2 rounded-lg bg-black/[0.04]">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[var(--black)] text-sm">{contactInfo.location}</span>
            </div>

            {/* Office cards */}
            <div className="pt-4 space-y-3">
              <div className="rounded-xl bg-surface border border-border p-5">
                <p className="font-mono text-[11px] text-accent uppercase tracking-widest mb-1">Tbilisi</p>
                <p className="text-[var(--black)] text-sm">Georgia HQ</p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-5">
                <p className="font-mono text-[11px] text-accent uppercase tracking-widest mb-1">Brussels</p>
                <p className="text-[var(--black)] text-sm">European Office</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
