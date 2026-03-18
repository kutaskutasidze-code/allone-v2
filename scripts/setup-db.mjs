/**
 * Database Seeding Script
 *
 * This script seeds default data into the Supabase database.
 * Run AFTER the schema has been created via:
 *   - supabase db push (if port 5432 is accessible)
 *   - OR manually in Supabase Dashboard SQL Editor
 *
 * Usage: node scripts/setup-db.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Require environment variables - never use hardcoded credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  console.error('Set it in your .env.local file or environment');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it in your .env.local file or environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('Seeding database with default data...\n');

  // Check if tables exist by trying to query them
  const { error: checkError } = await supabase.from('categories').select('id').limit(1);

  if (checkError?.message?.includes('does not exist')) {
    console.log('ERROR: Tables do not exist yet.');
    console.log('Please run the schema first:');
    console.log('  Option 1: supabase db push (requires port 5432 access)');
    console.log('  Option 2: Run supabase/schema.sql in Supabase Dashboard SQL Editor');
    console.log('\nDashboard: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql/new');
    process.exit(1);
  }

  // Seed categories
  console.log('Seeding categories...');
  const { error: catError } = await supabase.from('categories').upsert([
    { name: 'Chatbots', display_order: 0 },
    { name: 'Automation', display_order: 1 },
    { name: 'Custom AI', display_order: 2 },
  ], { onConflict: 'name' });

  if (catError) {
    console.log('  Categories error:', catError.message);
  } else {
    console.log('  Categories seeded successfully!');
  }

  // Seed contact info
  console.log('Seeding contact info...');
  const { data: existingContact } = await supabase.from('contact_info').select('id').limit(1);

  if (!existingContact || existingContact.length === 0) {
    const { error: contactError } = await supabase.from('contact_info').insert({
      email: 'hello@allone.ai',
      location: 'San Francisco, CA',
    });

    if (contactError) {
      console.log('  Contact info error:', contactError.message);
    } else {
      console.log('  Contact info seeded successfully!');
    }
  } else {
    console.log('  Contact info already exists, skipping.');
  }

  // Seed default about content
  console.log('Seeding about content...');
  const { data: existingAbout } = await supabase.from('about_content').select('id').limit(1);

  if (!existingAbout || existingAbout.length === 0) {
    const { error: aboutError } = await supabase.from('about_content').insert({
      hero_subtitle: 'About Us',
      hero_title: 'We help businesses unlock the power of intelligent automation',
      story_subtitle: 'Our Story',
      story_title: 'Built by engineers who believe in accessible AI',
      story_paragraphs: [
        'Allone was founded with a simple belief: every business, regardless of size, should have access to powerful AI automation tools that drive real results.',
        'Our founders, seasoned engineers from leading tech companies, noticed a gap in the market. While large enterprises had access to cutting-edge AI solutions, smaller businesses were left behind.',
        'Today, we work with companies across industries—from healthcare to finance, e-commerce to logistics—helping them harness the power of AI to transform their operations and drive growth.',
      ],
      values_subtitle: 'Our Values',
      values_title: 'What drives us',
    });

    if (aboutError) {
      console.log('  About content error:', aboutError.message);
    } else {
      console.log('  About content seeded successfully!');
    }
  } else {
    console.log('  About content already exists, skipping.');
  }

  // Seed default stats
  console.log('Seeding stats...');
  const { data: existingStats } = await supabase.from('stats').select('id').limit(1);

  if (!existingStats || existingStats.length === 0) {
    const { error: statsError } = await supabase.from('stats').insert([
      { value: '50+', label: 'Projects', display_order: 0 },
      { value: '35+', label: 'Clients', display_order: 1 },
      { value: '98%', label: 'Satisfaction', display_order: 2 },
      { value: '5+', label: 'Years', display_order: 3 },
    ]);

    if (statsError) {
      console.log('  Stats error:', statsError.message);
    } else {
      console.log('  Stats seeded successfully!');
    }
  } else {
    console.log('  Stats already exist, skipping.');
  }

  // Seed default company values
  console.log('Seeding company values...');
  const { data: existingValues } = await supabase.from('company_values').select('id').limit(1);

  if (!existingValues || existingValues.length === 0) {
    const { error: valuesError } = await supabase.from('company_values').insert([
      { number: '01', title: 'Results-Driven', description: 'We measure our success by the tangible outcomes we deliver. Every solution is designed to create measurable business impact.', display_order: 0 },
      { number: '02', title: 'Client-Centric', description: 'Your success is our priority. We work as an extension of your team, understanding your unique challenges and goals.', display_order: 1 },
      { number: '03', title: 'Innovation First', description: 'We stay at the cutting edge of AI technology, continuously exploring new approaches to solve complex problems.', display_order: 2 },
      { number: '04', title: 'Trust & Transparency', description: 'We believe in open communication, honest assessments, and building long-term partnerships based on trust.', display_order: 3 },
    ]);

    if (valuesError) {
      console.log('  Company values error:', valuesError.message);
    } else {
      console.log('  Company values seeded successfully!');
    }
  } else {
    console.log('  Company values already exist, skipping.');
  }

  // Seed the 4 original services (only if none exist)
  console.log('Seeding services...');
  const { data: existingServices } = await supabase.from('services').select('id').limit(1);

  if (existingServices && existingServices.length > 0) {
    console.log('  Services already exist, skipping.');
  } else {
    const { error: servicesError } = await supabase.from('services').insert([
      {
        title: 'AI Chatbots & Assistants',
        description: 'Intelligent conversational AI that understands context, handles complex queries, and delivers personalized experiences 24/7. Built with cutting-edge language models for natural, human-like interactions.',
        icon: 'MessageSquare',
        features: ['Natural Language Understanding', 'Multi-channel Support', 'Context Awareness', 'Custom Training'],
        is_published: true,
        display_order: 0,
      },
      {
        title: 'Workflow Automation',
        description: 'Streamline your operations with intelligent automation that connects your tools, eliminates manual tasks, and optimizes processes. Reduce errors and free your team to focus on what matters.',
        icon: 'Workflow',
        features: ['Process Optimization', 'API Integration', 'Error Reduction', 'Real-time Monitoring'],
        is_published: true,
        display_order: 1,
      },
      {
        title: 'Custom AI Solutions',
        description: 'Bespoke AI systems designed specifically for your unique challenges. From data analysis to predictive modeling, we build solutions that transform raw data into actionable insights.',
        icon: 'Cpu',
        features: ['Custom Models', 'Data Pipeline Design', 'Scalable Architecture', 'Continuous Learning'],
        is_published: true,
        display_order: 2,
      },
      {
        title: 'AI Strategy & Consulting',
        description: 'Navigate the AI landscape with expert guidance. We assess your needs, identify opportunities, and create a roadmap for successful AI adoption that aligns with your business goals.',
        icon: 'Lightbulb',
        features: ['AI Readiness Assessment', 'Technology Roadmap', 'ROI Analysis', 'Implementation Support'],
        is_published: true,
        display_order: 3,
      },
    ]);

    if (servicesError) {
      console.log('  Services error:', servicesError.message);
    } else {
      console.log('  Services seeded successfully!');
    }
  }

  // Seed client logos (only if none exist)
  console.log('Seeding clients...');
  const { data: existingClients } = await supabase.from('clients').select('id').limit(1);

  if (existingClients && existingClients.length > 0) {
    console.log('  Clients already exist, skipping.');
  } else {
    const { error: clientsError } = await supabase.from('clients').insert([
      { name: 'TechFlow', logo_text: 'TechFlow', is_published: true, display_order: 0 },
      { name: 'DataPulse', logo_text: 'DataPulse', is_published: true, display_order: 1 },
      { name: 'CloudSync', logo_text: 'CloudSync', is_published: true, display_order: 2 },
      { name: 'NexGen', logo_text: 'NexGen', is_published: true, display_order: 3 },
      { name: 'Quantum Labs', logo_text: 'QuantumLabs', is_published: true, display_order: 4 },
      { name: 'InnovateCo', logo_text: 'InnovateCo', is_published: true, display_order: 5 },
    ]);

    if (clientsError) {
      console.log('  Clients error:', clientsError.message);
    } else {
      console.log('  Clients seeded successfully!');
    }
  }

  console.log('\nSeeding complete!');
  console.log('Dashboard: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd');
}

seedDatabase().catch(console.error);
