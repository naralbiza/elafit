// Cálculos financeiros e fiscais (Angola) partilhados por Financeiro, RH e Relatórios.
// As taxas vêm de finance_settings e podem ser alteradas nas Configurações Fiscais.
import { Employee, FinanceSettings, IrtBracket, PayrollRun, Transaction } from '../types';
import { localToday } from './dates';

export const DEFAULT_IRT_BRACKETS: IrtBracket[] = [
  { from: 0, fixed: 0, rate: 0 },
  { from: 100000, fixed: 0, rate: 13 },
  { from: 150000, fixed: 12500, rate: 16 },
  { from: 200000, fixed: 31250, rate: 18 },
  { from: 300000, fixed: 49250, rate: 19 },
  { from: 500000, fixed: 87250, rate: 20 },
  { from: 1000000, fixed: 187249, rate: 21 },
  { from: 1500000, fixed: 292249, rate: 22 },
  { from: 2000000, fixed: 402249, rate: 23 },
  { from: 2500000, fixed: 517249, rate: 24 },
  { from: 5000000, fixed: 1117249, rate: 24.5 },
  { from: 10000000, fixed: 2342248, rate: 25 },
];

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  companyName: 'Ela Fit — Ginásio Feminino',
  companyNif: '',
  companyAddress: 'Luanda, Angola',
  companyPhone: '',
  companyEmail: '',
  ivaRate: 14,
  pricesIncludeIva: true,
  industrialTaxRate: 25,
  inssEmployeeRate: 3,
  inssEmployerRate: 8,
  servicesWithholdingRate: 6.5,
  irtBrackets: DEFAULT_IRT_BRACKETS,
  accounts: ['Caixa', 'Banco BAI', 'Banco BFA', 'Multicaixa Express'],
  costCenters: ['Geral', 'Musculação', 'Pilates Reformer', 'Personal Training', 'Aulas de Grupo', 'Avaliações Físicas', 'Bar & Suplementos'],
  goalActiveMembers: 250,
  goalMonthlyRevenue: 3000000,
  goalRetentionRate: 90,
};

const round = (n: number) => Math.round(n * 100) / 100;

// ---------- Datas / períodos ----------

export const todayISO = localToday;

// 'AAAA-MM' do mês atual
export const currentMonthKey = () => todayISO().slice(0, 7);

export const monthKeyOf = (date: string) => (date || '').slice(0, 7);

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const isInMonth = (date: string, monthKey: string) => monthKeyOf(date) === monthKey;

// ---------- IVA ----------

// IVA contido num valor com IVA incluído
export const vatIncluded = (amount: number, rate: number) => (rate > 0 ? round((amount * rate) / (100 + rate)) : 0);

export const netOfVat = (amount: number, rate: number) => round(amount - vatIncluded(amount, rate));

// ---------- IRT (Imposto sobre o Rendimento do Trabalho) ----------

export function computeIrt(taxableIncome: number, brackets: IrtBracket[]): number {
  const sorted = [...brackets].sort((a, b) => a.from - b.from);
  let bracket = sorted[0];
  for (const b of sorted) if (taxableIncome > b.from) bracket = b;
  if (!bracket || bracket.rate <= 0) return 0;
  return round(bracket.fixed + ((taxableIncome - bracket.from) * bracket.rate) / 100);
}

// ---------- Processamento salarial ----------

export interface PayrollInput {
  classesCount: number;
  ptSessions: number;
  allowances?: number;
  otherDeductions?: number;
}

export function computePayroll(
  employee: Employee,
  settings: FinanceSettings,
  month: string,
  input: PayrollInput
): Omit<PayrollRun, 'id' | 'status' | 'paidAt'> {
  const commissions = round((input.classesCount + input.ptSessions) * employee.ptBonusRate);
  const allowances = round(input.allowances ?? employee.allowances ?? 0);
  const gross = round(employee.baseSalary + commissions + allowances);
  const otherDeductions = round(input.otherDeductions ?? 0);
  const isServiceProvider = employee.contractType === 'Prestação de Serviços (Recibos Verdes)';

  let inssEmployee = 0;
  let inssEmployer = 0;
  let irt = 0;
  let withholding = 0;

  if (isServiceProvider) {
    // Prestadora de serviços: retenção na fonte, sem Segurança Social
    withholding = round((gross * settings.servicesWithholdingRate) / 100);
  } else {
    inssEmployee = round((gross * settings.inssEmployeeRate) / 100);
    inssEmployer = round((gross * settings.inssEmployerRate) / 100);
    // A matéria coletável do IRT exclui a contribuição do trabalhador para a Segurança Social
    irt = computeIrt(gross - inssEmployee, settings.irtBrackets);
  }

  const net = round(gross - inssEmployee - irt - withholding - otherDeductions);

  return {
    month,
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    contractType: employee.contractType,
    baseSalary: employee.baseSalary,
    classesCount: input.classesCount,
    ptSessions: input.ptSessions,
    bonusRate: employee.ptBonusRate,
    commissions,
    allowances,
    gross,
    inssEmployee,
    inssEmployer,
    irt,
    withholding,
    otherDeductions,
    net,
  };
}

// Custo total para a empresa (bruto + Segurança Social patronal)
export const employerCost = (run: Pick<PayrollRun, 'gross' | 'inssEmployer'>) => round(run.gross + run.inssEmployer);

// ---------- Agregações ----------

export const sumAmount = (txs: Transaction[]) => round(txs.reduce((s, t) => s + t.amount, 0));

export function groupSum<T>(items: T[], key: (i: T) => string, value: (i: T) => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = round((out[key(i)] ?? 0) + value(i));
  return out;
}

export interface MonthSummary {
  revenue: number; // receitas pagas
  expenses: number; // despesas pagas
  pendingRevenue: number;
  pendingExpenses: number;
  vatCollected: number; // IVA liquidado nas vendas
  vatDeductible: number; // IVA suportado nas compras
  vatPayable: number;
  payrollGross: number;
  payrollNet: number;
  inssEmployee: number;
  inssEmployer: number;
  irt: number;
  withholding: number;
  operatingResult: number; // resultado antes de Imposto Industrial (sem IVA)
  industrialTax: number; // estimativa
  netResult: number;
}

// Resumo de um mês: receitas, despesas, IVA, encargos salariais e impostos
export function summarizeMonth(
  transactions: Transaction[],
  payroll: PayrollRun[],
  settings: FinanceSettings,
  monthKey: string
): MonthSummary {
  const tx = transactions.filter((t) => isInMonth(t.date, monthKey));
  const paid = tx.filter((t) => t.status === 'pago');
  const income = paid.filter((t) => t.type === 'receita');
  const expense = paid.filter((t) => t.type === 'despesa');

  const revenue = sumAmount(income);
  const expenses = sumAmount(expense);
  const vatCollected = round(income.reduce((s, t) => s + vatIncluded(t.amount, t.vatRate), 0));
  const vatDeductible = round(expense.reduce((s, t) => s + vatIncluded(t.amount, t.vatRate), 0));

  const runs = payroll.filter((p) => p.month === monthKey);
  const sumRuns = (f: (p: PayrollRun) => number) => round(runs.reduce((s, p) => s + f(p), 0));

  // O lucro exclui o IVA (é um imposto de passagem) e os pagamentos de impostos já lançados
  const taxPayments = sumAmount(expense.filter((t) => t.category === 'Impostos & Contribuições' && !t.payrollRunId));
  const operatingResult = round(revenue - vatCollected - (expenses - vatDeductible - taxPayments));
  const industrialTax = operatingResult > 0 ? round((operatingResult * settings.industrialTaxRate) / 100) : 0;

  return {
    revenue,
    expenses,
    pendingRevenue: sumAmount(tx.filter((t) => t.type === 'receita' && t.status !== 'pago')),
    pendingExpenses: sumAmount(tx.filter((t) => t.type === 'despesa' && t.status !== 'pago')),
    vatCollected,
    vatDeductible,
    vatPayable: round(vatCollected - vatDeductible),
    payrollGross: sumRuns((p) => p.gross),
    payrollNet: sumRuns((p) => p.net),
    inssEmployee: sumRuns((p) => p.inssEmployee),
    inssEmployer: sumRuns((p) => p.inssEmployer),
    irt: sumRuns((p) => p.irt),
    withholding: sumRuns((p) => p.withholding),
    operatingResult,
    industrialTax,
    netResult: round(operatingResult - industrialTax),
  };
}

// Saldo de cada conta financeira (todas as transações pagas até hoje)
export function accountBalances(transactions: Transaction[], accounts: string[]): Record<string, number> {
  const balances: Record<string, number> = Object.fromEntries(accounts.map((a) => [a, 0]));
  for (const t of transactions) {
    if (t.status !== 'pago') continue;
    balances[t.account] = round((balances[t.account] ?? 0) + (t.type === 'receita' ? t.amount : -t.amount));
  }
  return balances;
}

export interface CostCenterRow {
  center: string;
  revenue: number;
  directCosts: number;
  allocatedCosts: number; // custos gerais distribuídos proporcionalmente à receita
  result: number;
}

// Distribuição de custos entre serviços: custos diretos + custos "Geral" rateados pela receita
export function costCenterDistribution(transactions: Transaction[], centers: string[], monthKey: string): CostCenterRow[] {
  const paid = transactions.filter((t) => t.status === 'pago' && isInMonth(t.date, monthKey));
  const revenueBy = groupSum(paid.filter((t) => t.type === 'receita'), (t) => t.costCenter || 'Geral', (t) => t.amount);
  const costBy = groupSum(paid.filter((t) => t.type === 'despesa'), (t) => t.costCenter || 'Geral', (t) => t.amount);

  const serviceCenters = [...new Set([...centers, ...Object.keys(revenueBy), ...Object.keys(costBy)])].filter((c) => c !== 'Geral');
  const sharedCosts = costBy['Geral'] ?? 0;
  const totalServiceRevenue = serviceCenters.reduce((s, c) => s + (revenueBy[c] ?? 0), 0);

  return serviceCenters
    .map((center) => {
      const revenue = revenueBy[center] ?? 0;
      const directCosts = costBy[center] ?? 0;
      const share = totalServiceRevenue > 0 ? revenue / totalServiceRevenue : 1 / Math.max(serviceCenters.length, 1);
      const allocatedCosts = round(sharedCosts * share);
      return { center, revenue, directCosts, allocatedCosts, result: round(revenue - directCosts - allocatedCosts) };
    })
    .filter((r) => r.revenue || r.directCosts || r.allocatedCosts);
}
