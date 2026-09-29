import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ModuleId, Profile } from './modules';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // true quando o utilizador abriu o link de recuperação de senha
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  hasModule: (module: ModuleId) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'O email ainda não foi confirmado.';
  if (/banned/i.test(message)) return 'Esta conta foi desativada. Contacte a administração.';
  if (/rate limit/i.test(message)) return 'Demasiadas tentativas. Aguarde alguns minutos.';
  if (/password should be/i.test(message)) return 'A senha deve ter pelo menos 6 caracteres.';
  console.error('[Ela Fit] Erro de Autenticação:', message);
  return 'Ocorreu um erro na autenticação. Tente novamente mais tarde.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // id do utilizador para o qual o perfil já foi carregado (evita ecrãs intermédios)
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileLoadedFor(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) console.error('Erro ao carregar perfil', error);
    setProfile((data as Profile) ?? null);
    setProfileLoadedFor(userId);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    // Fora do callback do onAuthStateChange, conforme recomendado pelo Supabase
    loadProfile(userId);
  }, [userId, loadProfile]);

  const loading = !sessionChecked || (Boolean(userId) && profileLoadedFor !== userId);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsPasswordRecovery(false);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return translateAuthError(error.message);
    setIsPasswordRecovery(false);
    return null;
  }, []);

  const refreshProfile = useCallback(() => loadProfile(userId), [loadProfile, userId]);

  const hasModule = useCallback(
    (module: ModuleId) => Boolean(profile?.active && (profile.is_admin || profile.permissions.includes(module))),
    [profile]
  );

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isPasswordRecovery,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshProfile,
      hasModule,
    }),
    [session, profile, loading, isPasswordRecovery, signIn, signOut, sendPasswordReset, updatePassword, refreshProfile, hasModule]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
