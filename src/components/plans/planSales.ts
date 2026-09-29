// Regras de venda / renovação de planos: atualização da aluna + receita no Financeiro.
import { FinanceSettings, Member, PaymentMethod, PaymentStatus, Plan, Transaction, TransactionCategory } from '../../types';
import { addDays, addMonths, localToday } from '../../utils/dates';
import { newId } from '../../data/repository';

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

export function incomeCategoryForPlan(plan: Pick<Plan, 'costCenter'>): TransactionCategory {
  if (plan.costCenter === 'Pilates Reformer') return 'Pilates Reformer';
  if (plan.costCenter === 'Personal Training') return 'Personal Training';
  return 'Mensalidades';
}

// Data de fim do período pago (0 meses = semanal/avulso → 7 dias)
export const periodEnd = (startISO: string, durationMonths: number) =>
  durationMonths > 0 ? addMonths(startISO, durationMonths) : addDays(startISO, 7);

export const durationLabel = (months: number) =>
  months <= 0 ? 'Semanal / avulso' : months === 1 ? '1 mês' : `${months} meses`;

export interface PlanSaleInput {
  member: Member;
  plan: Plan;
  mode: 'assign' | 'renew';
  startDate: string; // início (atribuição) — ignorado na renovação
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  account: string;
  createTransaction: boolean;
  transactions: Transaction[];
  settings: FinanceSettings;
}

export function buildPlanSale(p: PlanSaleInput): { member: Member; transaction: Transaction | null } {
  const today = localToday();
  const { plan, member } = p;

  let startDate = member.startDate;
  let renewalDate: string;
  if (p.mode === 'assign') {
    startDate = p.startDate || today;
    renewalDate = periodEnd(startDate, plan.durationMonths);
  } else {
    const base = member.renewalDate && member.renewalDate > today ? member.renewalDate : today;
    renewalDate = periodEnd(base, plan.durationMonths);
    if (!startDate) startDate = today;
  }

  const updated: Member = {
    ...member,
    plan: plan.name,
    monthlyFee: plan.price,
    memberStatus: 'ativa',
    leadStatus: 'matriculada',
    startDate,
    renewalDate,
  };

  if (!p.createTransaction) return { member: updated, transaction: null };

  const date = p.mode === 'assign' ? startDate : today;
  const transaction: Transaction = {
    id: newId('TX'),
    description: `${plan.name} — ${member.name}`,
    amount: plan.price,
    type: 'receita',
    category: incomeCategoryForPlan(plan),
    date,
    status: p.paymentStatus,
    memberId: member.id,
    memberName: member.name,
    paymentMethod: p.paymentMethod,
    receiptNumber: p.paymentStatus === 'pago' ? nextReceiptNumber(p.transactions, date) : undefined,
    vatRate: p.settings.ivaRate,
    account: p.account,
    costCenter: plan.costCenter,
    dueDate: p.paymentStatus === 'pago' ? undefined : date,
    notes: '',
  };
  return { member: updated, transaction };
}
