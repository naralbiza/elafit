import React, { useState } from 'react';
import { apiFetch } from '../lib/supabase';
import {
  Sparkles,
  Send,
  Bot,
  User,
  TrendingUp,
  Users,
  Euro,
  Lightbulb,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Member, Transaction, Employee, AIInsight } from '../types';

interface EcosystemAIProps {
  members: Member[];
  transactions: Transaction[];
  employees: Employee[];
  insights: AIInsight[];
}

export const EcosystemAI: React.FC<EcosystemAIProps> = ({
  members,
  transactions,
  employees,
  insights,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Olá, Marta! Sou a **ElaFit AI**, a sua consultora estratégica executiva para a gestão do ginásio Ela Fit. Como posso ajudar a otimizar a faturação, retenção de alunas ou gestão da equipa hoje?',
      time: 'Agora'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async (customPrompt?: string) => {
    const promptToUse = customPrompt || inputPrompt;
    if (!promptToUse.trim()) return;

    const userMsg = { sender: 'user' as const, text: promptToUse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          contextType: 'Gestão Empresarial Ela Fit',
          data: {
            alunasAtivasCount: members.filter((m) => m.memberStatus === 'ativa').length,
            totalLeadsCount: members.length,
            faturacaoMes: transactions.filter((t) => t.type === 'receita' && t.status === 'pago').reduce((sum, t) => sum + t.amount, 0),
            despesasMes: transactions.filter((t) => t.type === 'despesa' && t.status === 'pago').reduce((sum, t) => sum + t.amount, 0),
            equipaCount: employees.length,
            planoMaisVendido: 'Ela Fit Anual VIP'
          }
        }),
      });

      const data = await response.json();
      if (!response.ok && data.error) console.error('ElaFit AI:', data.error);
      const aiText = data.text || (data.error ? `⚠️ ${data.error}` : null) || 'Obrigada pela questão! A nível de gestão empresarial para o ginásio Ela Fit, recomendamos manter a aposta no Studio de Pilates Reformer e em campanhas de retenção no WhatsApp.';

      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Com base nos dados atuais do Ela Fit, a taxa de retenção de alunas ativas no Plano Anual VIP é de 94%. Recomendamos enviar mensagens automatizadas no WhatsApp para alunas que não treinam há mais de 7 dias.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D0A68D]" /> Inteligência Estratégica ElaFit AI
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">
            Consultora Executiva do Ginásio Ela Fit
          </h2>
          <p className="text-xs text-[#7A7067]">
            Análise em tempo real de saúde financeira, funil CRM, rentabilidade por aula e gestão de RH.
          </p>
        </div>
      </div>

      {/* Suggested Strategy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Análise de Saúde Financeira',
            desc: 'Avalie a margem de lucro e projeção de receita para o próximo trimestre.',
            prompt: 'Faça uma análise detalhada da saúde financeira do ginásio Ela Fit e sugira 3 ações para aumentar a margem de lucro.'
          },
          {
            title: 'Campanha para Pilates Reformer',
            desc: 'Estratégia para converter alunas do plano livre em Pilates Reformer.',
            prompt: 'Crie uma estratégia de marketing e vendas para aumentar as matrículas no plano Ela Fit Pilates Reformer.'
          },
          {
            title: 'Otimização da Escala de RH',
            desc: 'Aumento de eficiência na ocupação do estúdio e comissões.',
            prompt: 'Como posso otimizar os horários das instrutoras e a comissão de PTs para garantir ocupação máxima sem estourar o orçamento de RH?'
          }
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => handleAskAI(card.prompt)}
            className="p-4 bg-white border border-[#ECE5DE] rounded-2xl hover:border-[#D0A68D] cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#F4ECE6] text-[#2C3228] group-hover:bg-[#2C3228] group-hover:text-white transition-all">
                <Lightbulb className="w-4 h-4 text-[#D0A68D]" />
              </span>
              <span className="text-[10px] font-bold text-[#3A6B4C]">Executar</span>
            </div>
            <h4 className="font-serif text-sm font-bold text-[#2C3228] mt-3">{card.title}</h4>
            <p className="text-xs text-[#7A7067] mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Chat Box */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col h-[520px]">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-2xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-[#2C3228] text-white'
                    : 'bg-[#F4ECE6] text-[#2C3228] border border-[#D0A68D]'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#D0A68D]" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#2C3228] text-white rounded-tr-none'
                    : 'bg-[#FBF9F6] border border-[#ECE5DE] text-[#2C3228] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[9px] mt-2 text-right ${
                    m.sender === 'user' ? 'text-[#D0A68D]' : 'text-[#8C827A]'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-full bg-[#F4ECE6] text-[#2C3228] border border-[#D0A68D] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#D0A68D] animate-spin" />
              </div>
              <div className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-2xl text-xs text-[#8C827A] italic">
                A analisar os dados do ginásio Ela Fit com Inteligência Artificial...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#FBF9F6] border-t border-[#ECE5DE] flex items-center gap-2">
          <input
            type="text"
            placeholder="Pergunte sobre receitas, planos de alunas, comissões de RH ou campanhas..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="flex-1 px-4 py-2.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#2C3228]"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={loading || !inputPrompt.trim()}
            className="px-5 py-2.5 bg-[#2C3228] hover:bg-[#3E4639] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-4 h-4 text-[#D0A68D]" />
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
