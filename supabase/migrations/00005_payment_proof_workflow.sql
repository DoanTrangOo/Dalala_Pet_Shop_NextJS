begin;

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'awaiting_transfer', 'proof_submitted', 'paid', 'failed'));

alter table public.orders
  add column if not exists payment_proof_url text;

alter table public.orders
  add column if not exists payment_proof_path text;

alter table public.orders
  add column if not exists payment_proof_uploaded_at timestamptz;

alter table public.orders
  add column if not exists payment_reviewed_at timestamptz;

alter table public.orders
  add column if not exists payment_review_note text;

commit;
