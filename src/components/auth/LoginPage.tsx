import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ArrowRight, KeyRound, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

type Mode = 'login' | 'forgot' | 'recovery';

export const LoginPage: React.FC<{ recovery?: boolean }> = ({ recovery = false }) => {
  const { signIn, sendPasswordReset, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>(recovery ? 'recovery' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next); setError(null); setInfo(null); setPassword(''); setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setInfo(null);
    if (mode === 'recovery' && password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setSubmitting(true);
    let err: string | null = null;
    if (mode === 'login') err = await signIn(email, password);
    else if (mode === 'forgot') { err = await sendPasswordReset(email); if (!err) setInfo('Se o email existir, receberá um link para definir uma nova senha.'); }
    else err = await updatePassword(password);
    setError(err); setSubmitting(false);
  };

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: 'Bem-vinda de volta', subtitle: 'Inicie sessão para aceder ao Gestor de Negócio.' },
    forgot: { title: 'Recuperar senha', subtitle: 'Indique o seu email e enviaremos um link de recuperação.' },
    recovery: { title: 'Definir nova senha', subtitle: 'Escolha uma nova senha para a sua conta.' },
  };
  const inputClass = 'w-full pl-12 pr-4 py-3.5 bg-white/70 border border-[#E4DDD3] rounded-2xl text-[15px] text-[#2C3228] placeholder:text-[#9A9187] focus:outline-none focus:border-[#8C6353] focus:bg-white transition-all';
  const iconClass = 'w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B645B]';
  const labelClass = 'block text-sm font-semibold text-[#2C3228]';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FBF8F3] text-[#2C3228] font-sans antialiased">
      {/* Painel da imagem */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[54%] bg-[#303227]">
        <img src="/login-hero.webp" alt="Treino no ginásio Ela Fit" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14150e]/95 via-[#14150e]/55 to-[#14150e]/35" />
        <div className="absolute top-14 left-[5.5%]">
          <div className="w-[124px] h-[124px] rounded-full bg-[#F7F0E6] p-1.5 flex items-center justify-center shadow-xl">
            <img src="/logo.png" alt="Ela Fit - Ao Seu Ritmo" className="w-full h-full object-contain" />
          </div>
          <p className="font-serif text-[28px] text-[#FAF7F2] mt-3 leading-none">Ela Fit</p>
          <p className="text-[8px] tracking-[0.25em] text-[#E5E0DA] mt-1.5">AO SEU RITMO</p>
        </div>
        <div className="absolute bottom-14 left-[5.5%] right-[14%] text-[#FAF7F2]">
          <h2 className="font-serif text-4xl xl:text-[56px] font-bold leading-[1.05]">Força para viver<br /><span className="text-[#E0B48F]">do seu jeito.</span></h2>
        </div>
      </div>

      {/* Painel do formulário */}
      <div className="relative min-h-screen lg:ml-auto lg:w-[46%] lg:min-w-[440px] flex items-center justify-center bg-[#FBF8F3] p-8 sm:p-12 lg:pl-[8%] lg:pr-[6%]">
        {/* Curva decorativa */}
        <svg aria-hidden className="hidden lg:block absolute inset-y-0 right-[calc(100%-2px)] h-full w-[calc(22vw+2px)] max-w-[422px]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M101,0 L62,0 C34,30 84,52 50,76 C34,88 22,94 6,100 L101,100 Z" fill="#33391F" />
          <path d="M101,0 L76,0 C52,28 96,54 66,78 C52,88 44,95 38,100 L101,100 Z" fill="#FBF8F3" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${66 + i * 1.5},0 C${38 + i * 3},${28 + i} ${96 - i * 2},${55 + i} ${64 + i * 2},${79 + i} C${55 + i * 2},88 ${50 + i * 2},95 ${48 + i * 2},100`} fill="none" stroke="#D8B69F" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.7" />
          ))}
        </svg>
        <div className="relative w-full max-w-[540px]">
          <div className="lg:hidden w-16 h-16 rounded-full bg-[#F7F0E6] p-1.5 mb-6 border border-[#D8B69F]/50"><img src="/logo.png" alt="Ela Fit - Ao Seu Ritmo" className="w-full h-full object-contain" /></div>
          <p className="text-xs font-bold tracking-[0.3em] text-[#B8896B]">ELA <span className="text-[#E3CDB9]">FIT</span></p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1d1f15] mt-3 leading-tight">{titles[mode].title}</h1>
          <p className="text-base text-[#5E574F] mt-3">{titles[mode].subtitle}</p>
          {!isSupabaseConfigured && <div className="mt-6 flex gap-2 p-3 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[11px] text-[#92400E]"><AlertCircle className="w-4 h-4 shrink-0" /><span>O sistema não está configurado corretamente. Contacte a administração.</span></div>}
          <form onSubmit={handleSubmit} className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
            {mode !== 'recovery' && <div><label className={`${labelClass} mb-2`}>Email</label><div className="relative"><Mail className={iconClass} /><input type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@elafit.co.ao" className={inputClass} /></div></div>}
            {mode !== 'forgot' && <div><div className="flex items-center justify-between mb-2"><label className={labelClass}>{mode === 'recovery' ? 'Nova senha' : 'Senha'}</label>{mode === 'login' && <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-[#8C4A2F] hover:underline">Esqueceu a senha?</button>}</div><div className="relative"><Lock className={iconClass} /><input type={showPassword ? 'text' : 'password'} required minLength={mode === 'recovery' ? 6 : undefined} autoComplete={mode === 'recovery' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} pr-12`} /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B645B] hover:text-[#2C3228]" title={showPassword ? 'Esconder senha' : 'Mostrar senha'}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>}
            {mode === 'recovery' && <div><label className={`${labelClass} mb-2`}>Confirmar nova senha</label><div className="relative"><KeyRound className={iconClass} /><input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div></div>}
            {error && <div className="flex gap-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
            {info && <div className="flex gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534]"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{info}</span></div>}
            <button type="submit" disabled={submitting || !isSupabaseConfigured} className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 bg-gradient-to-r from-[#4A4A30] to-[#252B1C] hover:brightness-110 disabled:opacity-60 text-white rounded-2xl text-lg font-semibold shadow-[0_10px_25px_-8px_rgba(37,43,28,0.6)] transition-all">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}{mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar link' : 'Guardar nova senha'}</button>
            {mode === 'forgot' && <button type="button" onClick={() => switchMode('login')} className="w-full flex items-center justify-center gap-1.5 text-sm text-[#7A7067] hover:text-[#2C3228]"><ArrowLeft className="w-4 h-4" /> Voltar ao login</button>}
          </form>
          <div className="mt-8 pt-6 border-t border-[#E8E1D8] text-center text-sm text-[#6B645B]">
            <p>O acesso é criado pela administração. Não tem conta?</p>
            <p className="mt-2 font-medium text-[#8C4A2F] inline-flex items-center gap-2">Fale com a gestora do ginásio. <ArrowRight className="w-4 h-4" /></p>
          </div>
        </div>
      </div>
    </div>
  );
};
