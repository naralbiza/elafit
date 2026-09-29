import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ShiftSchedule, WEEK_DAYS, WeekDay } from '../../types';
import { useData } from '../../data/DataContext';
import { newId } from '../../data/repository';
import { SHIFT_AREAS, SHIFT_TYPES, cardCls, inputCls, labelCls, primaryBtn } from './hrShared';

export const ScheduleTab: React.FC = () => {
  const { employees, shifts, actions } = useData();
  const [employeeId, setEmployeeId] = useState('');
  const [day, setDay] = useState<WeekDay>('Segunda');
  const [shiftType, setShiftType] = useState<ShiftSchedule['shiftType']>(SHIFT_TYPES[0]);
  const [area, setArea] = useState<ShiftSchedule['assignedArea']>(SHIFT_AREAS[0]);
  const [saving, setSaving] = useState(false);

  const selectedId = employeeId || employees[0]?.id || '';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedId);
    if (!emp) return;
    const duplicate = shifts.some(
      (s) => s.employeeId === emp.id && s.day === day && s.shiftType === shiftType && s.assignedArea === area
    );
    if (duplicate) {
      window.alert('Este turno já está atribuído a esta colaboradora.');
      return;
    }
    const shift: ShiftSchedule = { id: newId('S'), employeeId: emp.id, employeeName: emp.name, day, shiftType, assignedArea: area };
    setSaving(true);
    await actions.replaceShifts([...shifts, shift]);
    setSaving(false);
  };

  const handleRemove = (id: string) => actions.replaceShifts(shifts.filter((s) => s.id !== id));

  const shiftColor = (t: ShiftSchedule['shiftType']) =>
    t === 'Folga' ? 'text-[#A0958C]' : t === 'Aulas Especiais' ? 'text-[#3A6B4C]' : 'text-[#D0A68D]';

  return (
    <div className={`${cardCls} space-y-5`}>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2C3228]">Escala Semanal da Receção & Salas de Treino</h3>
        <p className="text-xs text-[#7A7067]">Planeamento de turnos que se repete todas as semanas.</p>
      </div>

      {employees.length === 0 ? (
        <p className="text-xs text-[#7A7067] bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl p-4">
          Registe primeiro colaboradoras para atribuir turnos.
        </p>
      ) : (
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end bg-[#FBF9F6] p-4 rounded-xl border border-[#ECE5DE] text-xs">
          <div>
            <label className={labelCls}>Colaboradora</label>
            <select value={selectedId} onChange={(e) => setEmployeeId(e.target.value)} className={`${inputCls} bg-white`}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Dia</label>
            <select value={day} onChange={(e) => setDay(e.target.value as WeekDay)} className={`${inputCls} bg-white`}>
              {WEEK_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Turno</label>
            <select value={shiftType} onChange={(e) => setShiftType(e.target.value as ShiftSchedule['shiftType'])} className={`${inputCls} bg-white`}>
              {SHIFT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Área</label>
            <select value={area} onChange={(e) => setArea(e.target.value as ShiftSchedule['assignedArea'])} className={`${inputCls} bg-white`}>
              {SHIFT_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving} className={`${primaryBtn} justify-center`}>
            <Plus className="w-4 h-4 text-[#D0A68D]" />
            <span>Adicionar turno</span>
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {WEEK_DAYS.map((d) => {
          const dayShifts = shifts
            .filter((s) => s.day === d)
            .sort((a, b) => SHIFT_TYPES.indexOf(a.shiftType) - SHIFT_TYPES.indexOf(b.shiftType));
          return (
            <div key={d} className="bg-[#FBF9F6] p-3 rounded-xl border border-[#ECE5DE] min-h-[220px]">
              <h4 className="text-xs font-bold text-[#2C3228] pb-2 border-b border-[#E8E2DC] text-center uppercase tracking-wider">
                {d}
              </h4>
              <div className="mt-3 space-y-2">
                {dayShifts.map((shift) => (
                  <div key={shift.id} className="relative p-2 pr-6 bg-white border border-[#E2DAD1] rounded-lg text-[11px] shadow-2xs group">
                    <button
                      onClick={() => handleRemove(shift.id)}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded text-[#A0958C] hover:text-[#9F1D1D] hover:bg-[#FDECEC]"
                      title="Remover turno"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="font-bold text-[#2C3228]">{shift.employeeName}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${shiftColor(shift.shiftType)}`}>{shift.shiftType}</p>
                    {shift.shiftType !== 'Folga' && <p className="text-[9px] text-[#8C827A]">{shift.assignedArea}</p>}
                  </div>
                ))}
                {dayShifts.length === 0 && (
                  <p className="text-[10px] text-[#A0958C] text-center italic py-4">Sem escala atribuída</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
