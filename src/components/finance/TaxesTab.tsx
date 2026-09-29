import React, { useMemo } from 'react';
import { Landmark, Receipt, Users, Building2, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../../data/DataContext';
import { Transaction } from '../../types';
import { formatKz } from '../../utils/formatters';
import { monthLabel, sumAmount } from '../../utils/finance';
import { TAX_CATEGORY, computeDre, computeTaxes, findTaxPayments, formatPct, taxDescription, taxRef, yearToDate } from './financeCalc';
import { Card, secondaryBtn } from './ui';

interface Props {
  monthKey: string;
  onRegisterPayment: (initial: Partial<Transaction>) => void;
}

const Row: React.FC<{ label: string; value: number; strong?: boolean; hint?: string }> = ({ label, value, strong, hint }) => (
  <div className={`flex justify-between gap-3 py-1.5 ${strong ? 'font-bold text-[#2C3228] border-t border-[#ECE5DE] pt-2 mt-1' : 'text-[#61574E]'}`}>
    <span>
      {label}
      {hint && <span className="block text-[10px] text-[#8C827A] font-normal">{hint}</span>}
    </span>
    <span className="whitespace-nowrap">{formatKz(value)}</span>
  </div>
);

const PaymentStatus: React.FC<{ paid: number; expected: number }> = ({ paid, expected }) =>
  expected <= 0 ? null : paid > 0 ? (
    <p className="flex items-center gap-1.5 text-[11px] text-[#166534] font-semibold mt-2">
      <CheckCircle2 className="w-3.5 h-3.5" /> Pagamento registado: {formatKz(paid)}
    </p>
  ) : (
    <p className="flex items-center gap-1.5 text-[11px] text-[#92400E] font-semibold mt-2">
      <AlertCircle className="w-3.5 h-3.5" /> Pagamento ainda não registado
    </p>
  );

export const TaxesTab: React.FC<Props> = ({ monthKey, onRegisterPayment }) => {
  const { transactions, payrollRuns, settings } = useData();
  const label = monthLabel(monthKey);

  const taxes = useMemo(() => computeTaxes(transactions, payrollRuns, settings, monthKey), [transactions, payrollRuns, settings, monthKey]);
  const dre = useMemo(() => computeDre(transactions, payrollRuns, settings, monthKey), [transactions, payrollRuns, settings, monthKey]);
  const ytd = useMemo(() => yearToDate(transactions, payrollRuns, settings, monthKey), [transactions, payrollRuns, settings, monthKey]);

  const ivaPaid = sumAmount(findTaxPayments(transactions, 'IVA', monthKey));
  const iiPaid = sumAmount(findTaxPayments(transactions, 'II', monthKey));

  // Pagamentos ligados aos salários do mês, separados por palavra-chave na descrição
  const linked = taxes.payrollTaxPayments;
  const match = (re: RegExp) => sumAmount(linked.filter((t) => re.test(`${t.description} ${t.notes}`)));
  const inssPaid = match(/INSS|Segurança Social/i);
  const irtPaid = match(/IRT/i);
  const whPaid = match(/Reten[çc][ãa]o/i);
  const linkedUnmatched = sumAmount(linked) - inssPaid - irtPaid - whPaid;

  const inssTotal = taxes.inssEmployee + taxes.inssEmployer;
  const firstRunId = taxes.runs[0]?.id;

  const base = (description: string, amount: number, extra: Partial<Transaction>): Partial<Transaction> => ({
    type: 'despesa',
    category: TAX_CATEGORY,
    description,
    amount: Math.round(Math.max(0, amount) * 100) / 100,
    vatRate: 0,
    costCenter: settings.costCenters.includes('Geral') ? 'Geral' : undefined,
    paymentMethod: 'Transferência Bancária',
    status: 'pago',
    ...extra,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={<><Receipt className="w-4 h-4 text-[#D0A68D]" /> IVA — {label}</>}
          subtitle="Imposto sobre o Valor Acrescentado (lançamentos pagos)"
          actions={
            taxes.vatPayable > 0 && (
              <button
                className={secondaryBtn}
                onClick={() =>
                  onRegisterPayment(
                    base(taxDescription('IVA a pagar', monthKey, 'AGT'), taxes.vatPayable - ivaPaid, { notes: taxRef('IVA', monthKey) })
                  )
                }
              >
                Registar pagamento
              </button>
            )
          }
        >
          <div className="text-xs">
            <Row label="IVA liquidado (vendas)" value={taxes.vatCollected} />
            <Row label="(−) IVA dedutível (compras)" value={taxes.vatDeductible} />
            <Row label={taxes.vatPayable >= 0 ? '= IVA a pagar' : '= IVA a recuperar'} value={Math.abs(taxes.vatPayable)} strong />
          </div>
          <PaymentStatus paid={ivaPaid} expected={taxes.vatPayable} />
        </Card>

        <Card
          title={<><Building2 className="w-4 h-4 text-[#D0A68D]" /> Imposto Industrial (estimativa)</>}
          subtitle={`Taxa ${formatPct(settings.industrialTaxRate, 1)} sobre o resultado tributável`}
          actions={
            dre.industrialTax > 0 && (
              <button
                className={secondaryBtn}
                onClick={() =>
                  onRegisterPayment(
                    base(taxDescription('Imposto Industrial', monthKey, 'AGT'), dre.industrialTax - iiPaid, { notes: taxRef('II', monthKey) })
                  )
                }
              >
                Registar pagamento
              </button>
            )
          }
        >
          <div className="text-xs">
            <Row label={`Resultado operacional de ${label}`} value={dre.operatingResult} />
            <Row label="Imposto Industrial estimado do mês" value={dre.industrialTax} strong />
            <Row label={`Resultado acumulado (jan. a ${label})`} value={ytd.result} hint={`${ytd.months} mês(es) do ano`} />
            <Row label="Imposto Industrial estimado acumulado" value={ytd.industrialTax} strong />
          </div>
          <PaymentStatus paid={iiPaid} expected={dre.industrialTax} />
        </Card>
      </div>

      <Card
        title={<><Users className="w-4 h-4 text-[#D0A68D]" /> Impostos e contribuições sobre salários — {label}</>}
        subtitle={`${taxes.runs.length} processamento(s) salarial(is) neste mês`}
      >
        {taxes.runs.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <PayrollTaxBox
              title="Segurança Social (INSS)"
              lines={[
                [`Trabalhador (${formatPct(settings.inssEmployeeRate, 1)})`, taxes.inssEmployee],
                [`Entidade patronal (${formatPct(settings.inssEmployerRate, 1)})`, taxes.inssEmployer],
              ]}
              total={inssTotal}
              paid={inssPaid}
              onRegister={() => onRegisterPayment(base(taxDescription('Segurança Social (INSS)', monthKey, 'INSS'), inssTotal, { payrollRunId: firstRunId }))}
            />
            <PayrollTaxBox
              title="IRT retido"
              lines={[['Imposto sobre o Rendimento do Trabalho', taxes.irt]]}
              total={taxes.irt}
              paid={irtPaid}
              onRegister={() => onRegisterPayment(base(taxDescription('IRT retido', monthKey, 'AGT'), taxes.irt, { payrollRunId: firstRunId }))}
            />
            <PayrollTaxBox
              title="Retenção na fonte (serviços)"
              lines={[[`Prestadoras de serviços (${formatPct(settings.servicesWithholdingRate, 1)})`, taxes.withholding]]}
              total={taxes.withholding}
              paid={whPaid}
              onRegister={() => onRegisterPayment(base(taxDescription('Retenção na fonte', monthKey, 'AGT'), taxes.withholding, { payrollRunId: firstRunId }))}
            />
          </div>
        ) : (
          <p className="text-xs text-[#8C827A]">Sem salários processados em {label} — não há IRT, INSS ou retenções a entregar.</p>
        )}
        {linkedUnmatched > 0 && (
          <p className="text-[11px] text-[#61574E] mt-3">
            Outros pagamentos de impostos associados aos salários do mês: <strong>{formatKz(linkedUnmatched)}</strong>.
          </p>
        )}
      </Card>

      <Card title={<><Landmark className="w-4 h-4 text-[#D0A68D]" /> Taxas em uso</>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            ['IVA', settings.ivaRate],
            ['Imposto Industrial', settings.industrialTaxRate],
            ['INSS trabalhador', settings.inssEmployeeRate],
            ['INSS patronal', settings.inssEmployerRate],
            ['Retenção na fonte', settings.servicesWithholdingRate],
          ].map(([l, v]) => (
            <div key={l as string} className="p-3 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-[#8C827A] font-bold">{l}</p>
              <p className="font-serif text-lg font-bold text-[#2C3228]">{formatPct(v as number, 1)}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#8C827A] mt-3">
          IRT calculado pela tabela de escalões ({settings.irtBrackets.length} escalões) definida nas Configurações Fiscais.
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-[#8C6353] mt-2">
          <Info className="w-3.5 h-3.5" /> Confirme prazos e enquadramento fiscal com o seu contabilista.
        </p>
      </Card>
    </div>
  );
};

const PayrollTaxBox: React.FC<{ title: string; lines: [string, number][]; total: number; paid: number; onRegister: () => void }> = ({
  title,
  lines,
  total,
  paid,
  onRegister,
}) => (
  <div className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl flex flex-col">
    <p className="font-bold text-[#2C3228] mb-1">{title}</p>
    {lines.map(([l, v]) => <Row key={l} label={l} value={v} />)}
    <Row label="Total a entregar" value={total} strong />
    <PaymentStatus paid={paid} expected={total} />
    {total > 0 && paid <= 0 && (
      <button onClick={onRegister} className={`${secondaryBtn} mt-2 self-start`}>Registar pagamento</button>
    )}
  </div>
);
