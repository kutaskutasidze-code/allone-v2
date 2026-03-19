'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms';
import { useI18n } from '@/lib/i18n';
import { GradientBlobs } from '@/components/ui/GradientBlobs';

interface ContactInfo {
  email: string;
  location: string;
  phone?: string;
}

interface ContactContentProps {
  contactInfo: ContactInfo;
}

export function ContactContent({ contactInfo }: ContactContentProps) {
  const { t } = useI18n();

  return (
    <section className="min-h-screen bg-white/95 pt-28 pb-20 lg:pt-36 lg:pb-28 relative overflow-hidden">
      {/* Gradient blobs in background */}
      <GradientBlobs variant="subtle" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <p className="mono-label mb-4">{t('contact.label')}</p>
          <h1 className="text-4xl lg:text-5xl font-semibold text-[var(--black)] tracking-[-0.03em] mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-muted">
            {t('contact.desc')}
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
              className="group flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-[#EBEBEB] hover:border-accent/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-[#071D2F]/[0.04]">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[var(--black)] group-hover:text-accent transition-colors text-sm">
                {contactInfo.email}
              </span>
            </a>

            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="group flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-[#EBEBEB] hover:border-accent/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-[#071D2F]/[0.04]">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[var(--black)] group-hover:text-accent transition-colors text-sm">
                  {contactInfo.phone}
                </span>
              </a>
            )}

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-[#EBEBEB]">
              <div className="p-2 rounded-lg bg-[#071D2F]/[0.04]">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[var(--black)] text-sm">{contactInfo.location}</span>
            </div>

            {/* Office cards */}
            <div className="pt-4 space-y-3">
              <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-[#EBEBEB] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200">
                <p className="font-mono text-[11px] text-accent uppercase tracking-widest mb-1">{t('contact.tbilisi')}</p>
                <p className="text-[var(--black)] text-sm">{t('contact.tbilisi.sub')}</p>
              </div>
              <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-[#EBEBEB] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200">
                <p className="font-mono text-[11px] text-accent uppercase tracking-widest mb-1">{t('contact.brussels')}</p>
                <p className="text-[var(--black)] text-sm">{t('contact.brussels.sub')}</p>
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
