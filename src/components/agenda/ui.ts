// Constantes e utilitários partilhados pelo Horário de Aulas e pela Agenda.
import { CLASS_CATEGORIES, ClassCategory, ScheduledClass, ScheduledClassStatus, StaffMember } from '../../types';

export const inputCls =
  'w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:border-[#D0A68D] disabled:opacity-60';
export const labelCls = 'font-bold text-[#2C3228] block mb-1 text-xs';
export const primaryBtn =
  'px-4 py-2.5 bg-[#2C3228] text-white hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50';
export const secondaryBtn =
  'px-4 py-2.5 bg-white text-[#2C3228] hover:bg-[#F4ECE6] border border-[#ECE5DE] rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50';

// Cor por categoria (pode ser alterada manualmente em cada aula)
export const CATEGORY_COLORS: Record<ClassCategory, string> = {
  'Pilates Reformer': '#D0A68D',
  'Yoga & Flexibilidade': '#8FA68E',
  'Functional Female': '#2C3228',
  'Cycle & Cardio': '#B5655B',
  'Localizada & Glúteos': '#9B7FA6',
};

export const colorForCategory = (c: ClassCategory) => CATEGORY_COLORS[c] ?? '#2C3228';

export const DEFAULT_CATEGORY: ClassCategory = CLASS_CATEGORIES[0];

export const STATUS_META: Record<ScheduledClassStatus, { label: string; cls: string }> = {
  planeada: { label: 'Planeada', cls: 'bg-[#F4ECE6] text-[#61574E]' },
  confirmada: { label: 'Confirmada', cls: 'bg-[#E3ECF5] text-[#2F5A85]' },
  realizada: { label: 'Realizada', cls: 'bg-[#E4F0E7] text-[#3A6B4C]' },
  cancelada: { label: 'Cancelada', cls: 'bg-[#F7E3E1] text-[#A04A42]' },
};

export const STATUSES: ScheduledClassStatus[] = ['planeada', 'confirmada', 'realizada', 'cancelada'];

export const LESSON_PLAN_TEMPLATE = [
  'Objetivos:',
  '- ',
  '',
  'Aquecimento (10 min):',
  '- ',
  '',
  'Parte principal (30 min):',
  '- ',
  '',
  'Retorno à calma (5 min):',
  '- ',
  '',
  'Material:',
  '- ',
].join('\n');

export const toMinutes = (hhmm: string) => {
  const [h, m] = (hhmm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const durationMinutes = (s: Pick<ScheduledClass, 'startTime' | 'endTime'>) =>
  Math.max(0, toMinutes(s.endTime) - toMinutes(s.startTime));

export const sortByTime = <T extends { startTime: string }>(list: T[]) =>
  [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));

// Opções de instrutora: equipa ordenada por nome, garantindo que o valor atual aparece
export function instructorOptions(staff: StaffMember[], current?: string): string[] {
  const names = [...new Set(staff.map((s) => s.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  if (current && !names.includes(current)) names.unshift(current);
  return names;
}

export const findStaffIdByName = (staff: StaffMember[], name: string) =>
  staff.find((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase())?.id;

// Fundo translúcido a partir de uma cor #RRGGBB
export const tint = (color: string, alpha = '1A') => (/^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : '#F4ECE6');
