import React, { useState } from 'react';
import { Coins, Building2, Clock, Plus, Trash2, Sun, CalendarClock, Utensils } from 'lucide-react';
import { calculateHoursAndNightHours, calculateYearlyEntryPay, getDeductionRatesForYear, getMinWageForYear, NON_TAXABLE_MONTHLY_CAP, calculateElapsedHours, getStatutoryBreakMinutes, applyDeductions, roundDownToTen, AVG_WEEKS_PER_MONTH } from '../utils/laborCalc.js';

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
  directDailyNightHours: '0',
  directDailyNightBreakHours: '0',

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
        totalBreakMinutesWeekly += bMinutes + nbMinutes;

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
    const avgDaily = parseFloat(entry.directAvgDailyHours) || 8;

    const regularDaily = Math.min(avgDaily, 8);
    const overtimeDaily = Math.max(avgDaily - 8, 0);
    const weeklyRegularBeforeCap = regularDaily * totalWeeklyDays;
    // 하루 8시간을 안 넘어도 근무일수가 많아(예: 주 6~7일) 주 40시간을 넘기면 그 초과분도 연장근로
    const weeklyOvertimeFromExtraDays = Math.max(weeklyRegularBeforeCap - 40, 0);

    directWeeklyRegularHours = weeklyRegularBeforeCap;
    directWeeklyOvertimeHours = (overtimeDaily * totalWeeklyDays) + weeklyOvertimeFromExtraDays;

    const dailyNight = parseFloat(entry.directDailyNightHours) || 0;
    const dailyNightBreak = parseFloat(entry.directDailyNightBreakHours) || 0;
    const netDailyNight = Math.max(dailyNight - dailyNightBreak, 0);

    directWeeklyNightHours = netDailyNight * totalWeeklyDays;

    weeklyHours = directWeeklyRegularHours;
    weeklyNightHours = directWeeklyNightHours;
    directAvgDailyHours = avgDaily;
  } else {
    weeklyHours = (p1.workHours * p1Days) + (p2.workHours * p2Days) + (p3.workHours * p3Days);
    totalWeeklyDays = p1Days + p2Days + p3Days;
    totalBreakMinutesWeekly = ((p1BreakMinutes + p1NightBreakMinutes) * p1Days) + ((p2BreakMinutes + p2NightBreakMinutes) * p2Days) + ((p3BreakMinutes + p3NightBreakMinutes) * p3Days);
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
    directWeeklyWorkDays,
    directWeeklyRegularHours,
    directWeeklyOvertimeHours,
    directWeeklyNightHours,
    directAvgDailyHours,
    deductionType: entry.deductionType || '4대보험'
  });
 
  return { p1, p2, p3, weeklyHours, totalWeeklyDays, p1BreakMinutes, p2BreakMinutes, p3BreakMinutes, p1NightBreakMinutes, p2NightBreakMinutes, p3NightBreakMinutes, totalBreakMinutesWeekly, holidayWorkDays: parseFloat(entry.holidayWorkDays) || 0, result };
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
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주간(일반) 휴게시간</span>
        <HourMinuteInput hourValue={breakH} onHourChange={onBreakHChange} minuteValue={breakM} onMinuteChange={onBreakMChange} />
      </div>

      {nightOverlapRaw > 0 && (
        <div style={{ marginTop: '0.5rem', background: 'rgba(165, 180, 252, 0.06)', padding: '0.6rem', borderRadius: '6px', border: '1px dashed rgba(165, 180, 252, 0.25)' }}>
          <span style={{ fontSize: '0.7rem', color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>
            야간시간대(22:00~06:00)에 사용한 휴게시간
          </span>
          <HourMinuteInput hourValue={nightBreakH} onHourChange={onNightBreakHChange} minuteValue={nightBreakM} onMinuteChange={onNightBreakMChange} />
          <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
            야간 근로시간대 총 {formatMinutesAsHM(nightOverlapRaw * 60)} 중, 실제 야간근로 인정시간은 <strong style={{ color: '#a5b4fc' }}>{formatMinutesAsHM(nightHours * 60)}</strong>
          </p>
        </div>
      )}

      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
        하루 근로시간: <strong>{formatMinutesAsHM(hours * 60)}</strong> (휴게 {formatMinutesAsHM(breakMinutes)} 제외)
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

function DayOfWeekEditor({ entry, update, updateTime, updateBreak }) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const isActive = (d) => entry[`${d}Active`] === true || entry[`${d}Active`] === 'true';
  const activeDays = days.filter(isActive);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>근무 요일 선택</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {days.map(d => {
            const active = isActive(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => update(`${d}Active`)(!active)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  borderRadius: '6px',
                  border: 'none',
                  background: active ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                  color: active ? '#0f172a' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {DAY_LABELS[d]}
              </button>
            );
          })}
        </div>
      </div>

      {activeDays.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b', fontSize: '0.75rem' }}>
          근무 요일을 1개 이상 선택해 주세요.
        </div>
      )}

      {activeDays.map((d) => {
        const isBreakMinutes = (parseFloat(entry[`${d}BreakH`]) || 0) * 60 + (parseFloat(entry[`${d}BreakM`]) || 0);
        const elapsed = calculateElapsedHours(entry[`${d}Start`], entry[`${d}End`]);
        const workHours = Math.max(0, elapsed - isBreakMinutes / 60);

        return (
          <div key={d} style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold' }}>{DAY_LABELS[d]}요일</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
                <TimeSelectInput value={entry[`${d}Start`]} onChange={updateTime(d, 'Start')} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
                <TimeSelectInput value={entry[`${d}End`]} onChange={updateTime(d, 'End')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주간(일반) 휴게시간</span>
                <HourMinuteInput
                  hourValue={entry[`${d}BreakH`]}
                  onHourChange={updateBreak(d, 'BreakH')}
                  minuteValue={entry[`${d}BreakM`]}
                  onMinuteChange={updateBreak(d, 'BreakM')}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>야간시간대(22~06) 휴게시간</span>
                <HourMinuteInput
                  hourValue={entry[`${d}NightBreakH`]}
                  onHourChange={update(`${d}NightBreakH`)}
                  minuteValue={entry[`${d}NightBreakM`]}
                  onMinuteChange={update(`${d}NightBreakM`)}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#38bdf8', textAlign: 'right', fontWeight: '500' }}>
              실근로시간: <strong>{formatMinutesAsHM(workHours * 60)}</strong> (휴게 {formatMinutesAsHM(isBreakMinutes)} 제외)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function YearEntryCard({ entry, onChange, onRemove, removable }) {
  const [payStubOpen, setPayStubOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('홍길동');
  const [employeeBirth, setEmployeeBirth] = useState('1990-01-01');
  const [paymentDate, setPaymentDate] = useState('매월 25일');
  const [paymentMonth, setPaymentMonth] = useState(`${entry.year}-07`);
  const [companyName, setCompanyName] = useState('대박 사업장');
  const [absenceDays, setAbsenceDays] = useState('0');
  const [weeklyHoliday, setWeeklyHoliday] = useState('0'); // 0: 일요일, 1: 월요일, ...

  const update = (key) => (value) => onChange({ ...entry, [key]: value });
  // 출퇴근 시간 변경 시 휴게시간 자동 재계산(사용자가 직접 수정하지 않은 경우에 한함)
  const updateTime = (prefix, field) => (value) => onChange(applyAutoBreak({ ...entry, [`${prefix}${field}`]: value }, prefix));
  // 휴게시간 직접 수정 시 해당 패턴/요일의 자동계산을 비활성화
  const updateBreak = (prefix, field) => (value) => onChange({ ...entry, [`${prefix}${field}`]: value, [`${prefix}BreakAuto`]: false });
  const { p1, p2, p3, weeklyHours, totalWeeklyDays, p1BreakMinutes, p2BreakMinutes, p3BreakMinutes, p1NightBreakMinutes, p2NightBreakMinutes, p3NightBreakMinutes, totalBreakMinutesWeekly, result } = computeDerived(entry);
  const rates = getDeductionRatesForYear(entry.year);

  // 1. 귀속월 분석을 통한 근무일수/주휴일수 자동 계산
  const [pYear, pMonth] = paymentMonth.split('-').map(Number);
  let workDaysOfWeek = [];
  const holiday = parseInt(weeklyHoliday, 10);
  if (entry.scheduleType === '요일별') {
    const daysMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(day => {
      if (entry[`${day}Active`] && daysMap[day] !== holiday) {
        workDaysOfWeek.push(daysMap[day]);
      }
    });
  } else {
    const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // 월~토, 일 순
    const filtered = daysOrder.filter(d => d !== holiday);
    const count = Math.min(Math.max(parseInt(totalWeeklyDays, 10) || 5, 0), 6);
    workDaysOfWeek = filtered.slice(0, count);
  }

  let scheduledWorkDaysInMonth = 0;
  let holidaysInMonth = 0;
  if (pYear && pMonth) {
    const date = new Date(pYear, pMonth - 1, 1);
    while (date.getMonth() === pMonth - 1) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === holiday) {
        holidaysInMonth++;
      } else if (workDaysOfWeek.includes(dayOfWeek)) {
        scheduledWorkDaysInMonth++;
      }
      date.setDate(date.getDate() + 1);
    }
  }

  // 2. 결근 공제액 및 실제 근무일수 계산
  const isLessThan6Days = totalWeeklyDays < 6;
  const absDays = Math.max(0, parseFloat(absenceDays) || 0);
  const actualWorkDays = Math.max(0, scheduledWorkDaysInMonth - absDays);
  const actualPaidHolidays = Math.max(0, holidaysInMonth - absDays);

  let absenceDeduction = 0;
  let dailyWage = 0;
  if (absDays > 0) {
    if (isLessThan6Days) {
      // 주 6일 미만 근로자: 소정근로일과 주휴일을 포함한 총 소정일수 기준으로 일급을 산정하여 공제
      const totalScheduled = scheduledWorkDaysInMonth + holidaysInMonth;
      if (totalScheduled > 0) {
        dailyWage = Math.round((result.basePay + result.weeklyHolidayPay) / totalScheduled);
        // 결근일수 + 해당 결근으로 인한 주휴수당 상실 일수(결근일수와 주휴일수 중 작은 값만큼 상실)
        const lostHolidays = Math.min(absDays, holidaysInMonth);
        absenceDeduction = Math.round(dailyWage * (absDays + lostHolidays));
      }
    } else {
      // 주 6일 이상 근로자: 일반적인 일할 공제 (30일 기준) 적용
      absenceDeduction = Math.round(((result.basePay + result.weeklyHolidayPay) / 30) * absDays);
    }
  }

  // 3. 결근 공제를 반영하여 세금/4대보험 및 실수령액 재계산
  const adjustedGrossTotal = Math.max(0, result.grossTotal - absenceDeduction);
  const defaultPensionBasis = entry.pensionBasis > 0 ? parseFloat(entry.pensionBasis) : Math.max(0, result.basePay + result.weeklyHolidayPay - absenceDeduction);
  const adjustedDeductions = applyDeductions(
    adjustedGrossTotal,
    parseInt(entry.year, 10),
    defaultPensionBasis,
    result.totalNonTaxable,
    entry.deductionType || '4대보험',
    actualWorkDays || 20
  );

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
                  <DayOfWeekEditor entry={entry} update={update} updateTime={updateTime} updateBreak={updateBreak} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>하루 야간근무 시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 2 (22시~06시 사이 근무시간)" value={entry.directDailyNightHours || ''} onChange={(e) => update('directDailyNightHours')(e.target.value)} min="0" max="24" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>하루 야간휴게 시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 0" value={entry.directDailyNightBreakHours || ''} onChange={(e) => update('directDailyNightBreakHours')(e.target.value)} min="0" max="24" />
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0 0' }}>
                  * 하루 평균 근로시간에서 8시간을 넘는 부분은 연장근로로 자동 계산됩니다.
                  야간근로시간에서 야간휴게시간을 제외한 알짜 야간근로시간이 주당 및 월간 계산에 반영됩니다.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <PatternInput label="근무 패턴 1" days={entry.pattern1Days} onDaysChange={update('pattern1Days')} start={entry.pattern1Start} onStartChange={updateTime('pattern1', 'Start')} end={entry.pattern1End} onEndChange={updateTime('pattern1', 'End')} hours={p1.workHours} breakH={entry.pattern1BreakH} onBreakHChange={updateBreak('pattern1', 'BreakH')} breakM={entry.pattern1BreakM} onBreakMChange={updateBreak('pattern1', 'BreakM')} breakMinutes={p1BreakMinutes + p1NightBreakMinutes} nightOverlapRaw={p1.nightOverlapRaw} nightHours={p1.nightHours} nightBreakH={entry.pattern1NightBreakH} onNightBreakHChange={update('pattern1NightBreakH')} nightBreakM={entry.pattern1NightBreakM} onNightBreakMChange={update('pattern1NightBreakM')} />
                  <PatternInput label="근무 패턴 2 (선택)" days={entry.pattern2Days} onDaysChange={update('pattern2Days')} start={entry.pattern2Start} onStartChange={updateTime('pattern2', 'Start')} end={entry.pattern2End} onEndChange={updateTime('pattern2', 'End')} hours={p2.workHours} breakH={entry.pattern2BreakH} onBreakHChange={updateBreak('pattern2', 'BreakH')} breakM={entry.pattern2BreakM} onBreakMChange={updateBreak('pattern2', 'BreakM')} breakMinutes={p2BreakMinutes + p2NightBreakMinutes} nightOverlapRaw={p2.nightOverlapRaw} nightHours={p2.nightHours} nightBreakH={entry.pattern2NightBreakH} onNightBreakHChange={update('pattern2NightBreakH')} nightBreakM={entry.pattern2NightBreakM} onNightBreakMChange={update('pattern2NightBreakM')} />
                  <PatternInput label="근무 패턴 3 (선택)" days={entry.pattern3Days} onDaysChange={update('pattern3Days')} start={entry.pattern3Start} onStartChange={updateTime('pattern3', 'Start')} end={entry.pattern3End} onEndChange={updateTime('pattern3', 'End')} hours={p3.workHours} breakH={entry.pattern3BreakH} onBreakHChange={updateBreak('pattern3', 'BreakH')} breakM={entry.pattern3BreakM} onBreakMChange={updateBreak('pattern3', 'BreakM')} breakMinutes={p3BreakMinutes + p3NightBreakMinutes} nightOverlapRaw={p3.nightOverlapRaw} nightHours={p3.nightHours} nightBreakH={entry.pattern3NightBreakH} onNightBreakHChange={update('pattern3NightBreakH')} nightBreakM={entry.pattern3NightBreakM} onNightBreakMChange={update('pattern3NightBreakM')} />
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
              연 환산 실수령액 약 {result.netAnnual.toLocaleString()}원 (월 총근로 {((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)).toFixed(1)}시간: 기준 {(((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) <= 174 ? ((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) : 174).toFixed(1)}시간 / 연장 {(((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) <= 174 ? 0 : (result.overtimeHoursMonthly || 0)).toFixed(1)}시간 / 야간 {(result.nightHoursMonthly || 0).toFixed(1)}시간 기준)
            </div>

            {/* 근무시간 대시보드 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '0.4rem', 
              margin: '0.75rem 0', 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '0.6rem 0.5rem', 
              borderRadius: '8px', 
              border: `1px solid ${result.isMinWageCompliant ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.25)'}`,
              boxShadow: result.isMinWageCompliant ? 'none' : 'inset 0 0 10px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>총 근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                  {((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)).toFixed(1)}h
                </strong>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#38bdf8', display: 'block', marginBottom: '0.15rem' }}>기준근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                  {(((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) <= 174 
                    ? ((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) 
                    : 174).toFixed(1)}h
                </strong>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#a5b4fc', display: 'block', marginBottom: '0.15rem' }}>연장근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                  {(((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)) <= 174 
                    ? 0 
                    : (result.overtimeHoursMonthly || 0)).toFixed(1)}h
                </strong>
              </div>
              <div style={{ 
                textAlign: 'center', 
                background: 'rgba(255,255,255,0.01)', 
                padding: '0.35rem 0.2rem', 
                borderRadius: '6px',
                border: !result.isMinWageCompliant ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none'
              }}>
                <span style={{ fontSize: '0.6rem', color: '#f472b6', display: 'block', marginBottom: '0.15rem' }}>
                  {!result.isMinWageCompliant && <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', marginRight: '3px', boxShadow: '0 0 6px #ef4444', animation: 'pulse 1s infinite' }} />}
                  야간근로시간
                </span>
                <strong style={{ fontSize: '0.85rem', color: '#f472b6' }}>
                  {(result.nightHoursMonthly || 0).toFixed(1)}h
                </strong>
              </div>
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

            {/* 근무시간 요약 표 */}
            <div style={{ background: 'rgba(56, 189, 248, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px dashed rgba(56, 189, 248, 0.2)', marginBottom: '1rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <Clock size={14} color="#38bdf8" /> 근무시간 요약 (주 / 월 기준)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.25rem', marginBottom: '0.25rem', fontWeight: 'bold', textAlign: 'center' }}>
                <div>구분</div>
                <div>주 기준</div>
                <div>월 기준</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0', textAlign: 'center' }}>
                <div style={{ color: '#38bdf8', fontWeight: '500' }}>기준(소정)근로시간</div>
                <div><strong>{(result.weeklyRegularHours || 0).toFixed(1)}시간</strong></div>
                <div>{(result.regularWorkHoursMonthly || 0).toFixed(1)}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0', textAlign: 'center' }}>
                <div style={{ color: '#a5b4fc', fontWeight: '500' }}>연장근로시간</div>
                <div><strong>{(result.weeklyOvertimeHours || 0).toFixed(1)}시간</strong></div>
                <div>{(result.overtimeHoursMonthly || 0).toFixed(1)}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0', textAlign: 'center' }}>
                <div style={{ color: '#f472b6', fontWeight: '500' }}>야간근로시간</div>
                <div><strong>{(result.weeklyNightHours || 0).toFixed(1)}시간</strong></div>
                <div>{(result.nightHoursMonthly || 0).toFixed(1)}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.72rem', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.25rem', marginTop: '0.25rem', textAlign: 'center' }}>
                <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>총 실근로시간</div>
                <div><strong>{(result.weeklyTotalHours || 0).toFixed(1)}시간</strong></div>
                <div>{((result.regularWorkHoursMonthly || 0) + (result.overtimeHoursMonthly || 0)).toFixed(1)}시간</div>
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

          {(() => {
            const wage = result.baseHourlyWage;
            if (!wage) return null;
            const is5Over = entry.companySize === '5인 이상';

            // 항목마다 실제로 인정되는 월 시간이 다르므로(기본급=소정근로시간, 연장/야간/연차/휴일은 각자 별도),
            // 절대 모든 행에 같은 시간을 쓰면 안 된다 — 그러면 "반영 분산시급"이 그 항목의 실제 시급과 달라진다.
            const monthlyRecognizedHours = result.regularWorkHoursMonthly || 0;

            // 일별 야간·연장시간 계산 (레이블용)
            const weeklyDays = totalWeeklyDays > 0 ? totalWeeklyDays
              : (entry.scheduleType === '직접입력' ? (parseFloat(entry.directWeeklyWorkDays) || 5) : 5);
            const dailyOvertimeH = weeklyDays > 0 ? (result.weeklyOvertimeHours / weeklyDays) : 0;
            const dailyNightH = weeklyDays > 0 ? (result.weeklyNightHours / weeklyDays) : 0;

            // 급여 구분(시급/일급/주급/월급)에 맞춰 "단가" 열의 단위를 바꿔서 보여준다
            const daysVal = result.workingDaysCount || 0;
            const unitLabel = { 시급: '시급', 일급: '일급', 주급: '주급', 월급: '월급' }[entry.salaryType] || '월급';
            const unitAmountOf = (amount, hours) => {
              if (entry.salaryType === '시급') return hours > 0 ? roundDownToTen(amount / hours) : 0;
              if (entry.salaryType === '일급') return daysVal > 0 ? roundDownToTen(amount / daysVal) : 0;
              if (entry.salaryType === '주급') return roundDownToTen(amount / AVG_WEEKS_PER_MONTH);
              return amount; // 월급
            };

            const annualLeaveDaysVal = parseFloat(entry.annualLeaveDays) || 0;
            const holidayWorkDaysVal = parseFloat(entry.holidayWorkDays) || 0;

            const rows = [
              {
                label: `기본급 (일 ${result.avgDailyHours}시간)`,
                hours: monthlyRecognizedHours,
                amount: result.basePay,
                basis: `소정근로시간 × 기초시급\n(주 ${result.weeklyRegularHours || 0}시간 × 4.345)`
              },
              {
                label: '주휴수당',
                hours: result.weeklyHolidayHoursMonthly || 0,
                amount: result.weeklyHolidayPay,
                basis: `주 소정근로시간 / 40 × 8 × 4.345\n(근로기준법 제55조, 주 15시간 이상)`
              },
              ...(result.overtimePay > 0 ? [{
                label: `법정 연장근로수당 (일 ${dailyOvertimeH % 1 === 0 ? dailyOvertimeH.toFixed(0) : dailyOvertimeH.toFixed(1)}시간)`,
                hours: result.overtimeHoursMonthly || 0,
                amount: result.overtimePay,
                basis: `연장시간 × 기초시급 × ${is5Over ? '1.5배' : '1.0배'} 가산\n(근로기준법 제56조 1항, ${is5Over ? '5인 이상' : '5인 미만 가산 없음'})`
              }] : []),
              ...(result.nightPay > 0 ? [{
                label: `법정 야간근로수당 (일 ${dailyNightH % 1 === 0 ? dailyNightH.toFixed(0) : dailyNightH.toFixed(1)}시간)`,
                hours: result.nightHoursMonthly || 0,
                amount: result.nightPay,
                basis: `야간시간(22:00~06:00) × 기초시급 × 0.5배 가산\n(근로기준법 제56조 3항, 5인 이상)`
              }] : []),
              ...(annualLeaveDaysVal > 0 && result.leavePayMonthly > 0 ? [{
                label: `연차수당 (연 ${annualLeaveDaysVal}개)`,
                hours: result.leavePayHoursMonthly || 0,
                amount: result.leavePayMonthly,
                basis: `연 ${annualLeaveDaysVal}일 × 1일 소정근로 × 시급 / 12월 분할\n(근로기준법 제60조, 선지급 1/12 분할)`
              }] : []),
              ...(holidayWorkDaysVal > 0 && result.holidayWorkPay > 0 ? [{
                label: `휴일근로수당 (연 ${holidayWorkDaysVal}일)`,
                hours: result.holidayWorkHoursMonthly || 0,
                amount: result.holidayWorkPay,
                basis: `연 ${holidayWorkDaysVal}일 × 1일 소정근로 × ${is5Over ? '1.5배' : '1.0배'} / 12월 분할\n(근로기준법 제56조 2항, 선지급 1/12 분할)`
              }] : []),
            ].filter(r => r.amount > 0);

            const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
            const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);

            // 제목: 일 소정시간 + 야간시간 표시 (이미지 기준)
            const titleDetail = dailyNightH > 0
              ? `일 ${result.avgDailyHours}시간 · 야간 ${dailyNightH % 1 === 0 ? dailyNightH.toFixed(0) : dailyNightH.toFixed(1)}시간 반영`
              : `일 ${result.avgDailyHours}시간 기준 자동 계산`;

            const salaryLabel = entry.salaryType === '일급'
              ? `일급 ${Number(entry.salaryAmount).toLocaleString()}원 → 역산 시급: ${wage.toLocaleString()}원`
              : `기초시급 ${wage.toLocaleString()}원`;

            return (
              <div style={{ margin: '0.75rem 0', background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* 헤더 */}
                <div style={{ background: 'rgba(56, 189, 248, 0.12)', padding: '0.7rem 1rem', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 'bold' }}>
                    📋 [{entry.companySize}] 정착된 근로계약서 수당 세팅표 ({titleDetail})
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>
                    {salaryLabel} | 월 소정근로 {monthlyRecognizedHours}시간 기준 자동 계산
                  </span>
                </div>

                {/* 테이블 */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', minWidth: '520px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'center', width: '22%' }}>수당 항목</th>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'center', width: '11%' }}>인정 시간(월)</th>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'center', width: '10%' }}>반영 비율</th>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'center', width: '12%' }}>{unitLabel} 단가</th>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'center', width: '11%' }}>월 지급액</th>
                        <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px 8px', color: '#94a3b8', textAlign: 'left', width: '34%' }}>산정식 및 법적 근거</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>{r.label}</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>
                            {(r.hours || 0).toFixed(2)}시간
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#a5b4fc', textAlign: 'center', fontWeight: 600 }}>
                            {totalAmount > 0 ? ((r.amount / totalAmount) * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
                            {unitAmountOf(r.amount, r.hours).toLocaleString()}원
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#38bdf8', textAlign: 'right', fontWeight: 700 }}>
                            {r.amount.toLocaleString()}원
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '5px 8px', color: '#94a3b8', fontSize: '0.65rem', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                            {r.basis}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(56, 189, 248, 0.1)', borderTop: '2px solid rgba(56, 189, 248, 0.3)' }}>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#38bdf8', fontWeight: 'bold' }}>고정 급여 합계</td>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#38bdf8', textAlign: 'center', fontWeight: 'bold' }}>
                          {totalHours.toFixed(2)}시간
                        </td>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#38bdf8', textAlign: 'center', fontWeight: 'bold' }}>
                          {result.grossTotal > 0 ? ((totalAmount / result.grossTotal) * 100).toFixed(1) : '100.0'}%
                        </td>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#38bdf8', textAlign: 'center', fontWeight: 'bold' }}>
                          {unitAmountOf(totalAmount, totalHours).toLocaleString()}원
                        </td>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#38bdf8', textAlign: 'right', fontWeight: 'bold' }}>
                          {totalAmount.toLocaleString()}원
                        </td>
                        <td style={{ border: '1px solid rgba(56,189,248,0.2)', padding: '6px 8px', color: '#64748b', fontSize: '0.65rem' }}>
                          기본, 주휴, 야간, 연장, 연차, 휴일근로가 모두 포함 분산된 고정급여 및 시급
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 시급/일급 환산 요약 */}
                {(() => {
                  const daysVal = result.workingDaysCount || 0;
                  const hourlyConverted = totalHours > 0 ? roundDownToTen(totalAmount / totalHours) : 0;
                  const dailyConverted = daysVal > 0 ? roundDownToTen(totalAmount / daysVal) : 0;
                  const dailyAvgHours = daysVal > 0 ? totalHours / daysVal : 0;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem 0.25rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>시급 환산 (총 지급액 ÷ 월 인정 {totalHours.toFixed(2)}시간)</span>
                        <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>{hourlyConverted.toLocaleString()}원</strong>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>일급 환산 (총 지급액 ÷ 월 {daysVal.toFixed(1)}일, 1일 평균 {dailyAvgHours.toFixed(2)}시간)</span>
                        <strong style={{ fontSize: '0.95rem', color: '#a5b4fc' }}>{dailyConverted.toLocaleString()}원</strong>
                      </div>
                    </div>
                  );
                })()}

                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0', padding: '0.5rem 1rem' }}>
                  ※ {unitLabel} 단가 = 그 항목의 월 지급액 ÷ 그 항목의 {entry.salaryType === '시급' ? '월 인정시간' : entry.salaryType === '일급' ? '월 근무일수' : entry.salaryType === '주급' ? '월평균 주수(4.345)' : '1(월급 그대로)'} — 급여 구분을 시급/일급/주급/월급으로 바꾸면 이 열의 단위도 함께 바뀝니다.
                  {entry.salaryType === '일급' && ` · 일급 입력 시 역산된 시급(${wage.toLocaleString()}원)이 기준이 됩니다.`}
                </p>
              </div>
            );
          })()}

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

          {/* 법정 급여명세서 교부 및 발급 버튼 */}
          <button
            type="button"
            onClick={() => setPayStubOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              width: '100%', 
              padding: '0.85rem', 
              marginTop: '1.25rem', 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              border: 'none', 
              borderRadius: '10px', 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <Clock size={16} /> 법정 급여명세서 교부·발급
          </button>
        </div>
      </div>

      {payStubOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .paystub-print-area, .paystub-print-area * {
                visibility: visible;
              }
              .paystub-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: #000 !important;
                background: #fff !important;
                padding: 30px !important;
                font-family: sans-serif;
                box-shadow: none !important;
              }
              .paystub-print-area table {
                border-collapse: collapse;
                width: 100%;
              }
              .paystub-print-area th, .paystub-print-area td {
                border: 1px solid #000 !important;
                color: #000 !important;
                padding: 8px !important;
                font-size: 11px !important;
              }
              .paystub-print-area th {
                background: #f3f4f6 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          
          <div className="glass-panel no-print" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '16px', color: '#f8fafc' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
              <Building2 size={22} /> 교부용 법정 급여명세서 작성 및 발급
            </h2>
            
            {/* 정보 입력 폼 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>회사(사업장)명</label>
                <input type="text" className="text-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>근로자 성명</label>
                <input type="text" className="text-input" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>생년월일</label>
                <input type="date" className="text-input" value={employeeBirth} onChange={(e) => setEmployeeBirth(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>급여 귀속월</label>
                <input type="month" className="text-input" value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>임금 지급일</label>
                <input type="text" className="text-input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>공제 구분</label>
                <input type="text" className="text-input" value={entry.deductionType || '4대보험'} disabled style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주휴일</label>
                <select className="text-input" value={weeklyHoliday} onChange={(e) => setWeeklyHoliday(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', colorScheme: 'dark' }}>
                  <option value="0">일요일</option>
                  <option value="1">월요일</option>
                  <option value="2">화요일</option>
                  <option value="3">수요일</option>
                  <option value="4">목요일</option>
                  <option value="5">금요일</option>
                  <option value="6">토요일</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>결근 일수</label>
                <input type="number" className="text-input" value={absenceDays} onChange={(e) => setAbsenceDays(e.target.value)} min="0" max="31" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
              </div>
              <div style={{ gridColumn: 'span 3', padding: '0.6rem 0.8rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <div>
                  📅 <strong>{pYear}년 {pMonth}월 소정일수 자동계산:</strong> 소정근로일수 <strong>{scheduledWorkDaysInMonth}일</strong> | 주휴일수 <strong>{holidaysInMonth}일</strong> (총 {scheduledWorkDaysInMonth + holidaysInMonth}일)
                </div>
                {absDays > 0 && (
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>
                    실제 근무: {actualWorkDays}일 | 지급 주휴: {actualPaidHolidays}일
                  </div>
                )}
              </div>
            </div>
            
            {/* 명세서 미리보기 (인쇄 영역) */}
            <div className="paystub-print-area" style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', textDecoration: 'underline', color: '#fff', margin: '0 0 0.5rem 0' }}>급 여 명 세 서</h1>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>귀하의 노고에 감사드립니다.</p>
              </div>
              
              {/* 근로자 및 사업장 정보 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', width: '15%' }}>사업장명</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff', width: '35%' }}>{companyName}</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', width: '15%' }}>귀속년월</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff', width: '35%' }}>{paymentMonth.split('-')[0]}년 {paymentMonth.split('-')[1]}월분</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>성 명</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>{employeeName}</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>지급일자</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>{paymentDate}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>생년월일</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>{employeeBirth}</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>기초시급</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>{result.baseHourlyWage.toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>소정근로/주휴</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>근로 {scheduledWorkDaysInMonth}일 / 주휴 {holidaysInMonth}일</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>실제근무/지급주휴</td>
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>근무 {actualWorkDays}일 / 주휴 {actualPaidHolidays}일</td>
                  </tr>
                </tbody>
              </table>
              
              {/* 내역 테이블 (지급 vs 공제) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {/* 지급 내역 */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px', fontSize: '0.75rem', color: '#38bdf8', textAlign: 'center' }} colSpan={2}>지급 항목</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>기본급</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.basePay.toLocaleString()}원</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>주휴수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.weeklyHolidayPay.toLocaleString()}원</td>
                      </tr>
                      {result.overtimePay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>연장근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.overtimePay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {result.nightPay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>야간근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.nightPay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {result.holidayWorkPay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>휴일근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.holidayWorkPay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {result.leavePayMonthly > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>연차수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{result.leavePayMonthly.toLocaleString()}원</td>
                        </tr>
                      )}
                      {result.totalNonTaxable + result.totalTaxableExcess > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#34d399' }}>비과세 수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#34d399', textAlign: 'right' }}>{(result.totalNonTaxable + result.totalTaxableExcess).toLocaleString()}원</td>
                        </tr>
                      )}
                      {result.taxableAllowance > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171' }}>과세 수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', textAlign: 'right' }}>{result.taxableAllowance.toLocaleString()}원</td>
                        </tr>
                      )}
                      <tr style={{ background: 'rgba(56, 189, 248, 0.05)' }}>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>지급액 합계</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#38bdf8', textAlign: 'right', fontWeight: 'bold' }}>{result.grossTotal.toLocaleString()}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* 공제 내역 */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px', fontSize: '0.75rem', color: '#f87171', textAlign: 'center' }} colSpan={2}>공제 항목</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(entry.deductionType === '4대보험' || !entry.deductionType) ? (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>국민연금</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.nationalPension.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>건강보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.healthInsurance.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>장기요양보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.longTermCare.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>고용보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.employmentInsurance.toLocaleString()}원</td>
                          </tr>
                        </>
                      ) : entry.deductionType === '3.3%' ? (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>사업소득세 (3.0%)</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.incomeTax.toLocaleString()}원</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>고용보험 (일용직)</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.employmentInsurance.toLocaleString()}원</td>
                          </tr>
                          {adjustedDeductions.incomeTax > 0 && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>일용근로소득세</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.incomeTax.toLocaleString()}원</td>
                            </tr>
                          )}
                        </>
                      )}
                      {adjustedDeductions.incomeTax > 0 && entry.deductionType !== '3.3%' && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>근로소득세</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.incomeTax.toLocaleString()}원</td>
                        </tr>
                      )}
                      {adjustedDeductions.localIncomeTax > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>지방소득세</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{adjustedDeductions.localIncomeTax.toLocaleString()}원</td>
                        </tr>
                      )}
                      {absenceDeduction > 0 && (
                        <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold' }}>결근 공제 ({absenceDays}일)</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', textAlign: 'right', fontWeight: 'bold' }}>{absenceDeduction.toLocaleString()}원</td>
                        </tr>
                      )}
                      <tr style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold' }}>공제액 합계</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', textAlign: 'right', fontWeight: 'bold' }}>{(adjustedDeductions.totalDeductions + absenceDeduction).toLocaleString()}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 차인 지급액 (실수령액) */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 'bold' }}>차인 지급액 (실수령액)</span>
                <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>{adjustedDeductions.netPay.toLocaleString()}원</strong>
              </div>
              
              {/* 법정 필수 기재: 임금 계산방법 명세 */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>임금 계산방법 명세 (근로기준법 제48조 2항에 따른 계산식)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px', color: '#94a3b8', width: '25%', textAlign: 'center' }}>항목</th>
                      <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px', color: '#94a3b8', width: '20%', textAlign: 'center' }}>시간(일)수</th>
                      <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px', color: '#94a3b8', width: '55%', textAlign: 'center' }}>상세 계산방법 (계산식)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>기본급</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.regularWorkHoursMonthly}시간</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>{result.regularWorkHoursMonthly}시간 × {result.baseHourlyWage.toLocaleString()}원</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>주휴수당</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.weeklyHolidayHoursMonthly}시간</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                        {result.weeklyHolidayHoursMonthly > 0 
                          ? `${result.weeklyHolidayHoursMonthly}시간 × ${result.baseHourlyWage.toLocaleString()}원` 
                          : '미발생 (주 소정근로 15시간 미만)'}
                      </td>
                    </tr>
                    {result.overtimePay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>연장근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.overtimeHoursMonthly}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {result.overtimeHoursMonthly}시간 × {result.baseHourlyWage.toLocaleString()}원 × {entry.companySize === '5인 이상' ? '1.5배' : '1.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {result.nightPay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>야간근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.nightHoursMonthly}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {result.nightHoursMonthly}시간 × {result.baseHourlyWage.toLocaleString()}원 × {entry.companySize === '5인 이상' ? '0.5배' : '0.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {result.holidayWorkPay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>휴일근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.holidayWorkHoursMonthly}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {result.holidayWorkHoursMonthly}시간 × {result.baseHourlyWage.toLocaleString()}원 × {entry.companySize === '5인 이상' ? '1.5배' : '1.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {result.leavePayMonthly > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>연차수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{result.leavePayHoursMonthly}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {result.leavePayHoursMonthly}시간 × {result.baseHourlyWage.toLocaleString()}원 (선지급 분할)
                        </td>
                      </tr>
                    )}
                    {absenceDeduction > 0 && (
                      <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#f87171', fontWeight: 600 }}>결근 공제</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{absenceDays}일 결근</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {isLessThan6Days 
                            ? `일급(${dailyWage.toLocaleString()}원) × (결근 ${absenceDays}일 + 주휴 ${Math.min(absDays, holidaysInMonth)}일 상실) = ${absenceDeduction.toLocaleString()}원 공제`
                            : `일 기준 공제: (기본급+주휴수당 / 30) × 결근 ${absenceDays}일 = ${absenceDeduction.toLocaleString()}원 공제`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 하단 액션 버튼 */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  const paymentYear = paymentMonth.split('-')[0];
                  const paymentMon = paymentMonth.split('-')[1];
                  const copyText = `[${companyName} 급여명세서]
귀하의 노고에 감사드립니다.

* 근로자: ${employeeName}님 (${employeeBirth})
* 귀속월: ${paymentYear}년 ${paymentMon}월분
* 지급일자: ${paymentDate}
* 근로일수: 소정 ${scheduledWorkDaysInMonth}일 / 주휴 ${holidaysInMonth}일 (실제근무 ${actualWorkDays}일 / 지급주휴 ${actualPaidHolidays}일)

■ 지급 내역
- 기본급: ${result.basePay.toLocaleString()}원 (${result.regularWorkHoursMonthly}시간)
- 주휴수당: ${result.weeklyHolidayPay.toLocaleString()}원 (${result.weeklyHolidayHoursMonthly}시간)
${result.overtimePay > 0 ? `- 연장근로수당: ${result.overtimePay.toLocaleString()}원 (${result.overtimeHoursMonthly}시간)\n` : ''}${result.nightPay > 0 ? `- 야간근로수당: ${result.nightPay.toLocaleString()}원 (${result.nightHoursMonthly}시간)\n` : ''}${result.holidayWorkPay > 0 ? `- 휴일근로수당: ${result.holidayWorkPay.toLocaleString()}원 (${result.holidayWorkHoursMonthly}시간)\n` : ''}${result.leavePayMonthly > 0 ? `- 연차수당: ${result.leavePayMonthly.toLocaleString()}원 (${result.leavePayHoursMonthly}시간)\n` : ''}- 지급액 합계: ${result.grossTotal.toLocaleString()}원

■ 공제 내역
${entry.deductionType === '4대보험' || !entry.deductionType ? `- 국민연금: ${adjustedDeductions.nationalPension.toLocaleString()}원
- 건강보험: ${adjustedDeductions.healthInsurance.toLocaleString()}원
- 장기요양보험: ${adjustedDeductions.longTermCare.toLocaleString()}원
- 고용보험: ${adjustedDeductions.employmentInsurance.toLocaleString()}원` : entry.deductionType === '3.3%' ? `- 사업소득세(3.3%): ${(adjustedDeductions.incomeTax + adjustedDeductions.localIncomeTax).toLocaleString()}원` : `- 고용보험: ${adjustedDeductions.employmentInsurance.toLocaleString()}원
- 일용소득세: ${adjustedDeductions.incomeTax.toLocaleString()}원`}${adjustedDeductions.incomeTax > 0 && entry.deductionType !== '3.3%' ? `\n- 소득세: ${adjustedDeductions.incomeTax.toLocaleString()}원\n- 지방소득세: ${adjustedDeductions.localIncomeTax.toLocaleString()}원` : ''}
${absenceDeduction > 0 ? `- 결근 공제 (${absenceDays}일): ${absenceDeduction.toLocaleString()}원\n` : ''}- 공제액 합계: ${(adjustedDeductions.totalDeductions + absenceDeduction).toLocaleString()}원

■ 실수령액 (차인 지급액)
★ 실수령액: ${adjustedDeductions.netPay.toLocaleString()}원

■ 임금 계산 상세 명세 (시급: ${result.baseHourlyWage.toLocaleString()}원)
- 기본급: ${result.regularWorkHoursMonthly}시간 × 시급
- 주휴수당: ${result.weeklyHolidayHoursMonthly}시간 × 시급
${result.overtimePay > 0 ? `- 연장수당: ${result.overtimeHoursMonthly}시간 × 시급 × ${entry.companySize === '5인 이상' ? '1.5' : '1.0'}\n` : ''}${result.nightPay > 0 ? `- 야간수당: ${result.nightHoursMonthly}시간 × 시급 × ${entry.companySize === '5인 이상' ? '0.5' : '0.0'}\n` : ''}${absenceDeduction > 0 ? `- 결근공제: ${isLessThan6Days ? `일급(${dailyWage.toLocaleString()}원) × (결근 ${absenceDays}일 + 주휴 ${Math.min(absDays, holidaysInMonth)}일)` : `(기본급 / 30) × 결근 ${absenceDays}일`}\n` : ''}
* 노무체크 AI를 통해 생성된 모바일 법정 급여명세서입니다.`;
                  
                  navigator.clipboard.writeText(copyText).then(() => {
                    alert('급여명세서 텍스트가 클립보드에 복사되었습니다! 카카오톡 창에 붙여넣기(Ctrl+V) 하여 즉시 전송할 수 있습니다.');
                  }).catch(() => {
                    alert('복사에 실패했습니다. 명세서를 직접 드래그하여 복사해 주세요.');
                  });
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#eab308', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                카카오톡 전송 (텍스트 복사)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                명세서 인쇄 / PDF 저장
              </button>
              
              <button
                type="button"
                onClick={() => setPayStubOpen(false)}
                style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
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
