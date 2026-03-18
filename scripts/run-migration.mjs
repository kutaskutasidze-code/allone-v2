import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedServices() {
  console.log('Step 1: Deleting existing services...');
  const { error: deleteError } = await supabase
    .from('services')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('Error deleting services:', deleteError);
    return;
  }
  console.log('Existing services deleted.');

  console.log('\nStep 2: Inserting new services...');

  const services = [
    {
      title: 'AI Chatbots & Assistants',
      description: 'Context-aware, helpful, human. Our AI learns your business and resolves issues 24/7.',
      icon: 'MessageSquare',
      subtitle: 'Conversations that actually help.',
      secondary_description: null,
      stats: [{ value: '94%', label: 'Resolution rate' }, { value: '<2s', label: 'Response time' }],
      features: ['Support', 'Sales', 'Onboarding'],
      footer_text: null,
      cta_text: null,
      cta_url: null,
      card_type: 'chatbot',
      display_order: 1,
      is_published: true,
    },
    {
      title: 'Custom AI Solutions',
      description: 'Tailored models trained on your data. From document analysis to predictive insights.',
      icon: 'Brain',
      subtitle: null,
      secondary_description: 'We build AI systems that understand your specific domain, integrate with your existing tools, and deliver actionable results.',
      stats: [{ value: '10x', label: 'Faster processing' }, { value: '94%', label: 'Accuracy' }, { value: '24/7', label: 'Availability' }],
      features: ['NLP', 'Vision', 'Predictions'],
      footer_text: null,
      cta_text: null,
      cta_url: null,
      card_type: 'custom_ai',
      display_order: 2,
      is_published: true,
    },
    {
      title: 'Workflow Automation',
      description: 'We connect your existing tools into seamless automated pipelines. No more manual data entry or missed handoffs.',
      icon: 'Workflow',
      subtitle: null,
      secondary_description: null,
      stats: [],
      features: [],
      footer_text: 'Connect your tools. Data flows automatically.',
      cta_text: null,
      cta_url: null,
      card_type: 'workflow',
      display_order: 3,
      is_published: true,
    },
    {
      title: 'Website Development',
      description: 'Beautiful, responsive interfaces that load instantly and convert visitors into customers.',
      icon: 'Code',
      subtitle: null,
      secondary_description: 'We craft pixel-perfect designs with modern frameworks. SEO-optimized, accessible, and built for performance.',
      stats: [],
      features: ['Next.js', 'React', 'Tailwind', 'Vercel'],
      footer_text: null,
      cta_text: null,
      cta_url: null,
      card_type: 'website',
      display_order: 4,
      is_published: true,
    },
    {
      title: 'Strategy & Consulting',
      description: "Not sure what you need? We'll map out your AI journey—from first idea to full deployment.",
      icon: 'Settings',
      subtitle: null,
      secondary_description: null,
      stats: [],
      features: [],
      footer_text: null,
      cta_text: 'Book a free call →',
      cta_url: '/contact',
      card_type: 'consulting',
      display_order: 5,
      is_published: true,
    },
  ];

  const { data, error } = await supabase
    .from('services')
    .insert(services)
    .select();

  if (error) {
    console.error('Error inserting services:', error);
  } else {
    console.log('\nSuccessfully inserted', data.length, 'services:');
    data.forEach(s => console.log(' -', s.title, `(${s.card_type})`));
  }
}

seedServices().catch(console.error);
