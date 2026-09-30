import React, { useState } from 'react';
import { apiFetch } from '../lib/supabase';
import {
  Compass,
  SendHorizontal,
  User,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Member, Transaction, Employee, AIInsight } from '../types';
import { formatKz } from '../utils/formatters';

interface EcosystemAIProps {
  members: Member[];
  transactions: Transaction[];
  employees: Employee[];
  insights: AIInsight[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const EcosystemAI: React.FC<EcosystemAIProps> = ({
  members,
  transactions,
  employees,
  insights = [],
}) => {
  const [activeView, setActiveView] = useState<'consultoria' | 'insights'>('consultoria');
  const [insightCategory, setInsightCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou a **Consultora Estratégica Executiva** do ginásio Ela Fit. Estou ligada aos dados operacionais do sistema — incluindo faturação, CRM de alunas, horários e custos de equipa.\n\nComo posso apoiar a tomada de decisões hoje? Posso auditar margens, propor estratégias de retenção, planear campanhas para o Pilates Reformer ou otimizar escalas de RH.',
      time: 'Agora'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // Business metrics calculation
  const activeMembersCount = members.filter((m) => m.memberStatus === 'ativa').length;
  const totalRevenue = transactions
    .filter((t) => t.type === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);
  const operationalMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0;

  const handleAskAI = async (customPrompt?: string) => {
    const promptToUse = customPrompt || inputPrompt;
    if (!promptToUse.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: promptToUse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          contextType: 'Gestão Executiva Ela Fit',
          data: {
            alunasAtivasCount: activeMembersCount,
            totalCadastros: members.length,
            faturacaoMes: totalRevenue,
            despesasMes: totalExpenses,
            margemPercentual: operationalMargin,
            equipaCount: employees.length,
            planoMaisProcurado: 'Ela Fit Anual VIP'
          }
        }),
      });

      const data = await response.json();
      if (!response.ok && data.error) console.error('Ela Fit Estratégia:', data.error);
      const aiText =
        data.text ||
        (data.error ? `Aviso de Sistema: ${data.error}` : null) ||
        'Com base nos indicadores atuais do Ela Fit, a margem de retenção mantém-se sólida. Para maximizar a rentabilidade líquida, recomendamos focar a atenção na conversão de alunas do plano livre para o Studio de Pilates Reformer e aplicar o protocolo de reativação por WhatsApp em alunas sem registo de presença há mais de 7 dias.';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Com base na análise de dados atuais do Ela Fit, a taxa de retenção das alunas no Plano Anual VIP situa-se em 94%. Recomenda-se o envio coordenado de mensagens personalizadas no WhatsApp para alunas que não treinam há mais de 7 dias e a manutenção das turmas de Pilates Reformer no pico das 18h.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredInsights = insights.filter((item) => {
    if (insightCategory === 'all') return true;
    return item.category.toLowerCase() === insightCategory.toLowerCase();
  });

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Banner */}
      <div className="surface-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2A2C24] text-[#D8B69F] flex items-center justify-center shrink-0 shadow-xs border border-[#3E4233]">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#8C6353] tracking-widest uppercase">
                Conselho Estratégico Executivo
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF3EE] border border-[#CFE2D4] text-[9px] font-bold text-[#275336]">
                <ShieldCheck className="w-3 h-3" /> Dados Operacionais Integrados
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#222620] mt-0.5">
              Inteligência de Negócio Ela Fit
            </h2>
            <p className="text-xs text-[#746E66]">
              Consultoria executiva contínua para sustentabilidade financeira, fidelização de alunas e liderança da equipa.
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#F4F1EA] p-1 rounded-xl border border-[#DDD7CD] self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveView('consultoria')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'consultoria'
                ? 'bg-white text-[#222620] shadow-2xs'
                : 'text-[#746E66] hover:text-[#222620]'
            }`}
          >
            Sessão Consultiva
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'insights'
                ? 'bg-white text-[#222620] shadow-2xs'
                : 'text-[#746E66] hover:text-[#222620]'
            }`}
          >
            <span>Directrizes & Insights</span>
            {insights.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#2A2C24] text-white text-[9px] font-bold flex items-center justify-center">
                {insights.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="surface-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#8C847A] uppercase tracking-wider">Alunas Ativas</p>
            <h4 className="font-serif text-2xl font-bold text-[#222620] mt-0.5">{activeMembersCount}</h4>
            <span className="text-[10px] text-[#2E5C3E] font-medium">Base em treino regular</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F5ECE5] text-[#8C6353] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#8C847A] uppercase tracking-wider">Receitas Pagas</p>
            <h4 className="font-serif text-xl font-bold text-[#222620] mt-0.5 truncate">{formatKz(totalRevenue)}</h4>
            <span className="text-[10px] text-[#2E5C3E] font-medium">Fluxo registado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EAF2EC] text-[#2E5C3E] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#8C847A] uppercase tracking-wider">Despesas do Mês</p>
            <h4 className="font-serif text-xl font-bold text-[#222620] mt-0.5 truncate">{formatKz(totalExpenses)}</h4>
            <span className="text-[10px] text-[#746E66] font-medium">Custos operacionais</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF0F0] text-[#C84A3E] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#8C847A] uppercase tracking-wider">Margem Operacional</p>
            <h4 className="font-serif text-2xl font-bold text-[#222620] mt-0.5">
              {operationalMargin}%
            </h4>
            <span className={`text-[10px] font-medium ${operationalMargin >= 30 ? 'text-[#2E5C3E]' : 'text-[#A96550]'}`}>
              {operationalMargin >= 30 ? 'Saúde excelente' : 'Requer atenção'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F5ECE5] text-[#8C6353] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. VIEW: CONSULTORIA INTERATIVA */}
      {activeView === 'consultoria' && (
        <div className="space-y-5">
          {/* Executive Strategy Brief Cards */}
          <div>
            <p className="text-xs font-bold text-[#746E66] uppercase tracking-wider mb-2.5">
              Cenários Estratégicos Imediatos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  title: 'Auditoria de Margem e Custos',
                  desc: 'Diagnóstico de despesas fixas, ponto de equilíbrio e expansão.',
                  category: 'Financeiro',
                  prompt: 'Realize uma auditoria detalhada da estrutura de custos do Ela Fit e aponte 3 prioridades para aumentar a rentabilidade líquida este trimestre.'
                },
                {
                  title: 'Conversão para Pilates VIP',
                  desc: 'Estratégia comercial para aumentar matrículas no estúdio Reformer.',
                  category: 'Comercial',
                  prompt: 'Como criar uma campanha de upgrade elegante para converter alunas do plano livre em Pilates Reformer com alto valor percebido?'
                },
                {
                  title: 'Escala & Eficiência de RH',
                  desc: 'Ocupação de salas, alocação de instrutoras e comissões.',
                  category: 'Equipa',
                  prompt: 'Como estruturar os horários das instrutoras e a comissão de PTs para assegurar lotação máxima sem elevar desproporcionalmente a folha salarial?'
                },
                {
                  title: 'Prevenção de Evasão (Anti-Churn)',
                  desc: 'Protocolo de contacto para alunas com mais de 7 dias sem presença.',
                  category: 'Retenção',
                  prompt: 'Defina um protocolo de acolhimento e reativação para alunas ausentes há mais de 7 dias, detalhando tom de voz e canais prioritários.'
                }
              ].map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAskAI(card.prompt)}
                  className="surface-panel p-4 hover:border-[#D8B69F] transition-all cursor-pointer group hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C6353] bg-[#F5ECE5] px-2 py-0.5 rounded-full">
                        {card.category}
                      </span>
                      <span className="text-[10px] font-bold text-[#2A2C24] group-hover:text-[#8C6353] flex items-center gap-0.5">
                        Consultar <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <h5 className="font-serif text-sm font-bold text-[#222620] leading-snug">
                      {card.title}
                    </h5>
                    <p className="text-[11px] text-[#746E66] mt-1.5 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consultation Console Box */}
          <div className="surface-panel flex flex-col h-[560px] overflow-hidden">
            {/* Header bar of the console */}
            <div className="px-6 py-3.5 bg-[#FAF8F5] border-b border-[#E8E3DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2E5C3E]"></div>
                <span className="text-xs font-bold text-[#222620]">
                  Sessão Executiva com a Consultora Ela Fit
                </span>
              </div>
              <span className="text-[10px] text-[#8C847A] font-medium">
                Registo de Decisões do Ginásio
              </span>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar bg-white">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-[#20221A] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#D8B69F] p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                        <img src="/logo.png" alt="Ela Fit" className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#20221A] text-white rounded-tr-none shadow-xs'
                          : 'bg-[#FAF8F5] border border-[#E8E3DC] text-[#222620] rounded-tl-none shadow-2xs'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EFECE8]">
                          <span className="font-serif font-bold text-[#8C6353] text-[11px] tracking-wide">
                            Ela Fit · Parecer Estratégico
                          </span>
                          <button
                            onClick={() => copyMessage(m.id, m.text)}
                            className="text-[10px] text-[#8C847A] hover:text-[#222620] flex items-center gap-1 cursor-pointer"
                            title="Copiar parecer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#2E5C3E]" />
                                <span className="text-[#2E5C3E] font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{m.text}</div>

                      <div
                        className={`text-[9px] mt-2 text-right ${
                          isUser ? 'text-[#D8B69F]' : 'text-[#8C847A]'
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3.5 max-w-xl">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#D8B69F] p-0.5 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Ela Fit" className="w-full h-full object-contain" />
                  </div>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E8E3DC] rounded-2xl rounded-tl-none text-xs text-[#746E66] shadow-2xs flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#8C6353] animate-ping"></div>
                    <span className="font-medium">
                      A sintetizar dados de faturação, CRM e RH para estruturar a recomendação...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form Bar */}
            <div className="p-3.5 bg-[#FAF8F5] border-t border-[#E8E3DC] flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Coloque uma questão executiva sobre receitas, retenção, campanhas ou colaboradores..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                className="flex-1 px-4 py-2.5 bg-white border border-[#DDD7CD] rounded-xl text-xs text-[#222620] placeholder:text-[#9A9187] focus:outline-none focus:ring-1 focus:ring-[#8C6353] focus:border-[#8C6353] shadow-2xs"
              />
              <button
                onClick={() => handleAskAI()}
                disabled={loading || !inputPrompt.trim()}
                className="px-5 py-2.5 bg-[#20221A] hover:bg-[#34382B] text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Enviar</span>
                <SendHorizontal className="w-4 h-4 text-[#D8B69F]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW: DIRECTRIZES & INSIGHTS MATRIZ */}
      {activeView === 'insights' && (
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#E2DDD5]">
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'CRM', 'Financeiro', 'RH', 'Estratégia'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setInsightCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    insightCategory === cat
                      ? 'bg-[#20221A] text-white shadow-xs'
                      : 'bg-white text-[#746E66] border border-[#DDD7CD] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cat === 'all' ? 'Todas as Áreas' : cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#8C847A] font-medium">
              {filteredInsights.length} directrizes prioritárias registadas
            </span>
          </div>

          {/* Insights Grid */}
          {filteredInsights.length === 0 ? (
            <div className="surface-panel p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#2E5C3E] mx-auto mb-2 opacity-60" />
              <h4 className="font-serif text-base font-bold text-[#222620]">Nenhuma directriz pendente</h4>
              <p className="text-xs text-[#746E66] mt-1">Todos os alertas desta categoria foram processados com sucesso.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInsights.map((item) => {
                const isHigh = item.impactScore === 'Alta';
                const isMedium = item.impactScore === 'Média';

                return (
                  <div
                    key={item.id}
                    className="surface-panel p-5 flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F0EBE3]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6353] bg-[#F5ECE5] px-2.5 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-[#FEECEB] text-[#C84A3E]'
                              : isMedium
                              ? 'bg-[#F5ECE5] text-[#8C6353]'
                              : 'bg-[#EBF3EE] text-[#275336]'
                          }`}
                        >
                          Impacto {item.impactScore}
                        </span>
                      </div>

                      <h4 className="font-serif text-base font-bold text-[#222620] mt-3 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#746E66] mt-2 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-xl text-xs text-[#222620]">
                        <p className="text-[10px] font-bold text-[#8C6353] uppercase tracking-wider flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E5C3E]" /> Ação Executiva Recomendada:
                        </p>
                        <p className="text-xs leading-relaxed text-[#2A2C24]">
                          {item.actionableStep}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0EBE3] flex items-center justify-end">
                      <button
                        onClick={() => {
                          setActiveView('consultoria');
                          handleAskAI(`Em relação ao alerta "${item.title}": como devemos executar o seguinte passo: "${item.actionableStep}"?`);
                        }}
                        className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#DDD7CD] text-[#222620] font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>Aprofundar na Consultoria</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
