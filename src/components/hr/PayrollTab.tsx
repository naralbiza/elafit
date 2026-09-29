import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Download, Wallet, Cog, Undo2, Info } from 'lucide-react';
import { Employee, PayrollRun } from '../../types';
import { useData } from '../../data/DataContext';
import { newId } from '../../data/repository';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { computePayroll, currentMonthKey, employerCost, isInMonth, monthLabel, shiftMonth } from '../../utils/finance';
import { generatePayrollPdf } from '../../reports/payrollReport';
import { PayPayrollModal } from './PayPayrollModal';
import { cardCls, primaryBtn, secondaryBtn } from './hrShared';

interface PayrollInputs {
  classes: string;
  pt: string;
  allowances: string;
  other: string;
}

type Figures = Omit<PayrollRun, 'id' | 'status' | 'paidAt'>;

interface Row {
  key: string;
  employee?: Employee;
  run?: PayrollRun;
  inputs?: PayrollInputs;
  figures: Figures;
  dirty: boolean; // valores alterados face ao processamento gravado
}

const toNum = (s: string) => {
  const n = Number(String(s).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const round = (n: number) => Math.round(n * 100) / 100;

interface PayrollTabProps {
  onOpenPayslip: (run: PayrollRun) => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({ onOpenPayslip }) => {
  const { employees, payrollRuns, scheduledClasses, settings, actions } = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [edits, setEdits] = useState<Record<string, PayrollInputs>>({});
  const [processing, setProcessing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  // As edições são por mês
  useEffect(() => setEdits({}), [monthKey]);

  const monthRuns = useMemo(() => payrollRuns.filter((r) => r.month === monthKey), [payrollRuns, monthKey]);

  const rows = useMemo<Row[]>(() => {
    const runByEmployee = new Map(monthRuns.filter((r) => r.employeeId).map((r) => [r.employeeId as string, r]));

    const prefill = (emp: Employee, run?: PayrollRun): PayrollInputs => {
      if (run) {
        return {
          classes: String(run.classesCount),
          pt: String(run.ptSessions),
          allowances: String(run.allowances),
          other: String(run.otherDeductions),
        };
      }
      const given = scheduledClasses.filter(
        (c) => c.status === 'realizada' && c.instructorId === emp.id && isInMonth(c.date, monthKey)
      ).length;
      return {
        classes: String(given || emp.classesGivenThisMonth || 0),
        pt: String(emp.ptSessionsThisMonth || 0),
        allowances: String(emp.allowances || 0),
        other: '0',
      };
    };

    const list: Row[] = [...employees]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      .map((emp) => {
        const run = runByEmployee.get(emp.id);
        if (run?.status === 'pago') return { key: emp.id, employee: emp, run, figures: run, dirty: false };
        const base = prefill(emp, run);
        const inputs = edits[emp.id] ?? base;
        const figures = computePayroll(emp, settings, monthKey, {
          classesCount: toNum(inputs.classes),
          ptSessions: toNum(inputs.pt),
          allowances: toNum(inputs.allowances),
          otherDeductions: toNum(inputs.other),
        });
        const dirty = Boolean(
          run &&
            (run.net !== figures.net || run.gross !== figures.gross || run.otherDeductions !== figures.otherDeductions)
        );
        return { key: emp.id, employee: emp, run, inputs, figures, dirty };
      });

    // Salários gravados de colaboradoras entretanto apagadas
    const known = new Set(employees.map((e) => e.id));
    for (const run of monthRuns) {
      if (!run.employeeId || !known.has(run.employeeId)) list.push({ key: run.id, run, figures: run, dirty: false });
    }
    return list;
  }, [employees, monthRuns, scheduledClasses, settings, monthKey, edits]);

  const setInput = (row: Row, field: keyof PayrollInputs, value: string) => {
    if (!row.inputs) return;
    setEdits((prev) => ({ ...prev, [row.key]: { ...row.inputs!, [field]: value } }));
  };

  const totals = useMemo(() => {
    const sum = (f: (x: Figures) => number) => round(rows.reduce((s, r) => s + f(r.figures), 0));
    return {
      gross: sum((x) => x.gross),
      inssEmployee: sum((x) => x.inssEmployee),
      inssEmployer: sum((x) => x.inssEmployer),
      irt: sum((x) => x.irt + x.withholding),
      net: sum((x) => x.net),
      cost: sum((x) => employerCost(x)),
    };
  }, [rows]);

  const toProcess = rows.filter((r) => r.employee && r.run?.status !== 'pago');
  const processedRuns = monthRuns.filter((r) => r.status === 'processado');
  const label = monthLabel(monthKey);

  const handleProcess = async () => {
    if (!toProcess.length) return;
    const runs: PayrollRun[] = toProcess.map((r) => ({
      ...r.figures,
      id: r.run?.id ?? newId('PR'),
      status: 'processado',
    }));
    setProcessing(true);
    const ok = await actions.savePayrollRuns(runs);
    setProcessing(false);
    if (ok) setEdits({});
  };

  const handleCancel = async (run: PayrollRun) => {
    if (!window.confirm(`Anular o processamento de ${run.employeeName} (${label})?`)) return;
    const ok = await actions.deletePayrollRun(run.id);
    if (ok && run.employeeId) {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[run.employeeId as string];
        return next;
      });
    }
  };

  const handlePdf = async () => {
    if (!monthRuns.length) {
      window.alert(`Processe primeiro os salários de ${label} para gerar a folha salarial.`);
      return;
    }
    setPdfBusy(true);
    try {
      await generatePayrollPdf({ monthKey, payrollRuns, settings });
    } catch (e: any) {
      window.alert(e?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  const hasDirty = rows.some((r) => r.dirty);
  const numCls =
    'w-16 px-2 py-1 bg-[#FBF9F6] border border-[#E2DAD1] rounded-lg text-xs text-[#2C3228] text-right focus:outline-none focus:border-[#D0A68D] disabled:opacity-60';
  const wideNumCls = numCls.replace('w-16', 'w-24');

  return (
    <div className="space-y-4">
      <div className={`${cardCls} space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2C3228]">Processamento de Salários & Impostos</h3>
            <p className="text-xs text-[#7A7067]">
              Vencimento base + comissões de aulas e PTs + subsídios, com INSS, IRT e retenção na fonte.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl p-1 self-start">
            <button onClick={() => setMonthKey((m) => shiftMonth(m, -1))} className="p-1.5 rounded-lg hover:bg-[#F4ECE6]" title="Mês anterior">
              <ChevronLeft className="w-4 h-4 text-[#2C3228]" />
            </button>
            <span className="text-xs font-bold text-[#2C3228] min-w-[130px] text-center">{label}</span>
            <button onClick={() => setMonthKey((m) => shiftMonth(m, 1))} className="p-1.5 rounded-lg hover:bg-[#F4ECE6]" title="Mês seguinte">
              <ChevronRight className="w-4 h-4 text-[#2C3228]" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleProcess} disabled={processing || toProcess.length === 0} className={primaryBtn}>
            <Cog className="w-4 h-4 text-[#D0A68D]" />
            <span>{processing ? 'A processar...' : `Processar salários de ${label}`}</span>
          </button>
          <button onClick={() => setPayOpen(true)} disabled={processedRuns.length === 0 || hasDirty} className={secondaryBtn}
            title={hasDirty ? 'Há alterações por processar' : undefined}>
            <Wallet className="w-4 h-4" />
            <span>Pagar salários processados ({processedRuns.length})</span>
          </button>
          <button onClick={handlePdf} disabled={pdfBusy} className={secondaryBtn}>
            <Download className="w-4 h-4" />
            <span>{pdfBusy ? 'A gerar...' : 'PDF da folha salarial'}</span>
          </button>
        </div>
        {hasDirty && (
          <p className="text-[11px] text-[#92600A] bg-[#FEF6E7] border border-[#F3E1BC] rounded-lg px-3 py-2">
            Há valores alterados face ao processamento gravado. Volte a processar antes de pagar.
          </p>
        )}

        {/* Totais */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total bruto', value: totals.gross },
            { label: `INSS trabalhadoras (${settings.inssEmployeeRate}%)`, value: totals.inssEmployee },
            { label: `INSS patronal (${settings.inssEmployerRate}%)`, value: totals.inssEmployer },
            { label: 'IRT + retenções', value: totals.irt },
            { label: 'Total líquido', value: totals.net, strong: true },
            { label: 'Custo total empresa', value: totals.cost, strong: true },
          ].map((t) => (
            <div key={t.label} className={`p-3 rounded-xl border ${t.strong ? 'bg-[#2C3228] border-[#2C3228]' : 'bg-[#FBF9F6] border-[#ECE5DE]'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${t.strong ? 'text-[#D0A68D]' : 'text-[#8C827A]'}`}>{t.label}</p>
              <p className={`font-serif text-base font-bold mt-0.5 ${t.strong ? 'text-white' : 'text-[#2C3228]'}`}>{formatKz(t.value)}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#7A7067] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#D0A68D]" />
          A tabela de IRT e as taxas de INSS e retenção na fonte vêm de Financeiro → Configurações Fiscais e devem ser validadas
          pelo contabilista.
        </p>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#ECE5DE] shadow-xs overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-xs text-[#7A7067]">Ainda não há colaboradoras registadas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4ECE6] text-[#2C3228] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-3">Colaboradora</th>
                  <th className="px-2 py-3 text-right">Aulas</th>
                  <th className="px-2 py-3 text-right">PTs</th>
                  <th className="px-2 py-3 text-right">Subsídios</th>
                  <th className="px-2 py-3 text-right">Outros desc.</th>
                  <th className="px-3 py-3 text-right">Bruto</th>
                  <th className="px-3 py-3 text-right">INSS trab.</th>
                  <th className="px-3 py-3 text-right">IRT / Ret.</th>
                  <th className="px-3 py-3 text-right">Líquido</th>
                  <th className="px-3 py-3 text-right">INSS patr.</th>
                  <th className="px-3 py-3 text-right">Custo empresa</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                {rows.map((row) => {
                  const f = row.figures;
                  const locked = !row.inputs;
                  const isProvider = f.contractType === 'Prestação de Serviços (Recibos Verdes)';
                  return (
                    <tr key={row.key} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="px-3 py-3">
                        <div className="font-bold text-[#2C3228]">{f.employeeName}</div>
                        <div className="text-[10px] text-[#7A7067]">
                          {f.role} • Base {formatKz(f.baseSalary)} • {formatKz(f.bonusRate)}/sessão
                        </div>
                      </td>
                      {locked ? (
                        <>
                          <td className="px-2 py-3 text-right">{f.classesCount}</td>
                          <td className="px-2 py-3 text-right">{f.ptSessions}</td>
                          <td className="px-2 py-3 text-right">{formatKz(f.allowances)}</td>
                          <td className="px-2 py-3 text-right">{formatKz(f.otherDeductions)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-3 text-right">
                            <input type="number" min="0" step="1" value={row.inputs!.classes} onChange={(e) => setInput(row, 'classes', e.target.value)} className={numCls} />
                          </td>
                          <td className="px-2 py-3 text-right">
                            <input type="number" min="0" step="1" value={row.inputs!.pt} onChange={(e) => setInput(row, 'pt', e.target.value)} className={numCls} />
                          </td>
                          <td className="px-2 py-3 text-right">
                            <input type="number" min="0" step="any" value={row.inputs!.allowances} onChange={(e) => setInput(row, 'allowances', e.target.value)} className={wideNumCls} />
                          </td>
                          <td className="px-2 py-3 text-right">
                            <input type="number" min="0" step="any" value={row.inputs!.other} onChange={(e) => setInput(row, 'other', e.target.value)} className={wideNumCls} />
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3 text-right font-semibold text-[#2C3228]">{formatKz(f.gross)}</td>
                      <td className="px-3 py-3 text-right text-[#9F1D1D]">{formatKz(f.inssEmployee)}</td>
                      <td className="px-3 py-3 text-right text-[#9F1D1D]" title={isProvider ? `Retenção na fonte ${settings.servicesWithholdingRate}%` : 'IRT'}>
                        {formatKz(f.irt + f.withholding)}
                        <div className="text-[9px] text-[#8C827A]">{isProvider ? `Retenção ${settings.servicesWithholdingRate}%` : 'IRT'}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-serif text-sm font-bold text-[#2C3228]">{formatKz(f.net)}</td>
                      <td className="px-3 py-3 text-right text-[#61574E]">{formatKz(f.inssEmployer)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-[#2C3228]">{formatKz(employerCost(f))}</td>
                      <td className="px-3 py-3">
                        {!row.run ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4ECE6] text-[#7A7067]">Por processar</span>
                        ) : row.run.status === 'pago' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5ED] text-[#166534] whitespace-nowrap">
                            Pago{row.run.paidAt ? ` ${formatDatePt(row.run.paidAt)}` : ''}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${row.dirty ? 'bg-[#FEF6E7] text-[#92600A]' : 'bg-[#EEF2FB] text-[#1E3A8A]'}`}>
                            {row.dirty ? 'Alterado' : 'Processado'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {row.run && (
                            <button
                              onClick={() => onOpenPayslip(row.run!)}
                              className="px-2.5 py-1 bg-[#2C3228] text-white rounded-lg text-[10px] font-bold hover:bg-[#3E4639] flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-[#D0A68D]" />
                              <span>Recibo</span>
                            </button>
                          )}
                          {row.run?.status === 'processado' && (
                            <button
                              onClick={() => handleCancel(row.run!)}
                              className="px-2.5 py-1 bg-[#F4ECE6] text-[#2C3228] rounded-lg text-[10px] font-bold hover:bg-[#FDECEC] hover:text-[#9F1D1D] flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Anular</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PayPayrollModal isOpen={payOpen} monthKey={monthKey} runs={processedRuns} onClose={() => setPayOpen(false)} />
    </div>
  );
};
