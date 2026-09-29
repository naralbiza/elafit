// Constantes e utilitários partilhados pelo módulo de Recursos Humanos.
import { ContractType, Employee, EmployeeRole, ShiftSchedule } from '../../types';

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  'Personal Trainer',
  'Instrutora de Pilates',
  'Instrutora Aulas de Grupo',
  'Rececionista / Gestora',
  'Nutricionista',
  'Diretora Técnica',
  'Manutenção & Limpeza',
];

export const CONTRACT_TYPES: ContractType[] = [
  'Efetivo Full-time',
  'Part-time',
  'Prestação de Serviços (Recibos Verdes)',
];

export const EMPLOYEE_STATUSES: Employee['status'][] = ['Ativa', 'De Férias', 'Baixa Médica'];

export const SHIFT_TYPES: ShiftSchedule['shiftType'][] = [
  'Manhã (07:00 - 15:00)',
  'Tarde (14:00 - 21:00)',
  'Aulas Especiais',
  'Folga',
];

export const SHIFT_AREAS: ShiftSchedule['assignedArea'][] = [
  'Receção & Check-in',
  'Sala de Treino',
  'Studio Pilates',
  'Aulas de Grupo',
];

export const STATUS_BADGE: Record<Employee['status'], string> = {
  Ativa: 'bg-[#EAF5ED] text-[#166534]',
  'De Férias': 'bg-[#FEF6E7] text-[#92600A]',
  'Baixa Médica': 'bg-[#FDECEC] text-[#9F1D1D]',
};

// Centro de custo do salário consoante a função
export function costCenterForRole(role: string): string {
  if (role === 'Instrutora de Pilates') return 'Pilates Reformer';
  if (role === 'Personal Trainer') return 'Personal Training';
  if (role === 'Instrutora Aulas de Grupo') return 'Aulas de Grupo';
  return 'Geral';
}

export const inputCls =
  'w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:border-[#D0A68D]';
export const labelCls = 'font-bold text-[#2C3228] block mb-1';
export const primaryBtn =
  'px-4 py-2 bg-[#2C3228] text-white hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';
export const secondaryBtn =
  'px-4 py-2 bg-[#F4ECE6] text-[#2C3228] hover:bg-[#ECE0D6] rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';
export const cardCls = 'bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

// Divide "a, b; c" em itens limpos e sem repetições
export const splitList = (s: string) => [...new Set(s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean))];
