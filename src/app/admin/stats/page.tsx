'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
import { Input } from '@/components/ui';
import type { Stat } from '@/types/database';
import { Trash2, BarChart3, X, Save } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStat, setNewStat] = useState({ value: '', label: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching stats:', error);
    } else {
      setStats(data || []);
    }
    setIsLoading(false);
  };

  const handleChange = (id: string, field: 'value' | 'label', newValue: string) => {
    setStats(stats.map((s) => (s.id === id ? { ...s, [field]: newValue } : s)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase.from('stats').upsert(
      stats.map((s, index) => ({
        id: s.id,
        value: s.value,
        label: s.label,
        display_order: index,
        updated_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error('Error saving stats:', error);
    } else {
      setHasChanges(false);
    }

    setIsSaving(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStat.value || !newStat.label) return;

    const { data, error } = await supabase
      .from('stats')
      .insert({
        value: newStat.value,
        label: newStat.label,
        display_order: stats.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding stat:', error);
    } else if (data) {
      setStats([...stats, data]);
      setNewStat({ value: '', label: '' });
      setShowAddForm(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const { error } = await supabase.from('stats').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting stat:', error);
    } else {
      setStats(stats.filter((s) => s.id !== deleteId));
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">Stats</h1>
          <p className="mt-1 text-sm text-[var(--gray-500)]">{stats.length} statistic{stats.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--black)] bg-white border border-[var(--gray-200)] rounded-lg hover:bg-white"
          >
            Add Stat
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 mx-4 border border-[var(--gray-200)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-[var(--black)]">Add Stat</h2>
              <button onClick={() => setShowAddForm(false)} className="text-[var(--gray-400)] hover:text-[var(--black)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="Value"
                value={newStat.value}
                onChange={(e) => setNewStat({ ...newStat, value: e.target.value })}
                placeholder="e.g., 50+"
                required
              />
              <Input
                label="Label"
                value={newStat.label}
                onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
                placeholder="e.g., Projects"
                required
              />
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-[var(--gray-600)] hover:text-[var(--black)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)]"
                >
                  Add Stat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stats.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No stats yet"
          description="Add statistics to display on your About page."
          action={{ label: 'Add Stat', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-white border border-[var(--gray-200)] rounded-xl"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => handleChange(stat.id, 'value', e.target.value)}
                  className="w-full text-2xl font-semibold text-[var(--black)] bg-transparent border-0 border-b border-transparent focus:border-[var(--gray-300)] focus:outline-none"
                  placeholder="Value"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => handleChange(stat.id, 'label', e.target.value)}
                  className="w-full text-sm text-[var(--gray-500)] bg-transparent border-0 border-b border-transparent focus:border-[var(--gray-300)] focus:outline-none"
                  placeholder="Label"
                />
                <button
                  onClick={() => setDeleteId(stat.id)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--gray-400)] hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Stat"
        message="Are you sure you want to delete this stat? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
