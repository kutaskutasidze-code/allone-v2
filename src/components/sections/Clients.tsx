'use client';

import { motion } from 'framer-motion';
import type { Client } from '@/types/database';
import { useI18n } from '@/lib/i18n';

interface ClientsProps {
  clients?: Client[];
}

function ClientsContent({ clients }: { clients: Client[] }) {
  // Double the array for infinite scroll
  const doubled = [...clients, ...clients];
  const { t } = useI18n();

  return (
    <section className="py-16 lg:py-20 bg-white border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="font-mono text-[11px] text-muted/50 tracking-widest uppercase text-center">
          {t('clients.title')}
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Scrolling strip */}
        <div
          className="flex gap-16 items-center"
          style={{
            animation: 'logo-scroll 30s linear infinite',
            width: 'max-content',
          }}
        >
          {doubled.map((client, i) => (
            <span
              key={`${client.name}-${i}`}
              className="text-xl lg:text-2xl font-[family-name:var(--font-display)] font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight"
            >
              {client.logo_text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Clients({ clients = [] }: ClientsProps) {
  if (clients.length === 0) return null;
  return <ClientsContent clients={clients} />;
}
