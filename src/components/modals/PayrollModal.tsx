import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { PayrollRun } from '../../types';
import { useData } from '../../data/DataContext';
import { useAuth } from '../../auth/AuthContext';
import { formatKz } from '../../utils/formatters';
import { formatDatePt } from '../../utils/dates';
import { employerCost, monthLabel } from '../../utils/finance';
import { generatePayslipPdf } from '../../reports/payrollReport';

interface PayrollModalProps {
  run: PayrollRun | null;
  onClose: () => void;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({ run, onClose }) => {
  const { employees, settings } = useData();
  const { profile } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (!run) return null;

  const employee = employees.find((e) => e.id === run.employeeId);
  const totalDeductions = run.inssEmployee + run.irt + run.withholding + run.otherDeductions;
  const sessions = run.classesCount + run.ptSessions;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePayslipPdf({ run, employee, settings, signatureName: profile?.full_name });
    } catch (e: any) {
      window.alert(e?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const Row = ({ label, detail, value, tone }: { label: string; detail?: string; value: number; tone?: 'minus' | 'plus' }) => (
    <tr>
      <td className="p-3 font-semibold text-[#2C3228]">{label}</td>
      <td className="p-3 text-[#61574E]">{detail}</td>
      <td className={`p-3 text-right font-bold ${tone === 'minus' ? 'text-[#9F1D1D]' : tone === 'plus' ? 'text-[#3A6B4C]' : 'text-[#2C3228]'}`}>
        {tone === 'minus' && value > 0 ? '−' : ''}
        {formatKz(value)}
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-8 shadow-2xl border border-[#E2DAD1] relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4 border-b border-[#E8E2DC] pb-4 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] p-1 flex items-center justify-center border border-[#E4DED8] shrink-0">
                <img src="/logo.png" alt="Ela Fit" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-[#2C3228]">{settings.companyName}</h1>
                <p className="text-[10px] text-[#7A7067]">
                  {[settings.companyNif && `NIF: ${settings.companyNif}`, settings.companyAddress].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="px-3 py-1 bg-[#2C3228] text-white rounded-lg text-[10px] font-bold inline-block">RECIBO DE VENCIMENTO</span>
              <p className="text-xs font-bold text-[#2C3228] mt-1">{monthLabel(run.month)}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${run.status === 'pago' ? 'text-[#166534]' : 'text-[#92600A]'}`}>
                {run.status === 'pago' ? `Pago${run.paidAt ? ` em ${formatDatePt(run.paidAt)}` : ''}` : 'Processado — por pagar'}
              </p>
            </div>
          </div>

          {/* Colaboradora */}
          <div className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[#8C827A] uppercase font-bold">Colaboradora</p>
              <p className="font-serif text-base font-bold text-[#2C3228]">{run.employeeName}</p>
              <p className="text-[#61574E] text-[11px]">{run.role} • {run.contractType}</p>
            </div>
            <div className="sm:text-right text-[11px] text-[#61574E] space-y-0.5">
              <p>NIF: <span className="font-semibold text-[#2C3228]">{employee?.nif || '—'}</span></p>
              <p>Nº INSS: <span className="font-semibold text-[#2C3228]">{employee?.inssNumber || '—'}</span></p>
              <p>IBAN: <span className="font-semibold text-[#2C3228]">{employee?.iban || '—'}</span></p>
              {employee?.hireDate && <p>Admissão: {formatDatePt(employee.hireDate)}</p>}
            </div>
          </div>

          {/* Remunerações e descontos */}
          <div className="border border-[#ECE5DE] rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[420px]">
              <thead className="bg-[#F4ECE6] text-[#2C3228] font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Qtd / Taxa</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE4]">
                <Row label="Vencimento base" detail="1 mês" value={run.baseSalary} />
                <Row
                  label="Comissões (aulas + PTs)"
                  detail={`${run.classesCount} aulas + ${run.ptSessions} PT = ${sessions} × ${formatKz(run.bonusRate)}`}
                  value={run.commissions}
                  tone="plus"
                />
                <Row label="Subsídios" value={run.allowances} tone="plus" />
                <tr className="bg-[#FBF9F6]">
                  <td className="p-3 font-bold text-[#2C3228]">Total bruto</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-bold text-[#2C3228]">{formatKz(run.gross)}</td>
                </tr>
                <Row
                  label="Segurança Social (INSS) — trabalhadora"
                  detail={run.inssEmployee > 0 ? `${settings.inssEmployeeRate}%` : '—'}
                  value={run.inssEmployee}
                  tone="minus"
                />
                <Row label="IRT" detail={run.irt > 0 ? 'Tabela progressiva' : '—'} value={run.irt} tone="minus" />
                <Row
                  label="Retenção na fonte"
                  detail={run.withholding > 0 ? `${settings.servicesWithholdingRate}% (prestação de serviços)` : '—'}
                  value={run.withholding}
                  tone="minus"
                />
                <Row label="Outros descontos" value={run.otherDeductions} tone="minus" />
                <tr className="bg-[#FBF9F6]">
                  <td className="p-3 font-bold text-[#2C3228]">Total descontos</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-bold text-[#9F1D1D]">{formatKz(totalDeductions)}</td>
                </tr>
                <tr className="bg-[#2C3228] text-white">
                  <td className="p-3 font-bold text-sm">LÍQUIDO A RECEBER</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-bold text-base text-[#D0A68D]">{formatKz(run.net)}</td>
                </tr>
              </tbody>
            </table></div>
          </div>

          <p className="text-[11px] text-[#7A7067]">
            Encargo patronal INSS ({settings.inssEmployerRate}%, suportado pela empresa): <strong className="text-[#2C3228]">{formatKz(run.inssEmployer)}</strong>
            {' • '}Custo total para a empresa: <strong className="text-[#2C3228]">{formatKz(employerCost(run))}</strong>
          </p>

          {/* Assinaturas */}
          <div className="pt-6 border-t border-[#E8E2DC] flex items-end justify-between gap-6">
            <div className="text-center">
              <div className="w-40 border-b border-[#2C3228] mb-1"></div>
              <p className="text-[9px] text-[#8C827A] uppercase font-bold">A Colaboradora</p>
              <p className="text-[10px] text-[#2C3228]">{run.employeeName}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-[#2C3228] mb-1"></div>
              <p className="text-[9px] text-[#8C827A] uppercase font-bold">Administração</p>
              {profile?.full_name && <p className="text-[10px] text-[#2C3228] font-bold">{profile.full_name}</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#ECE5DE] flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-[#F4ECE6] text-[#2C3228] font-bold rounded-xl">
            Fechar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 bg-[#2C3228] text-white font-bold rounded-xl hover:bg-[#3E4639] flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#D0A68D]" />
            <span>{downloading ? 'A gerar...' : 'Descarregar PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
