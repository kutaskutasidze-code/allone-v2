---
name: supabase-helper
description: Help with Supabase database operations, migrations, and schema management for the Allone project. Use when working with database tables, RLS policies, migrations, or querying data.
---

# Supabase Database Helper

## Project Configuration

| Setting | Value |
|---------|-------|
| Project Ref | `cywmdjldapzrnabsoosd` |
| Region | East US (North Virginia) |
| Dashboard | https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd |
| SQL Editor | https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql/new |

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `projects` | Portfolio projects | title, description, category, technologies[], is_published |
| `services` | Service offerings | title, description, icon, features[], is_published |
| `clients` | Client logos | name, logo_text, logo_url, is_published |
| `stats` | Statistics display | value, label, display_order |
| `company_values` | Company values | number, title, description |
| `contact_info` | Contact details (single row) | email, location, phone |
| `about_content` | About page content (single row) | hero_title, story_paragraphs[], etc. |
| `categories` | Project categories | name, display_order |

### Common Columns

Most tables share these columns:
- `id` - UUID primary key (auto-generated)
- `display_order` - INTEGER for sorting
- `is_published` - BOOLEAN for visibility (projects, services, clients)
- `created_at` / `updated_at` - Timestamps (auto-managed)

### Array Fields

These tables use PostgreSQL arrays:
- `projects.technologies` - TEXT[]
- `services.features` - TEXT[]
- `about_content.story_paragraphs` - TEXT[]

## Supabase Clients

### Browser Client (Client Components)
```typescript
import { createClient } from '@/lib/supabase/client';

// In component
const supabase = createClient();
```

### Server Client (API Routes, Server Components)
```typescript
import { createClient } from '@/lib/supabase/server';

// In async function
const supabase = await createClient();
```

### Admin Client (Service Role - bypasses RLS)
```typescript
import { createClient } from '@/lib/supabase/admin';

const supabase = createClient();
```

## Row Level Security (RLS)

All tables have RLS enabled:
- **Public read**: Published content readable by anyone
- **Admin write**: Authenticated users have full CRUD access

```sql
-- Example RLS policies
CREATE POLICY "Public read access for projects" ON projects
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access for projects" ON projects
  FOR ALL USING (auth.role() = 'authenticated');
```

## Common Queries

### Fetch Published Items (ordered)
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('is_published', true)
  .order('display_order', { ascending: true });
```

### Fetch All Items (admin - requires auth)
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('display_order', { ascending: true });
```

### Insert with Auto Display Order
```typescript
// Get highest display_order
const { data: last } = await supabase
  .from('projects')
  .select('display_order')
  .order('display_order', { ascending: false })
  .limit(1)
  .single();

const display_order = last ? last.display_order + 1 : 0;

// Insert new item
const { data, error } = await supabase
  .from('projects')
  .insert({ ...fields, display_order })
  .select()
  .single();
```

### Update Single Row Tables (contact_info, about_content)
```typescript
// Get existing row or create new
const { data: existing } = await supabase
  .from('contact_info')
  .select('id')
  .limit(1)
  .single();

if (existing) {
  await supabase.from('contact_info').update(fields).eq('id', existing.id);
} else {
  await supabase.from('contact_info').insert(fields);
}
```

## CLI Commands

```bash
# Push schema to Supabase (requires port 5432)
supabase db push

# Check project status
supabase status

# Generate TypeScript types
supabase gen types typescript --project-id cywmdjldapzrnabsoosd > src/types/database.ts
```

## Schema File Location

Full schema: `supabase/schema.sql`

When modifying schema:
1. Update `supabase/schema.sql`
2. Run `supabase db push` OR execute in SQL Editor
3. Update TypeScript types if needed
