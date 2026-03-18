'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
import { Input, Textarea } from '@/components/ui';
import type { CompanyValue } from '@/types/database';
import { Pencil, Trash2, Heart, X, Save } from 'lucide-react';

export default function ValuesPage() {
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ number: '', title: '', description: '' });
  const [editData, setEditData] = useState({ number: '', title: '', description: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    const { data, error } = await supabase
      .from('company_values')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching values:', error);
    } else {
      setValues(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.title || !formData.description) return;

    const { data, error } = await supabase
      .from('company_values')
      .insert({
        number: formData.number,
        title: formData.title,
        description: formData.description,
        display_order: values.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding value:', error);
    } else if (data) {
      setValues([...values, data]);
      setFormData({ number: '', title: '', description: '' });
      setShowAddForm(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('company_values')
      .update({
        number: editData.number,
        title: editData.title,
        description: editData.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating value:', error);
    } else {
      setValues(
        values.map((v) =>
          v.id === id ? { ...v, ...editData } : v
        )
      );
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const { error } = await supabase.from('company_values').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting value:', error);
    } else {
      setValues(values.filter((v) => v.id !== deleteId));
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  const startEdit = (value: CompanyValue) => {
    setEditingId(value.id);
    setEditData({
      number: value.number,
      title: value.title,
      description: value.description,
    });
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
      <PageHeader
        title="Values"
        description={`${values.length} value${values.length !== 1 ? 's' : ''}`}
        action={{ label: 'Add Value', onClick: () => setShowAddForm(true) }}
      />

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 mx-4 border border-[var(--gray-200)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-[var(--black)]">Add Value</h2>
              <button onClick={() => setShowAddForm(false)} className="text-[var(--gray-400)] hover:text-[var(--black)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="Number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="e.g., 01"
                required
              />
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Results-Driven"
                required
              />
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this value..."
                rows={3}
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
                  Add Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {values.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No values yet"
          description="Add company values to display on your About page."
          action={{ label: 'Add Value', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {values.map((value, index) => (
            <motion.div
              key={value.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
            >
              {editingId === value.id ? (
                <div className="space-y-4">
                  <Input
                    label="Number"
                    value={editData.number}
                    onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                  />
                  <Input
                    label="Title"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                  <Textarea
                    label="Description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-[var(--gray-600)] hover:text-[var(--black)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(value.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)]"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl font-semibold text-[var(--gray-200)]">
                      {value.number}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(value)}
                        className="p-2 rounded-lg text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(value.id)}
                        className="p-2 rounded-lg text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--black)]">{value.title}</h3>
                  <p className="mt-1 text-xs text-[var(--gray-500)] line-clamp-2">
                    {value.description}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Value"
        message="Are you sure you want to delete this company value? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
