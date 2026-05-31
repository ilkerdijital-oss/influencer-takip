create table if not exists influencer_records (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  instagram text default '',
  commission numeric default 0,
  product text default '',
  category text default '',
  channel text default 'Instagram',
  status text default 'teklif iletildi',
  followers numeric default 0,
  engagement numeric default 0,
  budget numeric default 0,
  revenue numeric default 0,
  date date default current_date,
  time text default to_char(now() at time zone 'Europe/Istanbul', 'HH24:MI'),
  code text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists panel_settings (
  key text primary key,
  value text default '',
  updated_at timestamptz default now()
);

alter table influencer_records enable row level security;
alter table panel_settings enable row level security;

alter table influencer_records
add column if not exists time text default to_char(now() at time zone 'Europe/Istanbul', 'HH24:MI');

drop policy if exists "team can read influencer records" on influencer_records;
drop policy if exists "team can insert influencer records" on influencer_records;
drop policy if exists "team can update influencer records" on influencer_records;
drop policy if exists "team can delete influencer records" on influencer_records;
drop policy if exists "team can read settings" on panel_settings;
drop policy if exists "team can upsert settings" on panel_settings;
drop policy if exists "team can update settings" on panel_settings;

create policy "team can read influencer records"
on influencer_records for select
to anon
using (true);

create policy "team can insert influencer records"
on influencer_records for insert
to anon
with check (true);

create policy "team can update influencer records"
on influencer_records for update
to anon
using (true)
with check (true);

create policy "team can delete influencer records"
on influencer_records for delete
to anon
using (true);

create policy "team can read settings"
on panel_settings for select
to anon
using (true);

create policy "team can upsert settings"
on panel_settings for insert
to anon
with check (true);

create policy "team can update settings"
on panel_settings for update
to anon
using (true)
with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'influencer_records'
  ) then
    alter publication supabase_realtime add table influencer_records;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'panel_settings'
  ) then
    alter publication supabase_realtime add table panel_settings;
  end if;
end $$;
