// Cálculos do módulo Financeiro partilhados pelos separadores e pelo relatório PDF.
import { EXPENSE_CATEGORIES, FinanceSettings, INCOME_CATEGORIES, PayrollRun, Transaction } from '../../types';
import { isInMonth, monthLabel, netOfVat, summarizeMonth, MonthSummary, vatIncluded } from '../../utils/finance';
import { localToday } from '../../utils/dates';

const round = (n: number) => Math.round(n * 100) / 100;

export const TAX_CATEGORY = 'Impostos & Contribuições';
export const SALARY_CATEGORY = 'Salários & RH';

// Pagamento de imposto não associado a salários (IVA, Imposto Industrial...): não é custo operacional
export const isNonPayrollTaxPayment = (t: Transaction) =>
  t.type === 'despesa' && t.category === TAX_CATEGORY && !t.payrollRunId;

export const monthTransactions = (transactions: Transaction[], monthKey: string) =>
  transactions.filter((t) => isInMonth(t.date, monthKey));

export const marginPct = (result: number, revenue: number) => (revenue > 0 ? (result / revenue) * 100 : 0);

export const formatPct = (n: number, digits = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(digits).replace('.', ',')}%`;

// Próximo número de recibo sequencial do ano: REC-AAAA-0001
export function nextReceiptNumber(transactions: Transaction[], date: string): string {
  const year = (date || localToday()).slice(0, 4);
  const prefix = `REC-${year}-`;
  let max = 0;
  for (const t of transactions) {
    if (!t.receiptNumber?.startsWith(prefix)) continue;
    const n = parseInt(t.receiptNumber.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// Marca como pago; receitas recebem número de recibo se ainda não tiverem
export function markAsPaid(tx: Transaction, all: Transaction[]): Transaction {
  return {
    ...tx,
    status: 'pago',
    receiptNumber: tx.type === 'receita' && !tx.receiptNumber ? nextReceiptNumber(all, tx.date) : tx.receiptNumber,
  };
}

export const isOverdue = (t: Transaction, today = localToday()) =>
  t.status === 'atrasado' || (t.status === 'pendente' && (t.dueDate || t.date) < today);

// ---------- Demonstração de Resultados ----------

export interface DreLine {
  label: string;
  amount: number;
}

export interface Dre {
  summary: MonthSummary;
  revenueByCategory: DreLine[];
  grossRevenue: number;
  vatCollected: number;
  netRevenue: number;
  costsByCategory: DreLine[]; // sem IVA dedutível
  totalCosts: number;
  operatingResult: number;
  industrialTax: number;
  netResult: number;
  excludedTaxPayments: number; // pagamentos de IVA / Imposto Industrial (fora da DRE)
}

export function computeDre(
  transactions: Transaction[],
  payrollRuns: PayrollRun[],
  settings: FinanceSettings,
  monthKey: string
): Dre {
  const summary = summarizeMonth(transactions, payrollRuns, settings, monthKey);
  const paid = monthTransactions(transactions, monthKey).filter((t) => t.status === 'pago');
  const income = paid.filter((t) => t.type === 'receita');
  const expense = paid.filter((t) => t.type === 'despesa');
  const costs = expense.filter((t) => !isNonPayrollTaxPayment(t));

  const byCat = (list: Transaction[], cats: readonly string[], value: (t: Transaction) => number): DreLine[] => {
    const known = cats.map((c) => ({ label: c, amount: round(list.filter((t) => t.category === c).reduce((s, t) => s + value(t), 0)) }));
    const other = round(list.filter((t) => !cats.includes(t.category)).reduce((s, t) => s + value(t), 0));
    return [...known, ...(other ? [{ label: 'Sem categoria', amount: other }] : [])].filter((l) => l.amount !== 0);
  };

  const revenueByCategory = byCat(income, INCOME_CATEGORIES, (t) => t.amount);
  const costsByCategory = byCat(costs, EXPENSE_CATEGORIES, (t) => netOfVat(t.amount, t.vatRate))
    .map((l) => (l.label === TAX_CATEGORY ? { ...l, label: `${TAX_CATEGORY} (salários)` } : l));

  const netRevenue = round(summary.revenue - summary.vatCollected);
  const totalCosts = round(costsByCategory.reduce((s, l) => s + l.amount, 0));
  const operatingResult = round(netRevenue - totalCosts);
  const industrialTax = operatingResult > 0 ? round((operatingResult * settings.industrialTaxRate) / 100) : 0;

  return {
    summary,
    revenueByCategory,
    grossRevenue: summary.revenue,
    vatCollected: summary.vatCollected,
    netRevenue,
    costsByCategory,
    totalCosts,
    operatingResult,
    industrialTax,
    netResult: round(operatingResult - industrialTax),
    excludedTaxPayments: round(expense.filter(isNonPayrollTaxPayment).reduce((s, t) => s + t.amount, 0)),
  };
}

// Resultado acumulado do ano (janeiro até ao mês indicado) e Imposto Industrial estimado
export function yearToDate(transactions: Transaction[], payrollRuns: PayrollRun[], settings: FinanceSettings, monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  let result = 0;
  let revenue = 0;
  for (let m = 1; m <= month; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const dre = computeDre(transactions, payrollRuns, settings, key);
    result += dre.operatingResult;
    revenue += dre.grossRevenue;
  }
  result = round(result);
  const industrialTax = result > 0 ? round((result * settings.industrialTaxRate) / 100) : 0;
  return { result, revenue: round(revenue), industrialTax, months: month };
}

// ---------- Impostos ----------

export interface MonthTaxes {
  vatCollected: number;
  vatDeductible: number;
  vatPayable: number;
  irt: number;
  inssEmployee: number;
  inssEmployer: number;
  withholding: number;
  industrialTax: number;
  runs: PayrollRun[];
  payrollTaxPayments: Transaction[]; // pagamentos ligados aos salários do mês
}

export function computeTaxes(
  transactions: Transaction[],
  payrollRuns: PayrollRun[],
  settings: FinanceSettings,
  monthKey: string
): MonthTaxes {
  const dre = computeDre(transactions, payrollRuns, settings, monthKey);
  const s = dre.summary;
  const runs = payrollRuns.filter((r) => r.month === monthKey);
  const runIds = new Set(runs.map((r) => r.id));
  return {
    vatCollected: s.vatCollected,
    vatDeductible: s.vatDeductible,
    vatPayable: s.vatPayable,
    irt: s.irt,
    inssEmployee: s.inssEmployee,
    inssEmployer: s.inssEmployer,
    withholding: s.withholding,
    industrialTax: dre.industrialTax,
    runs,
    payrollTaxPayments: transactions.filter(
      (t) => t.type === 'despesa' && t.category === TAX_CATEGORY && !!t.payrollRunId && runIds.has(t.payrollRunId)
    ),
  };
}

// Referência gravada nas notas para identificar o pagamento de um imposto de um mês
export const taxRef = (kind: 'IVA' | 'II', monthKey: string) => `Ref. fiscal: ${kind} ${monthKey}`;

export const findTaxPayments = (transactions: Transaction[], kind: 'IVA' | 'II', monthKey: string) =>
  transactions.filter((t) => t.type === 'despesa' && (t.notes || '').includes(taxRef(kind, monthKey)));

export const taxDescription = (label: string, monthKey: string, entity: string) =>
  `${label} — ${monthLabel(monthKey)} (${entity})`;

// IVA contido + valor líquido
export const vatBreakdown = (amount: number, rate: number) => {
  const vat = vatIncluded(amount, rate);
  return { vat, base: round(amount - vat), total: amount };
};
