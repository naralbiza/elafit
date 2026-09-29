import React from 'react';
import {
  Home,
  Users,
  CreditCard,
  UserCheck,
  Calendar,
  Activity,
  ShoppingBag,
  Sparkles,
  BarChart3,
  Settings,
  Target,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
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
    { id: 'ai' as TabType, label: 'Configurações', icon: Settings },
  ];
  const menuItems = allItems.filter((item) => item.id !== 'users' && hasModule(item.id as Exclude<TabType, 'users'>));
  if (profile?.is_admin) {
    menuItems.push({ id: 'users', label: 'Utilizadores', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-[#303227] text-[#E5E0DA] min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto shrink-0 select-none border-r border-[#3D3F33] z-20">
      <div>
        {/* Brand Logo & Tagline Header */}
        <div 
          className="pt-2 pb-5 px-3 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => menuItems[0] && setActiveTab(menuItems[0].id)}
        >
          {/* Official Brand Seal Logo */}
          <div className="relative group flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#FAF7F2] p-2 flex items-center justify-center shadow-lg border-2 border-[#D8B69F]/40 transition-all duration-300 group-hover:scale-105 group-hover:border-[#D8B69F] group-hover:shadow-[#D8B69F]/20">
              <img 
                src="/logo.png" 
                alt="Ela Fit - Ao Seu Ritmo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Title & Tagline */}
          <div className="text-center mt-2.5">
            <h1 className="font-serif text-base font-bold text-[#FAF7F2] tracking-wide leading-tight">
              Ela Fit
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#3D3F34] text-[9px] text-[#D8B69F] font-medium tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8B69F] animate-pulse"></span>
              <span>Ao Seu Ritmo</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="space-y-1 mt-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#414336] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#B0ABA3] hover:text-[#FFFFFF] hover:bg-[#393B2F]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E8D5C8]' : 'text-[#8F8880]'}`} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card in Sidebar with Exact Reference Image */}
      <div className="mt-4 pt-3">
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#434638] group cursor-pointer">
          <img
            src="/sidebar-bottom-card.jpg"
            alt="Mulheres mais fortes, vidas mais felizes"
            className="w-full h-44 object-cover object-center filter brightness-[0.9] group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </aside>
  );
};
