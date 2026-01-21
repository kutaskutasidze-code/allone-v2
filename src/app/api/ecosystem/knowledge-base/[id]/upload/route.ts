/**
 * POST /api/ecosystem/knowledge-base/[id]/upload
 * Upload documents to a knowledge base for RAG
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ragService } from '@/lib/rag/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const knowledgeBase = await ragService.getKnowledgeBase(id);
    if (!knowledgeBase || knowledgeBase.user_id !== user.id) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Handle multipart form data or JSON
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }

      const content = await file.text();
      const fileName = file.name;
      const fileType = file.type || getFileTypeFromName(fileName);

      const document = await ragService.uploadDocument({
        knowledge_base_id: id,
        name: fileName,
        content,
        file_type: fileType,
        metadata: {
          original_size: file.size,
          uploaded_at: new Date().toISOString(),
        },
      });

      // Track usage (storage)
      const sizeInMB = file.size / (1024 * 1024);
      await supabase.rpc('record_usage', {
        p_user_id: user.id,
        p_product_id: null,
        p_event_type: 'storage_mb',
        p_quantity: sizeInMB,
        p_metadata: { document_id: document.id, file_name: fileName },
      });

      return NextResponse.json({ document }, { status: 201 });

    } else {
      // Handle JSON (text content)
      const body = await request.json();
      const { name, content, file_type, metadata } = body;

      if (!name || !content) {
        return NextResponse.json(
          { error: 'Name and content are required' },
          { status: 400 }
        );
      }

      const document = await ragService.uploadDocument({
        knowledge_base_id: id,
        name,
        content,
        file_type: file_type || 'text/plain',
        metadata,
      });

      // Track usage
      const sizeInMB = content.length / (1024 * 1024);
      await supabase.rpc('record_usage', {
        p_user_id: user.id,
        p_product_id: null,
        p_event_type: 'storage_mb',
        p_quantity: sizeInMB,
        p_metadata: { document_id: document.id, file_name: name },
      });

      return NextResponse.json({ document }, { status: 201 });
    }

  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    );
  }
}

function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    csv: 'text/csv',
    json: 'application/json',
    html: 'text/html',
  };
  return mimeTypes[extension || ''] || 'text/plain';
}
