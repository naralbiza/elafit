import React, { useMemo, useState } from 'react';
import { Clock, Plus, Pencil, Trash2, CalendarDays, MapPin, X } from 'lucide-react';
import { CLASS_CATEGORIES, ClassCategory, ClassSession, WEEK_DAYS, WeekDay } from '../types';
import { useData } from '../data/DataContext';
import { useAuth } from '../auth/AuthContext';
import { newId } from '../data/repository';
import { localToday, parseTimeRange, weekDayOf } from '../utils/dates';
import {
  colorForCategory,
  DEFAULT_CATEGORY,
  inputCls,
  instructorOptions,
  labelCls,
  primaryBtn,
} from './agenda/ui';

const startOf = (c: ClassSession) => parseTimeRange(c.time).start;
const byStart = (a: ClassSession, b: ClassSession) => startOf(a).localeCompare(startOf(b));

interface FormState {
  id?: string;
  title: string;
  category: ClassCategory;
  color: string;
  instructorName: string;
  dayOfWeek: WeekDay;
  start: string;
  end: string;
  room: string;
  capacity: number;
  enrolledCount: number;
}

const emptyForm = (day: WeekDay): FormState => ({
  title: '',
  category: DEFAULT_CATEGORY,
  color: colorForCategory(DEFAULT_CATEGORY),
  instructorName: '',
  dayOfWeek: day,
  start: '09:00',
  end: '10:00',
  room: '',
  capacity: 10,
  enrolledCount: 0,
});

const formFromClass = (c: ClassSession): FormState => {
  const { start, end } = parseTimeRange(c.time);
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    color: c.color || colorForCategory(c.category),
    instructorName: c.instructorName,
    dayOfWeek: c.dayOfWeek,
    start,
    end,
    room: c.room,
    capacity: c.capacity,
    enrolledCount: c.enrolledCount,
  };
};

export const ClassesModule: React.FC = () => {
  const { classes, staff, actions } = useData();
  const { hasModule } = useAuth();
  const canEdit = hasModule('classes') || hasModule('agenda');

  const [selectedDay, setSelectedDay] = useState<WeekDay>(() => weekDayOf(localToday()));
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<WeekDay, ClassSession[]>(WEEK_DAYS.map((d) => [d, []]));
    classes.forEach((c) => map.get(c.dayOfWeek)?.push(c));
    map.forEach((list) => list.sort(byStart));
    return map;
  }, [classes]);

  const dayClasses = byDay.get(selectedDay) ?? [];

  const openForm = (f: FormState) => {
    setError(null);
    setForm(f);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const changeCategory = (category: ClassCategory) =>
    setForm((f) =>
      f ? { ...f, category, color: f.color === colorForCategory(f.category) ? colorForCategory(category) : f.color } : f
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return setError('Indique o nome da aula.');
    if (!form.start || !form.end || form.end <= form.start) return setError('A hora de fim tem de ser posterior à hora de início.');
    if (form.capacity < 0 || form.enrolledCount < 0) return setError('Lotação e inscritas não podem ser negativas.');

    const cls: ClassSession = {
      id: form.id ?? newId('CLS'),
      title: form.title.trim(),
      instructorName: form.instructorName,
      category: form.category,
      dayOfWeek: form.dayOfWeek,
      time: `${form.start} - ${form.end}`,
      room: form.room.trim(),
      capacity: form.capacity,
      enrolledCount: form.enrolledCount,
      color: form.color,
    };
    setSaving(true);
    const ok = await actions.saveClass(cls);
    setSaving(false);
    if (ok) {
      setForm(null);
      setSelectedDay(cls.dayOfWeek);
    }
  };

  const handleDelete = async (c: ClassSession) => {
    if (!window.confirm(`Apagar "${c.title}" (${c.dayOfWeek}, ${c.time}) do horário fixo?`)) return;
    await actions.deleteClass(c.id);
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">
            Mapa de Aulas & Studio Pilates
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Horário Semanal Ela Fit</h2>
          <p className="text-xs text-[#7A7067]">
            Modelo fixo que se repete todas as semanas.{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-[#D0A68D]">
              <CalendarDays className="w-3.5 h-3.5" /> Planifique e registe presenças na Agenda.
            </span>
          </p>
        </div>

        {canEdit && (
          <button onClick={() => openForm(emptyForm(selectedDay))} className={primaryBtn + ' self-start md:self-auto'}>
            <Plus className="w-4 h-4 text-[#D0A68D]" />
            <span>Nova Turma no Horário</span>
          </button>
        )}
      </div>

      {/* Seletor de dia */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {WEEK_DAYS.map((day) => {
          const n = byDay.get(day)?.length ?? 0;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedDay === day
                  ? 'bg-[#2C3228] text-white shadow-xs'
                  : 'bg-[#FFFFFF] text-[#61574E] border border-[#ECE5DE] hover:bg-[#F4ECE6]'
              }`}
            >
              {day}
              <span
                className={`text-[10px] px-1.5 rounded-full ${
                  selectedDay === day ? 'bg-[#D0A68D] text-[#2C3228]' : 'bg-[#F4ECE6] text-[#8C827A]'
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Aulas do dia selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dayClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#E2DAD1] text-xs text-[#8C827A]">
            Nenhuma aula no horário de {selectedDay}.
            {canEdit && ' Clique em "Nova Turma no Horário" para adicionar.'}
          </div>
        ) : (
          dayClasses.map((cls) => {
            const full = cls.capacity > 0 && cls.enrolledCount >= cls.capacity;
            const pct = cls.capacity > 0 ? Math.min(100, (cls.enrolledCount / cls.capacity) * 100) : 0;
            return (
              <div
                key={cls.id}
                className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col justify-between hover:border-[#D0A68D] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cls.color }}>
                      {cls.category}
                    </span>
                    <span className="text-[11px] font-bold text-[#2C3228] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D0A68D]" /> {cls.time}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#2C3228] mt-3">{cls.title}</h4>

                  <p className="text-xs text-[#7A7067] mt-1">
                    {cls.instructorName ? (
                      <>Prof. <strong>{cls.instructorName}</strong></>
                    ) : (
                      'Sem instrutora atribuída'
                    )}
                    {cls.room && <> • {cls.room}</>}
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-semibold text-[#2C3228] mb-1">
                      <span>Inscritas: {cls.enrolledCount}/{cls.capacity}</span>
                      <span className={full ? 'text-[#A04A42]' : 'text-[#3A6B4C]'}>
                        {full ? 'Lotação Esgotada' : 'Vagas Abertas'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F4ECE6] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D0A68D] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openForm(formFromClass(cls))}
                      className="flex-1 py-2 bg-[#F4ECE6] hover:bg-[#EBE0D7] text-[#2C3228] text-xs font-bold rounded-xl transition-all border border-[#E0D3C7] flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="px-3 py-2 bg-white hover:bg-[#F7E3E1] text-[#A04A42] text-xs font-bold rounded-xl transition-all border border-[#ECE5DE]"
                      aria-label="Apagar turma"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Visão geral da semana */}
      <div className="bg-white p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
        <h3 className="font-serif text-base font-bold text-[#2C3228] mb-3">Visão geral da semana</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => {
            const list = byDay.get(day) ?? [];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  selectedDay === day ? 'border-[#D0A68D] bg-[#FBF6F1]' : 'border-[#ECE5DE] bg-[#FBF9F6] hover:border-[#D0A68D]'
                }`}
              >
                <p className="text-[11px] font-bold text-[#2C3228] mb-1.5">{day}</p>
                {list.length === 0 ? (
                  <p className="text-[10px] text-[#8C827A]">—</p>
                ) : (
                  <ul className="space-y-1">
                    {list.map((c) => (
                      <li key={c.id} className="flex items-start gap-1.5 text-[10px] leading-tight text-[#61574E]">
                        <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: c.color }} />
                        <span>
                          <strong className="text-[#2C3228]">{startOf(c)}</strong> {c.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal criar/editar turma */}
      {form && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl border border-[#E2DAD1] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-lg font-bold text-[#2C3228]">
                {form.id ? 'Editar Turma do Horário' : 'Nova Turma no Horário'}
              </h3>
              <button onClick={() => setForm(null)} className="p-1.5 rounded-lg hover:bg-[#F4ECE6] text-[#7A7067]" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className={labelCls}>Nome da Aula *</label>
                <input
                  type="text"
                  placeholder="Ex: Pilates Reformer Avançado"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className={labelCls}>Categoria</label>
                  <select className={inputCls} value={form.category} onChange={(e) => changeCategory(e.target.value as ClassCategory)}>
                    {CLASS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Cor</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => update('color', e.target.value)}
                    className="w-14 h-[34px] p-1 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Instrutora</label>
                <select className={inputCls} value={form.instructorName} onChange={(e) => update('instructorName', e.target.value)}>
                  <option value="">— Sem instrutora —</option>
                  {instructorOptions(staff, form.instructorName).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Dia</label>
                  <select className={inputCls} value={form.dayOfWeek} onChange={(e) => update('dayOfWeek', e.target.value as WeekDay)}>
                    {WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Início</label>
                  <input type="time" className={inputCls} value={form.start} onChange={(e) => update('start', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Fim</label>
                  <input type="time" className={inputCls} value={form.end} onChange={(e) => update('end', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  <MapPin className="w-3 h-3 inline mr-1" />Sala / Estúdio
                </label>
                <input type="text" value={form.room} onChange={(e) => update('room', e.target.value)} className={inputCls} placeholder="Ex: Studio Reformer" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Lotação Máxima</label>
                  <input
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) => update('capacity', Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Inscritas (fixas)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.enrolledCount}
                    onChange={(e) => update('enrolledCount', Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                  />
                </div>
              </div>
              {form.capacity > 0 && form.enrolledCount > form.capacity && (
                <p className="text-[11px] font-semibold text-[#A04A42]">O número de inscritas excede a lotação.</p>
              )}

              {error && <p className="px-3 py-2 rounded-xl bg-[#F7E3E1] text-[#A04A42] font-semibold">{error}</p>}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setForm(null)} className="px-4 py-2 bg-[#F4ECE6] text-[#2C3228] rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#2C3228] text-white rounded-xl font-bold disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
