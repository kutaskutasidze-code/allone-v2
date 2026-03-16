'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Bot, Workflow, Brain, Globe, Compass } from 'lucide-react';
import type { Service } from '@/types/database';
import { ChatPlayback, WorkflowDiagram, LayeredScreens, defaultContent } from './services';
import { ShineBorder } from '@/components/ui/ShineBorder';
import { useI18n } from '@/lib/i18n';

function getServiceByType(services: Service[], cardType: string): Service | undefined {
  return services.find(s => s.card_type === cardType);
}

const serviceIcons = {
  chatbot: Bot,
  workflow: Workflow,
  custom_ai: Brain,
  website: Globe,
  consulting: Compass,
};

interface ServicesNewProps {
  services?: Service[];
  showViewAll?: boolean;
}

export default function ServicesNew({ services = [], showViewAll = true }: ServicesNewProps) {
  const { t } = useI18n();
  const chatbot = getServiceByType(services, 'chatbot');
  const customAi = getServiceByType(services, 'custom_ai');
  const workflow = getServiceByType(services, 'workflow');
  const website = getServiceByType(services, 'website');
  const consulting = getServiceByType(services, 'consulting');

  const allServices = [
    {
      num: '01',
      slug: 'chatbot',
      icon: serviceIcons.chatbot,
      title: t('svc.chatbot.title'),
      description: t('svc.chatbot.desc'),
      stats: chatbot?.stats || defaultContent.chatbot.stats,
      features: chatbot?.features || defaultContent.chatbot.features,
      demo: <ChatPlayback />,
    },
    {
      num: '02',
      slug: 'custom-ai',
      icon: serviceIcons.custom_ai,
      title: t('svc.custom.title'),
      description: t('svc.custom.desc'),
      stats: customAi?.stats || defaultContent.custom_ai.stats,
      features: customAi?.features || defaultContent.custom_ai.features,
      demo: null,
    },
    {
      num: '03',
      slug: 'workflow-automation',
      icon: serviceIcons.workflow,
      title: t('svc.workflow.title'),
      description: t('svc.workflow.desc'),
      stats: null,
      features: null,
      demo: <WorkflowDiagram />,
    },
    {
      num: '04',
      slug: 'web-development',
      icon: serviceIcons.website,
      title: t('svc.website.title'),
      description: t('svc.website.desc'),
      stats: null,
      features: website?.features || defaultContent.website.features,
      demo: <LayeredScreens />,
    },
    {
      num: '05',
      slug: 'consulting',
      icon: serviceIcons.consulting,
      title: t('svc.consulting.title'),
      description: t('svc.consulting.desc'),
      stats: null,
      features: null,
      demo: null,
    },
  ];

  return (
    <section id="services" className="pt-8 lg:pt-12 pb-4 lg:pb-6 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10 lg:mb-12"
        >
          <div>
            <p className="mono-label mb-4">{t('services.label')}</p>
            <h2 className="text-4xl lg:text-5xl font-semibold text-heading leading-[1.05] tracking-[-0.03em]">
              {t('services.title1')}
              <br className="hidden lg:block" />
              {' '}{t('services.title2')}
            </h2>
          </div>
          {showViewAll && (
            <Link
              href="/services"
              className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1.5 font-medium"
            >
              {t('services.viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>

        {/* Cards */}
        <div className="space-y-4">
          {/* Row 1: Chatbot (large) + Custom AI */}
          <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-4">
            {/* Chatbot card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex"
            >
              <div className="bg-white rounded-3xl w-full">
                <div className="p-6 lg:p-8 w-full h-full">
                  <div className="grid lg:grid-cols-2 gap-6 items-start">
                    <div>
                      <ChatPlayback />
                    </div>
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="mono-label">{allServices[0].num}</span>
                        <h3 className="text-xl lg:text-2xl font-semibold text-heading mt-2">
                          {allServices[0].title}
                        </h3>
                      </div>
                      <p className="text-muted text-sm leading-relaxed">
                        {allServices[0].description}
                      </p>
                      {allServices[0].stats && (
                        <div className="flex gap-6 pt-2">
                          {allServices[0].stats.map((stat, i) => (
                            <div key={i}>
                              <p className="text-xl font-semibold text-heading">{stat.value}</p>
                              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {allServices[0].features && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border-light/50">
                          {allServices[0].features.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 text-[11px] text-muted rounded-lg bg-background">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Custom AI card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex"
            >
              <div className="bg-white rounded-3xl w-full">
                <div className="p-6 lg:p-8 flex flex-col h-full w-full text-left">
                  <div>
                    <span className="mono-label">{allServices[1].num}</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-heading mt-2">
                      {allServices[1].title}
                    </h3>
                  </div>
                  <p className="text-muted text-sm leading-relaxed mt-4 flex-1">
                    {allServices[1].description}
                  </p>
                  {allServices[1].stats && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-light/50">
                      {allServices[1].stats.map((stat, i) => (
                        <div key={i}>
                          <p className="text-lg font-semibold text-heading">{stat.value}</p>
                          <p className="font-mono text-[10px] text-muted uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Workflow + Website */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Workflow */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex"
            >
              <div className="bg-white rounded-3xl w-full">
                <div className="p-6 lg:p-8 flex flex-col min-h-[380px] w-full text-left">
                  <div>
                    <span className="mono-label">{allServices[2].num}</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-heading mt-2">
                      {allServices[2].title}
                    </h3>
                    <p className="text-muted text-sm mt-2">
                      {allServices[2].description}
                    </p>
                  </div>
                  <div className="flex-1 relative my-6">
                    <WorkflowDiagram />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Website */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex"
            >
              <div className="bg-white rounded-3xl w-full">
                <div className="p-6 lg:p-8 flex flex-col min-h-[380px] w-full text-left">
                  <div>
                    <span className="mono-label">{allServices[3].num}</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-heading mt-2">
                      {allServices[3].title}
                    </h3>
                  </div>
                  <div className="flex-1 grid lg:grid-cols-2 gap-6 mt-4 items-center">
                    <p className="text-muted text-sm leading-relaxed">
                      {allServices[3].description}
                    </p>
                    <LayeredScreens />
                  </div>
                  {allServices[3].features && (
                    <div className="flex gap-2 pt-4 border-t border-border-light/50 mt-4">
                      {allServices[3].features.map((tech) => (
                        <span key={tech} className="px-3 py-1.5 text-xs text-muted rounded-lg bg-background">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 3: Consulting (full width) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex"
          >
            <div className="bg-white rounded-3xl w-full">
              <div className="p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
                <div className="text-center lg:text-left">
                  <span className="mono-label">{allServices[4].num}</span>
                  <h3 className="text-xl lg:text-2xl font-semibold text-heading mt-2">
                    {allServices[4].title}
                  </h3>
                  <p className="text-muted mt-2 max-w-lg text-sm">
                    {allServices[4].description}
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="btn-primary whitespace-nowrap"
                >
                  {t('services.bookCall')}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
