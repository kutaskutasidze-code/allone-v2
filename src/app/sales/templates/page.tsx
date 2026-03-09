'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import type { EmailTemplate } from '@/types/database';

const SERVICE_NAMES: Record<string, string> = {
  chatbots: 'AI Chatbots',
  custom_ai: 'Custom AI',
  automation: 'Automation',
  website: 'Website',
  consulting: 'Consulting',
  general: 'General',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/sales/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const { data } = await res.json();
      setTemplates(data || []);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (template: EmailTemplate) => {
    try {
      await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
        title="Email Templates"
        description={`${templates.length} template${templates.length !== 1 ? 's' : ''} available`}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates found"
          description="Email templates will be available after running the database migration."
        />
      ) : (
        <div className="space-y-3">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white border border-[var(--gray-200)] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-white transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-[var(--black)]">{template.name}</h3>
                    {template.target_service && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--gray-100)] text-[var(--gray-600)]">
                        {SERVICE_NAMES[template.target_service] || template.target_service}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600 uppercase">
                      {template.language}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--gray-500)] truncate">
                    {template.description || template.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(template);
                    }}
                    className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                    title="Copy template"
                  >
                    {copiedId === template.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {expandedId === template.id ? (
                    <ChevronUp className="w-5 h-5 text-[var(--gray-400)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--gray-400)]" />
                  )}
                </div>
              </button>

              {expandedId === template.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[var(--gray-100)]"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">
                        Subject
                      </label>
                      <p className="text-sm text-[var(--black)] bg-white p-3 rounded-lg">
                        {template.subject}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">
                        Body
                      </label>
                      <pre className="text-sm text-[var(--black)] bg-white p-3 rounded-lg whitespace-pre-wrap font-sans">
                        {template.body}
                      </pre>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--gray-400)]">
                      <span>
                        Placeholders: {'{{company}}'}, {'{{country}}'}, {'{{industry}}'}, {'{{unsubscribe_link}}'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
