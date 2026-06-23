grant select on public.profiles to anon, authenticated;
grant select on public.agents to anon, authenticated;
grant insert, update, delete on public.agents to authenticated;
grant select, insert on public.agent_lineage to authenticated;

alter table public.agents enable row level security;
alter table public.agent_lineage enable row level security;

drop policy if exists "LYRA mix agents select public" on public.agents;
drop policy if exists "LYRA mix agents select own" on public.agents;
drop policy if exists "LYRA mix agents insert own" on public.agents;
drop policy if exists "LYRA mix agents update own" on public.agents;
drop policy if exists "LYRA mix agents delete own" on public.agents;

create policy "LYRA mix agents select public"
on public.agents for select
to anon, authenticated
using (visibility = 'public');

create policy "LYRA mix agents select own"
on public.agents for select
to authenticated
using (owner_id = auth.uid());

create policy "LYRA mix agents insert own"
on public.agents for insert
to authenticated
with check (owner_id = auth.uid());

create policy "LYRA mix agents update own"
on public.agents for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "LYRA mix agents delete own"
on public.agents for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "LYRA mix lineage select public or own child" on public.agent_lineage;
drop policy if exists "LYRA mix lineage insert own child" on public.agent_lineage;

create policy "LYRA mix lineage select public or own child"
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

create policy "LYRA mix lineage insert own child"
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
