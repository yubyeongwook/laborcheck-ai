import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldAlert, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_EMAIL = 'aigoid1203@gmail.com';

const NAV_LINKS = [
  { to: '/', label: '⚡ 무료 진단', highlight: true },
  { to: '/tools/salary', label: '🛠️ AI 노동관리 도구' },
  { to: '/employer', label: '🏢 기업 SaaS 구독' },
  { to: '/remedy', label: '🤝 전문가 연결' },
  { to: '/contact', label: '🎓 교육센터' }
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
        <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          <ShieldAlert size={26} color="#6366f1" />
          <span>LaborCheck AI</span>
        </Link>

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
