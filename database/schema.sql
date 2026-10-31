
create table public.athar_drafts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<=150000),
 version bigint not null default 1 check(version>0),
 updated_at timestamptz not null default now()
);
alter table public.athar_drafts enable row level security;
revoke all on public.athar_drafts from anon;
grant select,insert,update,delete on public.athar_drafts to authenticated;
create policy drafts_owner_select on public.athar_drafts for select to authenticated using ((select auth.uid())=user_id);
create policy drafts_owner_insert on public.athar_drafts for insert to authenticated with check ((select auth.uid())=user_id);
create policy drafts_owner_update on public.athar_drafts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy drafts_owner_delete on public.athar_drafts for delete to authenticated using ((select auth.uid())=user_id);

create table public.athar_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
 content jsonb not null default '{}'::jsonb check (jsonb_typeof(content)='object' and octet_length(content::text)<=100000 and (content - array['name','work','goal','experiences','education','courses','skills','city','moment','momentDetail','theme','email','phone'])='{}'::jsonb),
 avatar_path text check (avatar_path is null or avatar_path like user_id::text || '/%'),
 is_published boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.athar_profiles enable row level security;
grant select on public.athar_profiles to anon,authenticated;
grant insert,update,delete on public.athar_profiles to authenticated;
create policy profiles_visible on public.athar_profiles for select to anon,authenticated using (is_published or (select auth.uid())=user_id);
create policy profiles_owner_insert on public.athar_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_owner_update on public.athar_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy profiles_owner_delete on public.athar_profiles for delete to authenticated using ((select auth.uid())=user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('athar-avatars','athar-avatars',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy avatars_owner_insert on storage.objects for insert to authenticated with check (bucket_id='athar-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_owner_update on storage.objects for update to authenticated using (bucket_id='athar-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='athar-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_owner_delete on storage.objects for delete to authenticated using (bucket_id='athar-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_read_access on storage.objects for select to anon,authenticated using (
 bucket_id='athar-avatars' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(
 select 1 from public.athar_profiles p where p.is_published and p.avatar_path=name
 )));

