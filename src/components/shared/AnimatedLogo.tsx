'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 32, height: 32, textSize: 'text-sm' },
  md: { width: 40, height: 40, textSize: 'text-base' },
  lg: { width: 56, height: 56, textSize: 'text-xl' },
  xl: { width: 80, height: 80, textSize: 'text-2xl' },
};

export function AnimatedLogo({
  size = 'md',
  showText = true,
  className = ''
}: AnimatedLogoProps) {
  const { width, height, textSize } = sizeConfig[size];

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {/* Logo Container with Glow Effect */}
      <motion.div
        className="relative group"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {/* Breathing Glow Background */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(61, 90, 128, 0.15) 0%, transparent 70%)',
            filter: 'blur(8px)',
            transform: 'scale(1.5)',
          }}
          animate={{
            scale: [1.4, 1.6, 1.4],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Subtle Ambient Pulse (always active) */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'radial-gradient(circle, rgba(61, 90, 128, 0.08) 0%, transparent 60%)',
            filter: 'blur(6px)',
            transform: 'scale(1.3)',
          }}
          animate={{
            scale: [1.2, 1.4, 1.2],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Logo Image Container */}
        <motion.div
          className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[var(--gray-50)] to-white shadow-sm border border-[var(--gray-200)]"
          style={{ width, height }}
          animate={{
            boxShadow: [
              '0 2px 8px rgba(0, 0, 0, 0.04)',
              '0 4px 12px rgba(61, 90, 128, 0.08)',
              '0 2px 8px rgba(0, 0, 0, 0.04)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Image
            src="/images/allone-logo.png"
            alt="Allone"
            width={width}
            height={height}
            className="object-contain p-1"
            priority
          />
        </motion.div>

        {/* Corner Accent Dot */}
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 500 }}
        />
      </motion.div>

      {/* Text Logo */}
      {showText && (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            className={`font-[var(--font-display)] font-semibold tracking-tight text-[var(--black)] ${textSize}`}
          >
            ALLONE
          </span>
          <motion.span
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-medium -mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Admin
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Minimal version for tight spaces
export function AnimatedLogoIcon({
  size = 'md',
  className = ''
}: Omit<AnimatedLogoProps, 'showText'>) {
  const { width, height } = sizeConfig[size];

  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.08, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17
      }}
    >
      {/* Hover Ring */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-[var(--accent)] opacity-0 group-hover:opacity-100"
        initial={false}
        animate={{ scale: [1, 1.15, 1.15], opacity: [0, 0.5, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut'
        }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Logo */}
      <div
        className="relative rounded-xl overflow-hidden bg-white shadow-md border border-[var(--gray-200)] group-hover:border-[var(--accent)] transition-colors duration-300"
        style={{ width, height }}
      >
        <Image
          src="/images/allone-logo.png"
          alt="Allone"
          width={width}
          height={height}
          className="object-contain p-1"
          priority
        />
      </div>

      {/* Status Dot */}
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// Large hero version for login page
export function AnimatedLogoHero({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`flex flex-col items-center gap-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Large Logo with Elaborate Animation */}
      <motion.div className="relative">
        {/* Outer Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(61, 90, 128, 0.1), transparent)',
            transform: 'scale(1.4)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Pulsing Glow Layers */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(circle, rgba(61, 90, 128, ${0.08 / i}) 0%, transparent 60%)`,
              filter: `blur(${8 * i}px)`,
              transform: `scale(${1.2 + i * 0.2})`,
            }}
            animate={{
              scale: [1.2 + i * 0.2, 1.4 + i * 0.2, 1.2 + i * 0.2],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Main Logo Container */}
        <motion.div
          className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-white via-[var(--gray-50)] to-white shadow-xl border border-[var(--gray-200)]"
          animate={{
            boxShadow: [
              '0 8px 32px rgba(0, 0, 0, 0.08)',
              '0 12px 48px rgba(61, 90, 128, 0.15)',
              '0 8px 32px rgba(0, 0, 0, 0.08)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner Shimmer Effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 4,
              ease: 'easeInOut',
            }}
          />

          <Image
            src="/images/allone-logo.png"
            alt="Allone"
            width={112}
            height={112}
            className="object-contain p-3 relative z-10"
            priority
          />
        </motion.div>

        {/* Orbiting Accent Dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--accent-light)' : 'var(--gray-400)',
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [
                Math.cos((i * 120 * Math.PI) / 180) * 70,
                Math.cos(((i * 120 + 360) * Math.PI) / 180) * 70,
              ],
              y: [
                Math.sin((i * 120 * Math.PI) / 180) * 70,
                Math.sin(((i * 120 + 360) * Math.PI) / 180) * 70,
              ],
              scale: [1, 1.3, 1],
            }}
            transition={{
              x: { duration: 8, repeat: Infinity, ease: 'linear' },
              y: { duration: 8, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
            }}
          />
        ))}
      </motion.div>

      {/* Brand Text */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h1 className="text-3xl font-[var(--font-display)] font-semibold tracking-tight text-[var(--black)]">
          ALLONE
        </h1>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="w-8 h-px bg-[var(--gray-300)]" />
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-medium">
            Admin Portal
          </span>
          <div className="w-8 h-px bg-[var(--gray-300)]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
