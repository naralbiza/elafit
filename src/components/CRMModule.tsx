import React, { useState } from 'react';
import { apiFetch } from '../lib/supabase';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Send,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Activity,
  FileText,
  UserPlus,
  MessageSquareQuote,
  SendHorizontal,
  Copy,
  Check,
} from 'lucide-react';
import { Member, LeadStatus, MemberStatus, PlanType } from '../types';
import { formatKz } from '../utils/formatters';
import { initials } from './crm/memberShared';

interface CRMModuleProps {
  members: Member[];
  onUpdateMember: (member: Member) => void;
  onOpenAddMember: () => void;
  onSelectMember: (member: Member) => void;
}

const STAGES: { id: LeadStatus; label: string; color: string; bg: string }[] = [
  { id: 'novo_lead', label: '1. Novos Leads', color: '#2C3228', bg: '#F4ECE6' },
  { id: 'aula_experimental', label: '2. Aula Experimental', color: '#D0A68D', bg: '#FDF7F3' },
  { id: 'proposta_enviada', label: '3. Proposta Enviada', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'matriculada', label: '4. Matriculada', color: '#166534', bg: '#DCFCE7' },
  { id: 'perdida', label: '5. Não Convertida', color: '#991B1B', bg: '#FEE2E2' },
];

export const CRMModule: React.FC<CRMModuleProps> = ({
  members = [],
  onUpdateMember,
  onOpenAddMember,
  onSelectMember,
}) => {
  const safeMembers = members || [];
  const [activeSubTab, setActiveSubTab] = useState<'kanban' | 'list' | 'trials' | 'communication'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Communication Studio State
  const [draftRecipient, setDraftRecipient] = useState('');
  const [draftType, setDraftType] = useState('Boas-vindas Ela Fit');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStageChange = (member: Member, newStage: LeadStatus) => {
    const updated: Member = {
      ...member,
      leadStatus: newStage,
      memberStatus: newStage === 'matriculada' ? 'ativa' : member.memberStatus
    };
    onUpdateMember(updated);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const matchesPlan = filterPlan === 'all' || m.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || m.memberStatus === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleGenerateAIMessage = async () => {
    if (!draftRecipient) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draftType,
          recipientName: draftRecipient,
          details: { brand: 'Ela Fit - Ginásio Feminino', tagline: 'Ao Seu Ritmo' }
        }),
      });
      const data = await res.json();
      if (data.message) {
        setGeneratedMsg(data.message);
      } else {
        if (data.error) console.error('ElaFit:', data.error);
        setGeneratedMsg(`Olá ${draftRecipient}! Na Ela Fit acompanhamos a sua evolução com todo o carinho e ao seu próprio ritmo. Temos novidades especiais no estúdio preparadas para si este mês. Quando podemos agendar a sua próxima sessão?`);
      }
    } catch {
      setGeneratedMsg(`Olá ${draftRecipient}! Na Ela Fit cuidamos da sua saúde e bem-estar ao seu ritmo. Venha experimentar o nosso Studio de Pilates Reformer!`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Subtabs */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">
            Módulo CRM & Gestão de Alunas
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">
            Relacionamento, Captação & Fidelização
          </h2>
          <p className="text-xs text-[#7A7067]">
            Acompanhe o funil de inscrições, fichas de alunas, presença e automações de comunicação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddMember}
            className="px-4 py-2 bg-[#2C3228] text-[#FFFFFF] hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-[#D0A68D]" />
            <span>Adicionar Lead / Aluna</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'kanban', label: 'Funil de Vendas (Kanban)' },
          { id: 'list', label: 'Lista Geral de Alunas' },
          { id: 'trials', label: 'Aulas Experimentais' },
          { id: 'communication', label: 'Estúdio de Comunicação' },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === sub.id
                ? 'bg-[#2C3228] text-[#FFFFFF] shadow-xs'
                : 'text-[#61574E] hover:bg-[#F4ECE6] hover:text-[#2C3228]'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: KANBAN PIPELINE */}
      {activeSubTab === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {STAGES.map((stage) => {
            const stageMembers = members.filter((m) => m.leadStatus === stage.id);
            const stageLabel = stage.label.replace(/^\d+\.\s*/, '');
            return (
              <div key={stage.id} className="rounded-3xl p-3 flex flex-col max-h-[72vh] min-h-[220px]" style={{ backgroundColor: stage.bg + '99' }}>
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 pt-1 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-white/70" style={{ backgroundColor: stage.color }} />
                    <span className="text-[13px] font-bold text-[#2C3228] truncate">{stageLabel}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-[#2C3228] min-w-6 h-6 px-2 rounded-full flex items-center justify-center shadow-2xs">
                    {stageMembers.length}
                  </span>
                </div>

                {/* Member Cards in Column */}
                <div className="space-y-2.5 overflow-y-auto flex-1 px-0.5 pb-1 custom-scrollbar">
                  {stageMembers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#A0958C] border border-dashed border-[#D9D1C7] rounded-2xl bg-white/50">
                      Nenhum contacto neste estágio
                    </div>
                  ) : (
                    stageMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 bg-white border border-white rounded-2xl shadow-[0_1px_2px_rgba(40,44,36,0.04),0_6px_16px_-10px_rgba(40,44,36,0.18)] hover:shadow-[0_2px_4px_rgba(40,44,36,0.05),0_14px_28px_-12px_rgba(40,44,36,0.25)] hover:-translate-y-0.5 transition-all relative group cursor-pointer"
                        onClick={() => onSelectMember(m)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: stage.bg, color: stage.color }}>
                            {initials(m.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-bold text-[#2C3228] leading-tight truncate group-hover:text-[#8C6353] transition-colors">
                              {m.name}
                            </h4>
                            <p className="text-[11px] text-[#7A7067] mt-0.5 flex items-center gap-1 truncate">
                              <Phone className="w-3 h-3 text-[#A0958C] shrink-0" /> <span className="truncate">{m.phone}</span>
                            </p>
                          </div>
                        </div>

                        {m.plan && (
                          <span className="inline-block mt-2.5 text-[10px] bg-[#F7F2EC] text-[#6B5848] px-2.5 py-1 rounded-full font-semibold">
                            {m.plan}
                          </span>
                        )}

                        {m.notes && (
                          <p className="text-[11px] text-[#8C827A] mt-2 line-clamp-2 leading-snug">
                            {m.notes}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="mt-3 pt-2.5 border-t border-[#F1ECE6] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-[#166534] bg-[#E8F6EC] px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#D3EEDB] transition-colors shrink-0"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>

                          <select
                            value={m.leadStatus}
                            onChange={(e) => handleStageChange(m, e.target.value as LeadStatus)}
                            className="text-[10px] min-w-0 bg-[#FAF8F5] border border-[#EAE4DC] rounded-full px-2 py-1.5 text-[#2C3228] focus:outline-none focus:border-[#D0A68D]"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Mover: {s.label.replace(/^\d+\.\s*/, '')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: MEMBER LIST TABLE */}
      {activeSubTab === 'list' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 bg-[#FBF9F6] border-b border-[#ECE5DE] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A0958C]" />
              <input
                type="text"
                placeholder="Pesquisar por nome, telefone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#2C3228]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none"
              >
                <option value="all">Todos os Planos</option>
                <option value="Ela Fit Livre">Ela Fit Livre</option>
                <option value="Ela Fit Anual VIP">Ela Fit Anual VIP</option>
                <option value="Ela Fit Pilates Reformer">Ela Fit Pilates Reformer</option>
                <option value="Pacote 10 PT">Pacote 10 PT</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none"
              >
                <option value="all">Todos os Estados</option>
                <option value="ativa">Ativa</option>
                <option value="pendente_renovacao">Pendente Renovação</option>
                <option value="suspensa">Suspensa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4ECE6] text-[#2C3228] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Aluna / Contacto</th>
                  <th className="px-4 py-3">Plano & Valor</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Frequência (Este Mês)</th>
                  <th className="px-4 py-3">Instrutora Atribuída</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#FBF9F6] transition-colors cursor-pointer"
                    onClick={() => onSelectMember(member)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#2C3228] text-sm">{member.name}</div>
                      <div className="text-[11px] text-[#7A7067] flex items-center gap-2 mt-0.5">
                        <span>{member.phone}</span> • <span>{member.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-[#2C3228]">{member.plan}</span>
                      <div className="text-[11px] text-[#3A6B4C] font-bold">
                        {formatKz(member.monthlyFee)} /mês
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          member.memberStatus === 'ativa'
                            ? 'bg-[#EAF5ED] text-[#166534]'
                            : member.memberStatus === 'pendente_renovacao'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#F3F4F6] text-[#4B5563]'
                        }`}
                      >
                        {member.memberStatus === 'ativa'
                          ? 'Ativa'
                          : member.memberStatus === 'pendente_renovacao'
                          ? 'Pendente Renovação'
                          : member.memberStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#2C3228]">
                        {member.attendanceCountThisMonth} treinos
                      </div>
                      <div className="text-[10px] text-[#8C827A]">
                        Último: {member.lastAttendanceDate || 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#2C3228]">
                      {member.assignedTrainerName || 'Não atribuída'}
                    </td>

                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectMember(member)}
                        className="px-3 py-1 bg-[#2C3228] text-white rounded-lg text-[11px] font-semibold hover:bg-[#3E4639] transition-all"
                      >
                        Ficha Técnica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: EXPERIMENTAL CLASSES */}
      {activeSubTab === 'trials' && (
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2C3228]">
            Agendamentos de Aulas Experimentais
          </h3>
          <p className="text-xs text-[#7A7067]">
            Alunas inscritas para primeira aula no estúdio Ela Fit. Acompanhe a receção no estúdio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {members
              .filter((m) => m.leadStatus === 'aula_experimental' || m.leadStatus === 'novo_lead')
              .map((trialMember) => (
                <div key={trialMember.id} className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D0A68D] uppercase tracking-wider">
                      Aula Experimental
                    </span>
                    <span className="text-[10px] bg-[#EAF5ED] text-[#166534] font-bold px-2 py-0.5 rounded-full">
                      Confirmado
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#2C3228] mt-2">
                    {trialMember.name}
                  </h4>
                  <p className="text-xs text-[#7A7067] mt-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#A0958C]" /> {trialMember.phone}
                  </p>

                  <div className="mt-3 p-2.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]">
                    <p className="font-semibold text-[#D0A68D]">Interesse:</p>
                    <p className="text-[11px] text-[#61574E]">{trialMember.notes || 'Pilates Reformer & Treino Funcional'}</p>
                  </div>

                  <button
                    onClick={() => handleStageChange(trialMember, 'matriculada')}
                    className="mt-3 w-full py-2 bg-[#2C3228] hover:bg-[#3E4639] text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Converter em Matrícula &rarr;
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: COMMUNICATION STUDIO */}
      {activeSubTab === 'communication' && (() => {
        const matchedMember = safeMembers.find(
          (m) => m.name.toLowerCase() === draftRecipient.trim().toLowerCase()
        );
        const waPhone = matchedMember?.phone ? matchedMember.phone.replace(/[^0-9]/g, '') : '';
        const waUrl = waPhone
          ? `https://wa.me/${waPhone}?text=${encodeURIComponent(generatedMsg)}`
          : `https://wa.me/?text=${encodeURIComponent(generatedMsg)}`;

        const copyToClipboard = () => {
          if (!generatedMsg) return;
          navigator.clipboard.writeText(generatedMsg);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E2DDD5] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0EBE3]">
                <div className="w-8 h-8 rounded-xl bg-[#F5ECE5] text-[#8C6353] flex items-center justify-center shrink-0">
                  <MessageSquareQuote className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#222620]">
                    Estúdio de Comunicação
                  </h3>
                  <p className="text-[11px] text-[#746E66]">
                    Comunicação acolhedora e elegante no tom oficial Ela Fit.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs font-bold text-[#222620] block mb-1">
                    Nome da Aluna / Lead:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="members-datalist"
                      placeholder="Ex: Sofia Henriques"
                      value={draftRecipient}
                      onChange={(e) => setDraftRecipient(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#DDD7CD] rounded-xl text-xs text-[#222620] focus:outline-none focus:ring-1 focus:ring-[#8C6353] focus:border-[#8C6353] shadow-2xs"
                    />
                    <datalist id="members-datalist">
                      {safeMembers.slice(0, 15).map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.plan})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  {matchedMember && (
                    <p className="text-[10px] text-[#2E5C3E] font-medium mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Contacto associado: {matchedMember.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-[#222620] block mb-1">
                    Objetivo da Comunicação:
                  </label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#DDD7CD] rounded-xl text-xs text-[#222620] focus:outline-none focus:ring-1 focus:ring-[#8C6353] shadow-2xs"
                  >
                    <option value="Boas-vindas Ela Fit">Boas-vindas à Aluna Matriculada</option>
                    <option value="Lembrete de Renovação">Lembrete de Renovação de Mensalidade</option>
                    <option value="Recuperação de Aluna Ausente">Recuperação de Aluna Ausente (Mais de 7 dias sem treinar)</option>
                    <option value="Agradecimento de Aula Experimental">Agradecimento pós-Aula Experimental</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateAIMessage}
                  disabled={isGenerating || !draftRecipient.trim()}
                  className="w-full py-2.5 bg-[#2A2C24] text-white font-semibold text-xs rounded-xl hover:bg-[#3B3E32] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <span>A estruturar mensagem executiva...</span>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4 text-[#D8B69F]" />
                      <span>Redigir Comunicação Personalizada</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Result Box */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2DDD5] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                  <h4 className="text-xs font-bold text-[#746E66] uppercase tracking-wider">
                    Mensagem Pronta para Envio
                  </h4>
                  {generatedMsg && (
                    <span className="text-[10px] font-semibold text-[#8C847A] bg-[#F5F2EC] px-2 py-0.5 rounded-md">
                      {generatedMsg.length} caracteres
                    </span>
                  )}
                </div>

                {generatedMsg ? (
                  <div className="mt-4 p-4.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-2xl text-xs text-[#222620] leading-relaxed shadow-2xs">
                    <p className="whitespace-pre-wrap">{generatedMsg}</p>
                  </div>
                ) : (
                  <div className="mt-6 text-center py-16 text-xs text-[#9A9187] border-2 border-dashed border-[#EDE7DF] rounded-2xl">
                    Indique o nome da aluna e clique em "Redigir Comunicação" para preparar o texto.
                  </div>
                )}
              </div>

              {generatedMsg && (
                <div className="mt-5 pt-3 border-t border-[#F0EBE3] flex items-center justify-end gap-2.5 flex-wrap">
                  <button
                    onClick={copyToClipboard}
                    className="px-3.5 py-2 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#222620] font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E5C3E]" />
                        <span className="text-[#2E5C3E]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8C847A]" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#2E5C3E] text-white font-semibold text-xs rounded-xl hover:bg-[#254A32] flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{waPhone ? 'Enviar no WhatsApp da Aluna' : 'Abrir WhatsApp'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
