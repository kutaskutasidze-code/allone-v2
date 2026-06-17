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
  location: 'Tbilisi · On-site',
  summary:
    "We're hiring people who actually use AI to build real things. Full-time, on-site in Tbilisi.",
  description_md: `## About AllOne

AllOne is an AI company headquartered in Tbilisi, with a presence in Europe. We build AI chatbots, custom AI solutions, workflow automation, and websites for businesses across Georgia and beyond.

For us, AI isn't a side project or a buzzword — it's the core of how we work and what we sell. We use AI tools every day to design, build, and ship products faster than traditional teams can. Our clients come to us to turn "AI" from a slide in a deck into something that actually moves their business.

We're a small, fast-moving team. You'll work directly with the people building our products, see exactly how an AI company runs end to end, and take on real responsibility from your first week.

## Who we're looking for

We are **not** looking for someone who has memorized programming languages. We're looking for people who *actually use AI* — who instinctively reach for it to solve problems, build things, and get far more done than they could alone.

- You use AI tools (ChatGPT, Claude, and others) every day, and you're genuinely good with them
- You've already used AI to build, automate, write, design, or solve something real
- You're curious and resourceful — you figure things out without being walked through every step
- You can take a rough idea and turn it into something that works, with the tools available today
- Strong communication and good English

If AI has become the way you get things done, you'll fit right in — your background matters far less than what you can build with it.

## What you'll do

- Work alongside our team on live AI products and real client projects
- Use AI to prototype, build, test, and ship — fast
- Help create chatbots, automations, content, and websites
- Learn first-hand how a real AI company turns ideas into shipped products

## What we offer

- Hands-on mentorship from the people actually building AllOne
- Real projects and real ownership from day one — no coffee runs
- A front-row seat to how AI is used in production, not in theory
- A clear path to a permanent, paid role for people who deliver

## Details

- **3-month** paid internship
- **$200 net / month**
- **Full-time, on-site** at our Tbilisi office
- Start date: as soon as you're ready
- To apply: send your CV and tell us how you use AI`,
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
