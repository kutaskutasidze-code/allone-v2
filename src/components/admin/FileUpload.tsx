'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, FileText, Loader2, ExternalLink } from 'lucide-react';

interface FileUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  accept?: string;
  hint?: string;
}

export function FileUpload({
  label,
  value,
  onChange,
  bucket = 'documents',
  accept = '.pdf,.doc,.docx',
  hint,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

      if (filePath) {
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      console.error('Error removing file:', err);
    }

    onChange(null);
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return 'Uploaded file';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
        {label}
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gray-200)] bg-white">
          <FileText className="h-5 w-5 text-[var(--gray-500)] flex-shrink-0" />
          <span className="flex-1 text-sm text-[var(--gray-700)] truncate">
            {getFileName(value)}
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors"
            title="Open file"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-[var(--gray-500)] hover:text-red-600 transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[var(--gray-300)] bg-white cursor-pointer hover:border-[var(--gray-400)] hover:bg-[var(--gray-100)] transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-[var(--gray-500)] animate-spin" />
              <span className="text-sm text-[var(--gray-600)]">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-[var(--gray-500)]" />
              <span className="text-sm text-[var(--gray-600)]">
                Click to upload
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {hint && !error && (
        <p className="mt-1.5 text-xs text-[var(--gray-500)]">{hint}</p>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
