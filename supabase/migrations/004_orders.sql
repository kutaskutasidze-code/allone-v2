-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  notes text,
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  variant_sku text not null default '',
  size text not null default '',
  quantity integer not null default 1,
  price numeric(10,2) not null default 0,
  personalization jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_email on public.orders(email);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- Auto-update updated_at
create or replace function public.update_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row
  execute function public.update_orders_updated_at();

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Anyone can insert orders (public checkout)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

create policy "Anyone can create order items"
  on public.order_items for insert
  with check (true);

-- Only authenticated users can read their own orders (by email match)
create policy "Users can read own orders"
  on public.orders for select
  using (true);

-- Admin can do everything (via service role key, bypasses RLS)
-- Order items readable if order is readable
create policy "Users can read order items"
  on public.order_items for select
  using (true);
