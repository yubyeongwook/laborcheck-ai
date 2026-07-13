import React, { useState } from 'react';
import { Coins, Building2, Clock, Plus, Trash2, Sun, CalendarClock } from 'lucide-react';
import { calculateHoursAndNightHours, calculateYearlyEntryPay, getDeductionRatesForYear, getMinWageForYear } from '../utils/laborCalc.js';

const currentYear = new Date().getFullYear();

let idCounter = 0;
const nextId = () => `entry-${Date.now()}-${idCounter++}`;

const makeDefaultEntry = (year) => ({
  id: nextId(),
  year: String(year),
  companySize: '5인 이상',
  baseHourlyWage: String(getMinWageForYear(year)),
  pattern1Days: '5', pattern1Start: '09:00', pattern1End: '18:00', pattern1BreakH: '1', pattern1BreakM: '0', pattern1NightBreakH: '0', pattern1NightBreakM: '0',
  pattern2Days: '0', pattern2Start: '09:00', pattern2End: '18:00', pattern2BreakH: '1', pattern2BreakM: '0', pattern2NightBreakH: '0', pattern2NightBreakM: '0',
  pattern3Days: '0', pattern3Start: '09:00', pattern3End: '18:00', pattern3BreakH: '1', pattern3BreakM: '0', pattern3NightBreakH: '0', pattern3NightBreakM: '0',
  annualLeaveDays: '0',
  holidayWorkDays: '0',
  pensionBasis: '0',
  extraWeeklyOvertime: '0'
});

// "1시간 30분" 형태로 표시
export const formatMinutesAsHM = (totalMinutes) => {
  const m = Math.max(Math.round(totalMinutes), 0);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}분`;
  if (rest === 0) return `${h}시간`;
  return `${h}시간 ${rest}분`;
};

const breakMinutesOf = (entry, n) =>
  (parseFloat(entry[`pattern${n}BreakH`]) || 0) * 60 + (parseFloat(entry[`pattern${n}BreakM`]) || 0);

const nightBreakMinutesOf = (entry, n) =>
  (parseFloat(entry[`pattern${n}NightBreakH`]) || 0) * 60 + (parseFloat(entry[`pattern${n}NightBreakM`]) || 0);

function computeDerived(entry) {
  const p1BreakMinutes = breakMinutesOf(entry, 1);
  const p2BreakMinutes = breakMinutesOf(entry, 2);
  const p3BreakMinutes = breakMinutesOf(entry, 3);
  const p1NightBreakMinutes = nightBreakMinutesOf(entry, 1);
  const p2NightBreakMinutes = nightBreakMinutesOf(entry, 2);
  const p3NightBreakMinutes = nightBreakMinutesOf(entry, 3);
  const p1 = calculateHoursAndNightHours(entry.pattern1Start, entry.pattern1End, p1BreakMinutes, p1NightBreakMinutes);
  const p2 = calculateHoursAndNightHours(entry.pattern2Start, entry.pattern2End, p2BreakMinutes, p2NightBreakMinutes);
  const p3 = calculateHoursAndNightHours(entry.pattern3Start, entry.pattern3End, p3BreakMinutes, p3NightBreakMinutes);
 
  const p1Days = parseFloat(entry.pattern1Days) || 0;
  const p2Days = parseFloat(entry.pattern2Days) || 0;
  const p3Days = parseFloat(entry.pattern3Days) || 0;
  const totalWeeklyDays = p1Days + p2Days + p3Days;
 
  const weeklyNightHours = (p1.nightHours * p1Days) + (p2.nightHours * p2Days) + (p3.nightHours * p3Days);
  const weeklyHours = (p1.workHours * p1Days) + (p2.workHours * p2Days) + (p3.workHours * p3Days);
  const totalBreakMinutesWeekly = (p1BreakMinutes * p1Days) + (p2BreakMinutes * p2Days) + (p3BreakMinutes * p3Days);
 
  const result = calculateYearlyEntryPay({
    year: entry.year,
    companySize: entry.companySize,
    baseHourlyWage: entry.baseHourlyWage,
    pattern1Days: entry.pattern1Days, pattern1Hours: p1.workHours,
    pattern2Days: entry.pattern2Days, pattern2Hours: p2.workHours,
    pattern3Days: entry.pattern3Days, pattern3Hours: p3.workHours,
    weeklyNightHours,
    annualLeaveDays: parseFloat(entry.annualLeaveDays) || 0,
    holidayWorkDays: parseFloat(entry.holidayWorkDays) || 0,
    pensionBasis: parseFloat(entry.pensionBasis) || 0,
    extraWeeklyOvertime: parseFloat(entry.extraWeeklyOvertime) || 0
  });
 
  return { p1, p2, p3, weeklyHours, totalWeeklyDays, p1BreakMinutes, p2BreakMinutes, p3BreakMinutes, totalBreakMinutesWeekly, holidayWorkDays: parseFloat(entry.holidayWorkDays) || 0, result };
}

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

function PatternInput({
  label, days, onDaysChange, start, onStartChange, end, onEndChange, hours,
  breakH, onBreakHChange, breakM, onBreakMChange, breakMinutes,
  nightOverlapRaw, nightHours, nightBreakH, onNightBreakHChange, nightBreakM, onNightBreakMChange
}) {
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주 근무일수 (최대 6일)</span>
          <input type="number" className="text-input" value={days} onChange={(e) => onDaysChange(e.target.value)} min="0" max="6" />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
          <TimeSelectInput value={start} onChange={onStartChange} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
          <TimeSelectInput value={end} onChange={onEndChange} />
        </div>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>이 패턴의 총 휴게시간</span>
        <HourMinuteInput hourValue={breakH} onHourChange={onBreakHChange} minuteValue={breakM} onMinuteChange={onBreakMChange} />
      </div>

      {nightOverlapRaw > 0 && (
        <div style={{ marginTop: '0.5rem', background: 'rgba(165, 180, 252, 0.06)', padding: '0.6rem', borderRadius: '6px', border: '1px dashed rgba(165, 180, 252, 0.25)' }}>
          <span style={{ fontSize: '0.7rem', color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>
            이 중 야간시간대(22:00~06:00)에 사용한 휴게시간
          </span>
          <HourMinuteInput hourValue={nightBreakH} onHourChange={onNightBreakHChange} minuteValue={nightBreakM} onMinuteChange={onNightBreakMChange} />
          <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
            야간 근로시간대 총 {formatMinutesAsHM(nightOverlapRaw * 60)} 중, 실제 야간근로 인정시간은 <strong style={{ color: '#a5b4fc' }}>{formatMinutesAsHM(nightHours * 60)}</strong>
          </p>
        </div>
      )}

      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
        하루 근로시간: <strong>{hours}시간</strong> (휴게 {formatMinutesAsHM(breakMinutes)} 제외)
      </div>
    </div>
  );
}

// 시간 + 분을 각각 따로 입력받는 공용 입력 필드
function HourMinuteInput({ hourValue, onHourChange, minuteValue, onMinuteChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      <div>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>시간</span>
        <input type="number" className="text-input" value={hourValue} onChange={(e) => onHourChange(e.target.value)} min="0" />
      </div>
      <div>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>분</span>
        <input type="number" className="text-input" value={minuteValue} onChange={(e) => onMinuteChange(e.target.value)} min="0" max="59" />
      </div>
    </div>
  );
}

function YearEntryCard({ entry, onChange, onRemove, removable }) {
  const update = (key) => (value) => onChange({ ...entry, [key]: value });
  const { p1, p2, p3, weeklyHours, totalWeeklyDays, p1BreakMinutes, p2BreakMinutes, p3BreakMinutes, totalBreakMinutesWeekly, holidayWorkHours, result } = computeDerived(entry);
  const rates = getDeductionRatesForYear(entry.year);

  return (
    <section className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarClock size={18} color="#38bdf8" />
          <input
            type="number"
            className="text-input"
            value={entry.year}
            onChange={(e) => {
              const newYear = e.target.value;
              const oldYear = entry.year;
              const oldMinWage = getMinWageForYear(oldYear);
              const newMinWage = getMinWageForYear(newYear);
              
              const updated = { year: newYear };
              if (parseInt(entry.baseHourlyWage, 10) === oldMinWage) {
                updated.baseHourlyWage = String(newMinWage);
              }
              onChange({ ...entry, ...updated });
            }}
            style={{ width: '110px', fontWeight: 700 }}
          />
          <span
            className={`compliance-badge ${result.isMinWageCompliant ? 'pass' : 'danger'}`}
          >
            {result.year}년 최저임금 {result.minWage.toLocaleString()}원 {result.isMinWageCompliant ? '준수' : '미달'}
          </span>
        </div>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.7rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <Trash2 size={13} /> 이 연도 삭제
          </button>
        )}
      </div>

      <div className="tool-grid">
        <div>
          <div className="form-group">
            <label className="form-label"><Building2 size={16} /> 사업장 규모</label>
            <div className="radio-group">
              <div className={`radio-card ${entry.companySize === '5인 미만' ? 'active' : ''}`} onClick={() => update('companySize')('5인 미만')}>
                <span className="radio-card-title">5인 미만</span>
                <span className="radio-card-desc">가산수당 없음</span>
              </div>
              <div className={`radio-card ${entry.companySize === '5인 이상' ? 'active' : ''}`} onClick={() => update('companySize')('5인 이상')}>
                <span className="radio-card-title">5인 이상</span>
                <span className="radio-card-desc">가산수당 적용</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><Coins size={16} color="#f59e0b" /> 이 연도 기초시급 (원)</label>
            <input 
              type="text" 
              className="text-input" 
              value={entry.baseHourlyWage === '0' || !entry.baseHourlyWage ? '' : Number(entry.baseHourlyWage).toLocaleString()} 
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) {
                  update('baseHourlyWage')(raw || '0');
                }
              }} 
            />
          </div>

          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <label className="form-label"><Clock size={16} color="#38bdf8" /> 근무 시간 (패턴별 휴게시간 각각 적용)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <PatternInput label="근무 패턴 1" days={entry.pattern1Days} onDaysChange={update('pattern1Days')} start={entry.pattern1Start} onStartChange={update('pattern1Start')} end={entry.pattern1End} onEndChange={update('pattern1End')} hours={p1.workHours} breakH={entry.pattern1BreakH} onBreakHChange={update('pattern1BreakH')} breakM={entry.pattern1BreakM} onBreakMChange={update('pattern1BreakM')} breakMinutes={p1BreakMinutes} nightOverlapRaw={p1.nightOverlapRaw} nightHours={p1.nightHours} nightBreakH={entry.pattern1NightBreakH} onNightBreakHChange={update('pattern1NightBreakH')} nightBreakM={entry.pattern1NightBreakM} onNightBreakMChange={update('pattern1NightBreakM')} />
              <PatternInput label="근무 패턴 2 (선택)" days={entry.pattern2Days} onDaysChange={update('pattern2Days')} start={entry.pattern2Start} onStartChange={update('pattern2Start')} end={entry.pattern2End} onEndChange={update('pattern2End')} hours={p2.workHours} breakH={entry.pattern2BreakH} onBreakHChange={update('pattern2BreakH')} breakM={entry.pattern2BreakM} onBreakMChange={update('pattern2BreakM')} breakMinutes={p2BreakMinutes} nightOverlapRaw={p2.nightOverlapRaw} nightHours={p2.nightHours} nightBreakH={entry.pattern2NightBreakH} onNightBreakHChange={update('pattern2NightBreakH')} nightBreakM={entry.pattern2NightBreakM} onNightBreakMChange={update('pattern2NightBreakM')} />
              <PatternInput label="근무 패턴 3 (선택)" days={entry.pattern3Days} onDaysChange={update('pattern3Days')} start={entry.pattern3Start} onStartChange={update('pattern3Start')} end={entry.pattern3End} onEndChange={update('pattern3End')} hours={p3.workHours} breakH={entry.pattern3BreakH} onBreakHChange={update('pattern3BreakH')} breakM={entry.pattern3BreakM} onBreakMChange={update('pattern3BreakM')} breakMinutes={p3BreakMinutes} nightOverlapRaw={p3.nightOverlapRaw} nightHours={p3.nightHours} nightBreakH={entry.pattern3NightBreakH} onNightBreakHChange={update('pattern3NightBreakH')} nightBreakM={entry.pattern3NightBreakM} onNightBreakMChange={update('pattern3NightBreakM')} />
            </div>
            
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>주당 추가근무시간 (선택, 시간)</span>
              <input type="number" className="text-input" placeholder="예: 5 (기본 패턴 외 매주 정기적인 추가 연장근로)" value={entry.extraWeeklyOvertime === '0' || !entry.extraWeeklyOvertime ? '' : entry.extraWeeklyOvertime} onChange={(e) => update('extraWeeklyOvertime')(e.target.value || '0')} min="0" />
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>매주 고정적으로 발생하는 추가 연장근로시간이 있다면 입력하세요.</p>
            </div>

            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.75rem', marginBottom: 0 }}>주간 총 휴게시간 합계: {formatMinutesAsHM(totalBreakMinutesWeekly)}</p>
            {totalWeeklyDays > 6 && (
              <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                패턴 1~3의 근무일수 합계가 {totalWeeklyDays}일입니다. 주휴일(1일 이상)을 확보하려면 전체 근무일수는 주 6일을 넘지 않아야 합니다.
              </div>
            )}
          </div>

          <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
            <label className="form-label" style={{ color: '#a5b4fc' }}>연간 연차휴가 일수 (선택, 일/년)</label>
            <input type="number" className="text-input" placeholder="예: 15 (미사용 시 수당 분할 지급액 계산에 반영)" value={entry.annualLeaveDays === '0' || !entry.annualLeaveDays ? '' : entry.annualLeaveDays} onChange={(e) => update('annualLeaveDays')(e.target.value || '0')} min="0" />
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>연간 연차 휴가 일수를 입력하시면 하루 8시간 시급을 기준하여 12개월 분할(1/12) 지급액을 매월 급여에 선반영합니다.</p>
          </div>


          <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
            <label className="form-label" style={{ color: '#fbbf24' }}><Sun size={16} /> 연간 휴일근로 일수 (선택, 일/년)</label>
            <input type="number" className="text-input" placeholder="예: 12 (공휴일, 대체공휴일 등 연간 예상 근무일수)" value={entry.holidayWorkDays === '0' || !entry.holidayWorkDays ? '' : entry.holidayWorkDays} onChange={(e) => update('holidayWorkDays')(e.target.value || '0')} min="0" />
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              공휴일이나 대체공휴일에 일하는 일수를 연간 단위로 입력하시면 하루 8시간 근로 및 가산율을 기준하여 12개월 분할(1/12) 지급액이 매월 자동 산정됩니다.
            </p>
          </div>
        </div>

        <div>
          <div className="result-highlight">
            <div className="result-highlight-label">{entry.year}년 월 실수령액</div>
            <div className="result-highlight-value">{result.netPay.toLocaleString()}원</div>
            <div className="result-highlight-sub">연 환산 실수령액 약 {result.netAnnual.toLocaleString()}원 (주 {weeklyHours}시간 근무 기준)</div>
          </div>

          <div className="result-row">
            <span className="result-row-label">기본급 {result.regularWorkHoursMonthly > 0 && `(월 소정근로 ${result.regularWorkHoursMonthly}시간)`}</span>
            <span className="result-row-value">{result.basePay.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">주휴수당 {result.weeklyHolidayHoursMonthly > 0 && `(월 주휴 ${result.weeklyHolidayHoursMonthly}시간)`}</span>
            <span className="result-row-value">{result.weeklyHolidayPay.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">연장수당 {result.overtimeHoursMonthly > 0 && `(월 연장 ${result.overtimeHoursMonthly}시간 · ${entry.companySize === '5인 이상' ? '1.5배' : '1.0배'} 가산)`}</span>
            <span className="result-row-value">{result.overtimePay.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">야간수당 {result.nightHoursMonthly > 0 && `(월 야간 ${result.nightHoursMonthly}시간 · ${entry.companySize === '5인 이상' ? '0.5배' : '0.0배'} 가산)`}</span>
            <span className="result-row-value">{result.nightPay.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">연차수당 (선지급 월분할)</span>
            <span className="result-row-value">{result.leavePayMonthly.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">휴일근로수당</span>
            <span className="result-row-value">{result.holidayWorkPay.toLocaleString()}원</span>
          </div>
          <div className="result-row" style={{ color: '#ef4444' }}>
            <span className="result-row-label">공제총액</span>
            <span className="result-row-value">-{result.totalDeductions.toLocaleString()}원</span>
          </div>

          <div style={{ paddingLeft: '1rem', borderLeft: '2px solid rgba(239, 68, 68, 0.2)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85, alignItems: 'center' }}>
              <span className="result-row-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                └ 국민연금 ({(rates.pension * 100).toFixed(2)}%)
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="기준소득월액 입력"
                  style={{ width: '120px', padding: '0.15rem 0.35rem', fontSize: '0.7rem', height: '22px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', marginLeft: '0.25rem', display: 'inline-block' }} 
                  value={entry.pensionBasis === '0' || !entry.pensionBasis ? '' : Number(entry.pensionBasis).toLocaleString()} 
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(raw)) {
                      update('pensionBasis')(raw || '0');
                    }
                  }} 
                />
              </span>
              <span className="result-row-value">-{result.nationalPension.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              <span className="result-row-label">└ 건강보험 ({(rates.health * 100).toFixed(3)}%)</span>
              <span className="result-row-value">-{result.healthInsurance.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              <span className="result-row-label">└ 장기요양보험 ({(rates.care * 100).toFixed(2)}%)</span>
              <span className="result-row-value">-{result.longTermCare.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              <span className="result-row-label">└ 고용보험 ({(rates.employment * 100).toFixed(1)}%)</span>
              <span className="result-row-value">-{result.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              <span className="result-row-label">└ 근로소득세</span>
              <span className="result-row-value">-{result.incomeTax.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              <span className="result-row-label">└ 지방소득세</span>
              <span className="result-row-value">-{result.localIncomeTax.toLocaleString()}원</span>
            </div>
          </div>
          <div className="result-row">
            <span className="result-row-label" style={{ color: '#38bdf8', fontWeight: 800 }}>월 총 지급액 (세전)</span>
            <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 800 }}>{result.grossTotal.toLocaleString()}원</span>
          </div>

          {!result.isMinWageCompliant && (
            <div className="info-callout warning" style={{ marginTop: '1rem' }}>
              입력하신 기초시급({result.baseHourlyWage.toLocaleString()}원)이 {result.year}년 법정 최저시급({result.minWage.toLocaleString()}원)에 미달합니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SalaryCalculator() {
  const [entries, setEntries] = useState([makeDefaultEntry(currentYear)]);

  const updateEntry = (id, updated) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const addEntry = () => {
    const lastYear = entries.length > 0 ? parseInt(entries[entries.length - 1].year, 10) || currentYear : currentYear;
    setEntries((prev) => [...prev, makeDefaultEntry(lastYear + 1)]);
  };

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const allResults = entries.map((entry) => ({ entry, ...computeDerived(entry) }));
  const totalNetAnnual = allResults.reduce((sum, r) => sum + r.result.netAnnual, 0);

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Coins size={26} color="#f59e0b" /> 월급 계산기 (연도별 이력)</h1>
        <p className="tool-page-desc">
          입사 이후 여러 해에 걸쳐 달라진 기초시급과 근무조건을 연도별로 각각 입력해 계산합니다. 각 연도는 그 해의 법정 최저임금과 자동 비교되며,
          연차수당을 급여에 매월 분할해 선지급하는 방식이나 임의의 휴일근로시간도 직접 입력해 반영할 수 있습니다.
        </p>
      </div>

      {entries.map((entry) => (
        <YearEntryCard
          key={entry.id}
          entry={entry}
          onChange={(updated) => updateEntry(entry.id, updated)}
          onRemove={() => removeEntry(entry.id)}
          removable={entries.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addEntry}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.35)', borderRadius: '12px', color: '#a5b4fc', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1.5rem' }}
      >
        <Plus size={16} /> 다음 연도 추가
      </button>

      {entries.length > 1 && (
        <section className="glass-panel">
          <h3 className="dashboard-title">연도별 요약</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allResults.map(({ entry, result }) => (
              <div key={entry.id} className="result-row">
                <span className="result-row-label">
                  {result.year}년 ({entry.companySize})
                  <span className={`compliance-badge ${result.isMinWageCompliant ? 'pass' : 'danger'}`} style={{ marginLeft: '0.5rem' }}>
                    {result.isMinWageCompliant ? '최저임금 준수' : '최저임금 미달'}
                  </span>
                </span>
                <span className="result-row-value">월 실수령 {result.netPay.toLocaleString()}원</span>
              </div>
            ))}
            <div className="result-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.9rem', marginTop: '0.4rem' }}>
              <span className="result-row-label" style={{ color: '#38bdf8', fontWeight: 800 }}>전체 연도 합산 연 실수령액 추정</span>
              <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 800 }}>{totalNetAnnual.toLocaleString()}원</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default SalaryCalculator;
