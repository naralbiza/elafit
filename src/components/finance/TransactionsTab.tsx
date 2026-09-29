import React, { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, CheckCircle2, Printer } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '../../types';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { monthLabel, sumAmount } from '../../utils/finance';
import { markAsPaid, monthTransactions } from './financeCalc';
import { Card, Empty, StatusBadge, iconBtn, smallInputCls, tdCls, thCls, theadCls } from './ui';

interface Props {
  monthKey: string;
  onEdit: (tx: Transaction) => void;
  onOpenReceipt: (tx: Transaction) => void;
}

export const TransactionsTab: React.FC<Props> = ({ monthKey, onEdit, onOpenReceipt }) => {
  const { transactions, settings, actions } = useData();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [account, setAccount] = useState('all');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthTransactions(transactions, monthKey)
      .filter((t) => {
        if (type !== 'all' && t.type !== type) return false;
        if (category !== 'all' && t.category !== category) return false;
        if (status !== 'all' && t.status !== status) return false;
        if (account !== 'all' && t.account !== account) return false;
        if (!q) return true;
        return [t.description, t.memberName, t.supplier, t.receiptNumber, t.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, monthKey, search, type, category, status, account]);

  const income = sumAmount(rows.filter((t) => t.type === 'receita'));
  const expense = sumAmount(rows.filter((t) => t.type === 'despesa'));
  const accounts = [...new Set([...settings.accounts, ...transactions.map((t) => t.account).filter(Boolean)])];

  const categories = type === 'receita' ? INCOME_CATEGORIES : type === 'despesa' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const handleDelete = (tx: Transaction) => {
    if (window.confirm(`Apagar o lançamento "${tx.description}" (${formatKz(tx.amount)})?`)) actions.deleteTransaction(tx.id);
  };

  return (
    <Card title={`Lançamentos de ${monthLabel(monthKey)}`} subtitle={`${rows.length} lançamento(s) com os filtros atuais`}>
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#A0958C]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar descrição, aluna, fornecedor..." className={`${smallInputCls} w-full pl-9`} />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setCategory('all'); }} className={smallInputCls}>
          <option value="all">Receitas e despesas</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={smallInputCls}>
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={smallInputCls}>
          <option value="all">Todos os estados</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={smallInputCls}>
          <option value="all">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Data</th>
              <th className={thCls}>Descrição</th>
              <th className={thCls}>Categoria</th>
              <th className={thCls}>Conta / Método</th>
              <th className={thCls}>Serviço</th>
              <th className={`${thCls} text-right`}>Valor</th>
              <th className={thCls}>Estado</th>
              <th className={`${thCls} text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE4]">
            {rows.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#FBF9F6]">
                <td className={`${tdCls} text-[#7A7067] whitespace-nowrap`}>{formatDatePt(tx.date)}</td>
                <td className={tdCls}>
                  <div className="font-bold text-[#2C3228]">{tx.description}</div>
                  <div className="text-[10px] text-[#8C827A]">
                    {[tx.memberName && `Aluna: ${tx.memberName}`, tx.supplier && `Fornecedor: ${tx.supplier}`, tx.receiptNumber, tx.vatRate ? `IVA ${tx.vatRate}%` : '']
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </td>
                <td className={`${tdCls} text-[#61574E]`}>{tx.category}</td>
                <td className={`${tdCls} text-[#61574E]`}>
                  <div>{tx.account || '—'}</div>
                  <div className="text-[10px] text-[#8C827A]">{tx.paymentMethod}</div>
                </td>
                <td className={`${tdCls} text-[#61574E]`}>{tx.costCenter || '—'}</td>
                <td className={`${tdCls} text-right font-serif text-sm font-bold whitespace-nowrap ${tx.type === 'receita' ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                  {tx.type === 'receita' ? '+' : '−'}
                  {formatKz(tx.amount)}
                </td>
                <td className={tdCls}>
                  <StatusBadge status={tx.status} />
                </td>
                <td className={tdCls}>
                  <div className="flex justify-end gap-1">
                    {tx.status !== 'pago' && (
                      <button onClick={() => actions.saveTransaction(markAsPaid(tx, transactions))} className={`${iconBtn} text-[#166534]`} title="Marcar como pago">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {tx.type === 'receita' && tx.status === 'pago' && (
                      <button onClick={() => onOpenReceipt(tx)} className={iconBtn} title="Recibo">
                        <Printer className="w-3.5 h-3.5 text-[#D0A68D]" />
                      </button>
                    )}
                    <button onClick={() => onEdit(tx)} className={iconBtn} title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(tx)} className={`${iconBtn} hover:bg-[#FEE2E2] text-[#D3453B]`} title="Apagar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-[#FBF9F6] font-bold text-[#2C3228]">
              <tr>
                <td className={tdCls} colSpan={5}>Totais dos lançamentos filtrados</td>
                <td className={`${tdCls} text-right whitespace-nowrap`} colSpan={3}>
                  <span className="text-[#166534]">+{formatKz(income)}</span>
                  <span className="mx-2 text-[#8C827A]">|</span>
                  <span className="text-[#991B1B]">−{formatKz(expense)}</span>
                  <span className="mx-2 text-[#8C827A]">|</span>
                  <span>Saldo {formatKz(income - expense)}</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {!rows.length && <Empty>Nenhum lançamento encontrado para este mês.</Empty>}
      </div>
    </Card>
  );
};
