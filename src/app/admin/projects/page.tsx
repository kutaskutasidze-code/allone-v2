'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog, PageHeader, StatusBadge, EmptyState } from '@/components/admin';
import type { Project } from '@/types/database';
import {
  Pencil,
  Trash2,
  Search,
  X,
  FolderKanban,
  ImageIcon,
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .order('display_order', { ascending: true });
    if (data) {
      setCategories(data.map(c => c.name));
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDescription = project.description.toLowerCase().includes(query);
        const matchesTech = project.technologies.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTech) return false;
      }
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false;
      if (statusFilter === 'published' && !project.is_published) return false;
      if (statusFilter === 'draft' && project.is_published) return false;
      return true;
    });
  }, [projects, searchQuery, categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const { error } = await supabase.from('projects').delete().eq('id', deleteId);

    if (error) {
      console.error('Error deleting project:', error);
    } else {
      setProjects(projects.filter((p) => p.id !== deleteId));
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('projects')
      .update({ is_published: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
    } else {
      setProjects(
        projects.map((p) =>
          p.id === id ? { ...p, is_published: !currentState } : p
        )
      );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all';

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
        title="Projects"
        description={`${projects.length} total, ${projects.filter(p => p.is_published).length} published`}
        action={{ label: 'Add Project', href: '/admin/projects/new' }}
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] overflow-hidden">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[var(--ink-900)] text-white'
                  : 'text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]'
              }`}
            >
              {status === 'all' ? 'All' : status === 'published' ? 'Live' : 'Draft'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--ink-500)]">
            {filteredProjects.length} of {projects.length}
          </span>
          <button
            onClick={clearFilters}
            className="text-[var(--ink-500)] hover:text-[var(--ink-900)] underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Get started by creating your first project."
          action={{ label: 'Add Project', href: '/admin/projects/new' }}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--ink-500)]">No projects match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-[var(--ink-700)] hover:text-[var(--ink-900)] underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              {/* Image */}
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[var(--bg-surface-alt)] overflow-hidden">
                {project.image_url ? (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-[var(--ink-400)]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[var(--ink-900)] truncate">
                    {project.title}
                  </h3>
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-surface-alt)] text-[var(--ink-500)] ring-1 ring-gray-200">
                    {project.category}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--ink-500)] truncate">
                  {project.technologies.join(' · ')}
                </p>
              </div>

              {/* Status */}
              <button
                onClick={() => togglePublished(project.id, project.is_published)}
                className="flex-shrink-0"
              >
                <StatusBadge published={project.is_published} />
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="p-2 rounded-lg text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteId(project.id)}
                  className="p-2 rounded-lg text-[var(--ink-400)] hover:text-red-600 hover:bg-red-50 transition-colors"
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
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
