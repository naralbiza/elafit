import React, { useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { useData } from '../data/DataContext';
import { formatKz } from '../utils/formatters';

type Period = 'month' | 'quarter' | 'year';

export const ReportsModule: React.FC = () => {
  const { members, transactions, employees, plans } = useData();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();

  const periodFilter = useMemo(() => {
    const start = new Date(now);
    if (period === 'month') start.setMonth(start.getMonth() - 1);
    else if (period === 'quarter') start.setMonth(start.getMonth() - 3);
    else start.setFullYear(start.getFullYear() - 1);
    return start.toISOString().slice(0, 10);
  }, [period]);

  const filteredTx = useMemo(
    () => transactions.filter((t) => t.date >= periodFilter),
    [transactions, periodFilter]
  );

  const totalRevenue = useMemo(
    () => filteredTx.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );
  const totalExpenses = useMemo(
    () => filteredTx.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );
  const profit = totalRevenue - totalExpenses;

  const activeMembers = useMemo(() => members.filter((m) => m.memberStatus === 'ativa').length, [members]);
  const newMembers = useMemo(() => members.filter((m) => m.createdAt >= periodFilter).length, [members, periodFilter]);

  const topPlans = useMemo(() => {
    const counts: Record<string, number> = {};
    members
      .filter((m) => m.memberStatus === 'ativa' && m.plan)
      .forEach((m) => {
        counts[m.plan] = (counts[m.plan] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [members]);

  const revenueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === 'receita')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTx]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTx]);

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'month', label: 'Último Mês' },
    { id: 'quarter', label: 'Último Trimestre' },
    { id: 'year', label: 'Último Ano' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">Relatórios</span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Visão Analítica</h2>
          <p className="text-xs text-[#7A7067]">Resumo financeiro, adesão e desempenho por período.</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-2 overflow-x-auto no-scrollbar">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              period === p.id
                ? 'bg-[#2C3228] text-[#FFFFFF] shadow-xs'
                : 'text-[#61574E] hover:bg-[#F4ECE6] hover:text-[#2C3228]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Receita" value={formatKz(totalRevenue)} accent="text-emerald-700" />
        <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Despesa" value={formatKz(totalExpenses)} accent="text-rose-600" />
        <KpiCard icon={<BarChart3 className="w-4 h-4" />} label="Lucro" value={formatKz(profit)} accent={profit >= 0 ? 'text-emerald-700' : 'text-rose-600'} />
        <KpiCard icon={<Users className="w-4 h-4" />} label="Alunas Ativas" value={String(activeMembers)} sub={`+${newMembers} novas`} />
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by category */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#2C3228] uppercase tracking-wider">Receita por Categoria</h3>
          {revenueByCategory.length === 0 ? (
            <p className="text-xs text-[#7A7067]">Sem receitas no período.</p>
          ) : (
            revenueByCategory.map(([cat, total]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-[#61574E]">{cat}</span>
                <span className="font-semibold text-[#2C3228]">{formatKz(total)}</span>
              </div>
            ))
          )}
        </div>

        {/* Expenses by category */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#2C3228] uppercase tracking-wider">Despesa por Categoria</h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-xs text-[#7A7067]">Sem despesas no período.</p>
          ) : (
            expenseByCategory.map(([cat, total]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-[#61574E]">{cat}</span>
                <span className="font-semibold text-[#2C3228]">{formatKz(total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top plans */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#2C3228] uppercase tracking-wider">Top 5 Planos (Alunas Ativas)</h3>
        {topPlans.length === 0 ? (
          <p className="text-xs text-[#7A7067]">Sem dados.</p>
        ) : (
          topPlans.map(([plan, count]) => {
            const max = topPlans[0][1];
            return (
              <div key={plan} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#61574E]">{plan}</span>
                  <span className="font-semibold text-[#2C3228]">{count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4ECE6]">
                  <div
                    className="h-full rounded-full bg-[#D0A68D] transition-all"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ---- Helper ---- */

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent?: string; sub?: string }> = ({
  icon,
  label,
  value,
  accent,
  sub,
}) => (
  <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
    <div className="flex items-center gap-2 text-[#7A7067] mb-2">
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
    </div>
    <p className={`font-serif text-2xl font-bold ${accent || 'text-[#2C3228]'}`}>{value}</p>
    {sub && <p className="text-[10px] text-[#7A7067] mt-0.5">{sub}</p>}
  </div>
);
