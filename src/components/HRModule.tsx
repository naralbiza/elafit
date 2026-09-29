import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Employee, PayrollRun } from '../types';
import { useData } from '../data/DataContext';
import { AddEmployeeModal } from './modals/AddEmployeeModal';
import { PayrollModal } from './modals/PayrollModal';
import { TeamTab } from './hr/TeamTab';
import { ScheduleTab } from './hr/ScheduleTab';
import { PayrollTab } from './hr/PayrollTab';
import { TrainingTab } from './hr/TrainingTab';

type SubTab = 'team' | 'schedule' | 'payroll' | 'training';

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'team', label: 'Equipa & Perfis' },
  { id: 'schedule', label: 'Escala Semanal' },
  { id: 'payroll', label: 'Salários & Impostos' },
  { id: 'training', label: 'Certificações & Formação' },
];

export const HRModule: React.FC = () => {
  const { payrollRuns } = useData();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('team');
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [payslipRunId, setPayslipRunId] = useState<string | null>(null);

  // O recibo segue a versão mais recente do processamento (tempo real)
  const payslipRun = payslipRunId ? payrollRuns.find((r) => r.id === payslipRunId) ?? null : null;

  const openNew = () => {
    setEditingEmployee(null);
    setEmployeeModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">Recursos Humanos</span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Gestão da Equipa Ela Fit</h2>
          <p className="text-xs text-[#7A7067]">
            Perfis da equipa, escalas de turnos, processamento salarial com INSS e IRT em Kwanza, e certificações.
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2.5 bg-[#2C3228] text-[#FFFFFF] hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D0A68D]" />
          <span>Registar Colaboradora</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-2 overflow-x-auto no-scrollbar">
        {SUBTABS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === sub.id
                ? 'bg-[#2C3228] text-[#FFFFFF] shadow-xs'
                : 'text-[#61574E] hover:bg-[#F4ECE6] hover:text-[#2C3228]'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'team' && <TeamTab onEdit={openEdit} />}
      {activeSubTab === 'schedule' && <ScheduleTab />}
      {activeSubTab === 'payroll' && <PayrollTab onOpenPayslip={(run: PayrollRun) => setPayslipRunId(run.id)} />}
      {activeSubTab === 'training' && <TrainingTab />}

      <AddEmployeeModal isOpen={employeeModalOpen} onClose={() => setEmployeeModalOpen(false)} employee={editingEmployee} />
      <PayrollModal run={payslipRun} onClose={() => setPayslipRunId(null)} />
    </div>
  );
};
