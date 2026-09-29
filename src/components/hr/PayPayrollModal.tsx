import React, { useEffect, useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { PAYMENT_METHODS, PaymentMethod, PayrollRun, Transaction } from '../../types';
import { useData } from '../../data/DataContext';
import { newId } from '../../data/repository';
import { formatKz } from '../../utils/formatters';
import { monthLabel, shiftMonth, todayISO } from '../../utils/finance';
import { addDays } from '../../utils/dates';
import { costCenterForRole, inputCls, labelCls, primaryBtn, secondaryBtn } from './hrShared';

interface PayPayrollModalProps {
  isOpen: boolean;
  monthKey: string;
  runs: PayrollRun[]; // execuções 'processado' a pagar
  onClose: () => void;
}

const round = (n: number) => Math.round(n * 100) / 100;

export const PayPayrollModal: React.FC<PayPayrollModalProps> = ({ isOpen, monthKey, runs, onClose }) => {
  const { settings, transactions, actions } = useData();
  const [date, setDate] = useState(todayISO());
  const [account, setAccount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Transferência Bancária');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(todayISO());
      setAccount(settings.accounts[0] ?? '');
      setMethod('Transferência Bancária');
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const label = monthLabel(monthKey);
  const totalNet = round(runs.reduce((s, r) => s + r.net, 0));
  const totalInss = round(runs.reduce((s, r) => s + r.inssEmployee + r.inssEmployer, 0));
  const totalIrt = round(runs.reduce((s, r) => s + r.irt + r.withholding, 0));

  // Prazos de entrega ao Estado: INSS até dia 10 do mês seguinte; IRT até ao fim do mês seguinte
  const nextMonth = shiftMonth(monthKey, 1);
  const inssDue = `${nextMonth}-10`;
  const irtDue = addDays(`${shiftMonth(monthKey, 2)}-01`, -1);

  const handleConfirm = async () => {
    if (!date || !account) {
      window.alert('Indique a data de pagamento e a conta.');
      return;
    }
    const alreadyPaid = new Set(
      transactions.filter((t) => t.payrollRunId && t.category === 'Salários & RH').map((t) => t.payrollRunId as string)
    );

    const base = { type: 'despesa' as const, vatRate: 0, account, paymentMethod: method, date };
    const txs: Transaction[] = [];
    for (const run of runs) {
      if (alreadyPaid.has(run.id)) continue;
      const note = `Gerado pelo processamento salarial de ${label}.`;
      txs.push({
        ...base,
        id: newId('TX'),
        description: `Salário ${label} — ${run.employeeName}`,
        amount: run.net,
        category: 'Salários & RH',
        status: 'pago',
        costCenter: costCenterForRole(run.role),
        supplier: run.employeeName,
        notes: note,
        payrollRunId: run.id,
      });
      const inss = round(run.inssEmployee + run.inssEmployer);
      if (inss > 0) {
        txs.push({
          ...base,
          id: newId('TX'),
          description: `Segurança Social (INSS) ${label} — ${run.employeeName}`,
          amount: inss,
          category: 'Impostos & Contribuições',
          status: 'pendente',
          costCenter: costCenterForRole(run.role),
          supplier: 'INSS — Segurança Social',
          dueDate: inssDue,
          notes: `${note} Trabalhadora ${formatKz(run.inssEmployee)} + patronal ${formatKz(run.inssEmployer)}.`,
          payrollRunId: run.id,
        });
      }
      const irt = round(run.irt + run.withholding);
      if (irt > 0) {
        txs.push({
          ...base,
          id: newId('TX'),
          description: `IRT / Retenção na fonte ${label} — ${run.employeeName}`,
          amount: irt,
          category: 'Impostos & Contribuições',
          status: 'pendente',
          costCenter: costCenterForRole(run.role),
          supplier: 'AGT — Administração Geral Tributária',
          dueDate: irtDue,
          notes: note,
          payrollRunId: run.id,
        });
      }
    }

    setSaving(true);
    const okTx = txs.length ? await actions.saveTransactions(txs) : true;
    if (!okTx) {
      setSaving(false);
      return;
    }
    const ok = await actions.savePayrollRuns(runs.map((r) => ({ ...r, status: 'pago' as const, paidAt: date })));
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2DAD1] relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 border-b border-[#E8E2DC] pb-3 mb-4">
          <Wallet className="w-5 h-5 text-[#D0A68D]" />
          <h3 className="font-serif text-xl font-bold text-[#2C3228]">Pagar salários — {label}</h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl space-y-1 text-[#61574E]">
            <p className="flex justify-between"><span>{runs.length} salário(s) processado(s) — líquido a pagar:</span><strong className="text-[#2C3228]">{formatKz(totalNet)}</strong></p>
            <p className="flex justify-between"><span>INSS a entregar (pendente):</span><strong className="text-[#2C3228]">{formatKz(totalInss)}</strong></p>
            <p className="flex justify-between"><span>IRT / retenções a entregar (pendente):</span><strong className="text-[#2C3228]">{formatKz(totalIrt)}</strong></p>
          </div>

          <div>
            <label className={labelCls}>Data de pagamento</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Conta</label>
              <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls}>
                {settings.accounts.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Método de pagamento</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-[#7A7067]">
            São lançadas no Financeiro as despesas de salário (pagas) e as obrigações de INSS e IRT/retenções (pendentes, com prazo
            de entrega) associadas a cada recibo.
          </p>
        </div>

        <div className="pt-4 mt-4 border-t border-[#F0EAE4] flex justify-end gap-2">
          <button onClick={onClose} className={secondaryBtn}>Cancelar</button>
          <button onClick={handleConfirm} disabled={saving || runs.length === 0} className={primaryBtn}>
            {saving ? 'A registar...' : 'Confirmar pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
};
