'use client';

import { motion } from 'framer-motion';
import type { Service } from '@/types/database';
import {
  ServiceCard,
  ChatPlayback,
  WorkflowDiagram,
  LayeredScreens,
  defaultContent,
} from './services';

// Helper to get service by card_type
function getServiceByType(services: Service[], cardType: string): Service | undefined {
  return services.find(s => s.card_type === cardType);
}

interface ServicesNewProps {
  services?: Service[];
}

export default function ServicesNew({ services = [] }: ServicesNewProps) {
  // Get services by card_type, fallback to defaults
  const chatbotService = getServiceByType(services, 'chatbot');
  const customAiService = getServiceByType(services, 'custom_ai');
  const workflowService = getServiceByType(services, 'workflow');
  const websiteService = getServiceByType(services, 'website');
  const consultingService = getServiceByType(services, 'consulting');

  return (
    <section id="services" className="py-24 lg:py-32 bg-[var(--black)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="max-w-3xl mb-16 lg:mb-24"
        >
          <p className="mono-label mb-4">
            Services
          </p>
          <h2 className="text-4xl lg:text-5xl font-light text-white leading-[1.1]">
            Everything you need to grow with AI
          </h2>
        </motion.div>

        {/* Cards Grid - Each card has scroll-linked animation */}
        <div className="space-y-6">
          {/* Row 1: AI Chatbots + Custom AI - same height */}
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
            {/* Card 1: AI Chatbots - slides from LEFT */}
            <ServiceCard direction="left" >
              <div className="relative overflow-hidden h-full">
                <div className="relative z-10 p-5 lg:p-6">
                  <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                    {/* Chat Interface */}
                    <div>
                      <ChatPlayback />
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <div>
                        <span className="mono-label">01-AI</span>
                        <h3 className="text-xl lg:text-2xl font-semibold text-white mt-1">
                          {chatbotService?.title || defaultContent.chatbot.title}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <p className="text-base text-white/60">
                          {chatbotService?.subtitle || defaultContent.chatbot.subtitle}
                        </p>
                        <p className="text-white/60 leading-relaxed text-sm">
                          {chatbotService?.description || defaultContent.chatbot.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6">
                        {(chatbotService?.stats || defaultContent.chatbot.stats).map((stat, idx) => (
                          <div key={idx}>
                            <p className="text-xl font-semibold text-white">{stat.value}</p>
                            <p className="text-[10px] text-white/60 uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex flex-wrap gap-1.5">
                          {(chatbotService?.features || defaultContent.chatbot.features).map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] text-white/60 border border-white/10 bg-white/5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ServiceCard>

            {/* Card 2: Custom AI Solutions - slides from TOP-RIGHT */}
            <ServiceCard direction="top-right" >
              <div className="relative overflow-hidden h-full">
                <div className="relative z-10 p-6 lg:p-8 flex flex-col h-full">
                  <div>
                    <span className="mono-label">02-CS</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-white mt-2">
                      {customAiService?.title || defaultContent.custom_ai.title}
                    </h3>
                  </div>

                  <div className="py-6">
                    <p className="text-white/60 leading-relaxed">
                      {customAiService?.description || defaultContent.custom_ai.description}
                    </p>
                    <p className="text-white/60 leading-relaxed mt-4 text-sm">
                      {customAiService?.secondary_description || defaultContent.custom_ai.secondary_description}
                    </p>

                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-4">
                        {(customAiService?.stats || defaultContent.custom_ai.stats).map((stat, idx) => (
                          <div key={idx}>
                            <p className="text-lg font-semibold text-white">{stat.value}</p>
                            <p className="text-[10px] text-white/60 uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {(customAiService?.features || defaultContent.custom_ai.features).map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs text-white/60 border border-white/10 bg-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ServiceCard>
          </div>

          {/* Row 2: Workflow + Website Dev */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Card 3: Workflow Automation - slides from TOP-LEFT */}
            <ServiceCard direction="top-left" >
              <div className="relative overflow-hidden h-full">
                <div className="relative z-10 p-6 lg:p-8 h-full flex flex-col min-h-[420px]">
                  <div>
                    <span className="mono-label">03-WF</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-white mt-2">
                      {workflowService?.title || defaultContent.workflow.title}
                    </h3>
                    <p className="text-white/60 text-sm mt-2">
                      {workflowService?.description || defaultContent.workflow.description}
                    </p>
                  </div>

                  <div className="flex-1 relative my-6">
                    <WorkflowDiagram />
                  </div>

                  <p className="text-white/60 text-sm mt-auto">
                    {workflowService?.footer_text || defaultContent.workflow.footer_text}
                  </p>
                </div>
              </div>
            </ServiceCard>

            {/* Card 4: Website Development - slides from RIGHT */}
            <ServiceCard direction="right" >
              <div className="relative overflow-hidden h-full">
                <div className="relative z-10 p-6 lg:p-8 h-full flex flex-col min-h-[420px]">
                  <div>
                    <span className="mono-label">04-WD</span>
                    <h3 className="text-xl lg:text-2xl font-semibold text-white mt-2">
                      {websiteService?.title || defaultContent.website.title}
                    </h3>
                  </div>

                  {/* Two column layout */}
                  <div className="flex-1 grid lg:grid-cols-2 gap-8 mt-6 items-center">
                    {/* Text content - left */}
                    <div className="space-y-4">
                      <p className="text-white/60 leading-relaxed">
                        {websiteService?.description || defaultContent.website.description}
                      </p>
                      <p className="text-white/60 leading-relaxed text-sm">
                        {websiteService?.secondary_description || defaultContent.website.secondary_description}
                      </p>
                    </div>

                    {/* Layered screens - right */}
                    <LayeredScreens />
                  </div>

                  {/* Tech stack */}
                  <div className="flex justify-start gap-2 mt-6 pt-4 border-t border-white/10">
                    {(websiteService?.features || defaultContent.website.features).map((tech) => (
                      <span key={tech} className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs text-white/60 border border-white/10 bg-white/5">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ServiceCard>
          </div>

          {/* Row 3: Strategy & Consulting - slides from BOTTOM */}
          <ServiceCard direction="bottom" >
            <div className="relative overflow-hidden h-full">
              {/* Content */}
              <div className="relative z-10 p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="text-center lg:text-left">
                  <span className="mono-label">05-SC</span>
                  <h3 className="text-xl lg:text-2xl font-semibold text-white mt-1">
                    {consultingService?.title || defaultContent.consulting.title}
                  </h3>
                  <p className="text-white/60 mt-2 max-w-lg">
                    {consultingService?.description || defaultContent.consulting.description}
                  </p>
                </div>

                {/* CTA Button */}
                <a
                  href={consultingService?.cta_url || defaultContent.consulting.cta_url}
                  className="btn-accent whitespace-nowrap"
                >
                  {consultingService?.cta_text || defaultContent.consulting.cta_text}
                </a>
              </div>
            </div>
          </ServiceCard>
        </div>
      </div>
    </section>
  );
}
