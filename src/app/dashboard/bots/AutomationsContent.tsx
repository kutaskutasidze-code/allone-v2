'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Workflow,
  Plus,
  ArrowRight,
  Zap,
  Play,
  Clock
} from 'lucide-react';

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

interface AutomationsContentProps {
  projects: Project[];
  limit: number;
}

export default function AutomationsContent({ projects, limit }: AutomationsContentProps) {
  const canCreate = projects.length < limit;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--black)]">Automations</h1>
          <p className="text-[var(--gray-600)]">
            {projects.length}/{limit} automations created
          </p>
        </div>
        {canCreate && (
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Automation
          </Link>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/dashboard/bots/${project.id}`}
                className="block bg-white rounded-xl border border-[var(--gray-200)] p-5 hover:border-[var(--accent)]/50 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--black)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-[var(--gray-500)] truncate mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        project.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : project.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--gray-500)]">
                        <Play className="w-3 h-3" />
                        {project.usage_count || 0} runs
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
            <Workflow className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--black)] mb-2">No Automations Yet</h3>
          <p className="text-[var(--gray-500)] mb-6 max-w-md mx-auto">
            Create your first automation to connect apps, automate workflows, and save time on repetitive tasks.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Automation
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--black)]">{projects.length}</p>
                <p className="text-sm text-[var(--gray-500)]">Total Automations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--black)]">
                  {projects.filter(p => p.status === 'active').length}
                </p>
                <p className="text-sm text-[var(--gray-500)]">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--black)]">
                  {projects.reduce((sum, p) => sum + (p.usage_count || 0), 0)}
                </p>
                <p className="text-sm text-[var(--gray-500)]">Total Runs</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
