import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  RotateCcw,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onReloadData: () => void;
  onOpenAI: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  onReloadData,
  onOpenAI: _onOpenAI,
}) => {
  const { profile, signOut } = useAuth();
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const displayName = profile?.full_name || profile?.email || '';
  const roleLabel = profile?.job_title || (profile?.is_admin ? 'Administradora' : 'Equipa');

  return (
    <>
      <header className="bg-[#F4F2EC]/90 backdrop-blur-md sticky top-0 z-20 pt-4 pb-3.5 px-8 flex items-center justify-between gap-4 border-b border-[#E2DDD5] shadow-2xs">
        {/* Search Input Bar with Solid Background and Shortcut Pill */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#8C847A]" />
          <input
            type="text"
            placeholder="Pesquisar alunas, planos, horários, transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-white border border-[#DCD6CC] rounded-xl text-xs text-[#222620] placeholder:text-[#9A9187] focus:outline-none focus:ring-1 focus:ring-[#8C6353] focus:border-[#8C6353] shadow-2xs transition-all"
          />
          <kbd className="hidden sm:inline-flex items-center absolute right-3 top-2 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#8C847A] bg-[#F4F1EA] border border-[#DDD7CD] rounded">
            ⌘K
          </kbd>
        </div>

        {/* Right User & Actions Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* System Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF2EC] border border-[#CFE2D4] text-[10px] font-semibold text-[#275336]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E5C3E]"></span>
            <span>Sistema Conectado</span>
          </div>

          {/* Official Brand Stamp button */}
          <button
            onClick={() => setShowLogoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#2A2C24] rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Ver Selo Oficial Ela Fit"
          >
            <img src="/logo.png" alt="Selo Ela Fit" className="w-4 h-4 rounded-full object-cover" />
            <span className="hidden md:inline text-[11px] font-medium text-[#645E55]">Selo Oficial</span>
          </button>

          {/* Reload Data Button */}
          <button
            onClick={onReloadData}
            className="p-2 text-[#7A7268] hover:text-[#222620] hover:bg-white bg-transparent border border-transparent hover:border-[#DDD7CD] rounded-xl text-xs transition-all cursor-pointer"
            title="Recarregar dados do servidor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Bell with Solid Counter */}
          <div className="relative cursor-pointer p-2 text-[#7A7268] hover:text-[#222620] hover:bg-white rounded-xl border border-transparent hover:border-[#DDD7CD] transition-all">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C84A3E] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              3
            </span>
          </div>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2.5 pl-2.5 pr-2 py-1 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] rounded-2xl cursor-pointer group shadow-2xs transition-all"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-[#D8B69F] group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E8D5C8] text-[#2A2C24] font-bold text-[11px] flex items-center justify-center ring-1 ring-[#D8B69F] group-hover:scale-105 transition-transform">
                  {displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#222620] leading-tight">{displayName}</p>
                <p className="text-[10px] text-[#7A7268] font-medium leading-tight">{roleLabel}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DDD7CD] rounded-2xl shadow-xl z-40 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-[#F0ECE6] mb-1">
                    <p className="text-xs font-bold text-[#222620] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#7A7268] truncate">{profile?.email}</p>
                    {profile?.is_admin && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#EAF2EC] text-[9px] font-bold text-[#2E5C3E]">
                        <ShieldCheck className="w-3 h-3" /> Administradora
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#C84A3E] hover:bg-[#FEECEB] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Terminar sessão
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Official Brand Logo Modal */}
      {showLogoModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoModal(false)}
        >
          <div 
            className="bg-[#FAF7F2] border border-[#E2DDD7] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLogoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#EAE4DC] text-[#7A7067] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-48 h-48 mx-auto mb-4 relative">
              <img 
                src="/logo.png" 
                alt="Ela Fit - Ao Seu Ritmo" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#2A2C24]">Ela Fit</h3>
            <p className="text-xs font-bold text-[#8C6353] uppercase tracking-widest mt-1">Ao Seu Ritmo</p>
            <p className="text-xs text-[#746E66] mt-3 leading-relaxed">
              Identidade visual oficial: Mais que treino, é a tua melhor versão. Construindo mulheres mais fortes e confiantes.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
