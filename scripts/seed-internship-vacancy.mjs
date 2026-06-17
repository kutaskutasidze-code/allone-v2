// Seeds the first internship vacancy. Runs with the service-role key (no DB
// password needed). Safe to re-run — upserts on slug.
//   node scripts/seed-internship-vacancy.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const vacancy = {
  slug: 'ai-software-engineering-intern',
  title: 'AI & Software Engineering Intern',
  department: 'Engineering',
  employment_type: 'internship',
  location: 'Tbilisi (Hybrid)',
  summary:
    'Build real AI products with us — chatbots, automations, and web apps for real clients.',
  description_md: `## About Allone

Allone builds AI chatbots, custom AI solutions, workflow automation, and websites for businesses in Georgia and Europe. As an intern you'll work on real products, not busywork.

## What you'll do

- Work alongside our engineers on production AI features and web apps
- Build and test chatbots, automations, and integrations
- Turn ideas into working prototypes — fast

## What we're looking for

- Solid fundamentals in JavaScript/TypeScript or Python
- Curiosity about AI / LLMs and a builder's mindset
- Good English and the ability to work in a team

## Nice to have

- Side projects, a GitHub, or anything you've shipped
- Familiarity with React / Next.js or Node

## Details

- Hybrid in Tbilisi
- Mentorship from senior engineers
- Strong performers can convert to a full-time role`,
  is_open: true,
  sort_order: 0,
};

const { data, error } = await supabase
  .from('vacancies')
  .upsert(vacancy, { onConflict: 'slug' })
  .select()
  .single();

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
console.log('Seeded vacancy:', data.title, `(/careers/${data.slug})`);
