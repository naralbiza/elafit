import React from 'react';
import {
  Home,
  Users,
  CreditCard,
  UserCheck,
  Calendar,
  Activity,
  ShoppingBag,
  BarChart3,
  Target,
  ShieldCheck,
  CalendarDays,
  Compass,
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, open, onClose }) => {
  const { profile, hasModule } = useAuth();
  const allItems = [
    { id: 'overview' as TabType, label: 'Gestor de Negócio', icon: Home },
    { id: 'crm' as TabType, label: 'CRM (Clientes)', icon: Users },
    { id: 'finance' as TabType, label: 'Financeiro', icon: CreditCard },
    { id: 'hr' as TabType, label: 'Recursos Humanos', icon: UserCheck },
    { id: 'agenda' as TabType, label: 'Agenda', icon: CalendarDays },
    { id: 'classes' as TabType, label: 'Horário de Aulas', icon: Calendar },
    { id: 'evaluations' as TabType, label: 'Avaliações Físicas', icon: Activity },
    { id: 'plans' as TabType, label: 'Planos e Vendas', icon: ShoppingBag },
    { id: 'marketing' as TabType, label: 'Marketing', icon: Target },
    { id: 'reports' as TabType, label: 'Relatórios', icon: BarChart3 },
    { id: 'ai' as TabType, label: 'Inteligência Estratégica', icon: Compass },
  ];
  const menuItems = allItems.filter((item) => item.id !== 'users' && hasModule(item.id as Exclude<TabType, 'users'>));
  if (profile?.is_admin) {
    menuItems.push({ id: 'users', label: 'Utilizadores', icon: ShieldCheck });
  }

  return (
    <>
    {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
    <aside className={`w-64 max-w-[85vw] bg-[#20221A] text-[#E5E0DA] flex flex-col justify-between p-4 fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:h-screen h-[100dvh] overflow-y-auto dark-scroll shrink-0 border-r border-[#323529] z-40 lg:z-20 shadow-sm transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div>
        {/* Brand Logo & Tagline Header */}
        <div 
          className="pt-4 pb-6 px-3 flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => { if (menuItems[0]) setActiveTab(menuItems[0].id); onClose(); }}
        >
          {/* Official Brand Seal Logo */}
          <div className="relative group flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#FAF7F2] p-2 flex items-center justify-center border border-[#D8B69F]/50 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-[#D8B69F]">
              <img 
                src="/logo.png" 
                alt="Ela Fit - Ao Seu Ritmo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Title & Tagline */}
          <div className="text-center mt-3">
            <h1 className="font-serif text-base font-bold text-[#FAF7F2] tracking-wide leading-tight">
              Ela Fit
            </h1>
            <div className="inline-flex items-center justify-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#2E3126] border border-[#3E4233] text-[9px] text-[#D8B69F] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8B69F]"></span>
              <span>Ao Seu Ritmo</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.label}
                onClick={() => { setActiveTab(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#33372B] text-[#FFFFFF] font-semibold border-l-[3px] border-[#D8B69F] rounded-r-xl shadow-xs'
                    : 'text-[#A6A197] hover:text-[#FFFFFF] hover:bg-[#2A2E23] rounded-xl'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E8D5C8]' : 'text-[#827D74]'}`} />
                <span className="tracking-wide text-left truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card in Sidebar with Exact Reference Image */}
      <div className="mt-4 pt-3 border-t border-[#2E3225]">
        <div className="relative rounded-xl overflow-hidden border border-[#3A3E30] group cursor-pointer shadow-xs">
          <img
            src="/community-training.webp"
            alt="Treino em grupo no ginásio Ela Fit"
            className="w-full h-40 object-cover object-center filter brightness-[0.88] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#20221A]/90 via-[#20221A]/20 to-transparent flex items-end p-2.5">
            <p className="text-[10px] font-semibold text-[#E8D5C8] leading-tight drop-shadow-xs">
              Comunidade & Treino
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
