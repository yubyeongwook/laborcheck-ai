import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShieldAlert, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/worker', label: '근로자' },
  { to: '/employer', label: '사업주' },
  { to: '/tools/salary', label: '계산기' },
];

function Navbar() {
  const { user, handleLogout, openLoginModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth navbar-auth-desktop">
          {user ? (
            <>
              <div className="navbar-user-chip">
                <span className="navbar-user-dot"></span>
                <span>{user.email}님</span>
              </div>
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
              className={`navbar-mobile-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="navbar-mobile-auth">
            {user ? (
              <>
                <div className="navbar-user-chip">
                  <span className="navbar-user-dot"></span>
                  <span>{user.email}님</span>
                </div>
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
