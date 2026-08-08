import React, { useState, useMemo } from 'react';
import { PiggyBank, Calculator, ShieldCheck, DollarSign, FileText, Printer, AlertTriangle, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';
import { calculateSeverancePay, getTenure } from '../utils/laborCalc.js';
import UsageGuide from '../components/UsageGuide.jsx';
import SEO from '../components/SEO.jsx';
import SeveranceReceiptModal from '../components/SeveranceReceiptModal.jsx';
import SeveranceInterimModal from '../components/SeveranceInterimModal.jsx';

const today = new Date().toISOString().slice(0, 10);

function SeveranceCalculator() {
  const [pensionType, setPensionType] = useState('db'); // 'db': 확정급여형/법정퇴직금, 'dc': 확정기여형
  const [hireDate, setHireDate] = useState('');
  const [resignDate, setResignDate] = useState(today);
  const [recentThreeMonthsPay, setRecentThreeMonthsPay] = useState('');
  const [annualBonus, setAnnualBonus] = useState('');
  const [annualLeavePay, setAnnualLeavePay] = useState('');
  const [annualSalaryDC, setAnnualSalaryDC] = useState(''); // DC형 연간 총 임금액

  // ⚖️ 임금 산정 방식 선택: 'auto'(법정 자동 비교), 'average'(평균임금 전용), 'ordinary'(통상임금 전용)
  const [wageCalcMethod, setWageCalcMethod] = useState('auto');

  // ⏰ 통상시급 입력 (근로기준법 제2조 제2항 통상임금 비교 반영)
  const [hourlyWage, setHourlyWage] = useState('');
  const [dailyWorkHours, setDailyWorkHours] = useState('8');

  // 🏥 산재/육아휴직/승인병가 등 제외기간 (근로기준법 시행령 제2조)
  const [showExcludedOption, setShowExcludedOption] = useState(false);
  const [excludedDays, setExcludedDays] = useState('');
  const [excludedPay, setExcludedPay] = useState('');

  // 🎖️ 재직일수(근속기간) 차감 일수 (군 복무, 개인 무급휴직, 정직 등)
  const [showTenureDeductOption, setShowTenureDeductOption] = useState(false);
  const [deductedTenureDays, setDeductedTenureDays] = useState('');

  // 서식 모달 열림 상태
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isInterimModalOpen, setIsInterimModalOpen] = useState(false);

  const recentThreeMonthsDays = useMemo(() => {
    if (!resignDate) return 0;
    const end = new Date(resignDate);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 3);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 1);
  }, [resignDate]);

  const tenure = hireDate ? getTenure(hireDate, resignDate) : null;
  const result = hireDate ? calculateSeverancePay({
    hireDateStr: hireDate,
    resignDateStr: resignDate,
    recentThreeMonthsPay,
    recentThreeMonthsDays,
    excludedDays,
    excludedPay,
    deductedTenureDays,
    annualBonus,
    annualLeavePay,
    hourlyWage,
    dailyWorkHours,
    wageCalcMethod,
    pensionType,
    annualSalaryDC
  }) : null;

  return (
    <div className="page-container">
      <SEO
        title="2026 퇴직금·퇴직연금DB/DC 계산기"
        description="근로기준법 대법원 판례 기준 평균임금 vs 통상임금 자동 비교 및 2026 퇴직소득세, 세후 실수령액 0% 오차 정밀 계산기"
        path="/tools/severance"
      />
      <div className="tool-page-header">
        <h1 className="tool-page-title"><PiggyBank size={26} color="#34d399" /> 퇴직금 & 퇴직연금 계산기</h1>
        <p className="tool-page-desc">
          근로자퇴직급여보장법 및 <strong>근로기준법(제2조 제2항 통상임금 선택 및 비교, 시행령 제2조 제외기간)</strong>을 반영하여 <strong>DB형(확정급여형)</strong>과 <strong>DC형(확정기여형)</strong>을 비교하고, <strong>평균임금/통상임금 수동/자동 선택</strong>과 소득세법 기준 <strong>법정 퇴직소득세 및 세후 실수령액</strong>을 실시간 계산합니다.
        </p>
      </div>

      <UsageGuide guideKey="severance" />

      {/* 퇴직연금 유형 선택 (DB형 vs DC형) */}
      <div style={{ background: '#0f172a', padding: '0.85rem 1rem', borderRadius: '14px', border: '1.5px solid #38bdf8', marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 900, marginBottom: '0.45rem' }}>
          💡 퇴직연금 / 퇴직금 계산 방식 선택
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setPensionType('db')}
            style={{
              padding: '0.65rem 0.5rem', borderRadius: '8px',
              background: pensionType === 'db' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#1e293b',
              color: pensionType === 'db' ? '#ffffff' : '#94a3b8',
              border: pensionType === 'db' ? '1px solid #38bdf8' : '1px solid #334155',
              fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center'
            }}
          >
            🏛️ DB형 (확정급여형 / 일반 법정퇴직금)<br/>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.9 }}>1일 단가(평균/통상 선택) × 30일 × (재직일수 / 365)</span>
          </button>

          <button
            type="button"
            onClick={() => setPensionType('dc')}
            style={{
              padding: '0.65rem 0.5rem', borderRadius: '8px',
              background: pensionType === 'dc' ? 'linear-gradient(135deg, #7c3aed, #c084fc)' : '#1e293b',
              color: pensionType === 'dc' ? '#ffffff' : '#94a3b8',
              border: pensionType === 'dc' ? '1px solid #c084fc' : '1px solid #334155',
              fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center'
            }}
          >
            💳 DC형 (확정기여형 퇴직연금)<br/>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.9 }}>연간 임금 총액 ÷ 12 (매년 8.33% 적립)</span>
          </button>
        </div>
      </div>

      <div className="tool-grid">
        <section className="glass-panel">
          <div className="form-group">
            <label className="form-label">입사일</label>
            <input type="date" className="text-input" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">퇴사일 (기준일)</label>
            <input type="date" className="text-input" value={resignDate} onChange={(e) => setResignDate(e.target.value)} />
          </div>

          {/* ⚖️ DB형일 때 평균임금 vs 통상임금 선택 셀렉터 */}
          {pensionType === 'db' && (
            <div style={{ background: '#0f172a', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #a855f7', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#c084fc', fontWeight: 900, marginBottom: '0.4rem' }}>
                ⚖️ 1일 적용 임금 산정 선택
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setWageCalcMethod('auto')}
                  style={{
                    padding: '0.5rem 0.3rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                    background: wageCalcMethod === 'auto' ? '#a855f7' : '#1e293b',
                    color: wageCalcMethod === 'auto' ? '#ffffff' : '#94a3b8',
                    border: wageCalcMethod === 'auto' ? '1px solid #c084fc' : '1px solid #334155'
                  }}
                >
                  ✨ 법정 자동 비교 (추천)
                </button>
                <button
                  type="button"
                  onClick={() => setWageCalcMethod('average')}
                  style={{
                    padding: '0.5rem 0.3rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                    background: wageCalcMethod === 'average' ? '#0284c7' : '#1e293b',
                    color: wageCalcMethod === 'average' ? '#ffffff' : '#94a3b8',
                    border: wageCalcMethod === 'average' ? '1px solid #38bdf8' : '1px solid #334155'
                  }}
                >
                  📊 평균임금 방식
                </button>
                <button
                  type="button"
                  onClick={() => setWageCalcMethod('ordinary')}
                  style={{
                    padding: '0.5rem 0.3rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                    background: wageCalcMethod === 'ordinary' ? '#059669' : '#1e293b',
                    color: wageCalcMethod === 'ordinary' ? '#ffffff' : '#94a3b8',
                    border: wageCalcMethod === 'ordinary' ? '1px solid #34d399' : '1px solid #334155'
                  }}
                >
                  ⏰ 통상임금 방식
                </button>
              </div>
            </div>
          )}

          {/* 🎖️ 재직일수(근속기간) 차감 옵션 (군복무, 개인 무급휴직, 정직 등) */}
          <div style={{ background: '#0f172a', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #334155', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                🎖️ 근속기간(재직일수)에서 제외해야 하는 기간이 있나요?
              </span>
              <button
                type="button"
                onClick={() => setShowTenureDeductOption(!showTenureDeductOption)}
                style={{
                  background: showTenureDeductOption ? '#ea580c' : '#0284c7',
                  color: '#ffffff', border: 'none', borderRadius: '6px',
                  padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {showTenureDeductOption ? '접기' : '설정하기'}
              </button>
            </div>

            {showTenureDeductOption && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #334155' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
                  🎖️ <strong>근속기간 차감 사유</strong>: 군 복무 휴직 기간, 회사 승인 없는 개인 무급 휴직, 무단 결근 및 정직 기간 등 약정상 근속연수 제외 대상 일수를 입력하세요.
                </p>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>재직일수 차감 일수 (일)</label>
                  <input
                    type="number"
                    className="text-input"
                    placeholder="예: 30 (군복무/개인휴직 차감일수)"
                    value={deductedTenureDays}
                    onChange={(e) => setDeductedTenureDays(e.target.value)}
                    min="0"
                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {pensionType === 'dc' ? (
            <div className="form-group">
              <label className="form-label" style={{ color: '#c084fc', fontWeight: 800 }}>DC형 연간 임금 총액 (원)</label>
              <input
                type="number"
                className="text-input"
                placeholder="1년간 지급된 세전 임금총액 (미입력 시 3개월 x 4 자동 적용)"
                value={annualSalaryDC}
                onChange={(e) => setAnnualSalaryDC(e.target.value)}
                min="0"
                style={{ borderColor: '#c084fc' }}
              />
              <p style={{ fontSize: '0.73rem', color: '#c084fc', marginTop: '0.4rem' }}>
                💡 DC형은 연간 임금 총액의 1/12 이상을 매년 근로자의 개인 DC계좌에 적립하는 방식입니다.
              </p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">최근 3개월간 지급받은 임금 총액 (원)</label>
                <input type="number" className="text-input" placeholder="세전 임금 총액 (기본급+각종 수당)" value={recentThreeMonthsPay} onChange={(e) => setRecentThreeMonthsPay(e.target.value)} min="0" />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                  퇴직일 이전 3개월간의 총 일수: {recentThreeMonthsDays}일 {excludedDays > 0 ? `(제외 ${excludedDays}일 적용 후: ${recentThreeMonthsDays - excludedDays}일)` : '(자동 계산)'}
                </p>
              </div>

              {/* ⏰ 통상시급 및 1일 소정근로시간 입력 (통상임금 비교용) */}
              <div style={{ background: '#0f172a', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #34d399', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#34d399', fontWeight: 900, marginBottom: '0.4rem' }}>
                  ⏰ 통상시급 입력 (통상임금 방식 또는 비교 산정용)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.73rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>통상시급 (원)</label>
                    <input
                      type="number"
                      className="text-input"
                      placeholder="예: 12000"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(e.target.value)}
                      min="0"
                      style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>1일 소정근로시간 (시간)</label>
                    <input
                      type="number"
                      className="text-input"
                      placeholder="8"
                      value={dailyWorkHours}
                      onChange={(e) => setDailyWorkHours(e.target.value)}
                      min="1"
                      max="24"
                      style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 🏥 산재/육아휴직/승인병가 제외기간 토글 */}
              <div style={{ background: '#0f172a', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #334155', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fb923c' }}>
                    🏥 산재 요양 · 👶 육아휴직 · 🩺 승인병가 기간이 있나요?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExcludedOption(!showExcludedOption)}
                    style={{
                      background: showExcludedOption ? '#e11d48' : '#0284c7',
                      color: '#ffffff', border: 'none', borderRadius: '6px',
                      padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    {showExcludedOption ? '접기' : '입력하기'}
                  </button>
                </div>

                {showExcludedOption && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #334155' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
                      ⚖️ <strong>근로기준법 시행령 제2조 1항</strong>: 산재 요양기간, 육아휴직, 사용자 승인 병가/휴직 기간 및 그 임금은 평균임금 계산 3개월 총일수와 임금에서 <strong>완전히 제외(산외)</strong>하여 불이익 없이 정밀 계산됩니다.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>제외 기간 일수 (일)</label>
                        <input
                          type="number"
                          className="text-input"
                          placeholder="예: 30"
                          value={excludedDays}
                          onChange={(e) => setExcludedDays(e.target.value)}
                          min="0"
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>제외 기간 중 수령한 임금 (원)</label>
                        <input
                          type="number"
                          className="text-input"
                          placeholder="예: 0 또는 휴업수당"
                          value={excludedPay}
                          onChange={(e) => setExcludedPay(e.target.value)}
                          min="0"
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">최근 1년간 지급받은 상여금 총액 (선택, 원)</label>
                <input type="number" className="text-input" value={annualBonus} onChange={(e) => setAnnualBonus(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">최근 1년간 지급받은 연차수당 총액 (선택, 원)</label>
                <input type="number" className="text-input" value={annualLeavePay} onChange={(e) => setAnnualLeavePay(e.target.value)} min="0" />
              </div>
            </>
          )}
        </section>

        <section className="glass-panel">
          {!result ? (
            <div className="empty-state">
              <PiggyBank size={40} className="empty-icon" />
              <p className="empty-title">입사일을 입력해 주세요</p>
              <p className="empty-desc">입사일과 임금을 입력하면 예상 세전 퇴직금 및 퇴직소득세, 실수령액을 계산해 드립니다.</p>
            </div>
          ) : (
            <>
              {/* 산정 방식 안내 배너 */}
              {result.wageCalcMethod === 'ordinary' ? (
                <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '0.8rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={18} /> ⏰ 통상임금 방식(통상시급 × 소정근로시간)으로 계산되었습니다.
                </div>
              ) : result.wageCalcMethod === 'average' ? (
                <div style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#ffffff', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '0.8rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={18} /> 📊 최근 3개월 평균임금 방식으로 계산되었습니다.
                </div>
              ) : result.isOrdinaryWageApplied ? (
                <div style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}>
                  <Scale size={24} color="#fef08a" />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.88rem' }}>⚖️ 근로기준법 제2조 제2항 통상임금 유리성 소급 적용</div>
                    <div style={{ fontSize: '0.76rem', opacity: 0.95 }}>
                      평균 1일 임금({(result?.averageDailyWage || 0).toLocaleString()}원)보다 통상 1일 임금({(result?.ordinaryDailyWage || 0).toLocaleString()}원)이 더 높아 <strong>통상임금이 법정 자동 소급 적용</strong>되었습니다.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 최종 세후 실수령액 하이라이트 박스 */}
              <div className="result-highlight" style={{ background: 'linear-gradient(135deg, #064e3b, #047857)', border: '1.5px solid #34d399' }}>
                <div className="result-highlight-label" style={{ color: '#a7f3d0' }}>
                  {pensionType === 'dc' ? '💳 DC형 예상 세후 실수령액' : '🏛️ DB형 예상 세후 실수령액'}
                </div>
                <div className="result-highlight-value" style={{ color: '#ffffff', fontSize: '1.9rem', fontWeight: 900 }}>
                  {(result?.taxInfo?.netSeverancePay || 0).toLocaleString()} 원
                </div>
                <div className="result-highlight-sub" style={{ color: '#d1fae5' }}>
                  세전 퇴직금 {(result?.severancePay || 0).toLocaleString()}원 | 공제 세금 총 -{(result?.taxInfo?.totalTax || 0).toLocaleString()}원
                </div>
              </div>

              {/* 서식 출력 및 발급 액션 버튼 2종 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(true)}
                  style={{
                    padding: '0.6rem 0.5rem', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Printer size={15} /> 📄 수령확인서 발급
                </button>

                <button
                  type="button"
                  onClick={() => setIsInterimModalOpen(true)}
                  style={{
                    padding: '0.6rem 0.5rem', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    boxShadow: '0 4px 10px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <FileText size={15} /> 📌 중간정산 신청서
                </button>
              </div>

              {/* 세부 내역 */}
              <div className="result-row">
                <span className="result-row-label">세전 예상 퇴직금</span>
                <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 800 }}>{(result?.severancePay || 0).toLocaleString()}원</span>
              </div>

              {pensionType === 'db' && (
                <>
                  <div className="result-row">
                    <span className="result-row-label">산출 1일 평균임금</span>
                    <span className="result-row-value">{(result?.averageDailyWage || 0).toLocaleString()}원</span>
                  </div>
                  {(result?.ordinaryDailyWage || 0) > 0 && (
                    <div className="result-row">
                      <span className="result-row-label">입력 1일 통상임금</span>
                      <span className="result-row-value" style={{ color: result?.isOrdinaryWageApplied ? '#34d399' : '#94a3b8', fontWeight: 800 }}>
                        {(result?.ordinaryDailyWage || 0).toLocaleString()}원 {result?.isOrdinaryWageApplied && '(적용)'}
                      </span>
                    </div>
                  )}
                  <div className="result-row">
                    <span className="result-row-label">최종 적용 1일 임금</span>
                    <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 900 }}>
                      {(result?.appliedDailyWage || 0).toLocaleString()}원
                    </span>
                  </div>
                </>
              )}

              <div className="result-row">
                <span className="result-row-label">인정 근속연수 (인정 재직일수)</span>
                <span className="result-row-value">
                  {result?.tenureYears || 0}년 ({result?.totalDays || 0}일)
                  {(result?.deductedTenureDays || 0) > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', marginLeft: '0.3rem' }}>(총 {result?.rawTenureDays || 0}일 중 -{result?.deductedTenureDays}일 차감)</span>
                  )}
                </span>
              </div>

              {/* 소득세법 개정안 기준 법정 퇴직소득세 명세 카드 */}
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', marginTop: '0.75rem', fontSize: '0.78rem' }}>
                <div style={{ color: '#fb923c', fontWeight: 900, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🏛️ 법정 퇴직소득세 공제 산출 명세</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>소득세법 제55조 귀속 세율</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#cbd5e1' }}>
                  <span>근속연수 공제액:</span>
                  <span style={{ fontWeight: 700 }}>-{(result?.taxInfo?.tenureDeduction || 0).toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#cbd5e1' }}>
                  <span>환산급여 과세표준:</span>
                  <span>{(result?.taxInfo?.taxBase || 0).toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#f87171', fontWeight: 700 }}>
                  <span>🔻 퇴직소득세:</span>
                  <span>-{(result?.taxInfo?.incomeTax || 0).toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#f87171', fontWeight: 700 }}>
                  <span>🔻 지방소득세 (10%):</span>
                  <span>-{(result?.taxInfo?.localTax || 0).toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.3rem', borderTop: '1px solid #334155', color: '#ef4444', fontWeight: 900 }}>
                  <span>총 공제 세금:</span>
                  <span>-{(result?.taxInfo?.totalTax || 0).toLocaleString()} 원</span>
                </div>
              </div>

              {!result.isEligible ? (
                <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                  실제 인정 재직일수가 1년(365일) 미만이거나 주 15시간 미만 근무자는 퇴직금 지급 대상이 아닙니다(근로자퇴직급여보장법 제4조).
                </div>
              ) : (
                <div className="info-callout info" style={{ marginTop: '0.75rem' }}>
                  💡 <strong>임금 산정 방식 자유 선택</strong>: 법정 자동 비교, 평균임금 전용, 통상임금 전용 모드 중 원하는 기준을 자유롭게 선택하여 비교할 수 있습니다.
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 법정 서식 인쇄 모달 연동 */}
      {result && (
        <>
          <SeveranceReceiptModal
            isOpen={isReceiptModalOpen}
            onClose={() => setIsReceiptModalOpen(false)}
            severanceData={{
              ...result,
              hireDateStr: hireDate,
              resignDateStr: resignDate
            }}
          />
          <SeveranceInterimModal
            isOpen={isInterimModalOpen}
            onClose={() => setIsInterimModalOpen(false)}
            severanceData={{
              ...result,
              hireDateStr: hireDate,
              resignDateStr: resignDate
            }}
          />
        </>
      )}
    </div>
  );
}

export default SeveranceCalculator;
