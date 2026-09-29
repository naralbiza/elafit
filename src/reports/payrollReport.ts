// PDFs de Recursos Humanos: folha de salários mensal e recibo de vencimento individual.
import { Employee, FinanceSettings, PayrollRun } from '../types';
import { employerCost, monthLabel } from '../utils/finance';
import { formatDatePt } from '../utils/dates';
import { BRAND, createPdf, ensureSpace, keyValueTable, paragraph, pdfKz, savePdf, sectionTitle, table } from '../utils/pdf';

const round = (n: number) => Math.round(n * 100) / 100;

const slug = (s: string) =>
  (s || 'colaboradora')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const statusLabel = (s: PayrollRun['status']) => (s === 'pago' ? 'Pago' : 'Processado');

// Folha de Salários do mês (A4 horizontal)
export async function generatePayrollPdf(p: {
  monthKey: string;
  payrollRuns: PayrollRun[];
  settings: FinanceSettings;
}): Promise<void> {
  const { monthKey, settings } = p;
  const runs = p.payrollRuns
    .filter((r) => r.month === monthKey)
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'pt'));
  const label = monthLabel(monthKey);

  const pdf = await createPdf('Folha de Salários', label, settings, 'landscape');

  if (runs.length === 0) {
    paragraph(pdf, `Não existem salários processados para ${label}.`);
    savePdf(pdf, `folha-salarios-${monthKey}.pdf`);
    return;
  }

  const sum = (f: (r: PayrollRun) => number) => round(runs.reduce((s, r) => s + f(r), 0));
  const totals = {
    base: sum((r) => r.baseSalary),
    commissions: sum((r) => r.commissions),
    allowances: sum((r) => r.allowances),
    gross: sum((r) => r.gross),
    inssEmployee: sum((r) => r.inssEmployee),
    irt: sum((r) => r.irt),
    withholding: sum((r) => r.withholding),
    other: sum((r) => r.otherDeductions),
    net: sum((r) => r.net),
    inssEmployer: sum((r) => r.inssEmployer),
    cost: sum((r) => employerCost(r)),
  };

  sectionTitle(pdf, `Processamento salarial — ${label}`);
  const body = runs.map((r) => [
    r.employeeName,
    r.role,
    pdfKz(r.baseSalary),
    pdfKz(r.commissions),
    pdfKz(r.allowances),
    pdfKz(r.gross),
    pdfKz(r.inssEmployee),
    pdfKz(r.irt),
    pdfKz(r.withholding),
    pdfKz(r.otherDeductions),
    pdfKz(r.net),
    pdfKz(r.inssEmployer),
    pdfKz(employerCost(r)),
    statusLabel(r.status),
  ]);
  body.push([
    'TOTAL',
    `${runs.length} colaboradora(s)`,
    pdfKz(totals.base),
    pdfKz(totals.commissions),
    pdfKz(totals.allowances),
    pdfKz(totals.gross),
    pdfKz(totals.inssEmployee),
    pdfKz(totals.irt),
    pdfKz(totals.withholding),
    pdfKz(totals.other),
    pdfKz(totals.net),
    pdfKz(totals.inssEmployer),
    pdfKz(totals.cost),
    '',
  ]);

  table(
    pdf,
    [
      'Colaboradora',
      'Função',
      'Base',
      'Comissões',
      'Subsídios',
      'Bruto',
      `INSS ${settings.inssEmployeeRate}%`,
      'IRT',
      'Retenção',
      'Outros desc.',
      'Líquido',
      `INSS patr. ${settings.inssEmployerRate}%`,
      'Custo empresa',
      'Estado',
    ],
    body,
    {
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.6, textColor: [44, 50, 40] },
      columnStyles: Object.fromEntries(
        Array.from({ length: 11 }, (_, i) => [i + 2, { halign: 'right' as const }])
      ),
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === body.length - 1) {
          data.cell.styles.fillColor = BRAND.light;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    }
  );

  sectionTitle(pdf, 'Valores a entregar ao Estado');
  keyValueTable(
    pdf,
    [
      [`Segurança Social (INSS) — trabalhadoras ${settings.inssEmployeeRate}%`, pdfKz(totals.inssEmployee)],
      [`Segurança Social (INSS) — entidade patronal ${settings.inssEmployerRate}%`, pdfKz(totals.inssEmployer)],
      ['Total INSS a entregar', pdfKz(totals.inssEmployee + totals.inssEmployer)],
      ['IRT retido (trabalho dependente)', pdfKz(totals.irt)],
      [`Retenção na fonte — prestação de serviços ${settings.servicesWithholdingRate}%`, pdfKz(totals.withholding)],
      ['Total IRT + retenções a entregar', pdfKz(totals.irt + totals.withholding)],
      ['Total líquido a pagar às colaboradoras', pdfKz(totals.net)],
      ['Custo total para a empresa', pdfKz(totals.cost)],
    ],
    true
  );

  paragraph(
    pdf,
    'Valores calculados com a tabela de IRT e as taxas definidas em Financeiro → Configurações Fiscais. ' +
      'Documento de apoio interno — deve ser validado pelo contabilista antes das declarações oficiais.',
    8
  );

  savePdf(pdf, `folha-salarios-${monthKey}.pdf`);
}

// Recibo de vencimento individual (A4 vertical)
export async function generatePayslipPdf(p: {
  run: PayrollRun;
  employee?: Employee;
  settings: FinanceSettings;
  signatureName?: string;
}): Promise<void> {
  const { run, employee, settings } = p;
  const label = monthLabel(run.month);
  const pdf = await createPdf('Recibo de Vencimento', label, settings, 'portrait');

  sectionTitle(pdf, 'Colaboradora');
  table(pdf, ['Campo', 'Dados'], [
    ['Nome', run.employeeName],
    ['Função', run.role],
    ['Tipo de contrato', run.contractType],
    ['NIF', employee?.nif || '—'],
    ['Nº Segurança Social (INSS)', employee?.inssNumber || '—'],
    ['IBAN', employee?.iban || '—'],
    ['Data de admissão', employee?.hireDate ? formatDatePt(employee.hireDate) : '—'],
    ['Período', label],
  ], { columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } } });

  const sessions = run.classesCount + run.ptSessions;
  sectionTitle(pdf, 'Remunerações');
  table(pdf, ['Descrição', 'Qtd / Taxa', 'Valor'], [
    ['Vencimento base', '1 mês', pdfKz(run.baseSalary)],
    [
      'Comissões (aulas + sessões PT)',
      `${run.classesCount} aulas + ${run.ptSessions} PT = ${sessions} × ${pdfKz(run.bonusRate)}`,
      pdfKz(run.commissions),
    ],
    ['Subsídios', '', pdfKz(run.allowances)],
    [{ content: 'Total bruto', styles: { fontStyle: 'bold' } }, '', { content: pdfKz(run.gross), styles: { fontStyle: 'bold' } }],
  ], { columnStyles: { 2: { halign: 'right', cellWidth: 40 } } });

  sectionTitle(pdf, 'Descontos');
  table(pdf, ['Descrição', 'Taxa', 'Valor'], [
    ['Segurança Social (INSS) — trabalhadora', run.inssEmployee > 0 ? `${settings.inssEmployeeRate}%` : '—', pdfKz(run.inssEmployee)],
    ['IRT', run.irt > 0 ? 'Tabela progressiva' : '—', pdfKz(run.irt)],
    ['Retenção na fonte (prestação de serviços)', run.withholding > 0 ? `${settings.servicesWithholdingRate}%` : '—', pdfKz(run.withholding)],
    ['Outros descontos', '', pdfKz(run.otherDeductions)],
    [
      { content: 'Total descontos', styles: { fontStyle: 'bold' } },
      '',
      { content: pdfKz(run.inssEmployee + run.irt + run.withholding + run.otherDeductions), styles: { fontStyle: 'bold' } },
    ],
  ], { columnStyles: { 2: { halign: 'right', cellWidth: 40 } } });

  keyValueTable(pdf, [['LÍQUIDO A RECEBER', pdfKz(run.net)]], true);

  paragraph(
    pdf,
    `Encargo patronal INSS (${settings.inssEmployerRate}%, suportado pela empresa, não descontado): ${pdfKz(run.inssEmployer)}. ` +
      `Estado: ${statusLabel(run.status)}${run.paidAt ? ` em ${formatDatePt(run.paidAt)}` : ''}.`,
    8
  );

  // Assinaturas
  ensureSpace(pdf, 30);
  const { doc, margin, width } = pdf;
  const y = pdf.y + 18;
  const lineW = 65;
  doc.setDrawColor(...BRAND.dark);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + lineW, y);
  doc.line(width - margin - lineW, y, width - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('A Colaboradora', margin + lineW / 2, y + 5, { align: 'center' });
  doc.text(run.employeeName, margin + lineW / 2, y + 9, { align: 'center' });
  doc.text('Administração', width - margin - lineW / 2, y + 5, { align: 'center' });
  if (p.signatureName) doc.text(p.signatureName, width - margin - lineW / 2, y + 9, { align: 'center' });
  pdf.y = y + 14;

  savePdf(pdf, `recibo-vencimento-${slug(run.employeeName)}-${run.month}.pdf`);
}
