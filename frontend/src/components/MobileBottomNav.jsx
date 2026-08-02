import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Calculator, HeartPulse, MessageSquare } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: '홈', icon: Home },
  { to: '/worker', label: '서류센터', icon: FileText },
  { to: '/tools/salary', label: '월급계산', icon: Calculator, highlight: true },
  { to: '/injury', label: '산재 70%', icon: HeartPulse },
  { to: '/contact', label: '1:1상담', icon: MessageSquare }
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav no-print">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`
            }
          >
            <IconComponent size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
