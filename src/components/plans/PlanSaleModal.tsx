// Modal partilhado: atribuir um plano a uma aluna (Planos e Vendas) ou renovar a mensalidade (ficha da aluna).
import React, { useEffect, useMemo, useState } from 'react';
import { X, CreditCard, Search, Loader2 } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { Member, PAYMENT_METHODS, PaymentMethod, PaymentStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { formatDatePt, localToday } from '../../utils/dates';
import { buildPlanSale, durationLabel, periodEnd } from './planSales';
import { inputCls, labelCls, normalize, primaryBtn, secondaryBtn } from '../crm/memberShared';

interface PlanSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'assign' | 'renew';
  memberId?: string | null; // obrigatório na renovação; opcional na atribuição
  planId?: string | null; // plano pré-selecionado
  allowTransaction: boolean; // se false, apenas atualiza a aluna
  onDone?: () => void;
}

export const PlanSaleModal: React.FC<PlanSaleModalProps> = ({
  isOpen,
  onClose,
  mode,
  memberId,
  planId,
  allowTransaction,
  onDone,
}) => {
  const { members, plans, transactions, settings, actions } = useData();

  const activePlans = useMemo(
    () => [...plans].filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt')),
    [plans]
  );

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(localToday());
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pago');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [account, setAccount] = useState('');
  const [createTx, setCreateTx] = useState(true);
  const [saving, setSaving] = useState(false);

  // Repor o formulário ao abrir
  useEffect(() => {
    if (!isOpen) return;
    const member = members.find((m) => m.id === memberId);
    const byName = member ? plans.find((p) => p.name === member.plan) : undefined;
    setSelectedMemberId(memberId || '');
    setMemberSearch('');
    setSelectedPlanId(planId || byName?.id || activePlans[0]?.id || '');
    setStartDate(localToday());
    setPaymentStatus('pago');
    setPaymentMethod(PAYMENT_METHODS[0]);
    setAccount(settings.accounts[0] || 'Caixa');
    setCreateTx(allowTransaction);
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, memberId, planId]);

  const member = members.find((m) => m.id === selectedMemberId) || null;
  const plan = plans.find((p) => p.id === selectedPlanId) || null;
  // Inclui o plano selecionado mesmo que esteja inativo (ex.: plano atual da aluna)
  const planOptions = plan && !plan.active ? [plan, ...activePlans] : activePlans;

  const filteredMembers = useMemo(() => {
    const q = normalize(memberSearch);
    return [...members]
      .filter((m) => !q || normalize(m.name).includes(q) || (m.phone || '').includes(memberSearch))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  }, [members, memberSearch]);

  if (!isOpen) return null;

  const preview = member && plan
    ? buildPlanSale({
        member,
        plan,
        mode,
        startDate,
        paymentStatus,
        paymentMethod,
        account,
        createTransaction: false,
        transactions,
        settings,
      }).member
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !plan) return;
    setSaving(true);
    const { member: updated, transaction } = buildPlanSale({
      member,
      plan,
      mode,
      startDate,
      paymentStatus,
      paymentMethod,
      account,
      createTransaction: allowTransaction && createTx,
      transactions,
      settings,
    });
    const ok = await actions.saveMember(updated);
    let okTx = true;
    if (ok && transaction) okTx = await actions.saveTransaction(transaction);
    setSaving(false);
    if (ok && okTx) {
      onDone?.();
      onClose();
    }
  };

  const showTx = allowTransaction && createTx;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-[#E2DAD1] relative custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <CreditCard className="w-5 h-5 text-[#D0A68D]" />
          <h3 className="font-serif text-xl font-bold text-[#2C3228]">
            {mode === 'assign' ? 'Atribuir plano a aluna' : 'Renovar mensalidade'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'assign' && !memberId ? (
            <div>
              <label className={labelCls}>Aluna *</label>
              <div className="relative mb-1.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A0958C]" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou telefone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className={`${inputCls} pl-8`}
                />
              </div>
              <select
                required
                size={Math.min(6, Math.max(filteredMembers.length, 2))}
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={inputCls}
              >
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.phone ? `— ${m.phone}` : ''} {m.plan ? `(${m.plan})` : ''}
                  </option>
                ))}
              </select>
              {filteredMembers.length === 0 && (
                <p className="text-[11px] text-[#A0958C] mt-1">Nenhuma aluna encontrada.</p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl">
              <p className="text-[10px] text-[#8C827A] uppercase font-bold">Aluna</p>
              <p className="font-bold text-[#2C3228] text-sm">{member?.name ?? '—'}</p>
              {member && mode === 'renew' && (
                <p className="text-[11px] text-[#7A7067] mt-0.5">
                  Plano atual: {member.plan || '—'} • Renovação atual: {member.renewalDate ? formatDatePt(member.renewalDate) : '—'}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={mode === 'renew' ? 'col-span-2' : ''}>
              <label className={labelCls}>Plano *</label>
              <select required value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className={inputCls}>
                {planOptions.length === 0 && <option value="">Sem planos ativos</option>}
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatKz(p.price)} ({durationLabel(p.durationMonths)})
                  </option>
                ))}
              </select>
            </div>
            {mode === 'assign' && (
              <div>
                <label className={labelCls}>Data de início</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          {allowTransaction && (
            <label className="flex items-center gap-2 font-semibold text-[#2C3228]">
              <input type="checkbox" checked={createTx} onChange={(e) => setCreateTx(e.target.checked)} />
              Registar a receita no Financeiro
            </label>
          )}

          {showTx && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Pagamento</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className={inputCls}>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Método</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Conta</label>
                <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls}>
                  {settings.accounts.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {preview && plan && (
            <div className="p-3 bg-[#F4ECE6] border border-[#E0D3C7] rounded-xl text-[11px] text-[#61574E] space-y-0.5">
              <p>
                <span className="font-bold text-[#2C3228]">Período:</span>{' '}
                {mode === 'assign' ? formatDatePt(preview.startDate) : 'a partir de hoje/da renovação atual'} → renovação a{' '}
                <span className="font-bold text-[#2C3228]">{formatDatePt(preview.renewalDate)}</span>
              </p>
              <p>
                <span className="font-bold text-[#2C3228]">Mensalidade:</span> {formatKz(plan.price)}
                {showTx && ` • Receita ${paymentStatus === 'pago' ? 'paga' : 'pendente'} de ${formatKz(plan.price)} (IVA ${settings.ivaRate}% incluído)`}
              </p>
              {mode === 'assign' && plan.durationMonths <= 0 && (
                <p className="italic">Plano semanal/avulso: válido até {formatDatePt(periodEnd(startDate, 0))}.</p>
              )}
            </div>
          )}

          {!allowTransaction && (
            <p className="text-[11px] text-[#8C827A] italic">
              Sem acesso ao Financeiro/Planos: apenas a data de renovação da aluna será atualizada.
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className={secondaryBtn}>Cancelar</button>
            <button type="submit" disabled={!member || !plan || saving} className={primaryBtn}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === 'assign' ? 'Atribuir plano' : 'Confirmar renovação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
