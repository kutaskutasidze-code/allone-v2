'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Sequence {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
}

interface TypewriterTitleProps {
  sequences: Sequence[];
  typingSpeed?: number;
  deleteSpeed?: number;
  startDelay?: number;
  autoLoop?: boolean;
  loopDelay?: number;
  naturalVariance?: boolean;
  className?: string;
  cursorClassName?: string;
}

export function TypewriterTitle({
  sequences,
  typingSpeed = 60,
  deleteSpeed = 40,
  startDelay = 500,
  autoLoop = true,
  loopDelay = 3000,
  naturalVariance = true,
  className = '',
  cursorClassName = '',
}: TypewriterTitleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const getVariance = useCallback(() => {
    if (!naturalVariance) return 0;
    return Math.random() * 40 - 20; // -20ms to +20ms variance
  }, [naturalVariance]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);

    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!isStarted || sequences.length === 0) return;

    const currentSequence = sequences[sequenceIndex];
    const targetText = currentSequence.text;

    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      // Deleting characters
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(prev => prev.slice(0, -1));
        }, deleteSpeed + getVariance());
      } else {
        // Done deleting, move to next sequence
        setIsDeleting(false);
        setSequenceIndex(prev => (prev + 1) % sequences.length);
      }
    } else {
      // Typing characters
      if (displayText.length < targetText.length) {
        timeout = setTimeout(() => {
          setDisplayText(targetText.slice(0, displayText.length + 1));
        }, typingSpeed + getVariance());
      } else {
        // Done typing this sequence
        if (currentSequence.deleteAfter) {
          // Wait then start deleting
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, currentSequence.pauseAfter || 1000);
        } else if (autoLoop) {
          // Wait then restart from beginning
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, loopDelay);
        }
        // If not deleteAfter and not autoLoop, just stay on this text
      }
    }

    return () => clearTimeout(timeout);
  }, [
    isStarted,
    displayText,
    isDeleting,
    sequenceIndex,
    sequences,
    typingSpeed,
    deleteSpeed,
    autoLoop,
    loopDelay,
    getVariance,
  ]);

  return (
    <div className={`flex items-center gap-1 font-outfit text-2xl tracking-tight md:text-3xl ${className}`}>
      <span>{displayText}</span>
      <motion.span
        className={`inline-block h-[1em] w-[2px] ${cursorClassName || 'bg-current'}`}
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
