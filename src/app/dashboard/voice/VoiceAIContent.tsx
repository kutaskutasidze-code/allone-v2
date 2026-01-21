'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Plus, ArrowRight, PhoneCall } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  config: Record<string, unknown>;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface VoiceAIContentProps {
  projects: Project[];
  limit: number;
}

export default function VoiceAIContent({ projects, limit }: VoiceAIContentProps) {
  const canCreate = projects.length < limit;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">Voice AI</h1>
          <p className="text-sm text-zinc-500">{projects.length}/{limit} agents</p>
        </div>
        {canCreate && (
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/dashboard/voice/${project.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 truncate">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">{project.status}</span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500">{project.usage_count || 0} calls</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="font-medium text-zinc-900 mb-2">No agents yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            Create voice AI agents to handle calls automatically.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </Link>
        </div>
      )}
    </div>
  );
}
