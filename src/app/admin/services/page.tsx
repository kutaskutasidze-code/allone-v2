'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, StatusBadge, EmptyState } from '@/components/admin';
import type { Service } from '@/types/database';
import { Pencil, Trash2, Briefcase } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const { error } = await supabase.from('services').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting service:', error);
    } else {
      setServices(services.filter((s) => s.id !== deleteId));
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_published: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error updating service:', error);
    } else {
      setServices(
        services.map((s) =>
          s.id === id ? { ...s, is_published: !currentState } : s
        )
      );
    }
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
        title="Services"
        description={`${services.length} service${services.length !== 1 ? 's' : ''}`}
        action={{ label: 'Add Service', href: '/admin/services/new' }}
      />

      {services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          description="Get started by creating your first service."
          action={{ label: 'Add Service', href: '/admin/services/new' }}
        />
      ) : (
        <div className="space-y-1.5">
          {services.map((service) => (
            <div
              key={service.id}
              className="group flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)]">
                <span className="text-sm">{service.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[var(--ink-900)]">
                  {service.title}
                </h3>
                <p className="text-xs text-[var(--ink-500)]">
                  {service.features.length} feature{service.features.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Status */}
              <button
                onClick={() => togglePublished(service.id, service.is_published)}
                className="flex-shrink-0"
              >
                <StatusBadge published={service.is_published} />
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/services/${service.id}`}
                  className="p-2 rounded-[var(--radius-sm)] text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteId(service.id)}
                  className="p-2 rounded-[var(--radius-sm)] text-[var(--ink-400)] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
