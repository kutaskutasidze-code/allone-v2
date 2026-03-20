'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type ChannelConfig } from './channelConfigs';
import { ChannelChatUI } from './ChannelChatUI';

interface PhoneMockupProps {
  channel: ChannelConfig;
}

export function PhoneMockup({ channel }: PhoneMockupProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative max-w-[280px] lg:max-w-[320px] w-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      >
        {/* Glow effect behind phone */}
        <div
          className="absolute -inset-8 rounded-[60px] opacity-20 blur-3xl transition-colors duration-700"
          style={{ backgroundColor: channel.brandColor }}
        />

        {/* iPhone frame */}
        <div className="relative rounded-[40px] bg-[#1A1A1A] p-[8px] shadow-[0_25px_60px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#1A1A1A] rounded-b-[16px] z-20" />

          {/* Screen */}
          <div className="relative rounded-[32px] overflow-hidden bg-white">
            {/* Status bar */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 bg-transparent">
              <span className="text-[12px] font-semibold text-white mix-blend-difference">9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal */}
                <svg className="w-4 h-3 text-white mix-blend-difference" viewBox="0 0 17 12" fill="currentColor">
                  <rect x="0" y="9" width="3" height="3" rx="0.5" />
                  <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
                  <rect x="9" y="3" width="3" height="9" rx="0.5" />
                  <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                </svg>
                {/* WiFi */}
                <svg className="w-4 h-3 text-white mix-blend-difference" viewBox="0 0 16 12" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.76 7.34a5.95 5.95 0 018.48 0l-.71.71a4.95 4.95 0 00-7.06 0l-.71-.71zM1.4 4.98a9.44 9.44 0 0113.2 0l-.71.71a8.44 8.44 0 00-11.78 0l-.71-.71z" />
                </svg>
                {/* Battery */}
                <svg className="w-6 h-3 text-white mix-blend-difference" viewBox="0 0 25 12" fill="currentColor">
                  <rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="1.5" y="2.5" width="18" height="7" rx="1" />
                  <path d="M23 4v4a2 2 0 000-4z" />
                </svg>
              </div>
            </div>

            {/* Chat content with crossfade */}
            <div className="h-[420px] lg:h-[480px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="h-full"
                >
                  <ChannelChatUI channel={channel} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center py-2 bg-white">
              <div className="w-[100px] h-[4px] bg-black/20 rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
