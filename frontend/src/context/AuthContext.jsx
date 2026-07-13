import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase initialization failed:', err);
  }
}

export { supabase };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const openLoginModal = () => {
    setAuthError('');
    setShowLoginModal(true);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message || '로그인에 실패했습니다.');
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      alert('회원가입 확인 메일이 발송되었습니다! 이메일 링크를 확인해 주세요.');
      setIsSigningUp(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message || '회원가입에 실패했습니다.');
    }
  };

  const handleOAuthLogin = async (provider) => {
    if (!supabase) {
      alert('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      alert(`${provider} 로그인 시도 중 에러가 발생했습니다: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    session,
    user,
    supabase,
    showLoginModal,
    setShowLoginModal,
    openLoginModal,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    authError,
    setAuthError,
    isSigningUp,
    setIsSigningUp,
    handleEmailLogin,
    handleEmailSignUp,
    handleOAuthLogin,
    handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
