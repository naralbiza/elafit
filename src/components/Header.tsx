import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Award,
  X,
  LogOut,
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
  onOpenAI,
}) => {
  const { profile, signOut } = useAuth();
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const displayName = profile?.full_name || profile?.email || '';
  const roleLabel = profile?.job_title || (profile?.is_admin ? 'Administradora' : 'Equipa');

  return (
    <>
      <header className="bg-transparent pt-4 pb-2 px-6 flex items-center justify-between gap-4">
        {/* Search Input Bar matching Reference Image */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9A9187]" />
          <input
            type="text"
            placeholder="Pesquisar clientes, planos, aulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#EFECE8] border border-[#E4DED8] rounded-xl text-xs text-[#2C3228] placeholder:text-[#9A9187] focus:outline-none focus:ring-1 focus:ring-[#303227] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Right User & Actions Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Official Brand Stamp button */}
          <button
            onClick={() => setShowLogoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EFECE8] border border-[#E4DED8] text-[#303227] rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Ver Selo Oficial Ela Fit"
          >
            <img src="/logo.png" alt="Selo Ela Fit" className="w-5 h-5 rounded-full object-cover" />
            <span className="hidden md:inline text-[11px] font-medium text-[#7D756C]">Selo Oficial</span>
          </button>

          {/* Reload Data Button */}
          <button
            onClick={onReloadData}
            className="p-2 text-[#8C827A] hover:text-[#2C3228] hover:bg-[#EBE7E1] rounded-xl text-xs transition-colors"
            title="Recarregar dados do servidor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Bell with 3 Badge */}
          <div className="relative cursor-pointer p-2 hover:bg-[#EBE7E1] rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-[#2C3228]" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D3453B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#F4EEEE]">
              3
            </span>
          </div>

          {/* User Profile Badge matching exact reference avatar & style */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2.5 pl-2 cursor-pointer group"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-[#D0A68D] shadow-2xs group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#E8D5C8] text-[#303227] font-bold text-xs flex items-center justify-center border border-[#D0A68D] shadow-2xs group-hover:scale-105 transition-transform">
                  {displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#2C3228] leading-tight">{displayName}</p>
                <p className="text-[10px] text-[#8C827A]">{roleLabel}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C827A]" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E4DED8] rounded-2xl shadow-lg z-40 p-2">
                  <div className="px-3 py-2 border-b border-[#EFECE8] mb-1">
                    <p className="text-xs font-semibold text-[#2C3228] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#8C827A] truncate">{profile?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#D3453B] hover:bg-[#FEE2E2] transition-colors"
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
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#EAE4DC] text-[#7A7067] transition-colors"
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

            <h3 className="font-serif text-2xl font-bold text-[#303227]">Ela Fit</h3>
            <p className="text-xs font-semibold text-[#8C6353] uppercase tracking-widest mt-1">Ao Seu Ritmo</p>
            <p className="text-xs text-[#7A7067] mt-3 leading-relaxed">
              Identidade visual oficial: Mais que treino, é a tua melhor versão. Construindo mulheres mais fortes e confiantes.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
