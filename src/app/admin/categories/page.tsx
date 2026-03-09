'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Trash2, Save, X } from 'lucide-react';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';

interface Category {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
    fetchProjectCounts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const result = await res.json();
      // Handle both array and paginated response formats
      const data = Array.isArray(result) ? result : result.data || [];
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectCounts = async () => {
    try {
      const res = await fetch('/api/admin/projects');
      if (!res.ok) return;
      const result = await res.json();
      // Handle both array and paginated response formats
      const projects = Array.isArray(result) ? result : result.data || [];
      const counts: Record<string, number> = {};
      projects.forEach((p: { category: string }) => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });
      setProjectCounts(counts);
    } catch (err) {
      console.error('Failed to fetch project counts:', err);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add category');
      }

      const data = await res.json();
      setCategories([...categories, data]);
      setNewCategory('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update category');
      }

      const data = await res.json();
      setCategories(categories.map((c) => (c.id === id ? data : c)));
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      setCategories(categories.filter((c) => c.id !== category.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      setDeleteConfirm(null);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValue(category.name);
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
        title="Categories"
        description={`${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
        action={!isAdding ? { label: 'Add Category', onClick: () => setIsAdding(true) } : undefined}
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Category Form */}
      {isAdding && (
        <div className="p-4 bg-white border border-[var(--gray-200)] rounded-xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name..."
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)]"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewCategory('');
              }}
              className="px-4 py-2 text-sm text-[var(--gray-600)] hover:text-[var(--black)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create your first category to organize projects."
          action={{ label: 'Add Category', onClick: () => setIsAdding(true) }}
        />
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
            >
              {/* Order Badge */}
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)] text-sm font-medium text-[var(--gray-500)]">
                {index + 1}
              </div>

              {/* Category Name / Edit Input */}
              <div className="flex-1">
                {editingId === category.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--gray-300)] focus:border-[var(--gray-400)] focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(category.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue('');
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--black)]">{category.name}</span>
                    {projectCounts[category.name] !== undefined && projectCounts[category.name] > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--gray-100)] text-[var(--gray-500)]">
                        {projectCounts[category.name]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {editingId === category.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(category.id)}
                      className="p-2 text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditValue('');
                      }}
                      className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category)}
                      className="p-2 text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
