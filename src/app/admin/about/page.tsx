'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from '@/components/ui';
import { ArrayInput, PageHeader } from '@/components/admin';
import type { AboutContent } from '@/types/database';
import { Save, Check, X } from 'lucide-react';

export default function AboutPage() {
  const [formData, setFormData] = useState<Partial<AboutContent>>({
    hero_subtitle: 'About Us',
    hero_title: '',
    story_subtitle: 'Our Story',
    story_title: '',
    story_paragraphs: [],
    values_subtitle: 'Our Values',
    values_title: 'What drives us',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const res = await fetch('/api/admin/about');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFormData(data);
        }
      }
    } catch (err) {
      console.error('Error fetching about content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_subtitle: formData.hero_subtitle,
          hero_title: formData.hero_title,
          story_subtitle: formData.story_subtitle,
          story_title: formData.story_title,
          story_paragraphs: formData.story_paragraphs,
          values_subtitle: formData.values_subtitle,
          values_title: formData.values_title,
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
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">About Page</h1>
          <p className="mt-1 text-sm text-[var(--gray-500)]">Edit the content displayed on your About page</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50"
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
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Hero Section */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Hero Section</h2>
          <div className="space-y-4">
            <Input
              label="Subtitle"
              value={formData.hero_subtitle || ''}
              onChange={(e) =>
                setFormData({ ...formData, hero_subtitle: e.target.value })
              }
              placeholder="About Us"
            />
            <Textarea
              label="Main Title"
              value={formData.hero_title || ''}
              onChange={(e) =>
                setFormData({ ...formData, hero_title: e.target.value })
              }
              placeholder="We help businesses unlock the power of intelligent automation"
              rows={2}
            />
          </div>
        </div>

        {/* Story Section */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Story Section</h2>
          <div className="space-y-4">
            <Input
              label="Subtitle"
              value={formData.story_subtitle || ''}
              onChange={(e) =>
                setFormData({ ...formData, story_subtitle: e.target.value })
              }
              placeholder="Our Story"
            />
            <Textarea
              label="Title"
              value={formData.story_title || ''}
              onChange={(e) =>
                setFormData({ ...formData, story_title: e.target.value })
              }
              placeholder="From vision to reality"
              rows={2}
            />
            <ArrayInput
              label="Story Paragraphs"
              value={formData.story_paragraphs || []}
              onChange={(paragraphs) =>
                setFormData({ ...formData, story_paragraphs: paragraphs })
              }
              placeholder="Add a paragraph..."
            />
          </div>
        </div>

        {/* Values Section Headers */}
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5">
          <h2 className="text-sm font-medium text-[var(--black)] mb-4">Values Section</h2>
          <div className="space-y-4">
            <Input
              label="Subtitle"
              value={formData.values_subtitle || ''}
              onChange={(e) =>
                setFormData({ ...formData, values_subtitle: e.target.value })
              }
              placeholder="Our Values"
            />
            <Input
              label="Title"
              value={formData.values_title || ''}
              onChange={(e) =>
                setFormData({ ...formData, values_title: e.target.value })
              }
              placeholder="What drives us"
            />
            <p className="text-xs text-[var(--gray-500)]">
              Manage individual values in the{' '}
              <a href="/admin/values" className="underline hover:text-[var(--black)]">
                Values section
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
