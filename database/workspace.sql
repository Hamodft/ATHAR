-- Connected workspace, private feedback and administrator-only operations.
create schema if not exists athar_private;
revoke all on schema athar_private from public,anon;
grant usage on schema athar_private to authenticated;
create table athar_private.admin_emails(email text primary key check(email=lower(email)));
revoke all on athar_private.admin_emails from public,anon,authenticated;
insert into athar_private.admin_emails(email) values ('ahmadalshehrise@gmail.com');
create function athar_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users u join athar_private.admin_emails a on a.email=lower(u.email) where u.id=auth.uid() and u.email_confirmed_at is not null)
$$;
revoke all on function athar_private.is_admin() from public,anon;
grant execute on function athar_private.is_admin() to authenticated;
create function public.athar_is_admin() returns boolean language sql stable security invoker set search_path='' as $$select athar_private.is_admin()$$;
revoke all on function public.athar_is_admin() from public,anon;
grant execute on function public.athar_is_admin() to authenticated;

create table public.athar_suggestions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('idea','issue','feedback')),
 message text not null check(char_length(trim(message)) between 10 and 3000),
 status text not null default 'new' check(status in ('new','reviewing','planned','done','closed')),
 reply text not null default '' check(char_length(reply)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.athar_suggestions enable row level security;
revoke all on public.athar_suggestions from public,anon,authenticated;
grant select on public.athar_suggestions to authenticated;
grant insert(user_id,kind,message) on public.athar_suggestions to authenticated;
create policy suggestions_owner_read on public.athar_suggestions for select to authenticated using((select auth.uid())=user_id);
create policy suggestions_owner_insert on public.athar_suggestions for insert to authenticated with check((select auth.uid())=user_id);
create index athar_suggestions_user_created on public.athar_suggestions(user_id,created_at desc);

create function athar_private.athar_admin_data() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not athar_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object(
 'stats',jsonb_build_object('users',(select count(*) from auth.users),'drafts',(select count(*) from public.athar_drafts),'published',(select count(*) from public.athar_profiles where is_published),'suggestions',(select count(*) from public.athar_suggestions where status='new')),
 'users',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select u.id,u.email,u.created_at,(u.email_confirmed_at is not null) as confirmed,p.slug,p.is_published from auth.users u left join public.athar_profiles p on p.user_id=u.id order by u.created_at desc limit 200)x),
 'profiles',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select user_id,slug,content->>'name' as name,is_published,updated_at from public.athar_profiles order by updated_at desc limit 200)x),
 'suggestions',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select id,user_id,kind,message,status,reply,created_at from public.athar_suggestions order by created_at desc limit 100)x)
 );
end $$;
create function athar_private.athar_admin_feedback(feedback_id uuid,new_status text,admin_reply text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not athar_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.athar_suggestions set status=new_status,reply=admin_reply,updated_at=now() where id=feedback_id;
 if not found then raise exception 'Not found'; end if;
end $$;
create function athar_private.athar_admin_unpublish(profile_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not athar_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.athar_profiles set is_published=false,updated_at=now() where user_id=profile_id;
 if not found then raise exception 'Not found'; end if;
end $$;
revoke all on function athar_private.athar_admin_data() from public,anon;
revoke all on function athar_private.athar_admin_feedback(uuid,text,text) from public,anon;
revoke all on function athar_private.athar_admin_unpublish(uuid) from public,anon;
grant execute on function athar_private.athar_admin_data(),athar_private.athar_admin_feedback(uuid,text,text),athar_private.athar_admin_unpublish(uuid) to authenticated;
create function public.athar_admin_data() returns jsonb language sql security invoker set search_path='' as $$select athar_private.athar_admin_data()$$;
create function public.athar_admin_feedback(feedback_id uuid,new_status text,admin_reply text) returns void language sql security invoker set search_path='' as $$select athar_private.athar_admin_feedback(feedback_id,new_status,admin_reply)$$;
create function public.athar_admin_unpublish(profile_id uuid) returns void language sql security invoker set search_path='' as $$select athar_private.athar_admin_unpublish(profile_id)$$;
revoke all on function public.athar_admin_data(),public.athar_admin_feedback(uuid,text,text),public.athar_admin_unpublish(uuid) from public,anon;
grant execute on function public.athar_admin_data(),public.athar_admin_feedback(uuid,text,text),public.athar_admin_unpublish(uuid) to authenticated;
alter table public.athar_profiles drop constraint athar_profiles_content_check;
alter table public.athar_profiles add constraint athar_profiles_content_check check(jsonb_typeof(content)='object' and octet_length(content::text)<=100000 and (content-array['name','headline','work','goal','experiences','education','courses','skills','city','moment','momentDetail','theme','email','phone','layout','font','density','sectionOrder'])='{}'::jsonb);
