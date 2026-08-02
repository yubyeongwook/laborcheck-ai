import React, { useState } from 'react';
import { PiggyBank, Sparkles, CheckCircle2, DollarSign, Send, X, ArrowRight, ShieldCheck } from 'lucide-react';

const GRANT_PROGRAMS = [
  {
    id: 'youth',
    title: '청년일자리 도약장려금',
    target: '5인 이상 사업장 (우대업종 1인 이상)',
    amount: '최대 1,200만원 / 1인당',
    desc: '취업애로청년을 정규직으로 채용하여 6개월 이상 고용 유지 시, 1년간 월 60만원 + 2년차 480만원 일시지급',
    badge: '👑 대표 추천'
  },
  {
    id: 'senior',
    title: '고령자 고용촉진장려금',
    target: '전 사업장 (60세 이상 채용)',
    amount: '최대 240만원 / 1인당',
    desc: '60세 이상 고령자를 1년 이상 정규직으로 신규 채용 시 분기별 30만원씩 2년간 지원',
    badge: '👴 고령자 채용'
  },
  {
    id: 'flexible',
    title: '유연근무 활용 장려금',
    target: '전 사업장 (재택/시차출퇴근)',
    amount: '월 30~50만원 / 1인당',
    desc: '재택근무, 시차출퇴근, 선택근무제 도입 및 활용 사업주에게 1년간 장려금 지급',
    badge: '💻 유연근무'
  },
  {
    id: 'middle',
    title: '신중년 적합직무 고용장려금',
    target: '전 사업장 (50세 이상 채용)',
    amount: '최대 960만원 / 1인당',
    desc: '50세 이상 미취업자를 신중년 적합직무에 정규직 채용 시 1년간 월 40~80만원 지원',
    badge: '👔 신중년'
  }
];

export default function GovernmentGrantModal({ isOpen, onClose }) {
  const [companySize, setCompanySize] = useState('5인 이상');
  const [newHires, setNewHires] = useState('2');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const hireNum = parseInt(newHires, 10) || 1;
  const estimatedMaxGrant = hireNum * 12000000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName || !phone) {
      alert('회사명과 연락처를 입력해 주세요.');
      return;
    }
    setApplied(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: '750px', maxHeight: '90vh',
        background: '#0f172a', border: '1px solid rgba(52, 211, 153, 0.4)',
        borderRadius: '24px', padding: '2rem', color: '#f8fafc',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        {/* 모달 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #059669, #34d399)', padding: '0.4rem', borderRadius: '10px' }}>
              <PiggyBank size={24} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', margin: 0 }}>
                💼 사업주 2026 고용지원금 & 정책자금 맞춤 매칭
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                우리 사업장에 맞는 2026년 정부 고용장려금 지원액을 추정하고 무료 진단을 신청하세요.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* 💡 예상 최대 수령 지원금 계산기 카이샤 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.1))',
          border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '16px', padding: '1.2rem 1.5rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700 }}>신규 채용 {hireNum}명 기준 예상 최대 수령액</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', margin: '0.2rem 0 0 0' }}>
              최대 {estimatedMaxGrant.toLocaleString()}원 지원 가능
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>채용 예정 인원:</span>
            <select
              value={newHires}
              onChange={(e) => setNewHires(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #34d399', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}
            >
              {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}명</option>)}
            </select>
          </div>
        </div>

        {/* 📚 2026 4대 주요 고용장려금 프로그램 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {GRANT_PROGRAMS.map((p) => (
            <div key={p.id} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>{p.badge}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24' }}>{p.amount}</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.3rem' }}>{p.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 📝 지원금 무료 자격 심사 신청 폼 */}
        {applied ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#1e293b', borderRadius: '16px' }}>
            <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: '0.8rem' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem' }}>
              고용지원금 무료 매칭 신청이 등록되었습니다!
            </h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 1rem' }}>
              정책자금 전문 수석 매니저가 1시간 내로 (<strong>{phone}</strong>)로 매칭 가능 여부를 안내드립니다.
            </p>
            <button onClick={() => setApplied(false)} style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              추가 신청하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="#34d399" /> 우리 회사 2026 고용지원금 무료 매칭 사전 심사 신청
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>회사명 / 상호 *</label>
                <input
                  type="text"
                  placeholder="예: (주)노무체크"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>대표자/담당자 연락처 *</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #34d399)', color: '#ffffff',
                fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                boxShadow: '0 4px 15px rgba(52, 211, 153, 0.4)'
              }}
            >
              <Send size={16} /> 2026 고용지원금 무료 매칭 사전 심사 요청하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
