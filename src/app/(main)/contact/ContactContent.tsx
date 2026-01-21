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
    <section className="min-h-screen bg-white pt-28 pb-20 lg:pt-36 lg:pb-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-light text-zinc-900">
            Contact
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Info - Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Email */}
            <a
              href={`mailto:${contactInfo.email}`}
              className="group flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-900 group-hover:text-zinc-600 transition-colors">
                {contactInfo.email}
              </span>
            </a>

            {/* Phone */}
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="group flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-900 group-hover:text-zinc-600 transition-colors">
                  {contactInfo.phone}
                </span>
              </a>
            )}

            {/* Location */}
            <div className="flex items-center gap-3 p-4">
              <MapPin className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-900">
                {contactInfo.location}
              </span>
            </div>
          </motion.div>

          {/* Contact Form - Right Column */}
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
