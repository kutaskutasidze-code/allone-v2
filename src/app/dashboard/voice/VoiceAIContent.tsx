'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Plus, ArrowRight } from 'lucide-react';

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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              New
            </Link>
          </motion.div>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <Link
                href={`/dashboard/voice/${project.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-blue-50/30 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 truncate">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-xs text-zinc-500">{project.usage_count || 0} calls</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-zinc-200 rounded-xl p-12 text-center bg-gradient-to-br from-white to-blue-50/30"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-medium text-zinc-900 mb-2">No agents yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            Create voice AI agents to handle calls automatically.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
