-- Counts only; no text. UTC daily limits, reservations retained on failure.
begin;
create table if not exists athar_private.rewrite_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 attempts integer not null check(attempts between 1 and 2),
 primary key(user_id,day)
);
alter table athar_private.rewrite_usage enable row level security;
revoke all on athar_private.rewrite_usage from public, anon, authenticated;
create or replace function athar_private.claim_rewrite_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); today date := (now() at time zone 'UTC')::date; used integer; total integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then return false; end if;
 perform pg_advisory_xact_lock(823654921);
 select coalesce(sum(attempts),0)::integer into total from athar_private.rewrite_usage where day=today;
 select attempts into used from athar_private.rewrite_usage where user_id=uid and day=today;
 if total>=50 or coalesce(used,0)>=2 then return false; end if;
 insert into athar_private.rewrite_usage(user_id,day,attempts) values(uid,today,1)
 on conflict(user_id,day) do update set attempts=rewrite_usage.attempts+1;
 return true;
end $$;
revoke all on function athar_private.claim_rewrite_quota() from public,anon;
grant usage on schema athar_private to authenticated;
grant execute on function athar_private.claim_rewrite_quota() to authenticated;
create or replace function public.claim_rewrite_quota()
returns boolean language sql security invoker set search_path = '' as $$select athar_private.claim_rewrite_quota()$$;
revoke all on function public.claim_rewrite_quota() from public,anon;
grant execute on function public.claim_rewrite_quota() to authenticated;
commit;
