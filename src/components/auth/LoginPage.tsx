import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'recovery' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    let err: string | null = null;
    if (mode === 'login') {
      err = await signIn(email, password);
    } else if (mode === 'forgot') {
      err = await sendPasswordReset(email);
      if (!err) setInfo('Se o email existir, receberá um link para definir uma nova senha.');
    } else {
      err = await updatePassword(password);
    }
    setError(err);
    setSubmitting(false);
  };

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: 'Bem-vinda de volta', subtitle: 'Inicie sessão para aceder ao Gestor de Negócio.' },
    forgot: { title: 'Recuperar senha', subtitle: 'Indique o seu email e enviaremos um link de recuperação.' },
    recovery: { title: 'Definir nova senha', subtitle: 'Escolha uma nova senha para a sua conta.' },
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 bg-[#EFECE8] border border-[#E4DED8] rounded-xl text-sm text-[#2C3228] placeholder:text-[#9A9187] focus:outline-none focus:ring-1 focus:ring-[#303227] focus:bg-white transition-all';

  return (
    <div className="min-h-screen bg-[#F4F2EE] text-[#2C3228] font-sans flex antialiased">
      {/* Painel da marca */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#303227]">
        <img src="/hero-banner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#303227] via-[#303227]/40 to-transparent" />
        <div className="relative z-10 mt-auto p-12 text-[#FAF7F2]">
          <h2 className="font-serif text-4xl font-bold leading-tight">Mulheres mais fortes,<br />vidas mais felizes.</h2>
          <p className="mt-3 text-sm text-[#E5E0DA] max-w-md">
            CRM de alunas, financeiro, recursos humanos, aulas e inteligência de negócio num só lugar.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#FAF7F2] p-2 flex items-center justify-center shadow-md border-2 border-[#D8B69F]/50">
              <img src="/logo.png" alt="Ela Fit - Ao Seu Ritmo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#303227] mt-4">{titles[mode].title}</h1>
            <p className="text-xs text-[#7A7067] mt-1 text-center">{titles[mode].subtitle}</p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 flex gap-2 p-3 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[11px] text-[#92400E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                O sistema não está configurado corretamente. Contacte a administração.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'recovery' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#5E574F] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9A9187]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@elafit.co.ao"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-[#5E574F]">
                    {mode === 'recovery' ? 'Nova senha' : 'Senha'}
                  </label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')} className="text-[11px] text-[#8C6353] hover:underline">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#9A9187]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'recovery' ? 6 : undefined}
                    autoComplete={mode === 'recovery' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2.5 p-0.5 text-[#9A9187] hover:text-[#2C3228]"
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'recovery' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#5E574F] mb-1.5">Confirmar nova senha</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[#9A9187]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#303227] hover:bg-[#414336] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar link' : 'Guardar nova senha'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-[#7A7067] hover:text-[#2C3228]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
              </button>
            )}
          </form>

          <p className="text-[10px] text-[#9A9187] text-center mt-8">
            O acesso é criado pela administração. Não tem conta? Fale com a gestora do ginásio.
          </p>
        </div>
      </div>
    </div>
  );
};
