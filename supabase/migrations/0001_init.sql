-- cotizaciones-migration: initial schema
-- All objects prefixed tume_ (shared multi-project Supabase instance).

create type tume_role_enum as enum ('gerente_comercial','lider_cotizador','gerente_tecnico','cotizador');

create type tume_task_type_enum as enum (
  'recibir_solicitud','distribuir_solicitud','revisar_solicitud',
  'revisar_tdr','consultar_gerencia_tecnica','solicitar_informacion',
  'solicitar_visita_tecnica','evaluar_gerencia_tecnica','cotizar',
  'revisar_cotizacion_lider','revisar_cotizacion_gerencia',
  'enviar_cliente','enviar_no_cotizar'
);

create type tume_task_status_enum as enum ('pending','in_progress','done','skipped');
create type tume_case_stage_enum as enum ('solicitud','revision','cotizacion','cerrado');
create type tume_case_outcome_enum as enum ('en_proceso','adjudicado','desestimado','no_adjudicado');
create type tume_case_type_enum as enum ('servicio','bien');

create table tume_profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role tume_role_enum not null,
  created_at timestamptz not null default now()
);

create table tume_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ruc text,
  created_at timestamptz not null default now()
);

create table tume_cases (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  client_id uuid references tume_clients(id),
  title text not null,
  description text,
  type tume_case_type_enum not null,
  budget_usd numeric,
  is_express boolean not null default false,
  stage tume_case_stage_enum not null default 'solicitud',
  outcome tume_case_outcome_enum,
  current_task_type tume_task_type_enum not null default 'recibir_solicitud',
  requested_at timestamptz not null default now(),
  delivery_due_at timestamptz,
  awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tume_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references tume_cases(id),
  task_type tume_task_type_enum not null,
  assigned_role tume_role_enum not null,
  assigned_user_id uuid references tume_profiles(id),
  status tume_task_status_enum not null default 'pending',
  outcome text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table tume_case_transitions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references tume_cases(id),
  from_task_type tume_task_type_enum,
  to_task_type tume_task_type_enum,
  actor_id uuid references tume_profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create index tume_tasks_case_id_idx on tume_tasks (case_id);
create index tume_tasks_queue_idx on tume_tasks (assigned_role, status, case_id);
create index tume_case_transitions_case_id_idx on tume_case_transitions (case_id);
create index tume_cases_current_task_type_idx on tume_cases (current_task_type);

-- RLS: matches this project's existing convention (every table in this shared
-- instance has RLS enabled). v1 policy is permissive by design (see
-- sdd/tume/decisions — role-based restriction is an explicit Fase 2 follow-up,
-- not a v1 requirement): any authenticated user may read/write tume_* tables.
-- Actor identity is still captured via tume_tasks.assigned_user_id and
-- tume_case_transitions.actor_id, so nothing here is unaudited.

alter table tume_profiles enable row level security;
alter table tume_clients enable row level security;
alter table tume_cases enable row level security;
alter table tume_tasks enable row level security;
alter table tume_case_transitions enable row level security;

create policy tume_profiles_authenticated_all on tume_profiles
  for all to authenticated using (true) with check (true);

create policy tume_clients_authenticated_all on tume_clients
  for all to authenticated using (true) with check (true);

create policy tume_cases_authenticated_all on tume_cases
  for all to authenticated using (true) with check (true);

create policy tume_tasks_authenticated_all on tume_tasks
  for all to authenticated using (true) with check (true);

create policy tume_case_transitions_authenticated_all on tume_case_transitions
  for all to authenticated using (true) with check (true);
