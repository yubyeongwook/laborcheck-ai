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
  const [loginPhone, setLoginPhone] = useState('');
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
    const cleanPhone = (loginPhone || '').replace(/[^0-9]/g, '');
    if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
      setAuthError('올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
        options: {
          data: {
            phone_number: loginPhone
          }
        }
      });
      if (error) throw error;

      // 가입 성공 시 백엔드 API를 호출해 카카오 가입 환영 메시지 발송
      let kakaoSent = false;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || '';
        const kakaoRes = await fetch(`${apiBaseUrl}/api/send-kakao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: loginPhone,
            type: 'signup'
          })
        });
        kakaoSent = kakaoRes.ok;
      } catch (kakaoErr) {
        console.error('카카오 가입 환영 메시지 발송 실패:', kakaoErr);
      }

      alert(
        kakaoSent
          ? '회원가입이 완료되었습니다! 가입 환영 카카오톡 메시지가 발송되었습니다. (인증이 필요한 경우 이메일을 확인해 주세요.)'
          : '회원가입이 완료되었습니다! (카카오톡 환영 메시지 발송에는 실패했지만 가입에는 문제가 없습니다. 인증이 필요한 경우 이메일을 확인해 주세요.)'
      );
      setIsSigningUp(false);
      setLoginEmail('');
      setLoginPassword('');
      setLoginPhone('');
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
    loginPhone,
    setLoginPhone,
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
