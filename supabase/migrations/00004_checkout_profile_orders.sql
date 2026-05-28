begin;

-- Align user foreign keys with auth.users so app actions using auth.uid() work reliably.
alter table public.carts
  drop constraint if exists carts_user_id_fkey;

alter table public.wishlists
  drop constraint if exists wishlists_user_id_fkey;

alter table public.orders
  drop constraint if exists orders_user_id_fkey;

alter table public.carts
  add constraint carts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.wishlists
  add constraint wishlists_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete restrict;

create table if not exists public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address_line1 text not null,
  ward text,
  district text,
  city text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shipping_addresses_one_default_per_user
  on public.shipping_addresses(user_id)
  where is_default = true;

alter table public.shipping_addresses enable row level security;

drop policy if exists "shipping_addresses_select_owner" on public.shipping_addresses;
create policy "shipping_addresses_select_owner"
  on public.shipping_addresses
  for select
  using (user_id = auth.uid());

drop policy if exists "shipping_addresses_insert_owner" on public.shipping_addresses;
create policy "shipping_addresses_insert_owner"
  on public.shipping_addresses
  for insert
  with check (user_id = auth.uid());

drop policy if exists "shipping_addresses_update_owner" on public.shipping_addresses;
create policy "shipping_addresses_update_owner"
  on public.shipping_addresses
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "shipping_addresses_delete_owner" on public.shipping_addresses;
create policy "shipping_addresses_delete_owner"
  on public.shipping_addresses
  for delete
  using (user_id = auth.uid());

alter table public.orders
  add column if not exists payment_method text not null default 'cod'
  check (payment_method in ('cod', 'bank_transfer'));

alter table public.orders
  add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'awaiting_transfer', 'paid', 'failed'));

alter table public.orders
  add column if not exists note text;

commit;
