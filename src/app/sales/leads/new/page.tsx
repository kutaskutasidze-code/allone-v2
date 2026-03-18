'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { Input, Textarea, Select } from '@/components/ui';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/validations/leads';
import type { LeadStatus } from '@/types/database';

export default function NewLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new' as LeadStatus,
    value: 0,
    source: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      router.push('/sales/leads');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Back Link */}
      <Link
        href="/sales/leads"
        className="inline-flex items-center gap-2 text-sm text-[var(--gray-500)] hover:text-[var(--black)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">Add New Lead</h1>
        <p className="mt-1 text-sm text-[var(--gray-500)]">Create a new lead in your pipeline</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Contact Information</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-1234"
              />
            </div>
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>
        </div>

        {/* Lead Details */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Lead Details</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <Input
                label="Value ($)"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                placeholder="10000"
                min={0}
              />
            </div>
            <Select
              label="Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              options={[
                { value: '', label: 'Select a source...' },
                ...LEAD_SOURCES.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Notes</h2>
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes about this lead..."
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/sales/leads"
            className="px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--black)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
