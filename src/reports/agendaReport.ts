// PDF da agenda semanal de aulas (Agenda).
import { FinanceSettings, ScheduledClass, WEEK_DAYS } from '../types';
import { addDays, formatDatePt, formatWeekRange, weekDates } from '../utils/dates';
import { createPdf, paragraph, savePdf, sectionTitle, table } from '../utils/pdf';

const STATUS_LABEL: Record<ScheduledClass['status'], string> = {
  planeada: 'Planeada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const minutes = (hhmm: string) => {
  const [h, m] = (hhmm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatHours = (totalMin: number) => {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

export async function generateWeeklyAgendaPdf(p: {
  weekStart: string;
  sessions: ScheduledClass[];
  settings: FinanceSettings;
  includeLessonPlans?: boolean;
}): Promise<void> {
  const { weekStart, settings, includeLessonPlans } = p;
  const weekEnd = addDays(weekStart, 6);
  const sessions = p.sessions
    .filter((s) => s.date >= weekStart && s.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const pdf = await createPdf('Agenda Semanal de Aulas', formatWeekRange(weekStart), settings, 'landscape');

  const active = sessions.filter((s) => s.status !== 'cancelada');
  const totalMin = active.reduce((sum, s) => sum + Math.max(0, minutes(s.endTime) - minutes(s.startTime)), 0);
  const cancelled = sessions.length - active.length;
  paragraph(
    pdf,
    `Total: ${active.length} aula${active.length === 1 ? '' : 's'} • ${formatHours(totalMin)} de aulas` +
      (cancelled ? ` • ${cancelled} cancelada${cancelled === 1 ? '' : 's'}` : ''),
    10
  );

  weekDates(weekStart).forEach((date, i) => {
    const day = sessions.filter((s) => s.date === date);
    sectionTitle(pdf, `${WEEK_DAYS[i]} — ${formatDatePt(date)}`);
    if (day.length === 0) {
      paragraph(pdf, 'Sem aulas');
      return;
    }
    table(
      pdf,
      ['Hora', 'Aula', 'Categoria', 'Instrutora', 'Sala', 'Inscritas/Lotação', 'Estado'],
      day.map((s) => [
        `${s.startTime} - ${s.endTime}`,
        s.title,
        s.category,
        s.instructorName || '—',
        s.room || '—',
        `${s.attendees.length}/${s.capacity}`,
        STATUS_LABEL[s.status] ?? s.status,
      ]),
      {
        didParseCell: (data) => {
          if (data.section === 'body' && day[data.row.index]?.status === 'cancelada') {
            data.cell.styles.textColor = [160, 74, 66];
            data.cell.styles.fontStyle = 'italic';
          }
        },
      }
    );
  });

  if (includeLessonPlans) {
    pdf.doc.addPage();
    pdf.y = 18;
    sectionTitle(pdf, 'Planos de aula');
    pdf.y += 3;
    const withPlans = sessions.filter((s) => s.lessonPlan && s.lessonPlan.trim());
    if (withPlans.length === 0) paragraph(pdf, 'Nenhuma aula desta semana tem plano de aula registado.');
    withPlans.forEach((s) => {
      paragraph(
        pdf,
        `${WEEK_DAYS[weekDates(weekStart).indexOf(s.date)] ?? ''} ${formatDatePt(s.date)} • ${s.startTime} - ${s.endTime} • ${s.title}` +
          (s.instructorName ? ` (${s.instructorName})` : ''),
        10
      );
      paragraph(pdf, s.lessonPlan.trim());
      pdf.y += 2;
    });
  }

  savePdf(pdf, `agenda-semana-${weekStart}.pdf`);
}
