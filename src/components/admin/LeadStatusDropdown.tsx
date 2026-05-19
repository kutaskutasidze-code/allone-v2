'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from '@/lib/validations/leads';

type StatusUpdate = { status: string; callback_date?: string | null };

interface LeadStatusDropdownProps {
  leadId: string;
  currentStatus: string;
  currentCallbackDate?: string | null;
  onUpdate: (id: string, updates: StatusUpdate) => void;
}

function defaultCallbackLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeadStatusDropdown({ leadId, currentStatus, currentCallbackDate, onUpdate }: LeadStatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [dateValue, setDateValue] = useState(() =>
    currentCallbackDate ? toLocalInputValue(currentCallbackDate) : defaultCallbackLocal()
  );

  const close = () => {
    setOpen(false);
    setPickingDate(false);
  };

  const handleStatusClick = (status: string) => {
    if (status === 'callback') {
      setPickingDate(true);
      return;
    }
    onUpdate(leadId, { status, callback_date: null });
    close();
  };

  const handleSaveCallback = () => {
    if (!dateValue) return;
    onUpdate(leadId, { status: 'callback', callback_date: new Date(dateValue).toISOString() });
    close();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${LEAD_STATUS_STYLES[currentStatus]}`}
      >
        {LEAD_STATUSES.find(s => s.value === currentStatus)?.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg shadow-black/[0.08] py-1 min-w-[180px]">
            {pickingDate ? (
              <div className="px-3 py-2 w-[240px]">
                <p className="text-xs font-medium text-gray-700 mb-2">Schedule callback</p>
                <input
                  type="datetime-local"
                  value={dateValue}
                  onChange={e => setDateValue(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:border-gray-400 focus:outline-none"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setPickingDate(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900"
                  >Cancel</button>
                  <button
                    onClick={handleSaveCallback}
                    className="px-2.5 py-1 text-xs rounded-md bg-gray-900 text-white hover:bg-gray-800"
                  >Save</button>
                </div>
              </div>
            ) : (
              LEAD_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusClick(s.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${currentStatus === s.value ? 'font-semibold' : ''}`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${LEAD_STATUS_STYLES[s.value]?.split(' ')[0]}`} />
                  {s.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
