# Allone Project Configuration

## Quick Start - Database Setup (PENDING)

The database schema needs to be pushed to Supabase. Choose one of these methods:

### Option 1: CLI Push (Recommended - requires non-work WiFi)
```bash
cd C:\Users\hp\Desktop\Projects\Allone
supabase db push
```
**Note:** This requires port 5432 to be open. Work/corporate WiFi often blocks this port.

### Option 2: Manual SQL Editor
1. Open: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql/new
2. Copy contents of `supabase/schema.sql`
3. Paste and click "Run"

### After Schema is Created
```bash
# Seed default data
node scripts/setup-db.mjs

# Create admin user in Supabase Dashboard:
# 1. Go to Authentication > Users
# 2. Click "Add user"
# 3. Enter email and password
```

---

## Supabase Configuration

| Setting | Value |
|---------|-------|
| **Project Name** | allone-admin |
| **Project Ref** | cywmdjldapzrnabsoosd |
| **Region** | East US (North Virginia) |
| **Dashboard** | https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd |
| **Project URL** | https://cywmdjldapzrnabsoosd.supabase.co |

### API Keys
- **Anon Key:** See `.env.local`
- **Service Role Key:** See `.env.local`

### Database Password
See Supabase Dashboard or `.env.local`

---

## Admin Panel

| URL | Description |
|-----|-------------|
| `/admin/login` | Admin login page |
| `/admin` | Dashboard with content counts |
| `/admin/projects` | Manage projects (CRUD) |
| `/admin/services` | Manage services (CRUD) |
| `/admin/clients` | Manage client logos |
| `/admin/stats` | Edit statistics |
| `/admin/values` | Edit company values |
| `/admin/about` | Edit about page content |
| `/admin/settings` | Contact info settings |
| `/admin/claude` | **Claude Capabilities Dashboard** |
| `/admin/claude/capabilities` | List all capabilities |
| `/admin/claude/upgrades` | Upgrade history with verification |

---

## Claude Self-Reporting

Claude can report upgrades and usage via API:

### Report an Upgrade
```bash
curl -X POST https://www.allone.ge/api/admin/claude/upgrades \
  -H "Content-Type: application/json" \
  -H "X-Claude-API-Key: $CLAUDE_REPORT_API_KEY" \
  -d '{
    "action": "install",
    "capability": {
      "name": "new-tool",
      "category": "skill",
      "source": "github.com/user/repo"
    },
    "description": "Installed new tool for X",
    "details": { "commands": ["/new-command"] }
  }'
```

### Report Usage
```bash
curl -X POST https://www.allone.ge/api/admin/claude/usage \
  -H "Content-Type: application/json" \
  -H "X-Claude-API-Key: $CLAUDE_REPORT_API_KEY" \
  -d '{
    "capability_name": "native-access",
    "success": true,
    "duration_ms": 245,
    "context": "Sent email via SMTP"
  }'
```

API key is in `.env.local` as `CLAUDE_REPORT_API_KEY`.

---

## Tech Stack

- **Framework:** Next.js 16.1.0 (App Router)
- **React:** 19.2.3
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Animation:** Framer Motion
- **Auth:** Supabase Auth
- **Payments:** PayPal

---

## Product Platform (E-commerce)

### Customer URLs

| URL | Description |
|-----|-------------|
| `/products` | Product catalog (templates, courses, tools) |
| `/products/[slug]` | Individual product page with checkout |
| `/login` | Customer login |
| `/signup` | Customer registration |
| `/dashboard` | Customer dashboard (overview) |
| `/dashboard/purchases` | View/download purchased products |
| `/dashboard/subscriptions` | Manage subscriptions |

### Product Categories
- `template` - Automation templates (n8n workflows, etc.)
- `course` - Training courses and tutorials
- `tool` - Software tools and utilities
- `service` - Service packages
- `subscription` - Recurring subscription plans

### PayPal Integration

1. **Get credentials** from https://developer.paypal.com
2. **Add to `.env.local`**:
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   ```
3. Use **sandbox credentials** for development
4. Switch to **live credentials** for production

### Checkout Flow
1. User clicks "Pay with PayPal" on product page
2. `/api/checkout/paypal/create` creates PayPal order
3. User redirected to PayPal to approve payment
4. PayPal redirects to `/api/checkout/paypal/capture`
5. Payment captured, purchase recorded
6. User redirected to `/dashboard/purchases`

---

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `projects` | Portfolio projects | title, description, category, technologies[], is_published |
| `services` | Service offerings | title, description, icon, features[], is_published |
| `clients` | Client logos | name, logo_text, logo_url, is_published |
| `stats` | Statistics | value, label, display_order |
| `company_values` | Company values | number, title, description |
| `contact_info` | Contact details | email, location, phone |
| `about_content` | About page | hero_title, story_paragraphs[], etc. |
| `categories` | Project categories | name, display_order |
| `claude_capabilities` | Claude's tools/skills | name, category, status, source, metadata |
| `claude_upgrades` | Upgrade history | action, description, details, verified |
| `claude_usage` | Usage analytics | capability_name, success, duration_ms, context |
| `profiles` | User profiles | full_name, company, avatar_url, paypal_customer_id |
| `products` | Product catalog | name, slug, price, category, features[], file_url |
| `purchases` | One-time purchases | user_id, product_id, paypal_order_id, download_token |
| `subscriptions` | User subscriptions | user_id, plan, paypal_subscription_id, status |
| `download_logs` | Download tracking | purchase_id, ip_address, user_agent |

### Features
- **Indexes** on all frequently queried columns (display_order, is_published, category)
- **Auto-updating** `updated_at` timestamps via triggers
- **Row Level Security (RLS)** - Public read for published content, authenticated write
- **Seed data** included for categories, contact info, stats, and values

---

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin panel pages
│   │   ├── login/       # Login page
│   │   ├── projects/    # Projects CRUD
│   │   ├── services/    # Services CRUD
│   │   ├── clients/     # Clients management
│   │   ├── stats/       # Stats editor
│   │   ├── values/      # Values editor
│   │   ├── about/       # About page editor
│   │   └── settings/    # Contact settings
│   ├── api/admin/       # API routes for admin CRUD
│   └── ...              # Public pages
├── components/
│   ├── admin/           # Admin UI components
│   └── sections/        # Public page sections
├── lib/
│   └── supabase/        # Supabase client files
└── types/
    └── database.ts      # Database types

supabase/
├── schema.sql           # Full database schema
└── migrations/          # Migration files for db push

scripts/
└── setup-db.mjs         # Database seeding script
```

---

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cywmdjldapzrnabsoosd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Claude Self-Reporting
CLAUDE_REPORT_API_KEY=<api-key>

# PayPal (get from https://developer.paypal.com)
PAYPAL_CLIENT_ID=<client-id>
PAYPAL_CLIENT_SECRET=<client-secret>
```

---

## Troubleshooting

### Port 5432 Blocked (supabase db push fails)
Corporate/work WiFi often blocks port 5432. Solutions:
1. Switch to home WiFi or mobile hotspot
2. Use Supabase Dashboard SQL Editor (uses HTTPS port 443)

### Tables Don't Exist
Run the schema first before seeding:
```bash
supabase db push
# OR manually in SQL Editor
```

### Auth Not Working
1. Create a user in Supabase Dashboard > Authentication > Users
2. Make sure middleware.ts is protecting /admin routes
