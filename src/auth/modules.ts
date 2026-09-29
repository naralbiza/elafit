// Módulos do sistema aos quais o administrador pode dar acesso.
// Tem de coincidir com public.app_modules() em supabase/002_financeiro_agenda.sql.
export const APP_MODULES = [
  { id: 'overview', label: 'Gestor de Negócio' },
  { id: 'crm', label: 'CRM (Clientes)' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'hr', label: 'Recursos Humanos' },
  { id: 'classes', label: 'Horário de Aulas' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'evaluations', label: 'Avaliações Físicas' },
  { id: 'plans', label: 'Planos e Vendas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'ai', label: 'Configurações & IA' },
] as const;

export type ModuleId = (typeof APP_MODULES)[number]['id'];

export const MODULE_IDS: ModuleId[] = APP_MODULES.map((m) => m.id);

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && (MODULE_IDS as string[]).includes(value);
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  avatar_url: string | null;
  is_admin: boolean;
  active: boolean;
  permissions: ModuleId[];
  created_at: string;
  updated_at: string;
}
