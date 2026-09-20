-- ============================================================
-- Finances: migrar de localStorage a Supabase
-- Executar al SQL Editor del dashboard de Supabase
-- ============================================================

-- ── finance_settings (1 fila per usuari) ────────────────────
create table if not exists public.finance_settings (
  user_id               uuid references auth.users(id) on delete cascade not null primary key,
  margin_objective      numeric        not null default 50,
  allocation_mode       text           not null default 'proportional'
                          check (allocation_mode in ('proportional','equal')),
  monthly_accounting_totals jsonb      not null default '[]'::jsonb,
  created_at            timestamptz    not null default now(),
  updated_at            timestamptz    not null default now()
);

-- ── finance_records (N files per usuari) ────────────────────
create table if not exists public.finance_records (
  id              text           not null primary key,
  user_id         uuid           references auth.users(id) on delete cascade not null,
  client_id       uuid,          -- FK opcional a clients.id
  client_name     text           not null default '',
  tipo            text           not null default 'Recurrent'
                    check (tipo in ('Recurrent','Puntual')),
  estado          text           not null default 'Actiu'
                    check (estado in ('Actiu','Inactiu')),
  fee             numeric        not null default 0,
  iva_pct         numeric,
  margin_objective numeric       not null default 0,
  start_date      text           not null default '',
  end_date        text           not null default '',
  responsible     text           not null default '',
  services        text           not null default '',
  observations    text           not null default '',
  collaborators   jsonb          not null default '[]'::jsonb,
  other_costs     jsonb          not null default '[]'::jsonb,
  photo_url       text,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

create index if not exists finance_records_user_id_idx on public.finance_records(user_id);

-- ── finance_suppliers (N files per usuari) ──────────────────
create table if not exists public.finance_suppliers (
  id               text           not null primary key,
  user_id          uuid           references auth.users(id) on delete cascade not null,
  name             text           not null default '',
  category         text           not null default '',
  contact          text           not null default '',
  notes            text           not null default '',
  monthly_fee      numeric        not null default 0,
  structure_amount numeric        not null default 0,
  irpf_pct         numeric,
  iva_pct          numeric,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create index if not exists finance_suppliers_user_id_idx on public.finance_suppliers(user_id);

-- ── finance_structure_costs (N files per usuari) ────────────
create table if not exists public.finance_structure_costs (
  id                text           not null primary key,
  user_id           uuid           references auth.users(id) on delete cascade not null,
  name              text           not null default '',
  category          text           not null default '',
  amount            numeric        not null default 0,
  supplier_ref      text           not null default '',
  iva_pct           numeric,
  iva_deduible_pct  numeric,
  irpf_pct          numeric,
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now()
);

create index if not exists finance_structure_costs_user_id_idx on public.finance_structure_costs(user_id);

-- ── finance_fiscal_data (1 fila per usuari, JSONB) ──────────
create table if not exists public.finance_fiscal_data (
  user_id    uuid      references auth.users(id) on delete cascade not null primary key,
  data       jsonb     not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.finance_settings         enable row level security;
alter table public.finance_records          enable row level security;
alter table public.finance_suppliers        enable row level security;
alter table public.finance_structure_costs  enable row level security;
alter table public.finance_fiscal_data      enable row level security;

-- Policies: cada usuari només veu i edita les seves pròpies dades
create policy "finance_settings: own rows"
  on public.finance_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_records: own rows"
  on public.finance_records for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_suppliers: own rows"
  on public.finance_suppliers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_structure_costs: own rows"
  on public.finance_structure_costs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_fiscal_data: own rows"
  on public.finance_fiscal_data for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- updated_at automàtic (opcional però recomanat)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  create trigger finance_settings_updated_at
    before update on public.finance_settings
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger finance_records_updated_at
    before update on public.finance_records
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger finance_suppliers_updated_at
    before update on public.finance_suppliers
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger finance_structure_costs_updated_at
    before update on public.finance_structure_costs
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger finance_fiscal_data_updated_at
    before update on public.finance_fiscal_data
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
