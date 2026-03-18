'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input, Textarea, Select } from '@/components/ui';
import { ArrayInput, StatsInput } from '@/components/admin';
import { ArrowLeft, Save } from 'lucide-react';

const iconOptions = [
  { value: 'MessageSquare', label: 'MessageSquare (Chatbots)' },
  { value: 'Workflow', label: 'Workflow (Automation)' },
  { value: 'Brain', label: 'Brain (AI/ML)' },
  { value: 'LineChart', label: 'LineChart (Analytics)' },
  { value: 'Settings', label: 'Settings (Consulting)' },
  { value: 'Code', label: 'Code (Development)' },
  { value: 'Database', label: 'Database (Data)' },
  { value: 'Shield', label: 'Shield (Security)' },
];

const cardTypeOptions = [
  { value: '', label: 'None (Generic card)' },
  { value: 'chatbot', label: 'AI Chatbots & Assistants' },
  { value: 'custom_ai', label: 'Custom AI Solutions' },
  { value: 'workflow', label: 'Workflow Automation' },
  { value: 'website', label: 'Website Development' },
  { value: 'consulting', label: 'Strategy & Consulting' },
];

export default function NewServicePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'MessageSquare',
    features: [] as string[],
    subtitle: '',
    secondary_description: '',
    stats: [] as { value: string; label: string }[],
    footer_text: '',
    cta_text: '',
    cta_url: '',
    card_type: '',
    is_published: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: lastService } = await supabase
        .from('services')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const display_order = lastService ? lastService.display_order + 1 : 0;

      const { error: insertError } = await supabase.from('services').insert({
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        features: formData.features,
        subtitle: formData.subtitle || null,
        secondary_description: formData.secondary_description || null,
        stats: formData.stats,
        footer_text: formData.footer_text || null,
        cta_text: formData.cta_text || null,
        cta_url: formData.cta_url || null,
        card_type: formData.card_type || null,
        is_published: formData.is_published,
        display_order,
      });

      if (insertError) {
        throw insertError;
      }

      router.push('/admin/services');
      router.refresh();
    } catch (err) {
      console.error('Error creating service:', err);
      setError('Failed to create service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-black">
          Add New Service
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          Create a new service offering
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold text-black border-b border-[var(--gray-200)] pb-3 -mt-1">Basic Information</h2>

          <Input
            label="Service Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., AI Chatbots & Assistants"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Main description of the service..."
            rows={3}
            required
          />

          <Input
            label="Subtitle (optional)"
            value={formData.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, subtitle: e.target.value })
            }
            placeholder="e.g., Conversations that actually help"
          />

          <Textarea
            label="Secondary Description (optional)"
            value={formData.secondary_description}
            onChange={(e) =>
              setFormData({ ...formData, secondary_description: e.target.value })
            }
            placeholder="Additional description paragraph..."
            rows={3}
          />

          <Select
            label="Card Type (Landing Page)"
            value={formData.card_type}
            onChange={(e) =>
              setFormData({ ...formData, card_type: e.target.value })
            }
            options={cardTypeOptions}
          />

          <Select
            label="Icon"
            value={formData.icon}
            onChange={(e) =>
              setFormData({ ...formData, icon: e.target.value })
            }
            options={iconOptions}
          />
        </div>

        {/* Features & Stats */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold text-black border-b border-[var(--gray-200)] pb-3 -mt-1">Features & Statistics</h2>

          <ArrayInput
            label="Features / Tags"
            value={formData.features}
            onChange={(features) =>
              setFormData({ ...formData, features })
            }
            placeholder="Add a feature (e.g., Natural language understanding)"
          />

          <StatsInput
            label="Statistics (shown on card)"
            value={formData.stats}
            onChange={(stats) =>
              setFormData({ ...formData, stats })
            }
          />
        </div>

        {/* CTA & Footer */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold text-black border-b border-[var(--gray-200)] pb-3 -mt-1">Call to Action & Footer</h2>

          <Input
            label="Footer Text (optional)"
            value={formData.footer_text}
            onChange={(e) =>
              setFormData({ ...formData, footer_text: e.target.value })
            }
            placeholder="e.g., Connect your tools. Data flows automatically."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CTA Button Text (optional)"
              value={formData.cta_text}
              onChange={(e) =>
                setFormData({ ...formData, cta_text: e.target.value })
              }
              placeholder="e.g., Book a free call"
            />
            <Input
              label="CTA Button URL (optional)"
              value={formData.cta_url}
              onChange={(e) =>
                setFormData({ ...formData, cta_url: e.target.value })
              }
              placeholder="e.g., /contact"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[var(--gray-100)]">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--gray-300)] text-black focus:ring-black"
            />
            <label
              htmlFor="is_published"
              className="text-sm text-[var(--gray-700)]"
            >
              Publish immediately
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/services"
            className="px-6 py-2.5 text-sm font-medium text-[var(--gray-600)] hover:text-black transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--gray-800)] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
