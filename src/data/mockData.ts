import { Member, ClassSession, Transaction, Employee, ShiftSchedule, AIInsight } from '../types';

export const initialMembers: Member[] = [
  {
    id: 'M001',
    name: 'Sofia Henriques',
    email: 'sofia.henriques@email.co.ao',
    phone: '+244 923 345 678',
    nif: '245678910',
    birthDate: '1992-04-15',
    leadStatus: 'matriculada',
    memberStatus: 'ativa',
    plan: 'Ela Fit Anual VIP',
    monthlyFee: 45000,
    startDate: '2025-01-10',
    renewalDate: '2026-10-10',
    assignedTrainerId: 'EMP001',
    assignedTrainerName: 'Margarida Silva',
    attendanceCountThisMonth: 12,
    lastAttendanceDate: '2026-09-14',
    emergencyContact: {
      name: 'João Henriques',
      phone: '+244 919 888 777',
      relation: 'Esposo'
    },
    evaluations: [
      { date: '2026-01-10', weightKg: 64.5, bodyFatPercent: 26.2, muscleMassKg: 24.1, notes: 'Avaliação inicial. Objetivo: Tonificação geral.' },
      { date: '2026-06-12', weightKg: 61.8, bodyFatPercent: 22.8, muscleMassKg: 25.4, notes: 'Excelente evolução no treino de hipertrofia e Pilates.' }
    ],
    notes: 'Prefere treino no período da manhã. Pratica Pilates Reformer 2x por semana.',
    createdAt: '2025-01-05'
  },
  {
    id: 'M002',
    name: 'Beatriz Vasconcelos',
    email: 'beatriz.v@email.co.ao',
    phone: '+244 934 567 890',
    nif: '234567891',
    birthDate: '1988-11-22',
    leadStatus: 'matriculada',
    memberStatus: 'ativa',
    plan: 'Ela Fit Pilates Reformer',
    monthlyFee: 65000,
    startDate: '2025-03-01',
    renewalDate: '2026-10-01',
    assignedTrainerId: 'EMP002',
    assignedTrainerName: 'Inês Carmo',
    attendanceCountThisMonth: 9,
    lastAttendanceDate: '2026-09-13',
    emergencyContact: {
      name: 'Maria Vasconcelos',
      phone: '+244 933 111 222',
      relation: 'Mãe'
    },
    evaluations: [
      { date: '2026-03-01', weightKg: 58.0, bodyFatPercent: 24.0, muscleMassKg: 22.5, notes: 'Foco na postura e fortalecimento do pavimento pélvico.' }
    ],
    notes: 'Recuperação pós-parto orientada pela Dra. Inês.',
    createdAt: '2025-02-20'
  },
  {
    id: 'M003',
    name: 'Carolina Mendes',
    email: 'carolina.mendes@outlook.co.ao',
    phone: '+244 961 234 567',
    nif: '256789123',
    birthDate: '1995-07-08',
    leadStatus: 'proposta_enviada',
    memberStatus: 'pendente_renovacao',
    plan: 'Ela Fit Livre',
    monthlyFee: 35000,
    startDate: '2025-09-15',
    renewalDate: '2026-09-15',
    assignedTrainerId: 'EMP001',
    assignedTrainerName: 'Margarida Silva',
    attendanceCountThisMonth: 3,
    lastAttendanceDate: '2026-09-02',
    emergencyContact: {
      name: 'Teresa Mendes',
      phone: '+244 965 444 333',
      relation: 'Irmã'
    },
    evaluations: [],
    notes: 'Enviada proposta para upgrade para o Plano Anual VIP.',
    createdAt: '2025-09-10'
  },
  {
    id: 'M004',
    name: 'Matilde Antunes',
    email: 'matilde.antunes@gmail.com',
    phone: '+244 927 890 123',
    birthDate: '1999-01-30',
    leadStatus: 'aula_experimental',
    memberStatus: 'inativa',
    plan: 'Ela Fit Livre',
    monthlyFee: 35000,
    startDate: '2026-09-16',
    renewalDate: '2026-10-16',
    attendanceCountThisMonth: 1,
    lastAttendanceDate: '2026-09-12',
    emergencyContact: {
      name: 'Carla Antunes',
      phone: '+244 922 999 888',
      relation: 'Mãe'
    },
    evaluations: [],
    notes: 'Fez aula experimental de Functional Female. Adorou o ambiente exclusivo feminino!',
    createdAt: '2026-09-11'
  },
  {
    id: 'M005',
    name: 'Diana Ferreira',
    email: 'diana.ferreira@netangola.ao',
    phone: '+244 918 234 567',
    birthDate: '1985-09-03',
    leadStatus: 'novo_lead',
    memberStatus: 'inativa',
    plan: 'Ela Fit Livre',
    monthlyFee: 35000,
    startDate: '',
    renewalDate: '',
    attendanceCountThisMonth: 0,
    emergencyContact: { name: '', phone: '', relation: '' },
    evaluations: [],
    notes: 'Preencheu formulário no Instagram. Procura treino personalizado pós-trabalho.',
    createdAt: '2026-09-14'
  },
  {
    id: 'M006',
    name: 'Francisca Alvo',
    email: 'francisca.alvo@gmail.com',
    phone: '+244 932 888 777',
    nif: '267891234',
    birthDate: '1990-12-19',
    leadStatus: 'matriculada',
    memberStatus: 'ativa',
    plan: 'Pacote 10 PT',
    monthlyFee: 180000,
    startDate: '2026-08-01',
    renewalDate: '2026-10-01',
    assignedTrainerId: 'EMP001',
    assignedTrainerName: 'Margarida Silva',
    attendanceCountThisMonth: 8,
    lastAttendanceDate: '2026-09-14',
    emergencyContact: { name: 'Luís Alvo', phone: '+244 931 000 999', relation: 'Pai' },
    evaluations: [
      { date: '2026-08-02', weightKg: 69.0, bodyFatPercent: 28.5, muscleMassKg: 23.0, notes: 'Foco em perdas de massa gorda e fortalecimento do core.' }
    ],
    notes: 'Treinos de PT 2x por semana às terças e quintas às 18h30.',
    createdAt: '2026-07-28'
  }
];

export const initialClasses: ClassSession[] = [
  {
    id: 'CLS001',
    title: 'Pilates Reformer - Core & Alinhamento',
    instructorName: 'Inês Carmo',
    category: 'Pilates Reformer',
    dayOfWeek: 'Segunda',
    time: '09:00 - 09:50',
    room: 'Studio Reformer',
    capacity: 8,
    enrolledCount: 8,
    color: '#D0A68D'
  },
  {
    id: 'CLS002',
    title: 'Functional Female & Glúteos',
    instructorName: 'Margarida Silva',
    category: 'Functional Female',
    dayOfWeek: 'Segunda',
    time: '18:30 - 19:15',
    room: 'Estúdio Principal',
    capacity: 15,
    enrolledCount: 14,
    color: '#2C3228'
  },
  {
    id: 'CLS003',
    title: 'Yoga & Meditação Feminina',
    instructorName: 'Camila Santos',
    category: 'Yoga & Flexibilidade',
    dayOfWeek: 'Terça',
    time: '10:00 - 11:00',
    room: 'Estúdio Zen',
    capacity: 12,
    enrolledCount: 10,
    color: '#8A9A86'
  },
  {
    id: 'CLS004',
    title: 'Cycle Cardio Ritmo',
    instructorName: 'Margarida Silva',
    category: 'Cycle & Cardio',
    dayOfWeek: 'Quarta',
    time: '19:00 - 19:45',
    room: 'Cycle Arena',
    capacity: 14,
    enrolledCount: 12,
    color: '#C87D65'
  },
  {
    id: 'CLS005',
    title: 'Localizada & Hipertrofia Feminina',
    instructorName: 'Rita Pereira',
    category: 'Localizada & Glúteos',
    dayOfWeek: 'Quinta',
    time: '18:30 - 19:20',
    room: 'Estúdio Principal',
    capacity: 15,
    enrolledCount: 15,
    color: '#2C3228'
  }
];

type TransactionSeed = Omit<Transaction, 'vatRate' | 'account' | 'costCenter' | 'notes'> & Partial<Transaction>;

const transactionSeeds: TransactionSeed[] = [
  {
    id: 'TX-2026-0901',
    description: 'Mensalidade Anual VIP - Sofia Henriques',
    amount: 45000,
    type: 'receita',
    category: 'Mensalidades',
    date: '2026-09-10',
    status: 'pago',
    memberId: 'M001',
    memberName: 'Sofia Henriques',
    paymentMethod: 'Débito Direto',
    receiptNumber: 'REC-2026-1042'
  },
  {
    id: 'TX-2026-0902',
    description: 'Mensalidade Pilates Reformer - Beatriz Vasconcelos',
    amount: 65000,
    type: 'receita',
    category: 'Pilates Reformer',
    date: '2026-09-01',
    status: 'pago',
    memberId: 'M002',
    memberName: 'Beatriz Vasconcelos',
    paymentMethod: 'Multicaixa Express',
    receiptNumber: 'REC-2026-1043'
  },
  {
    id: 'TX-2026-0903',
    description: 'Pacote 10 Sessões PT - Francisca Alvo',
    amount: 180000,
    type: 'receita',
    category: 'Personal Training',
    date: '2026-09-01',
    status: 'pago',
    memberId: 'M006',
    memberName: 'Francisca Alvo',
    paymentMethod: 'Transferência Bancária',
    receiptNumber: 'REC-2026-1044'
  },
  {
    id: 'TX-2026-0904',
    description: 'Venda Matcha Shake & Proteína Feminina Ela Fit',
    amount: 28000,
    type: 'receita',
    category: 'Bar & Suplementos',
    date: '2026-09-12',
    status: 'pago',
    paymentMethod: 'Multicaixa Express'
  },
  {
    id: 'TX-2026-0905',
    description: 'Aluguer das Instalações & Renda Espaço Ela Fit',
    amount: 1250000,
    type: 'despesa',
    category: 'Renda & Instalações',
    date: '2026-09-05',
    status: 'pago',
    paymentMethod: 'Transferência Bancária'
  },
  {
    id: 'TX-2026-0906',
    description: 'Manutenção Mola Reformer Pilates',
    amount: 140000,
    type: 'despesa',
    category: 'Equipamento & Manutenção',
    date: '2026-09-08',
    status: 'pago',
    paymentMethod: 'Transferência Bancária'
  },
  {
    id: 'TX-2026-0907',
    description: 'Campanha Instagram Ads - "Ao Seu Ritmo"',
    amount: 180000,
    type: 'despesa',
    category: 'Marketing & Eventos',
    date: '2026-09-02',
    status: 'pago',
    paymentMethod: 'TPA (Cartão)'
  },
  {
    id: 'TX-2026-0908',
    description: 'Mensalidade Pendente - Carolina Mendes',
    amount: 35000,
    type: 'receita',
    category: 'Mensalidades',
    date: '2026-09-15',
    status: 'atrasado',
    memberId: 'M003',
    memberName: 'Carolina Mendes',
    paymentMethod: 'Débito Direto'
  },
  {
    id: 'TX-2026-0909',
    description: 'Fatura ENDE — Energia elétrica (Setembro)',
    amount: 210000,
    type: 'despesa',
    category: 'Água & Energia',
    date: '2026-09-06',
    status: 'pago',
    paymentMethod: 'Transferência Bancária',
    supplier: 'ENDE',
    vatRate: 14
  },
  {
    id: 'TX-2026-0910',
    description: 'Fatura EPAL — Água (Setembro)',
    amount: 45000,
    type: 'despesa',
    category: 'Água & Energia',
    date: '2026-09-06',
    status: 'pago',
    paymentMethod: 'Transferência Bancária',
    supplier: 'EPAL',
    vatRate: 14
  },
  {
    id: 'TX-2026-0911',
    description: 'Internet Fibra & Telefone',
    amount: 38000,
    type: 'despesa',
    category: 'Internet & Comunicações',
    date: '2026-09-03',
    status: 'pago',
    paymentMethod: 'Débito Direto',
    supplier: 'Unitel',
    vatRate: 14
  },
  {
    id: 'TX-2026-0912',
    description: 'Serviço de Segurança & Limpeza',
    amount: 160000,
    type: 'despesa',
    category: 'Limpeza & Segurança',
    date: '2026-09-30',
    status: 'pendente',
    paymentMethod: 'Transferência Bancária',
    supplier: 'Prestadora de Serviços Lda',
    vatRate: 14
  }
];

// Contas e centros de custo por omissão para os dados de demonstração
const COST_CENTER_BY_CATEGORY: Record<string, string> = {
  Mensalidades: 'Musculação',
  'Pilates Reformer': 'Pilates Reformer',
  'Personal Training': 'Personal Training',
  'Bar & Suplementos': 'Bar & Suplementos',
  'Equipamento & Manutenção': 'Pilates Reformer',
};

export const initialTransactions: Transaction[] = transactionSeeds.map((t) => ({
  vatRate: 0,
  account: t.paymentMethod === 'Dinheiro' ? 'Caixa' : t.paymentMethod === 'Multicaixa Express' ? 'Multicaixa Express' : 'Banco BAI',
  costCenter: COST_CENTER_BY_CATEGORY[t.category] ?? 'Geral',
  notes: '',
  ...t,
}));

type EmployeeSeed = Omit<Employee, 'allowances'> & Partial<Employee>;

const employeeSeeds: EmployeeSeed[] = [
  {
    id: 'EMP001',
    name: 'Margarida Silva',
    role: 'Personal Trainer',
    email: 'margarida.pt@elafit.co.ao',
    phone: '+244 917 111 222',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    contractType: 'Efetivo Full-time',
    baseSalary: 450000,
    ptBonusRate: 10000,
    classesGivenThisMonth: 18,
    ptSessionsThisMonth: 24,
    hireDate: '2023-09-01',
    status: 'Ativa',
    weeklyHours: 40,
    certifications: ['Grau II Exercício Físico', 'Especialização Saúde Feminina & Pré/Pós-Parto']
  },
  {
    id: 'EMP002',
    name: 'Dra. Inês Carmo',
    role: 'Instrutora de Pilates',
    email: 'ines.carmo@elafit.co.ao',
    phone: '+244 931 222 333',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    contractType: 'Part-time',
    baseSalary: 350000,
    ptBonusRate: 12000,
    classesGivenThisMonth: 22,
    ptSessionsThisMonth: 12,
    hireDate: '2024-01-15',
    status: 'Ativa',
    weeklyHours: 25,
    certifications: ['Pilates Reformer Master', 'Fisioterapia Pélvica']
  },
  {
    id: 'EMP003',
    name: 'Camila Santos',
    role: 'Instrutora Aulas de Grupo',
    email: 'camila.s@elafit.co.ao',
    phone: '+244 962 333 444',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    contractType: 'Prestação de Serviços (Recibos Verdes)',
    baseSalary: 0,
    ptBonusRate: 15000, // Por aula de grupo
    classesGivenThisMonth: 16,
    ptSessionsThisMonth: 0,
    hireDate: '2024-05-10',
    status: 'Ativa',
    weeklyHours: 12,
    certifications: ['Yoga Vinyasa Alliance', 'Les Mills BodyBalance']
  },
  {
    id: 'EMP004',
    name: 'Patricia Lima',
    role: 'Rececionista / Gestora',
    email: 'patricia.lima@elafit.co.ao',
    phone: '+244 925 444 555',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    contractType: 'Efetivo Full-time',
    baseSalary: 280000,
    ptBonusRate: 0,
    classesGivenThisMonth: 0,
    ptSessionsThisMonth: 0,
    hireDate: '2023-10-01',
    status: 'Ativa',
    weeklyHours: 40,
    certifications: ['Atendimento ao Cliente', 'Gestão de CRM Ela Fit']
  }
];

export const initialEmployees: Employee[] = employeeSeeds.map((e) => ({ allowances: 0, ...e }));

export const initialShifts: ShiftSchedule[] = [
  { id: 'S1', employeeId: 'EMP004', employeeName: 'Patricia Lima', day: 'Segunda', shiftType: 'Manhã (07:00 - 15:00)', assignedArea: 'Receção & Check-in' },
  { id: 'S2', employeeId: 'EMP001', employeeName: 'Margarida Silva', day: 'Segunda', shiftType: 'Tarde (14:00 - 21:00)', assignedArea: 'Sala de Treino' },
  { id: 'S3', employeeId: 'EMP002', employeeName: 'Dra. Inês Carmo', day: 'Segunda', shiftType: 'Aulas Especiais', assignedArea: 'Studio Pilates' },
  { id: 'S4', employeeId: 'EMP001', employeeName: 'Margarida Silva', day: 'Terça', shiftType: 'Manhã (07:00 - 15:00)', assignedArea: 'Sala de Treino' },
  { id: 'S5', employeeId: 'EMP003', employeeName: 'Camila Santos', day: 'Terça', shiftType: 'Aulas Especiais', assignedArea: 'Aulas de Grupo' },
  { id: 'S6', employeeId: 'EMP004', employeeName: 'Patricia Lima', day: 'Quarta', shiftType: 'Tarde (14:00 - 21:00)', assignedArea: 'Receção & Check-in' },
];

export const initialAIInsights: AIInsight[] = [
  {
    id: 'AI1',
    category: 'CRM',
    title: 'Oportunidade de Conversão Pilates Reformer',
    summary: 'Identificámos 4 alunas do plano livre que frequentaram 3+ aulas experimentais de Pilates Reformer no último mês.',
    actionableStep: 'Enviar campanha automatizada no WhatsApp com 15% de desconto no 1º mês do Plano Pilates Reformer.',
    impactScore: 'Alta',
    timestamp: 'Há 2 horas'
  },
  {
    id: 'AI2',
    category: 'Financeiro',
    title: 'Otimização de LTV e Renovação Anual',
    summary: 'A taxa de retenção do Plano Anual VIP está em 94%. O faturamento mensal de mensalidades atinge 2.450.000 Kz, com potencial de crescer +12% no próximo trimestre.',
    actionableStep: 'Oferecer avaliação física de cortesia a alunas com renovação em Outubro.',
    impactScore: 'Média',
    timestamp: 'Hoje às 08:30'
  },
  {
    id: 'AI3',
    category: 'RH',
    title: 'Alta Procura em Horários Pós-Laborais',
    summary: 'As aulas de Functional Female das 18h30 de 5ª feira atingiram 100% da lotação nas últimas 3 semanas consecutivas.',
    actionableStep: 'Abrir nova turma às 19h30 com a PT Margarida Silva.',
    impactScore: 'Alta',
    timestamp: 'Ontem'
  }
];
