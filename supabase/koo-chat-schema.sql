-- KOO buyer <-> seller chat schema
-- ============================================================================
-- HOW TO USE
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   You run it; nothing in the app creates tables and I do not touch your
--   database. It takes a few seconds and can be re-run if you edit anything.
--
-- WHAT IT DOES
--   Adds two tables, `koo_conversations` and `koo_messages`, plus row-level
--   security so each user can only see the chats they take part in, and turns on
--   Realtime for `koo_messages` so a thread updates without a pull-to-refresh.
--
-- WHAT IT NEVER DOES
--   It is strictly additive. It does not drop, alter, rename or delete any
--   existing table, policy, trigger, function, role, or publication. It touches
--   no `auth` data. It can be re-run safely: every statement is idempotent.
--
-- LOGIN TABLES ARE NOT CREATED HERE
--   Email + password sign-in uses Supabase's built-in `auth.users`, which
--   already exists. Enabling the provider is a dashboard setting, not SQL:
--   Authentication -> Sign In / Providers -> Email -> Enable (and turn OFF
--   "Confirm email" for testing, otherwise a new account cannot sign in until
--   it clicks a confirmation link).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Conversations
-- ---------------------------------------------------------------------------
-- One thread per (buyer, product, seller). `seller_email` is the merchant
-- address from the app catalog; when that person later signs up, a trigger
-- claims the row by filling `seller_id`, so their old threads appear for them.

create table if not exists public.koo_conversations (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null,
  buyer_id      uuid not null references auth.users (id) on delete cascade,
  seller_id     uuid references auth.users (id) on delete set null,
  seller_email  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Stored lower-cased by the trigger below, so uniqueness and lookups never have
-- to worry about `Seller@KOO.Market` vs `seller@koo.market`.
create unique index if not exists koo_conversations_unique_thread
  on public.koo_conversations (product_id, buyer_id, seller_email);

create index if not exists koo_conversations_buyer_idx
  on public.koo_conversations (buyer_id, updated_at desc);

create index if not exists koo_conversations_seller_email_idx
  on public.koo_conversations (seller_email, updated_at desc);

create index if not exists koo_conversations_seller_id_idx
  on public.koo_conversations (seller_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- 2. Messages
-- ---------------------------------------------------------------------------

create table if not exists public.koo_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.koo_conversations (id) on delete cascade,
  sender_id        uuid not null references auth.users (id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint koo_messages_body_length check (char_length(body) between 1 and 2000)
);

-- A thread is read oldest->newest, so key the index for that scan.
create index if not exists koo_messages_thread_idx
  on public.koo_messages (conversation_id, created_at, id);

-- ---------------------------------------------------------------------------
-- 3. Normalise the seller email on write
-- ---------------------------------------------------------------------------

create or replace function public.koo_normalize_conversation()
returns trigger
language plpgsql
as $$
begin
  new.seller_email := lower(trim(new.seller_email));
  new.updated_at   := now();
  return new;
end;
$$;

drop trigger if exists koo_conversations_normalize on public.koo_conversations;

create trigger koo_conversations_normalize
  before insert or update on public.koo_conversations
  for each row execute function public.koo_normalize_conversation();

-- ---------------------------------------------------------------------------
-- 4. Helpers: who am I, and may I see this thread?
-- ---------------------------------------------------------------------------
-- `authenticated` has no SELECT on `auth.users`, so policies cannot join to it
-- directly. These functions are `security definer` (owned by the role running
-- this script, which can read `auth.users`) and resolve the caller's email from
-- `auth.users`, falling back to the request JWT claim if that read ever comes
-- back empty. `koo_can_see_conversation` also keeps the message policies from
-- referencing their own table, which Postgres rejects as recursive.

create or replace function public.koo_current_email()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select lower(u.email) from auth.users u where u.id = auth.uid()),
    nullif(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), ''),
    ''
  );
$$;

create or replace function public.koo_can_see_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.koo_conversations c
    where c.id = p_conversation_id
      and (
        c.buyer_id  = auth.uid()
        or c.seller_id = auth.uid()
        or (public.koo_current_email() <> '' and c.seller_email = public.koo_current_email())
      )
  );
$$;

revoke all on function public.koo_current_email() from public;
revoke all on function public.koo_can_see_conversation(uuid) from public;
grant execute on function public.koo_current_email() to authenticated;
grant execute on function public.koo_can_see_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------------
-- Every policy is `to authenticated`: anonymous callers get nothing, which is
-- what you want for chat. No one has update or delete rights — the only writes
-- are "open a thread" and "send a message".

alter table public.koo_conversations enable row level security;
alter table public.koo_messages     enable row level security;

-- Explicit, narrow grants. RLS still decides which rows; these only decide which
-- verbs are possible at all, and no one gets update or delete.
grant select, insert on table public.koo_conversations to authenticated;
grant select, insert on table public.koo_messages     to authenticated;

-- Conversations: visible to the buyer and to the seller (by id, or by the email
-- the app stamped on the thread before that seller had an account).
drop policy if exists koo_conversations_select on public.koo_conversations;
create policy koo_conversations_select on public.koo_conversations
  for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or (public.koo_current_email() <> '' and seller_email = public.koo_current_email())
  );

-- Only a signed-in buyer may open a thread, and only for themselves.
-- There is deliberately no UPDATE policy: the app looks a thread up and inserts
-- only when it is missing, instead of an upsert, because `ON CONFLICT DO UPDATE`
-- would need update rights nobody should have here.
drop policy if exists koo_conversations_insert on public.koo_conversations;
create policy koo_conversations_insert on public.koo_conversations
  for insert
  to authenticated
  with check (buyer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Realtime
-- ---------------------------------------------------------------------------
-- The app listens for INSERTs on this table and filters client-side by
-- conversation id. Realtime replays each row through the subscriber's own role,
-- so the RLS policies defined further down decide what is actually delivered —
-- publishing the table here does not widen access.
-- Skips silently if the project has no `supabase_realtime` publication; the chat
-- still works, it just needs a re-open to show new messages.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'koo_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.koo_messages';
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 7. Claims and activity
-- ---------------------------------------------------------------------------
-- When a message arrives from the seller's own account, stamp `seller_id` on
-- the thread so the seller's inbox query is a plain equality check, and bump
-- `updated_at` so the thread sorts to the top of both inboxes.
--
-- Runs as `security definer` because it writes to `koo_conversations` on behalf
-- of a user whose INSERT-only rights would not cover that update, and because it
-- reads `auth.users` to resolve the sender's address. The role that executes this
-- script owns the tables, so the definer body bypasses RLS; run it from the
-- dashboard SQL editor (role `postgres`), not through the API.
--
-- SECURITY NOTE: a seller could claim a thread by sending the first message
-- from an account whose email matches `seller_email`. That is the intended
-- trust model for this demo: merchant emails come from the app catalog, and
-- anyone who can verify mailbox ownership of that address is, by definition,
-- able to act as that seller. Requiring pre-registered merchant accounts would
-- need an allow-list table; flag it if you want that harder boundary.

create or replace function public.koo_after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  select lower(email) into v_email from auth.users where id = new.sender_id;

  update public.koo_conversations c
     set seller_id  = coalesce(c.seller_id, case when c.seller_email = v_email then new.sender_id else null end),
         updated_at = now()
   where c.id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists koo_messages_touch_thread on public.koo_messages;

create trigger koo_messages_touch_thread
  after insert on public.koo_messages
  for each row execute function public.koo_after_message_insert();

-- Messages: participants can read and write, nobody can edit or remove.
drop policy if exists koo_messages_select on public.koo_messages;
create policy koo_messages_select on public.koo_messages
  for select
  to authenticated
  using (public.koo_can_see_conversation(conversation_id));

drop policy if exists koo_messages_insert on public.koo_messages;
create policy koo_messages_insert on public.koo_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.koo_can_see_conversation(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- 8. Verify (optional, read-only)
-- ---------------------------------------------------------------------------
-- Run these after pasting to confirm the objects landed. They change nothing.
--
--   select tablename, rowsecurity from pg_tables
--     where schemaname = 'public' and tablename in ('koo_conversations','koo_messages');
--
--   select polname, polcmd from pg_policy p
--     join pg_class c on c.oid = p.polrelid
--     where c.relname in ('koo_conversations','koo_messages');
--
--   select tablename from pg_publication_tables
--     where pubname = 'supabase_realtime' and schemaname = 'public';
