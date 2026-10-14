begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('customer-references','customer-references',false,524288,array['image/jpeg','image/png','image/webp']),
 ('product-drafts','product-drafts',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Customer uploads are performed by the validated Stage 9D server pipeline.
-- No anonymous/authenticated direct upload, list or delete permissions are added.
create policy admin_reference_read on storage.objects for select to authenticated
using(bucket_id='customer-references' and (select bakery_private.is_staff())
 and exists(select 1 from public.reference_files r where r.object_path=name));
create policy admin_product_photo_read on storage.objects for select to authenticated
using(bucket_id='product-drafts' and (select bakery_private.is_staff()));
create policy admin_product_photo_insert on storage.objects for insert to authenticated
with check(bucket_id='product-drafts' and (select bakery_private.can_manage_catalogue())
 and name ~ '^[a-f0-9-]{36}\.(jpg|png|webp)$');
-- No overwrite/delete policy: new photographs use random names, preserving history.
commit;
