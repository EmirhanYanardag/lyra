alter table public.profiles
add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users can upload own avatar images" on storage.objects;
drop policy if exists "Users can update own avatar images" on storage.objects;
drop policy if exists "Users can delete own avatar images" on storage.objects;

create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatar images"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own avatar images"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own avatar images"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
