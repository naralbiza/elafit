-- =====================================================================
-- Ela Fit — Schema Supabase
-- Colar no Supabase Dashboard → SQL Editor → New query → Run.
-- O script é idempotente: pode ser executado mais do que uma vez.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PERFIS DE UTILIZADOR (ligados a auth.users)
-- ---------------------------------------------------------------------
-- Módulos válidos (tem de coincidir com src/auth/modules.ts)
create or replace function public.app_modules()
returns text[]
language sql
immutable
as $$
  select array['overview','crm','finance','hr','classes','evaluations','plans','marketing','reports','ai']::text[];
$$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  job_title   text not null default '',
  avatar_url  text,
  is_admin    boolean not null default false,
  active      boolean not null default true,
  permissions text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_permissions_valid check (permissions <@ public.app_modules())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Cria o perfil automaticamente quando um utilizador é criado em auth.users.
-- O PRIMEIRO utilizador criado torna-se administrador com acesso total.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;

  insert into public.profiles (id, email, full_name, job_title, is_admin, permissions)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'job_title', case when first_user then 'Administradora' else '' end),
    first_user,
    case when first_user then public.app_modules() else '{}'::text[] end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. FUNÇÕES DE AUTORIZAÇÃO (usadas pelas políticas RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and is_admin);
$$;

-- true se o utilizador ativo é admin ou tem pelo menos um dos módulos indicados
create or replace function public.has_any_module(modules text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and (is_admin or permissions && modules)
  );
$$;

-- ---------------------------------------------------------------------
-- 3. TABELAS DE DADOS DO GINÁSIO
-- ---------------------------------------------------------------------
create table if not exists public.members (
  id                          text primary key default ('M-' || gen_random_uuid()),
  name                        text not null,
  email                       text not null default '',
  phone                       text not null default '',
  nif                         text,
  birth_date                  date,
  lead_status                 text not null default 'novo_lead'
                                check (lead_status in ('novo_lead','aula_experimental','proposta_enviada','matriculada','perdida')),
  member_status               text not null default 'ativa'
                                check (member_status in ('ativa','suspensa','pendente_renovacao','inativa')),
  plan                        text not null,
  monthly_fee                 numeric(12,2) not null default 0,
  start_date                  date,
  renewal_date                date,
  assigned_trainer_id         text,
  assigned_trainer_name       text,
  attendance_count_this_month integer not null default 0,
  last_attendance_date        date,
  emergency_contact           jsonb not null default '{"name":"","phone":"","relation":""}'::jsonb,
  evaluations                 jsonb not null default '[]'::jsonb,
  notes                       text not null default '',
  created_at                  date not null default current_date,
  created_by                  uuid default auth.uid() references auth.users(id) on delete set null
);

create table if not exists public.transactions (
  id             text primary key default ('TX-' || gen_random_uuid()),
  description    text not null,
  amount         numeric(12,2) not null,
  type           text not null check (type in ('receita','despesa')),
  category       text not null,
  date           date not null default current_date,
  status         text not null default 'pendente' check (status in ('pago','pendente','atrasado')),
  member_id      text references public.members(id) on delete set null,
  member_name    text,
  payment_method text not null,
  receipt_number text,
  created_by     uuid default auth.uid() references auth.users(id) on delete set null
);

create table if not exists public.employees (
  id                       text primary key default ('EMP-' || gen_random_uuid()),
  name                     text not null,
  role                     text not null,
  email                    text not null default '',
  phone                    text not null default '',
  avatar_url               text,
  contract_type            text not null,
  base_salary              numeric(12,2) not null default 0,
  pt_bonus_rate            numeric(12,2) not null default 0,
  classes_given_this_month integer not null default 0,
  pt_sessions_this_month   integer not null default 0,
  hire_date                date,
  status                   text not null default 'Ativa' check (status in ('Ativa','De Férias','Baixa Médica')),
  weekly_hours             integer not null default 0,
  certifications           text[] not null default '{}'
);

create table if not exists public.shifts (
  id            text primary key default ('S-' || gen_random_uuid()),
  employee_id   text references public.employees(id) on delete cascade,
  employee_name text not null,
  day           text not null check (day in ('Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo')),
  shift_type    text not null,
  assigned_area text not null
);

create table if not exists public.classes (
  id              text primary key default ('CLS-' || gen_random_uuid()),
  title           text not null,
  instructor_name text not null,
  category        text not null,
  day_of_week     text not null check (day_of_week in ('Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo')),
  time            text not null,
  room            text not null,
  capacity        integer not null default 0,
  enrolled_count  integer not null default 0,
  color           text not null default '#303227'
);

create table if not exists public.ai_insights (
  id              text primary key default ('AI-' || gen_random_uuid()),
  category        text not null check (category in ('CRM','Financeiro','RH','Estratégia')),
  title           text not null,
  summary         text not null,
  actionable_step text not null,
  impact_score    text not null check (impact_score in ('Alta','Média','Info')),
  timestamp       text not null default ''
);

create index if not exists transactions_date_idx on public.transactions (date desc);
create index if not exists transactions_member_idx on public.transactions (member_id);
create index if not exists shifts_employee_idx on public.shifts (employee_id);

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.members      enable row level security;
alter table public.transactions enable row level security;
alter table public.employees    enable row level security;
alter table public.shifts       enable row level security;
alter table public.classes      enable row level security;
alter table public.ai_insights  enable row level security;

-- PROFILES: cada um vê o seu perfil; admin vê todos.
-- Não há políticas de escrita: criar/alterar utilizadores e permissões
-- só é possível pelo servidor (service role), em /api/admin/users.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- MEMBERS: leitura para qualquer utilizador ativo;
-- escrita para CRM, Avaliações, Marketing ou Planos.
drop policy if exists members_select on public.members;
create policy members_select on public.members
  for select to authenticated using (public.is_active_user());

drop policy if exists members_write on public.members;
create policy members_write on public.members
  for all to authenticated
  using (public.has_any_module(array['crm','evaluations','marketing','plans']))
  with check (public.has_any_module(array['crm','evaluations','marketing','plans']));

-- TRANSACTIONS: leitura para Visão Geral, Financeiro, Planos, Relatórios e IA;
-- escrita para Financeiro ou Planos.
drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (public.has_any_module(array['overview','finance','plans','reports','ai']));

drop policy if exists transactions_write on public.transactions;
create policy transactions_write on public.transactions
  for all to authenticated
  using (public.has_any_module(array['finance','plans']))
  with check (public.has_any_module(array['finance','plans']));

-- EMPLOYEES (contém salários): leitura para RH e IA; escrita só RH.
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated using (public.has_any_module(array['hr','ai']));

drop policy if exists employees_write on public.employees;
create policy employees_write on public.employees
  for all to authenticated
  using (public.has_any_module(array['hr']))
  with check (public.has_any_module(array['hr']));

-- SHIFTS: só RH.
drop policy if exists shifts_all on public.shifts;
create policy shifts_all on public.shifts
  for all to authenticated
  using (public.has_any_module(array['hr']))
  with check (public.has_any_module(array['hr']));

-- CLASSES: leitura para qualquer utilizador ativo; escrita para Aulas.
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select to authenticated using (public.is_active_user());

drop policy if exists classes_write on public.classes;
create policy classes_write on public.classes
  for all to authenticated
  using (public.has_any_module(array['classes']))
  with check (public.has_any_module(array['classes']));

-- AI INSIGHTS: leitura para qualquer utilizador ativo; escrita para IA.
drop policy if exists ai_insights_select on public.ai_insights;
create policy ai_insights_select on public.ai_insights
  for select to authenticated using (public.is_active_user());

drop policy if exists ai_insights_write on public.ai_insights;
create policy ai_insights_write on public.ai_insights
  for all to authenticated
  using (public.has_any_module(array['ai']))
  with check (public.has_any_module(array['ai']));

-- ---------------------------------------------------------------------
-- 5. REALTIME (sincronização entre utilizadores em tempo real)
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['members','transactions','employees','shifts','classes','ai_insights'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
