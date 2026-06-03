"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

interface LeadNotesProps {
  leadId: string;
  initialNotes: string;
  onSave: (id: string, notes: string) => void;
}

export function LeadNotes({ leadId, initialNotes, onSave }: LeadNotesProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    if (notes !== initialNotes) {
      onSave(leadId, notes);
      setSaved(true);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors"
        title="Notes"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="col-span-full overflow-hidden"
          >
            <div className="px-4 py-3 bg-[var(--bg-surface-alt)] border-t border-[var(--allone-line-soft)]">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                onBlur={handleSave}
                placeholder="Add notes about this lead..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSave();
                    setOpen(false);
                  }}
                  className={`px-3 py-1 text-xs rounded-[var(--radius-xs)] ${saved ? "bg-[var(--bg-sunken)] text-[var(--ink-500)]" : "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-800)]"}`}
                >
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
