import React, { useMemo } from 'react';
import { Users, Info, UserX, Wallet } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { PayrollRun } from '../../types';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { employerCost, monthLabel, sumAmount } from '../../utils/finance';
import { SALARY_CATEGORY, monthTransactions } from './financeCalc';
import { Card, Empty, StatusBadge, tdCls, thCls, theadCls } from './ui';

export const PayrollTab: React.FC<{ monthKey: string }> = ({ monthKey }) => {
  const { payrollRuns, employees, transactions } = useData();

  const runs = useMemo(
    () => payrollRuns.filter((r) => r.month === monthKey).sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    [payrollRuns, monthKey]
  );
  const total = (f: (r: PayrollRun) => number) => runs.reduce((s, r) => s + f(r), 0);
  const withoutRun = employees.filter((e) => !runs.some((r) => r.employeeId === e.id));
  const salaryTxs = monthTransactions(transactions, monthKey)
    .filter((t) => t.type === 'despesa' && t.category === SALARY_CATEGORY)
    .sort((a, b) => a.date.localeCompare(b.date));

  const cols: [string, (r: PayrollRun) => number][] = [
    ['Bruto', (r) => r.gross],
    ['INSS trab.', (r) => r.inssEmployee],
    ['INSS patronal', (r) => r.inssEmployer],
    ['IRT', (r) => r.irt],
    ['Retenção', (r) => r.withholding],
    ['Líquido', (r) => r.net],
    ['Custo empresa', (r) => employerCost(r)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F4ECE6] border border-[#E0D3C7] text-xs text-[#61574E]">
        <Info className="w-4 h-4 text-[#8C6353] shrink-0 mt-0.5" />
        <span>
          Resumo apenas de consulta. Os salários são processados e pagos no módulo <strong>Recursos Humanos</strong>; aqui vê o impacto
          financeiro de {monthLabel(monthKey)}.
        </span>
      </div>

      <Card title={<><Users className="w-4 h-4 text-[#D0A68D]" /> Processamento salarial — {monthLabel(monthKey)}</>} subtitle={`${runs.length} colaboradora(s) processada(s)`}>
        {runs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={theadCls}>
                <tr>
                  <th className={thCls}>Colaboradora</th>
                  {cols.map(([l]) => <th key={l} className={`${thCls} text-right`}>{l}</th>)}
                  <th className={thCls}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className={tdCls}>
                      <div className="font-bold text-[#2C3228]">{r.employeeName}</div>
                      <div className="text-[10px] text-[#8C827A]">{r.role} • {r.contractType}</div>
                    </td>
                    {cols.map(([l, f]) => (
                      <td key={l} className={`${tdCls} text-right whitespace-nowrap ${l === 'Líquido' ? 'font-bold text-[#2C3228]' : 'text-[#61574E]'}`}>{formatKz(f(r))}</td>
                    ))}
                    <td className={tdCls}>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'pago' ? 'bg-[#EAF5ED] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {r.status === 'pago' ? `Pago${r.paidAt ? ` ${formatDatePt(r.paidAt.slice(0, 10))}` : ''}` : 'Processado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#FBF9F6] font-bold text-[#2C3228]">
                <tr>
                  <td className={tdCls}>Totais</td>
                  {cols.map(([l, f]) => <td key={l} className={`${tdCls} text-right whitespace-nowrap`}>{formatKz(total(f))}</td>)}
                  <td className={tdCls} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <Empty>Ainda não foram processados salários para {monthLabel(monthKey)}.</Empty>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={<><UserX className="w-4 h-4 text-[#D0A68D]" /> Colaboradoras sem processamento</>} subtitle="Equipa sem salário processado neste mês">
          {withoutRun.length ? (
            <ul className="divide-y divide-[#F0EAE4] text-xs">
              {withoutRun.map((e) => (
                <li key={e.id} className="py-2 flex justify-between gap-2">
                  <span>
                    <span className="font-bold text-[#2C3228]">{e.name}</span>
                    <span className="text-[#8C827A]"> • {e.role}{e.status !== 'Ativa' ? ` • ${e.status}` : ''}</span>
                  </span>
                  <span className="text-[#61574E] whitespace-nowrap">Base {formatKz(e.baseSalary)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Todas as colaboradoras têm salário processado.</Empty>
          )}
        </Card>

        <Card title={<><Wallet className="w-4 h-4 text-[#D0A68D]" /> Lançamentos de salários do mês</>} subtitle={`Categoria "${SALARY_CATEGORY}" • total ${formatKz(sumAmount(salaryTxs))}`}>
          {salaryTxs.length ? (
            <ul className="divide-y divide-[#F0EAE4] text-xs">
              {salaryTxs.map((t) => (
                <li key={t.id} className="py-2 flex justify-between items-center gap-2">
                  <span>
                    <span className="font-bold text-[#2C3228]">{t.description}</span>
                    <span className="block text-[10px] text-[#8C827A]">{formatDatePt(t.date)} • {t.account}</span>
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-bold text-[#991B1B]">{formatKz(t.amount)}</span>
                    <StatusBadge status={t.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem lançamentos de salários neste mês.</Empty>
          )}
        </Card>
      </div>
    </div>
  );
};
