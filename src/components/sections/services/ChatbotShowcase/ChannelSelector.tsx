'use client';

import { motion } from 'framer-motion';
import { type ChannelId, channelConfigs } from './channelConfigs';
import { useI18n } from '@/lib/i18n';

interface ChannelSelectorProps {
  active: ChannelId;
  onChange: (id: ChannelId) => void;
}

function ChannelIcon({ id, className }: { id: ChannelId; className?: string }) {
  switch (id) {
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'messenger':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case 'website':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
  }
}

export function ChannelSelector({ active, onChange }: ChannelSelectorProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Desktop: vertical stack */}
      <div className="hidden lg:flex flex-col gap-2">
        {channelConfigs.map((channel) => {
          const isActive = active === channel.id;
          return (
            <motion.button
              key={channel.id}
              onClick={() => onChange(channel.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-colors duration-200 ${
                isActive
                  ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100'
                  : 'bg-transparent hover:bg-white/60 border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="channel-indicator"
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                  style={{ backgroundColor: channel.brandColor }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isActive ? `${channel.brandColor}15` : '#F3F4F6',
                  color: isActive ? channel.brandColor : '#9CA3AF',
                }}
              >
                <ChannelIcon id={channel.id} className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {t(channel.nameKey)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight truncate">
                  {t(channel.descKey)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile: horizontal pills */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-none">
        {channelConfigs.map((channel) => {
          const isActive = active === channel.id;
          return (
            <motion.button
              key={channel.id}
              onClick={() => onChange(channel.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
              style={isActive ? { backgroundColor: channel.brandColor } : undefined}
            >
              <ChannelIcon
                id={channel.id}
                className={`w-4 h-4 ${isActive ? '' : ''}`}
              />
              {t(channel.nameKey)}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
