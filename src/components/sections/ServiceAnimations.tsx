'use client';

import { useEffect, useRef } from 'react';

// ChatbotAnimation - Clear chat interface with messages
export function ChatbotAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    interface Message {
      x: number;
      y: number;
      width: number;
      height: number;
      isBot: boolean;
      opacity: number;
      delay: number;
      lines: number;
    }

    let messages: Message[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initMessages(rect.width, rect.height);
    };

    const initMessages = (width: number, height: number) => {
      messages = [];
      const padding = 40;
      const messageGap = 16;
      let currentY = height * 0.08;

      const conversation = [
        { isBot: false, width: 0.4, lines: 1 },
        { isBot: true, width: 0.55, lines: 2 },
        { isBot: false, width: 0.35, lines: 1 },
        { isBot: true, width: 0.5, lines: 3 },
        { isBot: false, width: 0.3, lines: 1 },
        { isBot: true, width: 0.45, lines: 2 },
      ];

      conversation.forEach((msg, i) => {
        const msgWidth = (width - padding * 2) * msg.width;
        const msgHeight = 24 + msg.lines * 14;

        messages.push({
          x: msg.isBot ? padding : width - padding - msgWidth,
          y: currentY,
          width: msgWidth,
          height: msgHeight,
          isBot: msg.isBot,
          opacity: 0,
          delay: i * 0.6,
          lines: msg.lines,
        });

        currentY += msgHeight + messageGap;
      });
    };

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 0.016;

      const cycleDuration = 8;
      const cycleTime = time % cycleDuration;

      messages.forEach((msg) => {
        const showTime = msg.delay;
        const fadeOutTime = cycleDuration - 1;

        let targetOpacity = 0;
        if (cycleTime > showTime && cycleTime < fadeOutTime) {
          targetOpacity = Math.min(1, (cycleTime - showTime) / 0.3);
        } else if (cycleTime >= fadeOutTime) {
          targetOpacity = Math.max(0, 1 - (cycleTime - fadeOutTime) / 0.5);
        }

        msg.opacity += (targetOpacity - msg.opacity) * 0.15;

        if (msg.opacity > 0.01) {
          drawRoundedRect(msg.x, msg.y, msg.width, msg.height, 16);
          ctx.fillStyle = msg.isBot
            ? `rgba(245, 245, 245, ${msg.opacity})`
            : `rgba(10, 10, 10, ${msg.opacity * 0.9})`;
          ctx.fill();

          if (msg.isBot) {
            ctx.beginPath();
            ctx.arc(msg.x + 16, msg.y + 16, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(10, 10, 10, ${msg.opacity * 0.6})`;
            ctx.fill();
          }

          const lineStartX = msg.isBot ? msg.x + 32 : msg.x + 14;
          const lineWidth = msg.width - (msg.isBot ? 46 : 28);

          for (let i = 0; i < msg.lines; i++) {
            const w = i === msg.lines - 1 ? lineWidth * 0.6 : lineWidth;
            ctx.fillStyle = msg.isBot
              ? `rgba(10, 10, 10, ${msg.opacity * 0.4})`
              : `rgba(255, 255, 255, ${msg.opacity * 0.6})`;
            drawRoundedRect(lineStartX, msg.y + 12 + i * 14, w, 8, 4);
            ctx.fill();
          }
        }
      });

      const showTyping = messages.some((m, i) => {
        const nextDelay = messages[i + 1]?.delay || 8;
        return (time % 8) > m.delay + 0.3 && (time % 8) < nextDelay - 0.2 && messages[i + 1]?.isBot;
      });

      if (showTyping) {
        const lastBotMsg = [...messages].reverse().find(m => m.isBot && m.opacity > 0.5);
        if (lastBotMsg) {
          const dotY = lastBotMsg.y + lastBotMsg.height + 24;
          for (let i = 0; i < 3; i++) {
            const bounce = Math.sin(time * 6 + i * 0.8) * 2;
            ctx.beginPath();
            ctx.arc(50 + i * 10, dotY + bounce, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(10, 10, 10, ${0.3 + Math.sin(time * 6 + i) * 0.1})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// WorkflowAnimation - Natural flow with connected nodes
export function WorkflowAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    interface Node {
      x: number;
      y: number;
      radius: number;
    }

    interface Connection {
      from: number;
      to: number;
    }

    interface Particle {
      connectionIndex: number;
      progress: number;
      speed: number;
    }

    let nodes: Node[] = [];
    let connections: Connection[] = [];
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      width = rect.width;
      height = rect.height;
      initSystem();
    };

    const initSystem = () => {
      nodes = [];
      connections = [];
      particles = [];

      const cx = width / 2;
      const cy = height / 2;
      const spreadX = width * 0.35;
      const spreadY = height * 0.35;

      nodes = [
        { x: cx - spreadX, y: cy - spreadY * 0.5, radius: 8 },
        { x: cx - spreadX, y: cy + spreadY * 0.5, radius: 8 },
        { x: cx, y: cy - spreadY, radius: 10 },
        { x: cx, y: cy, radius: 12 },
        { x: cx, y: cy + spreadY, radius: 10 },
        { x: cx + spreadX, y: cy - spreadY * 0.5, radius: 8 },
        { x: cx + spreadX, y: cy + spreadY * 0.5, radius: 8 },
      ];

      connections = [
        { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 1, to: 3 },
        { from: 1, to: 4 }, { from: 2, to: 3 }, { from: 2, to: 5 },
        { from: 3, to: 5 }, { from: 3, to: 6 }, { from: 4, to: 3 }, { from: 4, to: 6 },
      ];

      connections.forEach((_, i) => {
        particles.push({
          connectionIndex: i,
          progress: Math.random(),
          speed: 0.008 + Math.random() * 0.004,
        });
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      connections.forEach((conn) => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(10, 10, 10, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      particles.forEach((particle) => {
        particle.progress += particle.speed;
        if (particle.progress > 1) particle.progress = 0;

        const conn = connections[particle.connectionIndex];
        const from = nodes[conn.from];
        const to = nodes[conn.to];

        for (let i = 0; i < 5; i++) {
          const t = Math.max(0, particle.progress - i * 0.04);
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          const opacity = (1 - i / 5) * 0.5;
          const size = 2.5 - i * 0.4;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10, 10, 10, ${opacity})`;
          ctx.fill();
        }
      });

      nodes.forEach((node, i) => {
        const pulse = Math.sin(time * 2 + i * 0.5) * 0.1 + 1;
        const r = node.radius * pulse;

        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(10, 10, 10, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = i === 3 ? 'rgba(10, 10, 10, 0.7)' : 'rgba(10, 10, 10, 0.25)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// CustomAIAnimation - Problems transforming into solutions
export function CustomAIAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    interface Element {
      chaosX: number;
      chaosY: number;
      chaosRotation: number;
      chaosSize: number;
      orderX: number;
      orderY: number;
      orderRotation: number;
      orderSize: number;
      x: number;
      y: number;
      rotation: number;
      size: number;
      shape: 'circle' | 'square' | 'triangle';
      delay: number;
    }

    let elements: Element[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      width = rect.width;
      height = rect.height;
      initElements();
    };

    const initElements = () => {
      elements = [];
      const centerX = width / 2;
      const centerY = height / 2;
      const gridSize = 4;
      const spacing = 35;
      const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const orderX = centerX - ((gridSize - 1) * spacing) / 2 + col * spacing + 60;
          const orderY = centerY - ((gridSize - 1) * spacing) / 2 + row * spacing;
          const chaosX = 40 + Math.random() * (width * 0.3);
          const chaosY = 30 + Math.random() * (height - 60);

          elements.push({
            chaosX, chaosY,
            chaosRotation: Math.random() * Math.PI * 2,
            chaosSize: 4 + Math.random() * 8,
            orderX, orderY,
            orderRotation: 0,
            orderSize: 8,
            x: chaosX, y: chaosY,
            rotation: Math.random() * Math.PI * 2,
            size: 4 + Math.random() * 8,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            delay: (row + col) * 0.08,
          });
        }
      }
    };

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const drawShape = (x: number, y: number, size: number, rotation: number, shape: string, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = `rgba(10, 10, 10, ${opacity})`;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'square') {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else if (shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      const cycleDuration = 6;
      const cycleTime = time % cycleDuration;
      const transitionStart = 1.5;
      const transitionEnd = 3.5;
      const holdEnd = 5.5;

      const dividerX = width * 0.42;
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.moveTo(dividerX, 30);
      ctx.lineTo(dividerX, height - 30);
      ctx.strokeStyle = 'rgba(10, 10, 10, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      const processorX = dividerX;
      const processorY = height / 2;
      const processorPulse = Math.sin(time * 3) * 0.15 + 1;

      ctx.beginPath();
      ctx.arc(processorX, processorY, 20 * processorPulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(processorX, processorY, 10 * processorPulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 10, 10, 0.6)';
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time * 0.5;
        const innerR = 25 * processorPulse;
        const outerR = 32 * processorPulse;
        ctx.beginPath();
        ctx.moveTo(processorX + Math.cos(angle) * innerR, processorY + Math.sin(angle) * innerR);
        ctx.lineTo(processorX + Math.cos(angle) * outerR, processorY + Math.sin(angle) * outerR);
        ctx.strokeStyle = 'rgba(10, 10, 10, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      elements.forEach((el) => {
        let progress = 0;
        if (cycleTime < transitionStart) {
          progress = 0;
        } else if (cycleTime < transitionEnd) {
          const rawProgress = (cycleTime - transitionStart - el.delay) / (transitionEnd - transitionStart - 0.5);
          progress = easeInOutCubic(Math.max(0, Math.min(1, rawProgress)));
        } else if (cycleTime < holdEnd) {
          progress = 1;
        } else {
          const resetProgress = (cycleTime - holdEnd) / (cycleDuration - holdEnd);
          progress = 1 - easeInOutCubic(Math.min(1, resetProgress * 2));
        }

        el.x = el.chaosX + (el.orderX - el.chaosX) * progress;
        el.y = el.chaosY + (el.orderY - el.chaosY) * progress;
        el.rotation = el.chaosRotation + (el.orderRotation - el.chaosRotation) * progress;
        el.size = el.chaosSize + (el.orderSize - el.chaosSize) * progress;

        if (progress < 0.5) {
          el.x += Math.sin(time * 3 + el.delay * 10) * (1 - progress * 2) * 3;
          el.y += Math.cos(time * 2 + el.delay * 8) * (1 - progress * 2) * 3;
          el.rotation += Math.sin(time * 2) * (1 - progress * 2) * 0.1;
        }

        const opacity = 0.15 + progress * 0.45;
        drawShape(el.x, el.y, el.size, el.rotation, el.shape, opacity);

        if (progress > 0.8) {
          const lineOpacity = (progress - 0.8) / 0.2 * 0.08;
          elements.forEach((other) => {
            const dx = Math.abs(el.orderX - other.orderX);
            const dy = Math.abs(el.orderY - other.orderY);
            if (dx <= 36 && dy <= 36 && (dx > 0 || dy > 0) && dx + dy <= 36) {
              ctx.beginPath();
              ctx.moveTo(el.x, el.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = `rgba(10, 10, 10, ${lineOpacity})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ConsultingAnimation - Strategy blueprint
export function ConsultingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    interface BlueprintLine {
      x1: number; y1: number; x2: number; y2: number;
      delay: number; drawn: number;
    }

    interface StrategyNode {
      x: number; y: number; radius: number;
      delay: number; opacity: number; connections: number[];
    }

    interface DataPoint {
      x: number; y: number; targetX: number; targetY: number; delay: number;
    }

    let blueprintLines: BlueprintLine[] = [];
    let strategyNodes: StrategyNode[] = [];
    let dataPoints: DataPoint[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      width = rect.width;
      height = rect.height;
      initBlueprint();
    };

    const initBlueprint = () => {
      blueprintLines = [];
      strategyNodes = [];
      dataPoints = [];

      const centerX = width / 2;
      const centerY = height / 2;

      strategyNodes.push({ x: centerX, y: centerY, radius: 14, delay: 0, opacity: 0, connections: [1, 2, 3] });

      const tier2Positions = [
        { x: centerX - 80, y: centerY - 50 },
        { x: centerX + 80, y: centerY - 50 },
        { x: centerX, y: centerY + 70 },
      ];

      tier2Positions.forEach((pos, i) => {
        strategyNodes.push({
          x: pos.x, y: pos.y, radius: 10,
          delay: 0.8 + i * 0.3, opacity: 0,
          connections: i === 2 ? [6, 7] : [4 + i],
        });
      });

      const tier3Positions = [
        { x: centerX - 130, y: centerY - 20 },
        { x: centerX + 130, y: centerY - 20 },
        { x: centerX - 50, y: centerY + 100 },
        { x: centerX + 50, y: centerY + 100 },
      ];

      tier3Positions.forEach((pos, i) => {
        strategyNodes.push({
          x: pos.x, y: pos.y, radius: 6,
          delay: 2 + i * 0.25, opacity: 0, connections: [],
        });
      });

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const startRadius = 140 + Math.random() * 30;
        dataPoints.push({
          x: centerX + Math.cos(angle) * startRadius,
          y: centerY + Math.sin(angle) * startRadius,
          targetX: centerX + Math.cos(angle) * 60,
          targetY: centerY + Math.sin(angle) * 60,
          delay: i * 0.15,
        });
      }

      const gridSpacing = 30;
      for (let y = centerY - 90; y <= centerY + 120; y += gridSpacing) {
        blueprintLines.push({
          x1: centerX - 140, y1: y, x2: centerX + 140, y2: y,
          delay: Math.abs(y - centerY) * 0.01, drawn: 0,
        });
      }
      for (let x = centerX - 120; x <= centerX + 120; x += gridSpacing) {
        blueprintLines.push({
          x1: x, y1: centerY - 90, x2: x, y2: centerY + 120,
          delay: Math.abs(x - centerX) * 0.01, drawn: 0,
        });
      }
    };

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      const cycleDuration = 8;
      const cycleTime = time % cycleDuration;
      const centerX = width / 2;
      const centerY = height / 2;
      const gridDrawTime = 1.5;
      const holdTime = 7;

      const gridProgress = Math.min(1, cycleTime / gridDrawTime);
      if (gridProgress > 0) {
        ctx.strokeStyle = `rgba(10, 10, 10, ${0.04 * gridProgress})`;
        ctx.lineWidth = 0.5;

        blueprintLines.forEach((line) => {
          const lineProgress = Math.max(0, Math.min(1, (cycleTime - line.delay) / 0.5));
          if (lineProgress > 0) {
            const currentX2 = line.x1 + (line.x2 - line.x1) * easeOutQuad(lineProgress);
            const currentY2 = line.y1 + (line.y2 - line.y1) * easeOutQuad(lineProgress);
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(currentX2, currentY2);
            ctx.stroke();
          }
        });
      }

      dataPoints.forEach((point) => {
        const pointProgress = Math.max(0, Math.min(1, (cycleTime - point.delay - 0.5) / 1.5));
        if (cycleTime > point.delay + 0.5 && cycleTime < holdTime) {
          const x = point.x + (point.targetX - point.x) * easeOutQuad(pointProgress);
          const y = point.y + (point.targetY - point.y) * easeOutQuad(pointProgress);
          for (let j = 0; j < 3; j++) {
            const trailProgress = Math.max(0, pointProgress - j * 0.1);
            const tx = point.x + (point.targetX - point.x) * easeOutQuad(trailProgress);
            const ty = point.y + (point.targetY - point.y) * easeOutQuad(trailProgress);
            ctx.beginPath();
            ctx.arc(tx, ty, 2 - j * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(10, 10, 10, ${(0.4 - j * 0.1) * (1 - pointProgress)})`;
            ctx.fill();
          }
        }
      });

      strategyNodes.forEach((node, i) => {
        const nodeProgress = Math.max(0, Math.min(1, (cycleTime - node.delay) / 0.6));

        if (nodeProgress > 0.3) {
          node.connections.forEach((targetIndex) => {
            const target = strategyNodes[targetIndex];
            const targetProgress = Math.max(0, Math.min(1, (cycleTime - target.delay) / 0.6));
            if (targetProgress > 0) {
              const lineProgress = Math.min(nodeProgress, targetProgress);
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              const endX = node.x + (target.x - node.x) * lineProgress;
              const endY = node.y + (target.y - node.y) * lineProgress;
              ctx.lineTo(endX, endY);
              ctx.strokeStyle = `rgba(10, 10, 10, ${0.2 * lineProgress})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });
        }

        if (cycleTime >= holdTime) {
          const fadeProgress = (cycleTime - holdTime) / (cycleDuration - holdTime);
          node.opacity = (1 - fadeProgress) * nodeProgress;
        } else {
          node.opacity = nodeProgress;
        }

        if (node.opacity > 0.01) {
          const radius = node.radius * easeOutQuad(node.opacity);
          const pulse = i === 0 ? Math.sin(time * 2) * 0.1 + 1 : 1;

          ctx.beginPath();
          ctx.arc(node.x, node.y, (radius + 4) * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10, 10, 10, ${0.1 * node.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10, 10, 10, ${(i === 0 ? 0.7 : 0.4) * node.opacity})`;
          ctx.fill();

          if (i === 0) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * node.opacity})`;
            ctx.fill();
          }
        }
      });

      const frameOpacity = Math.min(0.1, cycleTime / gridDrawTime * 0.1);
      if (cycleTime < holdTime) {
        ctx.strokeStyle = `rgba(10, 10, 10, ${frameOpacity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - 145, centerY - 95, 290, 220);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// Array of animations for easy access by index
export const ServiceAnimations = [
  ChatbotAnimation,
  WorkflowAnimation,
  CustomAIAnimation,
  ConsultingAnimation,
];
