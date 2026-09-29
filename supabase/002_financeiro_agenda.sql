-- =====================================================================
-- Ela Fit — Migração 002: Financeiro completo, impostos, salários,
-- planos, despesas fixas e agenda de aulas.
-- Executar DEPOIS de schema.sql. Idempotente: pode ser executado várias vezes.
-- Supabase Dashboard → SQL Editor → New query → colar → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Novo módulo "agenda"
-- ---------------------------------------------------------------------
create or replace function public.app_modules()
returns text[]
language sql
immutable
as $$
  select array['overview','crm','finance','hr','classes','agenda','evaluations','plans','marketing','reports','ai']::text[];
$$;

-- A restrição usa a função; recriá-la para validar com a nova lista
alter table public.profiles drop constraint if exists profiles_permissions_valid;
alter table public.profiles add constraint profiles_permissions_valid check (permissions <@ public.app_modules());

-- Administradores recebem sempre todos os módulos
update public.profiles set permissions = public.app_modules() where is_admin;

-- ---------------------------------------------------------------------
-- 2. Transações: IVA, conta financeira, centro de custo, fornecedor, vencimento
-- ---------------------------------------------------------------------
alter table public.transactions add column if not exists vat_rate       numeric(5,2) not null default 0;
alter table public.transactions add column if not exists account        text not null default 'Caixa';
alter table public.transactions add column if not exists cost_center    text not null default 'Geral';
alter table public.transactions add column if not exists supplier       text;
alter table public.transactions add column if not exists due_date       date;
alter table public.transactions add column if not exists notes          text not null default '';
alter table public.transactions add column if not exists payroll_run_id text;
alter table public.transactions add column if not exists recurring_id   text;

create index if not exists transactions_payroll_idx on public.transactions (payroll_run_id);

-- ---------------------------------------------------------------------
-- 3. Colaboradoras: dados fiscais para o recibo de vencimento
-- ---------------------------------------------------------------------
alter table public.employees add column if not exists nif         text;
alter table public.employees add column if not exists iban        text;
alter table public.employees add column if not exists inss_number text;
alter table public.employees add column if not exists allowances  numeric(12,2) not null default 0; -- subsídios fixos mensais

-- ---------------------------------------------------------------------
-- 4. Configurações financeiras e fiscais (linha única, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.finance_settings (
  id                         integer primary key default 1 check (id = 1),
  company_name               text not null default 'Ela Fit — Ginásio Feminino',
  company_nif                text not null default '',
  company_address            text not null default 'Luanda, Angola',
  company_phone              text not null default '',
  company_email              text not null default '',
  -- Taxas (%)
  iva_rate                   numeric(5,2) not null default 14,   -- IVA taxa geral
  prices_include_iva         boolean not null default true,      -- preços de venda já incluem IVA
  industrial_tax_rate        numeric(5,2) not null default 25,   -- Imposto Industrial sobre o lucro
  inss_employee_rate         numeric(5,2) not null default 3,    -- Segurança Social (trabalhador)
  inss_employer_rate         numeric(5,2) not null default 8,    -- Segurança Social (entidade patronal)
  services_withholding_rate  numeric(5,2) not null default 6.5,  -- Retenção na fonte s/ prestação de serviços
  -- Tabela de IRT (Grupo A): [{ "from": 0, "fixed": 0, "rate": 0 }, ...] — excesso sobre "from"
  irt_brackets               jsonb not null default '[
    {"from": 0,        "fixed": 0,       "rate": 0},
    {"from": 100000,   "fixed": 0,       "rate": 13},
    {"from": 150000,   "fixed": 12500,   "rate": 16},
    {"from": 200000,   "fixed": 31250,   "rate": 18},
    {"from": 300000,   "fixed": 49250,   "rate": 19},
    {"from": 500000,   "fixed": 87250,   "rate": 20},
    {"from": 1000000,  "fixed": 187249,  "rate": 21},
    {"from": 1500000,  "fixed": 292249,  "rate": 22},
    {"from": 2000000,  "fixed": 402249,  "rate": 23},
    {"from": 2500000,  "fixed": 517249,  "rate": 24},
    {"from": 5000000,  "fixed": 1117249, "rate": 24.5},
    {"from": 10000000, "fixed": 2342248, "rate": 25}
  ]'::jsonb,
  -- Contas financeiras (caixa e bancos) e centros de custo (serviços)
  accounts                   text[] not null default array['Caixa','Banco BAI','Banco BFA','Multicaixa Express'],
  cost_centers               text[] not null default array['Geral','Musculação','Pilates Reformer','Personal Training','Aulas de Grupo','Avaliações Físicas','Bar & Suplementos'],
  -- Metas do painel inicial
  goal_active_members        integer not null default 250,
  goal_monthly_revenue       numeric(14,2) not null default 3000000,
  goal_retention_rate        numeric(5,2) not null default 90,
  updated_at                 timestamptz not null default now()
);

insert into public.finance_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists finance_settings_touch on public.finance_settings;
create trigger finance_settings_touch
  before update on public.finance_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 5. Planos comerciais
-- ---------------------------------------------------------------------
create table if not exists public.plans (
  id              text primary key default ('PL-' || gen_random_uuid()),
  name            text not null unique,
  price           numeric(12,2) not null default 0,
  description     text not null default '',
  tag             text not null default '',
  duration_months integer not null default 1,
  cost_center     text not null default 'Musculação',
  active          boolean not null default true,
  sort_order      integer not null default 0
);

insert into public.plans (id, name, price, description, tag, duration_months, cost_center, sort_order) values
  ('PL-LIVRE',   'Ela Fit Livre',            35000,  'Acesso livre a musculação & aulas de grupo',                    'Popular',       1, 'Musculação',        1),
  ('PL-VIP',     'Ela Fit Anual VIP',        45000,  'Livre + 1 Avaliação Física Mensal + Desconto em Pilates',       'Melhor Valor', 12, 'Musculação',        2),
  ('PL-PILATES', 'Ela Fit Pilates Reformer', 65000,  'Acesso ilimitado ao Studio Reformer + Treino Funcional',        'Especializado', 1, 'Pilates Reformer',  3),
  ('PL-PT10',    'Pacote 10 PT',             180000, '10 Sessões Individuais com Personal Trainer, horário flexível', 'Personalizado', 1, 'Personal Training', 4),
  ('PL-SEMANAL', 'Passe Semanal',            12000,  'Acesso livre durante 7 dias',                                   'Experimentar',  0, 'Musculação',        5)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6. Despesas fixas / recorrentes (renda, luz, água, internet, ...)
-- ---------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id             text primary key default ('RE-' || gen_random_uuid()),
  description    text not null,
  category       text not null,
  amount         numeric(12,2) not null,
  vat_rate       numeric(5,2) not null default 0,
  account        text not null default 'Banco BAI',
  cost_center    text not null default 'Geral',
  supplier       text,
  payment_method text not null default 'Transferência Bancária',
  day_of_month   integer not null default 5 check (day_of_month between 1 and 28),
  active         boolean not null default true
);

-- ---------------------------------------------------------------------
-- 7. Processamento salarial mensal (com IRT e Segurança Social)
-- ---------------------------------------------------------------------
create table if not exists public.payroll_runs (
  id               text primary key default ('PR-' || gen_random_uuid()),
  month            text not null check (month ~ '^\d{4}-\d{2}$'),   -- 'AAAA-MM'
  employee_id      text references public.employees(id) on delete set null,
  employee_name    text not null,
  role             text not null default '',
  contract_type    text not null default '',
  base_salary      numeric(12,2) not null default 0,
  classes_count    integer not null default 0,
  pt_sessions      integer not null default 0,
  bonus_rate       numeric(12,2) not null default 0,
  commissions      numeric(12,2) not null default 0,
  allowances       numeric(12,2) not null default 0,
  gross            numeric(12,2) not null default 0,
  inss_employee    numeric(12,2) not null default 0,
  inss_employer    numeric(12,2) not null default 0,
  irt              numeric(12,2) not null default 0,
  withholding      numeric(12,2) not null default 0,
  other_deductions numeric(12,2) not null default 0,
  net              numeric(12,2) not null default 0,
  status           text not null default 'processado' check (status in ('processado','pago')),
  paid_at          date,
  created_at       timestamptz not null default now(),
  unique (month, employee_id)
);

-- ---------------------------------------------------------------------
-- 8. Agenda: sessões de aula com data (planificação semanal)
-- ---------------------------------------------------------------------
create table if not exists public.class_sessions (
  id              text primary key default ('SES-' || gen_random_uuid()),
  date            date not null,
  start_time      text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time        text not null check (end_time ~ '^\d{2}:\d{2}$'),
  title           text not null,
  category        text not null,
  instructor_id   text references public.employees(id) on delete set null,
  instructor_name text not null default '',
  room            text not null default '',
  capacity        integer not null default 0,
  attendees       jsonb not null default '[]'::jsonb,  -- ids das alunas inscritas
  present         jsonb not null default '[]'::jsonb,  -- ids das alunas presentes
  status          text not null default 'planeada' check (status in ('planeada','confirmada','realizada','cancelada')),
  lesson_plan     text not null default '',
  color           text not null default '#303227',
  template_id     text references public.classes(id) on delete set null
);

create index if not exists class_sessions_date_idx on public.class_sessions (date);
create index if not exists payroll_runs_month_idx on public.payroll_runs (month);

-- ---------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------
alter table public.finance_settings   enable row level security;
alter table public.plans              enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.payroll_runs       enable row level security;
alter table public.class_sessions     enable row level security;

-- Configurações: leitura para todos (nome/NIF da empresa nos PDFs); escrita Financeiro/admin
drop policy if exists finance_settings_select on public.finance_settings;
create policy finance_settings_select on public.finance_settings
  for select to authenticated using (public.is_active_user());

drop policy if exists finance_settings_write on public.finance_settings;
create policy finance_settings_write on public.finance_settings
  for update to authenticated
  using (public.has_any_module(array['finance']))
  with check (public.has_any_module(array['finance']));

-- Planos: leitura para todos; escrita Planos/Financeiro
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans
  for select to authenticated using (public.is_active_user());

drop policy if exists plans_write on public.plans;
create policy plans_write on public.plans
  for all to authenticated
  using (public.has_any_module(array['plans','finance']))
  with check (public.has_any_module(array['plans','finance']));

-- Despesas fixas: Financeiro
drop policy if exists recurring_expenses_all on public.recurring_expenses;
create policy recurring_expenses_all on public.recurring_expenses
  for all to authenticated
  using (public.has_any_module(array['finance']))
  with check (public.has_any_module(array['finance']));

-- Salários: leitura RH/Financeiro/Relatórios; escrita RH/Financeiro
drop policy if exists payroll_runs_select on public.payroll_runs;
create policy payroll_runs_select on public.payroll_runs
  for select to authenticated using (public.has_any_module(array['hr','finance','reports']));

drop policy if exists payroll_runs_write on public.payroll_runs;
create policy payroll_runs_write on public.payroll_runs
  for all to authenticated
  using (public.has_any_module(array['hr','finance']))
  with check (public.has_any_module(array['hr','finance']));

-- Agenda: leitura para todos; escrita Agenda/Aulas
drop policy if exists class_sessions_select on public.class_sessions;
create policy class_sessions_select on public.class_sessions
  for select to authenticated using (public.is_active_user());

drop policy if exists class_sessions_write on public.class_sessions;
create policy class_sessions_write on public.class_sessions
  for all to authenticated
  using (public.has_any_module(array['agenda','classes']))
  with check (public.has_any_module(array['agenda','classes']));

-- A agenda também pode ler e escrever o horário fixo (gerar semana a partir dele)
drop policy if exists classes_write on public.classes;
create policy classes_write on public.classes
  for all to authenticated
  using (public.has_any_module(array['classes','agenda']))
  with check (public.has_any_module(array['classes','agenda']));

-- Financeiro e Relatórios precisam de ler colaboradoras (salários como despesa)
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated using (public.has_any_module(array['hr','ai','finance','reports']));

-- Diretório da equipa SEM salários, para escolher instrutoras na Agenda/Aulas
create or replace view public.staff_directory as
  select id, name, role, status, avatar_url
  from public.employees
  where public.is_active_user();

revoke all on public.staff_directory from anon;
grant select on public.staff_directory to authenticated;

-- Transações: RH também regista o pagamento de salários
drop policy if exists transactions_write on public.transactions;
create policy transactions_write on public.transactions
  for all to authenticated
  using (public.has_any_module(array['finance','plans','hr']))
  with check (public.has_any_module(array['finance','plans','hr']));

-- ---------------------------------------------------------------------
-- 10. Realtime
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['finance_settings','plans','recurring_expenses','payroll_runs','class_sessions'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
