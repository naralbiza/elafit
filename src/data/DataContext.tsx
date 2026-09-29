// Estado central dos dados do ginásio, sincronizado com o Supabase (com tempo real).
// Os módulos usam useData() para ler dados e chamar ações de gravação/remoção.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as repo from './repository';
import {
  Member,
  Transaction,
  Employee,
  ShiftSchedule,
  ClassSession,
  AIInsight,
  Plan,
  RecurringExpense,
  PayrollRun,
  ScheduledClass,
  StaffMember,
  FinanceSettings,
} from '../types';
import { DEFAULT_FINANCE_SETTINGS } from '../utils/finance';

interface Collections {
  members: Member[];
  transactions: Transaction[];
  employees: Employee[];
  shifts: ShiftSchedule[];
  classes: ClassSession[];
  insights: AIInsight[];
  plans: Plan[];
  recurringExpenses: RecurringExpense[];
  payrollRuns: PayrollRun[];
  scheduledClasses: ScheduledClass[];
  staff: StaffMember[];
}

type CollectionKey = keyof Collections;

// Tabela do Supabase → coleção local
const TABLES: Record<string, CollectionKey | 'settings'> = {
  members: 'members',
  transactions: 'transactions',
  employees: 'employees',
  shifts: 'shifts',
  classes: 'classes',
  ai_insights: 'insights',
  plans: 'plans',
  recurring_expenses: 'recurringExpenses',
  payroll_runs: 'payrollRuns',
  class_sessions: 'scheduledClasses',
  finance_settings: 'settings',
};

const FETCHERS: { [K in CollectionKey]: () => Promise<Collections[K]> } = {
  members: repo.fetchMembers,
  transactions: repo.fetchTransactions,
  employees: repo.fetchEmployees,
  shifts: repo.fetchShifts,
  classes: repo.fetchClasses,
  insights: repo.fetchInsights,
  plans: repo.fetchPlans,
  recurringExpenses: repo.fetchRecurringExpenses,
  payrollRuns: repo.fetchPayrollRuns,
  scheduledClasses: repo.fetchScheduledClasses,
  staff: repo.fetchStaffDirectory,
};

const EMPTY: Collections = {
  members: [],
  transactions: [],
  employees: [],
  shifts: [],
  classes: [],
  insights: [],
  plans: [],
  recurringExpenses: [],
  payrollRuns: [],
  scheduledClasses: [],
  staff: [],
};

export interface DataActions {
  // Todas devolvem true se gravou com sucesso (em caso de erro mostram um alerta e recarregam)
  saveMember: (m: Member) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;
  saveTransaction: (t: Transaction) => Promise<boolean>;
  saveTransactions: (ts: Transaction[]) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  saveEmployee: (e: Employee) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  saveClass: (c: ClassSession) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;
  replaceShifts: (s: ShiftSchedule[]) => Promise<boolean>;
  savePlan: (p: Plan) => Promise<boolean>;
  deletePlan: (id: string) => Promise<boolean>;
  saveRecurringExpense: (e: RecurringExpense) => Promise<boolean>;
  deleteRecurringExpense: (id: string) => Promise<boolean>;
  savePayrollRuns: (runs: PayrollRun[]) => Promise<boolean>;
  deletePayrollRun: (id: string) => Promise<boolean>;
  saveScheduledClasses: (s: ScheduledClass[]) => Promise<boolean>;
  deleteScheduledClass: (id: string) => Promise<boolean>;
  saveSettings: (s: FinanceSettings) => Promise<boolean>;
}

interface DataContextValue extends Collections {
  settings: FinanceSettings;
  loading: boolean;
  error: string | null;
  reloadAll: () => void;
  actions: DataActions;
}

const DataContext = createContext<DataContextValue | null>(null);

// Substitui/insere itens por id
function upsertById<T extends { id: string }>(list: T[], items: T[]): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const updated = list.map((i) => byId.get(i.id) ?? i);
  const existing = new Set(list.map((i) => i.id));
  return [...items.filter((i) => !existing.has(i.id)), ...updated];
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Collections>(EMPTY);
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_FINANCE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dataRef = useRef(data);
  dataRef.current = data;

  const setError = (key: string, message: string | null) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });

  const reload = useCallback(async (key: CollectionKey | 'settings') => {
    try {
      if (key === 'settings') {
        setSettings(await repo.fetchFinanceSettings());
      } else {
        const rows = await FETCHERS[key]();
        setData((prev) => ({ ...prev, [key]: rows }));
      }
      setError(key, null);
    } catch (e: any) {
      setError(key, e.message);
    }
  }, []);

  const reloadAll = useCallback(() => {
    const keys = [...(Object.keys(FETCHERS) as CollectionKey[]), 'settings' as const];
    Promise.all(keys.map(reload)).finally(() => setLoading(false));
  }, [reload]);

  // Carregamento inicial + tempo real (alterações feitas por outros utilizadores)
  useEffect(() => {
    reloadAll();
    const channel = supabase.channel('elafit-data');
    Object.entries(TABLES).forEach(([table, key]) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        reload(key);
        if (table === 'employees') reload('staff');
      });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload, reloadAll]);

  const actions = useMemo<DataActions>(() => {
    // Grava no Supabase; em caso de erro, alerta e repõe o estado do servidor
    const run = async (keys: (CollectionKey | 'settings')[], op: () => Promise<void>) => {
      try {
        await op();
        return true;
      } catch (e: any) {
        console.error('[Ela Fit] Erro na operação de dados:', e);
        window.alert(e.message || 'Erro ao guardar dados. Tente novamente mais tarde.');
        keys.forEach(reload);
        return false;
      }
    };

    function collection<K extends CollectionKey>(
      key: K,
      save: (items: Collections[K]) => Promise<void>,
      del: (id: string) => Promise<void>
    ) {
      type Item = Collections[K][number];
      return {
        save: (items: Item[]) => {
          setData((prev) => ({ ...prev, [key]: upsertById(prev[key] as any[], items as any[]) }));
          return run([key], () => save(items as Collections[K]));
        },
        remove: (id: string) => {
          setData((prev) => ({ ...prev, [key]: (prev[key] as any[]).filter((i) => i.id !== id) }));
          return run([key], () => del(id));
        },
      };
    }

    const members = collection('members', async (i) => { for (const m of i) await repo.saveMember(m); }, repo.deleteMember);
    const transactions = collection('transactions', repo.saveTransactions, repo.deleteTransaction);
    const employees = collection('employees', async (i) => { for (const e of i) await repo.saveEmployee(e); }, repo.deleteEmployee);
    const classes = collection('classes', async (i) => { for (const c of i) await repo.saveClass(c); }, repo.deleteClass);
    const plans = collection('plans', async (i) => { for (const p of i) await repo.savePlan(p); }, repo.deletePlan);
    const recurring = collection('recurringExpenses', async (i) => { for (const r of i) await repo.saveRecurringExpense(r); }, repo.deleteRecurringExpense);
    const payroll = collection('payrollRuns', repo.savePayrollRuns, repo.deletePayrollRun);
    const scheduled = collection('scheduledClasses', repo.saveScheduledClasses, repo.deleteScheduledClass);

    return {
      saveMember: (m) => members.save([m]),
      deleteMember: members.remove,
      saveTransaction: (t) => transactions.save([t]),
      saveTransactions: transactions.save,
      deleteTransaction: transactions.remove,
      saveEmployee: async (e) => {
        const ok = await employees.save([e]);
        reload('staff');
        return ok;
      },
      deleteEmployee: async (id) => {
        const ok = await employees.remove(id);
        reload('staff');
        return ok;
      },
      saveClass: (c) => classes.save([c]),
      deleteClass: classes.remove,
      replaceShifts: (s) => {
        setData((prev) => ({ ...prev, shifts: s }));
        return run(['shifts'], () => repo.replaceShifts(s));
      },
      savePlan: (p) => plans.save([p]),
      deletePlan: plans.remove,
      saveRecurringExpense: (e) => recurring.save([e]),
      deleteRecurringExpense: recurring.remove,
      savePayrollRuns: payroll.save,
      deletePayrollRun: payroll.remove,
      saveScheduledClasses: scheduled.save,
      deleteScheduledClass: scheduled.remove,
      saveSettings: (s) => {
        setSettings(s);
        return run(['settings'], () => repo.saveFinanceSettings(s));
      },
    };
  }, [reload]);

  const errorMessages = Object.values(errors);
  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      settings,
      loading,
      error: errorMessages.length ? [...new Set(errorMessages)].join(' • ') : null,
      reloadAll,
      actions,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, settings, loading, errors, reloadAll, actions]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return ctx;
}
