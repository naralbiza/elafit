import React, { useMemo } from 'react';
import { Layers, Truck, Target, ArrowDownWideNarrow, TrendingDown, Clock, Receipt } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { Transaction } from '../../types';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { groupSum, monthLabel, sumAmount } from '../../utils/finance';
import { formatPct, monthTransactions } from './financeCalc';
import { Card, Empty, Kpi, ShareBar, StatusBadge, tdCls, thCls, theadCls } from './ui';
import { RecurringExpenses } from './RecurringExpenses';

const Breakdown: React.FC<{ title: React.ReactNode; data: Record<string, number>; total: number }> = ({ title, data, total }) => {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <Card title={title}>
      {rows.length ? (
        <div className="space-y-2.5 text-xs">
          {rows.map(([name, value]) => (
            <div key={name}>
              <div className="flex justify-between gap-2 mb-1">
                <span className="text-[#61574E]">{name}</span>
                <span className="font-bold text-[#2C3228] whitespace-nowrap">
                  {formatKz(value)} <span className="text-[#8C827A] font-normal">{formatPct(total ? (value / total) * 100 : 0)}</span>
                </span>
              </div>
              <ShareBar pct={total ? (value / total) * 100 : 0} />
            </div>
          ))}
        </div>
      ) : (
        <Empty>Sem despesas neste mês.</Empty>
      )}
    </Card>
  );
};

export const ExpensesTab: React.FC<{ monthKey: string }> = ({ monthKey }) => {
  const { transactions } = useData();

  // Todas as despesas do mês (pagas e por pagar)
  const expenses = useMemo(() => monthTransactions(transactions, monthKey).filter((t) => t.type === 'despesa'), [transactions, monthKey]);
  const total = sumAmount(expenses);
  const paid = sumAmount(expenses.filter((t) => t.status === 'pago'));
  const byCategory = groupSum(expenses, (t) => t.category, (t) => t.amount);
  const bySupplier = groupSum(expenses, (t) => t.supplier?.trim() || 'Sem fornecedor', (t) => t.amount);
  const byCenter = groupSum(expenses, (t) => t.costCenter || 'Geral', (t) => t.amount);
  const biggest: Transaction[] = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Despesas do mês" value={formatKz(total)} icon={<Receipt className="w-5 h-5" />} hint={`${expenses.length} lançamento(s) em ${monthLabel(monthKey)}`} />
        <Kpi label="Já pagas" value={formatKz(paid)} icon={<TrendingDown className="w-5 h-5" />} tone="red" />
        <Kpi label="Por pagar" value={formatKz(total - paid)} icon={<Clock className="w-5 h-5" />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Breakdown title={<><Layers className="w-4 h-4 text-[#D0A68D]" /> Por categoria</>} data={byCategory} total={total} />
        <Breakdown title={<><Truck className="w-4 h-4 text-[#D0A68D]" /> Por fornecedor</>} data={bySupplier} total={total} />
        <Breakdown title={<><Target className="w-4 h-4 text-[#D0A68D]" /> Por serviço / centro de custo</>} data={byCenter} total={total} />
      </div>

      <Card title={<><ArrowDownWideNarrow className="w-4 h-4 text-[#D0A68D]" /> Maiores despesas do mês</>}>
        {biggest.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={theadCls}>
                <tr>
                  <th className={thCls}>Data</th>
                  <th className={thCls}>Descrição</th>
                  <th className={thCls}>Categoria</th>
                  <th className={thCls}>Fornecedor</th>
                  <th className={`${thCls} text-right`}>Valor</th>
                  <th className={`${thCls} text-right`}>% do total</th>
                  <th className={thCls}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {biggest.map((t) => (
                  <tr key={t.id}>
                    <td className={`${tdCls} text-[#7A7067] whitespace-nowrap`}>{formatDatePt(t.date)}</td>
                    <td className={`${tdCls} font-bold text-[#2C3228]`}>{t.description}</td>
                    <td className={`${tdCls} text-[#61574E]`}>{t.category}</td>
                    <td className={`${tdCls} text-[#61574E]`}>{t.supplier || '—'}</td>
                    <td className={`${tdCls} text-right font-bold text-[#991B1B] whitespace-nowrap`}>{formatKz(t.amount)}</td>
                    <td className={`${tdCls} text-right text-[#61574E]`}>{formatPct(total ? (t.amount / total) * 100 : 0)}</td>
                    <td className={tdCls}><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Sem despesas registadas neste mês.</Empty>
        )}
      </Card>

      <RecurringExpenses monthKey={monthKey} />
    </div>
  );
};
