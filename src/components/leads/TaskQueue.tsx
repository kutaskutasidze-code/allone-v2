'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Trash2,
  CalendarClock,
  ExternalLink,
  AlertCircle,
  X,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_DUE_PRESETS, fmtLocalInputValue } from './AddTaskSheet';

interface Task {
  id: string;
  lead_id: string;
  title: string;
  due_at: string | null;
  status: string;
  notes: string | null;
}

type Scope = 'due' | 'overdue' | 'open' | 'all';

interface Props {
  scope?: Scope;
  leadId?: string;
}

const TABS: { value: Scope; label: string }[] = [
  { value: 'due', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'all', label: 'All' },
];

function fmtDue(iso: string | null) {
  if (!iso) return 'No due date';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ReschedulePicker({
  onCancel,
  onPick,
  busy,
}: {
  onCancel: () => void;
  onPick: (iso: string) => void;
  busy: boolean;
}) {
  const [customValue, setCustomValue] = useState(() =>
    fmtLocalInputValue(new Date(Date.now() + 3600_000)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-t-2xl sm:rounded-[var(--radius-lg)] shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Reschedule</h2>
          <button onClick={onCancel} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-4">When should this follow-up be due?</p>

        <div className="space-y-2 mb-5">
          {TASK_DUE_PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                disabled={busy}
                onClick={() => onPick(p.get())}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm text-[var(--ink-800)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all disabled:opacity-50"
              >
                <Icon className="w-4 h-4 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--allone-line-soft)] pt-4">
          <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Or pick a custom time</label>
          <input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
          />
          <button
            disabled={busy}
            onClick={() => {
              if (!customValue) return;
              onPick(new Date(customValue).toISOString());
            }}
            className="w-full mt-3 py-3 bg-[var(--ink-900)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--ink-800)] transition-all disabled:opacity-50"
          >
            Save new time
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskQueue({ scope = 'due', leadId }: Props) {
  const [activeScope, setActiveScope] = useState<Scope>(scope);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ scope: activeScope });
      if (leadId) params.set('lead_id', leadId);
      const res = await fetch(`/api/sales/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      setTasks(json.data || []);
    } catch {
      setError('Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  }, [activeScope, leadId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const complete = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/sales/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchTasks();
    } catch {
      setError('Could not complete task');
    } finally {
      setBusyId(null);
    }
  };

  const reschedule = async (id: string, dueISO: string) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/sales/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_at: dueISO }),
      });
      if (!res.ok) throw new Error('Failed');
      setRescheduleId(null);
      await fetchTasks();
    } catch {
      setError('Could not reschedule task');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this follow-up?')) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/sales/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await fetchTasks();
    } catch {
      setError('Could not delete task');
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-4">
      {/* Segmented control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)]">
        {TABS.map((t) => {
          const active = activeScope === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActiveScope(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all',
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--ink-900)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-alt)] flex items-center justify-center">
            <ListTodo className="w-7 h-7 text-[var(--ink-400)]" />
          </div>
          <p className="text-sm font-medium text-[var(--ink-900)]">No follow-ups here</p>
          <p className="text-xs text-[var(--ink-500)] max-w-xs">
            {activeScope === 'overdue'
              ? "Nothing is overdue. Nice work."
              : "You're all caught up."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
          {tasks.map((task, idx) => {
            const overdue =
              task.status === 'open' && task.due_at !== null && new Date(task.due_at).getTime() < now;
            const rowBusy = busyId === task.id;
            return (
              <div
                key={task.id}
                className={cn(
                  'group p-4 transition-colors hover:bg-[var(--bg-surface-alt)]',
                  idx > 0 && 'border-t border-[var(--allone-line-soft)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">{task.title}</h3>
                      {task.status === 'done' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          overdue ? 'text-red-500 font-medium' : 'text-[var(--ink-500)]',
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {fmtDue(task.due_at)}
                        {overdue && ' · overdue'}
                      </span>
                      {task.lead_id && (
                        <Link
                          href={`/sales/leads?lead=${task.lead_id}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View lead
                        </Link>
                      )}
                    </div>
                    {task.notes && (
                      <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
                        {task.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {task.status !== 'done' && (
                      <button
                        onClick={() => complete(task.id)}
                        disabled={rowBusy}
                        className="p-1.5 rounded hover:bg-emerald-50 text-[var(--ink-400)] hover:text-emerald-600 transition-colors disabled:opacity-40"
                        title="Complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setRescheduleId(task.id)}
                      disabled={rowBusy}
                      className="p-1.5 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors disabled:opacity-40"
                      title="Reschedule"
                    >
                      <CalendarClock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(task.id)}
                      disabled={rowBusy}
                      className="p-1.5 rounded hover:bg-red-50 text-[var(--ink-400)] hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rescheduleId && (
        <ReschedulePicker
          busy={busyId === rescheduleId}
          onCancel={() => setRescheduleId(null)}
          onPick={(iso) => reschedule(rescheduleId, iso)}
        />
      )}
    </div>
  );
}
