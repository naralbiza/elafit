// Peças visuais partilhadas pelos separadores do módulo Financeiro.
import React from 'react';
import { PaymentStatus } from '../../types';

export const inputCls =
  'w-full px-3 py-2 bg-[#FCFBF8] border border-[#DED9D1] rounded-lg text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#8C6353]';

export const smallInputCls =
  'px-3 py-1.5 bg-white border border-[#DED9D1] rounded-lg text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#8C6353]';

export const primaryBtn =
  'px-4 py-2 bg-[#303227] text-white hover:bg-[#44463a] rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60';

export const secondaryBtn =
  'px-3 py-2 bg-transparent hover:bg-[#F3EEE8] text-[#2C3228] border border-[#D8D0C7] rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60';

export const iconBtn = 'p-1.5 rounded-md hover:bg-[#EFECE8] text-[#5E574F]';

// Paleta categórica validada (ordem fixa, cor segue a categoria)
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'];
export const OTHER_COLOR = '#8C827A';
export const REVENUE_COLOR = '#2a78d6';
export const EXPENSE_COLOR = '#eb6834';

export const Card: React.FC<{ title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
  className = '',
  children,
}) => (
  <section className={`surface-panel p-5 ${className}`}>
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          {title && <h3 className="font-serif text-base font-bold text-[#2C3228] flex items-center gap-2">{title}</h3>}
          {subtitle && <p className="text-[11px] text-[#8C827A] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export const Kpi: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  badge?: string;
  tone?: 'green' | 'red' | 'neutral' | 'amber';
  hint?: string;
}> = ({ label, value, icon, badge, tone = 'neutral', hint }) => {
  const tones = {
    green: 'bg-[#EAF5ED] text-[#166534]',
    red: 'bg-[#FEE2E2] text-[#991B1B]',
    amber: 'bg-[#FEF3C7] text-[#92400E]',
    neutral: 'bg-[#F4ECE6] text-[#2C3228]',
  }[tone];
  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-[#8C827A] uppercase tracking-[0.14em]">{label}</p>
          <p className="font-serif text-2xl font-bold text-[#2C3228] mt-2">{value}</p>
        </div>
        <span className={`mt-0.5 ${tones.replace('bg-', 'text-').split(' ')[1] ?? 'text-[#2C3228]'}`}>{icon}</span>
      </div>
      <div className="mt-3 pt-2 border-t border-[#ECE5DE] flex justify-between gap-2 text-[11px]">
        {hint && <span className="text-[#8C827A]">{hint}</span>}
        {badge && <span className="font-semibold text-[#61574E] ml-auto">{badge}</span>}
      </div>
    </div>
  );
};

const STATUS_STYLES: Record<PaymentStatus, { label: string; cls: string }> = {
  pago: { label: 'Pago', cls: 'bg-[#EAF5ED] text-[#166534]' },
  pendente: { label: 'Pendente', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  atrasado: { label: 'Atrasado', cls: 'bg-[#FEE2E2] text-[#991B1B]' },
};

export const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pendente;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${s.cls}`}>{s.label}</span>;
};

export const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => (
  <label className={`block ${className}`}>
    <span className="font-bold text-[#2C3228] block mb-1 text-xs">{label}</span>
    {children}
  </label>
);

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-[#8C827A] text-center py-6">{children}</p>
);

export const thCls = 'px-3 py-2.5 font-bold';
export const tdCls = 'px-3 py-2.5';
export const theadCls = 'bg-[#F4ECE6] text-[#2C3228] uppercase tracking-wider text-[10px] text-left';

// Barra horizontal simples para percentagens
export const ShareBar: React.FC<{ pct: number; color?: string }> = ({ pct, color = '#D0A68D' }) => (
  <div className="h-1.5 bg-[#F4ECE6] rounded-full overflow-hidden w-full">
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} />
  </div>
);
