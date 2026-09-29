import React, { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Gauge, UserCheck, Users } from 'lucide-react';
import { ScheduledClass } from '../../types';

export const WeekStats: React.FC<{ sessions: ScheduledClass[] }> = ({ sessions }) => {
  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status !== 'cancelada');
    const done = active.filter((s) => s.status === 'realizada');
    const withCap = active.filter((s) => s.capacity > 0);
    const occupancy = withCap.length
      ? withCap.reduce((sum, s) => sum + Math.min(1, s.attendees.length / s.capacity), 0) / withCap.length
      : 0;
    const presences = active.reduce((sum, s) => sum + s.present.length, 0);
    const byInstructor = new Map<string, number>();
    active.forEach((s) => {
      const k = s.instructorName || 'Sem instrutora';
      byInstructor.set(k, (byInstructor.get(k) ?? 0) + 1);
    });
    return {
      total: active.length,
      cancelled: sessions.length - active.length,
      done: done.length,
      occupancy,
      presences,
      byInstructor: [...byInstructor.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [sessions]);

  const cards = [
    { label: 'Aulas na semana', value: String(stats.total), hint: stats.cancelled ? `${stats.cancelled} cancelada(s)` : 'sem cancelamentos', icon: CalendarDays },
    { label: 'Aulas realizadas', value: String(stats.done), hint: stats.total ? `${Math.round((stats.done / stats.total) * 100)}% do planeado` : '—', icon: CheckCircle2 },
    { label: 'Ocupação média', value: `${Math.round(stats.occupancy * 100)}%`, hint: 'inscritas / lotação', icon: Gauge },
    { label: 'Presenças registadas', value: String(stats.presences), hint: 'check-ins nas aulas', icon: UserCheck },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white p-4 rounded-2xl border border-[#ECE5DE] shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C827A] uppercase tracking-wider">
            <c.icon className="w-3.5 h-3.5 text-[#D0A68D]" /> {c.label}
          </div>
          <p className="font-serif text-2xl font-bold text-[#2C3228] mt-1">{c.value}</p>
          <p className="text-[10px] text-[#8C827A]">{c.hint}</p>
        </div>
      ))}
      <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-[#ECE5DE] shadow-xs">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C827A] uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-[#D0A68D]" /> Aulas por instrutora
        </div>
        {stats.byInstructor.length === 0 ? (
          <p className="text-[11px] text-[#8C827A] mt-2">Sem aulas nesta semana.</p>
        ) : (
          <ul className="mt-1.5 space-y-0.5 max-h-20 overflow-y-auto">
            {stats.byInstructor.map(([name, n]) => (
              <li key={name} className="flex justify-between text-[11px] text-[#2C3228]">
                <span className="truncate">{name}</span>
                <strong className="ml-2">{n}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
