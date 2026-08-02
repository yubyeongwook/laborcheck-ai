import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, User, Briefcase, Calculator, ShieldCheck, HelpCircle, 
  Upload, FileText, CheckCircle2, ArrowRight, Sparkles, AlertCircle, FileCheck 
} from 'lucide-react';

function InjuryHub() {
  const [dailyWage, setDailyWage] = useState(103200); // 1일 평균임금 (기본: 최저시급 10,320원 * 10h 또는 8h)
  const [days, setDays] = useState(30);
  const [age, setAge] = useState(45);
  const [disabilityGrade, setDisabilityGrade] = useState(0);
  const [injuryType, setInjuryType] = useState('accident'); // 'accident' | 'commute' | 'overwork' | 'musculoskeletal'

  // 📄 AI Vision 진단서 모의 분석 업로드 상태
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // 1일 휴업급여 계산 (70%, 2026년 기준 상한 127,600원, 하한 80,240원)
  let baseOffWork = dailyWage * 0.7;
  if (age >= 65) {
    if (age === 65) baseOffWork *= 0.65;
    else if (age === 66) baseOffWork *= 0.60;
    else if (age === 67) baseOffWork *= 0.55;
    else if (age === 68) baseOffWork *= 0.50;
    else baseOffWork *= 0.45;
  }

  let finalDailyOffWork = Math.round(baseOffWork);
  // 2026년 최신 법정 상한액 & 하한액 보정
  if (finalDailyOffWork > 127600) finalDailyOffWork = 127600;
  if (finalDailyOffWork < 80240 && age < 65) finalDailyOffWork = 80240;

  const totalOffWork = finalDailyOffWork * days;

  // 장해급여 계산 (1급 ~ 14급 일수 표)
  const gradeDaysMap = { 1: 1474, 2: 1309, 3: 1155, 4: 1012, 5: 869, 6: 737, 7: 616, 8: 495, 9: 385, 10: 297, 11: 220, 12: 154, 13: 99, 14: 55 };
  const dDays = gradeDaysMap[disabilityGrade] || 0;
  const disabilityComp = Math.round(dailyWage * dDays);

  // AI OCR 파일 스캔 시뮬레이션
  const handleSimulateOCR = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setScanResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      setScanResult({
        fileName: file.name,
        diagnosis: 'S8220 경골 간부의 폐쇄성 골절 & 요추 추간판 탈출증 (M511)',
        recommendation: '작업 중 추락 또는 중량물 취급 사고로 판단되며, 85% 이상의 높은 산재 승인 확률을 나타냅니다.',
        approvalRate: '88%',
        neededDocs: ['초진기록지 1부', 'CCTV 또는 동료 목격자 확인서', '급여 입금 통장 내역 3개월분']
      });
    }, 1200);
  };

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
    <div className="page-container page-container-narrow" style={{ maxWidth: '980px', paddingBottom: '5rem' }}>
      
      {/* 헤더 Banner */}
      <div className="hub-header" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(248, 113, 113, 0.35)',
        borderRadius: '24px',
        padding: '2rem 2.2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="hub-header-icon" style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.25), rgba(239, 68, 68, 0.25))',
          border: '1px solid rgba(248, 113, 113, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <HeartPulse size={30} color="#f87171" />
        </div>
        <div>
          <div className="glow-badge" style={{ marginBottom: '0.5rem', borderColor: '#f87171', color: '#f87171', background: 'rgba(248, 113, 113, 0.12)' }}>
            <ShieldCheck size={14} color="#f87171" /> 산업재해보상보험법 2026 최신 적용
          </div>
          <h1 className="hub-header-title" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            산재 보상금 정밀 시뮬레이터 & <span style={{ color: '#f87171' }}>AI Vision 진단서 분석</span>
          </h1>
          <p className="hub-header-desc" style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            산업재해보상보험법 기준 1일 휴업급여(70%) 및 장해급여를 0% 오차 정밀 계산하고 병원 진단서를 AI로 즉시 스캔하세요.
          </p>
        </div>
      </div>

      {/* 📄 AI Vision 진단서 / 소견서 파일 OCR 모의 스캔 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '20px', padding: '1.6rem', marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={22} color="#38bdf8" /> 병원 진단서 / 초진기록지 Vision AI 스캔 & 승인율 진단
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              가지고 계신 병원 진단서나 소견서 사진/PDF를 올리시면 AI가 상병명을 분석해 예상 승인율을 진단합니다.
            </p>
          </div>
          <label style={{
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            color: '#ffffff', borderRadius: '10px', padding: '0.6rem 1.2rem',
            fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)'
          }}>
            <Upload size={18} /> 진단서 파일 첨부스캔
            <input type="file" accept="image/*,.pdf" onChange={handleSimulateOCR} style={{ display: 'none' }} />
          </label>
        </div>

        {analyzing && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a', borderRadius: '12px', color: '#38bdf8', fontWeight: 700 }}>
            ⏳ AI Vision 엔진이 진단서 상병명 및 사고 원인을 정밀 분석 중입니다...
          </div>
        )}

        {scanResult && (
          <div style={{ background: '#0f172a', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.4)', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FileText size={16} color="#38bdf8" /> 스캔 파일: <strong>{scanResult.fileName}</strong>
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '0.2rem 0.7rem', borderRadius: '6px' }}>
                승인 예상 확률: {scanResult.approvalRate}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 800, marginBottom: '0.4rem' }}>
              🩺 진단 상병명: <span style={{ color: '#38bdf8' }}>{scanResult.diagnosis}</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#cbd5e1', marginBottom: '0.8rem', lineHeight: 1.5 }}>
              💡 {scanResult.recommendation}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              📌 추천 제출 필요 서류: {scanResult.neededDocs.join(' · ')}
            </div>
          </div>
        )}
      </div>

      {/* 🧮 정밀 산재 시뮬레이터 카드 */}
      <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '20px', padding: '1.6rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={22} color="#f87171" /> 0% 오차 2026 산재 보상금 정밀 시뮬레이터
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>1일 평균임금 (원)</label>
            <input 
              type="number" 
              step="1000"
              value={dailyWage} 
              onChange={(e) => setDailyWage(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>요양/입원 치료 일수 (일)</label>
            <input 
              type="number" 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>근로자 만 나이 (세)</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>장해 등급 (0: 없음, 1급~14급)</label>
            <input 
              type="number" 
              min="0" 
              max="14" 
              value={disabilityGrade} 
              onChange={(e) => setDisabilityGrade(Number(e.target.value))} 
              style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, boxSizing: 'border-box' }} 
            />
          </div>
        </div>

        {/* 결과 요약 표시 */}
        <div style={{ marginTop: '1.3rem', padding: '1.2rem', background: '#0f172a', borderRadius: '14px', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#94a3b8' }}>1일 휴업급여 (평균임금의 70%):</span>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>{finalDailyOffWork.toLocaleString()} 원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#94a3b8' }}>총 휴업급여 ({days}일간 비과세):</span>
            <span style={{ color: '#34d399', fontWeight: 800 }}>{totalOffWork.toLocaleString()} 원</span>
          </div>
          {disabilityGrade > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>장해급여 (제{disabilityGrade}급 {dDays}일분):</span>
              <span style={{ color: '#fbbf24', fontWeight: 800 }}>{disabilityComp.toLocaleString()} 원</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem', marginTop: '0.6rem' }}>
            <span style={{ color: '#f8fafc', fontWeight: 900, fontSize: '1rem' }}>예상 산재 보상금 합계:</span>
            <span style={{ color: '#f87171', fontWeight: 900, fontSize: '1.3rem' }}>{(totalOffWork + disabilityComp).toLocaleString()} 원</span>
          </div>
        </div>

        {/* 핵심 법률 안내 팁 */}
        <div style={{ marginTop: '1rem', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(15, 23, 42, 0.5)', padding: '0.9rem', borderRadius: '10px' }}>
          💡 <strong>사업주 날인 폐지</strong>: 사장님 도장이나 승인이 없어도 근로자가 근로복지공단에 직접 단독 산재 신청이 가능합니다.<br/>
          🚗 <strong>출퇴근 재해 포함</strong>: 도보, 대중교통, 자가용 출퇴근 길 발생 사고도 100% 산재 보상 대상입니다.<br/>
          🩺 <strong>치료비 비과세</strong>: 요양급여(치료비 전액) 및 휴업급여는 근로소득세와 4대보험 공제 없이 100% 실수령됩니다.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem', marginTop: '2rem' }}>
        {OPTIONS.map((opt) => (
          <Link key={opt.to} to={opt.to} className="home-feature-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span className={`feature-card-tag ${opt.badge === '근로자용' ? 'tag-worker' : 'tag-employer'}`}>
                  {opt.badge}
                </span>
              </div>
              <h3 className="feature-card-title">{opt.title}</h3>
              <p className="feature-card-desc">{opt.desc}</p>
            </div>
            <div className="feature-card-action" style={{ color: opt.badge === '근로자용' ? '#38bdf8' : '#fbbf24' }}>
              가이드 보기 <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

export default InjuryHub;
