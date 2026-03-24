export interface LogoPath {
  id: string;
  d: string;
  type: 'arm' | 'connector';
  direction: 'top' | 'right' | 'bottom' | 'left';
  // Center point of this piece (for transform-origin)
  cx: number;
  cy: number;
}

export const LOGO_PATHS: LogoPath[] = [
  {
    id: 'arm-top',
    d: 'M92 16 C96 8 104 8 108 16 L120 52 C122 56 120 60 116 62 L108 66 C104 68 100 66 100 62 L100 62 C100 66 96 68 92 66 L84 62 C80 60 78 56 80 52 Z',
    type: 'arm',
    direction: 'top',
    cx: 100,
    cy: 40,
  },
  {
    id: 'arm-right',
    d: 'M184 92 C192 96 192 104 184 108 L148 120 C144 122 140 120 138 116 L134 108 C132 104 134 100 138 100 L138 100 C134 100 132 96 134 92 L138 84 C140 80 144 78 148 80 Z',
    type: 'arm',
    direction: 'right',
    cx: 160,
    cy: 100,
  },
  {
    id: 'arm-bottom',
    d: 'M108 184 C104 192 96 192 92 184 L80 148 C78 144 80 140 84 138 L92 134 C96 132 100 134 100 138 L100 138 C100 134 104 132 108 134 L116 138 C120 140 122 144 120 148 Z',
    type: 'arm',
    direction: 'bottom',
    cx: 100,
    cy: 160,
  },
  {
    id: 'arm-left',
    d: 'M16 108 C8 104 8 96 16 92 L52 80 C56 78 60 80 62 84 L66 92 C68 96 66 100 62 100 L62 100 C66 100 68 104 66 108 L62 116 C60 120 56 122 52 120 Z',
    type: 'arm',
    direction: 'left',
    cx: 40,
    cy: 100,
  },
  {
    id: 'conn-top',
    d: 'M86 58 Q92 52 100 58 L108 66 Q104 72 100 72 Q96 72 92 66 Z',
    type: 'connector',
    direction: 'top',
    cx: 100,
    cy: 64,
  },
  {
    id: 'conn-bottom',
    d: 'M92 134 Q96 128 100 128 Q104 128 108 134 L114 142 Q108 148 100 142 Z',
    type: 'connector',
    direction: 'bottom',
    cx: 100,
    cy: 136,
  },
  {
    id: 'conn-right',
    d: 'M134 92 Q128 96 128 100 Q128 104 134 108 L142 114 Q148 108 142 100 Z',
    type: 'connector',
    direction: 'right',
    cx: 136,
    cy: 100,
  },
  {
    id: 'conn-left',
    d: 'M66 92 Q72 96 72 100 Q72 104 66 108 L58 114 Q52 108 58 100 Z',
    type: 'connector',
    direction: 'left',
    cx: 64,
    cy: 100,
  },
];

export const LOGO_COLOR = '#2B8AFF';
export const LOGO_VIEWBOX = '0 0 200 200';

// Pre-computed scatter offsets for each piece (used by ScatteredAssembly)
export function getScatterOffset(path: LogoPath): { x: number; y: number; rotate: number } {
  const dist = path.type === 'arm' ? 200 : 100;
  const rotBase = path.type === 'arm' ? 60 : 40;
  const directions: Record<string, { x: number; y: number }> = {
    top: { x: 0, y: -dist },
    right: { x: dist, y: 0 },
    bottom: { x: 0, y: dist },
    left: { x: -dist, y: 0 },
  };
  const dir = directions[path.direction];
  // Add some randomness via hash of id
  const hash = path.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitterX = ((hash * 17) % 60) - 30;
  const jitterY = ((hash * 31) % 60) - 30;
  const rotate = ((hash * 13) % (rotBase * 2)) - rotBase;
  return { x: dir.x + jitterX, y: dir.y + jitterY, rotate };
}
