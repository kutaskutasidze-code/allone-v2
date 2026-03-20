'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export function ConsultationCTA() {
  const { t } = useI18n();
  return (
    <section className="relative py-12 lg:py-16 overflow-x-clip">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/30 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <span className="inline-block font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-3">
            {t('services.consult.label')}
          </span>
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-[#071D2F] tracking-[-0.04em] leading-[1.1]">
            {t('services.consult.h2')}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-lg mx-auto"
        >
          <form
            action="/contact"
            method="GET"
            className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_60px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.6)_inset] p-5 lg:p-6"
          >
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('services.consult.name')}</label>
                <input type="text" name="name" placeholder={t('services.consult.name')} className="w-full h-9 px-3 rounded-lg bg-white/50 backdrop-blur-md border border-gray-200/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('services.consult.email')}</label>
                <input type="email" name="email" placeholder="you@company.com" className="w-full h-9 px-3 rounded-lg bg-white/50 backdrop-blur-md border border-gray-200/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('services.consult.phone')}</label>
                <input type="tel" name="phone" placeholder="+995 5XX XXX XXX" className="w-full h-9 px-3 rounded-lg bg-white/50 backdrop-blur-md border border-gray-200/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('services.consult.looking')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'services.consult.chatbot', value: 'Chatbot' },
                    { key: 'services.consult.website', value: 'Website' },
                    { key: 'services.consult.automation', value: 'Automation' },
                    { key: 'services.consult.other', value: 'Other' },
                  ].map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input type="checkbox" name="interest" value={option.value} className="sr-only peer" />
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 bg-white/50 border border-gray-200/60 peer-checked:bg-[#0A68F5]/10 peer-checked:border-[#0A68F5]/30 peer-checked:text-[#0A68F5] transition-all hover:border-gray-300">
                        {t(option.key)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{t('services.consult.message')} <span className="text-gray-400 normal-case tracking-normal">{t('services.consult.optional')}</span></label>
              <textarea name="message" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/50 backdrop-blur-md border border-gray-200/60 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-[#0A68F5]/40 focus:ring-1 focus:ring-[#0A68F5]/20 transition-all" />
            </div>

            <button type="submit" className="w-full h-10 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-colors">
              {t('services.consult.submit')}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>

            <p className="text-center text-[11px] text-gray-400 mt-3">{t('services.consult.footer')}</p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
