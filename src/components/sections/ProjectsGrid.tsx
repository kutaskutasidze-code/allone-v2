'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import type { Project } from '@/types/database';

interface ProjectsGridProps {
  projects?: Project[];
  showHeader?: boolean;
  limit?: number;
  showFilters?: boolean;
  singleRow?: boolean;
  showSeeAll?: boolean;
}

const defaultCategories = ['All', 'Chatbots', 'Automation', 'Custom AI'];

export function ProjectsGrid({
  projects = [],
  showHeader = true,
  limit,
  showFilters = true,
  singleRow = false,
  showSeeAll = false,
}: ProjectsGridProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Get unique categories from projects
  const categories = projects.length > 0
    ? ['All', ...new Set(projects.map(p => p.category))]
    : defaultCategories;

  const filteredProjects = projects.filter((project) => {
    if (activeCategory === 'All') return true;
    return project.category === activeCategory;
  });

  const displayedProjects = limit
    ? filteredProjects.slice(0, limit)
    : filteredProjects;

  return (
    <section className="py-[clamp(4rem,8vw,8rem)] relative">
      <Container>
        {showHeader && (
          <div className="mb-[clamp(3rem,6vw,5rem)]">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-[var(--accent)] text-sm font-medium tracking-wide mb-4"
            >
              Our work
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-[var(--font-display)] font-light text-[var(--accent)] leading-[1.15]"
            >
              A selection of our recent work
            </motion.h2>
          </div>
        )}

        {/* Filter Bar */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="inline-flex flex-wrap gap-2 bg-transparent backdrop-blur-sm rounded-2xl p-2 border border-[var(--gray-300)]">
              {categories.map((category, index) => (
                <motion.button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${
                      activeCategory === category
                        ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                        : 'text-[var(--gray-600)] hover:bg-[var(--gray-100)] hover:text-[var(--accent)]'
                    }
                  `}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Projects Grid */}
        <div className={`grid gap-5 lg:gap-6 ${singleRow ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
          <AnimatePresence mode="popLayout">
            {displayedProjects.map((project, index) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative"
              >
                <GlassPanel
                  padding={singleRow ? 'sm' : 'md'}
                  rounded="2xl"
                  hover={true}
                  className="h-full"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-mono ${singleRow ? 'w-7 h-7' : 'w-8 h-8'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <motion.div
                      initial={{ rotate: 0, x: 0, y: 0 }}
                      whileHover={{ rotate: 45, x: 2, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowUpRight className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--accent)] transition-colors duration-300" />
                    </motion.div>
                  </div>

                  <h3 className={`font-[var(--font-display)] font-semibold text-[var(--black)] mb-2 ${singleRow ? 'text-lg' : 'text-xl lg:text-2xl mb-3'}`}>
                    {project.title}
                  </h3>

                  <p className={`text-[var(--gray-500)] leading-relaxed ${singleRow ? 'text-xs mb-4' : 'text-sm mb-5'}`}>
                    {project.description.slice(0, singleRow ? 70 : 90)}...
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.technologies.slice(0, singleRow ? 2 : 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-[var(--gray-600)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--accent)] font-medium">
                    {project.category}
                  </span>
                </GlassPanel>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* See All Button */}
        {showSeeAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <GlassButton
              href="/projects"
              variant="secondary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              className="group"
            >
              See all projects
            </GlassButton>
          </motion.div>
        )}
      </Container>
    </section>
  );
}
