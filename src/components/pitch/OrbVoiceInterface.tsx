'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useVoiceAgent, type AgentState } from '@/components/allone-ai/useVoiceAgent';
import Orb from './Orb';

type OrbSize = 'hero' | 'md' | 'sm';

interface OrbVoiceInterfaceProps {
  size?: OrbSize;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

const STATE_HUE: Record<AgentState, number> = {
  idle: 0,
  listening: 330,
  processing: 50,
  speaking: 140,
  calling: 210,
  presenting: 270,
};

const SIZE_CLASSES: Record<OrbSize, string> = {
  hero: 'w-[min(80vw,500px)] h-[min(80vw,500px)] sm:w-[500px] sm:h-[500px]',
  md: 'w-[min(60vw,350px)] h-[min(60vw,350px)] sm:w-[350px] sm:h-[350px]',
  sm: 'w-[min(50vw,250px)] h-[min(50vw,250px)] sm:w-[250px] sm:h-[250px]',
};

export default function OrbVoiceInterface({
  size = 'hero',
  children,
  className = '',
  interactive = true,
}: OrbVoiceInterfaceProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const voice = useVoiceAgent();

  const handleClick = useCallback(() => {
    if (!interactive) return;
    if (voice.state === 'idle') {
      voice.startListening();
    } else if (voice.state === 'listening') {
      voice.stopListening();
    } else if (voice.state === 'speaking') {
      voice.stopSpeaking();
    }
  }, [interactive, voice]);

  const hue = STATE_HUE[voice.state];
  const forceHover = voice.state !== 'idle';
  const intensity = voice.state === 'listening'
    ? 0.2 + voice.audioLevel * 0.8
    : voice.state === 'idle'
      ? 0.2
      : 0.5;

  const cursorClass = useMemo(() => {
    if (!interactive) return '';
    if (voice.state === 'idle') return 'cursor-pointer';
    if (voice.state === 'listening') return 'cursor-pointer';
    if (voice.state === 'speaking') return 'cursor-pointer';
    return 'cursor-wait';
  }, [interactive, voice.state]);

  const stateLabel = voice.state === 'listening' ? 'გისმენ...'
    : voice.state === 'processing' ? 'ვფიქრობ...'
    : null;

  return (
    <div
      className={`relative flex items-center justify-center ${SIZE_CLASSES[size]} ${cursorClass} ${className}`}
      onClick={handleClick}
    >
      {mounted && (
        <Orb
          hue={hue}
          hoverIntensity={intensity}
          rotateOnHover
          forceHoverState={forceHover}
          backgroundColor="#ffffff"
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {children}
        </div>
      )}
      {interactive && stateLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <p className="text-sm sm:text-base font-medium text-black/50 text-center max-w-[60%] truncate">
            {stateLabel}
          </p>
        </div>
      )}
      {voice.error && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[300px] text-center pointer-events-none z-20">
          <p className="text-xs text-red-500">{voice.error}</p>
        </div>
      )}
    </div>
  );
}

export { type OrbVoiceInterfaceProps, type OrbSize };
