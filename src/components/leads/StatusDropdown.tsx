"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from "@/lib/validations/leads";
import { LostReasonPicker } from "./LostReasonPicker";

export function StatusDropdown({
  currentStatus,
  onSelect,
}: {
  currentStatus: string;
  onSelect: (status: string, extra?: { lost_reason?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${LEAD_STATUS_STYLES[currentStatus]}`}
      >
        {LEAD_STATUSES.find((s) => s.value === currentStatus)?.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] shadow-black/[0.08] py-1 min-w-[120px]">
            {LEAD_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setOpen(false);
                  if (s.value === "lost") {
                    setLostOpen(true);
                  } else {
                    onSelect(s.value);
                  }
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-surface-alt)] transition-colors ${currentStatus === s.value ? "font-semibold" : ""}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${LEAD_STATUS_STYLES[s.value]?.split(" ")[0]}`}
                />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
      <LostReasonPicker
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        onPick={(lost_reason) => {
          setLostOpen(false);
          onSelect("lost", { lost_reason });
        }}
      />
    </div>
  );
}
