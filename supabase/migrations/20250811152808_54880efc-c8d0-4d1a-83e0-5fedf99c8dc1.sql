-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('rewards-products', 'rewards-products', true)
on conflict (id) do nothing;

-- Policies for rewards-products bucket
-- Public can read objects in this bucket
drop policy if exists "Public can view rewards-products" on storage.objects;
create policy "Public can view rewards-products"
  on storage.objects for select
  using (bucket_id = 'rewards-products');

-- Admins can upload/update/delete in this bucket
drop policy if exists "Admins can upload to rewards-products" on storage.objects;
create policy "Admins can upload to rewards-products"
  on storage.objects for insert
  with check (bucket_id = 'rewards-products' and public.has_role('admin'::app_role));

drop policy if exists "Admins can update rewards-products" on storage.objects;
create policy "Admins can update rewards-products"
  on storage.objects for update
  using (bucket_id = 'rewards-products' and public.has_role('admin'::app_role))
  with check (bucket_id = 'rewards-products' and public.has_role('admin'::app_role));

drop policy if exists "Admins can delete rewards-products" on storage.objects;
create policy "Admins can delete rewards-products"
  on storage.objects for delete
  using (bucket_id = 'rewards-products' and public.has_role('admin'::app_role));

-- Product images table
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url_full text not null,
  url_card text not null,
  url_thumb text not null,
  alt text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

-- RLS: Admins can manage all product images
drop policy if exists "Admins can view product images" on public.product_images;
create policy "Admins can view product images"
  on public.product_images for select
  using (public.has_role('admin'::app_role));

drop policy if exists "Admins can insert product images" on public.product_images;
create policy "Admins can insert product images"
  on public.product_images for insert
  with check (public.has_role('admin'::app_role));

drop policy if exists "Admins can update product images" on public.product_images;
create policy "Admins can update product images"
  on public.product_images for update
  using (public.has_role('admin'::app_role))
  with check (public.has_role('admin'::app_role));

drop policy if exists "Admins can delete product images" on public.product_images;
create policy "Admins can delete product images"
  on public.product_images for delete
  using (public.has_role('admin'::app_role));

-- Helpful indexes
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_images_sort on public.product_images(product_id, sort);
