'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Eye, EyeOff, ExternalLink, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { EMPLOYMENT_TYPES, employmentTypeLabel, type Vacancy } from '@/lib/validations/careers';

type VacancyRow = Vacancy & { applicant_count: number };

const emptyForm = {
  title: '',
  slug: '',
  department: '',
  employment_type: 'internship',
  location: '',
  summary: '',
  description_md: '',
  is_open: true,
  sort_order: 0,
};

const inputCls =
  'w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-900)] focus:border-gray-400 focus:outline-none';

export default function AdminCareersPage() {
  const [rows, setRows] = useState<VacancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/careers');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setRows(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (v: VacancyRow) => {
    setEditId(v.id);
    setForm({
      title: v.title,
      slug: v.slug,
      department: v.department || '',
      employment_type: v.employment_type,
      location: v.location || '',
      summary: v.summary || '',
      description_md: v.description_md || '',
      is_open: v.is_open,
      sort_order: v.sort_order,
    });
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editId ? `/api/admin/careers/${editId}` : '/api/admin/careers', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setModalOpen(false);
      await fetchRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async (v: VacancyRow) => {
    await fetch(`/api/admin/careers/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: !v.is_open }),
    });
    fetchRows();
  };

  const del = async (v: VacancyRow) => {
    if (!confirm(`Delete "${v.title}"? Applications are kept (with their title) but unlinked.`)) return;
    await fetch(`/api/admin/careers/${v.id}`, { method: 'DELETE' });
    fetchRows();
  };

  return (
    <div>
      <PageHeader
        title="Careers"
        description="Create and manage public vacancies. Applicants apply at /careers."
        action={{ label: 'New vacancy', onClick: openCreate }}
        extras={
          <Link
            href="/admin/careers/applications"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] hover:border-gray-400 transition-all"
          >
            <Users className="h-4 w-4" />
            Applications
          </Link>
        }
      />

      {error && !modalOpen && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] p-10 text-center text-sm text-[var(--ink-500)]">
          No vacancies yet. Click “New vacancy” to post one.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--ink-900)] truncate">{v.title}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-xs)] ring-1 ${
                      v.is_open
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--ink-500)] ring-gray-200'
                    }`}
                  >
                    {v.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-[var(--ink-500)]">
                  {employmentTypeLabel(v.employment_type)}
                  {v.location ? ` · ${v.location}` : ''} · /careers/{v.slug}
                </div>
              </div>

              <Link
                href={`/admin/careers/applications?vacancy=${v.id}`}
                className="text-xs text-[var(--ink-700)] hover:text-[var(--ink-900)] whitespace-nowrap"
              >
                {v.applicant_count} applicant{v.applicant_count === 1 ? '' : 's'}
              </Link>
              <a
                href={`/careers/${v.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink-400)] hover:text-[var(--ink-900)]"
                title="View public page"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button onClick={() => toggleOpen(v)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]" title={v.is_open ? 'Close' : 'Reopen'}>
                {v.is_open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => openEdit(v)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => del(v)} className="text-[var(--ink-400)] hover:text-red-600" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-lg)] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--ink-900)]">{editId ? 'Edit vacancy' : 'New vacancy'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AI & Software Engineering Intern" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Type</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Location</label>
                  <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Tbilisi (Hybrid)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Department</label>
                  <input className={inputCls} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Slug (optional)</label>
                  <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Summary (card blurb)</label>
                <input className={inputCls} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="One line shown on the careers list" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-700)] mb-1">Description (Markdown)</label>
                <textarea className={`${inputCls} font-mono resize-y`} rows={12} value={form.description_md} onChange={(e) => setForm({ ...form, description_md: e.target.value })} placeholder={'## What you\'ll do\n- ...'} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--ink-700)] cursor-pointer">
                  <input type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
                  Open (visible on the public site)
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--ink-700)]">Sort</label>
                  <input type="number" className={`${inputCls} w-20`} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--ink-700)] hover:text-[var(--ink-900)]">Cancel</button>
              <button
                onClick={save}
                disabled={saving || !form.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Create vacancy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
