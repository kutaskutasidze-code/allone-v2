'use client';

import { motion } from 'framer-motion';

export function ConsultationCTA() {
  return (
    <section className="relative py-16 lg:py-24 overflow-x-clip">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/30 to-transparent pointer-events-none" />

      {/* Blue gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-[700px] h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 via-sky-300/35 to-blue-500/25 rounded-full blur-[90px]" />
          <div className="absolute top-10 -left-10 w-64 h-64 bg-blue-300/45 rounded-full blur-[70px]" />
          <div className="absolute -bottom-6 right-10 w-72 h-72 bg-sky-400/35 rounded-full blur-[80px]" />
          <div className="absolute top-1/4 right-1/4 w-52 h-52 bg-indigo-300/25 rounded-full blur-[60px]" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Centered text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 lg:mb-10"
        >
          <span className="inline-block font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-4">
            Not sure where to start?
          </span>
          <h2
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#071D2F] tracking-[-0.04em] leading-[1.1]"
          >
            Let&apos;s figure it out{' '}<br className="hidden sm:block" />
            together
          </h2>
          <p
            className="font-body mt-5 text-[15px] text-[#4D4D4D] max-w-lg mx-auto leading-relaxed"
          >
            Book a free 30-minute consultation. We&apos;ll learn about your business, identify opportunities, and map out a plan — no commitment.
          </p>
        </motion.div>

        {/* Glassy contact form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl mx-auto"
        >
          <form
            action="/contact"
            method="GET"
            className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_60px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.6)_inset] p-6 lg:p-8"
          >
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="w-full h-11 px-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  className="w-full h-11 px-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                className="w-full h-11 px-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all"
              />
            </div>

            {/* What are you looking for */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">What are you looking for?</label>
              <div className="flex flex-wrap gap-2">
                {['AI Chatbot', 'Website', 'Automation', 'Not sure yet'].map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input type="checkbox" name="interest" value={option} className="sr-only peer" />
                    <span className="inline-block px-3.5 py-2 rounded-xl text-xs font-medium text-gray-500 bg-white/50 border border-white/60 shadow-sm peer-checked:bg-[#0A68F5]/10 peer-checked:border-[#0A68F5]/30 peer-checked:text-[#0A68F5] transition-all hover:border-gray-300">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Tell us more <span className="text-gray-400 normal-case tracking-normal">(optional)</span></label>
              <textarea
                name="message"
                rows={3}
                placeholder="Briefly describe your project or challenge..."
                className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-colors"
            >
              Book free consultation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            {/* Footer note */}
            <p className="text-center text-[12px] text-gray-400 mt-4">
              Free 30-min call · No commitment · Response within 24h
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
