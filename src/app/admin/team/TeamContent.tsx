'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Users, UserPlus, MoreVertical, X, Check, Power, AlertCircle, Tag, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LEAD_INDUSTRIES } from '@/lib/validations/leads';

interface RepStats {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  dailyTarget: number;
  industries: string[];
  assignedInPeriod: number;
  calledInPeriod: number;
  wonCount: number;
  wonRevenue: number;
  pipelineValue: number;
  conversionRate: number;
  commission: number;
}

interface TeamData {
  period: { start: string; end: string; label: string };
  reps: RepStats[];
  totals: {
    activeReps: number;
    assignedInPeriod: number;
    calledInPeriod: number;
    wonCount: number;
    wonRevenue: number;
    pipelineValue: number;
    totalCommission: number;
  };
}

const PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'all', label: 'All Time' },
];

const ROLES = [
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
];

const roleBadge: Record<string, string> = {
  salesperson: 'bg-gray-100 text-gray-700',
  supervisor: 'bg-blue-50 text-blue-700',
  admin: 'bg-purple-50 text-purple-700',
};

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function InlineNumberEdit({ value, onSave, suffix }: { value: number; onSave: (n: number) => Promise<void>; suffix?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  const commit = async () => {
    const n = parseInt(draft, 10);
    if (isNaN(n) || n < 0 || n > 10000 || n === value) {
      setDraft(String(value));
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(n);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        min={0}
        max={10000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        disabled={saving}
        className="w-16 px-2 py-0.5 text-right text-sm rounded border border-gray-300 focus:border-gray-900 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="px-2 py-0.5 rounded hover:bg-gray-100 text-gray-700 transition-colors tabular-nums"
      title="Click to edit"
    >
      {value}{suffix}
    </button>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  return (
    <select
      value={value}
      disabled={saving}
      onChange={async (e) => {
        const next = e.target.value;
        if (next === value) return;
        setSaving(true);
        try { await onChange(next); } finally { setSaving(false); }
      }}
      className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer border-0 focus:outline-none focus:ring-1 focus:ring-gray-400 ${roleBadge[value] || 'bg-gray-100 text-gray-700'}`}
    >
      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  );
}

function AddRepModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'salesperson', daily_target: 80 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onEsc); };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sales-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rep');
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add sales rep</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Creates a sales_users row. The rep also needs a Supabase Auth account with this email to log in.
        </p>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={input} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value.toLowerCase().trim() })} required className={input} placeholder="rep@allonelabs.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={input}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Daily target</label>
              <input type="number" min={0} max={10000} value={form.daily_target} onChange={e => setForm({ ...form, daily_target: parseInt(e.target.value) || 0 })} className={input} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add rep'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IndustriesCell({ rep, onSave }: { rep: RepStats; onSave: (industries: string[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set(rep.industries));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(new Set(rep.industries)); }, [rep.industries, open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = (ind: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind); else next.add(ind);
      return next;
    });
  };

  const commit = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(draft).sort());
      setOpen(false);
    } finally { setSaving(false); }
  };

  const filtered = LEAD_INDUSTRIES.filter(i => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 max-w-[260px] text-left hover:bg-gray-100 rounded px-1.5 py-0.5 transition-colors"
        title="Click to edit industries this rep covers"
      >
        {rep.industries.length === 0 ? (
          <span className="text-[11px] text-gray-400">— set industries</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {rep.industries.slice(0, 3).map(i => (
              <span key={i} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-sky-50 text-sky-700">{i}</span>
            ))}
            {rep.industries.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">+{rep.industries.length - 3}</span>
            )}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Industries for {rep.name}</span>
            <span className="text-[11px] text-gray-500">{draft.size} selected</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-gray-200 focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mb-2 text-[11px]">
            <button onClick={() => setDraft(new Set(LEAD_INDUSTRIES))} className="text-sky-700 hover:underline">Select all</button>
            <span className="text-gray-300">·</span>
            <button onClick={() => setDraft(new Set())} className="text-gray-500 hover:underline">Clear</button>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 max-h-56 overflow-y-auto mb-3">
            {filtered.map(ind => {
              const checked = draft.has(ind);
              return (
                <label key={ind} className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-gray-50 cursor-pointer text-[11px]">
                  <input type="checkbox" checked={checked} onChange={() => toggle(ind)} className="rounded border-gray-300" />
                  <span className={checked ? 'text-gray-900' : 'text-gray-600'}>{ind}</span>
                </label>
              );
            })}
            {filtered.length === 0 && <span className="col-span-2 text-[11px] text-gray-400 italic px-2 py-2">No matches</span>}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
            <button onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">Cancel</button>
            <button
              onClick={commit}
              disabled={saving}
              className="px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({ rep, onChanged }: { rep: RepStats; onChanged: () => void }) {
  const [open, setOpen] = useState(false);

  const toggleActive = async () => {
    setOpen(false);
    const verb = rep.isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${verb} ${rep.name}? ${rep.isActive ? 'They will be hidden from assignment + scorecard until reactivated. Their leads remain intact.' : ''}`)) return;
    const res = await fetch(`/api/admin/sales-users/${rep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rep.isActive }),
    });
    if (res.ok) onChanged();
  };

  const renameRep = async () => {
    setOpen(false);
    const next = prompt('New name', rep.name);
    if (!next || next === rep.name) return;
    const res = await fetch(`/api/admin/sales-users/${rep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: next.trim() }),
    });
    if (res.ok) onChanged();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
            <button onClick={renameRep} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700">
              Rename
            </button>
            <button onClick={toggleActive} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 inline-flex items-center gap-2">
              <Power className="w-3.5 h-3.5" />
              {rep.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TeamContent() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/team?period=${period}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json.data);
    } catch {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const patchRep = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/sales-users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">Team</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sales reps · performance · management</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add rep
        </button>
      </div>

      {/* Period picker */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === p.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="text-xs text-red-700 underline">Retry</button>
        </div>
      )}

      {/* KPI strip */}
      {data && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <KpiCard label="Active reps" value={String(data.totals.activeReps)} sub={`${data.totals.assignedInPeriod} leads assigned`} />
          <KpiCard label="Calls (period)" value={String(data.totals.calledInPeriod)} sub={`${data.totals.wonCount} won`} />
          <KpiCard label="Revenue" value={formatCurrency(data.totals.wonRevenue)} sub={`${formatCurrency(data.totals.pipelineValue)} in pipeline`} />
          <KpiCard label="Commission owed" value={formatCurrency(data.totals.totalCommission)} sub="across active reps" />
        </div>
      )}

      {/* Team table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Rep</th>
              <th className="text-left px-3 py-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Industries
                </span>
              </th>
              <th className="text-right px-3 py-3 font-medium">Target</th>
              <th className="text-right px-3 py-3 font-medium">Assigned</th>
              <th className="text-right px-3 py-3 font-medium">Calls</th>
              <th className="text-right px-3 py-3 font-medium">Won</th>
              <th className="text-right px-3 py-3 font-medium">Conv%</th>
              <th className="text-right px-3 py-3 font-medium">Pipeline</th>
              <th className="text-right px-3 py-3 font-medium">Revenue</th>
              <th className="text-right px-3 py-3 font-medium">Commission</th>
              <th className="w-10 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-xs text-gray-400">Loading…</td></tr>
            ) : !data || data.reps.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center">
                  <Users className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No sales reps yet.</p>
                  <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-gray-700 underline">Add your first rep</button>
                </td>
              </tr>
            ) : (
              data.reps.map(rep => (
                <tr key={rep.id} className={`border-t border-gray-50 ${!rep.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{rep.name}</span>
                      <RoleSelect value={rep.role} onChange={(v) => patchRep(rep.id, { role: v })} />
                      {!rep.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">inactive</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{rep.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    <IndustriesCell rep={rep} onSave={(industries) => patchRep(rep.id, { industries })} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <InlineNumberEdit value={rep.dailyTarget} onSave={(n) => patchRep(rep.id, { daily_target: n })} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700">{rep.assignedInPeriod}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700">{rep.calledInPeriod}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className={`inline-flex items-center gap-1 ${rep.wonCount > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {rep.wonCount > 0 && <Check className="w-3 h-3" />}
                      {rep.wonCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                    {rep.calledInPeriod > 0 ? `${(rep.conversionRate * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600">{formatCurrency(rep.pipelineValue)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-900 font-medium">{formatCurrency(rep.wonRevenue)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-700 font-medium">{formatCurrency(rep.commission)}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActions rep={rep} onChanged={load} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddRepModal onClose={() => setShowAdd(false)} onCreated={load} />}
    </div>
  );
}
