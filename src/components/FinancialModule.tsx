import React, { useState } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Printer,
  AlertTriangle,
  Search,
  CreditCard,
  PieChart as PieIcon,
  Send,
  Coins
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction, Member } from '../types';
import { formatKz } from '../utils/formatters';

interface FinancialModuleProps {
  transactions: Transaction[];
  members: Member[];
  onOpenAddTransaction: () => void;
  onOpenReceiptModal: (transaction: Transaction) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Mensalidades: '#3A6B4C',
  'Personal Training': '#D0A68D',
  'Pilates Reformer': '#2C3228',
  'Bar & Suplementos': '#C87D65',
  'Renda & Instalações': '#E11D48',
  'Salários & RH': '#4F46E5',
  'Equipamento & Manutenção': '#D97706',
  'Marketing & Eventos': '#2563EB',
  Outros: '#6B7280',
};

export const FinancialModule: React.FC<FinancialModuleProps> = ({
  transactions,
  members,
  onOpenAddTransaction,
  onOpenReceiptModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'transactions' | 'plans' | 'defaulters'>('dre');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Financial Calculations
  const totalReceita = transactions
    .filter((t) => t.type === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesa = transactions
    .filter((t) => t.type === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const lucroLiquido = totalReceita - totalDespesa;
  const margemLucro = totalReceita > 0 ? ((lucroLiquido / totalReceita) * 100).toFixed(1) : '0';

  const activeMembersCount = members.filter((m) => m.memberStatus === 'ativa').length;
  const ticketMedio = activeMembersCount > 0 ? totalReceita / activeMembersCount : 0;

  // Category Aggregation for Chart
  const categoryData = Object.keys(CATEGORY_COLORS).map((cat) => {
    const val = transactions
      .filter((t) => t.category === cat && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: val };
  }).filter((c) => c.value > 0);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.memberName && t.memberName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#3A6B4C] tracking-widest uppercase">
            Módulo Financeiro & Contabilidade (Kwanza - Kz)
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">
            Gestão do Fluxo de Caixa Ela Fit
          </h2>
          <p className="text-xs text-[#7A7067]">
            Controlo de receitas em Kwanza (Kz), mensalidades recorrentes, pagamentos e emissão de recibos.
          </p>
        </div>

        <button
          onClick={onOpenAddTransaction}
          className="px-4 py-2.5 bg-[#2C3228] text-[#FFFFFF] hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-[#D0A68D]" />
          <span>Registar Lançamento</span>
        </button>
      </div>

      {/* Subtabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'dre', label: 'DRE & Indicadores (KPIs)' },
          { id: 'transactions', label: 'Registo de Transações' },
          { id: 'plans', label: 'Planos & Emissão de Recibos' },
          { id: 'defaulters', label: 'Controlo de Atrasos' },
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

      {/* SUBTAB 1: DRE & KPIS */}
      {activeSubTab === 'dre' && (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-[#EAF5ED] text-[#3A6B4C]">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-[#3A6B4C] bg-[#EAF5ED] px-2 py-0.5 rounded-full">
                  Entradas
                </span>
              </div>
              <p className="text-xs font-semibold text-[#8C827A] mt-3 uppercase tracking-wider">Receitas Cobradas</p>
              <p className="font-serif text-2xl font-bold text-[#2C3228] mt-1">
                {formatKz(totalReceita)}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-[#FEE2E2] text-[#991B1B]">
                  <TrendingDown className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                  Saídas
                </span>
              </div>
              <p className="text-xs font-semibold text-[#8C827A] mt-3 uppercase tracking-wider">Despesas Totais</p>
              <p className="font-serif text-2xl font-bold text-[#2C3228] mt-1">
                {formatKz(totalDespesa)}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-[#F4ECE6] text-[#2C3228]">
                  <Coins className="w-5 h-5 text-[#D0A68D]" />
                </span>
                <span className="text-[10px] font-bold text-[#2C3228] bg-[#F4ECE6] px-2 py-0.5 rounded-full">
                  Margem: {margemLucro}%
                </span>
              </div>
              <p className="text-xs font-semibold text-[#8C827A] mt-3 uppercase tracking-wider">Lucro Líquido</p>
              <p className="font-serif text-2xl font-bold text-[#3A6B4C] mt-1">
                {formatKz(lucroLiquido)}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#ECE5DE] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-[#FBF0E9] text-[#C87D65]">
                  <CreditCard className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-[#2C3228] bg-[#FBF0E9] px-2 py-0.5 rounded-full">
                  Média / Aluna
                </span>
              </div>
              <p className="text-xs font-semibold text-[#8C827A] mt-3 uppercase tracking-wider">Ticket Médio Mensal</p>
              <p className="font-serif text-2xl font-bold text-[#2C3228] mt-1">
                {formatKz(ticketMedio)}
              </p>
            </div>
          </div>

          {/* DRE Summary Table & Category Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs">
              <h3 className="font-serif text-lg font-bold text-[#2C3228] mb-4">
                Demonstração de Resultados (DRE Simplificada - Kz)
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 bg-[#EAF5ED] font-bold text-[#166534] rounded-xl">
                  <span>1. RECEITA OPERACIONAL BRUTA</span>
                  <span>{formatKz(totalReceita)}</span>
                </div>

                <div className="pl-4 space-y-1.5 text-[#61574E]">
                  <div className="flex justify-between">
                    <span>• Mensalidades do Ginásio</span>
                    <span>{formatKz(totalReceita * 0.65)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pilates Reformer & Personal Training</span>
                    <span>{formatKz(totalReceita * 0.28)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bar, Shakes & Suplementos</span>
                    <span>{formatKz(totalReceita * 0.07)}</span>
                  </div>
                </div>

                <div className="flex justify-between p-3 bg-[#FEE2E2] font-bold text-[#991B1B] rounded-xl mt-4">
                  <span>2. DESPESAS OPERACIONAIS & CUSTOS</span>
                  <span>-{formatKz(totalDespesa)}</span>
                </div>

                <div className="pl-4 space-y-1.5 text-[#61574E]">
                  <div className="flex justify-between">
                    <span>• Instalações, Renda & Energia</span>
                    <span>{formatKz(1250000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Salários e Comissões de Formadoras</span>
                    <span>{formatKz(1080000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Manutenção e Marketing</span>
                    <span>{formatKz(320000)}</span>
                  </div>
                </div>

                <div className="flex justify-between p-4 bg-[#2C3228] text-white font-bold text-sm rounded-xl mt-4">
                  <span>= RESULTADO LÍQUIDO DO MÊS</span>
                  <span className="text-[#D0A68D]">{formatKz(lucroLiquido)}</span>
                </div>
              </div>
            </div>

            {/* Category Chart */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C3228] mb-2 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#D0A68D]" />
                  Distribuição por Categoria
                </h3>

                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [formatKz(Number(value)), 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-2 space-y-1 text-[11px]">
                {categoryData.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[c.name] }}
                      />
                      {c.name}
                    </span>
                    <span className="font-bold text-[#2C3228]">{formatKz(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TRANSACTIONS LIST */}
      {activeSubTab === 'transactions' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FBF9F6] border-b border-[#ECE5DE] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A0958C]" />
              <input
                type="text"
                placeholder="Pesquisar por descrição ou aluna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="all">Todas as Operações</option>
                <option value="receita">Apenas Receitas (+)</option>
                <option value="despesa">Apenas Despesas (-)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4ECE6] text-[#2C3228] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição / Origem</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Valor (Kz)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FBF9F6] transition-colors">
                    <td className="px-4 py-3.5 text-[#7A7067] font-medium">{tx.date}</td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#2C3228]">{tx.description}</div>
                      {tx.memberName && <div className="text-[10px] text-[#8C827A]">Aluna: {tx.memberName}</div>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#6B7280' }}
                      >
                        {tx.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#61574E]">{tx.paymentMethod}</td>

                    <td className={`px-4 py-3.5 font-serif text-sm font-bold ${tx.type === 'receita' ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                      {tx.type === 'receita' ? '+' : '-'}{formatKz(tx.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'pago'
                            ? 'bg-[#EAF5ED] text-[#166534]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {tx.status === 'pago' ? 'Pago' : 'Atrasado / Pendente'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {tx.type === 'receita' && tx.status === 'pago' && (
                        <button
                          onClick={() => onOpenReceiptModal(tx)}
                          className="px-2.5 py-1 bg-[#F4ECE6] hover:bg-[#EBE0D7] text-[#2C3228] border border-[#E0D3C7] rounded-lg text-[10px] font-bold flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3 text-[#D0A68D]" />
                          <span>Recibo</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PLANS & RECEIPTS */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#2C3228] mb-4">
              Planos Oficiais & Pacotes Ela Fit (Valores em Kwanza - Kz)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Ela Fit Livre', price: '35.000 Kz', desc: 'Acesso livre a musculação & aulas de grupo', tag: 'Popular' },
                { name: 'Ela Fit Anual VIP', price: '45.000 Kz', desc: 'Livre + 1 Avaliação Física Mensal + Desconto em Pilates', tag: 'Melhor Valor' },
                { name: 'Ela Fit Pilates Reformer', price: '65.000 Kz', desc: 'Acesso ilimitado ao Studio Reformer + Treino Funcional', tag: 'Especializado' },
                { name: 'Pacote 10 PT', price: '180.000 Kz', desc: '10 Sessões Individuais com Personal Trainer com horário flexível', tag: 'Personalizado' },
              ].map((plan, idx) => (
                <div key={idx} className="p-5 bg-[#FBF9F6] border border-[#ECE5DE] rounded-2xl shadow-xs relative flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold bg-[#2C3228] text-[#EBD9CD] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.tag}
                    </span>
                    <h4 className="font-serif text-base font-bold text-[#2C3228] mt-3">
                      {plan.name}
                    </h4>
                    <p className="font-serif text-2xl font-bold text-[#3A6B4C] mt-2">
                      {plan.price} <span className="text-xs font-sans font-normal text-[#8C827A]">/mês</span>
                    </p>
                    <p className="text-xs text-[#7A7067] mt-2 leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <button
                    onClick={onOpenAddTransaction}
                    className="mt-4 w-full py-2 bg-[#2C3228] hover:bg-[#3E4639] text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Atribuir a Aluna
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DEFAULTERS */}
      {activeSubTab === 'defaulters' && (
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2C3228] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            Cobranças & Mensalidades Pendentes
          </h3>
          <p className="text-xs text-[#7A7067]">
            Notifique rapidamente alunas com pagamentos atrasados de forma simpática e eficaz via WhatsApp.
          </p>

          <div className="space-y-3 mt-4">
            {transactions
              .filter((t) => t.status === 'atrasado' || t.status === 'pendente')
              .map((pending) => (
                <div key={pending.id} className="p-4 bg-[#FEF3C7]/30 border border-[#FCD34D] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#92400E]">
                      {pending.description}
                    </span>
                    <p className="text-xs text-[#B45309] font-bold mt-0.5">
                      Valor: {formatKz(pending.amount)} • Data Limite: {pending.date}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Olá ${pending.memberName || 'estimada aluna'}! ✨ A sua mensalidade Ela Fit no valor de ${formatKz(pending.amount)} encontra-se pendente. Pode efetuar o pagamento via Transferência/Express ou na receção do ginásio. Obrigada e bons treinos!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Lembrete WhatsApp</span>
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
