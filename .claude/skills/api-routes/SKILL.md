---
name: api-routes
description: Patterns for creating Next.js API routes in the Allone project. Use when building CRUD endpoints, handling authentication, or creating new admin API routes.
---

# API Routes Guide

## File Structure

```
src/app/api/
├── contact/
│   └── route.ts           # Public contact form
└── admin/
    ├── projects/
    │   ├── route.ts       # GET (list), POST (create)
    │   └── [id]/
    │       └── route.ts   # GET, PUT, DELETE (single item)
    ├── services/
    ├── clients/
    ├── stats/
    ├── values/
    ├── about/
    │   └── route.ts       # GET, PUT (single row table)
    └── contact-info/
        └── route.ts       # GET, PUT (single row table)
```

---

## Authentication Helper (DRY)

**IMPORTANT:** Always use this helper instead of repeating auth checks.

```typescript
// lib/auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireAuth(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('Unauthorized');
  }

  return { supabase, user };
}

// Response helper for auth errors
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Standard CRUD Route Template

### Collection Route (`route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth';

// GET - List all items
export async function GET() {
  try {
    const { supabase } = await requireAuth();

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST - Create new item
export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();
    const { field1, field2, is_published } = body;

    // Validate required fields
    if (!field1 || !field2) {
      return NextResponse.json(
        { error: 'field1 and field2 are required' },
        { status: 400 }
      );
    }

    // Get next display_order
    const { data: lastItem } = await supabase
      .from('table_name')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = lastItem ? lastItem.display_order + 1 : 0;

    // Insert
    const { data, error } = await supabase
      .from('table_name')
      .insert({
        field1,
        field2,
        is_published: is_published ?? true,
        display_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
```

### Single Item Route (`[id]/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Single item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { supabase } = await requireAuth();

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT - Update item
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { supabase } = await requireAuth();
    const body = await request.json();

    const { data, error } = await supabase
      .from('table_name')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE - Remove item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { supabase } = await requireAuth();

    const { error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
```

## Single-Row Tables Pattern

For tables like `contact_info` and `about_content` that only have one row:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, handleAuthError } from '@/lib/auth';

// GET - Fetch the single row (public)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Upsert the single row (authenticated)
export async function PUT(request: Request) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();

    // Check if row exists
    const { data: existing } = await supabase
      .from('contact_info')
      .select('id')
      .limit(1)
      .single();

    let data, error;

    if (existing) {
      ({ data, error } = await supabase
        .from('contact_info')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('contact_info')
        .insert(body)
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
```

## Response Patterns

```typescript
// Success responses
NextResponse.json(data);                           // 200 OK
NextResponse.json(data, { status: 201 });          // 201 Created
NextResponse.json({ success: true });              // 200 OK (delete)

// Error responses
NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
NextResponse.json({ error: 'Field X is required' }, { status: 400 });
NextResponse.json({ error: 'Not found' }, { status: 404 });
NextResponse.json({ error: error.message }, { status: 500 });
NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

## Authentication Check

**Use the `requireAuth` helper** defined at the top of this document. It:
- Uses `getUser()` instead of `getSession()` (more secure)
- Returns both supabase client and user
- Throws `AuthError` which is caught by `handleAuthError`

```typescript
// Clean and DRY
const { supabase, user } = await requireAuth();

// user.id is available if you need it
console.log('Request from:', user.id);
```

**Never use getSession() directly** - it can be spoofed. Always use `getUser()` which verifies the JWT.

## Public Routes

For public routes (like contact form), skip auth check:

```typescript
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate and process...
    // No session check needed

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
