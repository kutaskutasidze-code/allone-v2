'use client';

import { useState, useEffect } from 'react';
import type { ContactInfo } from '@/types/database';
import { Save, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState<Partial<ContactInfo>>({
    email: '',
    location: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const res = await fetch('/api/admin/contact-info');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFormData(data);
        }
      }
    } catch (err) {
      console.error('Error fetching contact info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.location) return;

    setIsSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/admin/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          location: formData.location,
          phone: formData.phone || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await res.json();
      setFormData(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">Contact</h1>
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">Manage your website contact information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !formData.email || !formData.location}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:bg-[var(--ink-800)] active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      <div className="rounded-[var(--radius-md)] border border-[var(--allone-line-soft)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] shadow-black/[0.02] p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@allonelabs.com"
              required
              className="w-full px-0 py-2 text-sm bg-transparent border-0 border-b border-[var(--allone-line)] focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
              required
              className="w-full px-0 py-2 text-sm bg-transparent border-0 border-b border-[var(--allone-line)] focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-2">
              Phone Number <span className="text-[var(--ink-400)]">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-0 py-2 text-sm bg-transparent border-0 border-b border-[var(--allone-line)] focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
