'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm bg-white rounded-xl border border-[var(--gray-200)] mx-4"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-base font-medium text-[var(--black)]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[var(--gray-400)] hover:text-[var(--black)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-[var(--gray-500)]">{message}</p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--gray-100)]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--black)] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--black)] hover:bg-[var(--gray-800)]'
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
