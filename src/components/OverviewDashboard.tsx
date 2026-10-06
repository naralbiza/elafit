import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Dumbbell,
  Heart,
  ChevronRight,
  UserCheck,
  CreditCard,
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
  AreaChart,
  Area,
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

  const kpis = [
    {
      key: 'active',
      label: 'Clientes Ativas',
      value: String(stats.activeCount),
      icon: Users,
      tint: 'from-[#F9EDE6] to-[#F3DDD1]',
      iconColor: 'text-[#8C6353]',
      footer: <ChangeBadge curr={stats.activeCount} prev={stats.activePrev} pill />,
      note: 'vs mês anterior',
    },
    {
      key: 'revenue',
      label: 'Receita do Mês',
      value: formatKz(stats.revenue),
      icon: TrendingUp,
      tint: 'from-[#E9F3ED] to-[#D6E9DD]',
      iconColor: 'text-[#3A6B4C]',
      footer: <ChangeBadge curr={stats.revenue} prev={stats.revenuePrev} pill />,
      note: 'vs mês anterior',
    },
    {
      key: 'classes',
      label: 'Aulas Realizadas',
      value: String(stats.classesDone),
      icon: Dumbbell,
      tint: 'from-[#F6EEE3] to-[#EEDFC9]',
      iconColor: 'text-[#9A7442]',
      footer: <ChangeBadge curr={stats.classesDone} prev={stats.classesDonePrev} pill />,
      note: 'vs mês anterior',
    },
    {
      key: 'retention',
      label: 'Taxa de Retenção',
      value: stats.retentionBase > 0 ? `${stats.retention}%` : '—',
      icon: Heart,
      tint: 'from-[#FCEEED] to-[#F7DAD7]',
      iconColor: 'text-[#C85252]',
      footer:
        settings.goalRetentionRate > 0 && stats.retentionBase > 0 ? (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              stats.retention >= settings.goalRetentionRate ? 'bg-[#E6F0EB] text-[#3A6B4C]' : 'bg-[#FDECEB] text-[#C85252]'
            }`}
          >
            Meta {settings.goalRetentionRate}%
          </span>
        ) : null,
      note: stats.retentionBase > 0 ? `${stats.counts.ativa} de ${stats.retentionBase} alunas` : 'sem alunas registadas',
    },
  ];

  const quickLinks = [
    { tab: 'crm' as TabType, icon: Users, title: 'Acompanhar Clientes', desc: 'Evolução e resultados' },
    { tab: 'hr' as TabType, icon: UserCheck, title: 'Gerir Equipa', desc: 'Instrutoras e colaboradores' },
    { tab: 'finance' as TabType, icon: CreditCard, title: 'Controlar Finanças', desc: 'Receitas, despesas e lucros' },
    { tab: 'ai' as TabType, icon: Compass, title: 'Inteligência Estratégica', desc: 'Conselho e auditoria de gestão' },
  ];

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '11px',
    border: '1px solid #EFE9E1',
    boxShadow: '0 10px 30px -12px rgba(40,44,36,0.25)',
  };

  const CardHead: React.FC<{ title: string; hint?: React.ReactNode; action?: { label: string; onClick: () => void } }> = ({ title, hint, action }) => (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="font-serif text-[15px] font-bold text-[#2C3228] truncate">{title}</h3>
        {hint && <p className="text-[10px] text-[#A0958C] font-medium mt-0.5">{hint}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="text-[11px] font-semibold text-[#8C6353] hover:text-[#2C3228] shrink-0 transition-colors">
          {action.label} &rarr;
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* 1. Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <p className="eyebrow">{dateLabel}</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C3228] mt-1">
            {name ? `Bem-vinda, ${name}!` : 'Bem-vinda!'}
          </h1>
          <p className="text-xs text-[#7A7067] mt-1.5 font-medium">Aqui estás a construir mulheres mais fortes e confiantes.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasModule('crm') && (
            <button
              onClick={onOpenAddMember}
              className="px-4 py-2.5 bg-gradient-to-b from-[#363A2D] to-[#24271D] text-white hover:brightness-110 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-[0_8px_18px_-8px_rgba(36,39,29,0.7)] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D0A68D]" /> Nova aluna
            </button>
          )}
          {hasModule('finance') && (
            <button
              onClick={onOpenAddTransaction}
              className="px-4 py-2.5 bg-white border border-[#EADFD6] text-[#2C3228] hover:bg-[#FBF6F2] rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#8C6353]" /> Lançamento
            </button>
          )}
          <div className="bg-white/80 border border-[#EADFD6] px-4 py-2 rounded-full text-sm font-bold text-[#2C3228] shadow-2xs">
            {timeLabel}
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ key, label, value, icon: Icon, tint, iconColor, footer, note }) => (
          <div key={key} className="surface-panel surface-panel-hover p-5">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tint} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              {footer}
            </div>
            <p className="text-[11px] font-semibold text-[#8C827A] mt-4">{label}</p>
            <h3 className="font-serif text-[26px] font-bold text-[#2C3228] leading-tight mt-0.5 truncate">{value}</h3>
            <p className="text-[10px] text-[#A09890] mt-1">{note}</p>
          </div>
        ))}
      </div>

      {/* 3. Receitas vs Despesas + Aulas de Hoje */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 surface-panel p-5 sm:p-6 flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-serif text-[15px] font-bold text-[#2C3228]">Receitas vs Despesas</h3>
              <p className="text-[10px] text-[#A0958C] font-medium mt-0.5">Últimos 9 meses (M Kz)</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-[#7A7067]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3A6B4C]" />Receitas</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E8A5A5]" />Despesas</span>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 5, left: -22, bottom: 0 }} barGap={4} barCategoryGap="28%">
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4C8A64" />
                    <stop offset="100%" stopColor="#2F5E43" />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0B9B4" />
                    <stop offset="100%" stopColor="#E39A98" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#EDE7DF" />
                <XAxis dataKey="month" stroke="#A09890" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#A09890" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(216,182,159,0.12)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: any) => [fmtM(Number(value)), name]}
                />
                <Bar dataKey="Receitas" fill="url(#gRev)" radius={[8, 8, 3, 3]} />
                <Bar dataKey="Despesas" fill="url(#gExp)" radius={[8, 8, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 surface-panel p-5 sm:p-6 flex flex-col">
          <CardHead title="Aulas de Hoje" hint={`${todayClasses.length} ${todayClasses.length === 1 ? 'aula' : 'aulas'}`} action={{ label: 'Ver agenda', onClick: () => setActiveTab('agenda') }} />
          <div className="space-y-1.5 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar flex-1">
            {todayClasses.length === 0 ? (
              <p className="text-center text-xs text-[#A0958C] py-12">Não há aulas marcadas para hoje.</p>
            ) : (
              todayClasses.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-2xl hover:bg-[#FAF7F3] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-[10px] font-bold text-[#6B645B] w-10 text-right leading-tight shrink-0">
                      <div>{item.start}</div>
                      <div className="font-normal text-[#B0A8A0]">{item.end}</div>
                    </div>
                    <div className="w-1 h-9 rounded-full shrink-0" style={{ backgroundColor: item.color || '#E5BDB0' }} />
                    <div className="min-w-0">
                      <p className="font-bold text-[#2C3228] truncate">{item.title}</p>
                      <p className="text-[10px] text-[#8C827A] truncate">{item.instructor}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-[#FBEFEC] text-[#8C5252] px-2.5 py-1 rounded-full shrink-0">{item.occupancy}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Hero + atalhos + Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 surface-panel p-2.5 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-7 relative rounded-2xl overflow-hidden min-h-[240px] flex flex-col justify-end p-6 sm:p-7">
            <img
              src="/dashboard-community.webp"
              alt="Corpo saudável, mente mais forte"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14150e]/85 via-[#14150e]/35 to-[#14150e]/10" />
            <img
              src="/brand-sign.webp"
              alt="Ela Fit — Ao Seu Ritmo"
              className="absolute top-4 right-4 w-14 h-14 rounded-full object-cover border border-white/50 shadow-lg"
            />
            <div className="relative z-10 space-y-3">
              <h2 className="font-serif text-2xl font-bold text-white max-w-xs leading-snug drop-shadow-md">
                Corpo saudável, mente mais forte.
              </h2>
              <button
                onClick={() => setActiveTab('agenda')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5E3DA] hover:bg-white text-[#2C3228] text-xs font-bold rounded-full transition-all shadow-sm"
              >
                <span>Ver agenda de aulas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="md:col-span-5 p-3 sm:p-4 flex flex-col justify-center gap-1">
            {quickLinks.map(({ tab, icon: Icon, title, desc }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="w-full text-left flex items-center gap-3 group hover:bg-[#FAF7F3] p-2.5 rounded-2xl transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F7EFE9] flex items-center justify-center shrink-0 group-hover:bg-[#2C3228] transition-colors">
                  <Icon className="w-4 h-4 text-[#8C6353] group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#2C3228] truncate">{title}</p>
                  <p className="text-[10px] text-[#8C827A] truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#CFC6BC] group-hover:text-[#8C6353] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 surface-panel p-5 sm:p-6">
          <CardHead title="Metas do Mês" action={{ label: 'Relatórios', onClick: () => setActiveTab('reports') }} />
          <div className="space-y-5 text-xs">
            {goals.length === 0 && <p className="text-[#A0958C] text-center py-6">Sem metas definidas nas configurações.</p>}
            {goals.map((g) => {
              const reached = g.pct >= 100;
              const Icon = reached ? CheckCircle2 : Circle;
              return (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-[#2C3228] min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${reached ? 'text-[#3A6B4C]' : 'text-[#D0A68D]'}`} />
                      <span className="truncate">{g.label}</span>
                    </span>
                    <span className="font-bold text-[#7A7067] shrink-0 text-[11px]">{g.value}</span>
                  </div>
                  <div className="w-full bg-[#F1EDE8] h-2 rounded-full overflow-hidden">
                    <div
                      className={`${reached ? 'bg-gradient-to-r from-[#4C8A64] to-[#2F5E43]' : 'bg-gradient-to-r from-[#E6C4AE] to-[#D0A68D]'} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(0, Math.min(100, g.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Clientes, estado dos planos e equipa */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="surface-panel p-5 sm:p-6 flex flex-col">
          <CardHead title="Novas Clientes" hint="Últimos 9 meses" action={undefined} />
          <div className="flex items-baseline gap-2 -mt-2 mb-2">
            <span className="font-serif text-3xl font-bold text-[#2C3228]">{newThisMonth}</span>
            <ChangeBadge curr={newThisMonth} prev={newPrevMonth} pill />
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E29587" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E29587" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#A09890" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#A09890" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [value, 'Novas clientes']} />
                <Area type="monotone" dataKey="clientes" stroke="#E29587" strokeWidth={2.5} fill="url(#gNew)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-panel p-5 sm:p-6 flex flex-col">
          <CardHead title="Últimas Clientes" action={{ label: 'Ver todas', onClick: () => setActiveTab('crm') }} />
          <div className="space-y-1 flex-1">
            {recentMembers.length === 0 ? (
              <p className="text-center text-xs text-[#A0958C] py-8">Ainda não há clientes registadas.</p>
            ) : (
              recentMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-2xl hover:bg-[#FAF7F3] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F9EDE6] to-[#F0DACC] flex items-center justify-center text-[10px] font-bold text-[#8C6353] shrink-0">
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

        <div className="surface-panel p-5 sm:p-6">
          <CardHead title="Estado dos Planos" />
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2.5 text-[11px] text-[#7A7067] min-w-0 flex-1">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
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
                    innerRadius={38}
                    outerRadius={54}
                    paddingAngle={totalMembers > 0 ? 4 : 0}
                    cornerRadius={6}
                    stroke="none"
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
                <span className="font-serif font-bold text-lg text-[#2C3228] leading-tight">{totalMembers}</span>
                <span className="text-[9px] text-[#8C827A]">clientes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <CardHead title="Colaboradoras" hint={`Total: ${staff.length}`} />
            <div className="flex items-center justify-center py-3">
              {staff.length === 0 ? (
                <p className="text-xs text-[#A0958C]">Sem colaboradoras registadas.</p>
              ) : (
                <div className="flex -space-x-2.5">
                  {shownStaff.map((s) =>
                    s.avatarUrl ? (
                      <img
                        key={s.id}
                        className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover shadow-sm"
                        src={s.avatarUrl}
                        alt={s.name}
                        title={`${s.name} — ${s.role}`}
                      />
                    ) : (
                      <div
                        key={s.id}
                        title={`${s.name} — ${s.role}`}
                        className="inline-flex items-center justify-center h-11 w-11 rounded-full ring-2 ring-white bg-gradient-to-br from-[#F9EDE6] to-[#F0DACC] text-xs font-bold text-[#8C6353] shadow-sm"
                      >
                        {initials(s.name)}
                      </div>
                    )
                  )}
                  {staff.length > shownStaff.length && (
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-full ring-2 ring-white bg-[#EFECE8] text-xs font-bold text-[#8C827A]">
                      +{staff.length - shownStaff.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('hr')}
            className="w-full py-2.5 bg-[#F7EFE9] hover:bg-[#F0E2D8] text-[#2C3228] text-xs font-bold rounded-full transition-all text-center flex items-center justify-center gap-1.5"
          >
            <span>Gerir equipa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-center text-base text-[#8A7869] pt-2 select-none" style={{ fontFamily: "'Caveat', cursive" }}>
        Disciplina hoje, resultados sempre! ♡
      </p>
    </div>
  );
};
