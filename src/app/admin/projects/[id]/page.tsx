'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input, Textarea, Select } from '@/components/ui';
import { ArrayInput, FileUpload } from '@/components/admin';
import type { Project } from '@/types/database';
import { ArrowLeft, Save } from 'lucide-react';

const categories = [
  { value: 'Chatbots', label: 'Chatbots' },
  { value: 'Automation', label: 'Automation' },
  { value: 'Custom AI', label: 'Custom AI' },
];

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    image_url: '',
    category: 'Chatbots',
    technologies: [],
    is_published: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      router.push('/admin/projects');
      return;
    }

    setFormData(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url || null,
          category: formData.category,
          technologies: formData.technologies,
          is_published: formData.is_published,
          revenue: formData.revenue ?? 0,
          contract_url: formData.contract_url || null,
          invoice_url: formData.invoice_url || null,
          project_date: formData.project_date || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      router.push('/admin/projects');
      router.refresh();
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-black">
          Edit Project
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          Update project details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-6 space-y-6">
          <Input
            label="Project Title"
            value={formData.title || ''}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., FinTech AI Assistant"
            required
          />

          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the project, its goals, and achievements..."
            rows={4}
            required
          />

          <Input
            label="Image URL"
            value={formData.image_url || ''}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            placeholder="https://example.com/image.jpg or /images/projects/name.jpg"
            hint="Leave empty for no image"
          />

          <Select
            label="Category"
            value={formData.category || 'Chatbots'}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={categories}
          />

          <ArrayInput
            label="Technologies"
            value={formData.technologies || []}
            onChange={(technologies) =>
              setFormData({ ...formData, technologies })
            }
            placeholder="Add technology (e.g., React, Python, AWS)"
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Project Date"
              type="date"
              value={formData.project_date || new Date().toISOString().split('T')[0]}
              onChange={(e) =>
                setFormData({ ...formData, project_date: e.target.value })
              }
              hint="Date for revenue tracking"
            />
            <Input
              label="Revenue"
              type="number"
              value={(formData.revenue ?? 0).toString()}
              onChange={(e) =>
                setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              hint="Project revenue in your currency"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FileUpload
              label="Contract Document"
              value={formData.contract_url || null}
              onChange={(url) => setFormData({ ...formData, contract_url: url })}
              hint="PDF, DOC, or DOCX (max 10MB)"
            />
            <FileUpload
              label="Invoice Document"
              value={formData.invoice_url || null}
              onChange={(url) => setFormData({ ...formData, invoice_url: url })}
              hint="PDF, DOC, or DOCX (max 10MB)"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published ?? true}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--gray-300)] text-black focus:ring-black"
            />
            <label
              htmlFor="is_published"
              className="text-sm text-[var(--gray-700)]"
            >
              Published
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
            href="/admin/projects"
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
