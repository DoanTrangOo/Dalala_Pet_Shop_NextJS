begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "categories_select_public"
  on public.categories
  for select
  using (true);

create policy "categories_insert_admin"
  on public.categories
  for insert
  with check (public.is_admin());

create policy "categories_update_admin"
  on public.categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories_delete_admin"
  on public.categories
  for delete
  using (public.is_admin());

create policy "products_select_public"
  on public.products
  for select
  using (is_active = true or public.is_admin());

create policy "products_insert_admin"
  on public.products
  for insert
  with check (public.is_admin());

create policy "products_update_admin"
  on public.products
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_delete_admin"
  on public.products
  for delete
  using (public.is_admin());

create policy "product_images_select_public"
  on public.product_images
  for select
  using (true);

create policy "product_images_insert_admin"
  on public.product_images
  for insert
  with check (public.is_admin());

create policy "product_images_update_admin"
  on public.product_images
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images_delete_admin"
  on public.product_images
  for delete
  using (public.is_admin());

create policy "carts_select_owner"
  on public.carts
  for select
  using (user_id = auth.uid());

create policy "carts_insert_owner"
  on public.carts
  for insert
  with check (user_id = auth.uid());

create policy "carts_update_owner"
  on public.carts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "carts_delete_owner"
  on public.carts
  for delete
  using (user_id = auth.uid());

create policy "cart_items_select_owner"
  on public.cart_items
  for select
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );

create policy "cart_items_insert_owner"
  on public.cart_items
  for insert
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );

create policy "cart_items_update_owner"
  on public.cart_items
  for update
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );

create policy "cart_items_delete_owner"
  on public.cart_items
  for delete
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );

create policy "wishlists_select_owner"
  on public.wishlists
  for select
  using (user_id = auth.uid());

create policy "wishlists_insert_owner"
  on public.wishlists
  for insert
  with check (user_id = auth.uid());

create policy "wishlists_delete_owner"
  on public.wishlists
  for delete
  using (user_id = auth.uid());

create policy "orders_select_owner_or_admin"
  on public.orders
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_owner"
  on public.orders
  for insert
  with check (user_id = auth.uid());

create policy "orders_update_admin"
  on public.orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_select_owner_or_admin"
  on public.order_items
  for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items_insert_owner"
  on public.order_items
  for insert
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "order_items_update_admin"
  on public.order_items
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_delete_admin"
  on public.order_items
  for delete
  using (public.is_admin());

commit;
