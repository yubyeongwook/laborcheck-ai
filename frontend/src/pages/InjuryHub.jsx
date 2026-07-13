import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, User, Briefcase } from 'lucide-react';

function InjuryHub() {
  const OPTIONS = [
    {
      to: '/worker/injury',
      icon: <User size={32} color="#38bdf8" />,
      badge: '근로자용',
      title: '산재 대응 가이드',
      desc: '업무 중 사고 또는 질병이 발생했을 때 근로자가 즉시 취해야 할 응급 조치와 공단 신청 서류 절차를 친절히 안내합니다.'
    },
    {
      to: '/employer/injury',
      icon: <Briefcase size={32} color="#fbbf24" />,
      badge: '사업주용',
      title: '산재 예방·대응 체크리스트',
      desc: '산업재해 발생을 예방하기 위한 사전 준비 목록과 사고 발생 시 사업주의 즉각적인 대응 의무를 정리해 드립니다.'
    }
  ];

  return (
    <div className="page-container page-container-narrow">
      <div className="hub-header" style={{ borderColor: 'rgba(248, 113, 113, 0.2)' }}>
        <div className="hub-header-icon" style={{ background: 'rgba(248, 113, 113, 0.1)' }}>
          <HeartPulse size={32} color="#f87171" />
        </div>
        <div>
          <h1 className="hub-header-title">산재 예방 및 대응 가이드</h1>
          <p className="hub-header-desc">
            산업재해는 초기 대처가 가장 중요합니다. 근로자의 권리 보호를 위한 산재 신청 요령부터 사업주의 의무 사항까지 한눈에 확인하세요.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '2rem' }}>
        {OPTIONS.map((opt) => (
          <Link key={opt.to} to={opt.to} className="feature-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'left' }}>
            <div className="feature-card-icon" style={{ flexShrink: 0, padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px' }}>
              {opt.icon}
            </div>
            <div>
              <span className={`feature-card-tag ${opt.badge === '근로자용' ? 'tag-worker' : 'tag-employer'}`} style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                {opt.badge}
              </span>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{opt.title}</h3>
              <p className="feature-card-desc" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{opt.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default InjuryHub;
