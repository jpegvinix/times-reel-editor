create table if not exists public.teams (
  id text primary key,
  nome text not null,
  arquivo_escudo text,
  escudo_url text,
  cidade text,
  estadio text,
  serie text,
  source text not null default 'seeded',
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams"
on public.teams
for select
to anon, authenticated
using (true);
