import React, { useMemo, useState } from 'react';
import { Activity, Search, TrendingDown, TrendingUp, Minus, User } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Member, PhysicalEvaluation } from '../types';
import { formatDatePt } from '../utils/dates';

interface EvaluationsModuleProps {
  onSelectMember: (m: Member) => void;
}

export const EvaluationsModule: React.FC<EvaluationsModuleProps> = ({ onSelectMember }) => {
  const { members } = useData();
  const [search, setSearch] = useState('');

  const membersWithEvals = useMemo(() => {
    const term = search.toLowerCase().trim();
    return members
      .filter((m) => m.evaluations && m.evaluations.length > 0)
      .filter((m) => !term || m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term))
      .sort((a, b) => {
        const la = a.evaluations[a.evaluations.length - 1]?.date ?? '';
        const lb = b.evaluations[b.evaluations.length - 1]?.date ?? '';
        return lb.localeCompare(la);
      });
  }, [members, search]);

  const totalEvals = useMemo(() => members.reduce((s, m) => s + (m.evaluations?.length ?? 0), 0), [members]);
  const avgBodyFat = useMemo(() => {
    const latest = members
      .filter((m) => m.evaluations?.length)
      .map((m) => m.evaluations[m.evaluations.length - 1].bodyFatPercent);
    return latest.length ? (latest.reduce((a, b) => a + b, 0) / latest.length).toFixed(1) : '—';
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">Avaliações Físicas</span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Composição Corporal &amp; Progresso</h2>
          <p className="text-xs text-[#7A7067]">
            Histórico de avaliações das alunas — peso, gordura corporal e massa muscular.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total de Avaliações" value={String(totalEvals)} icon={<Activity className="w-4 h-4" />} />
        <KpiCard
          label="Alunas com Avaliação"
          value={String(membersWithEvals.length)}
          icon={<User className="w-4 h-4" />}
        />
        <KpiCard label="% Gordura Média (última)" value={`${avgBodyFat}%`} icon={<TrendingDown className="w-4 h-4" />} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B92]" />
        <input
          type="text"
          placeholder="Procurar aluna…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
        />
      </div>

      {/* Table */}
      {membersWithEvals.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] p-12 text-center">
          <Activity className="w-8 h-8 mx-auto text-[#C9C0B8]" />
          <p className="text-xs text-[#7A7067] mt-3">Nenhuma avaliação registada ainda.</p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#ECE5DE] text-[#7A7067] uppercase tracking-wider text-[10px]">
                <th className="text-left px-5 py-3 font-semibold">Aluna</th>
                <th className="text-left px-5 py-3 font-semibold">Última Avaliação</th>
                <th className="text-right px-5 py-3 font-semibold">Peso (kg)</th>
                <th className="text-right px-5 py-3 font-semibold">% Gordura</th>
                <th className="text-right px-5 py-3 font-semibold">Massa Muscular (kg)</th>
                <th className="text-center px-5 py-3 font-semibold">Tendência</th>
                <th className="text-right px-5 py-3 font-semibold">Avaliações</th>
              </tr>
            </thead>
            <tbody>
              {membersWithEvals.map((m) => {
                const evals = m.evaluations;
                const latest = evals[evals.length - 1];
                const prev = evals.length > 1 ? evals[evals.length - 2] : null;
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMember(m)}
                    className="border-b border-[#F4ECE6] hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold text-[#2C3228]">{m.name}</td>
                    <td className="px-5 py-3 text-[#61574E]">{formatDatePt(latest.date)}</td>
                    <td className="px-5 py-3 text-right text-[#2C3228] font-medium">{latest.weightKg.toFixed(1)}</td>
                    <td className="px-5 py-3 text-right text-[#2C3228] font-medium">{latest.bodyFatPercent.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right text-[#2C3228] font-medium">{latest.muscleMassKg.toFixed(1)}</td>
                    <td className="px-5 py-3 text-center">
                      <TrendIndicator latest={latest} prev={prev} />
                    </td>
                    <td className="px-5 py-3 text-right text-[#61574E]">{evals.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ---------- small helpers ---------- */

const KpiCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
    <div className="flex items-center gap-2 text-[#7A7067] mb-2">{icon}<span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span></div>
    <p className="font-serif text-2xl font-bold text-[#2C3228]">{value}</p>
  </div>
);

const TrendIndicator: React.FC<{ latest: PhysicalEvaluation; prev: PhysicalEvaluation | null }> = ({ latest, prev }) => {
  if (!prev) return <Minus className="w-3.5 h-3.5 text-[#A39B92] mx-auto" />;
  const fatDiff = latest.bodyFatPercent - prev.bodyFatPercent;
  if (fatDiff < -0.3) return <TrendingDown className="w-3.5 h-3.5 text-emerald-600 mx-auto" />;
  if (fatDiff > 0.3) return <TrendingUp className="w-3.5 h-3.5 text-rose-500 mx-auto" />;
  return <Minus className="w-3.5 h-3.5 text-[#A39B92] mx-auto" />;
};
