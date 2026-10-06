import { jsPDF } from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { FinanceSettings, PayrollRun, Transaction } from '../types';
import { formatKz } from './formatters';
import { monthLabel, netOfVat, vatIncluded } from './finance';
import { computeDre, computeTaxes, formatPct, marginPct, monthTransactions } from '../components/finance/financeCalc';
import { formatDatePt, localToday } from './dates';

export interface GenerateMonthlyReportPdfOptions {
  monthKey: string;
  transactions: Transaction[];
  payrollRuns: PayrollRun[];
  settings: FinanceSettings;
}

// Converte formatKz para string limpa sem caracteres especiais que possam falhar no pdf
const cleanKz = (val: number): string => {
  return formatKz(val).replace(/[\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]/g, ' ');
};

// Carrega imagem em Base64 de forma assíncrona
async function loadBase64Image(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateMonthlyReportPdf({
  monthKey,
  transactions,
  payrollRuns,
  settings,
}: GenerateMonthlyReportPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182

  // Cálculos financeiros
  const dre = computeDre(transactions, payrollRuns, settings, monthKey);
  const taxes = computeTaxes(transactions, payrollRuns, settings, monthKey);
  const s = dre.summary;
  const margin = marginPct(dre.netResult, dre.netRevenue);
  const monthTxs = monthTransactions(transactions, monthKey).sort((a, b) => a.date.localeCompare(b.date));

  // Tenta carregar o logótipo oficial
  const logoData = await loadBase64Image('/logo.png');

  // Cores institucionais Ela Fit
  const primaryDark: [number, number, number] = [44, 50, 40]; // #2C3228
  const brandRose: [number, number, number] = [140, 99, 83]; // #8C6353
  const brandGold: [number, number, number] = [208, 166, 141]; // #D0A68D
  const surfaceCream: [number, number, number] = [244, 236, 230]; // #F4ECE6
  const textMuted: [number, number, number] = [122, 112, 103]; // #7A7067
  const borderLight: [number, number, number] = [226, 218, 209]; // #E2DAD1
  const greenTone: [number, number, number] = [22, 101, 52]; // #166534
  const redTone: [number, number, number] = [153, 27, 27]; // #991B1B

  let currentY = 12;

  // --- Faixa de Destaque Superior ---
  doc.setFillColor(...primaryDark);
  doc.rect(0, 0, pageWidth, 4, 'F');
  doc.setFillColor(...brandGold);
  doc.rect(0, 4, pageWidth, 1.2, 'F');

  // --- CABEÇALHO ---
  currentY = 14;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX, currentY, 16, 16);
    } catch {
      // Fallback estilizado se falhar inserção da imagem
      doc.setFillColor(...surfaceCream);
      doc.roundedRect(marginX, currentY, 16, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...primaryDark);
      doc.text('EF', marginX + 5, currentY + 10);
    }
  } else {
    doc.setFillColor(...surfaceCream);
    doc.roundedRect(marginX, currentY, 16, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryDark);
    doc.text('EF', marginX + 5, currentY + 10);
  }

  // Títulos e Dados da Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryDark);
  doc.text(settings.companyName || 'ELA FIT — Ginásio Feminino', marginX + 20, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...brandRose);
  doc.text('GINÁSIO FEMININO • AO SEU RITMO', marginX + 20, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  const nifStr = settings.companyNif ? `NIF: ${settings.companyNif}` : 'NIF: 541 881 223';
  const addressStr = settings.companyAddress || 'Talatona, Luanda, Angola';
  doc.text(`${nifStr} • ${addressStr}`, marginX + 20, currentY + 13.5);

  // Bloco Direita: Identificador do Relatório
  const rightBoxX = pageWidth - marginX - 65;
  doc.setFillColor(...surfaceCream);
  doc.roundedRect(rightBoxX, currentY, 65, 17, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(rightBoxX, currentY, 65, 17, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryDark);
  doc.text('RELATÓRIO FINANCEIRO', rightBoxX + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...brandRose);
  doc.text(monthLabel(monthKey).toUpperCase(), rightBoxX + 4, currentY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  const now = new Date();
  const emissionStr = `Emitido: ${formatDatePt(localToday())} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.text(emissionStr, rightBoxX + 4, currentY + 14.5);

  currentY += 21;

  // Linha divisória fina
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 4;

  // --- CARDS DE RESUMO EXECUTIVO (4 COLUNAS) ---
  const cardWidth = (contentWidth - 9) / 4; // 4 cards com espaçamento de 3mm
  const cardHeight = 16.5;

  const summaryCards = [
    {
      title: 'RECEITAS COBRADAS',
      main: cleanKz(s.revenue),
      sub: `Líq: ${cleanKz(dre.netRevenue)} (s/ IVA)`,
      accent: greenTone,
    },
    {
      title: 'DESPESAS PAGAS',
      main: cleanKz(s.expenses),
      sub: `Custos: ${cleanKz(dre.totalCosts)} (s/ IVA)`,
      accent: redTone,
    },
    {
      title: 'RESULTADO OPERACIONAL',
      main: cleanKz(dre.operatingResult),
      sub: `Margem: ${formatPct(margin)}`,
      accent: dre.operatingResult >= 0 ? primaryDark : redTone,
    },
    {
      title: 'RESULTADO LÍQUIDO',
      main: cleanKz(dre.netResult),
      sub: `Após Imp. Ind. (${settings.industrialTaxRate}%)`,
      accent: brandRose,
    },
  ];

  summaryCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardWidth + 3);
    doc.setFillColor(252, 251, 248);
    doc.roundedRect(cx, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(...borderLight);
    doc.roundedRect(cx, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Mini barra colorida no topo do card
    doc.setFillColor(...c.accent);
    doc.rect(cx + 2, currentY, cardWidth - 4, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...textMuted);
    doc.text(c.title, cx + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...c.accent);
    doc.text(c.main, cx + 3, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textMuted);
    doc.text(c.sub, cx + 3, currentY + 14);
  });

  currentY += cardHeight + 5;

  // --- SEÇÃO 1: DEMONSTRAÇÃO DE RESULTADOS (DRE) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryDark);
  doc.text('1. Demonstração de Resultados do Exercício (DRE)', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Regime de caixa • Valores monetários em Kwanzas (Kz) sem IVA nos custos', marginX + 85, currentY);

  currentY += 2;

  // Montagem das linhas da DRE
  const dreTableRows: any[] = [];

  // Receitas
  dreTableRows.push([
    { content: 'RECEITAS OPERACIONAIS BRUTAS (IVA incluído)', styles: { fontStyle: 'bold', fillColor: [248, 245, 240] } },
    { content: cleanKz(dre.grossRevenue), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 245, 240] } },
    { content: '100.0%', styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 245, 240] } },
  ]);

  dre.revenueByCategory.forEach((r) => {
    const pct = dre.grossRevenue > 0 ? (r.amount / dre.grossRevenue) * 100 : 0;
    dreTableRows.push([
      `    • ${r.label}`,
      cleanKz(r.amount),
      formatPct(pct),
    ]);
  });

  dreTableRows.push([
    '    (−) IVA Liquidado nas Vendas',
    `-${cleanKz(dre.vatCollected)}`,
    formatPct(dre.grossRevenue > 0 ? (dre.vatCollected / dre.grossRevenue) * 100 : 0),
  ]);

  dreTableRows.push([
    { content: '= RECEITA OPERACIONAL LÍQUIDA', styles: { fontStyle: 'bold', textColor: greenTone, fillColor: [234, 245, 237] } },
    { content: cleanKz(dre.netRevenue), styles: { fontStyle: 'bold', halign: 'right', textColor: greenTone, fillColor: [234, 245, 237] } },
    { content: '100.0%', styles: { fontStyle: 'bold', halign: 'right', textColor: greenTone, fillColor: [234, 245, 237] } },
  ]);

  // Custos Operacionais
  dreTableRows.push([
    { content: 'CUSTOS OPERACIONAIS (Sem IVA dedutível)', styles: { fontStyle: 'bold', fillColor: [248, 245, 240] } },
    { content: `-${cleanKz(dre.totalCosts)}`, styles: { fontStyle: 'bold', halign: 'right', textColor: redTone, fillColor: [248, 245, 240] } },
    { content: formatPct(dre.netRevenue > 0 ? (dre.totalCosts / dre.netRevenue) * 100 : 0), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 245, 240] } },
  ]);

  if (dre.costsByCategory.length === 0) {
    dreTableRows.push(['    • Sem despesas operacionais registradas', '0 Kz', '0.0%']);
  } else {
    dre.costsByCategory.forEach((c) => {
      const pct = dre.netRevenue > 0 ? (c.amount / dre.netRevenue) * 100 : 0;
      dreTableRows.push([
        `    • ${c.label}`,
        `-${cleanKz(c.amount)}`,
        formatPct(pct),
      ]);
    });
  }

  // Resultados
  dreTableRows.push([
    { content: '= RESULTADO OPERACIONAL (EBITDA Operacional)', styles: { fontStyle: 'bold', fillColor: [244, 236, 230] } },
    { content: cleanKz(dre.operatingResult), styles: { fontStyle: 'bold', halign: 'right', fillColor: [244, 236, 230] } },
    { content: formatPct(dre.netRevenue > 0 ? (dre.operatingResult / dre.netRevenue) * 100 : 0), styles: { fontStyle: 'bold', halign: 'right', fillColor: [244, 236, 230] } },
  ]);

  dreTableRows.push([
    `    (−) Provisão Imposto Industrial Estimado (${settings.industrialTaxRate}%)`,
    dre.industrialTax > 0 ? `-${cleanKz(dre.industrialTax)}` : '0 Kz',
    formatPct(dre.netRevenue > 0 ? (dre.industrialTax / dre.netRevenue) * 100 : 0),
  ]);

  dreTableRows.push([
    { content: '= RESULTADO LÍQUIDO DO MÊS', styles: { fontStyle: 'bold', textColor: [255, 255, 255], fillColor: primaryDark } },
    { content: cleanKz(dre.netResult), styles: { fontStyle: 'bold', halign: 'right', textColor: brandGold, fillColor: primaryDark } },
    { content: formatPct(margin), styles: { fontStyle: 'bold', halign: 'right', textColor: [255, 255, 255], fillColor: primaryDark } },
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Rubrica / Descrição', 'Valor (Kz)', '% Rec. Líq.']],
    body: dreTableRows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2,
      textColor: primaryDark,
      lineColor: borderLight,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: primaryDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 42, halign: 'right' },
      2: { cellWidth: 26, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- SEÇÃO 2: APURAMENTO FISCAL & ENCARGOS SOCIAIS (ANGOLA) ---
  // Se estiver muito perto do fim da página, cria nova página
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryDark);
  doc.text('2. Apuramento Fiscal & Obrigações Tributárias (Angola)', marginX, currentY);
  currentY += 2;

  const totalEncargosFiscais =
    Math.max(0, taxes.vatPayable) +
    taxes.irt +
    taxes.inssEmployee +
    taxes.inssEmployer +
    taxes.withholding +
    taxes.industrialTax;

  const fiscalRows: any[] = [
    ['IVA Liquidado em Vendas (a favor do Estado)', cleanKz(taxes.vatCollected), 'AGT / Declaração Periódica'],
    ['IVA Suportado / Dedutível em Compras', cleanKz(taxes.vatDeductible), 'Crédito fiscal dedutível'],
    [
      { content: 'Saldo Líquido de IVA Apurado no Mês', styles: { fontStyle: 'bold', fillColor: [248, 245, 240] } },
      { content: cleanKz(taxes.vatPayable), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 245, 240], textColor: taxes.vatPayable > 0 ? redTone : greenTone } },
      { content: taxes.vatPayable > 0 ? 'IVA a Entregar ao Estado' : 'Crédito de IVA a Reportar', styles: { fontStyle: 'bold', fillColor: [248, 245, 240] } },
    ],
    ['IRT Retido na Folha Salarial', cleanKz(taxes.irt), 'Retenção na fonte dos colaboradores'],
    ['INSS — Contribuição dos Trabalhadores (3%)', cleanKz(taxes.inssEmployee), 'Desconto salarial para Segurança Social'],
    ['INSS — Encargo Patronal da Empresa (8%)', cleanKz(taxes.inssEmployer), 'Custo da empresa para Segurança Social'],
    ['Retenções na Fonte — Serviços Terceiros (6.5%)', cleanKz(taxes.withholding), 'Prestadores de serviços em regime independente'],
    ['Provisão para Imposto Industrial Estimado', cleanKz(taxes.industrialTax), `${settings.industrialTaxRate}% sobre resultado positivo`],
    [
      { content: 'TOTAL ESTIMADO DE OBRIGAÇÕES FISCAIS & SOCIAIS', styles: { fontStyle: 'bold', fillColor: surfaceCream } },
      { content: cleanKz(totalEncargosFiscais), styles: { fontStyle: 'bold', halign: 'right', fillColor: surfaceCream, textColor: primaryDark } },
      { content: 'Exigibilidades do Período', styles: { fontStyle: 'bold', fillColor: surfaceCream } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Imposto / Contribuição', 'Valor Apurado (Kz)', 'Enquadramento / Observações']],
    body: fiscalRows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2,
      textColor: primaryDark,
      lineColor: borderLight,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: brandRose,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 42, halign: 'right' },
      2: { cellWidth: 55, halign: 'left' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- SEÇÃO 3: EXTRATO DETALHADO DE LANÇAMENTOS DO MÊS ---
  // Abre nova página para extrato com espaço dedicado
  doc.addPage();
  currentY = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryDark);
  doc.text('3. Extrato Analítico dos Lançamentos do Mês', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`Total de ${monthTxs.length} lançamentos registados no período`, marginX + 85, currentY);

  currentY += 2;

  const txRows: RowInput[] = monthTxs.map((t) => {
    const isIncome = t.type === 'receita';
    const isPaid = t.status === 'pago';
    return [
      formatDatePt(t.date),
      t.description + (t.receiptNumber ? ` (${t.receiptNumber})` : ''),
      t.category,
      t.account,
      t.paymentMethod,
      {
        content: isIncome ? 'Receita' : 'Despesa',
        styles: { textColor: isIncome ? greenTone : redTone, fontStyle: 'bold' },
      },
      {
        content: isPaid ? 'Pago' : t.status === 'atrasado' ? 'Atrasado' : 'Pendente',
        styles: { fontStyle: 'bold' },
      },
      {
        content: (isIncome ? '+' : '-') + cleanKz(t.amount),
        styles: { halign: 'right', textColor: isIncome ? greenTone : redTone, fontStyle: 'bold' },
      },
    ];
  });

  // Linha final com o total
  if (monthTxs.length > 0) {
    const totalIn = monthTxs.filter((t) => t.type === 'receita' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0);
    const totalOut = monthTxs.filter((t) => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0);
    const netFlow = totalIn - totalOut;

    txRows.push([
      { content: 'TOTAIS LIQUIDADOS (PAGOS)', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [248, 245, 240] } },
      { content: `Entradas: ${cleanKz(totalIn)}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [248, 245, 240], textColor: greenTone } },
      { content: `Saldo: ${cleanKz(netFlow)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 245, 240], textColor: netFlow >= 0 ? primaryDark : redTone } },
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Descrição', 'Categoria', 'Conta', 'Método', 'Tipo', 'Estado', 'Valor (Kz)']],
    body: txRows.length > 0 ? txRows : [['-', 'Sem movimentações registadas para este mês', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: 1.8,
      textColor: primaryDark,
      lineColor: borderLight,
      lineWidth: 0.15,
    },
    showHead: 'everyPage',
    headStyles: {
      fillColor: primaryDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 25, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- SEÇÃO 4: TERMO DE CONFORMIDADE E ASSINATURA ---
  // Verifica se há espaço suficiente para assinaturas (cerca de 35mm), senão adiciona página
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  const declarationText =
    'Declara-se que os dados e valores apresentados neste relatório financeiro correspondem fielmente aos registos operacionais e transacionais do sistema de gestão Ela Fit para o mês indicado, elaborados para efeitos de controlo de gestão, apuramento de resultados e planeamento tributário.';
  doc.text(doc.splitTextToSize(declarationText, contentWidth), marginX, currentY);

  currentY += 12;

  // Linhas de Assinatura
  const signColWidth = 75;
  const signCol1X = marginX + 10;
  const signCol2X = pageWidth - marginX - signColWidth - 10;

  // Assinatura 1
  doc.setDrawColor(...primaryDark);
  doc.setLineWidth(0.3);
  doc.line(signCol1X, currentY + 12, signCol1X + signColWidth, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryDark);
  doc.text('DIREÇÃO FINANCEIRA / TESOURARIA', signCol1X + signColWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('Ela Fit — Gestão Empresarial', signCol1X + signColWidth / 2, currentY + 19.5, { align: 'center' });

  // Assinatura 2
  doc.line(signCol2X, currentY + 12, signCol2X + signColWidth, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryDark);
  doc.text('GERÊNCIA GERAL / ADMINISTRAÇÃO', signCol2X + signColWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('Aprovação Executiva', signCol2X + signColWidth / 2, currentY + 19.5, { align: 'center' });

  // --- RODAPÉ DE TODAS AS PÁGINAS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 9;

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 2.5, pageWidth - marginX, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(
      `Ela Fit — Ginásio Feminino • Relatório Mensal (${monthLabel(monthKey)}) • Documento Confidencial`,
      marginX,
      footerY + 1
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, footerY + 1, { align: 'right' });
  }

  return doc;
}

/**
 * Função utilitária para gerar e descarregar diretamente o ficheiro PDF do relatório mensal.
 */
export async function downloadMonthlyReportPdf(options: GenerateMonthlyReportPdfOptions): Promise<void> {
  const doc = await generateMonthlyReportPdf(options);
  const fileName = `ElaFit_Relatorio_Mensal_${options.monthKey}.pdf`;
  doc.save(fileName);
}
