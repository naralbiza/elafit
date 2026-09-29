// Acesso aos dados do ginásio no Supabase.
// As tabelas usam snake_case; a app usa os tipos camelCase de ../types.
import { supabase } from '../lib/supabase';
import {
  Member,
  ClassSession,
  Transaction,
  Employee,
  ShiftSchedule,
  AIInsight,
  Plan,
  RecurringExpense,
  PayrollRun,
  ScheduledClass,
  FinanceSettings,
  StaffMember,
} from '../types';
import { DEFAULT_FINANCE_SETTINGS } from '../utils/finance';
import {
  initialMembers,
  initialClasses,
  initialTransactions,
  initialEmployees,
  initialShifts,
  initialAIInsights,
} from './mockData';

type Row = Record<string, any>;

// Colunas "date" não aceitam string vazia
const toDate = (value: string | undefined | null) => (value ? value : null);
const fromDate = (value: string | null) => value ?? '';

// ---------- Mappers ----------

const memberToRow = (m: Member): Row => ({
  id: m.id,
  name: m.name,
  email: m.email,
  phone: m.phone,
  nif: m.nif || null,
  birth_date: toDate(m.birthDate),
  lead_status: m.leadStatus,
  member_status: m.memberStatus,
  plan: m.plan,
  monthly_fee: m.monthlyFee,
  start_date: toDate(m.startDate),
  renewal_date: toDate(m.renewalDate),
  assigned_trainer_id: m.assignedTrainerId || null,
  assigned_trainer_name: m.assignedTrainerName || null,
  attendance_count_this_month: m.attendanceCountThisMonth,
  last_attendance_date: toDate(m.lastAttendanceDate),
  emergency_contact: m.emergencyContact,
  evaluations: m.evaluations,
  notes: m.notes,
  created_at: toDate(m.createdAt) ?? undefined,
});

const rowToMember = (r: Row): Member => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  nif: r.nif ?? undefined,
  birthDate: fromDate(r.birth_date),
  leadStatus: r.lead_status,
  memberStatus: r.member_status,
  plan: r.plan,
  monthlyFee: Number(r.monthly_fee),
  startDate: fromDate(r.start_date),
  renewalDate: fromDate(r.renewal_date),
  assignedTrainerId: r.assigned_trainer_id ?? undefined,
  assignedTrainerName: r.assigned_trainer_name ?? undefined,
  attendanceCountThisMonth: r.attendance_count_this_month,
  lastAttendanceDate: r.last_attendance_date ?? undefined,
  emergencyContact: r.emergency_contact ?? { name: '', phone: '', relation: '' },
  evaluations: r.evaluations ?? [],
  notes: r.notes,
  createdAt: fromDate(r.created_at),
});

const transactionToRow = (t: Transaction): Row => ({
  id: t.id,
  description: t.description,
  amount: t.amount,
  type: t.type,
  category: t.category,
  date: toDate(t.date) ?? undefined,
  status: t.status,
  member_id: t.memberId || null,
  member_name: t.memberName || null,
  payment_method: t.paymentMethod,
  receipt_number: t.receiptNumber || null,
  vat_rate: t.vatRate ?? 0,
  account: t.account || 'Caixa',
  cost_center: t.costCenter || 'Geral',
  supplier: t.supplier || null,
  due_date: toDate(t.dueDate),
  notes: t.notes ?? '',
  payroll_run_id: t.payrollRunId || null,
  recurring_id: t.recurringId || null,
});

const rowToTransaction = (r: Row): Transaction => ({
  id: r.id,
  description: r.description,
  amount: Number(r.amount),
  type: r.type,
  category: r.category,
  date: fromDate(r.date),
  status: r.status,
  memberId: r.member_id ?? undefined,
  memberName: r.member_name ?? undefined,
  paymentMethod: r.payment_method,
  receiptNumber: r.receipt_number ?? undefined,
  vatRate: Number(r.vat_rate ?? 0),
  account: r.account ?? 'Caixa',
  costCenter: r.cost_center ?? 'Geral',
  supplier: r.supplier ?? undefined,
  dueDate: r.due_date ?? undefined,
  notes: r.notes ?? '',
  payrollRunId: r.payroll_run_id ?? undefined,
  recurringId: r.recurring_id ?? undefined,
});

const employeeToRow = (e: Employee): Row => ({
  id: e.id,
  name: e.name,
  role: e.role,
  email: e.email,
  phone: e.phone,
  avatar_url: e.avatarUrl || null,
  contract_type: e.contractType,
  base_salary: e.baseSalary,
  pt_bonus_rate: e.ptBonusRate,
  classes_given_this_month: e.classesGivenThisMonth,
  pt_sessions_this_month: e.ptSessionsThisMonth,
  hire_date: toDate(e.hireDate),
  status: e.status,
  weekly_hours: e.weeklyHours,
  certifications: e.certifications,
  nif: e.nif || null,
  iban: e.iban || null,
  inss_number: e.inssNumber || null,
  allowances: e.allowances ?? 0,
});

const rowToEmployee = (r: Row): Employee => ({
  id: r.id,
  name: r.name,
  role: r.role,
  email: r.email,
  phone: r.phone,
  avatarUrl: r.avatar_url ?? undefined,
  contractType: r.contract_type,
  baseSalary: Number(r.base_salary),
  ptBonusRate: Number(r.pt_bonus_rate),
  classesGivenThisMonth: r.classes_given_this_month,
  ptSessionsThisMonth: r.pt_sessions_this_month,
  hireDate: fromDate(r.hire_date),
  status: r.status,
  weeklyHours: r.weekly_hours,
  certifications: r.certifications ?? [],
  nif: r.nif ?? undefined,
  iban: r.iban ?? undefined,
  inssNumber: r.inss_number ?? undefined,
  allowances: Number(r.allowances ?? 0),
});

const shiftToRow = (s: ShiftSchedule): Row => ({
  id: s.id,
  employee_id: s.employeeId || null,
  employee_name: s.employeeName,
  day: s.day,
  shift_type: s.shiftType,
  assigned_area: s.assignedArea,
});

const rowToShift = (r: Row): ShiftSchedule => ({
  id: r.id,
  employeeId: r.employee_id ?? '',
  employeeName: r.employee_name,
  day: r.day,
  shiftType: r.shift_type,
  assignedArea: r.assigned_area,
});

const classToRow = (c: ClassSession): Row => ({
  id: c.id,
  title: c.title,
  instructor_name: c.instructorName,
  category: c.category,
  day_of_week: c.dayOfWeek,
  time: c.time,
  room: c.room,
  capacity: c.capacity,
  enrolled_count: c.enrolledCount,
  color: c.color,
});

const rowToClass = (r: Row): ClassSession => ({
  id: r.id,
  title: r.title,
  instructorName: r.instructor_name,
  category: r.category,
  dayOfWeek: r.day_of_week,
  time: r.time,
  room: r.room,
  capacity: r.capacity,
  enrolledCount: r.enrolled_count,
  color: r.color,
});

const insightToRow = (i: AIInsight): Row => ({
  id: i.id,
  category: i.category,
  title: i.title,
  summary: i.summary,
  actionable_step: i.actionableStep,
  impact_score: i.impactScore,
  timestamp: i.timestamp,
});

const rowToInsight = (r: Row): AIInsight => ({
  id: r.id,
  category: r.category,
  title: r.title,
  summary: r.summary,
  actionableStep: r.actionable_step,
  impactScore: r.impact_score,
  timestamp: r.timestamp,
});

const planToRow = (p: Plan): Row => ({
  id: p.id,
  name: p.name,
  price: p.price,
  description: p.description,
  tag: p.tag,
  duration_months: p.durationMonths,
  cost_center: p.costCenter,
  active: p.active,
  sort_order: p.sortOrder,
});

const rowToPlan = (r: Row): Plan => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  description: r.description,
  tag: r.tag,
  durationMonths: r.duration_months,
  costCenter: r.cost_center,
  active: r.active,
  sortOrder: r.sort_order,
});

const recurringToRow = (e: RecurringExpense): Row => ({
  id: e.id,
  description: e.description,
  category: e.category,
  amount: e.amount,
  vat_rate: e.vatRate,
  account: e.account,
  cost_center: e.costCenter,
  supplier: e.supplier || null,
  payment_method: e.paymentMethod,
  day_of_month: e.dayOfMonth,
  active: e.active,
});

const rowToRecurring = (r: Row): RecurringExpense => ({
  id: r.id,
  description: r.description,
  category: r.category,
  amount: Number(r.amount),
  vatRate: Number(r.vat_rate),
  account: r.account,
  costCenter: r.cost_center,
  supplier: r.supplier ?? undefined,
  paymentMethod: r.payment_method,
  dayOfMonth: r.day_of_month,
  active: r.active,
});

const payrollToRow = (p: PayrollRun): Row => ({
  id: p.id,
  month: p.month,
  employee_id: p.employeeId || null,
  employee_name: p.employeeName,
  role: p.role,
  contract_type: p.contractType,
  base_salary: p.baseSalary,
  classes_count: p.classesCount,
  pt_sessions: p.ptSessions,
  bonus_rate: p.bonusRate,
  commissions: p.commissions,
  allowances: p.allowances,
  gross: p.gross,
  inss_employee: p.inssEmployee,
  inss_employer: p.inssEmployer,
  irt: p.irt,
  withholding: p.withholding,
  other_deductions: p.otherDeductions,
  net: p.net,
  status: p.status,
  paid_at: toDate(p.paidAt),
});

const rowToPayroll = (r: Row): PayrollRun => ({
  id: r.id,
  month: r.month,
  employeeId: r.employee_id ?? undefined,
  employeeName: r.employee_name,
  role: r.role,
  contractType: r.contract_type,
  baseSalary: Number(r.base_salary),
  classesCount: r.classes_count,
  ptSessions: r.pt_sessions,
  bonusRate: Number(r.bonus_rate),
  commissions: Number(r.commissions),
  allowances: Number(r.allowances),
  gross: Number(r.gross),
  inssEmployee: Number(r.inss_employee),
  inssEmployer: Number(r.inss_employer),
  irt: Number(r.irt),
  withholding: Number(r.withholding),
  otherDeductions: Number(r.other_deductions),
  net: Number(r.net),
  status: r.status,
  paidAt: r.paid_at ?? undefined,
});

const scheduledToRow = (s: ScheduledClass): Row => ({
  id: s.id,
  date: s.date,
  start_time: s.startTime,
  end_time: s.endTime,
  title: s.title,
  category: s.category,
  instructor_id: s.instructorId || null,
  instructor_name: s.instructorName,
  room: s.room,
  capacity: s.capacity,
  attendees: s.attendees,
  present: s.present,
  status: s.status,
  lesson_plan: s.lessonPlan,
  color: s.color,
  template_id: s.templateId || null,
});

const rowToScheduled = (r: Row): ScheduledClass => ({
  id: r.id,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  title: r.title,
  category: r.category,
  instructorId: r.instructor_id ?? undefined,
  instructorName: r.instructor_name,
  room: r.room,
  capacity: r.capacity,
  attendees: r.attendees ?? [],
  present: r.present ?? [],
  status: r.status,
  lessonPlan: r.lesson_plan ?? '',
  color: r.color,
  templateId: r.template_id ?? undefined,
});

const settingsToRow = (s: FinanceSettings): Row => ({
  id: 1,
  company_name: s.companyName,
  company_nif: s.companyNif,
  company_address: s.companyAddress,
  company_phone: s.companyPhone,
  company_email: s.companyEmail,
  iva_rate: s.ivaRate,
  prices_include_iva: s.pricesIncludeIva,
  industrial_tax_rate: s.industrialTaxRate,
  inss_employee_rate: s.inssEmployeeRate,
  inss_employer_rate: s.inssEmployerRate,
  services_withholding_rate: s.servicesWithholdingRate,
  irt_brackets: s.irtBrackets,
  accounts: s.accounts,
  cost_centers: s.costCenters,
  goal_active_members: s.goalActiveMembers,
  goal_monthly_revenue: s.goalMonthlyRevenue,
  goal_retention_rate: s.goalRetentionRate,
});

const rowToSettings = (r: Row): FinanceSettings => ({
  companyName: r.company_name,
  companyNif: r.company_nif,
  companyAddress: r.company_address,
  companyPhone: r.company_phone,
  companyEmail: r.company_email,
  ivaRate: Number(r.iva_rate),
  pricesIncludeIva: r.prices_include_iva,
  industrialTaxRate: Number(r.industrial_tax_rate),
  inssEmployeeRate: Number(r.inss_employee_rate),
  inssEmployerRate: Number(r.inss_employer_rate),
  servicesWithholdingRate: Number(r.services_withholding_rate),
  irtBrackets: (r.irt_brackets ?? []).map((b: Row) => ({ from: Number(b.from), fixed: Number(b.fixed), rate: Number(b.rate) })),
  accounts: r.accounts ?? [],
  costCenters: r.cost_centers ?? [],
  goalActiveMembers: r.goal_active_members,
  goalMonthlyRevenue: Number(r.goal_monthly_revenue),
  goalRetentionRate: Number(r.goal_retention_rate),
});

const rowToStaff = (r: Row): StaffMember => ({
  id: r.id,
  name: r.name,
  role: r.role,
  status: r.status,
  avatarUrl: r.avatar_url ?? undefined,
});

// ---------- Leitura ----------
// Se o RLS não permitir leitura, o Supabase devolve [] (sem erro).

async function fetchAll<T>(table: string, map: (r: Row) => T, orderBy?: { column: string; ascending: boolean }) {
  let query = supabase.from(table).select('*');
  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
  const { data, error } = await query;
  if (error) {
    // Log completo apenas na consola do browser (nunca expor ao utilizador)
    console.error(`[Ela Fit] Erro ao carregar dados (${table}):`, error.code, error.message);
    if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)) {
      throw new Error('Alguns módulos ainda não estão configurados. Contacte a administração do sistema.');
    }
    throw new Error('Não foi possível carregar os dados. Tente novamente mais tarde.');
  }
  return (data ?? []).map(map);
}

export const fetchMembers = () => fetchAll('members', rowToMember, { column: 'created_at', ascending: false });
export const fetchTransactions = () => fetchAll('transactions', rowToTransaction, { column: 'date', ascending: false });
export const fetchEmployees = () => fetchAll('employees', rowToEmployee, { column: 'name', ascending: true });
export const fetchShifts = () => fetchAll('shifts', rowToShift);
export const fetchClasses = () => fetchAll('classes', rowToClass);
export const fetchInsights = () => fetchAll('ai_insights', rowToInsight);
export const fetchPlans = () => fetchAll('plans', rowToPlan, { column: 'sort_order', ascending: true });
export const fetchRecurringExpenses = () => fetchAll('recurring_expenses', rowToRecurring, { column: 'day_of_month', ascending: true });
export const fetchPayrollRuns = () => fetchAll('payroll_runs', rowToPayroll, { column: 'month', ascending: false });
export const fetchScheduledClasses = () => fetchAll('class_sessions', rowToScheduled, { column: 'date', ascending: true });
export const fetchStaffDirectory = () => fetchAll('staff_directory', rowToStaff, { column: 'name', ascending: true });

export async function fetchFinanceSettings(): Promise<FinanceSettings> {
  const rows = await fetchAll('finance_settings', rowToSettings);
  return rows[0] ?? DEFAULT_FINANCE_SETTINGS;
}

// ---------- Escrita ----------

function throwWriteError(error: { code?: string; message: string }): never {
  console.error('[Ela Fit] Erro de escrita:', error.code, error.message);
  if (error.code === '42501') throw new Error('Não tem permissão para alterar estes dados.');
  if (error.code === '23505') throw new Error('Já existe um registo com estes dados. Verifique e tente novamente.');
  if (error.code === '23503') throw new Error('Este registo está associado a outros dados e não pode ser alterado assim.');
  throw new Error('Não foi possível guardar os dados. Tente novamente mais tarde.');
}

async function upsert(table: string, rows: Row[]) {
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throwWriteError(error);
}

async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throwWriteError(error);
}

export const saveMember = (m: Member) => upsert('members', [memberToRow(m)]);
export const deleteMember = (id: string) => remove('members', id);

export const saveTransaction = (t: Transaction) => upsert('transactions', [transactionToRow(t)]);
export const saveTransactions = async (ts: Transaction[]) => {
  if (ts.length) await upsert('transactions', ts.map(transactionToRow));
};
export const deleteTransaction = (id: string) => remove('transactions', id);

export const saveEmployee = (e: Employee) => upsert('employees', [employeeToRow(e)]);
export const deleteEmployee = (id: string) => remove('employees', id);

export const saveClass = (c: ClassSession) => upsert('classes', [classToRow(c)]);
export const deleteClass = (id: string) => remove('classes', id);

export const savePlan = (p: Plan) => upsert('plans', [planToRow(p)]);
export const deletePlan = (id: string) => remove('plans', id);

export const saveRecurringExpense = (e: RecurringExpense) => upsert('recurring_expenses', [recurringToRow(e)]);
export const deleteRecurringExpense = (id: string) => remove('recurring_expenses', id);

export const savePayrollRuns = async (runs: PayrollRun[]) => {
  if (runs.length) await upsert('payroll_runs', runs.map(payrollToRow));
};
export const deletePayrollRun = (id: string) => remove('payroll_runs', id);

export const saveScheduledClasses = async (s: ScheduledClass[]) => {
  if (s.length) await upsert('class_sessions', s.map(scheduledToRow));
};
export const deleteScheduledClass = (id: string) => remove('class_sessions', id);

export async function saveFinanceSettings(s: FinanceSettings) {
  const { error } = await supabase.from('finance_settings').update(settingsToRow(s)).eq('id', 1);
  if (error) throwWriteError(error);
}

// Id único para novos registos (prefixo legível + aleatório)
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export async function replaceShifts(shifts: ShiftSchedule[]) {
  if (shifts.length) await upsert('shifts', shifts.map(shiftToRow));
  const ids = shifts.map((s) => s.id);
  let del = supabase.from('shifts').delete();
  del = ids.length ? del.not('id', 'in', `(${ids.map((id) => `"${id}"`).join(',')})`) : del.neq('id', '');
  const { error } = await del;
  if (error) {
    console.error('[Ela Fit] Erro ao atualizar turnos:', error.code, error.message);
    throw new Error('Não foi possível atualizar os turnos. Tente novamente.');
  }
}

// Importa os dados de demonstração (mockData) para o Supabase. Só para administradores.
export async function importDemoData() {
  await upsert('members', initialMembers.map(memberToRow));
  await upsert('employees', initialEmployees.map(employeeToRow));
  await upsert('transactions', initialTransactions.map(transactionToRow));
  await upsert('shifts', initialShifts.map(shiftToRow));
  await upsert('classes', initialClasses.map(classToRow));
  await upsert('ai_insights', initialAIInsights.map(insightToRow));
}
