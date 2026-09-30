import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarSync, CopyPlus, FileDown, Loader2 } from 'lucide-react';
import { ScheduledClass } from '../types';
import { useData } from '../data/DataContext';
import { useAuth } from '../auth/AuthContext';
import { newId } from '../data/repository';
import {
  addDays,
  dateForWeekDay,
  formatDatePt,
  formatWeekRange,
  localToday,
  parseTimeRange,
  startOfWeek,
  weekDates,
} from '../utils/dates';
import { generateWeeklyAgendaPdf } from '../reports/agendaReport';
import { WeekGrid } from './agenda/WeekGrid';
import { WeekStats } from './agenda/WeekStats';
import { SessionModal } from './agenda/SessionModal';
import { colorForCategory, DEFAULT_CATEGORY, findStaffIdByName, primaryBtn, secondaryBtn } from './agenda/ui';

export const AgendaModule: React.FC = () => {
  const { classes, scheduledClasses, members, staff, settings, actions } = useData();
  const { hasModule } = useAuth();
  const canEdit = hasModule('agenda') || hasModule('classes');

  const today = localToday();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [editing, setEditing] = useState<{ session: ScheduledClass; isNew: boolean } | null>(null);
  const [includePlans, setIncludePlans] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekEnd = dates[6];
  const inRange = (s: ScheduledClass, from: string, to: string) => s.date >= from && s.date <= to;
  const weekSessions = useMemo(
    () => scheduledClasses.filter((s) => inRange(s, weekStart, weekEnd)),
    [scheduledClasses, weekStart, weekEnd]
  );

  const blankSession = (date: string): ScheduledClass => ({
    id: newId('SES'),
    date,
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    category: DEFAULT_CATEGORY,
    instructorName: '',
    instructorId: undefined,
    room: '',
    capacity: 10,
    attendees: [],
    present: [],
    status: 'planeada',
    lessonPlan: '',
    color: colorForCategory(DEFAULT_CATEGORY),
  });

  const openNew = (date?: string) => {
    const d = date ?? (today >= weekStart && today <= weekEnd ? today : weekStart);
    setEditing({ session: blankSession(d), isNew: true });
  };

  // Atualiza a assiduidade das alunas que passaram a estar presentes numa aula realizada
  const updateAttendance = async (saved: ScheduledClass, previous?: ScheduledClass) => {
    if (saved.status !== 'realizada') return;
    const alreadyCounted = new Set(previous?.status === 'realizada' ? previous.present : []);
    const newlyPresent = saved.present.filter((id) => !alreadyCounted.has(id));
    if (newlyPresent.length === 0) return;
    const inCurrentMonth = saved.date.slice(0, 7) === localToday().slice(0, 7);
    for (const id of newlyPresent) {
      const m = members.find((x) => x.id === id);
      if (!m) continue;
      const last = m.lastAttendanceDate && m.lastAttendanceDate > saved.date ? m.lastAttendanceDate : saved.date;
      if (!inCurrentMonth && last === m.lastAttendanceDate) continue;
      await actions.saveMember({
        ...m,
        attendanceCountThisMonth: (m.attendanceCountThisMonth || 0) + (inCurrentMonth ? 1 : 0),
        lastAttendanceDate: last,
      });
    }
  };

  const handleSave = async (s: ScheduledClass) => {
    const previous = scheduledClasses.find((x) => x.id === s.id);
    const ok = await actions.saveScheduledClasses([s]);
    if (ok) await updateAttendance(s, previous);
    return ok;
  };

  const handleDelete = async (s: ScheduledClass) => {
    if (!window.confirm(`Apagar a aula "${s.title || 'sem título'}" de ${formatDatePt(s.date)}?`)) return;
    const ok = await actions.deleteScheduledClass(s.id);
    if (ok) setEditing(null);
  };

  const handleDuplicate = async (s: ScheduledClass) => {
    const copy: ScheduledClass = {
      ...s,
      id: newId('SES'),
      date: addDays(s.date, 7),
      present: [],
      status: 'planeada',
    };
    const ok = await actions.saveScheduledClasses([copy]);
    if (ok) window.alert(`Aula duplicada para ${formatDatePt(copy.date)} (inscritas mantidas, presenças por registar).`);
  };

  const generateFromTemplate = async () => {
    if (classes.length === 0) {
      window.alert('O Horário Fixo não tem aulas. Crie as turmas em "Horário de Aulas".');
      return;
    }
    const existing = new Set(weekSessions.filter((s) => s.templateId).map((s) => `${s.templateId}|${s.date}`));
    const created: ScheduledClass[] = [];
    classes.forEach((t) => {
      const date = dateForWeekDay(weekStart, t.dayOfWeek);
      if (existing.has(`${t.id}|${date}`)) return;
      const { start, end } = parseTimeRange(t.time);
      created.push({
        id: newId('SES'),
        date,
        startTime: start,
        endTime: end,
        title: t.title,
        category: t.category,
        instructorName: t.instructorName,
        instructorId: findStaffIdByName(staff, t.instructorName || ''),
        room: t.room,
        capacity: t.capacity,
        attendees: [],
        present: [],
        status: 'planeada',
        lessonPlan: '',
        color: t.color || colorForCategory(t.category),
        templateId: t.id,
      });
    });
    if (created.length === 0) {
      window.alert('Todas as aulas do Horário Fixo já estão nesta semana. Nada a criar.');
      return;
    }
    setBusy('gerar');
    const ok = await actions.saveScheduledClasses(created);
    setBusy(null);
    if (ok) window.alert(`${created.length} aula${created.length === 1 ? '' : 's'} criada${created.length === 1 ? '' : 's'} a partir do Horário Fixo.`);
  };

  const copyPreviousWeek = async () => {
    const prevStart = addDays(weekStart, -7);
    const prev = scheduledClasses.filter((s) => inRange(s, prevStart, addDays(weekStart, -1)) && s.status !== 'cancelada');
    if (prev.length === 0) {
      window.alert('A semana anterior não tem aulas para copiar.');
      return;
    }
    const key = (s: Pick<ScheduledClass, 'date' | 'startTime' | 'title'>) =>
      `${s.date}|${s.startTime}|${s.title.trim().toLowerCase()}`;
    const existing = new Set(weekSessions.map(key));
    const created = prev
      .map<ScheduledClass>((s) => ({
        ...s,
        id: newId('SES'),
        date: addDays(s.date, 7),
        attendees: [],
        present: [],
        status: 'planeada',
      }))
      .filter((s) => !existing.has(key(s)));
    if (created.length === 0) {
      window.alert('As aulas da semana anterior já existem nesta semana. Nada a copiar.');
      return;
    }
    setBusy('copiar');
    const ok = await actions.saveScheduledClasses(created);
    setBusy(null);
    if (ok) window.alert(`${created.length} aula${created.length === 1 ? '' : 's'} copiada${created.length === 1 ? '' : 's'} da semana anterior.`);
  };

  const exportPdf = async () => {
    setBusy('pdf');
    try {
      await generateWeeklyAgendaPdf({ weekStart, sessions: scheduledClasses, settings, includeLessonPlans: includePlans });
    } catch (e: any) {
      window.alert(`Não foi possível gerar o PDF: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  };

  const spin = (k: string) => busy === k && <Loader2 className="w-4 h-4 animate-spin" />;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">Planeamento de Aulas</span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Agenda</h2>
          <p className="text-xs text-[#7A7067]">
            Aulas com data marcada, planos de aula, inscrições e registo de presenças.
          </p>
        </div>
        {canEdit && (
          <button onClick={() => openNew()} className={primaryBtn + ' self-start lg:self-auto'}>
            <Plus className="w-4 h-4 text-[#D0A68D]" /> Nova aula
          </button>
        )}
      </div>

      {/* Navegação + ferramentas */}
      <div className="bg-white p-4 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-xl border border-[#ECE5DE] hover:bg-[#F4ECE6]" aria-label="Semana anterior">
            <ChevronLeft className="w-4 h-4 text-[#2C3228]" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(today))}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${
              weekStart === startOfWeek(today) ? 'bg-[#2C3228] text-white border-[#2C3228]' : 'border-[#ECE5DE] text-[#2C3228] hover:bg-[#F4ECE6]'
            }`}
          >
            Hoje
          </button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-xl border border-[#ECE5DE] hover:bg-[#F4ECE6]" aria-label="Semana seguinte">
            <ChevronRight className="w-4 h-4 text-[#2C3228]" />
          </button>
          <span className="font-serif text-base font-bold text-[#2C3228] ml-2">{formatWeekRange(weekStart)}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button onClick={generateFromTemplate} disabled={!!busy} className={secondaryBtn}>
                {spin('gerar') || <CalendarSync className="w-4 h-4 text-[#D0A68D]" />} Gerar semana a partir do Horário Fixo
              </button>
              <button onClick={copyPreviousWeek} disabled={!!busy} className={secondaryBtn}>
                {spin('copiar') || <CopyPlus className="w-4 h-4 text-[#D0A68D]" />} Copiar semana anterior
              </button>
            </>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-[#ECE5DE]">
            <label className="flex items-center gap-1.5 text-[11px] text-[#61574E] cursor-pointer">
              <input type="checkbox" checked={includePlans} onChange={(e) => setIncludePlans(e.target.checked)} className="accent-[#2C3228]" />
              incluir planos de aula
            </label>
            <button onClick={exportPdf} disabled={!!busy} className={primaryBtn}>
              {spin('pdf') || <FileDown className="w-4 h-4 text-[#D0A68D]" />} PDF da semana
            </button>
          </div>
        </div>
      </div>

      <WeekStats sessions={weekSessions} />

      <WeekGrid
        dates={dates}
        sessions={weekSessions}
        today={today}
        canEdit={canEdit}
        onOpen={(s) => setEditing({ session: s, isNew: false })}
        onCreate={(d) => openNew(d)}
      />

      {!canEdit && (
        <p className="text-[11px] text-[#8C827A] text-center">Modo de consulta: não tem permissões para editar a agenda.</p>
      )}

      {editing && (
        <SessionModal
          key={editing.session.id}
          session={editing.session}
          isNew={editing.isNew}
          readOnly={!canEdit}
          members={members}
          staff={staff}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
};

