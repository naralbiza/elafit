// Geração de PDFs (jsPDF + autotable) com a identidade Ela Fit.
import { jsPDF } from 'jspdf';
import autoTable, { RowInput, UserOptions } from 'jspdf-autotable';
import { FinanceSettings } from '../types';

export const BRAND = {
  dark: [48, 50, 39] as [number, number, number], // #303227
  accent: [216, 182, 159] as [number, number, number], // #D8B69F
  muted: [140, 130, 122] as [number, number, number], // #8C827A
  light: [244, 236, 230] as [number, number, number], // #F4ECE6
};

// Formato numérico para PDF (o espaço fino do pt-AO não existe nas fontes base do jsPDF)
export const pdfKz = (n: number) =>
  `${Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} Kz`;

let logoCache: string | null | undefined;

async function loadLogo(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const blob = await (await fetch('/logo.png')).blob();
    logoCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    logoCache = null;
  }
  return logoCache;
}

export interface PdfDoc {
  doc: jsPDF;
  y: number; // posição vertical atual (mm)
  width: number;
  margin: number;
}

// Cria um documento com cabeçalho: logótipo, empresa, título e subtítulo
export async function createPdf(
  title: string,
  subtitle: string,
  settings: Pick<FinanceSettings, 'companyName' | 'companyNif' | 'companyAddress' | 'companyPhone'>,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<PdfDoc> {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const margin = 14;

  const logo = await loadLogo();
  if (logo) doc.addImage(logo, 'PNG', margin, 10, 18, 18);

  const textX = logo ? margin + 22 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.dark);
  doc.text(settings.companyName || 'Ela Fit', textX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const info = [
    settings.companyNif ? `NIF: ${settings.companyNif}` : '',
    settings.companyAddress,
    settings.companyPhone,
  ].filter(Boolean).join('  •  ');
  doc.text(info, textX, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, width - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(subtitle, width - margin, 21, { align: 'right' });

  doc.setDrawColor(...BRAND.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, 31, width - margin, 31);

  return { doc, y: 38, width, margin };
}

export function sectionTitle(pdf: PdfDoc, text: string) {
  ensureSpace(pdf, 14);
  pdf.doc.setFont('helvetica', 'bold');
  pdf.doc.setFontSize(11);
  pdf.doc.setTextColor(...BRAND.dark);
  pdf.doc.text(text, pdf.margin, pdf.y);
  pdf.y += 3;
}

export function paragraph(pdf: PdfDoc, text: string, size = 9) {
  pdf.doc.setFont('helvetica', 'normal');
  pdf.doc.setFontSize(size);
  pdf.doc.setTextColor(...BRAND.muted);
  const lines = pdf.doc.splitTextToSize(text, pdf.width - pdf.margin * 2);
  ensureSpace(pdf, lines.length * 4 + 2);
  pdf.doc.text(lines, pdf.margin, pdf.y + 3);
  pdf.y += lines.length * 4 + 3;
}

export function table(pdf: PdfDoc, head: string[], body: RowInput[], options: Partial<UserOptions> = {}) {
  autoTable(pdf.doc, {
    startY: pdf.y + 2,
    head: [head],
    body,
    margin: { left: pdf.margin, right: pdf.margin },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: [44, 50, 40] },
    headStyles: { fillColor: BRAND.dark, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 249, 246] },
    ...options,
  });
  pdf.y = (pdf.doc as any).lastAutoTable.finalY + 8;
}

// Linhas "rótulo — valor" em duas colunas (ex.: resumo da DRE)
export function keyValueTable(pdf: PdfDoc, rows: [string, string][], highlightLast = false) {
  table(pdf, ['Descrição', 'Valor'], rows, {
    columnStyles: { 1: { halign: 'right', cellWidth: 45 } },
    didParseCell: (data) => {
      if (highlightLast && data.section === 'body' && data.row.index === rows.length - 1) {
        data.cell.styles.fillColor = BRAND.light;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
}

export function ensureSpace(pdf: PdfDoc, needed: number) {
  const height = pdf.doc.internal.pageSize.getHeight();
  if (pdf.y + needed > height - 16) {
    pdf.doc.addPage();
    pdf.y = 18;
  }
}

// Rodapé com paginação e data de emissão, depois guarda o ficheiro
export function savePdf(pdf: PdfDoc, filename: string) {
  const pages = pdf.doc.getNumberOfPages();
  const height = pdf.doc.internal.pageSize.getHeight();
  const issued = new Date().toLocaleString('pt-PT');
  for (let i = 1; i <= pages; i++) {
    pdf.doc.setPage(i);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.setFontSize(7);
    pdf.doc.setTextColor(...BRAND.muted);
    pdf.doc.text(`Emitido em ${issued} — Ela Fit Gestor de Negócio`, pdf.margin, height - 8);
    pdf.doc.text(`Página ${i} de ${pages}`, pdf.width - pdf.margin, height - 8, { align: 'right' });
  }
  pdf.doc.save(filename);
}
