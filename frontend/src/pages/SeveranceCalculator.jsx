import React, { useState, useMemo } from 'react';
import { PiggyBank } from 'lucide-react';
import { calculateSeverancePay, getTenure } from '../utils/laborCalc.js';

const today = new Date().toISOString().slice(0, 10);

function SeveranceCalculator() {
  const [hireDate, setHireDate] = useState('');
  const [resignDate, setResignDate] = useState(today);
  const [recentThreeMonthsPay, setRecentThreeMonthsPay] = useState('');
  const [annualBonus, setAnnualBonus] = useState('');
  const [annualLeavePay, setAnnualLeavePay] = useState('');

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
    annualBonus,
    annualLeavePay
  }) : null;

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><PiggyBank size={26} color="#34d399" /> 퇴직금 계산기</h1>
        <p className="tool-page-desc">
          근로자퇴직급여보장법에 따라 1년 이상 계속 근로한 근로자(주 15시간 이상 근무)는 퇴직 시 평균임금을 기준으로 산정한 퇴직금을 받을 수 있습니다.
          퇴직 전 3개월간 지급받은 임금을 기준으로 예상 퇴직금을 계산합니다.
        </p>
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
          <div className="form-group">
            <label className="form-label">최근 3개월간 지급받은 임금 총액 (원)</label>
            <input type="number" className="text-input" placeholder="세전 임금 총액 (기본급+각종 수당)" value={recentThreeMonthsPay} onChange={(e) => setRecentThreeMonthsPay(e.target.value)} min="0" />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>퇴직일 이전 3개월간의 총 일수: {recentThreeMonthsDays}일 (자동 계산)</p>
          </div>
          <div className="form-group">
            <label className="form-label">최근 1년간 지급받은 상여금 총액 (선택, 원)</label>
            <input type="number" className="text-input" value={annualBonus} onChange={(e) => setAnnualBonus(e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">최근 1년간 지급받은 연차수당 총액 (선택, 원)</label>
            <input type="number" className="text-input" value={annualLeavePay} onChange={(e) => setAnnualLeavePay(e.target.value)} min="0" />
          </div>
        </section>

        <section className="glass-panel">
          {!result ? (
            <div className="empty-state">
              <PiggyBank size={40} className="empty-icon" />
              <p className="empty-title">입사일을 입력해 주세요</p>
              <p className="empty-desc">입사일과 최근 3개월 임금을 입력하면 예상 퇴직금을 계산해 드립니다.</p>
            </div>
          ) : (
            <>
              <div className="result-highlight">
                <div className="result-highlight-label">예상 퇴직금</div>
                <div className="result-highlight-value">{result.severancePay.toLocaleString()}원</div>
                <div className="result-highlight-sub">재직일수 {result.totalDays}일 (근속 약 {tenure ? (Math.round(tenure.totalYears * 10) / 10) : 0}년)</div>
              </div>

              <div className="result-row">
                <span className="result-row-label">1일 평균임금</span>
                <span className="result-row-value">{result.averageDailyWage.toLocaleString()}원</span>
              </div>
              <div className="result-row">
                <span className="result-row-label">계산식</span>
                <span className="result-row-value" style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>1일 평균임금 × 30일 × (재직일수 ÷ 365)</span>
              </div>

              {!result.isEligible ? (
                <div className="info-callout warning">
                  재직일수가 1년(365일) 미만이거나 주 15시간 미만 근무자는 퇴직금 지급 대상이 아닙니다(근로자퇴직급여보장법 제4조).
                </div>
              ) : (
                <div className="info-callout info">
                  본 결과는 입력하신 정보를 바탕으로 한 참고용 추정치입니다. 실제 평균임금은 상여금·연차수당 산입 방식에 따라 달라질 수 있으니 정확한 금액은 회사 급여 담당자 또는 고용노동부 퇴직금 계산기로 재확인하시기 바랍니다.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default SeveranceCalculator;
