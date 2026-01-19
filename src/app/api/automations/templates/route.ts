import { NextResponse } from 'next/server';
import { AUTOMATION_TEMPLATES, n8nClient } from '@/lib/n8n/client';

// Get available automation templates
export async function GET() {
  try {
    const templates = AUTOMATION_TEMPLATES.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnail: template.thumbnail,
    }));

    const categories = n8nClient.getTemplateCategories();

    return NextResponse.json({
      templates,
      categories,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
