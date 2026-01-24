'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface VoiceAIContentProps {
  projects: Project[];
  limit: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function VoiceAIContent({ projects, limit }: VoiceAIContentProps) {
  const canCreate = projects.length < limit;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">Voice AI</h1>
          <p className="text-[13px] text-[#86868b] mt-0.5">{projects.length} of {limit} agents</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/studio"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d1d1f] text-white text-[13px] font-medium rounded-full hover:bg-[#3a3a3c] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Agent
          </Link>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden divide-y divide-black/[0.04]">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <Link
                href={`/dashboard/voice/${project.id}`}
                className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-black/[0.02] transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#1d1d1f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-medium text-[#1d1d1f] truncate">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      'text-[11px] font-medium',
                      project.status === 'active' ? 'text-[#34c759]' : 'text-[#86868b]'
                    )}>
                      {project.status === 'active' ? 'Active' : project.status}
                    </span>
                    <span className="text-[11px] text-[#c7c7cc]">{formatDate(project.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c7c7cc] group-hover:text-[#86868b] transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Phone className="w-5 h-5 text-[#86868b]" />
          </div>
          <h3 className="text-[15px] font-medium text-[#1d1d1f] mb-1">No agents yet</h3>
          <p className="text-[13px] text-[#86868b] mb-5">Create voice AI agents to handle calls.</p>
          <Link
            href="/dashboard/studio"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d1d1f] text-white text-[13px] font-medium rounded-full hover:bg-[#3a3a3c] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Agent
          </Link>
        </motion.div>
      )}
    </div>
  );
}
