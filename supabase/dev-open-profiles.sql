-- Development-only patch for LYRA MVP debugging.
-- This opens profile reads to anon/authenticated clients and restores table grants.

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.agents to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant select, insert on public.agent_lineage to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "LYRA dev profiles public read" on public.profiles;
drop policy if exists "LYRA profiles select authenticated" on public.profiles;
drop policy if exists "Profiles are readable by authenticated users" on public.profiles;

create policy "LYRA dev profiles public read"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "LYRA dev profiles insert own" on public.profiles;
drop policy if exists "LYRA profiles insert own" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "LYRA dev profiles insert own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "LYRA dev profiles update own" on public.profiles;
drop policy if exists "LYRA profiles update own" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "LYRA dev profiles update own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
