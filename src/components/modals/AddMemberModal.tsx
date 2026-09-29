import React, { useState } from 'react';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { Member, PlanType, LeadStatus } from '../../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Member) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [plan, setPlan] = useState<PlanType>('Ela Fit Livre');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('novo_lead');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    let fee = 35000;
    if (plan === 'Ela Fit Anual VIP') fee = 45000;
    if (plan === 'Ela Fit Pilates Reformer') fee = 65000;
    if (plan === 'Pacote 10 PT') fee = 180000;

    const newMember: Member = {
      id: `M-${Date.now()}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@email.pt`,
      phone,
      nif,
      birthDate: '1995-05-10',
      leadStatus,
      memberStatus: leadStatus === 'matriculada' ? 'ativa' : 'inativa',
      plan,
      monthlyFee: fee,
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attendanceCountThisMonth: 0,
      emergencyContact: { name: '', phone: '', relation: '' },
      evaluations: [],
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2DAD1] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <UserPlus className="w-5 h-5 text-[#D0A68D]" />
          <h3 className="font-serif text-xl font-bold text-[#2C3228]">Matricular / Inscrever Aluna</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#2C3228] block mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Ana Rita Sousa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Telemóvel *</label>
              <input
                type="text"
                required
                placeholder="+244 923 456 789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              />
            </div>
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Email</label>
              <input
                type="email"
                placeholder="ana.rita@email.co.ao"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Plano Escolhido</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="Ela Fit Livre">Ela Fit Livre (35.000 Kz)</option>
                <option value="Ela Fit Anual VIP">Ela Fit Anual VIP (45.000 Kz)</option>
                <option value="Ela Fit Pilates Reformer">Ela Fit Pilates Reformer (65.000 Kz)</option>
                <option value="Pacote 10 PT">Pacote 10 PT (180.000 Kz)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Estado no CRM</label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="novo_lead">Novo Lead</option>
                <option value="aula_experimental">Aula Experimental</option>
                <option value="proposta_enviada">Proposta Enviada</option>
                <option value="matriculada">Matriculada (Ativa)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#2C3228] block mb-1">Observações / Preferências</label>
            <textarea
              rows={2}
              placeholder="Ex: Procura treino no período da manhã, foco em fortalecimento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F4ECE6] text-[#2C3228] font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2C3228] text-white font-bold rounded-xl hover:bg-[#3E4639]"
            >
              Registar Aluna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
