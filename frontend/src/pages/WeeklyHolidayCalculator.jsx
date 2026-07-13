import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { calculateWeeklyHolidayPay, AVG_WEEKS_PER_MONTH, calculateHoursAndNightHours } from '../utils/laborCalc.js';

function TimeSelectInput({ value, onChange }) {
  const [hStr, mStr] = (value || '00:00').split(':');

  const handleHourChange = (e) => {
    onChange(`${e.target.value}:${mStr}`);
  };

  const handleMinuteChange = (e) => {
    onChange(`${hStr}:${e.target.value}`);
  };

  return (
    <div style={{ display: 'flex', gap: '0.2rem', width: '100%' }}>
      <select className="text-input" value={hStr} onChange={handleHourChange} style={{ padding: '0.75rem 0.2rem', textAlign: 'center', flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
        {Array.from({ length: 24 }, (_, i) => {
          const val = String(i).padStart(2, '0');
          return <option key={val} value={val}>{val}시</option>;
        })}
      </select>
      <select className="text-input" value={mStr} onChange={handleMinuteChange} style={{ padding: '0.75rem 0.2rem', textAlign: 'center', flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
        {Array.from({ length: 60 }, (_, i) => {
          const val = String(i).padStart(2, '0');
          return <option key={val} value={val}>{val}분</option>;
        })}
      </select>
    </div>
  );
}

function WeeklyHolidayCalculator() {
  const [hourlyWage, setHourlyWage] = useState('10030');
  const [weeklyWorkDays, setWeeklyWorkDays] = useState('5');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState('60');

  const p = calculateHoursAndNightHours(startTime, endTime, breakMinutes);
  const weeklyWorkHours = p.workHours * (parseFloat(weeklyWorkDays) || 0);

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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>출근 시간</span>
              <TimeSelectInput value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>퇴근 시간</span>
              <TimeSelectInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">하루 휴게시간 (분)</label>
            <input type="number" className="text-input" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} min="0" />
          </div>

          <div className="form-group" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: 0 }}>
            <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>자동 계산된 근로시간</span>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              하루 근로시간: <strong style={{ color: '#f8fafc' }}>{p.workHours}시간</strong> (휴게 {breakMinutes}분 제외)<br />
              주 소정근로시간: <strong style={{ color: '#f8fafc' }}>{Math.round(weeklyWorkHours * 10) / 10}시간</strong> (주 {weeklyWorkDays}일 기준)
            </p>
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
