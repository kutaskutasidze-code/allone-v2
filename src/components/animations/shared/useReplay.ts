import { useState, useCallback } from 'react';

export function useReplay(): { key: number; replay: () => void } {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);
  return { key, replay };
}
