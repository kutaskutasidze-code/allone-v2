'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, Upload, FileText, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CV_ACCEPT, CV_EXT_RE } from '@/lib/validations/careers';

const inputClass =
  'w-full px-4 py-3 bg-white border border-[#EBEBEB] rounded-xl text-[#071D2F] text-sm placeholder:text-[#071D2F]/30 focus:outline-none focus:border-[#071D2F]/20 focus:shadow-[0_0_0_3px_rgba(7,29,47,0.04)] transition-all';

export function ApplicationForm({
  vacancyId,
  vacancyTitle,
}: {
  vacancyId: string;
  vacancyTitle: string;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    note: '',
    website_url: '', // honeypot
  });
  const [cv, setCv] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !CV_EXT_RE.test(f.name)) {
      setError('Use a PDF or Word document for your CV.');
      return;
    }
    setError(null);
    setCv(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cv) {
      setError('Please attach your CV.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // 1) Get a one-time signed upload URL.
      const urlRes = await fetch('/api/careers/cv-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancy_id: vacancyId, filename: cv.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || 'Could not start the upload');
      const { path, token } = urlData.data;

      // 2) Upload the CV straight to Storage (no API body-size limit).
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from('applications')
        .uploadToSignedUrl(path, token, cv);
      if (upErr) throw new Error('Could not upload your CV. Please try again.');

      // 3) Submit the application referencing the uploaded CV.
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancy_id: vacancyId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          linkedin: form.linkedin,
          note: form.note,
          website_url: form.website_url,
          cv_path: path,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      setIsSuccess(true);
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
        <h3 className="font-display text-xl font-semibold text-[#071D2F] mb-2">Application received</h3>
        <p className="text-sm text-[#4D4D4D]">
          Thanks for applying for {vacancyTitle}. If it&apos;s a fit, we&apos;ll reach out by email.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot */}
      <input
        type="text"
        name="website_url"
        value={form.website_url}
        onChange={set('website_url')}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
      />

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
        <input type="text" required value={form.name} onChange={set('name')} className={inputClass} placeholder="Full name" style={{ fontSize: '16px' }} />
        <input type="email" required value={form.email} onChange={set('email')} className={inputClass} placeholder="Email" style={{ fontSize: '16px' }} />
      </div>

      <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="Phone (optional)" style={{ fontSize: '16px' }} />

      <input type="url" value={form.linkedin} onChange={set('linkedin')} className={inputClass} placeholder="LinkedIn profile URL (optional)" style={{ fontSize: '16px' }} />

      <textarea
        rows={4}
        value={form.note}
        onChange={set('note')}
        className={`${inputClass} resize-none`}
        placeholder="Tell us how you use AI in your work — and anything else you'd like us to know (optional)"
        style={{ fontSize: '16px' }}
      />

      {/* CV upload */}
      <div>
        <input ref={fileRef} type="file" accept={CV_ACCEPT} onChange={onFile} className="hidden" />
        {cv ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#EBEBEB] rounded-xl">
            <FileText className="w-5 h-5 text-[#0369a1] shrink-0" />
            <span className="flex-1 text-sm text-[#071D2F] truncate">{cv.name}</span>
            <button type="button" onClick={() => { setCv(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-[#4D4D4D] hover:text-[#071D2F]">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#4D4D4D] hover:border-[#0369a1] hover:text-[#071D2F] transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload your CV (PDF or Word)
          </button>
        )}
      </div>

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
            Submit application
          </>
        )}
      </button>
    </form>
  );
}
