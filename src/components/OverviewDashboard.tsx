import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Dumbbell,
  Heart,
  ChevronRight,
  UserCheck,
  CreditCard,
  Target,
  CheckCircle2,
  Circle,
  UserPlus,
  Plus,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MemberStatus, TabType } from '../types';
import { useData } from '../data/DataContext';
import { useAuth } from '../auth/AuthContext';
import { currentMonthKey, isInMonth, shiftMonth, summarizeMonth } from '../utils/finance';
import { formatDatePt, localToday, addDays, parseTimeRange, weekDayOf } from '../utils/dates';
import { formatKz } from '../utils/formatters';
import { MEMBER_STATUS_META, createdDate, firstName, initials } from './crm/memberShared';

interface OverviewDashboardProps {
  setActiveTab: (tab: TabType) => void;
  onOpenAddMember: () => void;
  onOpenAddTransaction: () => void;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const monthShort = (monthKey: string) => MONTHS_SHORT[Number(monthKey.slice(5, 7)) - 1] ?? monthKey;

// Variação percentual (null se não houver base de comparação)
function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

const ChangeBadge: React.FC<{ curr: number; prev: number; pill?: boolean }> = ({ curr, prev, pill }) => {
  const pct = pctChange(curr, prev);
  const up = pct === null ? curr > 0 : pct >= 0;
  const text = pct === null ? (curr > 0 ? 'novo' : '—') : `${pct >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(pct))}%`;
  const color = pct === 0 ? 'text-[#8C827A]' : up ? 'text-[#3A6B4C]' : 'text-[#C85252]';
  if (pill) {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${up ? 'bg-[#E6F0EB]' : 'bg-[#FDECEB]'} ${color}`}>{text}</span>
    );
  }
  return <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${color}`}>{text}</span>;
};

const fmtM = (n: number) => `${n.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}M Kz`;

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setActiveTab, onOpenAddMember, onOpenAddTransaction }) => {
  const { members, transactions, payrollRuns, scheduledClasses, classes, staff, settings } = useData();
  const { profile, hasModule } = useAuth();

  // Relógio (atualiza a cada minuto)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const today = localToday();
  const monthKey = currentMonthKey();
  const prevMonthKey = shiftMonth(monthKey, -1);

  const stats = useMemo(() => {
    const monthStart = `${monthKey}-01`;
    const active = members.filter((m) => m.memberStatus === 'ativa');
    const activePrev = active.filter((m) => {
      const d = createdDate(m);
      return d && d < monthStart;
    }).length;

    const curr = summarizeMonth(transactions, payrollRuns, settings, monthKey);
    const prev = summarizeMonth(transactions, payrollRuns, settings, prevMonthKey);

    const done = (mk: string) => scheduledClasses.filter((c) => c.status === 'realizada' && isInMonth(c.date, mk)).length;

    const counts: Record<MemberStatus, number> = { ativa: 0, pendente_renovacao: 0, suspensa: 0, inativa: 0 };
    members.forEach((m) => {
      if (m.memberStatus in counts) counts[m.memberStatus]++;
    });
    const retentionBase = counts.ativa + counts.suspensa + counts.inativa + counts.pendente_renovacao;
    const retention = retentionBase > 0 ? Math.round((counts.ativa / retentionBase) * 100) : 0;

    return {
      activeCount: active.length,
      activePrev,
      revenue: curr.revenue,
      revenuePrev: prev.revenue,
      classesDone: done(monthKey),
      classesDonePrev: done(prevMonthKey),
      counts,
      retentionBase,
      retention,
    };
  }, [members, transactions, payrollRuns, scheduledClasses, settings, monthKey, prevMonthKey]);

  // Séries dos últimos 9 meses
  const series = useMemo(() => {
    const keys = Array.from({ length: 9 }, (_, i) => shiftMonth(monthKey, i - 8));
    const created = members.map((m) => createdDate(m).slice(0, 7));
    return keys.map((k) => {
      const s = summarizeMonth(transactions, payrollRuns, settings, k);
      return {
        month: monthShort(k),
        Receitas: Math.round((s.revenue / 1_000_000) * 100) / 100,
        Despesas: Math.round((s.expenses / 1_000_000) * 100) / 100,
        clientes: created.filter((c) => c === k).length,
      };
    });
  }, [members, transactions, payrollRuns, settings, monthKey]);

  const newThisMonth = series[series.length - 1]?.clientes ?? 0;
  const newPrevMonth = series[series.length - 2]?.clientes ?? 0;

  // Aulas de hoje: agenda do dia; se vazia, horário semanal fixo
  const todayClasses = useMemo(() => {
    const scheduled = scheduledClasses
      .filter((c) => c.date === today && c.status !== 'cancelada')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((c) => ({
        id: c.id,
        start: c.startTime,
        end: c.endTime,
        title: c.title,
        instructor: c.instructorName,
        occupancy: `${c.attendees.length}/${c.capacity}`,
        color: c.color,
      }));
    if (scheduled.length > 0) return scheduled;
    const weekday = weekDayOf(today);
    return classes
      .filter((c) => c.dayOfWeek === weekday)
      .map((c) => {
        const { start, end } = parseTimeRange(c.time);
        return {
          id: c.id,
          start,
          end,
          title: c.title,
          instructor: c.instructorName,
          occupancy: `${c.enrolledCount}/${c.capacity}`,
          color: c.color,
        };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [scheduledClasses, classes, today]);

  const recentMembers = useMemo(
    () => [...members].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5),
    [members]
  );

  const yesterday = addDays(today, -1);
  const createdLabel = (createdAt: string) => {
    if (!createdAt) return '—';
    const d = createdDate({ createdAt });
    const hasTime = createdAt.length > 10;
    const time = hasTime
      ? new Date(createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      : '';
    if (d === today) return hasTime ? `Hoje, ${time}` : 'Hoje';
    if (d === yesterday) return hasTime ? `Ontem, ${time}` : 'Ontem';
    return formatDatePt(d);
  };

  const statusData = (Object.keys(MEMBER_STATUS_META) as MemberStatus[]).map((s) => ({
    name: MEMBER_STATUS_META[s].label,
    value: stats.counts[s],
    color: MEMBER_STATUS_META[s].color,
  }));
  const totalMembers = statusData.reduce((s, d) => s + d.value, 0);

  const goals = [
    settings.goalActiveMembers > 0 && {
      label: `${settings.goalActiveMembers.toLocaleString('pt-PT')} clientes ativas`,
      value: `${stats.activeCount}/${settings.goalActiveMembers}`,
      pct: (stats.activeCount / settings.goalActiveMembers) * 100,
    },
    settings.goalMonthlyRevenue > 0 && {
      label: `Receita de ${formatKz(settings.goalMonthlyRevenue)}`,
      value: `${fmtM(stats.revenue / 1_000_000).replace(' Kz', '')} / ${fmtM(settings.goalMonthlyRevenue / 1_000_000).replace(' Kz', '')}`,
      pct: (stats.revenue / settings.goalMonthlyRevenue) * 100,
    },
    settings.goalRetentionRate > 0 && {
      label: `${settings.goalRetentionRate}% de retenção`,
      value: `${stats.retention}%`,
      pct: (stats.retention / settings.goalRetentionRate) * 100,
    },
  ].filter(Boolean) as { label: string; value: string; pct: number }[];

  const dateLabel = `${WEEKDAYS_SHORT[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`;
  const timeLabel = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const name = firstName(profile?.full_name);

  const shownStaff = staff.slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#2C3228] flex items-center gap-2">
            {name ? `Bem-vinda, ${name}!` : 'Bem-vinda!'} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs text-[#7A7067] mt-1 font-medium">Aqui estás a construir mulheres mais fortes e confiantes.</p>
        </div>

        <div className="flex items-center gap-4">
          <p className="hidden lg:block font-serif italic text-lg text-[#8A7869] select-none" style={{ fontFamily: "'Caveat', cursive" }}>
            Disciplina hoje, resultados sempre! ♡
          </p>

          <div className="hidden sm:flex items-center gap-2">
            {hasModule('crm') && (
              <button
                onClick={onOpenAddMember}
                className="px-3 py-2 bg-[#2C3228] text-white hover:bg-[#3E4639] rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D0A68D]" /> Nova aluna
              </button>
            )}
            {hasModule('finance') && (
              <button
                onClick={onOpenAddTransaction}
                className="px-3 py-2 bg-[#F3DBD1] text-[#2C3228] hover:bg-[#EACFC4] rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Lançamento
              </button>
            )}
          </div>

          <div className="bg-[#EFECE8] border border-[#E2DDD7] px-4 py-2 rounded-2xl text-center shadow-2xs">
            <p className="text-[10px] font-semibold text-[#8C827A] uppercase tracking-wider">{dateLabel}</p>
            <p className="text-sm font-bold text-[#2C3228]">{timeLabel}</p>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-panel p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#F7ECE6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#8C6353]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8C827A]">Clientes Ativas</p>
              <h3 className="font-serif text-2xl font-bold text-[#2C3228] leading-tight">{stats.activeCount}</h3>
            </div>
          </div>
          <div className="text-right">
            <ChangeBadge curr={stats.activeCount} prev={stats.activePrev} />
            <span className="text-[9px] text-[#A09890] block">vs mês anterior</span>
          </div>
        </div>

        <div className="surface-panel p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#E6F0EB] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#3A6B4C]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#8C827A]">Receita do Mês</p>
              <h3 className="font-serif text-xl font-bold text-[#2C3228] leading-tight truncate">{formatKz(stats.revenue)}</h3>
            </div>
          </div>
          <div className="text-right shrink-0">
            <ChangeBadge curr={stats.revenue} prev={stats.revenuePrev} />
            <span className="text-[9px] text-[#A09890] block">vs mês anterior</span>
          </div>
        </div>

        <div className="surface-panel p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#F5ECE5] flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5 text-[#8C6353]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8C827A]">Aulas Realizadas</p>
              <h3 className="font-serif text-2xl font-bold text-[#2C3228] leading-tight">{stats.classesDone}</h3>
            </div>
          </div>
          <div className="text-right">
            <ChangeBadge curr={stats.classesDone} prev={stats.classesDonePrev} />
            <span className="text-[9px] text-[#A09890] block">vs mês anterior</span>
          </div>
        </div>

        <div className="surface-panel p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#FDECEB] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#C85252]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8C827A]">Taxa de Retenção</p>
              <h3 className="font-serif text-2xl font-bold text-[#2C3228] leading-tight">
                {stats.retentionBase > 0 ? `${stats.retention}%` : '—'}
              </h3>
            </div>
          </div>
          <div className="text-right">
            {settings.goalRetentionRate > 0 && stats.retentionBase > 0 && (
              <span
                className={`text-[10px] font-bold block ${stats.retention >= settings.goalRetentionRate ? 'text-[#3A6B4C]' : 'text-[#C85252]'}`}
              >
                Meta {settings.goalRetentionRate}%
              </span>
            )}
            <span className="text-[9px] text-[#A09890] block">
              {stats.retentionBase > 0 ? `${stats.counts.ativa} de ${stats.retentionBase} alunas` : 'sem alunas registadas'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hero Banner + Quick Actions + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 surface-panel p-2 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-7 relative rounded-lg overflow-hidden min-h-[250px] flex flex-col justify-end p-7">
            <img
              src="/dashboard-community.webp"
              alt="Corpo saudável, mente mais forte"
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.62]"
            />
            <img
              src="/brand-sign.webp"
              alt="Ela Fit — Ao Seu Ritmo"
              className="absolute top-3 right-3 w-16 h-16 rounded-full object-cover border border-white/50 shadow-lg"
            />
            <div className="relative z-10 space-y-3">
              <h2 className="font-serif text-2xl font-bold text-white max-w-xs leading-snug drop-shadow-md">
                Corpo saudável, mente mais forte.
              </h2>
              <button
                onClick={() => setActiveTab('agenda')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F2DCD3] hover:bg-[#EACFC4] text-[#2C3228] text-xs font-bold rounded-full transition-all shadow-sm"
              >
                <span>Ver agenda de aulas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="md:col-span-5 p-4 flex flex-col justify-center space-y-3 divide-y divide-[#F2ECE6]">
            {[
              { tab: 'crm' as TabType, icon: Users, title: 'Acompanhar Clientes', desc: 'Evolução e resultados' },
              { tab: 'hr' as TabType, icon: UserCheck, title: 'Gerir Equipa', desc: 'Instrutoras e colaboradores' },
              { tab: 'finance' as TabType, icon: CreditCard, title: 'Controlar Finanças', desc: 'Receitas, despesas e lucros' },
              { tab: 'ai' as TabType, icon: Compass, title: 'Inteligência Estratégica', desc: 'Conselho e auditoria de gestão' },
            ].map(({ tab, icon: Icon, title, desc }) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="pt-2 first:pt-0 flex items-center gap-3 cursor-pointer group hover:bg-[#FDFBF7] p-1.5 rounded-xl transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#F4ECE6] flex items-center justify-center shrink-0 group-hover:bg-[#2C3228] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 text-[#2C3228] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2C3228]">{title}</p>
                  <p className="text-[10px] text-[#8C827A]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 surface-panel p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE6]">
            <h3 className="font-serif text-base font-bold text-[#2C3228]">Aulas de Hoje</h3>
            <button onClick={() => setActiveTab('agenda')} className="text-[11px] font-semibold text-[#8C6353] hover:underline flex items-center gap-0.5">
              Ver agenda &rarr;
            </button>
          </div>

          <div className="space-y-3 mt-3 overflow-y-auto max-h-[240px] custom-scrollbar">
            {todayClasses.length === 0 ? (
              <p className="text-center text-xs text-[#A0958C] py-10">Não há aulas marcadas para hoje.</p>
            ) : (
              todayClasses.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-[10px] font-bold text-[#8C827A] w-10 text-right leading-tight shrink-0">
                      <div>{item.start}</div>
                      <div className="font-normal text-[#B0A8A0]">{item.end}</div>
                    </div>
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: item.color || '#E5BDB0' }} />
                    <div className="min-w-0">
                      <p className="font-bold text-[#2C3228] truncate">{item.title}</p>
                      <p className="text-[10px] text-[#8C827A] truncate">{item.instructor}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-[#FDECEB] text-[#8C5252] px-2 py-0.5 rounded-full shrink-0">{item.occupancy}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Charts & Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-sm font-bold text-[#2C3228]">Receitas vs Despesas</h3>
            <span className="text-[10px] text-[#8C827A] font-medium">Últimos 9 meses (M Kz)</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2ECE6" />
                <XAxis dataKey="month" stroke="#A09890" fontSize={10} tickLine={false} />
                <YAxis stroke="#A09890" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '10px', fontSize: '11px' }}
                  formatter={(value: any, name: any) => [fmtM(Number(value)), name]}
                />
                <Bar dataKey="Receitas" fill="#3A6B4C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#E8A5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2 text-[11px] font-medium text-[#7A7067]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A6B4C]"></span>
              <span>Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8A5A5]"></span>
              <span>Despesas</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm font-bold text-[#2C3228]">Novas Clientes</h3>
              <ChangeBadge curr={newThisMonth} prev={newPrevMonth} pill />
            </div>
            <span className="text-[10px] text-[#8C827A] font-medium">Últimos 9 meses</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2ECE6" />
                <XAxis dataKey="month" stroke="#A09890" fontSize={10} tickLine={false} />
                <YAxis stroke="#A09890" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '10px', fontSize: '11px' }}
                  formatter={(value: any) => [value, 'Novas clientes']}
                />
                <Line type="monotone" dataKey="clientes" stroke="#E29587" strokeWidth={2.5} dot={{ r: 3, fill: '#E29587' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE6]">
              <h3 className="font-serif text-sm font-bold text-[#2C3228]">Últimas Clientes Cadastradas</h3>
              <button onClick={() => setActiveTab('crm')} className="text-[11px] font-semibold text-[#8C6353] hover:underline">
                Ver todas &rarr;
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {recentMembers.length === 0 ? (
                <p className="text-center text-xs text-[#A0958C] py-8">Ainda não há clientes registadas.</p>
              ) : (
                recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F7F5F0] last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F4ECE6] border border-[#E2DDD7] flex items-center justify-center text-[10px] font-bold text-[#8C6353] shrink-0">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#2C3228] leading-tight truncate">{m.name}</p>
                        <p className="text-[10px] text-[#8C827A] truncate">{m.plan || 'Sem plano'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#A09890] shrink-0">{createdLabel(m.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-center font-serif italic text-sm text-[#8A7869] pt-3 select-none" style={{ fontFamily: "'Caveat', cursive" }}>
            "Mulheres que se cuidam, inspiram outras mulheres." ♡
          </p>
        </div>
      </div>

      {/* 5. Estado dos Planos, Colaboradoras, Metas do Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs">
          <h3 className="font-serif text-sm font-bold text-[#2C3228] mb-2">Estado dos Planos</h3>

          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1.5 text-[11px] text-[#7A7067]">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold text-[#2C3228]">
                    {totalMembers > 0 ? Math.round((item.value / totalMembers) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>

            <div className="w-32 h-32 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalMembers > 0 ? statusData : [{ name: 'Sem dados', value: 1, color: '#EFECE8' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={totalMembers > 0 ? 3 : 0}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {(totalMembers > 0 ? statusData : [{ name: 'Sem dados', value: 1, color: '#EFECE8' }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-bold text-sm text-[#2C3228] leading-tight">{totalMembers}</span>
                <span className="text-[9px] text-[#8C827A]">clientes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-sm font-bold text-[#2C3228]">Colaboradoras</h3>
              <span className="text-xs text-[#8C827A]">Total: {staff.length}</span>
            </div>

            <div className="flex items-center justify-center py-3">
              {staff.length === 0 ? (
                <p className="text-xs text-[#A0958C]">Sem colaboradoras registadas.</p>
              ) : (
                <div className="flex -space-x-2 overflow-hidden">
                  {shownStaff.map((s) =>
                    s.avatarUrl ? (
                      <img
                        key={s.id}
                        className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                        src={s.avatarUrl}
                        alt={s.name}
                        title={`${s.name} — ${s.role}`}
                      />
                    ) : (
                      <div
                        key={s.id}
                        title={`${s.name} — ${s.role}`}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white bg-[#F4ECE6] text-xs font-bold text-[#8C6353]"
                      >
                        {initials(s.name)}
                      </div>
                    )
                  )}
                  {staff.length > shownStaff.length && (
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white bg-[#EFECE8] text-xs font-bold text-[#8C827A]">
                      +{staff.length - shownStaff.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('hr')}
            className="w-full py-2 bg-[#F3DBD1] hover:bg-[#EACFC4] text-[#2C3228] text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
          >
            <span>Gerir equipa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#ECE8E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-sm font-bold text-[#2C3228]">Metas do Mês</h3>
              <button onClick={() => setActiveTab('reports')} className="text-[11px] text-[#8C6353] font-semibold hover:underline">
                Relatórios &rarr;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {goals.length === 0 && <p className="text-[#A0958C] text-center py-6">Sem metas definidas nas configurações.</p>}
              {goals.map((g) => {
                const reached = g.pct >= 100;
                const Icon = reached ? CheckCircle2 : Circle;
                return (
                  <div key={g.label}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-[#2C3228]">
                        <Icon className={`w-3.5 h-3.5 ${reached ? 'text-[#3A6B4C]' : 'text-[#D0A68D]'}`} /> {g.label}
                      </span>
                      <span className="font-bold text-[#7A7067] shrink-0">{g.value}</span>
                    </div>
                    <div className="w-full bg-[#EFECE8] h-2 rounded-full overflow-hidden">
                      <div
                        className={`${reached ? 'bg-[#3A6B4C]' : 'bg-[#D0A68D]'} h-full rounded-full transition-all`}
                        style={{ width: `${Math.max(0, Math.min(100, g.pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
