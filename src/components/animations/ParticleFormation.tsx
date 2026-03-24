'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LOGO_PATHS, LOGO_COLOR, LOGO_VIEWBOX } from './shared/logo-paths';

// Pre-computed target points sampled along logo paths
function samplePathPoints(count: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  // Create offscreen SVG to sample path points
  if (typeof document === 'undefined') return points;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.style.position = 'absolute';
  svg.style.left = '-9999px';
  document.body.appendChild(svg);

  const perPath = Math.ceil(count / LOGO_PATHS.length);

  LOGO_PATHS.forEach((lp) => {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', lp.d);
    svg.appendChild(pathEl);

    const totalLen = pathEl.getTotalLength();
    for (let i = 0; i < perPath; i++) {
      const pt = pathEl.getPointAtLength((i / perPath) * totalLen);
      points.push({ x: pt.x, y: pt.y });
    }
  });

  document.body.removeChild(svg);
  return points.slice(0, count);
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  radius: number;
  opacity: number;
}

export function ParticleFormation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoVisible, setLogoVisible] = useState(false);
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 640;
    const particleCount = isMobile ? 60 : 150;
    const size = 200; // Match SVG viewBox
    canvas.width = size;
    canvas.height = size;

    const targets = samplePathPoints(particleCount);

    // Initialize particles at random positions
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const target = targets[i] || { x: 100, y: 100 };
      particles.push({
        x: Math.random() * size,
        y: Math.random() * size,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        tx: target.x,
        ty: target.y,
        radius: 1.5 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }

    let startTime: number | null = null;
    let animId: number;
    let disposed = false;

    function animate(time: number) {
      if (disposed) return;
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000;

      ctx!.clearRect(0, 0, size, size);

      // Phase timing
      const chaosEnd = 0.8;
      const swirlEnd = 1.8;
      const snapEnd = 2.8;
      const fadeStart = 2.6;
      const fadeEnd = 3.2;

      // Glow intensity
      let glow = 0;
      if (elapsed > chaosEnd && elapsed <= swirlEnd) {
        glow = ((elapsed - chaosEnd) / (swirlEnd - chaosEnd)) * 0.2;
      } else if (elapsed > swirlEnd && elapsed <= snapEnd) {
        glow = 0.2 + ((elapsed - swirlEnd) / (snapEnd - swirlEnd)) * 0.4;
      } else if (elapsed > snapEnd) {
        glow = 0.6;
      }
      setGlowIntensity(glow);

      for (const p of particles) {
        if (elapsed < chaosEnd) {
          // Brownian motion
          p.vx += (Math.random() - 0.5) * 0.5;
          p.vy += (Math.random() - 0.5) * 0.5;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.x += p.vx;
          p.y += p.vy;
          // Wrap around
          if (p.x < 0) p.x = size;
          if (p.x > size) p.x = 0;
          if (p.y < 0) p.y = size;
          if (p.y > size) p.y = 0;
        } else if (elapsed < swirlEnd) {
          // Swirl toward center with orbit
          const progress = (elapsed - chaosEnd) / (swirlEnd - chaosEnd);
          const cx = 100, cy = 100;
          const dx = p.x - cx, dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          // Shrink radius and add angular velocity
          const newDist = dist * (1 - progress * 0.3);
          const angularSpeed = 0.03 + progress * 0.05;
          const newAngle = angle + angularSpeed;
          p.x = cx + Math.cos(newAngle) * newDist;
          p.y = cy + Math.sin(newAngle) * newDist;
        } else if (elapsed < snapEnd) {
          // Snap to target
          const snapProgress = (elapsed - swirlEnd) / (snapEnd - swirlEnd);
          const ease = 1 - Math.pow(1 - snapProgress, 3); // cubic ease out
          p.x += (p.tx - p.x) * 0.08 * (1 + ease * 3);
          p.y += (p.ty - p.y) * 0.08 * (1 + ease * 3);
        }

        // Draw particle
        const alpha = elapsed > fadeStart
          ? p.opacity * Math.max(0, 1 - (elapsed - fadeStart) / (fadeEnd - fadeStart))
          : p.opacity;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(43, 138, 255, ${alpha})`;
        ctx!.fill();
      }

      // Canvas fade out
      if (elapsed >= fadeStart && elapsed < fadeEnd) {
        setCanvasOpacity(Math.max(0, 1 - (elapsed - fadeStart) / (fadeEnd - fadeStart)));
      }

      // Show logo
      if (elapsed >= fadeStart && !logoVisible) {
        setLogoVisible(true);
      }

      if (elapsed < fadeEnd + 0.5) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: glowIntensity }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{
          opacity: canvasOpacity,
          imageRendering: 'auto',
        }}
      />

      {/* SVG logo reveal underneath */}
      <motion.svg
        viewBox={LOGO_VIEWBOX}
        className="w-[60%] h-[60%] relative z-10"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={logoVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {LOGO_PATHS.map((path) => (
          <path key={path.id} d={path.d} fill={LOGO_COLOR} />
        ))}
      </motion.svg>

      {/* Breathing */}
      {logoVisible && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(43, 138, 255, 0.35) 0%, transparent 60%)',
            filter: 'blur(30px)',
            transform: 'translate3d(0,0,0)',
          }}
        />
      )}
    </div>
  );
}
