import React, { useMemo } from 'react';
import { Wallet, Network } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useData } from '../../data/DataContext';
import { formatKz } from '../../utils/formatters';
import { accountBalances, costCenterDistribution, groupSum, monthLabel } from '../../utils/finance';
import { formatPct, monthTransactions } from './financeCalc';
import { Card, Empty, REVENUE_COLOR, EXPENSE_COLOR, tdCls, thCls, theadCls } from './ui';

const kzAxis = (v: number) => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

export const AccountsTab: React.FC<{ monthKey: string }> = ({ monthKey }) => {
  const { transactions, settings } = useData();

  const balances = useMemo(() => accountBalances(transactions, settings.accounts), [transactions, settings.accounts]);
  const paidMonth = useMemo(() => monthTransactions(transactions, monthKey).filter((t) => t.status === 'pago'), [transactions, monthKey]);
  const inflow = groupSum(paidMonth.filter((t) => t.type === 'receita'), (t) => t.account, (t) => t.amount);
  const outflow = groupSum(paidMonth.filter((t) => t.type === 'despesa'), (t) => t.account, (t) => t.amount);
  const accounts = [...new Set([...Object.keys(balances), ...Object.keys(inflow), ...Object.keys(outflow)])];
  const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);

  const centers = useMemo(() => costCenterDistribution(transactions, settings.costCenters, monthKey), [transactions, settings.costCenters, monthKey]);
  const sharedCosts = paidMonth.filter((t) => t.type === 'despesa' && (t.costCenter || 'Geral') === 'Geral').reduce((s, t) => s + t.amount, 0);
  const chartData = centers.map((c) => ({ name: c.center, Receita: c.revenue, Custos: c.directCosts + c.allocatedCosts }));
  const tot = centers.reduce(
    (a, c) => ({ revenue: a.revenue + c.revenue, direct: a.direct + c.directCosts, allocated: a.allocated + c.allocatedCosts, result: a.result + c.result }),
    { revenue: 0, direct: 0, allocated: 0, result: 0 }
  );

  return (
    <div className="space-y-6">
      <Card
        title={<><Wallet className="w-4 h-4 text-[#D0A68D]" /> Distribuição por contas</>}
        subtitle={`Saldo acumulado de todos os lançamentos pagos • movimentos de ${monthLabel(monthKey)}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((a) => (
            <div key={a} className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl text-xs">
              <p className="text-[10px] uppercase tracking-wider text-[#8C827A] font-bold">{a || 'Sem conta'}</p>
              <p className={`font-serif text-xl font-bold mt-1 ${(balances[a] ?? 0) < 0 ? 'text-[#991B1B]' : 'text-[#2C3228]'}`}>{formatKz(balances[a] ?? 0)}</p>
              <div className="mt-2 flex justify-between text-[11px]">
                <span className="text-[#166534]">+{formatKz(inflow[a] ?? 0)}</span>
                <span className="text-[#991B1B]">−{formatKz(outflow[a] ?? 0)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#2C3228] font-bold mt-4">Saldo total: {formatKz(totalBalance)}</p>
      </Card>

      <Card
        title={<><Network className="w-4 h-4 text-[#D0A68D]" /> Distribuição de custos por serviço — {monthLabel(monthKey)}</>}
        subtitle="Receitas e custos pagos, IVA incluído"
      >
        <p className="text-[11px] text-[#61574E] mb-4 p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl">
          Cada lançamento tem um serviço (centro de custo). Os custos atribuídos a um serviço são <strong>custos diretos</strong>. Os custos
          marcados como <strong>"Geral"</strong> ({formatKz(sharedCosts)} este mês — renda, energia, receção...) são repartidos pelos serviços
          proporcionalmente à receita de cada um. Se não houver receita, são repartidos em partes iguais.
        </p>
        {centers.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className={theadCls}>
                  <tr>
                    <th className={thCls}>Serviço</th>
                    <th className={`${thCls} text-right`}>Receita</th>
                    <th className={`${thCls} text-right`}>Custos diretos</th>
                    <th className={`${thCls} text-right`}>Custos gerais rateados</th>
                    <th className={`${thCls} text-right`}>Resultado</th>
                    <th className={`${thCls} text-right`}>Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE4]">
                  {centers.map((c) => (
                    <tr key={c.center}>
                      <td className={`${tdCls} font-bold text-[#2C3228]`}>{c.center}</td>
                      <td className={`${tdCls} text-right text-[#166534]`}>{formatKz(c.revenue)}</td>
                      <td className={`${tdCls} text-right text-[#61574E]`}>{formatKz(c.directCosts)}</td>
                      <td className={`${tdCls} text-right text-[#61574E]`}>{formatKz(c.allocatedCosts)}</td>
                      <td className={`${tdCls} text-right font-bold ${c.result < 0 ? 'text-[#991B1B]' : 'text-[#2C3228]'}`}>{formatKz(c.result)}</td>
                      <td className={`${tdCls} text-right text-[#61574E]`}>{c.revenue > 0 ? formatPct((c.result / c.revenue) * 100) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#FBF9F6] font-bold text-[#2C3228]">
                  <tr>
                    <td className={tdCls}>Total</td>
                    <td className={`${tdCls} text-right`}>{formatKz(tot.revenue)}</td>
                    <td className={`${tdCls} text-right`}>{formatKz(tot.direct)}</td>
                    <td className={`${tdCls} text-right`}>{formatKz(tot.allocated)}</td>
                    <td className={`${tdCls} text-right`}>{formatKz(tot.result)}</td>
                    <td className={`${tdCls} text-right`}>{tot.revenue > 0 ? formatPct((tot.result / tot.revenue) * 100) : '—'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="h-64 mt-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F0EAE4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7A7067' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tickFormatter={kzAxis} tick={{ fontSize: 11, fill: '#7A7067' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v: any, name: any) => [formatKz(Number(v)), name]} cursor={{ fill: '#FBF9F6' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Bar dataKey="Receita" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Custos" name="Custos (diretos + rateados)" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <Empty>Sem movimentos pagos neste mês.</Empty>
        )}
      </Card>
    </div>
  );
};
