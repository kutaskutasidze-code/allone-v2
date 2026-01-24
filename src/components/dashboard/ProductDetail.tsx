'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Phone, MessageSquare, Zap, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  system_prompt: string | null;
  agent_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ProductDetailProps {
  product: Product;
  backHref: string;
  backLabel: string;
}

const typeConfig = {
  voice_agent: { icon: Phone, label: 'Voice Agent' },
  rag_bot: { icon: MessageSquare, label: 'RAG Bot' },
  automation: { icon: Zap, label: 'Workflow' },
};

export default function ProductDetail({ product, backHref, backLabel }: ProductDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const config = typeConfig[product.type as keyof typeof typeConfig] || typeConfig.automation;
  const Icon = config.icon;

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/studio/create-product?id=${product.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push(backHref);
        router.refresh();
      }
    } catch {
      setDeleting(false);
    }
  };

  const createdDate = new Date(product.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#1d1d1f]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[13px] text-[#86868b]">{config.label}</span>
            <span className={cn(
              'text-[12px] font-medium px-2 py-0.5 rounded-full',
              product.status === 'active'
                ? 'bg-[#34c759]/10 text-[#34c759]'
                : 'bg-[#f5f5f7] text-[#86868b]'
            )}>
              {product.status}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        {product.description && (
          <div className="bg-white rounded-2xl border border-black/[0.04] px-4 py-3.5">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Description</p>
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">{product.description}</p>
          </div>
        )}

        {product.system_prompt && (
          <div className="bg-white rounded-2xl border border-black/[0.04] px-4 py-3.5">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">System Prompt</p>
            <p className="text-[13px] text-[#1d1d1f] leading-relaxed whitespace-pre-wrap font-mono">{product.system_prompt}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.04] px-4 py-3.5">
          <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Created</p>
          <p className="text-[14px] text-[#1d1d1f]">{createdDate}</p>
        </div>

        {/* Delete */}
        <div className="pt-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 text-[13px] text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
