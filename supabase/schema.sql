create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null default 'original',
  topic text not null,
  topic_summary text,
  summary text,
  keywords text[] default '{}',
  personality_traits text[] default '{}',
  avatar_config jsonb default '{}'::jsonb,
  system_prompt text,
  source_agent_id uuid references public.agents(id) on delete set null,
  storage_hash text,
  visibility text not null default 'public',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint agents_type_check check (type in ('original', 'clone', 'mixed')),
  constraint agents_visibility_check check (visibility in ('public', 'private'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamptz default now(),
  constraint messages_role_check check (role in ('user', 'assistant', 'system'))
);

create table if not exists public.agent_lineage (
  id uuid primary key default gen_random_uuid(),
  child_agent_id uuid references public.agents(id) on delete cascade not null,
  parent_agent_id uuid references public.agents(id) on delete set null,
  percentage numeric default 100,
  relation_type text not null,
  parent_snapshot_name text,
  parent_snapshot_summary text,
  created_at timestamptz default now(),
  constraint agent_lineage_relation_type_check check (
    relation_type in ('clone', 'mix', 'original')
  )
);

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.messages enable row level security;
alter table public.agent_lineage enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Authenticated users can read public agents" on public.agents;
create policy "Authenticated users can read public agents"
on public.agents for select
to authenticated
using (visibility = 'public');

drop policy if exists "Users can read their own private agents" on public.agents;
create policy "Users can read their own private agents"
on public.agents for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their own agents" on public.agents;
create policy "Users can insert their own agents"
on public.agents for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their own agents" on public.agents;
create policy "Users can update their own agents"
on public.agents for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their own agents" on public.agents;
create policy "Users can delete their own agents"
on public.agents for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read messages for their agents" on public.messages;
create policy "Users can read messages for their agents"
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

drop policy if exists "Users can insert messages for their agents" on public.messages;
create policy "Users can insert messages for their agents"
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

drop policy if exists "Users can delete messages for their agents" on public.messages;
create policy "Users can delete messages for their agents"
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
create policy "Authenticated users can read allowed lineage"
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

drop policy if exists "Users can insert lineage for their child agents" on public.agent_lineage;
create policy "Users can insert lineage for their child agents"
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]+', '', 'g'));

  if base_username is null or length(base_username) < 3 then
    base_username := 'lyra_user';
  end if;

  candidate_username := base_username;

  while exists (
    select 1 from public.profiles where username = candidate_username
  ) loop
    candidate_username := base_username || '_' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate_username, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
