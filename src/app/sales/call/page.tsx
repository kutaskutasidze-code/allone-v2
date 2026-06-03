'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Globe,
  MapPin,
  Building2,
  Mail,
  ExternalLink,
  MessageSquare,
  CalendarClock,
} from 'lucide-react';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, LEAD_STATUS_COLORS, INFOSHOP_PATTERN } from '@/lib/validations/leads';
import { LogCallSheet, AddTaskSheet, LostReasonPicker } from '@/components/leads';

interface Lead {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  city: string | null;
  industry: string | null;
  status: string;
  notes: string | null;
}

// Order matters — these are the buttons shown after a call, in the order a
// rep is likely to want them. "In Process" lives on its own because it's the
// "default success" outcome and gets prime real estate.
const POST_CALL_STATUSES = [
  { value: 'in_process', label: 'In Process', emoji: '✓' },
  { value: 'interested', label: 'Interested' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
] as const;

function CallModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIndex = Math.max(0, parseInt(searchParams.get('i') || '0', 10) || 0);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [index, setIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ scope: 'today', limit: '200' });
    fetch(`/api/sales/leads?${params.toString()}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(json => { if (active) setLeads(json.data || []); })
      .catch(() => { if (active) setError('Failed to load your queue'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const current = leads[index];

  // Keep the URL in sync so the index survives a refresh.
  useEffect(() => {
    if (current) {
      const url = new URL(window.location.href);
      url.searchParams.set('i', String(index));
      window.history.replaceState({}, '', url.toString());
    }
  }, [index, current]);

  useEffect(() => {
    if (current) setNotesDraft(current.notes || '');
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = useMemo(() => leads.filter(l => l.status === 'new').length, [leads]);
  const done = leads.length - remaining;

  const update = useCallback(async (id: string, patch: Partial<Lead>) => {
    const res = await fetch(`/api/sales/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Update failed');
    const json = await res.json();
    return json.data as Lead;
  }, []);

  const advance = useCallback(() => {
    setIndex(i => Math.min(i + 1, leads.length - 1));
  }, [leads.length]);

  const [logCallOpen, setLogCallOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);

  const persistStatus = async (status: string, extra?: { lost_reason?: string }) => {
    if (!current) return;
    setBusy(true);
    setError('');
    try {
      const updated = await update(current.id, { status, ...extra } as Partial<Lead>);
      setLeads(prev => prev.map(l => l.id === current.id ? { ...l, ...updated } : l));
      const nextIdx = leads.findIndex((l, i) => i > index && l.status === 'new');
      if (nextIdx >= 0) setIndex(nextIdx);
      else advance();
    } catch {
      setError('Could not save status');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: string) => {
    if (status === 'lost') {
      setLostOpen(true);
      return;
    }
    await persistStatus(status);
  };

  const saveNotes = async () => {
    if (!current) return;
    if (notesDraft === (current.notes || '')) { setNotesOpen(false); return; }
    setBusy(true);
    try {
      const updated = await update(current.id, { notes: notesDraft } as Partial<Lead>);
      setLeads(prev => prev.map(l => l.id === current.id ? { ...l, ...updated } : l));
      setNotesOpen(false);
    } catch {
      setError('Could not save notes');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--ink-900)]">No queue today</h1>
        <p className="text-sm text-[var(--ink-500)] max-w-sm">No leads have been assigned to you today yet. Ask your admin to assign some, or check back later.</p>
        <Link href="/sales" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ink-900)] hover:text-[var(--ink-700)]">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--ink-900)]">Queue cleared</h1>
        <p className="text-sm text-[var(--ink-500)]">You've worked through all {leads.length} leads today. Nice work.</p>
        <Link href="/sales" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ink-900)] hover:text-[var(--ink-700)]">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col -mx-5 lg:mx-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 lg:px-0 py-3 border-b border-[var(--allone-line-soft)] bg-[var(--bg-surface)]">
        <button
          onClick={() => router.push('/sales')}
          className="inline-flex items-center gap-1 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>
        <div className="text-center">
          <div className="text-xs text-[var(--ink-500)]">Lead {index + 1} of {leads.length}</div>
          <div className="text-[11px] text-[var(--ink-400)]">{done} done · {remaining} left</div>
        </div>
        <div className="text-xs text-[var(--ink-500)] tabular-nums">{Math.round((done / leads.length) * 100)}%</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-sunken)]">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(done / leads.length) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mx-5 lg:mx-0 mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Lead card — one at a time, dominated by the Call button */}
      <div className="flex-1 px-5 lg:px-0 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="max-w-md mx-auto"
          >
            {/* Status badge */}
            <div className="flex items-center justify-center mb-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${LEAD_STATUS_STYLES[current.status]}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAD_STATUS_COLORS[current.status] }} />
                {LEAD_STATUSES.find(s => s.value === current.status)?.label}
              </span>
            </div>

            {/* Name / company */}
            <h2 className="text-2xl font-semibold text-center text-[var(--ink-900)] mb-1">
              {current.company || current.name}
            </h2>
            {current.company && current.name && (
              <p className="text-sm text-center text-[var(--ink-500)] mb-4">{current.name}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs text-[var(--ink-500)]">
              {current.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{current.city}</span>}
              {current.industry && <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{current.industry}</span>}
              {current.website && !INFOSHOP_PATTERN.test(current.website) ? (
                <a href={current.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:underline">
                  <Globe className="w-3 h-3" />Has website
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-400"><Globe className="w-3 h-3" />No website</span>
              )}
            </div>

            {/* Big Call button — the whole point of this screen */}
            {current.phone ? (
              <a
                href={`tel:${current.phone}`}
                className="block w-full mb-3 py-5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all rounded-[var(--radius-lg)] text-white text-center"
              >
                <div className="flex items-center justify-center gap-3">
                  <Phone className="w-6 h-6" />
                  <div>
                    <div className="text-xl font-semibold">Call {current.phone}</div>
                    <div className="text-xs text-white/80">tap to dial</div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="w-full mb-3 py-5 bg-[var(--bg-sunken)] rounded-[var(--radius-lg)] text-center text-[var(--ink-400)] text-sm">
                No phone number on file
              </div>
            )}

            {/* Log the dial as a real call record */}
            <button
              onClick={() => setLogCallOpen(true)}
              className="w-full mb-3 flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--ink-700)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all"
            >
              <Phone className="w-4 h-4" />
              Log call
            </button>

            {/* Schedule a follow-up task for this lead */}
            <button
              onClick={() => setFollowUpOpen(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--ink-700)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all"
            >
              <CalendarClock className="w-4 h-4" />
              Schedule follow-up
            </button>

            {/* Secondary contact actions */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {current.email && (
                <a
                  href={`mailto:${current.email}`}
                  className="flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]"
                >
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              {current.facebook_url && (
                <a
                  href={current.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]"
                >
                  <ExternalLink className="w-4 h-4" /> Facebook
                </a>
              )}
            </div>

            {/* Status buttons */}
            <div className="space-y-2 mb-6">
              <p className="text-[11px] uppercase tracking-wider text-[var(--ink-400)] mb-1">After the call</p>
              {POST_CALL_STATUSES.map(s => {
                const active = current.status === s.value;
                return (
                  <button
                    key={s.value}
                    disabled={busy}
                    onClick={() => setStatus(s.value)}
                    className={`w-full py-3.5 rounded-[var(--radius-md)] text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
                      active
                        ? 'bg-[var(--ink-900)] text-white'
                        : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Notes */}
            <div className="mb-6">
              {!notesOpen ? (
                <button
                  onClick={() => setNotesOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] border border-dashed border-[var(--allone-line-strong)] rounded-[var(--radius-md)] text-sm text-[var(--ink-500)] hover:border-gray-400"
                >
                  <MessageSquare className="w-4 h-4" />
                  {current.notes ? 'Edit notes' : 'Add notes'}
                </button>
              ) : (
                <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] p-3">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder="What was discussed? Any next steps?"
                    className="w-full px-3 py-2 text-sm border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setNotesDraft(current.notes || ''); setNotesOpen(false); }} className="px-3 py-1.5 text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]">Cancel</button>
                    <button
                      onClick={saveNotes}
                      disabled={busy}
                      className="px-3 py-1.5 text-xs bg-[var(--ink-900)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
              {current.notes && !notesOpen && (
                <p className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
                  {current.notes}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Log a call record for the current lead */}
      <LogCallSheet
        leadId={current.id}
        open={logCallOpen}
        onClose={() => setLogCallOpen(false)}
      />

      {/* Schedule a follow-up task for the current lead */}
      <AddTaskSheet
        leadId={current.id}
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        onAdded={advance}
      />

      {/* Lost-reason prompt before marking the current lead lost */}
      <LostReasonPicker
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        onPick={(lost_reason) => {
          setLostOpen(false);
          persistStatus('lost', { lost_reason });
        }}
      />

      {/* Bottom nav */}
      <div className="px-5 lg:px-0 py-3 border-t border-[var(--allone-line-soft)] bg-[var(--bg-surface)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex-1 py-3 rounded-[var(--radius-md)] border border-[var(--allone-line)] text-[var(--ink-700)] text-sm font-medium hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 inline-flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={advance}
            disabled={index >= leads.length - 1}
            className="flex-1 py-3 rounded-[var(--radius-md)] bg-[var(--ink-900)] text-white text-sm font-medium hover:bg-[var(--ink-800)] disabled:opacity-30 inline-flex items-center justify-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CallModePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <CallModeContent />
    </Suspense>
  );
}
