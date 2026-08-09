import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldAlert, Menu, X, Sparkles, Coins, FileText, HeartPulse, Scale, GraduationCap, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_EMAIL = 'aigoid1203@gmail.com';

const NAV_LINKS = [
  { to: '/', label: '2026 무료진단', highlight: true },
  { to: '/worker', label: '근로자' },
  { to: '/employer', label: '사업주' },
  { to: '/injury', label: '산재 70% 진단' },
  { to: '/remedy', label: '부당해고 구제' },
  { to: '/education', label: '법정의무교육' },
  { to: '/contact', label: '1:1 노무상담' }
];

const getDisplayName = (user) => {
  if (!user?.email) return '';
  if (user.email === ADMIN_EMAIL) return '관리자';
  return user.email.split('@')[0];
};

function Navbar() {
  const { user, handleLogout, openLoginModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const displayName = getDisplayName(user);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a
          href="/"
          className="navbar-logo"
          onClick={(e) => {
            e.preventDefault();
            setMobileOpen(false);
            window.location.href = '/';
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', textDecoration: 'none' }}
        >
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #38bdf8)', borderRadius: '10px', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>
            LaborCheck <span style={{ color: '#38bdf8' }}>AI</span>
          </span>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 800 }}>
            2026 최신
          </span>
        </a>

        <nav className="navbar-links navbar-links-desktop">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `navbar-link ${link.highlight ? 'navbar-link-highlight' : ''} ${isActive ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth navbar-auth-desktop">
          {user ? (
            <>
              {user.email === ADMIN_EMAIL ? (
                <Link to="/admin/inquiries" className="navbar-user-chip navbar-user-chip-link" title="문의 내역 관리 페이지로 이동">
                  <span className="navbar-user-dot"></span>
                  <span>{displayName}님 (문의관리)</span>
                </Link>
              ) : (
                <div className="navbar-user-chip">
                  <span className="navbar-user-dot"></span>
                  <span>{displayName}님</span>
                </div>
              )}
              <button type="button" className="navbar-btn-ghost" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <button type="button" className="navbar-btn-primary" onClick={openLoginModal}>
              로그인 / 회원가입
            </button>
          )}
        </div>

        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile-panel">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-mobile-link ${link.highlight ? 'navbar-mobile-link-highlight' : ''} ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="navbar-mobile-auth">
            {user ? (
              <>
                {user.email === ADMIN_EMAIL ? (
                  <Link to="/admin/inquiries" className="navbar-user-chip navbar-user-chip-link" onClick={() => setMobileOpen(false)} title="문의 내역 관리 페이지로 이동">
                    <span className="navbar-user-dot"></span>
                    <span>{displayName}님 (문의관리)</span>
                  </Link>
                ) : (
                  <div className="navbar-user-chip">
                    <span className="navbar-user-dot"></span>
                    <span>{displayName}님</span>
                  </div>
                )}
                <button type="button" className="navbar-btn-ghost" onClick={() => { handleLogout(); setMobileOpen(false); }}>로그아웃</button>
              </>
            ) : (
              <button type="button" className="navbar-btn-primary" onClick={() => { openLoginModal(); setMobileOpen(false); }}>
                로그인 / 회원가입
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

