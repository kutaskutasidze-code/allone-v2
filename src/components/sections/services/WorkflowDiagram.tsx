'use client';

import { useState, useEffect, useRef } from 'react';
import { workflowPathData } from './constants';

export function WorkflowDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [dots, setDots] = useState<{ id: string; x: number; y: number }[]>([]);

  const animateDot = (pathId: string, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const svg = svgRef.current;
      if (!svg) { resolve(); return; }
      const pathEl = svg.querySelector(`[data-path="${pathId}"]`) as SVGPathElement;
      if (!pathEl) { resolve(); return; }

      const totalLength = pathEl.getTotalLength();
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        const point = pathEl.getPointAtLength(eased * totalLength);

        setDots(prev => {
          const existing = prev.find(d => d.id === pathId);
          if (existing) {
            return prev.map(d => d.id === pathId ? { ...d, x: point.x, y: point.y } : d);
          }
          return [...prev, { id: pathId, x: point.x, y: point.y }];
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDots(prev => prev.filter(d => d.id !== pathId));
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  };

  const animateDotsParallel = (pathIds: string[], duration: number): Promise<void> => {
    return Promise.all(pathIds.map(id => animateDot(id, duration))).then(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runAnimation = async () => {
      while (!cancelled) {
        setActiveNode('trigger');
        setActiveNodes([]);
        await wait(700);

        setActiveNode(null);
        await animateDot('trigger-main', 800);
        if (cancelled) return;
        setActiveNode('main');
        await wait(500);

        setActiveNode(null);
        await animateDotsParallel(['main-tool1', 'main-tool2'], 900);
        if (cancelled) return;
        setActiveNodes(['tool1', 'tool2']);
        await wait(600);
        setActiveNodes([]);

        await animateDot('main-decision', 700);
        if (cancelled) return;
        setActiveNode('decision');
        await wait(500);

        setActiveNode(null);
        await animateDotsParallel(['decision-output1', 'decision-output2'], 900);
        if (cancelled) return;
        setActiveNodes(['output1', 'output2']);
        await wait(600);
        setActiveNodes([]);

        await wait(2000);
      }
    };

    runAnimation();
    return () => { cancelled = true; };
  }, []);

  const isActive = (id: string) => activeNode === id || activeNodes.includes(id);

  // Colors for light palette
  const lineColor = 'rgba(7,29,47,0.12)';
  const nodeFill = 'rgba(248,250,254,1)';
  const nodeStroke = 'rgba(220,233,246,1)';
  const activeFill = '#0A68F5';
  const activeStroke = '#0A68F5';
  const contentColor = 'rgba(7,29,47,0.25)';
  const activeContentColor = '#FFFFFF';
  const accentDot = '#0A68F5';

  return (
    <div className="relative w-full h-full min-h-[220px]">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-accent" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        <path data-path="trigger-main" d={workflowPathData['trigger-main']} stroke={lineColor} strokeWidth="1.5" fill="none" />
        <path data-path="main-decision" d={workflowPathData['main-decision']} stroke={lineColor} strokeWidth="1.5" fill="none" />
        <path data-path="decision-output1" d={workflowPathData['decision-output1']} stroke={lineColor} strokeWidth="1.5" fill="none" />
        <path data-path="decision-output2" d={workflowPathData['decision-output2']} stroke={lineColor} strokeWidth="1.5" fill="none" />
        <path data-path="main-tool1" d={workflowPathData['main-tool1']} stroke={lineColor} strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
        <path data-path="main-tool2" d={workflowPathData['main-tool2']} stroke={lineColor} strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

        {/* Trigger Node */}
        <g>
          <circle
            cx="40" cy="80" r="14"
            fill={isActive('trigger') ? activeFill : nodeFill}
            stroke={isActive('trigger') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('trigger') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <polygon
            points="36,74 36,86 46,80"
            fill={isActive('trigger') ? '#FFFFFF' : 'rgba(7,29,47,0.25)'}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* Main Node */}
        <g>
          <rect
            x="95" y="60" width="70" height="40" rx="8"
            fill={isActive('main') ? activeFill : nodeFill}
            stroke={isActive('main') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('main') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="110" y1="75" x2="150" y2="75" stroke={isActive('main') ? activeContentColor : contentColor} strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="110" y1="85" x2="140" y2="85" stroke={isActive('main') ? activeContentColor : contentColor} strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Decision Node */}
        <g>
          <rect
            x="200" y="60" width="46" height="40" rx="6"
            fill={isActive('decision') ? activeFill : nodeFill}
            stroke={isActive('decision') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('decision') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="212" y1="75" x2="234" y2="75" stroke={isActive('decision') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="212" y1="85" x2="228" y2="85" stroke={isActive('decision') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Output1 Node */}
        <g>
          <rect
            x="320" y="32" width="55" height="36" rx="6"
            fill={isActive('output1') ? activeFill : nodeFill}
            stroke={isActive('output1') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('output1') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="330" y1="45" x2="365" y2="45" stroke={isActive('output1') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="330" y1="55" x2="355" y2="55" stroke={isActive('output1') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Output2 Node */}
        <g>
          <rect
            x="320" y="92" width="55" height="36" rx="6"
            fill={isActive('output2') ? activeFill : nodeFill}
            stroke={isActive('output2') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('output2') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="330" y1="105" x2="365" y2="105" stroke={isActive('output2') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="330" y1="115" x2="355" y2="115" stroke={isActive('output2') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Tool1 Node */}
        <g>
          <circle
            cx="80" cy="170" r="18"
            fill={isActive('tool1') ? activeFill : nodeFill}
            stroke={isActive('tool1') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('tool1') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="68" y1="166" x2="92" y2="166" stroke={isActive('tool1') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="68" y1="174" x2="85" y2="174" stroke={isActive('tool1') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Tool2 Node */}
        <g>
          <circle
            cx="175" cy="180" r="18"
            fill={isActive('tool2') ? activeFill : nodeFill}
            stroke={isActive('tool2') ? activeStroke : nodeStroke}
            strokeWidth="1.5"
            style={{ filter: isActive('tool2') ? 'url(#glow-accent)' : 'none', transition: 'all 0.3s ease' }}
          />
          <line x1="163" y1="176" x2="187" y2="176" stroke={isActive('tool2') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
          <line x1="163" y1="184" x2="180" y2="184" stroke={isActive('tool2') ? activeContentColor : contentColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* Animated dots - Accent color */}
        {dots.map((dot) => (
          <circle key={dot.id} cx={dot.x} cy={dot.y} r="3" fill={accentDot} filter="url(#glow-accent)" />
        ))}
      </svg>
    </div>
  );
}
