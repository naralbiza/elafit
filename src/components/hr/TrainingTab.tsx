import React, { useMemo, useState } from 'react';
import { Award, Plus, X } from 'lucide-react';
import { Employee } from '../../types';
import { useData } from '../../data/DataContext';
import { cardCls, splitList } from './hrShared';
import { EmployeeAvatar } from './TeamTab';

const EmployeeCerts: React.FC<{ employee: Employee }> = ({ employee }) => {
  const { actions } = useData();
  const [value, setValue] = useState('');

  const save = (certifications: string[]) => actions.saveEmployee({ ...employee, certifications });

  const add = async () => {
    const items = splitList(value).filter((c) => !employee.certifications.includes(c));
    if (!items.length) {
      setValue('');
      return;
    }
    const ok = await save([...employee.certifications, ...items]);
    if (ok) setValue('');
  };

  const remove = (cert: string) => {
    if (!window.confirm(`Remover a certificação "${cert}" de ${employee.name}?`)) return;
    save(employee.certifications.filter((c) => c !== cert));
  };

  return (
    <div className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <EmployeeAvatar employee={employee} size="w-9 h-9" />
        <div className="min-w-0">
          <h4 className="font-serif text-sm font-bold text-[#2C3228] truncate">{employee.name}</h4>
          <p className="text-[10px] text-[#7A7067]">
            {employee.role} • {employee.certifications.length} certificação(ões)
          </p>
        </div>
      </div>

      {employee.certifications.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {employee.certifications.map((c) => (
            <span key={c} className="text-[10px] bg-white border border-[#E2DAD1] text-[#2C3228] pl-2.5 pr-1 py-0.5 rounded-full font-medium flex items-center gap-1">
              {c}
              <button onClick={() => remove(c)} className="p-0.5 text-[#8C827A] hover:text-[#9F1D1D]" aria-label={`Remover ${c}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#A0958C] italic">Sem certificações registadas.</p>
      )}

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nova certificação..."
          className="flex-1 px-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:border-[#D0A68D]"
        />
        <button
          onClick={add}
          disabled={!value.trim()}
          className="px-3 py-1.5 bg-[#2C3228] text-white rounded-xl text-xs font-semibold hover:bg-[#3E4639] flex items-center gap-1 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5 text-[#D0A68D]" />
          <span>Adicionar</span>
        </button>
      </div>
    </div>
  );
};

export const TrainingTab: React.FC = () => {
  const { employees } = useData();

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of employees) for (const c of e.certifications) counts.set(c, (counts.get(c) ?? 0) + 1);
    const ranking = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt'));
    return {
      total: employees.reduce((s, e) => s + e.certifications.length, 0),
      distinct: counts.size,
      withCerts: employees.filter((e) => e.certifications.length > 0).length,
      ranking,
    };
  }, [employees]);

  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  return (
    <div className={`${cardCls} space-y-5`}>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2C3228] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#D0A68D]" />
          Certificações & Formação da Equipa
        </h3>
        <p className="text-xs text-[#7A7067]">Registo das certificações e formações de cada colaboradora.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Certificações registadas', value: summary.total },
          { label: 'Tipos de certificação', value: summary.distinct },
          { label: 'Colaboradoras certificadas', value: `${summary.withCerts} / ${employees.length}` },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl border border-[#ECE5DE] bg-[#FBF9F6]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C827A]">{k.label}</p>
            <p className="font-serif text-xl font-bold text-[#2C3228] mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      {summary.ranking.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#D0A68D] mb-2">Certificações na equipa</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.ranking.map(([cert, n]) => (
              <span key={cert} className="text-[10px] bg-[#F4ECE6] text-[#2C3228] px-2.5 py-0.5 rounded-full font-medium">
                {cert} <strong className="text-[#D0A68D]">× {n}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <p className="text-xs text-[#7A7067]">Ainda não há colaboradoras registadas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((emp) => (
            <EmployeeCerts key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
};
