import React, { useEffect, useState } from 'react';
import { X, UserCheck, Plus } from 'lucide-react';
import { ContractType, Employee, EmployeeRole } from '../../types';
import { useData } from '../../data/DataContext';
import { newId } from '../../data/repository';
import { todayISO } from '../../utils/finance';
import {
  CONTRACT_TYPES,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
  splitList,
} from '../hr/hrShared';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

interface FormState {
  name: string;
  role: EmployeeRole;
  contractType: ContractType;
  baseSalary: string;
  ptBonusRate: string;
  allowances: string;
  weeklyHours: string;
  hireDate: string;
  status: Employee['status'];
  email: string;
  phone: string;
  nif: string;
  iban: string;
  inssNumber: string;
  certifications: string[];
  avatarUrl: string;
}

const formFrom = (e?: Employee | null): FormState => ({
  name: e?.name ?? '',
  role: e?.role ?? 'Personal Trainer',
  contractType: e?.contractType ?? 'Efetivo Full-time',
  baseSalary: e ? String(e.baseSalary) : '',
  ptBonusRate: e ? String(e.ptBonusRate) : '0',
  allowances: e ? String(e.allowances ?? 0) : '0',
  weeklyHours: e ? String(e.weeklyHours) : '40',
  hireDate: e?.hireDate ?? todayISO(),
  status: e?.status ?? 'Ativa',
  email: e?.email ?? '',
  phone: e?.phone ?? '',
  nif: e?.nif ?? '',
  iban: e?.iban ?? '',
  inssNumber: e?.inssNumber ?? '',
  certifications: e?.certifications ?? [],
  avatarUrl: e?.avatarUrl ?? '',
});

const num = (s: string) => {
  const n = Number(String(s).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const { actions } = useData();
  const [form, setForm] = useState<FormState>(() => formFrom(employee));
  const [certInput, setCertInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Repor o formulário sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setForm(formFrom(employee));
      setCertInput('');
      setSaving(false);
    }
    // Só reage à abertura / mudança de colaboradora (não a atualizações em tempo real durante a edição)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee?.id]);

  if (!isOpen) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const addCerts = () => {
    const items = splitList(certInput);
    if (!items.length) return;
    setForm((f) => ({ ...f, certifications: [...new Set([...f.certifications, ...items])] }));
    setCertInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const pendingCerts = splitList(certInput);
    const certifications = [...new Set([...form.certifications, ...pendingCerts])];

    const saved: Employee = {
      id: employee?.id ?? newId('EMP'),
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      phone: form.phone.trim(),
      avatarUrl: form.avatarUrl.trim() || undefined,
      contractType: form.contractType,
      baseSalary: num(form.baseSalary),
      ptBonusRate: num(form.ptBonusRate),
      allowances: num(form.allowances),
      classesGivenThisMonth: employee?.classesGivenThisMonth ?? 0,
      ptSessionsThisMonth: employee?.ptSessionsThisMonth ?? 0,
      hireDate: form.hireDate || todayISO(),
      status: form.status,
      weeklyHours: num(form.weeklyHours),
      certifications,
      nif: form.nif.trim() || undefined,
      iban: form.iban.trim() || undefined,
      inssNumber: form.inssNumber.trim() || undefined,
    };

    setSaving(true);
    const ok = await actions.saveEmployee(saved);
    setSaving(false);
    if (ok) onClose();
  };

  const isEdit = Boolean(employee);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl border border-[#E2DAD1] relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <UserCheck className="w-5 h-5 text-[#D0A68D]" />
          <h3 className="font-serif text-xl font-bold text-[#2C3228]">
            {isEdit ? 'Editar Colaboradora' : 'Registar Nova Colaboradora'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Identificação */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] font-bold text-[#D0A68D] uppercase tracking-widest mb-2">Identificação</legend>
            <div>
              <label className={labelCls}>Nome completo *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Função</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value as EmployeeRole)} className={inputCls}>
                  {EMPLOYEE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as Employee['status'])} className={inputCls}>
                  {EMPLOYEE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Data de admissão</label>
                <input type="date" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+244 ..." className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>NIF</label>
                <input value={form.nif} onChange={(e) => set('nif', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nº Segurança Social (INSS)</label>
                <input value={form.inssNumber} onChange={(e) => set('inssNumber', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>IBAN</label>
                <input value={form.iban} onChange={(e) => set('iban', e.target.value)} placeholder="AO06 ..." className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Contrato e remuneração */}
          <fieldset className="space-y-3 pt-3 border-t border-[#F0EAE4]">
            <legend className="text-[10px] font-bold text-[#D0A68D] uppercase tracking-widest mb-2">Contrato & Remuneração</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo de contrato</label>
                <select value={form.contractType} onChange={(e) => set('contractType', e.target.value as ContractType)} className={inputCls}>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Horas semanais</label>
                <input type="number" min="0" step="1" value={form.weeklyHours} onChange={(e) => set('weeklyHours', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Vencimento base (Kz)</label>
                <input type="number" min="0" step="any" value={form.baseSalary} onChange={(e) => set('baseSalary', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bónus por aula / PT (Kz)</label>
                <input type="number" min="0" step="any" value={form.ptBonusRate} onChange={(e) => set('ptBonusRate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Subsídios fixos mensais (Kz)</label>
                <input type="number" min="0" step="any" value={form.allowances} onChange={(e) => set('allowances', e.target.value)} className={inputCls} />
              </div>
            </div>
            {form.contractType === 'Prestação de Serviços (Recibos Verdes)' && (
              <p className="text-[10px] text-[#7A7067]">
                Prestação de serviços: sem Segurança Social; aplica-se retenção na fonte sobre o valor bruto.
              </p>
            )}
          </fieldset>

          {/* Certificações e foto */}
          <fieldset className="space-y-3 pt-3 border-t border-[#F0EAE4]">
            <legend className="text-[10px] font-bold text-[#D0A68D] uppercase tracking-widest mb-2">Certificações & Perfil</legend>
            <div>
              <label className={labelCls}>Certificações (separe por vírgulas)</label>
              <div className="flex gap-2">
                <input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCerts();
                    }
                  }}
                  className={inputCls}
                />
                <button type="button" onClick={addCerts} className={secondaryBtn}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
              {form.certifications.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.certifications.map((c) => (
                    <span key={c} className="text-[10px] bg-[#F4ECE6] text-[#2C3228] pl-2.5 pr-1 py-0.5 rounded-full font-medium flex items-center gap-1">
                      {c}
                      <button
                        type="button"
                        onClick={() => set('certifications', form.certifications.filter((x) => x !== c))}
                        className="p-0.5 text-[#8C827A] hover:text-[#9F1D1D]"
                        aria-label={`Remover ${c}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>URL da fotografia (opcional)</label>
              <input type="url" value={form.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} placeholder="https://..." className={inputCls} />
            </div>
          </fieldset>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0EAE4]">
            <button type="button" onClick={onClose} className={secondaryBtn}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? 'A guardar...' : isEdit ? 'Guardar alterações' : 'Guardar colaboradora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
