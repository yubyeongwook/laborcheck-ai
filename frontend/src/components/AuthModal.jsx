import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function AuthModal() {
  const {
    showLoginModal, setShowLoginModal,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    loginPhone, setLoginPhone,
    authError, setAuthError,
    isSigningUp, setIsSigningUp,
    handleEmailLogin, handleEmailSignUp, handleOAuthLogin
  } = useAuth();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = (e) => {
    if (isSigningUp && !privacyAgreed) {
      e.preventDefault();
      setAuthError('개인정보 수집·이용에 동의해 주세요.');
      return;
    }
    (isSigningUp ? handleEmailSignUp : handleEmailLogin)(e);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative' }}>

        <button
          type="button"
          onClick={() => setShowLoginModal(false)}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#f8fafc', textAlign: 'center', fontWeight: 'bold' }}>
          {isSigningUp ? '회원가입' : '로그인'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
          리포트 상세 분석과 PDF 다운로드 권한이 부여됩니다.
        </p>

        {authError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>이메일 주소</span>
            <input
              type="email"
              className="text-input"
              placeholder="name@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>비밀번호</span>
            <input
              type="password"
              className="text-input"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>
          {isSigningUp && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>휴대폰 번호 (카카오톡 수신용)</span>
              <input
                type="tel"
                className="text-input"
                placeholder="010-1234-5678"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                required
              />
            </div>
          )}

          {isSigningUp && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ marginTop: '0.15rem' }}
              />
              <span>
                (필수) <a href="#/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>개인정보 수집·이용</a>에 동의합니다.
              </span>
            </label>
          )}

          <button
            type="submit"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}
          >
            {isSigningUp ? '이메일로 가입하기' : '로그인'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>또는</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin('kakao')}
            style={{ background: '#fee500', color: '#191919', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>💬 카카오톡 1초 로그인</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            style={{ background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>🌐 구글 계정으로 로그인</span>
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          {isSigningUp ? '이미 계정이 있으신가요?' : '아직 회원이 아니신가요?'} {' '}
          <span
            onClick={() => { setIsSigningUp(!isSigningUp); setAuthError(''); }}
            style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            {isSigningUp ? '로그인하기' : '회원가입하기'}
          </span>
        </p>

      </div>
    </div>
  );
}

export default AuthModal;
