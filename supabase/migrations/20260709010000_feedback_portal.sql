-- Feedback portal — client companies + their feedback/bug submissions.
-- Folded into the AllOne CRM from the standalone feedback-portal.
--
-- Service-role only: RLS is enabled with NO anon/authenticated policies, so every
-- read/write goes through a service-role API route (the service role bypasses RLS).
-- This matches the CRM convention (see 20260617000000_careers.sql).
--
-- Apply: paste into the Supabase SQL editor for project cywmdjldapzrnabsoosd,
--        or `supabase db push` if the CLI is linked.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- Shared updated_at trigger fn (idempotent; already exists CRM-wide, redefined safely).
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- feedback_companies — one AllOne client each (portal login + per-company Plane label)
-- ---------------------------------------------------------------------------
create table if not exists feedback_companies (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  slug              text        not null unique,               -- e.g. 'acme'

  -- Permanent, non-expiring magic-link token.
  -- access_token_enc: AES-256-GCM (re-displayable in admin). token_lookup: sha256 hex.
  access_token_enc  text        not null,
  token_lookup      text        not null unique,

  -- Auto-generated email/password login (second path).
  login_email       text        not null unique,               -- generated <slug>@<domain>
  password_hash     text        not null,                      -- scrypt (login check)
  password_enc      text,                                      -- AES-256-GCM (re-displayable)

  contact_email     text,                                      -- real client inbox (onboarding recipient)
  phone             text,

  -- Language the client receives emails in AND sees the portal in.
  comms_language    text        not null default 'ka'
                    check (comms_language in ('ka','en')),

  -- Routing into the shared Plane project.
  plane_workspace   text        not null default 'allone',
  plane_project_id  uuid        not null,
  plane_label_id    uuid,                                      -- per-company label in that project

  -- Lockout for the email/password path (magic link is unguessable, not throttled).
  failed_attempts   int         not null default 0,
  locked_until      timestamptz,

  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  rotated_at        timestamptz
);

create index if not exists feedback_companies_token_lookup_idx on feedback_companies (token_lookup);
create index if not exists feedback_companies_login_email_idx  on feedback_companies (login_email);

drop trigger if exists update_feedback_companies_updated_at on feedback_companies;
create trigger update_feedback_companies_updated_at
  before update on feedback_companies
  for each row execute function update_updated_at_column();

-- ---------------------------------------------------------------------------
-- feedback_submissions — audit trail of everything pushed to Plane
-- ---------------------------------------------------------------------------
create table if not exists feedback_submissions (
  id                    uuid        primary key default gen_random_uuid(),
  company_id            uuid        not null references feedback_companies(id) on delete cascade,
  type                  text        not null check (type in ('bug','feature','feedback')),
  priority              text        check (priority in ('urgent','high','medium','low','none')),
  title                 text        not null,
  body                  text,
  page_url              text,
  screenshot_urls       text[],                                -- Supabase Storage public URLs
  plane_intake_issue_id uuid,
  plane_issue_id        uuid,
  status                text        not null default 'submitted',
  created_at            timestamptz not null default now()
);

create index if not exists feedback_submissions_company_idx
  on feedback_submissions (company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Screenshots bucket (public read; uploads happen server-side via service role).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------------
-- Security: expose to service_role only. RLS on, no policies.
-- ---------------------------------------------------------------------------
alter table feedback_companies   enable row level security;
alter table feedback_submissions enable row level security;

grant all on table feedback_companies, feedback_submissions to service_role;
revoke all on table feedback_companies, feedback_submissions from anon, authenticated;

notify pgrst, 'reload schema';
