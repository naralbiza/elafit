import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, X, Lock, CheckCircle2 } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../auth/AuthContext';
import { FinanceSettings, IrtBracket } from '../../types';
import { DEFAULT_IRT_BRACKETS } from '../../utils/finance';
import { Card, Field, iconBtn, inputCls, primaryBtn, secondaryBtn, smallInputCls } from './ui';

const ChipList: React.FC<{ items: string[]; onChange: (items: string[]) => void; disabled: boolean; placeholder: string }> = ({
  items,
  onChange,
  disabled,
  placeholder,
}) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4ECE6] text-[#2C3228] text-[11px] font-semibold">
            {i}
            {!disabled && (
              <button type="button" onClick={() => onChange(items.filter((x) => x !== i))} className="text-[#8C6353] hover:text-[#991B1B]">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className={`${smallInputCls} flex-1`}
          />
          <button type="button" onClick={add} className={secondaryBtn}>
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>
      )}
    </div>
  );
};

export const SettingsTab: React.FC = () => {
  const { settings, actions } = useData();
  const { hasModule } = useAuth();
  const canEdit = hasModule('finance');
  const [form, setForm] = useState<FinanceSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Repõe o formulário quando as configurações mudam (ex.: alteração noutro posto)
  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof FinanceSettings>(k: K, v: FinanceSettings[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const num = (k: keyof FinanceSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as any);

  const setBracket = (i: number, k: keyof IrtBracket, v: number) =>
    set('irtBrackets', form.irtBrackets.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    const ok = await actions.saveSettings({ ...form, irtBrackets: [...form.irtBrackets].sort((a, b) => a.from - b.from) });
    setSaving(false);
    setSaved(ok);
  };

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs">
      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E]">
          <Lock className="w-4 h-4" /> Apenas utilizadores com acesso ao Financeiro podem alterar estas configurações.
        </div>
      )}
      <fieldset disabled={!canEdit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Dados da empresa" subtitle="Usados nos recibos e relatórios PDF">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome da empresa" className="col-span-2">
                <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className={inputCls} />
              </Field>
              <Field label="NIF">
                <input value={form.companyNif} onChange={(e) => set('companyNif', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Telefone">
                <input value={form.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Morada" className="col-span-2">
                <input value={form.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email" className="col-span-2">
                <input type="email" value={form.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Card>

          <Card title="Impostos e contribuições" subtitle="Taxas em percentagem (%)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taxa de IVA (%)">
                <input type="number" step="0.1" min={0} value={form.ivaRate} onChange={num('ivaRate')} className={inputCls} />
              </Field>
              <label className="flex items-center gap-2 mt-5 font-bold text-[#2C3228]">
                <input type="checkbox" checked={form.pricesIncludeIva} onChange={(e) => set('pricesIncludeIva', e.target.checked)} />
                Preços incluem IVA
              </label>
              <Field label="Imposto Industrial (%)">
                <input type="number" step="0.1" min={0} value={form.industrialTaxRate} onChange={num('industrialTaxRate')} className={inputCls} />
              </Field>
              <Field label="Retenção na fonte — serviços (%)">
                <input type="number" step="0.1" min={0} value={form.servicesWithholdingRate} onChange={num('servicesWithholdingRate')} className={inputCls} />
              </Field>
              <Field label="INSS trabalhador (%)">
                <input type="number" step="0.1" min={0} value={form.inssEmployeeRate} onChange={num('inssEmployeeRate')} className={inputCls} />
              </Field>
              <Field label="INSS entidade patronal (%)">
                <input type="number" step="0.1" min={0} value={form.inssEmployerRate} onChange={num('inssEmployerRate')} className={inputCls} />
              </Field>
            </div>
          </Card>
        </div>

        <Card
          title="Tabela de IRT (escalões mensais)"
          subtitle="IRT = parcela fixa + taxa × (rendimento coletável − limite inferior do escalão)"
          actions={
            canEdit && (
              <>
                <button type="button" onClick={() => set('irtBrackets', DEFAULT_IRT_BRACKETS)} className={secondaryBtn}>
                  Repor tabela padrão
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const last = form.irtBrackets[form.irtBrackets.length - 1];
                    set('irtBrackets', [...form.irtBrackets, { from: last ? last.from * 2 || 100000 : 0, fixed: 0, rate: 0 }]);
                  }}
                  className={secondaryBtn}
                >
                  <Plus className="w-3.5 h-3.5" /> Escalão
                </button>
              </>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F4ECE6] text-[#2C3228] uppercase tracking-wider text-[10px] text-left">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">A partir de (Kz)</th>
                  <th className="px-3 py-2">Parcela fixa (Kz)</th>
                  <th className="px-3 py-2">Taxa (%)</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {form.irtBrackets.map((b, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-[#8C827A]">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <input type="number" min={0} value={b.from} onChange={(e) => setBracket(i, 'from', Number(e.target.value))} className={smallInputCls} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="number" min={0} value={b.fixed} onChange={(e) => setBracket(i, 'fixed', Number(e.target.value))} className={smallInputCls} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="number" min={0} step="0.1" value={b.rate} onChange={(e) => setBracket(i, 'rate', Number(e.target.value))} className={smallInputCls} />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {canEdit && (
                        <button type="button" onClick={() => set('irtBrackets', form.irtBrackets.filter((_, idx) => idx !== i))} className={`${iconBtn} text-[#D3453B]`} title="Remover">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Contas financeiras" subtitle="Caixa, bancos e carteiras usadas nos lançamentos">
            <ChipList items={form.accounts} onChange={(v) => set('accounts', v)} disabled={!canEdit} placeholder="Ex: Banco BIC" />
          </Card>
          <Card title="Serviços / centros de custo" subtitle={'"Geral" agrupa os custos partilhados a ratear pelos serviços'}>
            <ChipList items={form.costCenters} onChange={(v) => set('costCenters', v)} disabled={!canEdit} placeholder="Ex: Dança" />
          </Card>
        </div>

        <Card title="Metas do painel" subtitle="Objetivos mostrados na Visão Geral">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Alunas ativas (meta)">
              <input type="number" min={0} value={form.goalActiveMembers} onChange={num('goalActiveMembers')} className={inputCls} />
            </Field>
            <Field label="Receita mensal (Kz)">
              <input type="number" min={0} value={form.goalMonthlyRevenue} onChange={num('goalMonthlyRevenue')} className={inputCls} />
            </Field>
            <Field label="Taxa de retenção (%)">
              <input type="number" min={0} max={100} value={form.goalRetentionRate} onChange={num('goalRetentionRate')} className={inputCls} />
            </Field>
          </div>
        </Card>
      </fieldset>

      {canEdit && (
        <div className="flex items-center justify-end gap-3 sticky bottom-4">
          {saved && !dirty && (
            <span className="flex items-center gap-1.5 text-[#166534] font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Configurações guardadas
            </span>
          )}
          {dirty && (
            <button type="button" onClick={() => setForm(settings)} className={secondaryBtn}>
              Descartar alterações
            </button>
          )}
          <button type="submit" disabled={saving || !dirty} className={primaryBtn}>
            <Save className="w-4 h-4 text-[#D0A68D]" /> {saving ? 'A guardar...' : 'Guardar configurações'}
          </button>
        </div>
      )}
    </form>
  );
};
