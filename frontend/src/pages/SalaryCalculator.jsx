import React, { useState } from 'react';
import { Coins, Building2, Clock, Plus, Trash2, Sun, CalendarClock, Utensils } from 'lucide-react';
import { calculateHoursAndNightHours, calculateYearlyEntryPay, getDeductionRatesForYear, getMinWageForYear, NON_TAXABLE_MONTHLY_CAP, calculateElapsedHours, getStatutoryBreakMinutes } from '../utils/laborCalc.js';

const currentYear = new Date().getFullYear();

let idCounter = 0;
const nextId = () => `entry-${Date.now()}-${idCounter++}`;

const SALARY_TYPE_LABELS = {
  '시급': '기초시급',
  '일급': '일급',
  '주급': '주급',
  '월급': '월급'
};

const makeDefaultEntry = (year) => ({
  id: nextId(),
  year: String(year),
  companySize: '5인 이상',
  salaryType: '시급',
  salaryAmount: String(getMinWageForYear(year)),
  allowanceIncluded: '확인불가',
  pattern1Days: '5', pattern1Start: '09:00', pattern1End: '18:00', pattern1BreakH: '1', pattern1BreakM: '0', pattern1BreakAuto: true, pattern1NightBreakH: '0', pattern1NightBreakM: '0',
  pattern2Days: '0', pattern2Start: '09:00', pattern2End: '18:00', pattern2BreakH: '1', pattern2BreakM: '0', pattern2BreakAuto: true, pattern2NightBreakH: '0', pattern2NightBreakM: '0',
  pattern3Days: '0', pattern3Start: '09:00', pattern3End: '18:00', pattern3BreakH: '1', pattern3BreakM: '0', pattern3BreakAuto: true, pattern3NightBreakH: '0', pattern3NightBreakM: '0',

  // 요일별 설정 기본값 (월~금 활성화, 09:00~18:00, 휴게시간은 근로시간에 따라 자동 계산)
  monActive: true, monStart: '09:00', monEnd: '18:00', monBreakH: '1', monBreakM: '0', monBreakAuto: true, monNightBreakH: '0', monNightBreakM: '0',
  tueActive: true, tueStart: '09:00', tueEnd: '18:00', tueBreakH: '1', tueBreakM: '0', tueBreakAuto: true, tueNightBreakH: '0', tueNightBreakM: '0',
  wedActive: true, wedStart: '09:00', wedEnd: '18:00', wedBreakH: '1', wedBreakM: '0', wedBreakAuto: true, wedNightBreakH: '0', wedNightBreakM: '0',
  thuActive: true, thuStart: '09:00', thuEnd: '18:00', thuBreakH: '1', thuBreakM: '0', thuBreakAuto: true, thuNightBreakH: '0', thuNightBreakM: '0',
  friActive: true, friStart: '09:00', friEnd: '18:00', friBreakH: '1', friBreakM: '0', friBreakAuto: true, friNightBreakH: '0', friNightBreakM: '0',
  satActive: false, satStart: '09:00', satEnd: '18:00', satBreakH: '1', satBreakM: '0', satBreakAuto: true, satNightBreakH: '0', satNightBreakM: '0',
  sunActive: false, sunStart: '09:00', sunEnd: '18:00', sunBreakH: '1', sunBreakM: '0', sunBreakAuto: true, sunNightBreakH: '0', sunNightBreakM: '0',
  
  scheduleType: '패턴별', // 기본값
  directWeeklyWorkDays: '5',
  directWeeklyRegularHours: '40',
  directWeeklyOvertimeHours: '0',
  directWeeklyNightHours: '0',
  directAvgDailyHours: '8',

  annualLeaveDays: '0',
  holidayWorkDays: '0',
  pensionBasis: '0',
  extraWeeklyOvertime: '0',
  mealAllowance: '0',
  carAllowance: '0',
  childcareAllowance: '0',
  otherNonTaxable: '0',
  taxableAllowance: '0',
  allowancesIncludedInTotal: false
});

// 비과세 항목(식대/자가운전보조금/육아수당) 공용 입력 필드. 한도(월 20만원) 초과 시 초과분은 과세로 안내
function NonTaxableAmountInput({ label, value, onChange, cap = NON_TAXABLE_MONTHLY_CAP }) {
  const amt = parseFloat(value) || 0;
  const isOverCap = amt > cap;
  return (
    <div>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>{label}</span>
      <input
        type="text"
        className="text-input"
        value={value === '0' || !value ? '' : Number(value).toLocaleString()}
        onChange={(e) => {
          const raw = e.target.value.replace(/,/g, '');
          if (/^\d*$/.test(raw)) onChange(raw || '0');
        }}
        placeholder="0"
      />
      {isOverCap && (
        <p style={{ fontSize: '0.65rem', color: '#fbbf24', margin: '0.25rem 0 0 0' }}>
          비과세 한도(월 {cap.toLocaleString()}원) 초과분 {(amt - cap).toLocaleString()}원은 과세로 처리됩니다.
        </p>
      )}
    </div>
  );
}

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

// 출퇴근 시간이 바뀔 때, 사용자가 휴게시간을 직접 수정한 적이 없다면(Auto 플래그) 근로기준법 제54조 기준으로 휴게시간을 자동 재계산
const applyAutoBreak = (entry, prefix) => {
  if (entry[`${prefix}BreakAuto`] === false) return entry;
  const elapsed = calculateElapsedHours(entry[`${prefix}Start`], entry[`${prefix}End`]);
  const minutes = getStatutoryBreakMinutes(elapsed);
  return { ...entry, [`${prefix}BreakH`]: String(Math.floor(minutes / 60)), [`${prefix}BreakM`]: String(minutes % 60) };
};

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
  
  let weeklyHours = 0;
  let totalWeeklyDays = 0;
  let totalBreakMinutesWeekly = 0;
  let weeklyNightHours = 0;
  let directWeeklyWorkDays = 5;
  let directWeeklyRegularHours = 40;
  let directWeeklyOvertimeHours = 0;
  let directWeeklyNightHours = 0;
  let directAvgDailyHours = 8;

  if (entry.scheduleType === '요일별') {
    const daysKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let weeklyRegularHours = 0;
    let dailyOvertime = 0;

    daysKey.forEach(day => {
      const active = entry[`${day}Active`] === true || entry[`${day}Active`] === 'true';
      if (active) {
        const bMinutes = (parseFloat(entry[`${day}BreakH`]) || 0) * 60 + (parseFloat(entry[`${day}BreakM`]) || 0);
        const nbMinutes = (parseFloat(entry[`${day}NightBreakH`]) || 0) * 60 + (parseFloat(entry[`${day}NightBreakM`]) || 0);
        const calc = calculateHoursAndNightHours(entry[`${day}Start`], entry[`${day}End`], bMinutes, nbMinutes);
        
        weeklyHours += calc.workHours;
        weeklyNightHours += calc.nightHours;
        totalWeeklyDays += 1;
        totalBreakMinutesWeekly += bMinutes;

        const regularDaily = Math.min(calc.workHours, 8);
        weeklyRegularHours += regularDaily;
        dailyOvertime += Math.max(calc.workHours - 8, 0);
      }
    });

    const regularWorkHoursForBasePay = Math.min(weeklyRegularHours, 40);
    const avgDailyHoursVal = totalWeeklyDays > 0 ? regularWorkHoursForBasePay / totalWeeklyDays : 8;
    const weeklyOvertimeLimit = Math.max(weeklyRegularHours - 40, 0);
    const extraWeeklyOvertimeVal = parseFloat(entry.extraWeeklyOvertime) || 0;
    const weeklyOvertimeHours = dailyOvertime + weeklyOvertimeLimit + extraWeeklyOvertimeVal;

    directWeeklyWorkDays = totalWeeklyDays;
    directWeeklyRegularHours = regularWorkHoursForBasePay;
    directWeeklyOvertimeHours = weeklyOvertimeHours;
    directWeeklyNightHours = weeklyNightHours;
    directAvgDailyHours = avgDailyHoursVal;
  } else if (entry.scheduleType === '직접입력') {
    totalWeeklyDays = parseFloat(entry.directWeeklyWorkDays) || 5;
    weeklyHours = parseFloat(entry.directWeeklyRegularHours) || 0;
    weeklyNightHours = parseFloat(entry.directWeeklyNightHours) || 0;
  } else {
    weeklyHours = (p1.workHours * p1Days) + (p2.workHours * p2Days) + (p3.workHours * p3Days);
    totalWeeklyDays = p1Days + p2Days + p3Days;
    totalBreakMinutesWeekly = (p1BreakMinutes * p1Days) + (p2BreakMinutes * p2Days) + (p3BreakMinutes * p3Days);
    weeklyNightHours = (p1.nightHours * p1Days) + (p2.nightHours * p2Days) + (p3.nightHours * p3Days);
  }
 
  const result = calculateYearlyEntryPay({
    year: entry.year,
    companySize: entry.companySize,
    salaryType: entry.salaryType,
    salaryAmount: entry.salaryAmount,
    allowanceIncluded: entry.allowanceIncluded,
    pattern1Days: entry.pattern1Days, pattern1Hours: p1.workHours,
    pattern2Days: entry.pattern2Days, pattern2Hours: p2.workHours,
    pattern3Days: entry.pattern3Days, pattern3Hours: p3.workHours,
    weeklyNightHours,
    annualLeaveDays: parseFloat(entry.annualLeaveDays) || 0,
    holidayWorkDays: parseFloat(entry.holidayWorkDays) || 0,
    pensionBasis: parseFloat(entry.pensionBasis) || 0,
    extraWeeklyOvertime: parseFloat(entry.extraWeeklyOvertime) || 0,
    mealAllowance: parseFloat(entry.mealAllowance) || 0,
    carAllowance: parseFloat(entry.carAllowance) || 0,
    childcareAllowance: parseFloat(entry.childcareAllowance) || 0,
    otherNonTaxable: parseFloat(entry.otherNonTaxable) || 0,
    taxableAllowance: parseFloat(entry.taxableAllowance) || 0,
    allowancesIncludedInTotal: entry.allowancesIncludedInTotal,
    scheduleType: entry.scheduleType,
    directWeeklyWorkDays: entry.scheduleType === '요일별' ? directWeeklyWorkDays : (entry.scheduleType === '직접입력' ? parseFloat(entry.directWeeklyWorkDays) : 5),
    directWeeklyRegularHours: entry.scheduleType === '요일별' ? directWeeklyRegularHours : (entry.scheduleType === '직접입력' ? parseFloat(entry.directWeeklyRegularHours) : 40),
    directWeeklyOvertimeHours: entry.scheduleType === '요일별' ? directWeeklyOvertimeHours : (entry.scheduleType === '직접입력' ? parseFloat(entry.directWeeklyOvertimeHours) : 0),
    directWeeklyNightHours: entry.scheduleType === '요일별' ? directWeeklyNightHours : (entry.scheduleType === '직접입력' ? parseFloat(entry.directWeeklyNightHours) : 0),
    directAvgDailyHours: entry.scheduleType === '요일별' ? directAvgDailyHours : (entry.scheduleType === '직접입력' ? parseFloat(entry.directAvgDailyHours) : 8),
    deductionType: entry.deductionType || '4대보험'
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

const DAY_LABELS = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일'
};

function DayOfWeekEditor({ entry, update, updateTime, updateBreak, activeDay, setActiveDay }) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>요일별 상세 근무 설정</span>
      
      {/* 7요일 활성화 선택 칩 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '8px' }}>
        {days.map(d => {
          const active = entry[`${d}Active`] === true || entry[`${d}Active`] === 'true';
          const isSelected = activeDay === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              style={{
                flex: 1,
                padding: '0.5rem 0',
                borderRadius: '6px',
                border: 'none',
                background: isSelected ? '#38bdf8' : active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: isSelected ? '#0f172a' : active ? '#38bdf8' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              {DAY_LABELS[d]}
              {active && !isSelected && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '4px', height: '4px', borderRadius: '50%', background: '#38bdf8' }}></span>
              )}
            </button>
          );
        })}
      </div>

      {/* 현재 선택된 요일의 세부 설정 */}
      <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 'bold' }}>{DAY_LABELS[activeDay]}요일 근무 세부설정</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#38bdf8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={entry[`${activeDay}Active`] === true || entry[`${activeDay}Active`] === 'true'}
              onChange={(e) => update(`${activeDay}Active`)(e.target.checked)}
              style={{ accentColor: '#38bdf8' }}
            />
            {DAY_LABELS[activeDay]}요일 근무함
          </label>
        </div>

        {(entry[`${activeDay}Active`] === true || entry[`${activeDay}Active`] === 'true') ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
                <TimeSelectInput value={entry[`${activeDay}Start`]} onChange={updateTime(activeDay, 'Start')} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
                <TimeSelectInput value={entry[`${activeDay}End`]} onChange={updateTime(activeDay, 'End')} />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>이 요일의 총 휴게시간</span>
              <HourMinuteInput
                hourValue={entry[`${activeDay}BreakH`]}
                onHourChange={updateBreak(activeDay, 'BreakH')}
                minuteValue={entry[`${activeDay}BreakM`]}
                onMinuteChange={updateBreak(activeDay, 'BreakM')}
              />
            </div>

            {/* 야간 연장 휴게시간 */}
            <div style={{ background: 'rgba(165, 180, 252, 0.04)', padding: '0.6rem', borderRadius: '6px', border: '1px dashed rgba(165, 180, 252, 0.15)' }}>
              <span style={{ fontSize: '0.7rem', color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>
                야간시간대(22:00~06:00) 중 사용한 휴게시간
              </span>
              <HourMinuteInput
                hourValue={entry[`${activeDay}NightBreakH`]}
                onHourChange={update(`${activeDay}NightBreakH`)}
                minuteValue={entry[`${activeDay}NightBreakM`]}
                onMinuteChange={update(`${activeDay}NightBreakM`)}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b', fontSize: '0.75rem' }}>
            {DAY_LABELS[activeDay]}요일은 근무를 하지 않는 날(휴일)입니다.
          </div>
        )}
      </div>
    </div>
  );
}

function YearEntryCard({ entry, onChange, onRemove, removable }) {
  const update = (key) => (value) => onChange({ ...entry, [key]: value });
  // 출퇴근 시간 변경 시 휴게시간 자동 재계산(사용자가 직접 수정하지 않은 경우에 한함)
  const updateTime = (prefix, field) => (value) => onChange(applyAutoBreak({ ...entry, [`${prefix}${field}`]: value }, prefix));
  // 휴게시간 직접 수정 시 해당 패턴/요일의 자동계산을 비활성화
  const updateBreak = (prefix, field) => (value) => onChange({ ...entry, [`${prefix}${field}`]: value, [`${prefix}BreakAuto`]: false });
  const [activeDay, setActiveDay] = useState('mon');
  const { p1, p2, p3, weeklyHours, totalWeeklyDays, p1BreakMinutes, p2BreakMinutes, p3BreakMinutes, totalBreakMinutesWeekly, result } = computeDerived(entry);
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
              if (entry.salaryType === '시급' && parseInt(entry.salaryAmount, 10) === oldMinWage) {
                updated.salaryAmount = String(newMinWage);
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
            <label className="form-label"><Coins size={16} color="#f59e0b" /> 급여 구분</label>
            <select
              className="text-input"
              value={entry.salaryType}
              onChange={(e) => update('salaryType')(e.target.value)}
              style={{ padding: '0.85rem 0.5rem' }}
            >
              <option value="시급">시급</option>
              <option value="일급">일급</option>
              <option value="주급">주급</option>
              <option value="월급">월급</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label"><Coins size={16} color="#34d399" /> 공제 구분 (사회보험/세금)</label>
            <div className="radio-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <div className={`radio-card ${entry.deductionType === '4대보험' || !entry.deductionType ? 'active' : ''}`} onClick={() => update('deductionType')('4대보험')} style={{ padding: '0.5rem 0.2rem', textAlign: 'center' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>4대보험</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>일반 근로자</span>
              </div>
              <div className={`radio-card ${entry.deductionType === '3.3%' ? 'active' : ''}`} onClick={() => update('deductionType')('3.3%')} style={{ padding: '0.5rem 0.2rem', textAlign: 'center' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>3.3%</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>프리랜서</span>
              </div>
              <div className={`radio-card ${entry.deductionType === '일용직' ? 'active' : ''}`} onClick={() => update('deductionType')('일용직')} style={{ padding: '0.5rem 0.2rem', textAlign: 'center' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>일용직</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>고용 0.9%+일용세</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><Coins size={16} color="#f59e0b" /> 이 연도 {SALARY_TYPE_LABELS[entry.salaryType] || '급여'} (원)</label>
            <input
              type="text"
              className="text-input"
              value={entry.salaryAmount === '0' || !entry.salaryAmount ? '' : Number(entry.salaryAmount).toLocaleString()}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) {
                  update('salaryAmount')(raw || '0');
                }
              }}
            />
          </div>

          {entry.salaryType === '월급' && entry.companySize === '5인 이상' && (
            <div className="form-group">
              <label className="form-label" style={{ color: '#a5b4fc' }}>근로계약서 수당 포함 여부</label>
              <select
                className="text-input"
                value={entry.allowanceIncluded}
                onChange={(e) => update('allowanceIncluded')(e.target.value)}
              >
                <option value="확인불가">계약서 조항 확인 불가 / 모름</option>
                <option value="기본급 외 수당 모두 포함 (포괄임금)">수당 모두 포함 (포괄임금제 형태)</option>
                <option value="기본급 외 일부 수당만 포함">일부 수당만 급여에 포함</option>
                <option value="포함되지 않음 (기본급 기준 연장수당 별도 계산)">포함 안 됨 (연장 등 수당 매월 별도 계산)</option>
              </select>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                "수당 모두 포함"을 선택하면 입력한 월급액을 총 지급액으로 보고 그 안에서 실제 기초시급을 역산합니다.
              </p>
            </div>
          )}

          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <label className="form-label"><Clock size={16} color="#38bdf8" /> 근무 형태 선택</label>
            <div className="radio-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '1rem' }}>
              <div className={`radio-card ${entry.scheduleType === '요일별' ? 'active' : ''}`} onClick={() => update('scheduleType')('요일별')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>요일별 상세 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>매일 다른 알바생 등</span>
              </div>
              <div className={`radio-card ${entry.scheduleType === '패턴별' || !entry.scheduleType ? 'active' : ''}`} onClick={() => update('scheduleType')('패턴별')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>고정 패턴별 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>주 5일 고정 직장인</span>
              </div>
              <div className={`radio-card ${entry.scheduleType === '직접입력' ? 'active' : ''}`} onClick={() => update('scheduleType')('직접입력')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>교대제/스케줄 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>간호사, 유동 근무 등</span>
              </div>
            </div>

            {entry.scheduleType === '요일별' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <DayOfWeekEditor entry={entry} update={update} updateTime={updateTime} updateBreak={updateBreak} activeDay={activeDay} setActiveDay={setActiveDay} />
                </div>
                
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>주당 추가근무시간 (선택, 시간)</span>
                  <input type="number" className="text-input" placeholder="예: 5 (요일별 근무 외 매주 정기적인 추가 연장근로)" value={entry.extraWeeklyOvertime === '0' || !entry.extraWeeklyOvertime ? '' : entry.extraWeeklyOvertime} onChange={(e) => update('extraWeeklyOvertime')(e.target.value || '0')} min="0" />
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>매주 고정적으로 발생하는 추가 연장근로시간이 있다면 입력하세요.</p>
                </div>

                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.75rem', marginBottom: 0 }}>주간 총 휴게시간 합계: {formatMinutesAsHM(totalBreakMinutesWeekly)}</p>
                {totalWeeklyDays > 6 && (
                  <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                    요일별 근무일수 합계가 {totalWeeklyDays}일입니다. 주휴일(1일 이상)을 확보하려면 전체 근무일수는 주 6일을 넘지 않아야 합니다.
                  </div>
                )}
              </>
            ) : entry.scheduleType === '직접입력' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="info-callout" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  <strong>💡 3교대 간호사, 격일제 경비원 등 유동 근무자 팁</strong><br/>
                  매주/매월 스케줄이 바뀌는 경우, 최근 1~3개월간의 실제 근무 대장을 합산한 뒤 <strong>총 근무시간 ÷ 4.345(한 달 평균 주 수)</strong> 하시면 주당 평균 근로시간을 손쉽게 도출하여 가장 정확한 진단을 받으실 수 있습니다.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 소정근로일수 (일/주)</span>
                    <input type="number" className="text-input" placeholder="예: 5" value={entry.directWeeklyWorkDays} onChange={(e) => update('directWeeklyWorkDays')(e.target.value)} min="1" max="7" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>하루 평균 근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 8 (수당 지급의 하루 기준시간)" value={entry.directAvgDailyHours} onChange={(e) => update('directAvgDailyHours')(e.target.value)} min="1" max="24" />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 총 소정근로시간 (시간)</span>
                  <input type="number" className="text-input" placeholder="예: 40" value={entry.directWeeklyRegularHours} onChange={(e) => update('directWeeklyRegularHours')(e.target.value)} min="0" />
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>* 주 최대 40시간까지만 기본급(주휴수당 포함) 산정에 반영됩니다. 초과분은 연장에 입력하세요.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 연장근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 5 (1일 8시간 또는 주 40시간 초과분)" value={entry.directWeeklyOvertimeHours} onChange={(e) => update('directWeeklyOvertimeHours')(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 야간근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 4 (22:00 ~ 익일 06:00 사이 실제 근무)" value={entry.directWeeklyNightHours} onChange={(e) => update('directWeeklyNightHours')(e.target.value)} min="0" />
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0 0' }}>
                  * 스케줄 근무표나 월 근무대장을 토대로 월 총 근무시간을 계산한 뒤, **월 근무시간 ÷ 4.345** 하여 구한 주 평균 근로시간을 입력하시면 보다 정확합니다.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <PatternInput label="근무 패턴 1" days={entry.pattern1Days} onDaysChange={update('pattern1Days')} start={entry.pattern1Start} onStartChange={updateTime('pattern1', 'Start')} end={entry.pattern1End} onEndChange={updateTime('pattern1', 'End')} hours={p1.workHours} breakH={entry.pattern1BreakH} onBreakHChange={updateBreak('pattern1', 'BreakH')} breakM={entry.pattern1BreakM} onBreakMChange={updateBreak('pattern1', 'BreakM')} breakMinutes={p1BreakMinutes} nightOverlapRaw={p1.nightOverlapRaw} nightHours={p1.nightHours} nightBreakH={entry.pattern1NightBreakH} onNightBreakHChange={update('pattern1NightBreakH')} nightBreakM={entry.pattern1NightBreakM} onNightBreakMChange={update('pattern1NightBreakM')} />
                  <PatternInput label="근무 패턴 2 (선택)" days={entry.pattern2Days} onDaysChange={update('pattern2Days')} start={entry.pattern2Start} onStartChange={updateTime('pattern2', 'Start')} end={entry.pattern2End} onEndChange={updateTime('pattern2', 'End')} hours={p2.workHours} breakH={entry.pattern2BreakH} onBreakHChange={updateBreak('pattern2', 'BreakH')} breakM={entry.pattern2BreakM} onBreakMChange={updateBreak('pattern2', 'BreakM')} breakMinutes={p2BreakMinutes} nightOverlapRaw={p2.nightOverlapRaw} nightHours={p2.nightHours} nightBreakH={entry.pattern2NightBreakH} onNightBreakHChange={update('pattern2NightBreakH')} nightBreakM={entry.pattern2NightBreakM} onNightBreakMChange={update('pattern2NightBreakM')} />
                  <PatternInput label="근무 패턴 3 (선택)" days={entry.pattern3Days} onDaysChange={update('pattern3Days')} start={entry.pattern3Start} onStartChange={updateTime('pattern3', 'Start')} end={entry.pattern3End} onEndChange={updateTime('pattern3', 'End')} hours={p3.workHours} breakH={entry.pattern3BreakH} onBreakHChange={updateBreak('pattern3', 'BreakH')} breakM={entry.pattern3BreakM} onBreakMChange={updateBreak('pattern3', 'BreakM')} breakMinutes={p3BreakMinutes} nightOverlapRaw={p3.nightOverlapRaw} nightHours={p3.nightHours} nightBreakH={entry.pattern3NightBreakH} onNightBreakHChange={update('pattern3NightBreakH')} nightBreakM={entry.pattern3NightBreakM} onNightBreakMChange={update('pattern3NightBreakM')} />
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
              </>
            )}
          </div>

          <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
            <label className="form-label" style={{ color: '#a5b4fc' }}>연간 연차휴가 일수 (선택, 일/년)</label>
            <input type="number" className="text-input" placeholder="예: 15 (미사용 시 수당 분할 지급액 계산에 반영)" value={entry.annualLeaveDays === '0' || !entry.annualLeaveDays ? '' : entry.annualLeaveDays} onChange={(e) => update('annualLeaveDays')(e.target.value || '0')} min="0" />
            {result.isEligibleForWeeklyBenefits ? (
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>연간 연차 휴가 일수를 입력하시면 입력하신 근무 패턴 기준 평균 1일 소정근로시간(<strong style={{ color: '#a5b4fc' }}>{result.avgDailyHours}시간</strong>)에 시급을 곱해 12개월 분할(1/12) 지급액을 매월 급여에 선반영합니다.</p>
            ) : (
              <p style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.5rem', marginBottom: 0 }}>
                주 소정근로시간이 {result.weeklyHours}시간으로 15시간 미만이라 근로기준법 제18조 3항에 따라 연차유급휴가(제60조)가 적용되지 않아, 입력하셔도 연차수당은 0원으로 계산됩니다.
              </p>
            )}
          </div>


          <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
            <label className="form-label" style={{ color: '#fbbf24' }}><Sun size={16} /> 연간 휴일근로 일수 (선택, 일/년)</label>
            <input type="number" className="text-input" placeholder="예: 12 (공휴일, 대체공휴일 등 연간 예상 근무일수)" value={entry.holidayWorkDays === '0' || !entry.holidayWorkDays ? '' : entry.holidayWorkDays} onChange={(e) => update('holidayWorkDays')(e.target.value || '0')} min="0" />
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              공휴일이나 대체공휴일에 일하는 일수를 연간 단위로 입력하시면 근무 패턴 기준 평균 1일 소정근로시간(<strong style={{ color: '#fbbf24' }}>{result.avgDailyHours}시간</strong>) 및 가산율을 기준하여 12개월 분할(1/12) 지급액이 매월 자동 산정됩니다.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>비과세·과세 수당 처리 방식</label>
            <div className="radio-group">
              <div className={`radio-card ${!entry.allowancesIncludedInTotal ? 'active' : ''}`} onClick={() => update('allowancesIncludedInTotal')(false)}>
                <span className="radio-card-title">급여액과 별도 지급</span>
                <span className="radio-card-desc">위 급여 금액과 별개로 추가 지급</span>
              </div>
              <div className={`radio-card ${entry.allowancesIncludedInTotal ? 'active' : ''}`} onClick={() => update('allowancesIncludedInTotal')(true)}>
                <span className="radio-card-title">급여액에 이미 포함됨</span>
                <span className="radio-card-desc">총 지급액은 그대로, 기본급에서 분리 표시</span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(52, 211, 153, 0.3)' }}>
            <label className="form-label" style={{ color: '#34d399' }}><Utensils size={16} /> 비과세 수당 (선택, 월 지급액)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <NonTaxableAmountInput label="식대" value={entry.mealAllowance} onChange={update('mealAllowance')} />
              <NonTaxableAmountInput label="자가운전보조금" value={entry.carAllowance} onChange={update('carAllowance')} />
              <NonTaxableAmountInput label="육아수당 (6세 이하)" value={entry.childcareAllowance} onChange={update('childcareAllowance')} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>기타 비과세</span>
                <input
                  type="text"
                  className="text-input"
                  value={entry.otherNonTaxable === '0' || !entry.otherNonTaxable ? '' : Number(entry.otherNonTaxable).toLocaleString()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(raw)) update('otherNonTaxable')(raw || '0');
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              식대·자가운전보조금·육아수당은 각각 월 20만원까지 비과세이며, 세금·4대보험 산정에서는 제외됩니다. {entry.allowancesIncludedInTotal ? '위에서 "급여액에 이미 포함됨"을 선택해 총 지급액은 그대로 유지되고 기본급에서 분리되어 표시됩니다.' : '위에서 "급여액과 별도 지급"을 선택해 급여 총액에 추가로 더해집니다.'} 기타 비과세는 한도 없이 입력한 금액 그대로 반영됩니다.
            </p>
          </div>

          <div className="form-group" style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(248, 113, 113, 0.3)' }}>
            <label className="form-label" style={{ color: '#f87171' }}><Coins size={16} /> 과세 수당 (선택, 직책수당·상여금 등)</label>
            <input
              type="text"
              className="text-input"
              placeholder="0"
              value={entry.taxableAllowance === '0' || !entry.taxableAllowance ? '' : Number(entry.taxableAllowance).toLocaleString()}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) update('taxableAllowance')(raw || '0');
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              직책수당·상여금 등 세금이 붙는 수당은 비과세와 달리 세금·4대보험 산정 기준액에도 그대로 포함됩니다. {entry.allowancesIncludedInTotal ? '위에서 "급여액에 이미 포함됨"을 선택해 총 지급액은 그대로 유지됩니다.' : '위에서 "급여액과 별도 지급"을 선택해 급여 총액에 추가로 더해집니다.'}
            </p>
          </div>
        </div>

        <div>
          <div className="result-highlight" style={{ padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="result-highlight-label" style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '500' }}>
              {entry.year}년 {entry.salaryType} 실수령액 ({entry.deductionType || '4대보험'})
            </div>
            <div className="result-highlight-value" style={{ fontSize: '2rem', margin: '0.25rem 0', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {entry.salaryType === '시급' && `${result.baseHourlyWage.toLocaleString()}원`}
              {entry.salaryType === '일급' && `${result.dailyNetPay.toLocaleString()}원`}
              {entry.salaryType === '주급' && `${result.weeklyNetPay.toLocaleString()}원`}
              {entry.salaryType === '월급' && `${result.monthlyNetPay.toLocaleString()}원`}
            </div>
            <div className="result-highlight-sub" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              연 환산 실수령액 약 {result.netAnnual.toLocaleString()}원 (주 {weeklyHours}시간 근무 기준)
            </div>

            {/* 일급/주급/월급 환산 대조표 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginTop: '0.75rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>하루 실수령 (일당)</span>
                <strong style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{result.dailyNetPay.toLocaleString()}원</strong>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>한 주 실수령 (주급)</span>
                <strong style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{result.weeklyNetPay.toLocaleString()}원</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>한 달 실수령 (월급)</span>
                <strong style={{ fontSize: '0.78rem', color: '#818cf8' }}>{result.monthlyNetPay.toLocaleString()}원</strong>
              </div>
            </div>
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
            <span className="result-row-label">연차수당 {result.leavePayHoursMonthly > 0 && `(선지급 월분할, 월 ${result.leavePayHoursMonthly}시간)`}</span>
            <span className="result-row-value">{result.leavePayMonthly.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">휴일근로수당 {result.holidayWorkHoursMonthly > 0 && `(월 ${result.holidayWorkHoursMonthly}시간 · ${entry.companySize === '5인 이상' ? '1.5배' : '1.0배'} 가산)`}</span>
            <span className="result-row-value">{result.holidayWorkPay.toLocaleString()}원</span>
          </div>
          {result.totalNonTaxable + result.totalTaxableExcess > 0 && (
            <div className="result-row">
              <span className="result-row-label" style={{ color: '#34d399' }}>비과세 수당 (식대·차량·육아·기타)</span>
              <span className="result-row-value" style={{ color: '#34d399' }}>{(result.totalNonTaxable + result.totalTaxableExcess).toLocaleString()}원</span>
            </div>
          )}
          {result.taxableAllowance > 0 && (
            <div className="result-row">
              <span className="result-row-label" style={{ color: '#f87171' }}>과세 수당 (직책수당·상여금 등)</span>
              <span className="result-row-value" style={{ color: '#f87171' }}>{result.taxableAllowance.toLocaleString()}원</span>
            </div>
          )}
          <div className="result-row" style={{ color: '#ef4444' }}>
            <span className="result-row-label">공제총액</span>
            <span className="result-row-value">-{result.totalDeductions.toLocaleString()}원</span>
          </div>

          {result.totalNonTaxable > 0 && (
            <p style={{ fontSize: '0.7rem', color: '#34d399', margin: '0 0 0.5rem 0' }}>
              비과세 {result.totalNonTaxable.toLocaleString()}원은 아래 건강보험·고용보험·소득세 산정 기준액에서 제외되었습니다.
            </p>
          )}
          <div style={{ paddingLeft: '1rem', borderLeft: '2px solid rgba(239, 68, 68, 0.2)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {(entry.deductionType === '4대보험' || !entry.deductionType) ? (
              <>
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
              </>
            ) : entry.deductionType === '3.3%' ? (
              <>
                <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  <span className="result-row-label">└ 사업소득세 (3.0%)</span>
                  <span className="result-row-value">-{result.incomeTax.toLocaleString()}원</span>
                </div>
                <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  <span className="result-row-label">└ 지방소득세 (0.3%)</span>
                  <span className="result-row-value">-{result.localIncomeTax.toLocaleString()}원</span>
                </div>
              </>
            ) : (
              <>
                <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  <span className="result-row-label">└ 고용보험 ({(rates.employment * 100).toFixed(1)}%)</span>
                  <span className="result-row-value">-{result.employmentInsurance.toLocaleString()}원</span>
                </div>
                <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  <span className="result-row-label">└ 일용소득세 (비과세 15만원 공제 후 2.7%)</span>
                  <span className="result-row-value">-{result.incomeTax.toLocaleString()}원</span>
                </div>
                <div className="result-row" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  <span className="result-row-label">└ 지방소득세 (소득세의 10%)</span>
                  <span className="result-row-value">-{result.localIncomeTax.toLocaleString()}원</span>
                </div>
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: '0.2rem 0 0 0', lineHeight: '1.3' }}>
                  * 일 평균 소득이 150,000원 이하인 날은 과세되지 않으며, 하루 세액 1,000원 미만 시 소액부징수법에 의해 전액 면제됩니다.
                </p>
              </>
            )}
          </div>
          <div className="result-row">
            <span className="result-row-label" style={{ color: '#38bdf8', fontWeight: 800 }}>월 총 지급액 (세전)</span>
            <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 800 }}>{result.grossTotal.toLocaleString()}원</span>
          </div>

          {!result.isMinWageCompliant && (
            <div className="info-callout warning" style={{ marginTop: '1rem' }}>
              산출된 시급({result.baseHourlyWage.toLocaleString()}원)이 {result.year}년 법정 최저시급({result.minWage.toLocaleString()}원)에 미달합니다.
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
