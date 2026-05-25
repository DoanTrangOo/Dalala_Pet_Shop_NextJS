begin;

alter table public.accounts
  drop constraint if exists accounts_id_fkey;

alter table public.accounts
  alter column id set default gen_random_uuid();

alter table public.carts
  drop constraint if exists carts_user_id_fkey;

alter table public.wishlists
  drop constraint if exists wishlists_user_id_fkey;

alter table public.orders
  drop constraint if exists orders_user_id_fkey;

alter table public.carts
  add constraint carts_user_id_fkey
  foreign key (user_id) references public.accounts(id) on delete cascade;

alter table public.wishlists
  add constraint wishlists_user_id_fkey
  foreign key (user_id) references public.accounts(id) on delete cascade;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references public.accounts(id) on delete restrict;

commit;