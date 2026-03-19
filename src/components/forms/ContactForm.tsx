'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormData {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
}

const serviceKeys = [
  { value: 'chatbot', labelKey: 'form.service.chatbot' },
  { value: 'automation', labelKey: 'form.service.automation' },
  { value: 'custom_ai', labelKey: 'form.service.custom' },
  { value: 'website', labelKey: 'form.service.website' },
  { value: 'consulting', labelKey: 'form.service.consulting' },
  { value: 'other', labelKey: 'form.service.other' },
];

const inputClass =
  'w-full px-4 py-3 bg-white border border-[#EBEBEB] rounded-xl text-[#071D2F] text-sm placeholder:text-[#071D2F]/30 focus:outline-none focus:border-[#071D2F]/20 focus:shadow-[0_0_0_3px_rgba(7,29,47,0.04)] transition-all';

export function ContactForm() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    service: 'other',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setIsSuccess(true);
      setFormData({ name: '', email: '', company: '', service: 'other', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-[#EBEBEB] rounded-2xl p-10 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-[#071D2F]/[0.06] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-[#071D2F]" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[#071D2F] mb-2">{t('form.sent')}</h3>
        <p className="text-sm text-[#4D4D4D] mb-6">{t('form.thanks')}</p>
        <button
          onClick={() => setIsSuccess(false)}
          className="text-sm font-medium text-[#071D2F] hover:text-[#071D2F]/70 transition-colors"
        >
          {t('form.another')}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClass}
          placeholder={t('form.name')}
          style={{ fontSize: '16px' }}
        />
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={inputClass}
          placeholder={t('form.email')}
          style={{ fontSize: '16px' }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className={inputClass}
          placeholder={t('form.company')}
          style={{ fontSize: '16px' }}
        />
        <select
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          className={`${inputClass} appearance-none cursor-pointer`}
          style={{ fontSize: '16px' }}
        >
          {serviceKeys.map((s) => (
            <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
          ))}
        </select>
      </div>

      <textarea
        required
        rows={5}
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        className={`${inputClass} resize-none`}
        placeholder={t('form.message')}
        style={{ fontSize: '16px' }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 h-12 px-8 text-sm font-medium text-white bg-[#071D2F] rounded-full hover:bg-[#0a2a45] disabled:opacity-50 transition-all duration-150 w-full sm:w-auto cursor-pointer"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            {t('form.send')}
          </>
        )}
      </button>
    </form>
  );
}
