'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
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
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
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
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 mx-4 border border-[var(--gray-200)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-[var(--black)]">Add Client</h2>
              <button onClick={() => setShowAddForm(false)} className="text-[var(--gray-400)] hover:text-[var(--black)]">
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
                  className="px-4 py-2 text-sm text-[var(--gray-600)] hover:text-[var(--black)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)]"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to display in the marquee."
          action={{ label: 'Add Client', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {clients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
            >
              {editingId === client.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    value={editData.logo_text}
                    onChange={(e) => setEditData({ ...editData, logo_text: e.target.value })}
                    className="w-20 px-2 py-1 text-sm border border-[var(--gray-200)] rounded-lg focus:border-[var(--gray-400)] focus:outline-none"
                    placeholder="Logo"
                  />
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--gray-200)] rounded-lg focus:border-[var(--gray-400)] focus:outline-none"
                    placeholder="Name"
                  />
                  <button
                    onClick={() => handleUpdate(client.id)}
                    className="p-2 text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Logo Text */}
                  <div className="w-16 h-10 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
                    <span className="text-sm font-bold text-[var(--gray-700)]">{client.logo_text}</span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--black)]">{client.name}</span>
                  </div>

                  {/* Status */}
                  <button
                    onClick={() => togglePublished(client.id, client.is_published)}
                    className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      client.is_published
                        ? 'bg-[var(--gray-900)] text-white'
                        : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]'
                    }`}
                  >
                    {client.is_published ? 'Live' : 'Draft'}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(client)}
                      className="p-2 rounded-lg text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(client.id)}
                      className="p-2 rounded-lg text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
