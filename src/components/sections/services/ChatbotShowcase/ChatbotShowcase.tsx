'use client';

import { motion } from 'framer-motion';
import { ChatPlayback } from '../ChatPlayback';

/* ── Channel logos ── */
const channels = [
  { name: 'WhatsApp', color: '#25D366', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { name: 'Instagram', color: '#E1306C', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: 'Messenger', color: '#0084FF', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg> },
  { name: 'Telegram', color: '#0088CC', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { name: 'Viber', color: '#7360F2', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.4 0C9.473.028 5.333.344 3.213 2.296 1.633 3.876.96 6.27.87 9.21.78 12.15.56 17.717 5.9 19.2h.004l-.004 2.2s-.04.89.553 1.072c.716.22 1.136-.46 1.82-1.195.375-.404.89-.996 1.28-1.448 3.53.298 6.246-.38 6.554-.48.71-.23 4.726-.745 5.382-6.08.677-5.498-.327-8.975-2.16-10.543C18.04 1.594 14.547.044 11.4 0zm.317 1.9c2.73.04 5.752 1.283 6.86 2.207 1.49 1.27 2.381 4.285 1.81 8.927-.534 4.345-3.783 4.673-4.383 4.868-.256.083-2.553.657-5.476.458 0 0-2.17 2.62-2.85 3.313-.105.107-.23.15-.313.13-.12-.028-.152-.153-.15-.34l.03-3.6C3.09 16.483 2.72 11.9 2.79 9.39c.074-2.512.64-4.478 1.888-5.713C6.278 2.098 9.047 1.862 11.717 1.9z"/></svg> },
  { name: 'Website', color: '#0A68F5', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
];

/* ── Integration logos ── */
const integrations = [
  { name: 'Google Calendar', svg: <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1967D2"/><path d="M5.684 24v-5.684h12.632V24H5.684z" fill="#188038"/><path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#4285F4"/><path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#FBBC04"/><path d="M18.316 18.316H5.684V5.684h12.632v12.632z" fill="#fff"/></svg> },
  { name: 'HubSpot', svg: <svg viewBox="0 0 24 24" fill="#FF7A59" className="w-5 h-5"><path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.2 2.2 0 0017.238.84h-.066a2.2 2.2 0 00-2.193 2.193v.066a2.198 2.198 0 001.267 1.984V7.93a6.152 6.152 0 00-2.932 1.458l-7.73-6.014a2.636 2.636 0 00.096-.695A2.637 2.637 0 003.043.042 2.637 2.637 0 00.406 2.679 2.637 2.637 0 003.043 5.316c.5 0 .963-.142 1.362-.383l7.6 5.913a6.168 6.168 0 00-.932 3.263c0 1.227.365 2.37.986 3.334l-2.834 2.834a2.133 2.133 0 00-.632-.104 2.147 2.147 0 00-2.145 2.145A2.147 2.147 0 008.593 24.46a2.147 2.147 0 002.145-2.145c0-.224-.036-.44-.1-.643l2.797-2.797a6.198 6.198 0 103.87-3.34l.858-7.605z"/></svg> },
  { name: 'Notion', svg: <svg viewBox="0 0 24 24" fill="#000" className="w-5 h-5"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.11 2.1c-.42-.326-.98-.7-2.055-.607L3.01 2.64c-.466.046-.56.28-.374.466l1.823 1.1zM5.252 7.617v13.916c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.824c0-.606-.233-.933-.746-.886l-15.177.84c-.56.047-.747.327-.747.84z"/></svg> },
  { name: 'Stripe', svg: <svg viewBox="0 0 24 24" fill="#635BFF" className="w-5 h-5"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  { name: 'Salesforce', svg: <svg viewBox="0 0 24 24" fill="#00A1E0" className="w-5 h-5"><path d="M10.006 5.87a4.387 4.387 0 013.137-1.324 4.376 4.376 0 014.133 2.94 5.326 5.326 0 011.344-.172C21.09 7.314 23.3 9.52 23.3 12.257c0 2.737-2.21 4.943-4.68 4.943a4.63 4.63 0 01-1.05-.114 3.94 3.94 0 01-3.44 2.044 3.93 3.93 0 01-2.04-.57A4.68 4.68 0 018 20.468a4.66 4.66 0 01-2.537-.748A4.297 4.297 0 01.7 15.638a4.29 4.29 0 012.09-3.682 5.08 5.08 0 01-.22-1.49C2.57 7.14 5.39 4.32 8.86 4.32c1.42 0 2.74.45 3.814 1.22l-2.668.33z"/></svg> },
  { name: 'Zapier', svg: <svg viewBox="0 0 24 24" fill="#FF4A00" className="w-5 h-5"><path d="M15.557 12.007l4.213-4.213a1.2 1.2 0 000-1.698l-1.87-1.869a1.2 1.2 0 00-1.697 0l-4.213 4.213-4.213-4.213a1.2 1.2 0 00-1.698 0l-1.869 1.87a1.2 1.2 0 000 1.697l4.213 4.213-4.213 4.213a1.2 1.2 0 000 1.698l1.87 1.869a1.2 1.2 0 001.697 0l4.213-4.213 4.213 4.213a1.2 1.2 0 001.698 0l1.869-1.87a1.2 1.2 0 000-1.697l-4.213-4.213zM12 14.4a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8z"/></svg> },
];

/* ── Logo pill ── */
function LogoPill({ name, color, svg }: { name: string; color?: string; svg: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={color ? { color, backgroundColor: `${color}10` } : undefined}>
        {svg}
      </div>
      <span className="text-xs font-medium text-gray-700">{name}</span>
    </div>
  );
}

/* ── Main Component ── */
export function ChatbotShowcase() {
  return (
    <section className="relative pt-10 pb-24 lg:pt-14 lg:pb-32 overflow-x-clip">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/30 to-white pointer-events-none" />
      {/* Permanent glow in the background — visible through the glass chat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/50 via-sky-300/45 to-rose-300/35 rounded-full blur-[80px]" />
          <div className="absolute top-10 -left-10 w-64 h-64 bg-violet-300/55 rounded-full blur-[60px]" />
          <div className="absolute -bottom-6 right-0 w-72 h-72 bg-sky-300/50 rounded-full blur-[70px]" />
          <div className="absolute top-1/4 right-10 w-52 h-52 bg-rose-200/40 rounded-full blur-[50px]" />
          <div className="absolute bottom-1/4 -left-6 w-48 h-48 bg-amber-200/35 rounded-full blur-[50px]" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 lg:mb-20"
        >
          <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-gray-400 mb-4">
            AI Chatbots
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-[-0.03em] leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
            AI chatbots for every channel
          </h2>
        </motion.div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 lg:gap-8 items-center">

          {/* Left — Channels */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Channels</span>
            <h3 className="text-3xl lg:text-[2.5rem] font-bold text-gray-900 mt-3 mb-4 tracking-[-0.03em] leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
              Every platform,{' '}<br className="hidden lg:block" />
              one AI brain
            </h3>
            <p className="text-[15px] text-gray-500 leading-[1.7] mb-8 max-w-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Deploy on WhatsApp, Instagram, Telegram, Messenger, and your website — one AI, everywhere your customers are.
            </p>
            <div className="flex flex-wrap gap-2">
              {channels.map((ch) => (
                <LogoPill key={ch.name} {...ch} />
              ))}
            </div>
          </motion.div>

          {/* Center — Chat animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-[340px] flex-shrink-0 mx-auto relative"
          >
            <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-gray-400 mb-4">Live preview</p>
            <ChatPlayback />
          </motion.div>

          {/* Right — Integrations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:text-right"
          >
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Integrations</span>
            <h3 className="text-3xl lg:text-[2.5rem] font-bold text-gray-900 mt-3 mb-4 tracking-[-0.03em] leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
              Connected to{' '}<br className="hidden lg:block" />
              your tools
            </h3>
            <p className="text-[15px] text-gray-500 leading-[1.7] mb-8 max-w-sm lg:ml-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Book meetings, update CRMs, process payments, and trigger workflows — all from the conversation.
            </p>
            <div className="flex flex-wrap lg:justify-end gap-2">
              {integrations.map((integ) => (
                <LogoPill key={integ.name} name={integ.name} svg={integ.svg} />
              ))}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium text-gray-400">+50 more</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
