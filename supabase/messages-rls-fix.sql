grant select, insert, delete on public.messages to authenticated;

alter table public.messages enable row level security;

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
