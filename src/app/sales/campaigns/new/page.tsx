'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import type { EmailTemplate } from '@/types/database';

const SERVICES = [
  { value: '', label: 'All Services' },
  { value: 'chatbots', label: 'AI Chatbots' },
  { value: 'custom_ai', label: 'Custom AI Solutions' },
  { value: 'automation', label: 'Workflow Automation' },
  { value: 'website', label: 'Website Development' },
  { value: 'consulting', label: 'AI Consulting' },
];

const COUNTRIES = [
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AZ', name: 'Azerbaijan' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_template: '',
    target_service: '',
    target_countries: [] as string[],
    min_relevance_score: 50,
    daily_limit: 50,
    is_active: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/sales/templates');
      if (res.ok) {
        const { data } = await res.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        subject: template.subject,
        body_template: template.body,
        target_service: template.target_service || '',
      }));
    }
  };

  const handleCountryToggle = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      target_countries: prev.target_countries.includes(code)
        ? prev.target_countries.filter((c) => c !== code)
        : [...prev.target_countries, code],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sales/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      router.push('/sales/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/sales/campaigns"
          className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader title="Create Campaign" description="Set up a new email outreach campaign" />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-6 space-y-6">
          <h3 className="font-medium text-[var(--black)]">Campaign Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
                placeholder="e.g., Q1 AI Chatbot Outreach"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                Use Template
              </label>
              <select
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
              placeholder="e.g., Automate {{company}} Customer Support with AI"
              required
            />
            <p className="mt-1 text-xs text-[var(--gray-400)]">
              Use {'{{company}}'}, {'{{country}}'}, {'{{industry}}'} as placeholders
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
              Email Body *
            </label>
            <textarea
              value={formData.body_template}
              onChange={(e) => setFormData((prev) => ({ ...prev, body_template: e.target.value }))}
              className="w-full px-4 py-3 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none font-mono"
              rows={12}
              placeholder="Hi,&#10;&#10;I noticed {{company}} handles..."
              required
            />
            <p className="mt-1 text-xs text-[var(--gray-400)]">
              Supports placeholders: {'{{company}}'}, {'{{country}}'}, {'{{industry}}'}, {'{{unsubscribe_link}}'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-6 space-y-6">
          <h3 className="font-medium text-[var(--black)]">Targeting</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                Target Service
              </label>
              <select
                value={formData.target_service}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_service: e.target.value }))}
                className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
              >
                {SERVICES.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                Minimum Relevance Score
              </label>
              <input
                type="number"
                value={formData.min_relevance_score}
                onChange={(e) => setFormData((prev) => ({ ...prev, min_relevance_score: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
              Target Countries
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryToggle(country.code)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.target_countries.includes(country.code)
                      ? 'bg-[var(--black)] text-white border-[var(--black)]'
                      : 'bg-white text-[var(--gray-600)] border-[var(--gray-200)] hover:border-[var(--gray-400)]'
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--gray-400)]">
              Leave empty to target all countries
            </p>
          </div>
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-6 space-y-6">
          <h3 className="font-medium text-[var(--black)]">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                Daily Email Limit
              </label>
              <input
                type="number"
                value={formData.daily_limit}
                onChange={(e) => setFormData((prev) => ({ ...prev, daily_limit: parseInt(e.target.value) || 50 }))}
                className="w-full px-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
                min={1}
                max={100}
              />
              <p className="mt-1 text-xs text-[var(--gray-400)]">
                Max 100/day (Resend free tier limit)
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--gray-300)]"
                />
                <span className="text-sm font-medium text-[var(--gray-700)]">
                  Activate campaign immediately
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/sales/campaigns"
            className="px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}
