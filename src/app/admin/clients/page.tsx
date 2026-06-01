'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, StatusBadge, EmptyState } from '@/components/admin';
import { Input } from '@/components/ui';
import type { Client } from '@/types/database';
import { Pencil, Trash2, Users, X, Save } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', logo_text: '' });
  const [editData, setEditData] = useState({ name: '', logo_text: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.logo_text) return;

    const { data: lastClient } = await supabase
      .from('clients')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = lastClient ? lastClient.display_order + 1 : 0;

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: formData.name,
        logo_text: formData.logo_text,
        is_published: true,
        display_order,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding client:', error);
    } else if (data) {
      setClients([...clients, data]);
      setFormData({ name: '', logo_text: '' });
      setShowAddForm(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .update({
        name: editData.name,
        logo_text: editData.logo_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating client:', error);
    } else {
      setClients(
        clients.map((c) =>
          c.id === id ? { ...c, name: editData.name, logo_text: editData.logo_text } : c
        )
      );
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const { error } = await supabase.from('clients').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting client:', error);
    } else {
      setClients(clients.filter((c) => c.id !== deleteId));
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('clients')
      .update({ is_published: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error updating client:', error);
    } else {
      setClients(
        clients.map((c) =>
          c.id === id ? { ...c, is_published: !currentState } : c
        )
      );
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditData({ name: client.name, logo_text: client.logo_text });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        action={{ label: 'Add Client', onClick: () => setShowAddForm(true) }}
      />

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowAddForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 w-full max-w-md bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-xl shadow-black/[0.08] p-6 mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-[var(--ink-900)]">Add Client</h2>
                <button onClick={() => setShowAddForm(false)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <Input
                  label="Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Inc"
                  required
                />
                <Input
                  label="Logo Text"
                  value={formData.logo_text}
                  onChange={(e) => setFormData({ ...formData, logo_text: e.target.value })}
                  placeholder="e.g., ACME"
                  required
                />
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm text-[var(--ink-700)] hover:text-[var(--ink-900)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all"
                  >
                    Add Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to display in the marquee."
          action={{ label: 'Add Client', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="space-y-1.5">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              {editingId === client.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    value={editData.logo_text}
                    onChange={(e) => setEditData({ ...editData, logo_text: e.target.value })}
                    className="w-20 px-2 py-1 text-sm border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none"
                    placeholder="Logo"
                  />
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none"
                    placeholder="Name"
                  />
                  <button
                    onClick={() => handleUpdate(client.id)}
                    className="p-2 text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Logo Text */}
                  <div className="w-16 h-10 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)]">
                    <span className="text-sm font-bold text-[var(--ink-700)]">{client.logo_text}</span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--ink-900)]">{client.name}</span>
                  </div>

                  {/* Status */}
                  <button
                    onClick={() => togglePublished(client.id, client.is_published)}
                    className="flex-shrink-0"
                  >
                    <StatusBadge published={client.is_published} />
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(client)}
                      className="p-2 rounded-[var(--radius-sm)] text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(client.id)}
                      className="p-2 rounded-[var(--radius-sm)] text-[var(--ink-400)] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
