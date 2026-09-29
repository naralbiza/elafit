import React, { useMemo } from 'react';
import { AlertTriangle, Send, CheckCircle2, CalendarClock } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { Transaction } from '../../types';
import { formatKz } from '../../utils/formatters';
import { formatDatePt, localToday } from '../../utils/dates';
import { sumAmount } from '../../utils/finance';
import { isOverdue, markAsPaid } from './financeCalc';
import { Card, Empty, StatusBadge, secondaryBtn } from './ui';

// Número de WhatsApp em formato internacional (Angola: +244)
function waNumber(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length === 9) return `244${digits}`;
  return digits;
}

const dueOf = (t: Transaction) => t.dueDate || t.date;

export const CollectionsTab: React.FC = () => {
  const { transactions, members, settings, actions } = useData();
  const today = localToday();

  const receivables = useMemo(
    () => transactions.filter((t) => t.type === 'receita' && t.status !== 'pago').sort((a, b) => dueOf(a).localeCompare(dueOf(b))),
    [transactions]
  );
  const payables = useMemo(
    () => transactions.filter((t) => t.type === 'despesa' && t.status !== 'pago').sort((a, b) => dueOf(a).localeCompare(dueOf(b))),
    [transactions]
  );

  const pay = (t: Transaction) => actions.saveTransaction(markAsPaid(t, transactions));

  const reminder = (t: Transaction) => {
    const member = members.find((m) => m.id === t.memberId);
    const name = member?.name || t.memberName || 'estimada aluna';
    const text = `Olá ${name}! A sua ${t.description} no valor de ${formatKz(t.amount)}${
      dueOf(t) ? ` (vencimento ${formatDatePt(dueOf(t))})` : ''
    } encontra-se pendente. Pode pagar por Multicaixa Express, transferência ou na receção. Obrigada e bons treinos! — ${settings.companyName}`;
    return `https://wa.me/${waNumber(member?.phone)}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card
        title={<><AlertTriangle className="w-4 h-4 text-[#D97706]" /> Receitas por cobrar</>}
        subtitle={`${receivables.length} em aberto • ${formatKz(sumAmount(receivables))} (todos os meses)`}
      >
        {receivables.length ? (
          <div className="space-y-3">
            {receivables.map((t) => {
              const late = isOverdue(t, today);
              return (
                <div key={t.id} className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${late ? 'bg-[#FEE2E2]/40 border-[#FCA5A5]' : 'bg-[#FEF3C7]/30 border-[#FCD34D]'}`}>
                  <div className="text-xs">
                    <p className="font-bold text-[#2C3228]">{t.description}</p>
                    <p className="text-[#61574E] mt-0.5">
                      {t.memberName ? `${t.memberName} • ` : ''}
                      <strong>{formatKz(t.amount)}</strong> • Vence {formatDatePt(dueOf(t))}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusBadge status={late && t.status === 'pendente' ? 'atrasado' : t.status} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={reminder(t)} target="_blank" rel="noreferrer" className="px-3 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Lembrete WhatsApp
                    </a>
                    <button onClick={() => pay(t)} className={secondaryBtn}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" /> Marcar como pago
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>Não há receitas por cobrar. Excelente!</Empty>
        )}
      </Card>

      <Card
        title={<><CalendarClock className="w-4 h-4 text-[#D0A68D]" /> Despesas por pagar</>}
        subtitle={`${payables.length} em aberto • ${formatKz(sumAmount(payables))} • ordenadas por vencimento`}
      >
        {payables.length ? (
          <ul className="divide-y divide-[#F0EAE4] text-xs">
            {payables.map((t) => {
              const late = isOverdue(t, today);
              return (
                <li key={t.id} className={`py-3 px-2 flex flex-wrap items-center justify-between gap-2 ${late ? 'bg-[#FEE2E2]/40 rounded-xl' : ''}`}>
                  <div>
                    <p className="font-bold text-[#2C3228]">{t.description}</p>
                    <p className="text-[#8C827A]">
                      {[t.supplier, t.category, t.account].filter(Boolean).join(' • ')}
                    </p>
                    <p className={late ? 'text-[#991B1B] font-bold' : 'text-[#61574E]'}>
                      {late ? 'Em atraso desde' : 'Vence a'} {formatDatePt(dueOf(t))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#991B1B] whitespace-nowrap">{formatKz(t.amount)}</span>
                    <button onClick={() => pay(t)} className={secondaryBtn}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" /> Pago
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Não há despesas por pagar.</Empty>
        )}
      </Card>
    </div>
  );
};
