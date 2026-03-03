'use client';

import { useEffect, useRef, useCallback } from 'react';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import { createProgram, createFullscreenQuad, cleanup } from './webgl-setup';

interface IntroAnimationProps {
  onComplete: () => void;
}

const ANIMATION_DURATION = 5.0;
const FADE_DURATION = 500;

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textSolidRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const container = containerRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!container || !canvasContainer) {
      handleComplete();
      return;
    }

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let startTime = 0;

    function init() {
      canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      canvasContainer!.appendChild(canvas);

      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;

      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        handleComplete();
        return;
      }

      program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
      if (!program) {
        handleComplete();
        return;
      }

      gl.useProgram(program);
      buffer = createFullscreenQuad(gl, program);

      if (!buffer) {
        handleComplete();
        return;
      }

      startTime = performance.now();
      tick();
    }

    function tick() {
      if (!gl || !program || !canvas) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(elapsed, ANIMATION_DURATION);

      // Resize if needed
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      // Update uniforms
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), t);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Animate the text layers
      if (textSolidRef.current) {
        // Blend layer stays at opacity 1 always — the shader's own
        // intensity envelope controls when ribbons are visible through text.
        // When shader outputs black, multiply makes everything black.
        // When shader outputs bright ribbons, they show through white text only.

        // Solid white text: fades in at 2.5s, fades out at 3.8s
        const solidOpacity = Math.min(1, Math.max(0, (t - 2.5) / 0.5))
                           * Math.min(1, Math.max(0, 1 - (t - 3.8) / 0.5));
        textSolidRef.current.style.opacity = String(solidOpacity);

        // Zoom effect starting at 3.5s
        const zoomProgress = Math.min(1, Math.max(0, (t - 3.5) / 1.5));
        const scale = 1 + zoomProgress * 1.5;
        container!.style.transform = `scale(${scale})`;
      }

      if (elapsed >= ANIMATION_DURATION) {
        container!.style.transition = `opacity ${FADE_DURATION}ms ease-out`;
        container!.style.opacity = '0';
        setTimeout(() => {
          if (gl && canvas) cleanup(gl, program, buffer, canvas);
          handleComplete();
        }, FADE_DURATION);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    init();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (gl && canvas) cleanup(gl, program, buffer, canvas);
    };
  }, [handleComplete]);

  // Shared text styles
  const textStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(80px, 12vw, 160px)',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-[#0B0B0B] overflow-hidden"
      style={{ opacity: 1, transformOrigin: 'center center' }}
    >
      {/* Layer 1: WebGL aurora/ribbon canvas */}
      <div ref={canvasContainerRef} className="absolute inset-0" />

      {/* Layer 2: Text with mix-blend-mode multiply — aurora shows through white text.
          Always opacity 1 so the black mask is fully opaque. The shader's own
          intensity envelope handles when ribbons appear/disappear. */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black"
        style={{ mixBlendMode: 'multiply' }}
      >
        <span style={{ ...textStyle, color: 'white' }}>allone</span>
      </div>

      {/* Layer 3: Solid white text — fades in over the aurora, then fades out */}
      <div
        ref={textSolidRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        <span style={{ ...textStyle, color: 'white' }}>allone</span>
      </div>
    </div>
  );
}
