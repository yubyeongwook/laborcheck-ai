import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Sparkles } from 'lucide-react';

function FloatingContactButton() {
  const location = useLocation();

  // 현재 노무상담요청 페이지에 위치해 있으면 플로팅 버튼을 노출하지 않음
  if (location.pathname === '/contact') {
    return null;
  }

  return (
    <Link to="/contact" className="floating-contact-btn" title="노무상담요청 바로가기">
      <span className="floating-contact-pulse"></span>
      <div className="floating-contact-content">
        <MessageSquare size={20} className="floating-contact-icon" />
        <span className="floating-contact-text">⚡ 노무상담요청</span>
        <Sparkles size={14} className="floating-contact-sparkle" />
      </div>
    </Link>
  );
}

export default FloatingContactButton;
