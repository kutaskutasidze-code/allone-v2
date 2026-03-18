'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
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
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
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
        <div className="space-y-2">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
                <span className="text-sm">{service.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[var(--black)]">
                  {service.title}
                </h3>
                <p className="text-xs text-[var(--gray-500)]">
                  {service.features.length} feature{service.features.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Status */}
              <button
                onClick={() => togglePublished(service.id, service.is_published)}
                className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  service.is_published
                    ? 'bg-[var(--gray-900)] text-white'
                    : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]'
                }`}
              >
                {service.is_published ? 'Live' : 'Draft'}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/services/${service.id}`}
                  className="p-2 rounded-lg text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteId(service.id)}
                  className="p-2 rounded-lg text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
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
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
