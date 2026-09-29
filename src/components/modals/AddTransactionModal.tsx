import React, { useState } from 'react';
import { X, Plus, Coins } from 'lucide-react';
import { Transaction, TransactionCategory, PaymentStatus, Member } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddTransaction: (transaction: Transaction) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddTransaction,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(45000);
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [category, setCategory] = useState<TransactionCategory>('Mensalidades');
  const [paymentMethod, setPaymentMethod] = useState<'MBWay' | 'Multibanco' | 'Débito Direto' | 'Dinheiro' | 'Cartão de Crédito'>('MBWay');
  const [status, setStatus] = useState<PaymentStatus>('pago');
  const [memberId, setMemberId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const selectedMember = members.find((m) => m.id === memberId);

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      description,
      amount: Number(amount),
      type,
      category,
      date: new Date().toISOString().split('T')[0],
      status,
      memberId: selectedMember?.id,
      memberName: selectedMember?.name,
      paymentMethod,
      receiptNumber: type === 'receita' ? `REC-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined
    };

    onAddTransaction(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2DAD1] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <Coins className="w-5 h-5 text-[#3A6B4C]" />
          <h3 className="font-serif text-xl font-bold text-[#2C3228]">Registar Lançamento Financeiro</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#2C3228] block mb-1">Tipo de Operação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('receita')}
                className={`py-2 rounded-xl font-bold ${
                  type === 'receita' ? 'bg-[#EAF5ED] text-[#166534] border border-[#3A6B4C]' : 'bg-[#FBF9F6] text-[#7A7067]'
                }`}
              >
                + Receita (Entrada)
              </button>
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={`py-2 rounded-xl font-bold ${
                  type === 'despesa' ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#E11D48]' : 'bg-[#FBF9F6] text-[#7A7067]'
                }`}
              >
                - Despesa (Saída)
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#2C3228] block mb-1">Descrição / Motivo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Mensalidade Anual VIP - Sofia Henriques"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Valor (Kz) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              />
            </div>

            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="Mensalidades">Mensalidades</option>
                <option value="Personal Training">Personal Training</option>
                <option value="Pilates Reformer">Pilates Reformer</option>
                <option value="Bar & Suplementos">Bar & Suplementos</option>
                <option value="Renda & Instalações">Renda & Instalações</option>
                <option value="Salários & RH">Salários & RH</option>
                <option value="Equipamento & Manutenção">Equipamento & Manutenção</option>
                <option value="Marketing & Eventos">Marketing & Eventos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Método de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="MBWay">MBWay</option>
                <option value="Multibanco">Multibanco</option>
                <option value="Débito Direto">Débito Direto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="pago">Liquidado / Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          {type === 'receita' && (
            <div>
              <label className="font-bold text-[#2C3228] block mb-1">Aluna Associada (Opcional)</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228]"
              >
                <option value="">Selecione uma aluna...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.plan})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Guardar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
