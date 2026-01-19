'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
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
          className="max-w-3xl mb-16"
        >
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-4">
            Get in Touch
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-zinc-900 leading-[1.1] mb-6">
            Let's Talk
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Have a project in mind? We'd love to hear about it.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Info - Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Email Card */}
            <a
              href={`mailto:${contactInfo.email}`}
              className="group block"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Email</p>
                  <p className="text-zinc-900 font-medium group-hover:text-zinc-700 transition-colors">
                    {contactInfo.email}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </a>

            {/* Phone Card */}
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="group block"
              >
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Phone</p>
                    <p className="text-zinc-900 font-medium group-hover:text-zinc-700 transition-colors">
                      {contactInfo.phone}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            )}

            {/* Location Card */}
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Location</p>
                <p className="text-zinc-900 font-medium">
                  {contactInfo.location}
                </p>
              </div>
            </div>

            {/* Response Time */}
            <p className="text-sm text-zinc-500 pl-1">
              We typically respond within 24 hours
            </p>
          </motion.div>

          {/* Contact Form - Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl border border-zinc-200 p-6 lg:p-8"
          >
            <h3 className="text-xl font-medium text-zinc-900 mb-6">
              Send us a message
            </h3>
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
