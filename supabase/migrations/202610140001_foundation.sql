-- Stage 9A: review before applying to a dedicated Supabase development project.
-- No sample customers, requests, users, bookings or business values are created.
begin;
create schema if not exists bakery_private;
revoke all on schema bakery_private from public,anon;
grant usage on schema bakery_private to authenticated,service_role;

create table public.admin_accounts (
 user_id uuid primary key references auth.users(id) on delete restrict,
 role text not null check(role in ('Owner','Administrator','Staff')),
 active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.admin_accounts enable row level security;
create function public.current_admin_role() returns text
language sql stable security definer set search_path='' as $$
 select role from public.admin_accounts where user_id=(select auth.uid()) and active;
$$;
revoke all on function public.current_admin_role() from public,anon;
grant execute on function public.current_admin_role() to authenticated;
create function bakery_private.can_manage_catalogue() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(public.current_admin_role() in ('Owner','Administrator'),false);
$$;
create function bakery_private.is_staff() returns boolean
language sql stable security definer set search_path='' as $$
 select public.current_admin_role() is not null;
$$;
revoke all on function bakery_private.can_manage_catalogue(),bakery_private.is_staff() from public,anon;
grant execute on function bakery_private.can_manage_catalogue(),bakery_private.is_staff() to authenticated;

create table public.products (
 id text primary key check(length(id) between 1 and 100),
 slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(length(name) between 1 and 150),
 kind text not null check(kind in ('official-cake','catalogue')),
 category text not null check(length(category) between 1 and 100),
 categories text[] not null default '{}',description text not null default '' check(length(description)<=5000),
 base_price_cents bigint check(base_price_cents>=0),
 minimum_price_cents bigint check(minimum_price_cents>=0),maximum_price_cents bigint,
 currency text not null default 'ZAR' check(currency='ZAR'),
 status text not null default 'draft' check(status in ('draft','active','inactive','archived')),
 available_flavours text[] not null default '{}',display_order integer not null default 100 check(display_order>=0),
 featured boolean not null default false,designer_eligible boolean not null default false,
 catalogue_data jsonb not null check(jsonb_typeof(catalogue_data)='object'),
 version bigint not null default 1 check(version>=1),approved_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(maximum_price_cents is null or maximum_price_cents>=minimum_price_cents),
 check(kind<>'official-cake' or (minimum_price_cents is not null and maximum_price_cents is not null and minimum_price_cents=148000 and maximum_price_cents=195000))
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(),product_id text not null references public.products(id) on delete restrict,
 path text not null check(length(path) between 1 and 1000),alt text not null check(length(alt)<=300),
 display_order integer not null default 0 check(display_order>=0),
 variants jsonb not null default '{}' check(jsonb_typeof(variants)='object'),
 created_at timestamptz not null default now(),unique(product_id,path)
);
create table public.product_quantities (
 product_id text not null references public.products(id) on delete restrict,
 pieces integer not null check(pieces between 1 and 10000),price_cents bigint not null check(price_cents>=0),
 primary key(product_id,pieces)
);
create table public.design_templates (
 id text not null,version integer not null check(version>=1),
 product_id text not null references public.products(id) on delete restrict,
 configuration_version integer not null check(configuration_version between 1 and 3),
 structure jsonb not null check(jsonb_typeof(structure)='object'),
 decorations jsonb not null check(jsonb_typeof(decorations)='object'),
 colours jsonb not null check(jsonb_typeof(colours) in ('object','array')),
 materials jsonb not null check(jsonb_typeof(materials)='object'),
 configuration jsonb not null check(jsonb_typeof(configuration)='object'),
 published boolean not null default false,created_at timestamptz not null default now(),
 primary key(id,version)
);
create table public.pricing_versions (
 id text primary key,minimum_base_cents bigint not null check(minimum_base_cents=148000),
 maximum_base_cents bigint not null check(maximum_base_cents=195000),
 flavour_surcharges jsonb not null check(jsonb_typeof(flavour_surcharges)='object'),
 rules jsonb not null check(jsonb_typeof(rules)='object'),
 approved boolean not null default false,created_at timestamptz not null default now()
);
create table public.business_settings (
 id text primary key check(id='bakery'),contact jsonb not null check(jsonb_typeof(contact)='object'),
 opening_hours jsonb,delivery jsonb,notification_preferences jsonb,
 active_pricing_version text references public.pricing_versions(id),version bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table public.customers (
 id uuid primary key default gen_random_uuid(),auth_user_id uuid references auth.users(id),
 name text not null check(length(name) between 1 and 100),
 email text not null check(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 telephone text not null check(length(telephone) between 7 and 30),created_at timestamptz not null default now()
);
create table public.enquiries (
 id uuid primary key default gen_random_uuid(),reference text unique not null,
 customer_id uuid not null references public.customers(id),
 type text not null check(type in ('contact','cake','catering','designer','product')),
 message text not null check(length(message)<=5000),
 status text not null default 'new' check(status in ('new','in_review','responded','closed')),
 assigned_admin uuid references public.admin_accounts(user_id),
 submission_id uuid unique not null,body_hash text not null check(body_hash ~ '^[a-f0-9]{64}$'),
 consent_at timestamptz not null,submitted_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.quotations (
 id uuid primary key default gen_random_uuid(),reference text unique not null,
 enquiry_id uuid unique references public.enquiries(id),customer_id uuid not null references public.customers(id),
 product_id text references public.products(id),design_snapshot jsonb check(jsonb_typeof(design_snapshot)='object'),
 pricing_snapshot jsonb not null check(jsonb_typeof(pricing_snapshot)='object'),
 flavour text,special_instructions text not null default '' check(length(special_instructions)<=5000),
 event_details jsonb not null check(jsonb_typeof(event_details)='object'),event_date date,
 estimated_minimum_cents bigint check(estimated_minimum_cents>=0),estimated_maximum_cents bigint,
 confirmed_price_cents bigint check(confirmed_price_cents>=0),price_approved_by uuid references public.admin_accounts(user_id),
 status text not null default 'submitted' check(status in ('submitted','in_review','awaiting_customer','quoted','accepted','declined','cancelled')),
 version bigint not null default 1 check(version>=1),assigned_admin uuid references public.admin_accounts(user_id),
 submitted_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(estimated_maximum_cents is null or estimated_maximum_cents>=estimated_minimum_cents),
 check(status not in ('quoted','accepted') or (confirmed_price_cents is not null and price_approved_by is not null))
);
create table public.reference_files (
 id uuid primary key default gen_random_uuid(),quotation_id uuid not null references public.quotations(id),
 bucket_id text not null default 'customer-references' check(bucket_id='customer-references'),
 object_path text unique not null check(object_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$'),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 size_bytes integer not null check(size_bytes between 1 and 524288),created_at timestamptz not null default now()
);
create table public.quotation_notes (
 id uuid primary key default gen_random_uuid(),quotation_id uuid not null references public.quotations(id),
 author_id uuid not null references public.admin_accounts(user_id),
 text text not null check(length(text) between 1 and 3000),created_at timestamptz not null default now()
);
create table public.customer_communications (
 id uuid primary key default gen_random_uuid(),quotation_id uuid not null references public.quotations(id),
 author_id uuid not null references public.admin_accounts(user_id),
 channel text not null check(channel in ('email','phone','whatsapp','in_person')),
 summary text not null check(length(summary) between 1 and 3000),occurred_at timestamptz not null,created_at timestamptz not null default now()
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(),quotation_id uuid unique not null references public.quotations(id),
 scheduled_at timestamptz not null,status text not null check(status in ('confirmed','completed','cancelled')),
 confirmed_by uuid not null references public.admin_accounts(user_id),created_at timestamptz not null default now()
);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(),enquiry_id uuid references public.enquiries(id),
 quotation_id uuid references public.quotations(id),
 status text not null default 'pending' check(status in ('pending','processing','accepted','failed')),
 attempts integer not null default 0 check(attempts>=0),provider_message_id text,last_error_code text,
 next_attempt_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(enquiry_id is not null or quotation_id is not null)
);
create table public.audit_logs (
 id bigint generated always as identity primary key,actor_id uuid references auth.users(id),
 action text not null,entity_type text not null,entity_id text not null,
 changes jsonb not null default '{}' check(jsonb_typeof(changes)='object'),at timestamptz not null default now()
);
create table bakery_private.auth_rate_limits (
 key_hash text primary key check(key_hash ~ '^[a-f0-9]{64}$'),window_start timestamptz not null,attempts integer not null check(attempts>=1)
);
alter table bakery_private.auth_rate_limits enable row level security;

-- Deny anonymous reads/writes of all private customer, membership and audit data.
do $$ declare t text; begin
 foreach t in array array['products','product_images','product_quantities','design_templates','pricing_versions','business_settings','customers','enquiries','quotations','reference_files','quotation_notes','customer_communications','bookings','notification_outbox','audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
revoke all on public.admin_accounts from public,anon,authenticated;
grant all on public.admin_accounts to service_role;
grant select on public.admin_accounts to authenticated;
create policy own_membership on public.admin_accounts for select to authenticated using(user_id=(select auth.uid()));

grant select on public.products,public.product_images,public.product_quantities,public.design_templates,public.pricing_versions to anon,authenticated;
create policy public_products on public.products for select to anon,authenticated using(status='active' and approved_at is not null);
create policy staff_products on public.products for select to authenticated using((select bakery_private.is_staff()));
create policy public_images on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.approved_at is not null));
create policy staff_images on public.product_images for select to authenticated using((select bakery_private.is_staff()));
create policy public_quantities on public.product_quantities for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.approved_at is not null));
create policy staff_quantities on public.product_quantities for select to authenticated using((select bakery_private.is_staff()));
create policy public_templates on public.design_templates for select to anon,authenticated using(published and exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.approved_at is not null));
create policy staff_templates on public.design_templates for select to authenticated using((select bakery_private.is_staff()));
create policy public_pricing on public.pricing_versions for select to anon,authenticated using(approved);
create policy staff_pricing on public.pricing_versions for select to authenticated using((select bakery_private.is_staff()));

-- Business settings are private. Stage 9C exposes a whitelisted public DTO.
do $$ declare t text; begin
 foreach t in array array['business_settings','customers','enquiries','quotations','reference_files','quotation_notes','customer_communications','bookings'] loop
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy staff_read on public.%I for select to authenticated using ((select bakery_private.is_staff()))',t);
 end loop;
 foreach t in array array['products','product_images','product_quantities','design_templates','business_settings'] loop
  execute format('grant insert,update on public.%I to authenticated',t);
  execute format('create policy manage_insert on public.%I for insert to authenticated with check ((select bakery_private.can_manage_catalogue()))',t);
  execute format('create policy manage_update on public.%I for update to authenticated using ((select bakery_private.can_manage_catalogue())) with check ((select bakery_private.can_manage_catalogue()))',t);
 end loop;
end $$;
-- Pricing versions and design snapshots are immutable. New approved versions are appended.
grant insert on public.pricing_versions to authenticated;
create policy manage_pricing on public.pricing_versions for insert to authenticated with check((select bakery_private.can_manage_catalogue()));
grant insert on public.quotation_notes,public.customer_communications to authenticated;
create policy note_insert on public.quotation_notes for insert to authenticated with check(author_id=(select auth.uid()) and (select bakery_private.is_staff()));
create policy communication_insert on public.customer_communications for insert to authenticated with check(author_id=(select auth.uid()) and (select bakery_private.is_staff()));
grant select on public.audit_logs,public.notification_outbox to authenticated;
create policy audit_read on public.audit_logs for select to authenticated using((select bakery_private.can_manage_catalogue()));
create policy outbox_read on public.notification_outbox for select to authenticated using((select bakery_private.can_manage_catalogue()));

create function bakery_private.audit_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare identity text; details jsonb;
begin
 identity=coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'user_id',to_jsonb(new)->>'product_id','bakery');
 details=case when tg_table_name='quotations' then jsonb_build_object('status',to_jsonb(new)->'status','confirmed_price_cents',to_jsonb(new)->'confirmed_price_cents','version',to_jsonb(new)->'version')
  when tg_table_name='admin_accounts' then jsonb_build_object('role',to_jsonb(new)->'role','active',to_jsonb(new)->'active')
  when tg_table_name='products' then jsonb_build_object('operation',tg_op,'name',to_jsonb(new)->'name','status',to_jsonb(new)->'status','base_price_cents',to_jsonb(new)->'base_price_cents','minimum_price_cents',to_jsonb(new)->'minimum_price_cents','maximum_price_cents',to_jsonb(new)->'maximum_price_cents','version',to_jsonb(new)->'version')
  when tg_table_name='product_quantities' then jsonb_build_object('pieces',to_jsonb(new)->'pieces','price_cents',to_jsonb(new)->'price_cents')
  when tg_table_name='pricing_versions' then jsonb_build_object('minimum_base_cents',to_jsonb(new)->'minimum_base_cents','maximum_base_cents',to_jsonb(new)->'maximum_base_cents','flavour_surcharges',to_jsonb(new)->'flavour_surcharges','approved',to_jsonb(new)->'approved')
  else jsonb_build_object('operation',tg_op,'version',to_jsonb(new)->'version') end;
 if tg_op='UPDATE' then
  details=details||jsonb_build_object('previous',case when tg_table_name='quotations' then jsonb_build_object('status',to_jsonb(old)->'status','confirmed_price_cents',to_jsonb(old)->'confirmed_price_cents')
   when tg_table_name='admin_accounts' then jsonb_build_object('role',to_jsonb(old)->'role','active',to_jsonb(old)->'active')
   when tg_table_name='products' then jsonb_build_object('name',to_jsonb(old)->'name','status',to_jsonb(old)->'status','base_price_cents',to_jsonb(old)->'base_price_cents')
   when tg_table_name='product_quantities' then jsonb_build_object('pieces',to_jsonb(old)->'pieces','price_cents',to_jsonb(old)->'price_cents')
   else jsonb_build_object('version',to_jsonb(old)->'version') end);
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,changes)
 values(auth.uid(),lower(tg_op),tg_table_name,identity,details);
 return new;
end $$;
revoke all on function bakery_private.audit_change() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['admin_accounts','products','product_images','product_quantities','design_templates','pricing_versions','business_settings','enquiries','quotations','quotation_notes','customer_communications','bookings'] loop
  execute format('create trigger audited_change after insert or update on public.%I for each row execute function bakery_private.audit_change()',t);
 end loop;
end $$;

-- No role metadata from JWT user_metadata is trusted. Only the current table role counts.
create function public.set_admin_role(target_user uuid,new_role text,new_active boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if public.current_admin_role() is distinct from 'Owner' then raise exception 'Owner required' using errcode='42501'; end if;
 lock table public.admin_accounts in share row exclusive mode;
 if (not new_active or new_role<>'Owner') and exists(select 1 from public.admin_accounts where user_id=target_user and role='Owner' and active)
 and (select count(*) from public.admin_accounts where role='Owner' and active)<=1 then
  raise exception 'Cannot remove the last active owner';
 end if;
 if new_role is null or new_role not in ('Owner','Administrator','Staff') or new_active is null then raise exception 'Invalid role'; end if;
 insert into public.admin_accounts(user_id,role,active) values(target_user,new_role,new_active)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,updated_at=now();
end $$;
revoke all on function public.set_admin_role(uuid,text,boolean) from public,anon;
grant execute on function public.set_admin_role(uuid,text,boolean) to authenticated;

create function public.transition_quotation(quotation_id uuid,expected_version bigint,next_status text,approved_price_cents bigint default null)
returns public.quotations language plpgsql security definer set search_path='' as $$
declare q public.quotations; actor_role text=public.current_admin_role();
begin
 if actor_role is null then raise exception 'Administrator required' using errcode='42501'; end if;
 select * into q from public.quotations where id=quotation_id for update;
 if not found then raise exception 'Quotation not found'; end if;
 if q.version<>expected_version then raise exception 'Reload changed quotation' using errcode='40001'; end if;
 if not ((q.status='submitted' and next_status in ('in_review','declined','cancelled'))
  or (q.status='in_review' and next_status in ('awaiting_customer','quoted','declined','cancelled'))
  or (q.status='awaiting_customer' and next_status in ('in_review','quoted','declined','cancelled'))
  or (q.status='quoted' and next_status in ('in_review','accepted','declined','cancelled'))
  or (q.status='accepted' and next_status='cancelled')) then raise exception 'Invalid status transition'; end if;
 if approved_price_cents is not null then
  if actor_role not in ('Owner','Administrator') or approved_price_cents<0 then raise exception 'Price approval required' using errcode='42501'; end if;
  q.confirmed_price_cents=approved_price_cents;q.price_approved_by=auth.uid();
 end if;
 if next_status in ('quoted','accepted') and (q.confirmed_price_cents is null or q.price_approved_by is null) then raise exception 'Approve price before quoting'; end if;
 update public.quotations set status=next_status,confirmed_price_cents=q.confirmed_price_cents,price_approved_by=q.price_approved_by,version=version+1,updated_at=now()
 where id=quotation_id returning * into q;
 return q;
end $$;
revoke all on function public.transition_quotation(uuid,bigint,text,bigint) from public,anon;
grant execute on function public.transition_quotation(uuid,bigint,text,bigint) to authenticated;

-- Auth throttling is called only by the server service client, never the browser.
create function public.consume_auth_attempt(key_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare count integer;
begin
 delete from bakery_private.auth_rate_limits where window_start<now()-interval '24 hours';
 insert into bakery_private.auth_rate_limits as r values($1,date_trunc('minute',now()),1)
 on conflict on constraint auth_rate_limits_pkey do update set
 attempts=case when r.window_start<now()-interval '15 minutes' then 1 else r.attempts+1 end,
 window_start=case when r.window_start<now()-interval '15 minutes' then now() else r.window_start end
 returning attempts into count;
 return count<=10;
end $$;
revoke all on function public.consume_auth_attempt(text) from public,anon,authenticated;
grant execute on function public.consume_auth_attempt(text) to service_role;
revoke all on bakery_private.auth_rate_limits from public,anon,authenticated;
grant all on bakery_private.auth_rate_limits to service_role;
grant usage,select on sequence public.audit_logs_id_seq to service_role;

create index enquiries_submitted on public.enquiries(submitted_at desc);
create index enquiries_customer on public.enquiries(customer_id);
create index quotations_status_date on public.quotations(status,event_date);
create index quotations_customer on public.quotations(customer_id);
create index audit_entity on public.audit_logs(entity_type,entity_id,at desc);
create index notification_retry on public.notification_outbox(status,next_attempt_at);
create index catalogue_order on public.products(status,display_order,id);
create index auth_rate_expiry on bakery_private.auth_rate_limits(window_start);

create table public.admin_sessions (
 id uuid primary key,user_id uuid not null references auth.users(id),
 expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now()
);
alter table public.admin_sessions enable row level security;
revoke all on public.admin_sessions from public,anon,authenticated;
grant select on public.admin_sessions to authenticated;
grant all on public.admin_sessions to service_role;
create policy own_session on public.admin_sessions for select to authenticated using(user_id=(select auth.uid()));
create function public.register_admin_session(session_id uuid,session_expiry timestamptz)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not bakery_private.is_staff() or session_expiry<=now() or session_expiry>now()+interval '8 hours' then
  raise exception 'Invalid administrator session' using errcode='42501';
 end if;
 insert into public.admin_sessions(id,user_id,expires_at) values(session_id,auth.uid(),session_expiry);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'login','admin_sessions',session_id::text);
end $$;
create function public.revoke_admin_session(session_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.admin_sessions set revoked_at=now() where id=session_id and user_id=auth.uid();
end $$;
create function bakery_private.audit_session_revocation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.revoked_at is null and new.revoked_at is not null then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(new.user_id,'logout','admin_sessions',new.id::text);
 end if;
 return new;
end $$;
revoke all on function bakery_private.audit_session_revocation() from public,anon,authenticated;
create trigger session_revoked after update on public.admin_sessions for each row execute function bakery_private.audit_session_revocation();
revoke all on function public.register_admin_session(uuid,timestamptz),public.revoke_admin_session(uuid) from public,anon;
grant execute on function public.register_admin_session(uuid,timestamptz),public.revoke_admin_session(uuid) to authenticated;
create function public.is_invited_admin_email(candidate text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.admin_accounts a on u.id=a.user_id
 where lower(u.email)=lower(candidate) and a.active);
$$;
revoke all on function public.is_invited_admin_email(text) from public,anon,authenticated;
grant execute on function public.is_invited_admin_email(text) to service_role;
-- Single, atomic, reviewed bootstrap. Subsequent role changes require an Owner.
create function public.bootstrap_owner(target_user uuid,approved_email text)
returns void language plpgsql security definer set search_path='' as $$
begin
 lock table public.admin_accounts in share row exclusive mode;
 if not exists(select 1 from auth.users where id=target_user and lower(email)=lower(approved_email) and email_confirmed_at is not null) then
  raise exception 'Confirmed owner-approved identity required';
 end if;
 if exists(select 1 from public.admin_accounts where user_id=target_user and role='Owner' and active)
  and (select count(*) from public.admin_accounts)=1 then return; end if;
 if exists(select 1 from public.admin_accounts) then raise exception 'Initial bootstrap already completed'; end if;
 insert into public.admin_accounts(user_id,role,active) values(target_user,'Owner',true);
end $$;
revoke all on function public.bootstrap_owner(uuid,text) from public,anon,authenticated;
grant execute on function public.bootstrap_owner(uuid,text) to service_role;
commit;
