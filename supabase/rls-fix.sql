alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.messages enable row level security;
alter table public.agent_lineage enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "LYRA profiles select authenticated" on public.profiles;
drop policy if exists "LYRA profiles insert own" on public.profiles;
drop policy if exists "LYRA profiles update own" on public.profiles;

create policy "LYRA profiles select authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "LYRA profiles insert own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "LYRA profiles update own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Authenticated users can read public agents" on public.agents;
drop policy if exists "Users can read their own private agents" on public.agents;
drop policy if exists "Users can insert their own agents" on public.agents;
drop policy if exists "Users can update their own agents" on public.agents;
drop policy if exists "Users can delete their own agents" on public.agents;
drop policy if exists "LYRA agents select public" on public.agents;
drop policy if exists "LYRA agents select own" on public.agents;
drop policy if exists "LYRA agents insert own" on public.agents;
drop policy if exists "LYRA agents update own" on public.agents;
drop policy if exists "LYRA agents delete own" on public.agents;

create policy "LYRA agents select public"
on public.agents for select
to authenticated
using (visibility = 'public');

create policy "LYRA agents select own"
on public.agents for select
to authenticated
using (owner_id = auth.uid());

create policy "LYRA agents insert own"
on public.agents for insert
to authenticated
with check (owner_id = auth.uid());

create policy "LYRA agents update own"
on public.agents for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "LYRA agents delete own"
on public.agents for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read messages for their agents" on public.messages;
drop policy if exists "Users can insert messages for their agents" on public.messages;
drop policy if exists "Users can delete messages for their agents" on public.messages;
drop policy if exists "LYRA messages select own agents" on public.messages;
drop policy if exists "LYRA messages insert own agents" on public.messages;
drop policy if exists "LYRA messages delete own agents" on public.messages;

create policy "LYRA messages select own agents"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.agents
    where agents.id = messages.agent_id
      and agents.owner_id = auth.uid()
  )
);

create policy "LYRA messages insert own agents"
on public.messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.agents
    where agents.id = messages.agent_id
      and agents.owner_id = auth.uid()
  )
);

create policy "LYRA messages delete own agents"
on public.messages for delete
to authenticated
using (
  exists (
    select 1
    from public.agents
    where agents.id = messages.agent_id
      and agents.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read allowed lineage" on public.agent_lineage;
drop policy if exists "Users can insert lineage for their child agents" on public.agent_lineage;
drop policy if exists "LYRA lineage select public or own child" on public.agent_lineage;
drop policy if exists "LYRA lineage insert own child" on public.agent_lineage;

create policy "LYRA lineage select public or own child"
on public.agent_lineage for select
to authenticated
using (
  exists (
    select 1
    from public.agents
    where agents.id = agent_lineage.child_agent_id
      and (
        agents.visibility = 'public'
        or agents.owner_id = auth.uid()
      )
  )
);

create policy "LYRA lineage insert own child"
on public.agent_lineage for insert
to authenticated
with check (
  exists (
    select 1
    from public.agents
    where agents.id = agent_lineage.child_agent_id
      and agents.owner_id = auth.uid()
  )
);
