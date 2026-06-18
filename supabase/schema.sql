create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  equipment_code text,
  inspection_result text not null,
  fault_code text,
  location text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  action_taken text not null,
  parts_required jsonb not null default '[]',
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('note', 'query', 'work_order')),
  transcript text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table if not exists kb_chunks (
  id text primary key,
  source text not null,
  chunk_index integer not null default 0,
  heading text,
  text text not null,
  char_count integer not null default 0,
  tokens_approx integer not null default 0,
  embedding jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists kb_chunks_source_idx on kb_chunks (source);

alter table work_orders enable row level security;
alter table activity_log enable row level security;
alter table kb_chunks enable row level security;
