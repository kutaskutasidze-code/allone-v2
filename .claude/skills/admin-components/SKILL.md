---
name: admin-components
description: Patterns for building admin UI components in the Allone project. Use when creating admin forms, tables, dialogs, or navigation. Includes Tailwind CSS patterns, lucide-react icons, and cn utility usage.
---

# Admin Components Guide

## File Locations

- Admin components: `src/components/admin/`
- Admin pages: `src/app/admin/`
- Utility functions: `src/lib/utils.ts`

## Core Imports

```typescript
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// Icons from lucide-react
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Briefcase,
  Users,
  BarChart3,
  Heart,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
} from 'lucide-react';
```

## Design System

### Colors (CSS Variables)

```css
/* Grays */
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-600: #4b5563;

/* Primary */
bg-black text-white  /* Active/primary state */
```

### Common Class Patterns

```typescript
// Card/Container
"rounded-lg border border-[var(--gray-200)] bg-white p-6"

// Button - Primary
"rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"

// Button - Secondary
"rounded-lg border border-[var(--gray-200)] px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors"

// Button - Danger
"rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"

// Input
"w-full rounded-lg border border-[var(--gray-200)] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"

// Label
"block text-sm font-medium text-[var(--gray-600)] mb-1"

// Navigation item (inactive)
"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] hover:text-black transition-all"

// Navigation item (active)
"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-black text-white"
```

## Component Patterns

### Page Layout

```typescript
export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Title</h1>
          <p className="text-[var(--gray-500)]">Page description</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4" />
          Add New
        </button>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-[var(--gray-200)] bg-white">
        {/* ... */}
      </div>
    </div>
  );
}
```

### Form Structure

```typescript
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-[var(--gray-600)] mb-1">
      Field Label
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full rounded-lg border border-[var(--gray-200)] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      required
    />
  </div>

  {/* Textarea */}
  <div>
    <label className="block text-sm font-medium text-[var(--gray-600)] mb-1">
      Description
    </label>
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      rows={4}
      className="w-full rounded-lg border border-[var(--gray-200)] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
    />
  </div>

  {/* Toggle/Checkbox */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={isPublished}
      onChange={(e) => setIsPublished(e.target.checked)}
      className="h-4 w-4 rounded border-[var(--gray-200)]"
    />
    <label className="text-sm text-[var(--gray-600)]">Published</label>
  </div>

  {/* Actions */}
  <div className="flex gap-3 pt-4">
    <button
      type="submit"
      className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
    >
      <Save className="h-4 w-4" />
      Save
    </button>
    <button
      type="button"
      onClick={onCancel}
      className="rounded-lg border border-[var(--gray-200)] px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors"
    >
      Cancel
    </button>
  </div>
</form>
```

### Table Structure

```typescript
<div className="overflow-hidden rounded-lg border border-[var(--gray-200)]">
  <table className="w-full">
    <thead className="bg-[var(--gray-100)]">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--gray-600)]">
          Name
        </th>
        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--gray-600)]">
          Status
        </th>
        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--gray-600)]">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[var(--gray-200)]">
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-[var(--gray-50)]">
          <td className="px-4 py-3 text-sm">{item.name}</td>
          <td className="px-4 py-3">
            <span className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              item.is_published
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            )}>
              {item.is_published ? 'Published' : 'Draft'}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-2">
              <button className="p-1 text-[var(--gray-500)] hover:text-black">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-1 text-[var(--gray-500)] hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Loading States

### Loading Button

```typescript
import { Loader2 } from 'lucide-react';

<button
  type="submit"
  disabled={isLoading}
  className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="h-4 w-4" />
      Save
    </>
  )}
</button>
```

### Page Loading Skeleton

```typescript
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--gray-200)]">
      <div className="bg-[var(--gray-100)] px-4 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-[var(--gray-200)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Full Page Loading

```typescript
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
```

---

## Error States

### Error Message

```typescript
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm text-red-600">{message}</p>
      </div>
    </div>
  );
}
```

### Empty State

```typescript
import { FileX } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileX className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Usage
<EmptyState
  title="No projects yet"
  description="Get started by creating your first project."
  action={
    <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
      <Plus className="h-4 w-4" />
      Add Project
    </button>
  }
/>
```

---

## Toast Notifications

### Toast Hook

```typescript
// hooks/useToast.ts
'use client';

import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
    removeToast,
  };
}
```

### Toast Component

```typescript
// components/admin/Toast.tsx
'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const styles = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
      styles[type]
    )}>
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ToastContainer - add to layout
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
```

---

## Modal Dialog

```typescript
// components/admin/Modal.tsx
'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative bg-white rounded-lg shadow-xl w-full mx-4',
        sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// Usage
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Project">
  <form onSubmit={handleSubmit}>
    {/* form fields */}
  </form>
</Modal>
```

---

## Pagination

```typescript
// components/admin/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--gray-200)]">
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'px-3 py-1 text-sm rounded',
              page === currentPage
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

---

## Search & Filter

```typescript
// components/admin/SearchFilter.tsx
import { Search, Filter, X } from 'lucide-react';

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
}

export function SearchFilter({
  search,
  onSearchChange,
  filters,
}: SearchFilterProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--gray-200)] text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters?.map((filter, index) => (
        <select
          key={index}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--gray-200)] text-sm focus:border-black focus:outline-none"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

// Usage
<SearchFilter
  search={search}
  onSearchChange={setSearch}
  filters={[
    {
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
      ],
    },
  ]}
/>
```

---

## Existing Components

### ArrayInput
Location: `src/components/admin/ArrayInput.tsx`
For managing array fields (technologies, features, paragraphs)

### ConfirmDialog
Location: `src/components/admin/ConfirmDialog.tsx`
For delete confirmations

### AdminSidebar
Location: `src/components/admin/AdminSidebar.tsx`
Main navigation sidebar

---

## Icons Reference

Common icons from `lucide-react`:
- Navigation: `LayoutDashboard`, `FolderKanban`, `Settings`, `Briefcase`
- Actions: `Plus`, `Edit`, `Trash2`, `Save`, `X`, `LogOut`
- Content: `Users`, `BarChart3`, `Heart`, `FileText`
- Arrows: `ChevronLeft`, `ChevronRight`, `ArrowUp`, `ArrowDown`
- States: `Loader2`, `AlertCircle`, `CheckCircle`, `XCircle`, `Info`
- UI: `Search`, `Filter`, `FileX`
