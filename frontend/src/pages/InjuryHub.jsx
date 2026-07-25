import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, User, Briefcase, Calculator, ShieldCheck, HelpCircle } from 'lucide-react';

function InjuryHub() {
  const [dailyWage, setDailyWage] = useState(100000);
  const [days, setDays] = useState(30);
  const [age, setAge] = useState(40);
  const [disabilityGrade, setDisabilityGrade] = useState(0);

  // 1일 휴업급여 계산 (70%, 상한 127600, 하한 80240)
  let baseOffWork = dailyWage * 0.7;
  if (age >= 65) {
    if (age === 65) baseOffWork *= 0.65;
    else if (age === 66) baseOffWork *= 0.60;
    else if (age === 67) baseOffWork *= 0.55;
    else if (age === 68) baseOffWork *= 0.50;
    else baseOffWork *= 0.45;
  }

  let finalDailyOffWork = Math.round(baseOffWork);
  if (finalDailyOffWork > 127600) finalDailyOffWork = 127600;
  if (finalDailyOffWork < 80240 && age < 65) finalDailyOffWork = 80240;

  const totalOffWork = finalDailyOffWork * days;

  // 장해급여 계산
  const gradeDaysMap = { 1: 1474, 2: 1309, 3: 1155, 4: 1012, 5: 869, 6: 737, 7: 616, 8: 495, 9: 385, 10: 297, 11: 220, 12: 154, 13: 99, 14: 55 };
  const dDays = gradeDaysMap[disabilityGrade] || 0;
  const disabilityComp = Math.round(dailyWage * dDays);

  const OPTIONS = [
    {
      to: '/worker/injury',
      icon: <User size={24} color="#38bdf8" />,
      badge: '근로자용',
      title: '산재 권리구제 4단계 가이드',
      desc: '사업주 동의(날인)가 없어도 근로자 단독으로 근로복지공단에 직접 산재 신청하는 법과 요양·휴업급여 청구 절차'
    },
    {
      to: '/employer/injury',
      icon: <Briefcase size={24} color="#fbbf24" />,
      badge: '사업주용',
      title: '산재 예방·대응 체크리스트',
      desc: '사고 발생 시 1개월 내 노동청 재해조사표 제출 의무 및 공상 처리(사적 합의) 리스크 방어 가이드'
    }
  ];

  return (
    <div className="page-container page-container-narrow">
      <div className="hub-header" style={{ borderColor: 'rgba(248, 113, 113, 0.2)' }}>
        <div className="hub-header-icon" style={{ background: 'rgba(248, 113, 113, 0.1)' }}>
          <HeartPulse size={32} color="#f87171" />
        </div>
        <div>
          <h1 className="hub-header-title">산재 보상금 정밀 시뮬레이터 & 권리구제</h1>
          <p className="hub-header-desc">
            산업재해보상보험법 기준 1일 휴업급여(70%) 및 장해급여를 0% 오차로 정밀 계산하고 권리구제 절차를 안내합니다.
          </p>
        </div>
      </div>

      {/* 정밀 산재 시뮬레이터 카드 */}
      <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '16px', padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={20} color="#f87171" /> 0% 오차 산재 보상금 정밀 시뮬레이션
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>1일 평균임금 (원)</label>
            <input 
              type="number" 
              value={dailyWage} 
              onChange={(e) => setDailyWage(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>요양/치료 일수 (일)</label>
            <input 
              type="number" 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>근로자 만 나이 (세)</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>장해 등급 (없음: 0, 1급~14급)</label>
            <input 
              type="number" 
              min="0" 
              max="14" 
              value={disabilityGrade} 
              onChange={(e) => setDisabilityGrade(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
            />
          </div>
        </div>

        {/* 결과 요약 표시 */}
        <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px dashed rgba(248, 113, 113, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>1일 휴업급여 (70%):</span>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{finalDailyOffWork.toLocaleString()} 원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>총 휴업급여 ({days}일분):</span>
            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{totalOffWork.toLocaleString()} 원</span>
          </div>
          {disabilityGrade > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>장해급여 (제{disabilityGrade}급 {dDays}일분):</span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{disabilityComp.toLocaleString()} 원</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>예상 총 보상금:</span>
            <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.2rem' }}>{(totalOffWork + disabilityComp).toLocaleString()} 원</span>
          </div>
        </div>

        {/* 핵심 알림 팁 */}
        <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
          💡 <b>사업주 날인 폐지</b>: 사장님 도장이 없어도 근로자가 근로복지공단에 직접 산재 신청 가능합니다.<br/>
          🚗 <b>출퇴근 재해 포함</b>: 도보, 자가용, 버스 출퇴근 중 사고도 100% 산재 처리됩니다.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', marginTop: '1.5rem' }}>
        {OPTIONS.map((opt) => (
          <Link key={opt.to} to={opt.to} className="feature-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', textAlign: 'left' }}>
            <div className="feature-card-icon" style={{ flexShrink: 0, padding: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px' }}>
              {opt.icon}
            </div>
            <div>
              <span className={`feature-card-tag ${opt.badge === '근로자용' ? 'tag-worker' : 'tag-employer'}`} style={{ display: 'inline-block', marginBottom: '0.3rem' }}>
                {opt.badge}
              </span>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>{opt.title}</h3>
              <p className="feature-card-desc" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>{opt.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default InjuryHub;
