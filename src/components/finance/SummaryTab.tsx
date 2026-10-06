import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Coins, Clock, PieChart as PieIcon, BarChart3, FileDown, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useData } from '../../data/DataContext';
import { formatKz } from '../../utils/formatters';
import { monthLabel, netOfVat, shiftMonth } from '../../utils/finance';
import { downloadMonthlyReportPdf } from '../../utils/monthlyReportPdf';
import { computeDre, formatPct, marginPct, isNonPayrollTaxPayment, monthTransactions } from './financeCalc';
import { Card, Kpi, Empty, SERIES_COLORS, OTHER_COLOR, REVENUE_COLOR, EXPENSE_COLOR, secondaryBtn } from './ui';

// Categorias com cor fixa no gráfico; as restantes agrupam-se em "Outras"
const PIE_CATEGORIES = [
  'Salários & RH',
  'Impostos & Contribuições',
  'Renda & Instalações',
  'Água & Energia',
  'Equipamento & Manutenção',
  'Fornecedores & Stock',
  'Marketing & Eventos',
];

const shortMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '') + ` ${String(y).slice(2)}`;
};

const kzAxis = (v: number) => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

export const SummaryTab: React.FC<{ monthKey: string }> = ({ monthKey }) => {
  const { transactions, payrollRuns, settings } = useData();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadMonthlyReportPdf({
        monthKey,
        transactions,
        payrollRuns,
        settings,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório mensal em PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const dre = useMemo(() => computeDre(transactions, payrollRuns, settings, monthKey), [transactions, payrollRuns, settings, monthKey]);
  const s = dre.summary;
  const margin = marginPct(dre.netResult, dre.netRevenue);

  const pieData = useMemo(() => {
    const expenses = monthTransactions(transactions, monthKey).filter(
      (t) => t.type === 'despesa' && t.status === 'pago' && !isNonPayrollTaxPayment(t)
    );
    const rows = PIE_CATEGORIES.map((c, i) => ({
      name: c,
      color: SERIES_COLORS[i],
      value: expenses.filter((t) => t.category === c).reduce((acc, t) => acc + netOfVat(t.amount, t.vatRate), 0),
    }));
    const other = expenses.filter((t) => !PIE_CATEGORIES.includes(t.category)).reduce((acc, t) => acc + netOfVat(t.amount, t.vatRate), 0);
    return [...rows, { name: 'Outras despesas', color: OTHER_COLOR, value: other }].filter((r) => r.value > 0);
  }, [transactions, monthKey]);
  const pieTotal = pieData.reduce((a, r) => a + r.value, 0);

  const barData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey, i - 5)).map((key) => {
        const d = computeDre(transactions, payrollRuns, settings, key);
        return { month: shortMonth(key), Receitas: d.summary.revenue, Despesas: d.summary.expenses };
      }),
    [transactions, payrollRuns, settings, monthKey]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Receitas cobradas" value={formatKz(s.revenue)} icon={<TrendingUp className="w-5 h-5" />} tone="green" badge="Entradas" hint={`IVA contido: ${formatKz(s.vatCollected)}`} />
        <Kpi label="Despesas pagas" value={formatKz(s.expenses)} icon={<TrendingDown className="w-5 h-5" />} tone="red" badge="Saídas" hint={`IVA dedutível: ${formatKz(s.vatDeductible)}`} />
        <Kpi
          label="Resultado líquido"
          value={formatKz(dre.netResult)}
          icon={<Coins className="w-5 h-5 text-[#D0A68D]" />}
          badge={`Margem ${formatPct(margin)}`}
          tone={dre.netResult >= 0 ? 'neutral' : 'red'}
          hint="Após Imposto Industrial estimado"
        />
        <Kpi
          label="Pendentes"
          value={formatKz(s.pendingRevenue)}
          icon={<Clock className="w-5 h-5" />}
          tone="amber"
          badge="A receber"
          hint={`A pagar: ${formatKz(s.pendingExpenses)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2"
          title="Demonstração de Resultados"
          subtitle={`${monthLabel(monthKey)} • regime de caixa (lançamentos pagos), valores sem IVA`}
          actions={
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={secondaryBtn}
              title="Gerar e descarregar relatório financeiro mensal em formato PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8C6353]" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-[#8C6353]" />
              )}
              <span>{isGeneratingPdf ? 'A gerar...' : 'Exportar PDF'}</span>
            </button>
          }
        >
          <div className="space-y-2 text-xs">
            <DreRow label="Receitas brutas (IVA incluído)" value={dre.grossRevenue} strong tone="green" />
            {dre.revenueByCategory.map((l) => (
              <DreRow key={l.label} label={l.label} value={l.amount} indent />
            ))}
            <DreRow label="(−) IVA liquidado" value={-dre.vatCollected} indent />
            <DreRow label="= Receita líquida" value={dre.netRevenue} strong />

            <DreRow label="(−) Custos operacionais (sem IVA)" value={-dre.totalCosts} strong tone="red" />
            {dre.costsByCategory.map((l) => (
              <DreRow key={l.label} label={l.label} value={-l.amount} indent />
            ))}
            {!dre.costsByCategory.length && <p className="pl-4 text-[#8C827A]">Sem despesas pagas neste mês.</p>}

            <DreRow label="= Resultado operacional" value={dre.operatingResult} strong />
            <DreRow label={`(−) Imposto Industrial estimado (${formatPct(settings.industrialTaxRate, 0)})`} value={-dre.industrialTax} indent />
            <div className="flex justify-between p-4 bg-[#2C3228] text-white font-bold text-sm rounded-xl">
              <span>= Resultado líquido</span>
              <span className="text-[#D0A68D]">{formatKz(dre.netResult)}</span>
            </div>
            {dre.excludedTaxPayments > 0 && (
              <p className="text-[11px] text-[#8C827A]">
                Pagamentos de impostos ao Estado (IVA, Imposto Industrial) de {formatKz(dre.excludedTaxPayments)} não entram na DRE — são
                liquidações de impostos já considerados acima.
              </p>
            )}
          </div>
        </Card>

        <Card title={<><PieIcon className="w-4 h-4 text-[#D0A68D]" /> Despesas por categoria</>} subtitle="Pagas no mês, sem IVA">
          {pieData.length ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [`${formatKz(Number(v))} (${formatPct((Number(v) / pieTotal) * 100)})`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-[11px] mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[#61574E]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-[#2C3228] whitespace-nowrap">
                      {formatKz(d.value)} <span className="text-[#8C827A] font-normal">{formatPct((d.value / pieTotal) * 100, 0)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty>Sem despesas pagas neste mês.</Empty>
          )}
        </Card>
      </div>

      <Card title={<><BarChart3 className="w-4 h-4 text-[#D0A68D]" /> Receitas vs despesas — últimos 6 meses</>} subtitle="Valores pagos, IVA incluído">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={2} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F0EAE4" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A7067' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={kzAxis} tick={{ fontSize: 11, fill: '#7A7067' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v: any, name: any) => [formatKz(Number(v)), name]} cursor={{ fill: '#FBF9F6' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="Receitas" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Despesas" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const DreRow: React.FC<{ label: string; value: number; strong?: boolean; indent?: boolean; tone?: 'green' | 'red' }> = ({
  label,
  value,
  strong,
  indent,
  tone,
}) => {
  if (indent)
    return (
      <div className="flex justify-between pl-4 text-[#61574E]">
        <span>• {label}</span>
        <span>{formatKz(value)}</span>
      </div>
    );
  const bg = tone === 'green' ? 'bg-[#EAF5ED] text-[#166534]' : tone === 'red' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#F4ECE6] text-[#2C3228]';
  return (
    <div className={`flex justify-between p-3 rounded-xl ${strong ? 'font-bold' : ''} ${bg}`}>
      <span>{label}</span>
      <span>{formatKz(value)}</span>
    </div>
  );
};
