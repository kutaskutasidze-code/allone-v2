'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { ContactForm } from '@/components/forms';
import { useI18n } from '@/lib/i18n';

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
    <section className="min-h-screen bg-white pt-8 sm:pt-20 lg:pt-28 pb-20 lg:pb-28">
      <div className="max-w-[1080px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 lg:mb-20"
        >
          <p className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-3">
            {t('contact.label')}
          </p>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold text-[#071D2F] leading-[1.1] tracking-[-0.047em] mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-base text-[#4D4D4D] max-w-md leading-relaxed">
            {t('contact.desc')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            {/* Email */}
            <a
              href={`mailto:${contactInfo.email}`}
              className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EBEBEB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#071D2F]/[0.05] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#071D2F]" />
                </div>
                <div>
                  <p className="text-xs text-[#4D4D4D]">Email</p>
                  <p className="text-sm font-medium text-[#071D2F]">{contactInfo.email}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#071D2F]/30 group-hover:text-[#071D2F] transition-colors" />
            </a>

            {/* Phone */}
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EBEBEB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#071D2F]/[0.05] flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#071D2F]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#4D4D4D]">Phone</p>
                    <p className="text-sm font-medium text-[#071D2F]">{contactInfo.phone}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#071D2F]/30 group-hover:text-[#071D2F] transition-colors" />
              </a>
            )}

            {/* Location */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#EBEBEB]">
              <div className="w-9 h-9 rounded-xl bg-[#071D2F]/[0.05] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#071D2F]" />
              </div>
              <div>
                <p className="text-xs text-[#4D4D4D]">Location</p>
                <p className="text-sm font-medium text-[#071D2F]">{contactInfo.location}</p>
              </div>
            </div>

            {/* Office cards */}
            <div className="pt-4 space-y-3">
              {[
                { label: t('contact.tbilisi'), desc: t('contact.tbilisi.sub'), num: '01' },
                { label: t('contact.brussels'), desc: t('contact.brussels.sub'), num: '02' },
              ].map((office) => (
                <div key={office.num} className="flex flex-col gap-2 p-5 rounded-2xl bg-[#FAFAFA] border border-[#EBEBEB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200">
                  <span className="font-mono text-lg text-[#071D2F]/20">{office.num}</span>
                  <h4 className="font-display text-sm font-semibold text-[#071D2F]">{office.label}</h4>
                  <p className="text-xs text-[#4D4D4D]">{office.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
