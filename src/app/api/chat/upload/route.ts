import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_EXTRACTED_CHARS = 8000; // Limit extracted text to avoid token overflow

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/png',
  'image/jpeg',
]);

// Also check by extension for types that browsers may not set correctly
function isAllowedFile(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['pdf', 'docx', 'txt', 'csv', 'md', 'png', 'jpg', 'jpeg'].includes(ext || '');
}

async function extractText(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Images - no text extraction
  if (['png', 'jpg', 'jpeg'].includes(ext || '') || file.type.startsWith('image/')) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();

  // PDF
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.slice(0, MAX_EXTRACTED_CHARS);
  }

  const buffer = Buffer.from(arrayBuffer);

  // DOCX
  if (ext === 'docx' || file.type.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, MAX_EXTRACTED_CHARS);
  }

  // Plain text types (txt, csv, md)
  const text = await file.text();
  return text.slice(0, MAX_EXTRACTED_CHARS);
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Accepted: PDF, DOCX, TXT, CSV, MD, PNG, JPG.' },
        { status: 400 }
      );
    }

    const extractedText = await extractText(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg'].includes(ext || '');

    return NextResponse.json({
      fileName: file.name,
      fileType: ext || 'unknown',
      extractedText,
      charCount: extractedText?.length || 0,
      isImage,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
