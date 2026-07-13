import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, User, Briefcase } from 'lucide-react';

function RemedyHub() {
  const OPTIONS = [
    {
      to: '/worker/report',
      icon: <User size={32} color="#38bdf8" />,
      badge: '근로자용',
      title: 'AI 자가진단 리포트',
      desc: '임금체불, 부당해고, 휴게시간 미보장 등 근로자 권리 침해 사항에 대한 법령 대조 및 대응 방안을 진단합니다.'
    },
    {
      to: '/employer/report',
      icon: <Briefcase size={32} color="#fbbf24" />,
      badge: '사업주용',
      title: 'AI 리스크 진단 리포트',
      desc: '사업장 근무 형태 및 급여 조건을 바탕으로 근로기준법 준수 상태와 법적 리스크 등급을 사전 점검합니다.'
    }
  ];

  return (
    <div className="page-container page-container-narrow">
      <div className="hub-header" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <div className="hub-header-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
          <FileText size={32} color="#6366f1" />
        </div>
        <div>
          <h1 className="hub-header-title">AI 노무 자가진단 리포트</h1>
          <p className="hub-header-desc">
            대한민국 근로기준법을 바탕으로 현재 겪고 계신 노무 고민이나 사업장의 노무 리스크를 AI가 분석하고 맞춤 진단서를 즉시 생성합니다.
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

export default RemedyHub;
