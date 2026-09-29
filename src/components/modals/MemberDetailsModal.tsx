import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, Activity, MessageSquare, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { Member, PhysicalEvaluation } from '../../types';
import { formatKz } from '../../utils/formatters';

interface MemberDetailsModalProps {
  member: Member | null;
  onClose: () => void;
  onUpdateMember: (member: Member) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  onClose,
  onUpdateMember,
}) => {
  if (!member) return null;

  const [showEvalForm, setShowEvalForm] = useState(false);
  const [weightKg, setWeightKg] = useState(60.0);
  const [bodyFatPercent, setBodyFatPercent] = useState(22.0);
  const [muscleMassKg, setMuscleMassKg] = useState(24.0);
  const [evalNotes, setEvalNotes] = useState('');

  const handleAddEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const newEval: PhysicalEvaluation = {
      date: new Date().toISOString().split('T')[0],
      weightKg,
      bodyFatPercent,
      muscleMassKg,
      notes: evalNotes || 'Avaliação de controlo'
    };

    const currentEvals = member.evaluations || [];
    const updated: Member = {
      ...member,
      evaluations: [newEval, ...currentEvals]
    };

    onUpdateMember(updated);
    setShowEvalForm(false);
    setEvalNotes('');
  };

  const handleRenewPlan = () => {
    const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const updated: Member = {
      ...member,
      memberStatus: 'ativa',
      renewalDate: nextRenewal
    };
    onUpdateMember(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-[#E2DAD1] relative custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Member Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2DC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-2xl font-bold text-[#2C3228]">{member.name}</h3>
              <span className="text-[10px] bg-[#EAF5ED] text-[#166534] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {member.memberStatus}
              </span>
            </div>
            <p className="text-xs text-[#7A7067] mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#A0958C]" /> {member.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#A0958C]" /> {member.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#14532D]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={handleRenewPlan}
              className="px-3 py-1.5 bg-[#2C3228] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#3E4639]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D0A68D]" />
              <span>Renovar Mensalidade</span>
            </button>
          </div>
        </div>

        {/* Plan & Membership Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 bg-[#FBF9F6] p-3 rounded-xl border border-[#ECE5DE] text-xs">
          <div>
            <p className="text-[10px] text-[#8C827A] uppercase font-bold">Plano Atual</p>
            <p className="font-bold text-[#2C3228] mt-0.5">{member.plan}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8C827A] uppercase font-bold">Valor Mensal</p>
            <p className="font-bold text-[#3A6B4C] mt-0.5">{formatKz(member.monthlyFee)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8C827A] uppercase font-bold">Início do Contrato</p>
            <p className="font-bold text-[#2C3228] mt-0.5">{member.startDate || '2025-01-10'}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8C827A] uppercase font-bold">Próxima Renovação</p>
            <p className="font-bold text-[#D0A68D] mt-0.5">{member.renewalDate || '2026-10-10'}</p>
          </div>
        </div>

        {/* Emergency Contact & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="p-3 bg-[#F4ECE6] rounded-xl border border-[#E0D3C7] text-xs">
            <h4 className="font-bold text-[#2C3228] mb-1">Contacto de Emergência</h4>
            <p className="text-[#61574E]">
              {member.emergencyContact?.name || 'Não registado'} ({member.emergencyContact?.relation || 'Familiar'})
            </p>
            <p className="font-bold text-[#2C3228] mt-0.5">{member.emergencyContact?.phone || member.phone}</p>
          </div>

          <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#ECE5DE] text-xs">
            <h4 className="font-bold text-[#2C3228] mb-1">Observações da Aluna</h4>
            <p className="text-[#61574E] italic">{member.notes || 'Sem observações adicionais.'}</p>
          </div>
        </div>

        {/* Physical Evaluations Log */}
        <div className="mt-6 border-t border-[#E8E2DC] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif text-lg font-bold text-[#2C3228] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D0A68D]" />
              Ficha de Avaliação Física & Medições
            </h4>
            <button
              onClick={() => setShowEvalForm(!showEvalForm)}
              className="px-3 py-1 bg-[#D0A68D] text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#C2957A]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Medição</span>
            </button>
          </div>

          {showEvalForm && (
            <form onSubmit={handleAddEvaluation} className="p-4 bg-[#FBF9F6] border border-[#E2DAD1] rounded-2xl space-y-3 text-xs mb-4">
              <h5 className="font-bold text-[#2C3228]">Registar Nova Avaliação Física</h5>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold">Peso (Kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2DAD1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">Massa Gorda (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPercent}
                    onChange={(e) => setBodyFatPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2DAD1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">Massa Muscular (Kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={muscleMassKg}
                    onChange={(e) => setMuscleMassKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2DAD1] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold">Notas de Evolução:</label>
                <input
                  type="text"
                  placeholder="Ex: Excelente evolução na postura e resistência..."
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2DAD1] rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEvalForm(false)}
                  className="px-3 py-1 bg-[#F4ECE6] text-[#2C3228] font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#2C3228] text-white font-bold rounded-lg"
                >
                  Guardar Avaliação
                </button>
              </div>
            </form>
          )}

          {/* Evaluations List */}
          <div className="space-y-2">
            {(member.evaluations || []).length === 0 ? (
              <p className="text-xs text-[#8C827A] italic text-center py-4">Ainda sem avaliações registadas.</p>
            ) : (
              (member.evaluations || []).map((ev, i) => (
                <div key={i} className="p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#2C3228]">{ev.date}</span>
                    <p className="text-[11px] text-[#7A7067] mt-0.5">{ev.notes}</p>
                  </div>
                  <div className="flex gap-4 font-bold text-[#2C3228] text-right">
                    <div>
                      <span className="text-[9px] text-[#8C827A] block">Peso</span>
                      {ev.weightKg} kg
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8C827A] block">Gorda</span>
                      {ev.bodyFatPercent}%
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8C827A] block">Músculo</span>
                      {ev.muscleMassKg} kg
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
