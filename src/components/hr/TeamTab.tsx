import React, { useState } from 'react';
import { Search, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Employee } from '../../types';
import { useData } from '../../data/DataContext';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { STATUS_BADGE, initials } from './hrShared';

export const EmployeeAvatar: React.FC<{ employee: Employee; size?: string }> = ({ employee, size = 'w-12 h-12' }) =>
  employee.avatarUrl ? (
    <img src={employee.avatarUrl} alt={employee.name} className={`${size} rounded-full object-cover border-2 border-[#D0A68D] shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-[#F4ECE6] border-2 border-[#D0A68D] flex items-center justify-center font-serif font-bold text-[#2C3228] shrink-0`}>
      {initials(employee.name)}
    </div>
  );

interface TeamTabProps {
  onEdit: (employee: Employee) => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({ onEdit }) => {
  const { employees, actions } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const q = searchTerm.trim().toLowerCase();
  const filtered = employees
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Apagar a colaboradora "${emp.name}"? Os salários já processados mantêm-se no histórico.`)) return;
    await actions.deleteEmployee(emp.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FBF9F6] p-3 rounded-xl border border-[#ECE5DE]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A0958C]" />
          <input
            type="text"
            placeholder="Pesquisar colaboradora ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
          />
        </div>
        <span className="text-xs text-[#7A7067] font-semibold">Total: {employees.length} profissionais</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-[#ECE5DE] text-center text-xs text-[#7A7067]">
          {employees.length === 0 ? 'Ainda não há colaboradoras registadas.' : 'Nenhuma colaboradora corresponde à pesquisa.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col justify-between hover:border-[#D0A68D] transition-all"
            >
              <div>
                <div className="flex items-start gap-3">
                  <EmployeeAvatar employee={emp} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-base font-bold text-[#2C3228] truncate">{emp.name}</h4>
                    <p className="text-xs font-semibold text-[#D0A68D]">{emp.role}</p>
                    <span className="text-[10px] text-[#7A7067]">{emp.contractType} • {emp.weeklyHours}h/semana</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-1.5 rounded-lg text-[#7A7067] hover:bg-[#F4ECE6] hover:text-[#2C3228]"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      className="p-1.5 rounded-lg text-[#7A7067] hover:bg-[#FDECEC] hover:text-[#9F1D1D]"
                      title="Apagar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(emp.email || emp.phone) && (
                  <div className="mt-3 space-y-0.5 text-[11px] text-[#61574E]">
                    {emp.email && (
                      <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-[#A0958C]" />{emp.email}</p>
                    )}
                    {emp.phone && (
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#A0958C]" />{emp.phone}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-2 pt-3 border-t border-[#F0EAE4] text-xs">
                  <div className="flex justify-between text-[#61574E]">
                    <span>Salário base:</span>
                    <span className="font-bold text-[#2C3228]">{formatKz(emp.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between text-[#61574E]">
                    <span>Bónus aula / PT:</span>
                    <span className="font-bold text-[#3A6B4C]">{formatKz(emp.ptBonusRate)} /sessão</span>
                  </div>
                  {emp.allowances > 0 && (
                    <div className="flex justify-between text-[#61574E]">
                      <span>Subsídios fixos:</span>
                      <span className="font-bold text-[#2C3228]">{formatKz(emp.allowances)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#61574E]">
                    <span>NIF / Nº INSS:</span>
                    <span className="font-semibold text-[#2C3228]">{emp.nif || '—'} / {emp.inssNumber || '—'}</span>
                  </div>
                </div>

                {emp.certifications.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {emp.certifications.map((cert) => (
                      <span key={cert} className="text-[9px] bg-[#F4ECE6] text-[#2C3228] px-2 py-0.5 rounded-full font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0EAE4] flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[emp.status] ?? 'bg-[#F4ECE6] text-[#2C3228]'}`}>
                  {emp.status}
                </span>
                <span className="text-[10px] text-[#8C827A]">Início: {emp.hireDate ? formatDatePt(emp.hireDate) : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
