// Utilitários de datas no formato AAAA-MM-DD (sem fusos horários: tudo em hora local).
import { WEEK_DAYS, WeekDay } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const localToday = () => toISODate(new Date());

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

// Segunda-feira da semana da data indicada
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  const offset = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

// As 7 datas da semana (segunda a domingo)
export const weekDates = (weekStart: string) => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

// Dia da semana em português ('Segunda', ..., 'Domingo')
export function weekDayOf(iso: string): WeekDay {
  return WEEK_DAYS[(parseISODate(iso).getDay() + 6) % 7];
}

// Data da semana correspondente a um dia ('Quarta' → AAAA-MM-DD)
export const dateForWeekDay = (weekStart: string, day: WeekDay) => addDays(weekStart, WEEK_DAYS.indexOf(day));

// 26/09/2026
export const formatDatePt = (iso: string) => (iso ? parseISODate(iso).toLocaleDateString('pt-PT') : '');

// "22 a 28 de setembro de 2026"
export function formatWeekRange(weekStart: string): string {
  const start = parseISODate(weekStart);
  const end = parseISODate(addDays(weekStart, 6));
  const endLabel = end.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  const startLabel =
    start.getMonth() === end.getMonth()
      ? String(start.getDate())
      : start.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
  return `${startLabel} a ${endLabel}`;
}

// "09:00 - 09:50" → { start: '09:00', end: '09:50' }
export function parseTimeRange(range: string): { start: string; end: string } {
  const [start = '09:00', end = '10:00'] = range.split('-').map((s) => s.trim());
  return { start, end };
}
