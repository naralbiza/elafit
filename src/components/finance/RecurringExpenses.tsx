import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Repeat, Rocket } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { newId } from '../../data/repository';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentMethod, RecurringExpense, Transaction, TransactionCategory } from '../../types';
import { formatKz } from '../../utils/formatters';
import { isInMonth, monthLabel, vatIncluded } from '../../utils/finance';
import { Card, Empty, Field, iconBtn, inputCls, primaryBtn, secondaryBtn, tdCls, thCls, theadCls } from './ui';

const emptyRecurring = (settings: { accounts: string[]; costCenters: string[]; ivaRate: number }): RecurringExpense => ({
  id: '',
  description: '',
  category: 'Renda & Instalações',
  amount: 0,
  vatRate: 0,
  account: settings.accounts[0] ?? '',
  costCenter: settings.costCenters.includes('Geral') ? 'Geral' : settings.costCenters[0] ?? '',
  supplier: '',
  paymentMethod: 'Transferência Bancária',
  dayOfMonth: 1,
  active: true,
});

const daysInMonth = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export const RecurringExpenses: React.FC<{ monthKey: string }> = ({ monthKey }) => {
  const { recurringExpenses, transactions, settings, actions } = useData();
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [launching, setLaunching] = useState(false);

  const launchedIds = new Set(
    transactions.filter((t) => t.recurringId && isInMonth(t.date, monthKey)).map((t) => t.recurringId as string)
  );
  const toLaunch = recurringExpenses.filter((r) => r.active && !launchedIds.has(r.id));
  const monthlyTotal = recurringExpenses.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  const launch = async () => {
    if (!toLaunch.length) return;
    if (!window.confirm(`Lançar ${toLaunch.length} despesa(s) fixa(s) em ${monthLabel(monthKey)} como pendentes?`)) return;
    const lastDay = daysInMonth(monthKey);
    const txs: Transaction[] = toLaunch.map((r) => {
      const day = Math.min(Math.max(1, r.dayOfMonth || 1), lastDay);
      const date = `${monthKey}-${String(day).padStart(2, '0')}`;
      return {
        id: newId('TX'),
        description: `${r.description} — ${monthLabel(monthKey)}`,
        amount: r.amount,
        type: 'despesa',
        category: r.category,
        date,
        dueDate: date,
        status: 'pendente',
        paymentMethod: r.paymentMethod,
        vatRate: r.vatRate,
        account: r.account,
        costCenter: r.costCenter,
        supplier: r.supplier || undefined,
        notes: 'Despesa fixa lançada automaticamente',
        recurringId: r.id,
      };
    });
    setLaunching(true);
    await actions.saveTransactions(txs);
    setLaunching(false);
  };

  const handleDelete = (r: RecurringExpense) => {
    if (window.confirm(`Apagar a despesa fixa "${r.description}"? Os lançamentos já criados mantêm-se.`)) actions.deleteRecurringExpense(r.id);
  };

  return (
    <Card
      title={<><Repeat className="w-4 h-4 text-[#D0A68D]" /> Despesas fixas</>}
      subtitle={`Total mensal das despesas ativas: ${formatKz(monthlyTotal)} • ${launchedIds.size} já lançada(s) em ${monthLabel(monthKey)}`}
      actions={
        <>
          <button onClick={() => setEditing(emptyRecurring(settings))} className={secondaryBtn}>
            <Plus className="w-3.5 h-3.5" /> Nova despesa fixa
          </button>
          <button onClick={launch} disabled={!toLaunch.length || launching} className={primaryBtn}>
            <Rocket className="w-3.5 h-3.5 text-[#D0A68D]" />
            Lançar despesas fixas de {monthLabel(monthKey)} {toLaunch.length ? `(${toLaunch.length})` : ''}
          </button>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Descrição</th>
              <th className={thCls}>Categoria</th>
              <th className={thCls}>Fornecedor</th>
              <th className={thCls}>Conta / Serviço</th>
              <th className={thCls}>Dia</th>
              <th className={`${thCls} text-right`}>Valor</th>
              <th className={thCls}>Estado</th>
              <th className={`${thCls} text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE4]">
            {recurringExpenses.map((r) => (
              <tr key={r.id} className={r.active ? '' : 'opacity-60'}>
                <td className={`${tdCls} font-bold text-[#2C3228]`}>{r.description}</td>
                <td className={`${tdCls} text-[#61574E]`}>{r.category}</td>
                <td className={`${tdCls} text-[#61574E]`}>{r.supplier || '—'}</td>
                <td className={`${tdCls} text-[#61574E]`}>
                  {r.account || '—'}
                  <div className="text-[10px] text-[#8C827A]">{r.costCenter}</div>
                </td>
                <td className={`${tdCls} text-[#61574E]`}>{r.dayOfMonth}</td>
                <td className={`${tdCls} text-right font-bold whitespace-nowrap`}>
                  {formatKz(r.amount)}
                  {r.vatRate > 0 && <div className="text-[10px] text-[#8C827A] font-normal">IVA {r.vatRate}%</div>}
                </td>
                <td className={tdCls}>
                  {!r.active ? (
                    <span className="text-[10px] text-[#8C827A]">Inativa</span>
                  ) : launchedIds.has(r.id) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5ED] text-[#166534]">Lançada</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4ECE6] text-[#8C6353]">Por lançar</span>
                  )}
                </td>
                <td className={tdCls}>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(r)} className={iconBtn} title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(r)} className={`${iconBtn} hover:bg-[#FEE2E2] text-[#D3453B]`} title="Apagar"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!recurringExpenses.length && <Empty>Ainda não há despesas fixas (renda, energia, internet, segurança...).</Empty>}
      </div>

      {editing && (
        <RecurringForm
          value={editing}
          onClose={() => setEditing(null)}
          onSave={async (r) => {
            const ok = await actions.saveRecurringExpense({ ...r, id: r.id || newId('REC') });
            if (ok) setEditing(null);
          }}
        />
      )}
    </Card>
  );
};

const RecurringForm: React.FC<{ value: RecurringExpense; onClose: () => void; onSave: (r: RecurringExpense) => void }> = ({ value, onClose, onSave }) => {
  const { settings } = useData();
  const [form, setForm] = useState<RecurringExpense>(value);
  const set = <K extends keyof RecurringExpense>(k: K, v: RecurringExpense[K]) => setForm((f) => ({ ...f, [k]: v }));
  const vatOptions = [...new Set([0, 5, 7, settings.ivaRate, form.vatRate])].sort((a, b) => a - b);
  const accounts = [...new Set([...settings.accounts, form.account].filter(Boolean))];
  const centers = [...new Set([...settings.costCenters, form.costCenter].filter(Boolean))];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.description.trim() || form.amount <= 0) return;
          onSave({ ...form, description: form.description.trim() });
        }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2DAD1] max-h-[90vh] overflow-y-auto text-xs"
      >
        <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-3 mb-4">
          <h3 className="font-serif text-lg font-bold text-[#2C3228]">{value.id ? 'Editar despesa fixa' : 'Nova despesa fixa'}</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-[#8C827A] hover:text-[#2C3228]"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Descrição *" className="col-span-2">
            <input required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex: Renda do espaço" className={inputCls} />
          </Field>
          <Field label="Categoria">
            <select value={form.category} onChange={(e) => set('category', e.target.value as TransactionCategory)} className={inputCls}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor mensal (Kz, IVA incl.) *">
            <input type="number" min={0} step="0.01" required value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Taxa de IVA">
            <select value={form.vatRate} onChange={(e) => set('vatRate', Number(e.target.value))} className={inputCls}>
              {vatOptions.map((v) => <option key={v} value={v}>{v}%</option>)}
            </select>
          </Field>
          <Field label="IVA contido">
            <div className="px-3 py-2 bg-[#F4ECE6] rounded-xl text-[#2C3228] font-semibold">{formatKz(vatIncluded(form.amount, form.vatRate))}</div>
          </Field>
          <Field label="Conta">
            <select value={form.account} onChange={(e) => set('account', e.target.value)} className={inputCls}>
              {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Serviço / centro de custo">
            <select value={form.costCenter} onChange={(e) => set('costCenter', e.target.value)} className={inputCls}>
              {centers.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Fornecedor">
            <input value={form.supplier ?? ''} onChange={(e) => set('supplier', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Método de pagamento">
            <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)} className={inputCls}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Dia do mês">
            <input type="number" min={1} max={31} value={form.dayOfMonth} onChange={(e) => set('dayOfMonth', Math.min(31, Math.max(1, Number(e.target.value) || 1)))} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 mt-5 font-bold text-[#2C3228]">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Ativa
          </label>
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>Cancelar</button>
          <button type="submit" className={primaryBtn}>Guardar</button>
        </div>
      </form>
    </div>
  );
};
