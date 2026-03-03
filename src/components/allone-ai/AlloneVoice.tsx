'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, Loader2, Volume2, X, MessageCircle } from 'lucide-react';
import { useVoiceAgent, AgentState } from './useVoiceAgent';

interface AlloneVoiceProps {}

const STATE_LABELS: Record<AgentState, string> = {
  idle: 'მზადაა',
  listening: 'მისმენს...',
  processing: 'ფიქრობს...',
  speaking: 'საუბრობს...',
  calling: 'რეკავს...',
  presenting: 'წარადგენს...',
};

const STATE_COLORS: Record<AgentState, string> = {
  idle: 'bg-[#1d1d1f]',
  listening: 'bg-red-500',
  processing: 'bg-amber-500',
  speaking: 'bg-emerald-500',
  calling: 'bg-blue-500',
  presenting: 'bg-purple-500',
};

export default function AlloneVoice({}: AlloneVoiceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');

  const {
    state,
    transcript,
    response,
    history,
    error,
    audioLevel,
    startListening,
    stopListening,
    sendText,
    stopSpeaking,
    reset,
  } = useVoiceAgent();

  // Auto-expand when active
  useEffect(() => {
    if (state !== 'idle') setIsExpanded(true);
  }, [state]);

  const handleMicToggle = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'speaking') {
      stopSpeaking();
    } else if (state === 'idle') {
      startListening();
    }
  };

  const handleTextSend = () => {
    if (!textInput.trim()) return;
    sendText(textInput.trim());
    setTextInput('');
  };

  // Pulsing ring based on audio level
  const ringScale = 1 + audioLevel * 0.5;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[100] flex flex-col items-end gap-3">
      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[240px]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl border border-[#e5e5e7] w-[300px] sm:w-[340px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e7]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATE_COLORS[state]} ${state !== 'idle' ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium text-[#1d1d1f]">Allone AI</span>
                <span className="text-xs text-[#86868b]">{STATE_LABELS[state]}</span>
              </div>
              <button
                onClick={() => { setIsExpanded(false); reset(); }}
                className="p-1 rounded-full hover:bg-[#f5f5f7] transition-colors"
              >
                <X className="w-4 h-4 text-[#86868b]" />
              </button>
            </div>

            {/* Chat history */}
            <div className="max-h-[200px] overflow-y-auto p-3 space-y-2">
              {history.length === 0 && state === 'idle' && (
                <p className="text-xs text-[#86868b] text-center py-4">
                  დააჭირეთ მიკროფონს ან დაწერეთ შეკითხვა
                </p>
              )}
              {history.slice(-6).map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs leading-relaxed px-3 py-2 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-[#1d1d1f] text-white ml-8'
                      : 'bg-[#f5f5f7] text-[#1d1d1f] mr-8'
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {/* Current transcript */}
              {transcript && state === 'processing' && (
                <div className="text-xs px-3 py-2 rounded-xl bg-[#1d1d1f] text-white ml-8 opacity-70">
                  {transcript}
                </div>
              )}

              {/* Current response being spoken */}
              {response && state === 'speaking' && (
                <div className="text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 mr-8 border border-emerald-200">
                  {response}
                </div>
              )}

              {/* Loading */}
              {state === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-[#86868b] px-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>ფიქრობს...</span>
                </div>
              )}
            </div>

            {/* Text input (toggle) */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#e5e5e7] overflow-hidden"
                >
                  <div className="flex gap-2 p-3">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                      placeholder="დაწერეთ..."
                      className="flex-1 text-xs px-3 py-2 bg-[#f5f5f7] rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-[#1d1d1f]/20"
                      disabled={state !== 'idle'}
                    />
                    <button
                      onClick={handleTextSend}
                      disabled={!textInput.trim() || state !== 'idle'}
                      className="px-3 py-2 bg-[#1d1d1f] text-white rounded-lg text-xs disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom controls */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#e5e5e7] bg-[#fafafa]">
              <button
                onClick={() => setShowChat(!showChat)}
                className="p-1.5 rounded-full hover:bg-[#e5e5e7] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#6e6e73]" />
              </button>
              <div className="flex items-center gap-1">
                {state === 'calling' && (
                  <Phone className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                )}
                {state === 'speaking' && (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main mic button */}
      <div className="relative">
        {/* Pulsing ring */}
        {state === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{ scale: ringScale }}
            transition={{ duration: 0.1 }}
          />
        )}

        <motion.button
          onClick={isExpanded ? handleMicToggle : () => setIsExpanded(true)}
          whileTap={{ scale: 0.9 }}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl flex items-center justify-center transition-colors ${
            state === 'listening'
              ? 'bg-red-500 text-white'
              : state === 'processing'
              ? 'bg-amber-500 text-white'
              : state === 'speaking'
              ? 'bg-emerald-500 text-white'
              : state === 'calling'
              ? 'bg-blue-500 text-white'
              : 'bg-[#1d1d1f] text-white hover:bg-[#333]'
          }`}
        >
          {state === 'listening' ? (
            <MicOff className="w-6 h-6" />
          ) : state === 'processing' ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-6 h-6" />
          ) : state === 'calling' ? (
            <Phone className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
