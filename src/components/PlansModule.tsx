import React, { useMemo, useState } from 'react';
import { CreditCard, Edit3, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Plan } from '../types';
import { formatKz } from '../utils/formatters';
import { newId } from '../data/repository';
import { PlanSaleModal } from './plans/PlanSaleModal';

export const PlansModule: React.FC = () => {
  const { plans, members, actions } = useData();
  const [search, setSearch] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [salePlanId, setSalePlanId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const term = search.toLowerCase().trim();
    return [...plans]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((p) => !term || p.name.toLowerCase().includes(term));
  }, [plans, search]);

  const subscriberCount = (planName: string) => members.filter((m) => m.plan === planName && m.memberStatus === 'ativa').length;

  const openNew = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditingPlan(p);
    setIsFormOpen(true);
  };

  const toggleActive = async (p: Plan) => {
    await actions.savePlan({ ...p, active: !p.active });
  };

  const deletePlan = async (id: string) => {
    if (!window.confirm('Eliminar este plano?')) return;
    await actions.deletePlan(id);
  };

  const openSale = (planId: string) => {
    setSalePlanId(planId);
    setSaleOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#ECE5DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D0A68D] tracking-widest uppercase">Planos e Vendas</span>
          <h2 className="font-serif text-2xl font-bold text-[#2C3228] mt-0.5">Gestão de Planos</h2>
          <p className="text-xs text-[#7A7067]">
            Crie e edite planos, consulte subscrições ativas e atribua planos a alunas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2.5 bg-[#2C3228] text-[#FFFFFF] hover:bg-[#3E4639] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D0A68D]" />
          <span>Novo Plano</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39B92]" />
        <input
          type="text"
          placeholder="Procurar plano…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((p) => {
          const count = subscriberCount(p.name);
          return (
            <div
              key={p.id}
              className={`bg-[#FFFFFF] rounded-2xl border shadow-xs p-5 flex flex-col gap-3 transition-opacity ${
                p.active ? 'border-[#ECE5DE]' : 'border-[#E8E2DC] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-[#2C3228] text-sm">{p.name}</h3>
                  {p.tag && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#F4ECE6] text-[10px] font-semibold text-[#8C6353]">
                      {p.tag}
                    </span>
                  )}
                </div>
                <button onClick={() => toggleActive(p)} title={p.active ? 'Desativar' : 'Ativar'}>
                  {p.active ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-[#A39B92]" />
                  )}
                </button>
              </div>

              <p className="text-xs text-[#7A7067] line-clamp-2">{p.description || '—'}</p>

              <div className="flex items-baseline gap-1 mt-auto">
                <span className="font-serif text-xl font-bold text-[#2C3228]">{formatKz(p.price)}</span>
                <span className="text-[10px] text-[#7A7067]">
                  / {p.durationMonths <= 0 ? 'avulso' : p.durationMonths === 1 ? 'mês' : `${p.durationMonths} meses`}
                </span>
              </div>

              <div className="text-[10px] text-[#7A7067]">
                {count} aluna{count !== 1 ? 's' : ''} ativa{count !== 1 ? 's' : ''}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#F4ECE6]">
                <button
                  onClick={() => openSale(p.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C3228] text-white text-[10px] font-semibold hover:bg-[#3E4639]"
                >
                  <CreditCard className="w-3 h-3" /> Vender
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F4ECE6] text-[#61574E] text-[10px] font-semibold hover:bg-[#EAE0D8]"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => deletePlan(p.id)}
                  className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 text-[10px]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan form modal (inline) */}
      {isFormOpen && (
        <PlanFormModal
          plan={editingPlan}
          nextOrder={plans.length + 1}
          onClose={() => setIsFormOpen(false)}
          onSave={actions.savePlan}
        />
      )}

      {/* Plan sale modal */}
      <PlanSaleModal
        isOpen={saleOpen}
        onClose={() => setSaleOpen(false)}
        mode="assign"
        planId={salePlanId}
        allowTransaction={true}
      />
    </div>
  );
};

/* ---- Inline Plan Form Modal ---- */

interface PlanFormModalProps {
  plan: Plan | null;
  nextOrder: number;
  onClose: () => void;
  onSave: (p: Plan) => Promise<boolean>;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({ plan, nextOrder, onClose, onSave }) => {
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan?.price ?? 0);
  const [description, setDescription] = useState(plan?.description ?? '');
  const [tag, setTag] = useState(plan?.tag ?? '');
  const [durationMonths, setDurationMonths] = useState(plan?.durationMonths ?? 1);
  const [costCenter, setCostCenter] = useState(plan?.costCenter ?? 'Mensalidades');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      id: plan?.id ?? newId('PLN'),
      name: name.trim(),
      price,
      description: description.trim(),
      tag: tag.trim(),
      durationMonths,
      costCenter,
      active: plan?.active ?? true,
      sortOrder: plan?.sortOrder ?? nextOrder,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg font-bold text-[#2C3228]">
          {plan ? 'Editar Plano' : 'Novo Plano'}
        </h3>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Preço (Kz)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Duração (meses)</span>
            <input
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Tag</span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Centro de Custo</span>
          <input
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold">Descrição</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E8E2DC] bg-[#FAFAF8] text-xs focus:outline-none focus:ring-2 focus:ring-[#D0A68D]/30 resize-none"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#61574E] hover:bg-[#F4ECE6]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2C3228] text-white hover:bg-[#3E4639] disabled:opacity-50"
          >
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
