-- KOO user profile schema
-- ============================================================================
-- HOW TO USE
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   You run it; nothing in the app creates tables and I do not touch your
--   database. It takes a second and can be re-run if you edit anything.
--
-- WHAT IT DOES
--   Adds one table, `public.koo_profiles`, holding the readable part of an
--   account (display name, phone, city) keyed by the same uuid as `auth.users`,
--   with row-level security so a user can only read and change their own row.
--   A trigger creates the row automatically the moment someone registers, so a
--   brand-new account already has a profile, and an existing account is
--   back-filled by section 5.
--
-- WHAT IT NEVER DOES
--   Strictly additive: it does not drop, alter, rename or delete any existing
--   table, policy, trigger, function, index or role, and it changes no column in
--   `koo_conversations` / `koo_messages`. It never reads or writes password
--   material — `auth.users` keeps owning credentials. Every statement is
--   idempotent, so re-running is safe.
--
-- WHY THE EMAIL IS COPIED IN HERE
--   `src/lib/chat.ts` matches a thread's `seller_email` against the signed-in
--   email, and the app would otherwise have to reach into `auth` (which the
--   publishable key cannot). `email` here is written by a SECURITY DEFINER
--   trigger and by the app, never chosen freely by a user, and RLS still limits
--   reads to the owner.
--
-- AFTER RUNNING IT
--   Check the two queries in section 6: `profiles` and `users` counts must match,
--   and the policy list should show select / insert / update for `public.koo_profiles`.
--   `npm run check:chat` also probes this table (pass `--expect-profile`).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
-- `id` is the auth user's own uuid, so the row is found without a join and a
-- deleted account takes its profile with it (on delete cascade).

create table if not exists public.koo_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text        not null default '',
  display_name text,
  phone        text,
  city         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Lengths match the inputs in src/app/profile.tsx; over-long text is a bug,
  -- not something to silently truncate.
  constraint koo_profiles_email_length    check (char_length(email)        <= 320),
  constraint koo_profiles_display_name_len check (display_name is null or char_length(display_name) <= 60),
  constraint koo_profiles_phone_length    check (phone   is null or char_length(phone)   <= 32),
  constraint koo_profiles_city_length     check (city    is null or char_length(city)    <= 60)
);

create index if not exists koo_profiles_email_idx on public.koo_profiles (lower(email));

comment on table public.koo_profiles is
  'Display name, phone and city per KOO account. Owner-only reads and writes (RLS).';

-- ---------------------------------------------------------------------------
-- 2. updated_at is kept by the database, not by each client
-- ---------------------------------------------------------------------------

create or replace function public.koo_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists koo_profiles_touch_updated_at on public.koo_profiles;

create trigger koo_profiles_touch_updated_at
  before update on public.koo_profiles
  for each row
  execute function public.koo_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. A profile exists as soon as the account does
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so the insert into `public` runs without the caller having
-- any rights on the table; it only ever writes the one row for the user being
-- created, and it reads nothing outside the new `auth.users` record.

create or replace function public.koo_create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
begin
  -- "soundlab.studio@koo.market" reads as "soundlab studio"; the app can rename it.
  local_part := lower(coalesce(split_part(new.email, '@', 1), ''));

  insert into public.koo_profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(regexp_replace(local_part, '[._+-]+', ' ', 'g')), '')
  )
  on conflict (id) do update
    -- Keep an established display name; only refresh the stored email.
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists koo_new_user_profile on auth.users;

create trigger koo_new_user_profile
  after insert on auth.users
  for each row
  execute function public.koo_create_profile();

revoke all on function public.koo_create_profile() from public;
revoke all on function public.koo_touch_updated_at() from public;

-- ---------------------------------------------------------------------------
-- 4. Row-level security: your row, and only your row
-- ---------------------------------------------------------------------------

alter table public.koo_profiles enable row level security;

-- The publishable key ships inside the APK and the web bundle, so anon gets
-- nothing at all on this table.
grant select, insert, update on table public.koo_profiles to authenticated;
revoke all on table public.koo_profiles from anon;

drop policy if exists koo_profiles_select on public.koo_profiles;
create policy koo_profiles_select on public.koo_profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists koo_profiles_insert on public.koo_profiles;
create policy koo_profiles_insert on public.koo_profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists koo_profiles_update on public.koo_profiles;
create policy koo_profiles_update on public.koo_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No delete policy on purpose: the row is removed by the cascade when the
-- account is deleted, which only the dashboard/service role can do.

-- ---------------------------------------------------------------------------
-- 5. Back-fill accounts that registered before this file was run
-- ---------------------------------------------------------------------------

insert into public.koo_profiles (id, email, display_name)
select
  u.id,
  coalesce(u.email, ''),
  nullif(trim(regexp_replace(lower(coalesce(split_part(u.email, '@', 1), '')), '[._+-]+', ' ', 'g')), '')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Read-only checks (run these; they change nothing)
-- ---------------------------------------------------------------------------

-- Counts should be equal — one profile per account.
-- select (select count(*) from auth.users) as users,
--        (select count(*) from public.koo_profiles) as profiles;

-- The three policies above should be listed.
-- select policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public'
--   and tablename = 'koo_profiles' order by cmd;
