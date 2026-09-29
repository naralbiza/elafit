// Core Data Types for Ela Fit Gym Management System
import type { ModuleId } from './auth/modules';

// 'users' é a área de gestão de utilizadores, visível apenas para administradores
export type TabType = ModuleId | 'users';

export type LeadStatus = 'novo_lead' | 'aula_experimental' | 'proposta_enviada' | 'matriculada' | 'perdida';

export type MemberStatus = 'ativa' | 'suspensa' | 'pendente_renovacao' | 'inativa';

// Os planos vêm da tabela "plans"; o membro guarda o nome do plano
export type PlanType = string;

export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';

export const INCOME_CATEGORIES = [
  'Mensalidades',
  'Personal Training',
  'Pilates Reformer',
  'Avaliações Físicas',
  'Bar & Suplementos',
  'Outras Receitas',
] as const;

export const EXPENSE_CATEGORIES = [
  'Salários & RH',
  'Impostos & Contribuições',
  'Renda & Instalações',
  'Água & Energia',
  'Internet & Comunicações',
  'Limpeza & Segurança',
  'Equipamento & Manutenção',
  'Fornecedores & Stock',
  'Marketing & Eventos',
  'Seguros',
  'Serviços Profissionais',
  'Taxas Bancárias',
  'Outros',
] as const;

export type TransactionCategory = (typeof INCOME_CATEGORIES)[number] | (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'Multicaixa Express',
  'TPA (Cartão)',
  'Transferência Bancária',
  'Dinheiro',
  'Débito Direto',
  'MBWay',
  'Multibanco',
  'Cartão de Crédito',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type EmployeeRole =
  | 'Personal Trainer'
  | 'Instrutora de Pilates'
  | 'Instrutora Aulas de Grupo'
  | 'Rececionista / Gestora'
  | 'Nutricionista'
  | 'Diretora Técnica'
  | 'Manutenção & Limpeza';

export type ContractType = 'Efetivo Full-time' | 'Part-time' | 'Prestação de Serviços (Recibos Verdes)';

export type WeekDay = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export const WEEK_DAYS: WeekDay[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const CLASS_CATEGORIES = [
  'Pilates Reformer',
  'Yoga & Flexibilidade',
  'Functional Female',
  'Cycle & Cardio',
  'Localizada & Glúteos',
] as const;

export type ClassCategory = (typeof CLASS_CATEGORIES)[number];

export interface PhysicalEvaluation {
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  notes: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif?: string;
  birthDate: string;
  leadStatus: LeadStatus;
  memberStatus: MemberStatus;
  plan: PlanType;
  monthlyFee: number;
  startDate: string;
  renewalDate: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  attendanceCountThisMonth: number;
  lastAttendanceDate?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  evaluations: PhysicalEvaluation[];
  notes: string;
  createdAt: string;
}

// Horário fixo semanal (modelo que se repete todas as semanas)
export interface ClassSession {
  id: string;
  title: string;
  instructorName: string;
  category: ClassCategory;
  dayOfWeek: WeekDay;
  time: string; // e.g. "09:00 - 09:45"
  room: string;
  capacity: number;
  enrolledCount: number;
  color: string;
}

// Aula planificada numa data concreta (Agenda)
export type ScheduledClassStatus = 'planeada' | 'confirmada' | 'realizada' | 'cancelada';

export interface ScheduledClass {
  id: string;
  date: string; // AAAA-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  category: ClassCategory;
  instructorId?: string;
  instructorName: string;
  room: string;
  capacity: number;
  attendees: string[]; // ids das alunas inscritas
  present: string[]; // ids das alunas presentes
  status: ScheduledClassStatus;
  lessonPlan: string;
  color: string;
  templateId?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // valor total (com IVA, se aplicável)
  type: 'receita' | 'despesa';
  category: TransactionCategory;
  date: string;
  status: PaymentStatus;
  memberId?: string;
  memberName?: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  vatRate: number; // % de IVA incluído no valor
  account: string; // conta financeira (Caixa, Banco...)
  costCenter: string; // serviço / centro de custo
  supplier?: string;
  dueDate?: string;
  notes: string;
  payrollRunId?: string;
  recurringId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  avatarUrl?: string;
  contractType: ContractType;
  baseSalary: number;
  ptBonusRate: number; // e.g. 15€ per PT session
  classesGivenThisMonth: number;
  ptSessionsThisMonth: number;
  hireDate: string;
  status: 'Ativa' | 'De Férias' | 'Baixa Médica';
  weeklyHours: number;
  certifications: string[];
  nif?: string;
  iban?: string;
  inssNumber?: string;
  allowances: number; // subsídios fixos mensais
}

// Entrada do diretório da equipa (sem dados salariais)
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
  avatarUrl?: string;
}

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  day: WeekDay;
  shiftType: 'Manhã (07:00 - 15:00)' | 'Tarde (14:00 - 21:00)' | 'Aulas Especiais' | 'Folga';
  assignedArea: 'Receção & Check-in' | 'Sala de Treino' | 'Studio Pilates' | 'Aulas de Grupo';
}

export interface AIInsight {
  id: string;
  category: 'CRM' | 'Financeiro' | 'RH' | 'Estratégia';
  title: string;
  summary: string;
  actionableStep: string;
  impactScore: 'Alta' | 'Média' | 'Info';
  timestamp: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  tag: string;
  durationMonths: number;
  costCenter: string;
  active: boolean;
  sortOrder: number;
}

export interface RecurringExpense {
  id: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  vatRate: number;
  account: string;
  costCenter: string;
  supplier?: string;
  paymentMethod: PaymentMethod;
  dayOfMonth: number;
  active: boolean;
}

export interface PayrollRun {
  id: string;
  month: string; // AAAA-MM
  employeeId?: string;
  employeeName: string;
  role: string;
  contractType: string;
  baseSalary: number;
  classesCount: number;
  ptSessions: number;
  bonusRate: number;
  commissions: number;
  allowances: number;
  gross: number;
  inssEmployee: number;
  inssEmployer: number;
  irt: number;
  withholding: number;
  otherDeductions: number;
  net: number;
  status: 'processado' | 'pago';
  paidAt?: string;
}

export interface IrtBracket {
  from: number; // limite inferior do escalão (Kz)
  fixed: number; // parcela fixa (Kz)
  rate: number; // % sobre o excesso de "from"
}

export interface FinanceSettings {
  companyName: string;
  companyNif: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  ivaRate: number;
  pricesIncludeIva: boolean;
  industrialTaxRate: number;
  inssEmployeeRate: number;
  inssEmployerRate: number;
  servicesWithholdingRate: number;
  irtBrackets: IrtBracket[];
  accounts: string[];
  costCenters: string[];
  goalActiveMembers: number;
  goalMonthlyRevenue: number;
  goalRetentionRate: number;
}
