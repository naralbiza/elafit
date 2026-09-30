import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Landmark, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { currentMonthKey, monthLabel, shiftMonth } from '../utils/finance';
import { SummaryTab } from './finance/SummaryTab';
import { TransactionsTab } from './finance/TransactionsTab';
import { CollectionsTab } from './finance/CollectionsTab';
import { ExpensesTab } from './finance/ExpensesTab';
import { PayrollTab } from './finance/PayrollTab';
import { TaxesTab } from './finance/TaxesTab';
import { AccountsTab } from './finance/AccountsTab';
import { SettingsTab } from './finance/SettingsTab';
import { primaryBtn, secondaryBtn } from './finance/ui';
import { PlansModule } from './PlansModule';

interface FinancialModuleProps {
  onOpenAddTransaction: (initial?: Partial<Transaction>) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onOpenReceipt: (transaction: Transaction) => void;
}

type FinanceTab = 'summary' | 'transactions' | 'collections' | 'expenses' | 'payroll' | 'taxes' | 'accounts' | 'plans' | 'settings';

const tabs: { id: FinanceTab; label: string }[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'transactions', label: 'Lançamentos' },
  { id: 'collections', label: 'Cobranças' },
  { id: 'expenses', label: 'Despesas' },
  { id: 'payroll', label: 'Salários' },
  { id: 'taxes', label: 'Impostos' },
  { id: 'accounts', label: 'Contas & Serviços' },
  { id: 'plans', label: 'Planos & Pacotes' },
  { id: 'settings', label: 'Configurações' },
];

export const FinancialModule: React.FC<FinancialModuleProps> = ({ onOpenAddTransaction, onEditTransaction, onOpenReceipt }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('summary');
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  return (
    <div className="space-y-6">
      <div className="surface-panel p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <span className="text-[10px] font-bold text-[#8C6353] tracking-[0.16em] uppercase">Financeiro · Kwanza (Kz)</span>
          <h2 className="font-serif text-3xl font-bold text-[#2C3228] mt-1">Clareza para decidir melhor.</h2>
          <p className="text-xs text-[#7A7067] mt-1">Fluxo de caixa, cobranças, impostos e desempenho do negócio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#D8D0C7] bg-[#FCFBF8]">
            <button className="p-2 hover:bg-[#F4ECE6] rounded-l-lg" onClick={() => setMonthKey((m) => shiftMonth(m, -1))} title="Mês anterior"><ChevronLeft className="w-4 h-4" /></button>
            <span className="min-w-40 text-center text-xs font-bold text-[#2C3228]">{monthLabel(monthKey)}</span>
            <button className="p-2 hover:bg-[#F4ECE6] rounded-r-lg" onClick={() => setMonthKey((m) => shiftMonth(m, 1))} title="Mês seguinte"><ChevronRight className="w-4 h-4" /></button>
          </div>
          {monthKey !== currentMonthKey() && <button className={secondaryBtn} onClick={() => setMonthKey(currentMonthKey())}>Mês atual</button>}
          <button className={primaryBtn} onClick={() => onOpenAddTransaction()}><Plus className="w-4 h-4 text-[#D0A68D]" /> Registar lançamento</button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#DCD6CE] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-3 border-b-2 -mb-px text-xs font-semibold whitespace-nowrap ${activeTab === tab.id ? 'border-[#8C6353] text-[#2C3228]' : 'border-transparent text-[#7A7067] hover:text-[#2C3228]'}`}>
            {tab.id === 'taxes' && <Landmark className="w-3.5 h-3.5 inline mr-1" />}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && <SummaryTab monthKey={monthKey} />}
      {activeTab === 'transactions' && <TransactionsTab monthKey={monthKey} onEdit={onEditTransaction} onOpenReceipt={onOpenReceipt} />}
      {activeTab === 'collections' && <CollectionsTab />}
      {activeTab === 'expenses' && <ExpensesTab monthKey={monthKey} />}
      {activeTab === 'payroll' && <PayrollTab monthKey={monthKey} />}
      {activeTab === 'taxes' && <TaxesTab monthKey={monthKey} onRegisterPayment={onOpenAddTransaction} />}
      {activeTab === 'accounts' && <AccountsTab monthKey={monthKey} />}
      {activeTab === 'plans' && <PlansModule />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
};
