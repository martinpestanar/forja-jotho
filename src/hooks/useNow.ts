'use client';

import { useEffect, useState } from 'react';

export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}

export function formatElapsed(startedAt: string, now: Date | null): string {
  if (!now) return '00:00';
  const diff = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
