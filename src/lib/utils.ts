import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatCallbackLabel(iso: string): { label: string; tone: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' } {
  const target = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const dayDiff = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86400000);
  const time = target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (target.getTime() < now.getTime()) {
    const hoursLate = Math.floor((now.getTime() - target.getTime()) / 3600000);
    if (hoursLate < 24) return { label: `Overdue (${hoursLate}h)`, tone: 'overdue' };
    return { label: `${Math.floor(hoursLate / 24)}d overdue`, tone: 'overdue' };
  }
  if (dayDiff === 0) return { label: `Today ${time}`, tone: 'today' };
  if (dayDiff === 1) return { label: `Tomorrow ${time}`, tone: 'tomorrow' };
  if (dayDiff <= 7) return { label: `In ${dayDiff}d`, tone: 'soon' };
  const dateLabel = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: dateLabel, tone: 'later' };
}
