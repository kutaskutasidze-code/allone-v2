'use client';

import { useEffect } from 'react';

// Replicates the studio's custom cursor: the AllOne swoosh (favicon.svg) follows
// the pointer, tilts toward travel direction, and hides the native cursor.
export function CareersCursor() {
  useEffect(() => {
    if (window.matchMedia?.('(pointer: coarse)').matches) return; // skip touch

    const ROT_OFFSET = 0.2642; // head leads velocity (studio value)

    const style = document.createElement('style');
    style.textContent =
      'html.careers-cursor-on, html.careers-cursor-on body, html.careers-cursor-on *, html.careers-cursor-on *::before, html.careers-cursor-on *::after { cursor: none !important; }';
    document.head.appendChild(style);

    const cur = document.createElement('div');
    const img = document.createElement('img');
    img.src = '/favicon.svg';
    img.alt = '';
    img.draggable = false;
    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      filter: 'brightness(0) invert(1)',
    } as CSSStyleDeclaration);
    cur.appendChild(img);
    Object.assign(cur.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '26px',
      height: '26px',
      zIndex: '100000',
      pointerEvents: 'none',
      willChange: 'transform',
      mixBlendMode: 'difference',
    } as CSSStyleDeclaration);
    document.body.appendChild(cur);
    document.documentElement.classList.add('careers-cursor-on');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let angle = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const loop = () => {
      const px = cx;
      const py = cy;
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      const vx = cx - px;
      const vy = cy - py;
      if (vx * vx + vy * vy > 0.4) angle = Math.atan2(vy, vx) + ROT_OFFSET;
      cur.style.transform = `translate3d(${cx - 13}px, ${cy - 13}px, 0) rotate(${angle}rad)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      cur.remove();
      style.remove();
      document.documentElement.classList.remove('careers-cursor-on');
    };
  }, []);

  return null;
}
