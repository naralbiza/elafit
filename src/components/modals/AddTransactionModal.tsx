import React, { useEffect, useMemo, useState } from 'react';
import { Coins, X } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, PaymentMethod, PaymentStatus, Transaction, TransactionCategory, Member } from '../../types';
import { localToday } from '../../utils/dates';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddTransaction: (transaction: Transaction) => Promise<boolean> | void;
  initial?: Partial<Transaction> | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, members, onAddTransaction, initial }) => {
  const { settings } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [category, setCategory] = useState<TransactionCategory>('Mensalidades');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Multicaixa Express');
  const [status, setStatus] = useState<PaymentStatus>('pago');
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState(localToday());
  const [dueDate, setDueDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [account, setAccount] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaultAccount = settings.accounts[0] ?? 'Caixa';
    const defaultCenter = settings.costCenters.includes('Geral') ? 'Geral' : settings.costCenters[0] ?? '';
    setDescription(initial?.description ?? '');
    setAmount(initial?.amount ?? 0);
    setType(initial?.type ?? 'receita');
    setCategory(initial?.category ?? 'Mensalidades');
    setPaymentMethod(initial?.paymentMethod ?? 'Multicaixa Express');
    setStatus(initial?.status ?? 'pago');
    setMemberId(initial?.memberId ?? '');
    setDate(initial?.date ?? localToday());
    setDueDate(initial?.dueDate ?? '');
    setSupplier(initial?.supplier ?? '');
    setAccount(initial?.account ?? defaultAccount);
    setCostCenter(initial?.costCenter ?? defaultCenter);
    setVatRate(initial?.vatRate ?? (initial?.type === 'despesa' ? 0 : settings.ivaRate));
    setNotes(initial?.notes ?? '');
  }, [isOpen, initial, settings]);

  const categories = type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const accounts = useMemo(() => [...new Set([...settings.accounts, account].filter(Boolean))], [settings.accounts, account]);
  const centers = useMemo(() => [...new Set([...settings.costCenters, costCenter].filter(Boolean))], [settings.costCenters, costCenter]);

  if (!isOpen) return null;

  const changeType = (next: 'receita' | 'despesa') => {
    setType(next);
    setCategory(next === 'receita' ? 'Mensalidades' : 'Salários & RH');
    if (next === 'receita') setSupplier('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !Number.isFinite(amount) || amount <= 0 || !date) return;
    const selectedMember = members.find((m) => m.id === memberId);
    const transaction: Transaction = {
      ...initial,
      id: initial?.id ?? `TX-${Date.now()}`,
      description: description.trim(),
      amount: Number(amount),
      type,
      category,
      date,
      dueDate: dueDate || undefined,
      status,
      memberId: type === 'receita' ? selectedMember?.id : undefined,
      memberName: type === 'receita' ? selectedMember?.name : undefined,
      supplier: type === 'despesa' ? supplier.trim() || undefined : undefined,
      paymentMethod,
      receiptNumber: type === 'receita' ? initial?.receiptNumber ?? `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      vatRate: Number(vatRate) || 0,
      account,
      costCenter,
      notes: notes.trim(),
    };
    setSaving(true);
    const ok = await onAddTransaction(transaction);
    setSaving(false);
    if (ok !== false) onClose();
  };

  const input = 'w-full px-3 py-2 bg-[#FBF9F6] border border-[#E2DAD1] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#2C3228]';
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#E2DAD1] relative my-6" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg" aria-label="Fechar"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <Coins className="w-5 h-5 text-[#3A6B4C]" />
          <div><h3 className="font-serif text-xl font-bold text-[#2C3228]">{initial?.id ? 'Editar lançamento' : 'Novo lançamento'}</h3><p className="text-[11px] text-[#7A7067]">Preencha os dados reais da operação. Ficarão disponíveis nos relatórios e nas restantes abas.</p></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => changeType('receita')} className={`py-2 rounded-xl font-bold ${type === 'receita' ? 'bg-[#EAF5ED] text-[#166534] border border-[#3A6B4C]' : 'bg-[#FBF9F6] text-[#7A7067]'}`}>+ Receita / entrada</button>
            <button type="button" onClick={() => changeType('despesa')} className={`py-2 rounded-xl font-bold ${type === 'despesa' ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#E11D48]' : 'bg-[#FBF9F6] text-[#7A7067]'}`}>− Despesa / saída</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Descrição *"><input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'receita' ? 'Ex.: Mensalidade de outubro' : 'Ex.: Pagamento de renda'} className={input} /></Field>
            <Field label="Valor total (Kz) *"><input required type="number" min="0.01" step="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className={input} /></Field>
            <Field label="Categoria"><select value={category} onChange={(e) => setCategory(e.target.value as TransactionCategory)} className={input}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Estado"><select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} className={input}><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="atrasado">Atrasado</option></select></Field>
            <Field label="Data do lançamento *"><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></Field>
            <Field label="Data de vencimento"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} /></Field>
            <Field label="Conta financeira"><select value={account} onChange={(e) => setAccount(e.target.value)} className={input}>{accounts.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
            <Field label="Serviço / centro de custo"><select value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className={input}>{centers.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Método de pagamento"><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={input}>{PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
            <Field label="IVA incluído (%)"><input type="number" min="0" step="0.1" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className={input} /></Field>
            {type === 'receita' ? (
              <Field label="Aluna associada" className="md:col-span-2"><select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={input}><option value="">Sem aluna associada</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.plan})</option>)}</select></Field>
            ) : (
              <Field label="Fornecedor" className="md:col-span-2"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex.: Empresa fornecedora" className={input} /></Field>
            )}
            <Field label="Observações" className="md:col-span-2"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Referência, detalhes ou instruções internas" className={input} /></Field>
          </div>
          <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-[#F4ECE6] text-[#2C3228] font-bold rounded-xl">Cancelar</button><button type="submit" disabled={saving} className="px-5 py-2 bg-[#2C3228] text-white font-bold rounded-xl hover:bg-[#3E4639] disabled:opacity-60">{saving ? 'A guardar...' : 'Guardar lançamento'}</button></div>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => <label className={`block ${className}`}><span className="font-bold text-[#2C3228] block mb-1">{label}</span>{children}</label>;
