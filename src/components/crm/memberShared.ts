// Utilitários partilhados pelos módulos de alunas (CRM, Avaliações, Planos, fichas).
import { LeadStatus, Member, MemberStatus, PhysicalEvaluation } from '../../types';
import { toISODate } from '../../utils/dates';

export const MEMBER_STATUS_META: Record<MemberStatus, { label: string; cls: string; color: string }> = {
  ativa: { label: 'Ativa', cls: 'bg-[#EAF5ED] text-[#166534]', color: '#3A6B4C' },
  pendente_renovacao: { label: 'Pendente Renovação', cls: 'bg-[#FEF3C7] text-[#92400E]', color: '#D0A68D' },
  suspensa: { label: 'Suspensa', cls: 'bg-[#FDECEB] text-[#8C5252]', color: '#E06D6D' },
  inativa: { label: 'Inativa', cls: 'bg-[#F3F4F6] text-[#4B5563]', color: '#B0A8A0' },
};

export const MEMBER_STATUSES: MemberStatus[] = ['ativa', 'pendente_renovacao', 'suspensa', 'inativa'];

export const LEAD_STAGES: { id: LeadStatus; label: string; color: string; bg: string }[] = [
  { id: 'novo_lead', label: 'Novo Lead', color: '#2C3228', bg: '#F4ECE6' },
  { id: 'aula_experimental', label: 'Aula Experimental', color: '#D0A68D', bg: '#FDF7F3' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'matriculada', label: 'Matriculada', color: '#166534', bg: '#DCFCE7' },
  { id: 'perdida', label: 'Não Convertida', color: '#991B1B', bg: '#FEE2E2' },
];

export const leadLabel = (s: LeadStatus) => LEAD_STAGES.find((l) => l.id === s)?.label ?? s;

export const inputCls =
  'w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#2C3228]';
export const labelCls = 'font-bold text-[#2C3228] block mb-1 text-xs';
export const primaryBtn =
  'px-4 py-2 bg-[#2C3228] text-white hover:bg-[#3E4639] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50';
export const secondaryBtn = 'px-4 py-2 bg-[#F4ECE6] text-[#2C3228] hover:bg-[#EADFD6] rounded-xl text-xs font-bold';

export const initials = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join('')
    .toUpperCase();

export const firstName = (name?: string | null) => (name || '').trim().split(/\s+/)[0] || '';

// Data (AAAA-MM-DD) de criação, aceitando datas ou timestamps
export function createdDate(m: Pick<Member, 'createdAt'>): string {
  if (!m.createdAt) return '';
  if (m.createdAt.length <= 10) return m.createdAt;
  const d = new Date(m.createdAt);
  return isNaN(d.getTime()) ? m.createdAt.slice(0, 10) : toISODate(d);
}

// Avaliações da mais recente para a mais antiga
export const sortedEvaluations = (m: Pick<Member, 'evaluations'>): PhysicalEvaluation[] =>
  [...(m.evaluations || [])].sort((a, b) => b.date.localeCompare(a.date));

export const whatsappLink = (phone: string, text?: string) => {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};

export const fmtNum = (n: number, digits = 1) =>
  Number.isFinite(n) ? n.toFixed(digits).replace('.', ',') : '—';

export const normalize = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
