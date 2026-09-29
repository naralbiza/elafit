import React, { useMemo, useState } from 'react';
import { X, Save, Trash2, Copy, Ban, Search, AlertTriangle, CheckCheck, FileText } from 'lucide-react';
import { CLASS_CATEGORIES, ClassCategory, Member, ScheduledClass, ScheduledClassStatus, StaffMember } from '../../types';
import { formatDatePt, weekDayOf } from '../../utils/dates';
import {
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
  colorForCategory,
  STATUS_META,
  STATUSES,
  LESSON_PLAN_TEMPLATE,
  instructorOptions,
  findStaffIdByName,
} from './ui';

interface SessionModalProps {
  session: ScheduledClass;
  isNew: boolean;
  readOnly: boolean;
  members: Member[];
  staff: StaffMember[];
  onClose: () => void;
  onSave: (s: ScheduledClass) => Promise<boolean>;
  onDelete: (s: ScheduledClass) => Promise<void>;
  onDuplicate: (s: ScheduledClass) => Promise<void>;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  session,
  isNew,
  readOnly,
  members,
  staff,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [draft, setDraft] = useState<ScheduledClass>(session);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ScheduledClass>(key: K, value: ScheduledClass[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const attendanceEnabled = draft.status === 'confirmada' || draft.status === 'realizada';
  const overCapacity = draft.capacity > 0 && draft.attendees.length > draft.capacity;

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => !draft.attendees.includes(m.id))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || (m.phone || '').includes(q))
      .sort((a, b) => {
        const act = Number(b.memberStatus === 'ativa') - Number(a.memberStatus === 'ativa');
        return act || a.name.localeCompare(b.name, 'pt');
      })
      .slice(0, 30);
  }, [members, draft.attendees, search]);

  const changeCategory = (category: ClassCategory) =>
    setDraft((d) => ({
      ...d,
      category,
      // Mantém a cor personalizada; só troca se a cor era a da categoria anterior
      color: d.color === colorForCategory(d.category) || !d.color ? colorForCategory(category) : d.color,
    }));

  const changeInstructor = (name: string) =>
    setDraft((d) => ({ ...d, instructorName: name, instructorId: findStaffIdByName(staff, name) }));

  const addAttendee = (id: string) => set('attendees', [...draft.attendees, id]);
  const removeAttendee = (id: string) =>
    setDraft((d) => ({ ...d, attendees: d.attendees.filter((a) => a !== id), present: d.present.filter((p) => p !== id) }));
  const togglePresent = (id: string) =>
    set('present', draft.present.includes(id) ? draft.present.filter((p) => p !== id) : [...draft.present, id]);

  const insertTemplate = () => {
    if (draft.lessonPlan.trim() && !window.confirm('Substituir o plano atual pelo modelo?')) return;
    set('lessonPlan', LESSON_PLAN_TEMPLATE);
  };

  const validate = (s: ScheduledClass): string | null => {
    if (!s.title.trim()) return 'Indique o título da aula.';
    if (!s.date) return 'Indique a data da aula.';
    if (!s.startTime || !s.endTime) return 'Indique a hora de início e de fim.';
    if (s.endTime <= s.startTime) return 'A hora de fim tem de ser posterior à hora de início.';
    if (s.capacity < 0) return 'A lotação não pode ser negativa.';
    return null;
  };

  const submit = async (override?: Partial<ScheduledClass>) => {
    const s: ScheduledClass = {
      ...draft,
      ...override,
      title: draft.title.trim(),
      // Só guarda presenças de alunas inscritas
      present: (override?.present ?? draft.present).filter((p) => draft.attendees.includes(p)),
    };
    const err = validate(s);
    setError(err);
    if (err) return;
    setBusy(true);
    const ok = await onSave(s);
    setBusy(false);
    if (ok) onClose();
  };

  const cancelClass = () => {
    if (!window.confirm('Cancelar esta aula? Continuará visível na agenda como cancelada.')) return;
    submit({ status: 'cancelada' });
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl border border-[#E2DAD1]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[#ECE5DE]">
          <div>
            <span className="text-[10px] font-bold text-[#D0A68D] tracking-widest uppercase">
              {isNew ? 'Nova aula' : readOnly ? 'Detalhe da aula' : 'Editar aula'}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#2C3228]">
              {draft.title || 'Aula sem título'}
            </h3>
            {draft.date && (
              <p className="text-xs text-[#7A7067]">
                {weekDayOf(draft.date)}, {formatDatePt(draft.date)} • {draft.startTime} - {draft.endTime}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4ECE6] text-[#7A7067]" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <fieldset disabled={readOnly || busy} className="overflow-y-auto p-5 space-y-5 text-xs min-w-0">
          {/* Dados principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Título *</label>
              <input className={inputCls} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Pilates Reformer Iniciação" />
            </div>
            <div>
              <label className={labelCls}>Data *</label>
              <input type="date" className={inputCls} value={draft.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Início</label>
                <input type="time" className={inputCls} value={draft.startTime} onChange={(e) => set('startTime', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Fim</label>
                <input type="time" className={inputCls} value={draft.endTime} onChange={(e) => set('endTime', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <select className={inputCls} value={draft.category} onChange={(e) => changeCategory(e.target.value as ClassCategory)}>
                {CLASS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Instrutora</label>
              <select className={inputCls} value={draft.instructorName} onChange={(e) => changeInstructor(e.target.value)}>
                <option value="">— Sem instrutora —</option>
                {instructorOptions(staff, draft.instructorName).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sala / Estúdio</label>
              <input className={inputCls} value={draft.room} onChange={(e) => set('room', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Lotação</label>
                <input type="number" min={0} className={inputCls} value={draft.capacity} onChange={(e) => set('capacity', Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <label className={labelCls}>Cor</label>
                <input type="color" className="w-full h-[34px] p-1 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl" value={draft.color || '#2C3228'} onChange={(e) => set('color', e.target.value)} />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className={labelCls}>Estado</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((st: ScheduledClassStatus) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => set('status', st)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                      draft.status === st ? `${STATUS_META[st].cls} border-[#2C3228]` : 'bg-white text-[#8C827A] border-[#ECE5DE] hover:bg-[#FBF9F6]'
                    }`}
                  >
                    {STATUS_META[st].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Plano da aula */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Plano da aula</label>
              {!readOnly && (
                <button type="button" onClick={insertTemplate} className="text-[11px] font-bold text-[#D0A68D] hover:underline flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Usar modelo
                </button>
              )}
            </div>
            <textarea
              rows={6}
              className={inputCls + ' font-mono leading-relaxed'}
              value={draft.lessonPlan}
              onChange={(e) => set('lessonPlan', e.target.value)}
              placeholder="Objetivos, aquecimento, parte principal, retorno à calma, material..."
            />
          </div>

          {/* Inscritas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls + ' mb-0'}>Inscritas</label>
                <span className={`text-[11px] font-bold ${overCapacity ? 'text-[#A04A42]' : 'text-[#7A7067]'}`}>
                  {draft.attendees.length}/{draft.capacity}
                </span>
              </div>
              {overCapacity && (
                <div className="mb-2 px-3 py-2 rounded-xl bg-[#F7E3E1] text-[#A04A42] text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Lotação excedida em {draft.attendees.length - draft.capacity}.
                </div>
              )}
              {!readOnly && (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                    <input className={inputCls + ' pl-8'} placeholder="Pesquisar aluna por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-[#ECE5DE] rounded-xl divide-y divide-[#F4ECE6]">
                    {candidates.length === 0 ? (
                      <p className="p-3 text-[#8C827A]">Sem alunas para adicionar.</p>
                    ) : (
                      candidates.map((m) => (
                        <button type="button" key={m.id} onClick={() => addAttendee(m.id)} className="w-full text-left px-3 py-2 hover:bg-[#FBF9F6] flex justify-between gap-2">
                          <span className="font-semibold text-[#2C3228] truncate">{m.name}</span>
                          <span className="text-[#8C827A] shrink-0">{m.memberStatus === 'ativa' ? '+ adicionar' : m.memberStatus}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Presenças */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls + ' mb-0'}>Presenças ({draft.present.filter((p) => draft.attendees.includes(p)).length})</label>
                {!readOnly && attendanceEnabled && draft.attendees.length > 0 && (
                  <button type="button" onClick={() => set('present', [...draft.attendees])} className="text-[11px] font-bold text-[#D0A68D] hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas presentes
                  </button>
                )}
              </div>
              {!attendanceEnabled && (
                <p className="mb-2 text-[11px] text-[#8C827A]">As presenças ficam disponíveis quando a aula está confirmada ou realizada.</p>
              )}
              <div className="max-h-56 overflow-y-auto border border-[#ECE5DE] rounded-xl divide-y divide-[#F4ECE6]">
                {draft.attendees.length === 0 ? (
                  <p className="p-3 text-[#8C827A]">Nenhuma aluna inscrita.</p>
                ) : (
                  draft.attendees.map((id) => (
                    <div key={id} className="flex items-center justify-between px-3 py-2 gap-2">
                      <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!attendanceEnabled}
                          checked={draft.present.includes(id)}
                          onChange={() => togglePresent(id)}
                          className="accent-[#2C3228]"
                        />
                        <span className="truncate text-[#2C3228]">{memberById.get(id)?.name ?? 'Aluna removida'}</span>
                      </label>
                      {!readOnly && (
                        <button type="button" onClick={() => removeAttendee(id)} className="text-[#8C827A] hover:text-[#A04A42]" aria-label="Remover inscrição">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && <p className="px-3 py-2 rounded-xl bg-[#F7E3E1] text-[#A04A42] font-semibold">{error}</p>}
        </fieldset>

        <div className="p-4 border-t border-[#ECE5DE] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {!readOnly && !isNew && (
              <>
                <button type="button" disabled={busy} onClick={() => run(() => onDelete(draft))} className={secondaryBtn + ' text-[#A04A42]'}>
                  <Trash2 className="w-4 h-4" /> Apagar
                </button>
                <button type="button" disabled={busy} onClick={() => run(() => onDuplicate(draft))} className={secondaryBtn}>
                  <Copy className="w-4 h-4" /> Duplicar para a próxima semana
                </button>
                {draft.status !== 'cancelada' && (
                  <button type="button" disabled={busy} onClick={cancelClass} className={secondaryBtn}>
                    <Ban className="w-4 h-4" /> Cancelar aula
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[#F4ECE6] text-[#2C3228] rounded-xl text-xs font-bold">
              {readOnly ? 'Fechar' : 'Sair sem guardar'}
            </button>
            {!readOnly && (
              <button type="button" disabled={busy} onClick={() => submit()} className={primaryBtn}>
                <Save className="w-4 h-4 text-[#D0A68D]" /> Guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
