import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { calculateWeeklyHolidayPay, AVG_WEEKS_PER_MONTH } from '../utils/laborCalc.js';

function WeeklyHolidayCalculator() {
  const [hourlyWage, setHourlyWage] = useState('10030');
  const [weeklyWorkDays, setWeeklyWorkDays] = useState('5');
  const [weeklyWorkHours, setWeeklyWorkHours] = useState('40');

  const result = calculateWeeklyHolidayPay({ hourlyWage, weeklyWorkDays, weeklyWorkHours });
  const monthlyEstimate = Math.round(result.weeklyHolidayPay * AVG_WEEKS_PER_MONTH);

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Calendar size={26} color="#38bdf8" /> 주휴수당 계산기</h1>
        <p className="tool-page-desc">
          근로기준법 제55조에 따라 1주 소정근로시간이 15시간 이상이고 개근한 근로자는 유급 주휴일에 대한 임금(주휴수당)을 받을 수 있습니다.
          시급과 근무 조건을 입력해 대상 여부와 금액을 확인하세요.
        </p>
      </div>

      <div className="tool-grid">
        <section className="glass-panel">
          <div className="form-group">
            <label className="form-label">시급 (원)</label>
            <input type="number" className="text-input" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">주 소정근로일수 (일)</label>
            <input type="number" className="text-input" value={weeklyWorkDays} onChange={(e) => setWeeklyWorkDays(e.target.value)} min="0" max="7" />
          </div>
          <div className="form-group">
            <label className="form-label">주 소정근로시간 (시간)</label>
            <input type="number" className="text-input" value={weeklyWorkHours} onChange={(e) => setWeeklyWorkHours(e.target.value)} min="0" />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>주휴수당은 1주 15시간 이상 근무하고, 소정근로일에 결근 없이 개근했을 때 발생합니다.</p>
          </div>
        </section>

        <section className="glass-panel">
          <div className="result-highlight">
            <div className="result-highlight-label">{result.isEligible ? '1주 주휴수당' : '주휴수당 대상 여부'}</div>
            <div className="result-highlight-value">
              {result.isEligible ? `${result.weeklyHolidayPay.toLocaleString()}원` : '지급 대상 아님'}
            </div>
            {result.isEligible && <div className="result-highlight-sub">월 환산 약 {monthlyEstimate.toLocaleString()}원 (주 4.345회 기준)</div>}
          </div>

          {result.isEligible ? (
            <>
              <div className="result-row">
                <span className="result-row-label">주휴수당 지급 기준시간</span>
                <span className="result-row-value">{result.dailyGrantHours}시간</span>
              </div>
              <div className="result-row">
                <span className="result-row-label">1일 평균 근로시간</span>
                <span className="result-row-value">{Math.round(result.averageDailyHours * 100) / 100}시간</span>
              </div>
              <div className="info-callout success">
                주 15시간 이상 근무 요건을 충족하여 주휴수당 지급 대상입니다. 다만 결근 없이 소정근로일을 개근해야 실제로 지급됩니다.
              </div>
            </>
          ) : (
            <div className="info-callout warning">
              입력하신 주 소정근로시간이 15시간 미만이거나 근무일수가 없어 주휴수당 지급 대상이 아닙니다(근로기준법 제18조 제3항).
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default WeeklyHolidayCalculator;
