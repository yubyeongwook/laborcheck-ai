import React, { useState } from 'react';
import { Coins, Building2, Clock, CalendarClock, Sun, ShieldAlert, BadgeAlert, Utensils } from 'lucide-react';
import { calculateHoursAndNightHours, getMinWageForYear, applyDeductions, getDeductionRatesForYear, calculateNonTaxableBreakdown, NON_TAXABLE_MONTHLY_CAP, roundDownToTen, calculateHolidayDayPay, calculateElapsedHours, getStatutoryBreakMinutes, makeAutoBreakHandlers, AVG_WEEKS_PER_MONTH } from '../utils/laborCalc.js';
import LaborInfoSync from '../components/LaborInfoSync.jsx';

const currentYear = new Date().getFullYear();

function formatMinutesAsHM(totalMinutes) {
  const m = Math.max(Math.round(totalMinutes), 0);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}분`;
  if (rest === 0) return `${h}시간`;
  return `${h}시간 ${rest}분`;
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

const DAY_LABELS = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일'
};

function DayOfWeekEditor({
  monActive, setMonActive, monStart, setMonStart, monEnd, setMonEnd, monBreakH, setMonBreakH, monBreakM, setMonBreakM, monBreakAuto, setMonBreakAuto, monNightBreakH, setMonNightBreakH, monNightBreakM, setMonNightBreakM,
  tueActive, setTueActive, tueStart, setTueStart, tueEnd, setTueEnd, tueBreakH, setTueBreakH, tueBreakM, setTueBreakM, tueBreakAuto, setTueBreakAuto, tueNightBreakH, setTueNightBreakH, tueNightBreakM, setTueNightBreakM,
  wedActive, setWedActive, wedStart, setWedStart, wedEnd, setWedEnd, wedBreakH, setWedBreakH, wedBreakM, setWedBreakM, wedBreakAuto, setWedBreakAuto, wedNightBreakH, setWedNightBreakH, wedNightBreakM, setWedNightBreakM,
  thuActive, setThuActive, thuStart, setThuStart, thuEnd, setThuEnd, thuBreakH, setThuBreakH, thuBreakM, setThuBreakM, thuBreakAuto, setThuBreakAuto, thuNightBreakH, setThuNightBreakH, thuNightBreakM, setThuNightBreakM,
  friActive, setFriActive, friStart, setFriStart, friEnd, setFriEnd, friBreakH, setFriBreakH, friBreakM, setFriBreakM, friBreakAuto, setFriBreakAuto, friNightBreakH, setFriNightBreakH, friNightBreakM, setFriNightBreakM,
  satActive, setSatActive, satStart, setSatStart, satEnd, setSatEnd, satBreakH, setSatBreakH, satBreakM, setSatBreakM, satBreakAuto, setSatBreakAuto, satNightBreakH, setSatNightBreakH, satNightBreakM, setSatNightBreakM,
  sunActive, setSunActive, sunStart, setSunStart, sunEnd, setSunEnd, sunBreakH, setSunBreakH, sunBreakM, setSunBreakM, sunBreakAuto, setSunBreakAuto, sunNightBreakH, setSunNightBreakH, sunNightBreakM, setSunNightBreakM
}) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const daysMap = {
    mon: { active: monActive, setActive: setMonActive, start: monStart, setStart: setMonStart, end: monEnd, setEnd: setMonEnd, breakH: monBreakH, setBreakH: setMonBreakH, breakM: monBreakM, setBreakM: setMonBreakM, breakAuto: monBreakAuto, setBreakAuto: setMonBreakAuto, nightBreakH: monNightBreakH, setNightBreakH: setMonNightBreakH, nightBreakM: monNightBreakM, setNightBreakM: setMonNightBreakM },
    tue: { active: tueActive, setActive: setTueActive, start: tueStart, setStart: setTueStart, end: tueEnd, setEnd: setTueEnd, breakH: tueBreakH, setBreakH: setTueBreakH, breakM: tueBreakM, setBreakM: setTueBreakM, breakAuto: tueBreakAuto, setBreakAuto: setTueBreakAuto, nightBreakH: tueNightBreakH, setNightBreakH: setTueNightBreakH, nightBreakM: tueNightBreakM, setNightBreakM: setTueNightBreakM },
    wed: { active: wedActive, setActive: setWedActive, start: wedStart, setStart: setWedStart, end: wedEnd, setEnd: setWedEnd, breakH: wedBreakH, setBreakH: setWedBreakH, breakM: wedBreakM, setBreakM: setWedBreakM, breakAuto: wedBreakAuto, setBreakAuto: setWedBreakAuto, nightBreakH: wedNightBreakH, setNightBreakH: setWedNightBreakH, nightBreakM: wedNightBreakM, setNightBreakM: setWedNightBreakM },
    thu: { active: thuActive, setActive: setThuActive, start: thuStart, setStart: setThuStart, end: thuEnd, setEnd: setThuEnd, breakH: thuBreakH, setBreakH: setThuBreakH, breakM: thuBreakM, setBreakM: setThuBreakM, breakAuto: thuBreakAuto, setBreakAuto: setThuBreakAuto, nightBreakH: thuNightBreakH, setNightBreakH: setThuNightBreakH, nightBreakM: thuNightBreakM, setNightBreakM: setThuNightBreakM },
    fri: { active: friActive, setActive: setFriActive, start: friStart, setStart: setFriStart, end: friEnd, setEnd: setFriEnd, breakH: friBreakH, setBreakH: setFriBreakH, breakM: friBreakM, setBreakM: setFriBreakM, breakAuto: friBreakAuto, setBreakAuto: setFriBreakAuto, nightBreakH: friNightBreakH, setNightBreakH: setFriNightBreakH, nightBreakM: friNightBreakM, setNightBreakM: setFriNightBreakM },
    sat: { active: satActive, setActive: setSatActive, start: satStart, setStart: setSatStart, end: satEnd, setEnd: setSatEnd, breakH: satBreakH, setBreakH: setSatBreakH, breakM: satBreakM, setBreakM: setSatBreakM, breakAuto: satBreakAuto, setBreakAuto: setSatBreakAuto, nightBreakH: satNightBreakH, setNightBreakH: setSatNightBreakH, nightBreakM: satNightBreakM, setNightBreakM: setSatNightBreakM },
    sun: { active: sunActive, setActive: setSunActive, start: sunStart, setStart: setSunStart, end: sunEnd, setEnd: setSunEnd, breakH: sunBreakH, setBreakH: setSunBreakH, breakM: sunBreakM, setBreakM: setSunBreakM, breakAuto: sunBreakAuto, setBreakAuto: setSunBreakAuto, nightBreakH: sunNightBreakH, setNightBreakH: setSunNightBreakH, nightBreakM: sunNightBreakM, setNightBreakM: setSunNightBreakM }
  };

  const isActive = (d) => daysMap[d].active === true || daysMap[d].active === 'true';
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
                onClick={() => daysMap[d].setActive(!active)}
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
        const item = daysMap[d];
        const breakHandlers = makeAutoBreakHandlers({
          startVal: item.start, endVal: item.end,
          setStart: item.setStart, setEnd: item.setEnd,
          setBreakH: item.setBreakH, setBreakM: item.setBreakM,
          breakAuto: item.breakAuto, setBreakAuto: item.setBreakAuto
        });
        const isBreakMinutes = (parseFloat(item.breakH) || 0) * 60 + (parseFloat(item.breakM) || 0);
        const elapsed = calculateElapsedHours(item.start, item.end);
        const workHours = Math.max(0, elapsed - isBreakMinutes / 60);

        return (
          <div key={d} style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold' }}>{DAY_LABELS[d]}요일</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
                <TimeSelectInput value={item.start} onChange={breakHandlers.onStartChange} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
                <TimeSelectInput value={item.end} onChange={breakHandlers.onEndChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>이 근무일의 총 휴게시간</span>
                <HourMinuteInput
                  hourValue={item.breakH}
                  onHourChange={breakHandlers.onBreakHChange}
                  minuteValue={item.breakM}
                  onMinuteChange={breakHandlers.onBreakMChange}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>야간시간대(22~06) 휴게시간</span>
                <HourMinuteInput
                  hourValue={item.nightBreakH}
                  onHourChange={item.setNightBreakH}
                  minuteValue={item.nightBreakM}
                  onMinuteChange={item.setNightBreakM}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#38bdf8', textAlign: 'right', fontWeight: '500' }}>
              실근로시간: <strong>{(Math.round(workHours * 100) / 100).toFixed(1)}시간</strong> (휴게 {isBreakMinutes}분 제외)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReverseSalaryCalculator() {
  const [year, setYear] = useState(String(currentYear));
  const [companySize, setCompanySize] = useState('5인 이상');
  const [grossSalaryInput, setGrossSalaryInput] = useState('2500000');
  const [deductionType, setDeductionType] = useState('4대보험');

  // 패턴 1, 2, 3 상태
  const [pattern1Days, setPattern1Days] = useState('5');
  const [pattern1Start, setPattern1Start] = useState('09:00');
  const [pattern1End, setPattern1End] = useState('18:00');
  const [pattern1BreakH, setPattern1BreakH] = useState('1');
  const [pattern1BreakM, setPattern1BreakM] = useState('0');
  const [pattern1BreakAuto, setPattern1BreakAuto] = useState(true);
  const [pattern1NightBreakH, setPattern1NightBreakH] = useState('0');
  const [pattern1NightBreakM, setPattern1NightBreakM] = useState('0');

  const [pattern2Days, setPattern2Days] = useState('0');
  const [pattern2Start, setPattern2Start] = useState('09:00');
  const [pattern2End, setPattern2End] = useState('18:00');
  const [pattern2BreakH, setPattern2BreakH] = useState('1');
  const [pattern2BreakM, setPattern2BreakM] = useState('0');
  const [pattern2BreakAuto, setPattern2BreakAuto] = useState(true);
  const [pattern2NightBreakH, setPattern2NightBreakH] = useState('0');
  const [pattern2NightBreakM, setPattern2NightBreakM] = useState('0');

  const [pattern3Days, setPattern3Days] = useState('0');
  const [pattern3Start, setPattern3Start] = useState('09:00');
  const [pattern3End, setPattern3End] = useState('18:00');
  const [pattern3BreakH, setPattern3BreakH] = useState('1');
  const [pattern3BreakM, setPattern3BreakM] = useState('0');
  const [pattern3BreakAuto, setPattern3BreakAuto] = useState(true);
  const [pattern3NightBreakH, setPattern3NightBreakH] = useState('0');
  const [pattern3NightBreakM, setPattern3NightBreakM] = useState('0');

  // 추가 수당 항목
  const [holidayWorkDays, setHolidayWorkDays] = useState('0');
  const [holidayStart, setHolidayStart] = useState('09:00');
  const [holidayEnd, setHolidayEnd] = useState('18:00');
  const [holidayBreakTime, setHolidayBreakTime] = useState('60');
  const [holidayBreakAuto, setHolidayBreakAuto] = useState(true);
  const [annualLeaveDays, setAnnualLeaveDays] = useState('0');
  const [pensionBasisInput, setPensionBasisInput] = useState('0');
  const [extraWeeklyOvertimeInput, setExtraWeeklyOvertimeInput] = useState('0');
  const [mealAllowanceInput, setMealAllowanceInput] = useState('0');
  const [carAllowanceInput, setCarAllowanceInput] = useState('0');
  const [childcareAllowanceInput, setChildcareAllowanceInput] = useState('0');
  const [otherNonTaxableInput, setOtherNonTaxableInput] = useState('0');
  const [taxableAllowanceInput, setTaxableAllowanceInput] = useState('0');

  // 직접 입력형 상태
  const [scheduleType, setScheduleType] = useState('패턴별');
  
  // 요일별 스케줄 상태 (기본 월~금 9 to 6)
  const [monActive, setMonActive] = useState(true);
  const [monStart, setMonStart] = useState('09:00');
  const [monEnd, setMonEnd] = useState('18:00');
  const [monBreakH, setMonBreakH] = useState('1');
  const [monBreakM, setMonBreakM] = useState('0');
  const [monBreakAuto, setMonBreakAuto] = useState(true);
  const [monNightBreakH, setMonNightBreakH] = useState('0');
  const [monNightBreakM, setMonNightBreakM] = useState('0');

  const [tueActive, setTueActive] = useState(true);
  const [tueStart, setTueStart] = useState('09:00');
  const [tueEnd, setTueEnd] = useState('18:00');
  const [tueBreakH, setTueBreakH] = useState('1');
  const [tueBreakM, setTueBreakM] = useState('0');
  const [tueBreakAuto, setTueBreakAuto] = useState(true);
  const [tueNightBreakH, setTueNightBreakH] = useState('0');
  const [tueNightBreakM, setTueNightBreakM] = useState('0');

  const [wedActive, setWedActive] = useState(true);
  const [wedStart, setWedStart] = useState('09:00');
  const [wedEnd, setWedEnd] = useState('18:00');
  const [wedBreakH, setWedBreakH] = useState('1');
  const [wedBreakM, setWedBreakM] = useState('0');
  const [wedBreakAuto, setWedBreakAuto] = useState(true);
  const [wedNightBreakH, setWedNightBreakH] = useState('0');
  const [wedNightBreakM, setWedNightBreakM] = useState('0');

  const [thuActive, setThuActive] = useState(true);
  const [thuStart, setThuStart] = useState('09:00');
  const [thuEnd, setThuEnd] = useState('18:00');
  const [thuBreakH, setThuBreakH] = useState('1');
  const [thuBreakM, setThuBreakM] = useState('0');
  const [thuBreakAuto, setThuBreakAuto] = useState(true);
  const [thuNightBreakH, setThuNightBreakH] = useState('0');
  const [thuNightBreakM, setThuNightBreakM] = useState('0');

  const [friActive, setFriActive] = useState(true);
  const [friStart, setFriStart] = useState('09:00');
  const [friEnd, setFriEnd] = useState('18:00');
  const [friBreakH, setFriBreakH] = useState('1');
  const [friBreakM, setFriBreakM] = useState('0');
  const [friBreakAuto, setFriBreakAuto] = useState(true);
  const [friNightBreakH, setFriNightBreakH] = useState('0');
  const [friNightBreakM, setFriNightBreakM] = useState('0');

  const [satActive, setSatActive] = useState(false);
  const [satStart, setSatStart] = useState('09:00');
  const [satEnd, setSatEnd] = useState('18:00');
  const [satBreakH, setSatBreakH] = useState('1');
  const [satBreakM, setSatBreakM] = useState('0');
  const [satBreakAuto, setSatBreakAuto] = useState(true);
  const [satNightBreakH, setSatNightBreakH] = useState('0');
  const [satNightBreakM, setSatNightBreakM] = useState('0');

  const [sunActive, setSunActive] = useState(false);
  const [sunStart, setSunStart] = useState('09:00');
  const [sunEnd, setSunEnd] = useState('18:00');
  const [sunBreakH, setSunBreakH] = useState('1');
  const [sunBreakM, setSunBreakM] = useState('0');
  const [sunBreakAuto, setSunBreakAuto] = useState(true);
  const [sunNightBreakH, setSunNightBreakH] = useState('0');
  const [sunNightBreakM, setSunNightBreakM] = useState('0');

  const [directWeeklyWorkDays, setDirectWeeklyWorkDays] = useState('5');
  const [directWeeklyRegularHours, setDirectWeeklyRegularHours] = useState('40');
  const [directWeeklyOvertimeHours, setDirectWeeklyOvertimeHours] = useState('0');
  const [directWeeklyNightHours, setDirectWeeklyNightHours] = useState('0');
  const [directAvgDailyHours, setDirectAvgDailyHours] = useState('8');

  const [payStubOpen, setPayStubOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('홍길동');
  const [employeeBirth, setEmployeeBirth] = useState('1990-01-01');
  const [paymentDate, setPaymentDate] = useState('매월 25일');
  const [paymentMonth, setPaymentMonth] = useState(`${year}-07`);
  const [companyName, setCompanyName] = useState('대박 사업장');

  const handleLoadInfo = (loaded) => {
    if (loaded.year) setYear(loaded.year);
    if (loaded.companySize) setCompanySize(loaded.companySize);
    if (loaded.salaryAmount) setGrossSalaryInput(loaded.salaryAmount);
    if (loaded.pattern1Days) setPattern1Days(loaded.pattern1Days);
    if (loaded.pattern1Start) setPattern1Start(loaded.pattern1Start);
    if (loaded.pattern1End) setPattern1End(loaded.pattern1End);
    if (loaded.pattern1BreakH) setPattern1BreakH(loaded.pattern1BreakH);
    if (loaded.pattern1BreakM) setPattern1BreakM(loaded.pattern1BreakM);
    if (loaded.pattern1NightBreakH) setPattern1NightBreakH(loaded.pattern1NightBreakH);
    if (loaded.pattern1NightBreakM) setPattern1NightBreakM(loaded.pattern1NightBreakM);
    
    if (loaded.pattern2Days !== undefined) setPattern2Days(loaded.pattern2Days);
    if (loaded.pattern2Start) setPattern2Start(loaded.pattern2Start);
    if (loaded.pattern2End) setPattern2End(loaded.pattern2End);
    if (loaded.pattern2BreakH) setPattern2BreakH(loaded.pattern2BreakH);
    if (loaded.pattern2BreakM) setPattern2BreakM(loaded.pattern2BreakM);
    if (loaded.pattern2NightBreakH) setPattern2NightBreakH(loaded.pattern2NightBreakH);
    if (loaded.pattern2NightBreakM) setPattern2NightBreakM(loaded.pattern2NightBreakM);
    
    if (loaded.pattern3Days !== undefined) setPattern3Days(loaded.pattern3Days);
    if (loaded.pattern3Start) setPattern3Start(loaded.pattern3Start);
    if (loaded.pattern3End) setPattern3End(loaded.pattern3End);
    if (loaded.pattern3BreakH) setPattern3BreakH(loaded.pattern3BreakH);
    if (loaded.pattern3BreakM) setPattern3BreakM(loaded.pattern3BreakM);
    if (loaded.pattern3NightBreakH) setPattern3NightBreakH(loaded.pattern3NightBreakH);
    if (loaded.pattern3NightBreakM) setPattern3NightBreakM(loaded.pattern3NightBreakM);

    // 요일별 스케줄 로드
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const setters = {
      mon: { active: setMonActive, start: setMonStart, end: setMonEnd, breakH: setMonBreakH, breakM: setMonBreakM, nightBreakH: setMonNightBreakH, nightBreakM: setMonNightBreakM },
      tue: { active: setTueActive, start: setTueStart, end: setTueEnd, breakH: setTueBreakH, breakM: setTueBreakM, nightBreakH: setTueNightBreakH, nightBreakM: setTueNightBreakM },
      wed: { active: setWedActive, start: setWedStart, end: setWedEnd, breakH: setWedBreakH, breakM: setWedBreakM, nightBreakH: setWedNightBreakH, nightBreakM: setWedNightBreakM },
      thu: { active: setThuActive, start: setThuStart, end: setThuEnd, breakH: setThuBreakH, breakM: setThuBreakM, nightBreakH: setThuNightBreakH, nightBreakM: setThuNightBreakM },
      fri: { active: setFriActive, start: setFriStart, end: setFriEnd, breakH: setFriBreakH, breakM: setFriBreakM, nightBreakH: setFriNightBreakH, nightBreakM: setFriNightBreakM },
      sat: { active: setSatActive, start: setSatStart, end: setSatEnd, breakH: setSatBreakH, breakM: setSatBreakM, nightBreakH: setSatNightBreakH, nightBreakM: setSatNightBreakM },
      sun: { active: setSunActive, start: setSunStart, end: setSunEnd, breakH: setSunBreakH, breakM: setSunBreakM, nightBreakH: setSunNightBreakH, nightBreakM: setSunNightBreakM }
    };
    days.forEach(d => {
      if (loaded[`${d}Active`] !== undefined) setters[d].active(loaded[`${d}Active`] === true || loaded[`${d}Active`] === 'true');
      if (loaded[`${d}Start`]) setters[d].start(loaded[`${d}Start`]);
      if (loaded[`${d}End`]) setters[d].end(loaded[`${d}End`]);
      if (loaded[`${d}BreakH`]) setters[d].breakH(loaded[`${d}BreakH`]);
      if (loaded[`${d}BreakM`]) setters[d].breakM(loaded[`${d}BreakM`]);
      if (loaded[`${d}NightBreakH`]) setters[d].nightBreakH(loaded[`${d}NightBreakH`]);
      if (loaded[`${d}NightBreakM`]) setters[d].nightBreakM(loaded[`${d}NightBreakM`]);
    });

    if (loaded.annualLeaveDays) setAnnualLeaveDays(loaded.annualLeaveDays);
    if (loaded.holidayWorkDays) setHolidayWorkDays(loaded.holidayWorkDays);
    if (loaded.pensionBasis) setPensionBasisInput(loaded.pensionBasis);
    if (loaded.extraWeeklyOvertime) setExtraWeeklyOvertimeInput(loaded.extraWeeklyOvertime);
    
    if (loaded.mealAllowance) setMealAllowanceInput(loaded.mealAllowance);
    if (loaded.carAllowance) setCarAllowanceInput(loaded.carAllowance);
    if (loaded.childcareAllowance) setChildcareAllowanceInput(loaded.childcareAllowance);
    if (loaded.otherNonTaxable) setOtherNonTaxableInput(loaded.otherNonTaxable);
    if (loaded.taxableAllowance) setTaxableAllowanceInput(loaded.taxableAllowance);

    if (loaded.scheduleType) setScheduleType(loaded.scheduleType);
    if (loaded.directWeeklyWorkDays) setDirectWeeklyWorkDays(loaded.directWeeklyWorkDays);
    if (loaded.directWeeklyRegularHours) setDirectWeeklyRegularHours(loaded.directWeeklyRegularHours);
    if (loaded.directWeeklyOvertimeHours) setDirectWeeklyOvertimeHours(loaded.directWeeklyOvertimeHours);
    if (loaded.directWeeklyNightHours) setDirectWeeklyNightHours(loaded.directWeeklyNightHours);
    if (loaded.directAvgDailyHours) setDirectAvgDailyHours(loaded.directAvgDailyHours);
    if (loaded.deductionType) setDeductionType(loaded.deductionType);
  };

  const currentInfo = {
    year,
    companySize,
    salaryType: '월급',
    salaryAmount: grossSalaryInput,
    pattern1Days,
    pattern1Start,
    pattern1End,
    pattern1BreakH,
    pattern1BreakM,
    pattern1NightBreakH,
    pattern1NightBreakM,
    pattern2Days,
    pattern2Start,
    pattern2End,
    pattern2BreakH,
    pattern2BreakM,
    pattern2NightBreakH,
    pattern2NightBreakM,
    pattern3Days,
    pattern3Start,
    pattern3End,
    pattern3BreakH,
    pattern3BreakM,
    pattern3NightBreakH,
    pattern3NightBreakM,
    
    // 요일별 설정 포함
    monActive, monStart, monEnd, monBreakH, monBreakM, monNightBreakH, monNightBreakM,
    tueActive, tueStart, tueEnd, tueBreakH, tueBreakM, tueNightBreakH, tueNightBreakM,
    wedActive, wedStart, wedEnd, wedBreakH, wedBreakM, wedNightBreakH, wedNightBreakM,
    thuActive, thuStart, thuEnd, thuBreakH, thuBreakM, thuNightBreakH, thuNightBreakM,
    friActive, friStart, friEnd, friBreakH, friBreakM, friNightBreakH, friNightBreakM,
    satActive, satStart, satEnd, satBreakH, satBreakM, satNightBreakH, satNightBreakM,
    sunActive, sunStart, sunEnd, sunBreakH, sunBreakM, sunNightBreakH, sunNightBreakM,

    annualLeaveDays,
    holidayWorkDays,
    pensionBasis: pensionBasisInput,
    extraWeeklyOvertime: extraWeeklyOvertimeInput,
    mealAllowance: mealAllowanceInput,
    carAllowance: carAllowanceInput,
    childcareAllowance: childcareAllowanceInput,
    otherNonTaxable: otherNonTaxableInput,
    taxableAllowance: taxableAllowanceInput,
    scheduleType,
    directWeeklyWorkDays,
    directWeeklyRegularHours,
    directWeeklyOvertimeHours,
    directWeeklyNightHours,
    directAvgDailyHours,
    deductionType
  };

  // 역산 계산 유틸

  const breakMinutesOf = (h, m) => (parseFloat(h) || 0) * 60 + (parseFloat(m) || 0);
  const nightBreakMinutesOf = (h, m) => (parseFloat(h) || 0) * 60 + (parseFloat(m) || 0);

  const p1BreakMinutes = breakMinutesOf(pattern1BreakH, pattern1BreakM);
  const p2BreakMinutes = breakMinutesOf(pattern2BreakH, pattern2BreakM);
  const p3BreakMinutes = breakMinutesOf(pattern3BreakH, pattern3BreakM);
  const p1NightBreakMinutes = nightBreakMinutesOf(pattern1NightBreakH, pattern1NightBreakM);
  const p2NightBreakMinutes = nightBreakMinutesOf(pattern2NightBreakH, pattern2NightBreakM);
  const p3NightBreakMinutes = nightBreakMinutesOf(pattern3NightBreakH, pattern3NightBreakM);

  const p1 = calculateHoursAndNightHours(pattern1Start, pattern1End, p1BreakMinutes, p1NightBreakMinutes);
  const p2 = calculateHoursAndNightHours(pattern2Start, pattern2End, p2BreakMinutes, p2NightBreakMinutes);
  const p3 = calculateHoursAndNightHours(pattern3Start, pattern3End, p3BreakMinutes, p3NightBreakMinutes);

  const holidayBreakHandlers = {
    onStartChange: (value) => {
      setHolidayStart(value);
      if (holidayBreakAuto) setHolidayBreakTime(String(getStatutoryBreakMinutes(calculateElapsedHours(value, holidayEnd))));
    },
    onEndChange: (value) => {
      setHolidayEnd(value);
      if (holidayBreakAuto) setHolidayBreakTime(String(getStatutoryBreakMinutes(calculateElapsedHours(holidayStart, value))));
    },
    onBreakTimeChange: (value) => { setHolidayBreakTime(value); setHolidayBreakAuto(false); }
  };
  const p1BreakHandlers = makeAutoBreakHandlers({ startVal: pattern1Start, endVal: pattern1End, setStart: setPattern1Start, setEnd: setPattern1End, setBreakH: setPattern1BreakH, setBreakM: setPattern1BreakM, breakAuto: pattern1BreakAuto, setBreakAuto: setPattern1BreakAuto });
  const p2BreakHandlers = makeAutoBreakHandlers({ startVal: pattern2Start, endVal: pattern2End, setStart: setPattern2Start, setEnd: setPattern2End, setBreakH: setPattern2BreakH, setBreakM: setPattern2BreakM, breakAuto: pattern2BreakAuto, setBreakAuto: setPattern2BreakAuto });
  const p3BreakHandlers = makeAutoBreakHandlers({ startVal: pattern3Start, endVal: pattern3End, setStart: setPattern3Start, setEnd: setPattern3End, setBreakH: setPattern3BreakH, setBreakM: setPattern3BreakM, breakAuto: pattern3BreakAuto, setBreakAuto: setPattern3BreakAuto });

  const pHoliday = calculateHoursAndNightHours(holidayStart, holidayEnd, parseFloat(holidayBreakTime) || 0);
  const holidayWorkHoursPerDay = pHoliday.workHours;
  const pensionBasis = parseFloat(pensionBasisInput) || 0;
  const extraWeeklyOvertime = parseFloat(extraWeeklyOvertimeInput) || 0;

  const isDirect = scheduleType === '직접입력';
  const isWeekly = scheduleType === '요일별';

  // 요일별 스케줄 정보 집계용 매핑 객체
  const daysState = {
    mon: { active: monActive, start: monStart, end: monEnd, breakH: monBreakH, breakM: monBreakM, nightBreakH: monNightBreakH, nightBreakM: monNightBreakM },
    tue: { active: tueActive, start: tueStart, end: tueEnd, breakH: tueBreakH, breakM: tueBreakM, nightBreakH: tueNightBreakH, nightBreakM: tueNightBreakM },
    wed: { active: wedActive, start: wedStart, end: wedEnd, breakH: wedBreakH, breakM: wedBreakM, nightBreakH: wedNightBreakH, nightBreakM: wedNightBreakM },
    thu: { active: thuActive, start: thuStart, end: thuEnd, breakH: thuBreakH, breakM: thuBreakM, nightBreakH: thuNightBreakH, nightBreakM: thuNightBreakM },
    fri: { active: friActive, start: friStart, end: friEnd, breakH: friBreakH, breakM: friBreakM, nightBreakH: friNightBreakH, nightBreakM: friNightBreakM },
    sat: { active: satActive, start: satStart, end: satEnd, breakH: satBreakH, breakM: satBreakM, nightBreakH: satNightBreakH, nightBreakM: satNightBreakM },
    sun: { active: sunActive, start: sunStart, end: sunEnd, breakH: sunBreakH, breakM: sunBreakM, nightBreakH: sunNightBreakH, nightBreakM: sunNightBreakM }
  };

  let weeklyHoursFromDays = 0;
  let weeklyNightHoursFromDays = 0;
  let totalWeeklyDaysFromDays = 0;
  let weeklyRegularHoursFromDays = 0;
  let dailyOvertimeFromDays = 0;

  if (isWeekly) {
    Object.keys(daysState).forEach(day => {
      const d = daysState[day];
      if (d.active === true || d.active === 'true') {
        const bMinutes = (parseFloat(d.breakH) || 0) * 60 + (parseFloat(d.breakM) || 0);
        const nbMinutes = (parseFloat(d.nightBreakH) || 0) * 60 + (parseFloat(d.nightBreakM) || 0);
        const calc = calculateHoursAndNightHours(d.start, d.end, bMinutes, nbMinutes);

        weeklyHoursFromDays += calc.workHours;
        weeklyNightHoursFromDays += calc.nightHours;
        totalWeeklyDaysFromDays += 1;

        const regularDaily = Math.min(calc.workHours, 8);
        weeklyRegularHoursFromDays += regularDaily;
        dailyOvertimeFromDays += Math.max(calc.workHours - 8, 0);
      }
    });
  }

  const p1D = parseFloat(pattern1Days) || 0;
  const p2D = parseFloat(pattern2Days) || 0;
  const p3D = parseFloat(pattern3Days) || 0;
  const totalWeeklyDays = isDirect ? (parseFloat(directWeeklyWorkDays) || 5) : (isWeekly ? totalWeeklyDaysFromDays : (p1D + p2D + p3D));

  const weeklyHours = isDirect ? (parseFloat(directWeeklyRegularHours) || 0) : (isWeekly ? weeklyHoursFromDays : ((p1.workHours * p1D) + (p2.workHours * p2D) + (p3.workHours * p3D)));
  const weeklyNightHours = isDirect ? (parseFloat(directWeeklyNightHours) || 0) : (isWeekly ? weeklyNightHoursFromDays : ((p1.nightHours * p1D) + (p2.nightHours * p2D) + (p3.nightHours * p3D)));

  // 소정근로시간 (주 최대 40시간)
  const regularWorkHoursForBasePay = Math.min(isWeekly ? weeklyRegularHoursFromDays : weeklyHours, 40);

  // 연장근로시간 계산
  const weeklyOvertimeHours = isDirect ? (parseFloat(directWeeklyOvertimeHours) || 0) : (isWeekly ? (() => {
    const weeklyOvertimeLimit = Math.max(weeklyRegularHoursFromDays - 40, 0);
    return dailyOvertimeFromDays + weeklyOvertimeLimit + extraWeeklyOvertime;
  })() : (() => {
    const p1RegularDaily = Math.min(p1.workHours, 8);
    const p2RegularDaily = Math.min(p2.workHours, 8);
    const p3RegularDaily = Math.min(p3.workHours, 8);
    const weeklyRegularHours = (p1D * p1RegularDaily) + (p2D * p2RegularDaily) + (p3D * p3RegularDaily);
    const p1DailyOvertime = Math.max(p1.workHours - 8, 0) * p1D;
    const p2DailyOvertime = Math.max(p2.workHours - 8, 0) * p2D;
    const p3DailyOvertime = Math.max(p3.workHours - 8, 0) * p3D;
    const dailyOvertime = p1DailyOvertime + p2DailyOvertime + p3DailyOvertime;
    const weeklyOvertimeLimit = Math.max(weeklyRegularHours - 40, 0);
    return dailyOvertime + weeklyOvertimeLimit + extraWeeklyOvertime;
  })());

  // 주휴수당 기준: 1주 15시간 이상 근무
  const hasWeeklyHoliday = weeklyHours >= 15;
  const weeklyHolidayHours = hasWeeklyHoliday ? (regularWorkHoursForBasePay / 40) * 8 : 0;

  // 5인 이상 여부
  const is5Over = companySize === '5인 이상';
  const overtimeMultiplier = is5Over ? 1.5 : 1.0;
  const nightMultiplier = is5Over ? 0.5 : 0.0;

  const AVG_WEEKS_PER_MONTH = 4.345;

  // 추가 수당 항목
  // 휴일근로수당: 하루 8시간 이내분은 50% 가산, 8시간 초과분은 100% 가산 (근로기준법 제56조 2항)
  const holDays = parseFloat(holidayWorkDays) || 0;
  const holHours = parseFloat(holidayWorkHoursPerDay) || 0;
  const monthlyHolidayWorkHours = (holDays * holHours) / 12;
  // 시급 1원을 대입해 가산율이 반영된 "유급환산시간"을 구함 (역산 분모 계산용)
  const weightedHolidayHoursPerDay = calculateHolidayDayPay(holHours, 1, is5Over);

  // 연차수당 산정 시 8시간 고정이 아닌, 입력한 근무 패턴 기준 평균 1일 소정근로시간을 사용
  const avgDailyHours = isDirect ? (parseFloat(directAvgDailyHours) || 8) : (isWeekly ? (totalWeeklyDaysFromDays > 0 ? Math.min(weeklyRegularHoursFromDays, 40) / totalWeeklyDaysFromDays : 8) : (totalWeeklyDays > 0 ? regularWorkHoursForBasePay / totalWeeklyDays : 8));


  // 4주 평균 주 15시간 미만 근로자는 근로기준법 제18조 3항에 따라 연차유급휴가(제60조) 적용 제외
  const annDays = parseFloat(annualLeaveDays) || 0;
  const monthlyLeaveHours = hasWeeklyHoliday ? (annDays * avgDailyHours) / 12 : 0;

  // 분모(Paid hours factor) 계산
  const weeklyPaidHours = regularWorkHoursForBasePay + weeklyHolidayHours + (weeklyOvertimeHours * overtimeMultiplier) + (weeklyNightHours * nightMultiplier);
  const monthlyPaidHoursFromWeekly = weeklyPaidHours * AVG_WEEKS_PER_MONTH;
  const monthlyPaidHoursFromHoliday = (holDays * weightedHolidayHoursPerDay) / 12;
  const monthlyPaidHoursFromLeave = monthlyLeaveHours;

  const totalPaidHoursDivisor = monthlyPaidHoursFromWeekly + monthlyPaidHoursFromHoliday + monthlyPaidHoursFromLeave;

  const grossSalary = parseFloat(grossSalaryInput) || 0;

  // 비과세 수당 (식대/자가운전보조금/육아수당/기타) - 총 세전 월급액 중 근로시간과 무관하게 별도 지급되는 금액이므로
  // 시급 역산 시에는 총액에서 제외하고, 최종 표시할 때 다시 더함
  const allowances = calculateNonTaxableBreakdown({
    mealAllowance: mealAllowanceInput,
    carAllowance: carAllowanceInput,
    childcareAllowance: childcareAllowanceInput,
    otherNonTaxable: otherNonTaxableInput
  });
  const taxableAllowance = parseFloat(taxableAllowanceInput) || 0;
  const workRelatedGross = Math.max(grossSalary - allowances.totalAllowance - taxableAllowance, 0);

  let calculatedHourlyWage = 0;
  if (totalPaidHoursDivisor > 0) {
    calculatedHourlyWage = workRelatedGross / totalPaidHoursDivisor;
  }

  const basePay = roundDownToTen(calculatedHourlyWage * regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH);
  const weeklyHolidayPay = roundDownToTen(calculatedHourlyWage * weeklyHolidayHours * AVG_WEEKS_PER_MONTH);
  const overtimePay = roundDownToTen(calculatedHourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
  const nightPay = roundDownToTen(calculatedHourlyWage * weeklyNightHours * nightMultiplier * AVG_WEEKS_PER_MONTH);
  const holidayDayPay = calculateHolidayDayPay(holHours, calculatedHourlyWage, is5Over);
  const holidayWorkPay = roundDownToTen((holDays * holidayDayPay) / 12);
  const annualLeavePay = roundDownToTen(calculatedHourlyWage * monthlyLeaveHours);

  // 세전 급여 합계 (차액 조정 반영)
  const computedGrossTotalWithoutAdjust = basePay + weeklyHolidayPay + overtimePay + nightPay + holidayWorkPay + annualLeavePay + allowances.totalAllowance + taxableAllowance;
  const adjustPay = computedGrossTotalWithoutAdjust - grossSalary;
  const computedGrossTotal = computedGrossTotalWithoutAdjust - adjustPay;

  // 공제 및 실수령액
  const defaultPensionBasis = pensionBasis > 0 ? pensionBasis : (basePay + weeklyHolidayPay);
  const daysVal = totalWeeklyDays * AVG_WEEKS_PER_MONTH || 20;
  const deductions = applyDeductions(grossSalary, year, defaultPensionBasis, allowances.totalNonTaxable, deductionType, daysVal);
  const rates = getDeductionRatesForYear(year);
  
  const dailyNetPay = roundDownToTen(deductions.netPay / daysVal);
  const weeklyNetPay = roundDownToTen(deductions.netPay / AVG_WEEKS_PER_MONTH);

  const minWage = getMinWageForYear(year);
  const displayedHourlyWage = roundDownToTen(calculatedHourlyWage);
  const isMinWageCompliant = displayedHourlyWage >= minWage;

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Coins size={26} color="#38bdf8" /> 역산 월급 계산기 (포괄임금 분할)</h1>
        <p className="tool-page-desc">
          지급받는 총 세전 월급과 실제 근무형태(출퇴근 시각, 주 근무일수, 휴게시간) 및 연차·휴일근로 일수를 입력하여 
          계약된 세전 급여 속에 숨겨진 **실제 기초시급**이 얼마인지 역산하고, 노동법 기준 최저임금 준수 여부 및 기본급·수당 세부 구성표를 자동으로 산출해 드립니다.
        </p>
      </div>

      <LaborInfoSync onLoad={handleLoadInfo} currentInfo={currentInfo} />

      <div className="main-container">

        <section className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 1.25rem 0', fontWeight: 'bold' }}>1. 근무 기준 및 급여 입력</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>계산 기준 연도</span>
              <select className="text-input" value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                <option value="2026">2026년 (최저시급 10,320원)</option>
                <option value="2025">2025년 (최저시급 10,030원)</option>
                <option value="2024">2024년 (최저시급 9,860원)</option>
                <option value="2023">2023년 (최저시급 9,620원)</option>
              </select>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>사업장 규모</span>
              <select className="text-input" value={companySize} onChange={(e) => setCompanySize(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                <option value="5인 이상">5인 이상 사업장 (수당 1.5배 가산)</option>
                <option value="5인 미만">5인 미만 사업장 (가산수당 없음)</option>
              </select>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>공제 구분</span>
              <select className="text-input" value={deductionType} onChange={(e) => setDeductionType(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                <option value="4대보험">4대보험 적용</option>
                <option value="3.3%">3.3% 프리랜서</option>
                <option value="일용직">일용직 (고용보험 0.9%)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ color: '#a5b4fc', fontWeight: 'bold' }}><Coins size={16} /> 총 세전 월급액 (원)</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="예: 2,500,000" 
              value={grossSalaryInput === '0' || !grossSalaryInput ? '' : Number(grossSalaryInput).toLocaleString()} 
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) {
                  setGrossSalaryInput(raw || '0');
                }
              }} 
              style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
              각종 수당(연장, 주휴 등)이 사전에 포함되어 합의된 월 정액 세전 급여를 입력하세요.
            </p>
          </div>

          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1.5rem' }}>
            <label className="form-label"><Clock size={16} color="#38bdf8" /> 근무 형태 선택</label>
            <div className="radio-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '1rem' }}>
              <div className={`radio-card ${scheduleType === '요일별' ? 'active' : ''}`} onClick={() => setScheduleType('요일별')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>요일별 상세 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>매일 다른 알바생 등</span>
              </div>
              <div className={`radio-card ${scheduleType === '패턴별' || !scheduleType ? 'active' : ''}`} onClick={() => setScheduleType('패턴별')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>고정 패턴별 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>주 5일 고정 직장인</span>
              </div>
              <div className={`radio-card ${scheduleType === '직접입력' ? 'active' : ''}`} onClick={() => setScheduleType('직접입력')} style={{ padding: '0.5rem 0.25rem' }}>
                <span className="radio-card-title" style={{ fontSize: '0.75rem' }}>교대제/스케줄 입력</span>
                <span className="radio-card-desc" style={{ fontSize: '0.6rem' }}>간호사, 유동 근무 등</span>
              </div>
            </div>

            {scheduleType === '요일별' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DayOfWeekEditor
                    monActive={monActive} setMonActive={setMonActive} monStart={monStart} setMonStart={setMonStart} monEnd={monEnd} setMonEnd={setMonEnd} monBreakH={monBreakH} setMonBreakH={setMonBreakH} monBreakM={monBreakM} setMonBreakM={setMonBreakM} monBreakAuto={monBreakAuto} setMonBreakAuto={setMonBreakAuto} monNightBreakH={monNightBreakH} setMonNightBreakH={setMonNightBreakH} monNightBreakM={monNightBreakM} setMonNightBreakM={setMonNightBreakM}
                    tueActive={tueActive} setTueActive={setTueActive} tueStart={tueStart} setTueStart={setTueStart} tueEnd={tueEnd} setTueEnd={setTueEnd} tueBreakH={tueBreakH} setTueBreakH={setTueBreakH} tueBreakM={tueBreakM} setTueBreakM={setTueBreakM} tueBreakAuto={tueBreakAuto} setTueBreakAuto={setTueBreakAuto} tueNightBreakH={tueNightBreakH} setTueNightBreakH={setTueNightBreakH} tueNightBreakM={tueNightBreakM} setTueNightBreakM={setTueNightBreakM}
                    wedActive={wedActive} setWedActive={setWedActive} wedStart={wedStart} setWedStart={setWedStart} wedEnd={wedEnd} setWedEnd={setWedEnd} wedBreakH={wedBreakH} setWedBreakH={setWedBreakH} wedBreakM={wedBreakM} setWedBreakM={setWedBreakM} wedBreakAuto={wedBreakAuto} setWedBreakAuto={setWedBreakAuto} wedNightBreakH={wedNightBreakH} setWedNightBreakH={setWedNightBreakH} wedNightBreakM={wedNightBreakM} setWedNightBreakM={setWedNightBreakM}
                    thuActive={thuActive} setThuActive={setThuActive} thuStart={thuStart} setThuStart={setThuStart} thuEnd={thuEnd} setThuEnd={setThuEnd} thuBreakH={thuBreakH} setThuBreakH={setThuBreakH} thuBreakM={thuBreakM} setThuBreakM={setThuBreakM} thuBreakAuto={thuBreakAuto} setThuBreakAuto={setThuBreakAuto} thuNightBreakH={thuNightBreakH} setThuNightBreakH={setThuNightBreakH} thuNightBreakM={thuNightBreakM} setThuNightBreakM={setThuNightBreakM}
                    friActive={friActive} setFriActive={setFriActive} friStart={friStart} setFriStart={setFriStart} friEnd={friEnd} setFriEnd={setFriEnd} friBreakH={friBreakH} setFriBreakH={setFriBreakH} friBreakM={friBreakM} setFriBreakM={setFriBreakM} friBreakAuto={friBreakAuto} setFriBreakAuto={setFriBreakAuto} friNightBreakH={friNightBreakH} setFriNightBreakH={setFriNightBreakH} friNightBreakM={friNightBreakM} setFriNightBreakM={setFriNightBreakM}
                    satActive={satActive} setSatActive={setSatActive} satStart={satStart} setSatStart={setSatStart} satEnd={satEnd} setSatEnd={setSatEnd} satBreakH={satBreakH} setSatBreakH={setSatBreakH} satBreakM={satBreakM} setSatBreakM={setSatBreakM} satBreakAuto={satBreakAuto} setSatBreakAuto={setSatBreakAuto} satNightBreakH={satNightBreakH} setSatNightBreakH={setSatNightBreakH} satNightBreakM={satNightBreakM} setSatNightBreakM={setSatNightBreakM}
                    sunActive={sunActive} setSunActive={setSunActive} sunStart={sunStart} setSunStart={setSunStart} sunEnd={sunEnd} setSunEnd={setSunEnd} sunBreakH={sunBreakH} setSunBreakH={setSunBreakH} sunBreakM={sunBreakM} setSunBreakM={setSunBreakM} sunBreakAuto={sunBreakAuto} setSunBreakAuto={setSunBreakAuto} sunNightBreakH={sunNightBreakH} setSunNightBreakH={setSunNightBreakH} sunNightBreakM={sunNightBreakM} setSunNightBreakM={setSunNightBreakM}
                  />
                </div>
                {totalWeeklyDays > 6 && (
                  <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                    요일별 근무일수 합계가 {totalWeeklyDays}일입니다. 주휴일을 위해 주 근무일수가 6일을 넘지 않도록 조정해 주세요.
                  </div>
                )}
              </>
            ) : scheduleType === '직접입력' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="info-callout" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#c7d2fe', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  <strong>💡 3교대 간호사, 격일제 경비원 등 유동 근무자 팁</strong><br/>
                  매주/매월 스케줄이 바뀌는 경우, 최근 1~3개월간의 실제 근무 대장을 합산한 뒤 <strong>총 근무시간 ÷ 4.345(한 달 평균 주 수)</strong> 하시면 주당 평균 근로시간을 손쉽게 도출하여 가장 정확한 진단을 받으실 수 있습니다.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 소정근로일수 (일/주)</span>
                    <input type="number" className="text-input" placeholder="예: 5" value={directWeeklyWorkDays} onChange={(e) => setDirectWeeklyWorkDays(e.target.value)} min="1" max="7" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>하루 평균 소정근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 8" value={directAvgDailyHours} onChange={(e) => setDirectAvgDailyHours(e.target.value)} min="1" max="24" />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 총 소정근로시간 (시간)</span>
                  <input type="number" className="text-input" placeholder="예: 40" value={directWeeklyRegularHours} onChange={(e) => setDirectWeeklyRegularHours(e.target.value)} min="0" />
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>* 주 최대 40시간까지만 기본급(주휴수당 포함) 산정에 반영됩니다. 초과분은 연장에 입력하세요.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 연장근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 5" value={directWeeklyOvertimeHours} onChange={(e) => setDirectWeeklyOvertimeHours(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 야간근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 4" value={directWeeklyNightHours} onChange={(e) => setDirectWeeklyNightHours(e.target.value)} min="0" />
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0 0' }}>
                  * 스케줄 근무표나 월 근무대장을 토대로 월 총 근무시간을 계산한 뒤, **월 근무시간 ÷ 4.345** 하여 구한 주 평균 근로시간을 입력하시면 보다 정확합니다.
                </p>
              </div>
            ) : (
              <>
                <label className="form-label" style={{ marginBottom: '0.75rem' }}><Clock size={16} color="#38bdf8" /> 상세 근무 패턴 설정</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <PatternInput 
                    label="근무 패턴 1" 
                    days={pattern1Days} onDaysChange={setPattern1Days}
                    start={pattern1Start} onStartChange={p1BreakHandlers.onStartChange}
                    end={pattern1End} onEndChange={p1BreakHandlers.onEndChange}
                    hours={p1.workHours}
                    breakH={pattern1BreakH} onBreakHChange={p1BreakHandlers.onBreakHChange}
                    breakM={pattern1BreakM} onBreakMChange={p1BreakHandlers.onBreakMChange}
                    breakMinutes={p1BreakMinutes} 
                    nightOverlapRaw={p1.nightOverlapRaw} nightHours={p1.nightHours} 
                    nightBreakH={pattern1NightBreakH} onNightBreakHChange={setPattern1NightBreakH} 
                    nightBreakM={pattern1NightBreakM} onNightBreakMChange={setPattern1NightBreakM} 
                  />
                  <PatternInput 
                    label="근무 패턴 2 (선택)" 
                    days={pattern2Days} onDaysChange={setPattern2Days}
                    start={pattern2Start} onStartChange={p2BreakHandlers.onStartChange}
                    end={pattern2End} onEndChange={p2BreakHandlers.onEndChange}
                    hours={p2.workHours}
                    breakH={pattern2BreakH} onBreakHChange={p2BreakHandlers.onBreakHChange}
                    breakM={pattern2BreakM} onBreakMChange={p2BreakHandlers.onBreakMChange}
                    breakMinutes={p2BreakMinutes} 
                    nightOverlapRaw={p2.nightOverlapRaw} nightHours={p2.nightHours} 
                    nightBreakH={pattern2NightBreakH} onNightBreakHChange={setPattern2NightBreakH} 
                    nightBreakM={pattern2NightBreakM} onNightBreakMChange={setPattern2NightBreakM} 
                  />
                  <PatternInput 
                    label="근무 패턴 3 (선택)" 
                    days={pattern3Days} onDaysChange={setPattern3Days}
                    start={pattern3Start} onStartChange={p3BreakHandlers.onStartChange}
                    end={pattern3End} onEndChange={p3BreakHandlers.onEndChange}
                    hours={p3.workHours}
                    breakH={pattern3BreakH} onBreakHChange={p3BreakHandlers.onBreakHChange}
                    breakM={pattern3BreakM} onBreakMChange={p3BreakHandlers.onBreakMChange}
                    breakMinutes={p3BreakMinutes} 
                    nightOverlapRaw={p3.nightOverlapRaw} nightHours={p3.nightHours} 
                    nightBreakH={pattern3NightBreakH} onNightBreakHChange={setPattern3NightBreakH} 
                    nightBreakM={pattern3NightBreakM} onNightBreakMChange={setPattern3NightBreakM} 
                  />
                </div>
                {totalWeeklyDays > 6 && (
                  <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                    패턴 1~3의 근무일수 합계가 {totalWeeklyDays}일입니다. 주휴일을 위해 주 근무일수가 6일을 넘지 않도록 조정해 주세요.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <label className="form-label"><CalendarClock size={16} /> 추가 근무 및 수당 변수 (포괄임금 포함분)</label>
            
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>주당 추가근무시간 (시간/주)</span>
              <input type="number" className="text-input" placeholder="예: 5 (기본 근무 패턴 외 매주 정기적인 추가 연장근로)" value={extraWeeklyOvertimeInput === '0' ? '' : extraWeeklyOvertimeInput} onChange={(e) => setExtraWeeklyOvertimeInput(e.target.value || '0')} min="0" />
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>패턴 1~3 외에 매주 고정적으로 근무에 포함되는 연장근로시간이 있다면 입력하세요.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>연간 휴일근로 일수 (일/년)</span>
                <input type="number" className="text-input" value={holidayWorkDays} onChange={(e) => setHolidayWorkDays(e.target.value)} min="0" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>하루 휴일휴게시간 (분)</span>
                <input type="number" className="text-input" value={holidayBreakTime} onChange={(e) => holidayBreakHandlers.onBreakTimeChange(e.target.value)} min="0" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>휴일 출근 시간</span>
                <TimeSelectInput value={holidayStart} onChange={holidayBreakHandlers.onStartChange} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>휴일 퇴근 시간</span>
                <TimeSelectInput value={holidayEnd} onChange={holidayBreakHandlers.onEndChange} />
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginBottom: '1.25rem', textAlign: 'right', fontWeight: '500' }}>
              하루 휴일근로시간: <strong style={{ color: '#f8fafc' }}>{holidayWorkHoursPerDay}시간</strong> (휴게 {holidayBreakTime}분 제외) · <span style={{ color: '#94a3b8' }}>월 평균 {(monthlyHolidayWorkHours).toFixed(2)}시간 반영 (1/12 분할)</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>연간 연차수당 지급 대상 일수 (일/년)</span>
              <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
              {hasWeeklyHoliday ? (
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                  연차휴가 미사용 수당이 월 급여에 정액 포괄로 합의되어 지급되는 경우, 반영할 연차 개수를 입력하세요. 근무 패턴 기준 평균 1일 소정근로시간({Math.round(avgDailyHours * 100) / 100}시간) 기준 12개월 분할 반영됩니다.
                </p>
              ) : (
                <p style={{ fontSize: '0.65rem', color: '#fbbf24', margin: '0.4rem 0 0 0' }}>
                  주 소정근로시간이 {Math.round(weeklyHours * 100) / 100}시간으로 15시간 미만이라 근로기준법 제18조 3항에 따라 연차유급휴가(제60조)가 적용되지 않아, 입력하셔도 연차수당은 0원으로 계산됩니다.
                </p>
              )}
            </div>
          </div>

          <div className="form-group" style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(52, 211, 153, 0.3)', marginTop: '1.25rem' }}>
            <label className="form-label" style={{ color: '#34d399' }}><Utensils size={16} /> 비과세 수당 (선택, 총 세전 월급액에 포함된 금액)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <NonTaxableAmountInput label="식대" value={mealAllowanceInput} onChange={setMealAllowanceInput} />
              <NonTaxableAmountInput label="자가운전보조금" value={carAllowanceInput} onChange={setCarAllowanceInput} />
              <NonTaxableAmountInput label="육아수당 (6세 이하)" value={childcareAllowanceInput} onChange={setChildcareAllowanceInput} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>기타 비과세</span>
                <input
                  type="text"
                  className="text-input"
                  value={otherNonTaxableInput === '0' || !otherNonTaxableInput ? '' : Number(otherNonTaxableInput).toLocaleString()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(raw)) setOtherNonTaxableInput(raw || '0');
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              위 총 세전 월급액에 이미 포함된 비과세 항목 금액을 입력하세요. 식대·자가운전보조금·육아수당은 각각 월 20만원까지 비과세이며, 시급 역산 시 근로시간 관련 금액에서 제외되고 세금·4대보험 산정 기준에서도 빠집니다.
            </p>
          </div>

          <div className="form-group" style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(248, 113, 113, 0.3)', marginTop: '1.25rem' }}>
            <label className="form-label" style={{ color: '#f87171' }}><Coins size={16} /> 과세 수당 (선택, 총 세전 월급액에 포함된 직책수당·상여금 등)</label>
            <input
              type="text"
              className="text-input"
              placeholder="0"
              value={taxableAllowanceInput === '0' || !taxableAllowanceInput ? '' : Number(taxableAllowanceInput).toLocaleString()}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) setTaxableAllowanceInput(raw || '0');
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
              위 총 세전 월급액에 이미 포함된 직책수당·상여금 등 과세 수당 금액을 입력하세요. 비과세와 달리 시급 역산 시 근로시간 관련 금액에서는 제외되지만, 세금·4대보험 산정 기준액에는 그대로 포함됩니다.
            </p>
          </div>
        </section>

        <section className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 1.25rem 0', fontWeight: 'bold' }}>2. 포괄임금 역산 분석 결과</h3>

          <div className="result-highlight" style={{ background: isMinWageCompliant ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderColor: isMinWageCompliant ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)', padding: '1.25rem', borderRadius: '12px' }}>
            <div className="result-highlight-label">역산된 실제 기초시급 ({deductionType})</div>
            <div className="result-highlight-value" style={{ color: isMinWageCompliant ? '#10b981' : '#f87171', fontSize: '2rem', fontWeight: '800' }}>
              {displayedHourlyWage.toLocaleString()}원
            </div>
            <div className="result-highlight-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              {isMinWageCompliant ? (
                <span className="compliance-badge pass">{year}년 법정 최저시급 ({minWage.toLocaleString()}원) 준수</span>
              ) : (
                <span className="compliance-badge danger">{year}년 법정 최저시급 ({minWage.toLocaleString()}원) 미달! 위반 소지 있음</span>
              )}
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
              border: `1px solid ${isMinWageCompliant ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.25)'}`,
              boxShadow: isMinWageCompliant ? 'none' : 'inset 0 0 10px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>총 근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                  {((regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH) + (weeklyOvertimeHours * AVG_WEEKS_PER_MONTH)).toFixed(1)}h
                </strong>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#38bdf8', display: 'block', marginBottom: '0.15rem' }}>기준근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                  {(((regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH) + (weeklyOvertimeHours * AVG_WEEKS_PER_MONTH)) <= 174 
                    ? ((regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH) + (weeklyOvertimeHours * AVG_WEEKS_PER_MONTH)) 
                    : 174).toFixed(1)}h
                </strong>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.35rem 0.2rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#a5b4fc', display: 'block', marginBottom: '0.15rem' }}>연장근로시간</span>
                <strong style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                  {(((regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH) + (weeklyOvertimeHours * AVG_WEEKS_PER_MONTH)) <= 174 
                    ? 0 
                    : (weeklyOvertimeHours * AVG_WEEKS_PER_MONTH)).toFixed(1)}h
                </strong>
              </div>
              <div style={{ 
                textAlign: 'center', 
                background: 'rgba(255,255,255,0.01)', 
                padding: '0.35rem 0.2rem', 
                borderRadius: '6px',
                border: !isMinWageCompliant ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none'
              }}>
                <span style={{ fontSize: '0.6rem', color: '#f472b6', display: 'block', marginBottom: '0.15rem' }}>
                  {!isMinWageCompliant && <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', marginRight: '3px', boxShadow: '0 0 6px #ef4444', animation: 'pulse 1s infinite' }} />}
                  야간근로시간
                </span>
                <strong style={{ fontSize: '0.85rem', color: '#f472b6' }}>
                  {(weeklyNightHours * AVG_WEEKS_PER_MONTH).toFixed(1)}h
                </strong>
              </div>
            </div>

            {/* 일급/주급/월급 세후 환산액 대조 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>하루 실수령 (일당)</span>
                <strong style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{dailyNetPay.toLocaleString()}원</strong>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>한 주 실수령 (주급)</span>
                <strong style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{weeklyNetPay.toLocaleString()}원</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>한 달 실수령 (월급)</span>
                <strong style={{ fontSize: '0.78rem', color: '#10b981' }}>{deductions.netPay.toLocaleString()}원</strong>
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
                <div><strong>{regularWorkHoursForBasePay.toFixed(1)}시간</strong></div>
                <div>{Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0', textAlign: 'center' }}>
                <div style={{ color: '#a5b4fc', fontWeight: '500' }}>연장근로시간</div>
                <div><strong>{weeklyOvertimeHours.toFixed(1)}시간</strong></div>
                <div>{Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0', textAlign: 'center' }}>
                <div style={{ color: '#f472b6', fontWeight: '500' }}>야간근로시간</div>
                <div><strong>{weeklyNightHours.toFixed(1)}시간</strong></div>
                <div>{Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.25rem', fontSize: '0.72rem', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.25rem', marginTop: '0.25rem', textAlign: 'center' }}>
                <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>총 실근로시간</div>
                <div><strong>{(regularWorkHoursForBasePay + weeklyOvertimeHours).toFixed(1)}시간</strong></div>
                <div>{Math.round((regularWorkHoursForBasePay + weeklyOvertimeHours) * AVG_WEEKS_PER_MONTH * 10) / 10}시간</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600, margin: '0 0 0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
              수당 구성 상세 분석 명세서 (세전 {grossSalary.toLocaleString()}원 기준)
            </h4>
            
            <div className="result-row">
              <span className="result-row-label">기본급 (월 소정근로 {Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간)</span>
              <span className="result-row-value">{basePay.toLocaleString()}원</span>
            </div>
            <div className="result-row">
              <span className="result-row-label">주휴수당 (월 주휴 {Math.round(weeklyHolidayHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간)</span>
              <span className="result-row-value">{weeklyHolidayPay.toLocaleString()}원</span>
            </div>
            {overtimePay > 0 && (
              <div className="result-row">
                <span className="result-row-label">연장근로수당 (월 연장 {Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간분 · {overtimeMultiplier}배 가산)</span>
                <span className="result-row-value">{overtimePay.toLocaleString()}원</span>
              </div>
            )}
            {nightPay > 0 && (
              <div className="result-row">
                <span className="result-row-label">야간근로수당 (월 야간 {Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간분 · {nightMultiplier}배 가산)</span>
                <span className="result-row-value">{nightPay.toLocaleString()}원</span>
              </div>
            )}
            {holidayWorkPay > 0 && (
              <div className="result-row">
                <span className="result-row-label">
                  휴일근로수당 (월 {Math.round(monthlyHolidayWorkHours * 100) / 100}시간분{is5Over ? (holHours > 8 ? ` · 8시간 이내 1.5배, 초과분 2.0배 가산` : ` · 1.5배 가산`) : ''})
                </span>
                <span className="result-row-value">{holidayWorkPay.toLocaleString()}원</span>
              </div>
            )}
            {annualLeavePay > 0 && (
              <div className="result-row">
                <span className="result-row-label">연차수당 (연간 {annDays}일 미사용 분할지급, 월 {Math.round(monthlyLeaveHours * 100) / 100}시간분)</span>
                <span className="result-row-value">{annualLeavePay.toLocaleString()}원</span>
              </div>
            )}

            <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '0.85rem', borderRadius: '10px', border: '1px dashed rgba(56, 189, 248, 0.25)', margin: '0.75rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                💰 {year}년 기초시급 {displayedHourlyWage.toLocaleString()}원 기준 항목별 시간당 단가
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>기본급 / 주휴수당 / 연차수당 (통상시급)</span>
                  <span style={{ color: '#cbd5e1' }}>{roundDownToTen(displayedHourlyWage).toLocaleString()}원/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>연장근로수당 ({overtimeMultiplier.toFixed(1)}배)</span>
                  <span style={{ color: '#cbd5e1' }}>{roundDownToTen(displayedHourlyWage * overtimeMultiplier).toLocaleString()}원/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>야간근로 가산액 ({nightMultiplier.toFixed(1)}배 가산분)</span>
                  <span style={{ color: '#cbd5e1' }}>{roundDownToTen(displayedHourlyWage * nightMultiplier).toLocaleString()}원/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>휴일근로수당 (8시간 이내, {(is5Over ? 1.5 : 1.0).toFixed(1)}배{is5Over ? ' · 초과분 2.0배' : ''})</span>
                  <span style={{ color: '#cbd5e1' }}>{roundDownToTen(displayedHourlyWage * (is5Over ? 1.5 : 1.0)).toLocaleString()}원/h</span>
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                야간근로는 연장·휴일근로와 중복 적용 시 각 가산율이 합산됩니다. 5인 미만 사업장은 연장·야간·휴일 가산이 적용되지 않습니다.
              </p>
            </div>

            {allowances.totalAllowance > 0 && (
              <div className="result-row">
                <span className="result-row-label" style={{ color: '#34d399' }}>비과세 수당 (식대·차량·육아·기타)</span>
                <span className="result-row-value" style={{ color: '#34d399' }}>{allowances.totalAllowance.toLocaleString()}원</span>
              </div>
            )}
            {taxableAllowance > 0 && (
              <div className="result-row">
                <span className="result-row-label" style={{ color: '#f87171' }}>과세 수당 (직책수당·상여금 등)</span>
                <span className="result-row-value" style={{ color: '#f87171' }}>{taxableAllowance.toLocaleString()}원</span>
              </div>
            )}
            {adjustPay !== 0 && (
              <div className="result-row">
                <span className="result-row-label" style={{ color: '#a5b4fc' }}>추가연장수당 (단수조정)</span>
                <span className="result-row-value" style={{ color: '#a5b4fc' }}>
                  {adjustPay > 0 ? `+${adjustPay.toLocaleString()}원` : `${adjustPay.toLocaleString()}원`}
                </span>
              </div>
            )}
            <div className="result-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
              <span className="result-row-label" style={{ color: '#38bdf8', fontWeight: 'bold' }}>계산된 세전 월급 합계</span>
              <span className="result-row-value" style={{ color: '#38bdf8', fontWeight: 'bold' }}>{computedGrossTotal.toLocaleString()}원</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
              * 역산 과정에서 단수 차이(10원 미만 원단위 절사 등)가 존재해 소폭의 오차가 날 수 있습니다.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600, margin: '0 0 0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
              {deductionType} 공제 및 월 예상 실수령액
            </h4>
            {deductions.taxableBase < grossSalary && (
              <p style={{ fontSize: '0.7rem', color: '#34d399', margin: '0 0 0.75rem 0' }}>
                비과세 {(grossSalary - deductions.taxableBase).toLocaleString()}원은 아래 건강보험·고용보험·소득세 산정 기준액에서 제외되었습니다.
              </p>
            )}

            {(deductionType === '4대보험' || !deductionType) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <div className="result-row" style={{ alignItems: 'center' }}>
                  <span className="result-row-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                    국민연금 ({(rates.pension * 100).toFixed(2)}%)
                    <input 
                      type="text" 
                      className="text-input" 
                      placeholder="기준소득월액 입력"
                      style={{ width: '120px', padding: '0.15rem 0.35rem', fontSize: '0.7rem', height: '22px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', marginLeft: '0.25rem', display: 'inline-block' }} 
                      value={pensionBasisInput === '0' ? '' : Number(pensionBasisInput).toLocaleString()} 
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        if (/^\d*$/.test(raw)) {
                          setPensionBasisInput(raw || '0');
                        }
                      }} 
                    />
                  </span>
                  <span className="result-row-value">-{deductions.nationalPension.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">건강보험 ({(rates.health * 100).toFixed(3)}%)</span>
                  <span className="result-row-value">-{deductions.healthInsurance.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">장기요양보험 (건강보험의 {(rates.care * 100).toFixed(2)}%)</span>
                  <span className="result-row-value">-{deductions.longTermCare.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">고용보험 ({(rates.employment * 100).toFixed(1)}%)</span>
                  <span className="result-row-value">-{deductions.employmentInsurance.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">근로소득세 (간이세액 추정치)</span>
                  <span className="result-row-value">-{deductions.incomeTax.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">지방소득세 (소득세의 10%)</span>
                  <span className="result-row-value">-{deductions.localIncomeTax.toLocaleString()}원</span>
                </div>
              </div>
            ) : deductionType === '3.3%' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <div className="result-row">
                  <span className="result-row-label">사업소득세 (3.0%)</span>
                  <span className="result-row-value">-{deductions.incomeTax.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">지방소득세 (0.3%)</span>
                  <span className="result-row-value">-{deductions.localIncomeTax.toLocaleString()}원</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <div className="result-row">
                  <span className="result-row-label">고용보험 ({(rates.employment * 100).toFixed(1)}%)</span>
                  <span className="result-row-value">-{deductions.employmentInsurance.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">일용소득세 (비과세 15만원 초과분 2.7%)</span>
                  <span className="result-row-value">-{deductions.incomeTax.toLocaleString()}원</span>
                </div>
                <div className="result-row">
                  <span className="result-row-label">지방소득세 (소득세의 10%)</span>
                  <span className="result-row-value">-{deductions.localIncomeTax.toLocaleString()}원</span>
                </div>
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: '0.2rem 0 0 0', lineHeight: '1.3' }}>
                  * 일 평균 소득이 150,000원 이하인 날은 과세되지 않으며, 하루 세액 1,000원 미만 시 소액부징수법에 의해 전액 면제됩니다.
                </p>
              </div>
            )}

            <div className="result-row" style={{ color: '#ef4444' }}>
              <span className="result-row-label">공제총액 합계</span>
              <span className="result-row-value">-{deductions.totalDeductions.toLocaleString()}원</span>
            </div>
            <div className="result-row" style={{ borderTop: '2px solid rgba(16, 185, 129, 0.3)', paddingTop: '0.9rem', marginTop: '0.5rem' }}>
              <span className="result-row-label" style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>월 예상 실수령액</span>
              <span className="result-row-value" style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                {deductions.netPay.toLocaleString()}원
              </span>
            </div>
          </div>

          {!isMinWageCompliant && (
            <div className="info-callout danger" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', padding: '0.4rem', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)' }}>
                <ShieldAlert size={20} color="#f87171" />
              </div>
              <div style={{ flex: 1, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong style={{ color: '#f87171', fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>주의: 최저임금 위반 소지!</strong>
                지급받으시는 세전 <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{grossSalary.toLocaleString()}원</span>은 현재 근무시간 대비 법정 시급 기준에 현저히 못 미칩니다.<br />
                기본 소정근로시간 및 추가 연장시간이 노동청 진정 또는 수당 반환 소송의 법적 쟁점이 될 수 있습니다. 상단의 <strong style={{ color: '#a5b4fc' }}>'권리구제(AI)'</strong> 리포트를 받아 증빙 자료를 확보하시는 것을 권장합니다.
              </div>
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
        </section>
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
                <input type="text" className="text-input" value={deductionType} disabled style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', opacity: 0.6 }} />
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
                    <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', fontSize: '0.75rem', color: '#fff' }}>{displayedHourlyWage.toLocaleString()}원</td>
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
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{basePay.toLocaleString()}원</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>주휴수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{weeklyHolidayPay.toLocaleString()}원</td>
                      </tr>
                      {overtimePay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>연장근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{overtimePay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {nightPay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>야간근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{nightPay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {holidayWorkPay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>휴일근로수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{holidayWorkPay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {annualLeavePay > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>연차수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{annualLeavePay.toLocaleString()}원</td>
                        </tr>
                      )}
                      {allowances.totalAllowance > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#34d399' }}>비과세 수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#34d399', textAlign: 'right' }}>{allowances.totalAllowance.toLocaleString()}원</td>
                        </tr>
                      )}
                      {taxableAllowance > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171' }}>과세 수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', textAlign: 'right' }}>{taxableAllowance.toLocaleString()}원</td>
                        </tr>
                      )}
                      {adjustPay !== 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#a5b4fc' }}>추가연장수당 (조정)</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#a5b4fc', textAlign: 'right' }}>{adjustPay > 0 ? `+${adjustPay.toLocaleString()}원` : `${adjustPay.toLocaleString()}원`}</td>
                        </tr>
                      )}
                      <tr style={{ background: 'rgba(56, 189, 248, 0.05)' }}>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>지급액 합계</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#38bdf8', textAlign: 'right', fontWeight: 'bold' }}>{computedGrossTotal.toLocaleString()}원</td>
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
                      {(deductionType === '4대보험' || !deductionType) ? (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>국민연금</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.nationalPension.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>건강보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.healthInsurance.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>장기요양보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.longTermCare.toLocaleString()}원</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>고용보험</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.employmentInsurance.toLocaleString()}원</td>
                          </tr>
                        </>
                      ) : deductionType === '3.3%' ? (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>사업소득세 (3.0%)</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.incomeTax.toLocaleString()}원</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>고용보험 (일용직)</td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.employmentInsurance.toLocaleString()}원</td>
                          </tr>
                          {deductions.incomeTax > 0 && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>일용근로소득세</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.incomeTax.toLocaleString()}원</td>
                            </tr>
                          )}
                        </>
                      )}
                      {deductions.incomeTax > 0 && deductionType !== '3.3%' && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>근로소득세</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.incomeTax.toLocaleString()}원</td>
                        </tr>
                      )}
                      {deductions.localIncomeTax > 0 && (
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#cbd5e1' }}>지방소득세</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#fff', textAlign: 'right' }}>{deductions.localIncomeTax.toLocaleString()}원</td>
                        </tr>
                      )}
                      <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold' }}>공제액 합계</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 8px', fontSize: '0.7rem', color: '#f87171', textAlign: 'right', fontWeight: 'bold' }}>{deductions.totalDeductions.toLocaleString()}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 차인 지급액 (실수령액) */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 'bold' }}>차인 지급액 (실수령액)</span>
                <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>{deductions.netPay.toLocaleString()}원</strong>
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
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>{Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × {displayedHourlyWage.toLocaleString()}원</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>주휴수당</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(weeklyHolidayHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간</td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                        {weeklyHolidayHours > 0 
                          ? `${Math.round(weeklyHolidayHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × ${displayedHourlyWage.toLocaleString()}원` 
                          : '미발생 (주 소정근로 15시간 미만)'}
                      </td>
                    </tr>
                    {overtimePay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>연장근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × {displayedHourlyWage.toLocaleString()}원 × {is5Over ? '1.5배' : '1.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {nightPay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>야간근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × {displayedHourlyWage.toLocaleString()}원 × {is5Over ? '0.5배' : '0.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {holidayWorkPay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>휴일근로수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(monthlyHolidayWorkHours * 100) / 100}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {Math.round(monthlyHolidayWorkHours * 100) / 100}시간 × {displayedHourlyWage.toLocaleString()}원 × {is5Over ? (holHours > 8 ? `8시간이내 1.5배, 초과 2.0배` : `1.5배`) : '1.0배'} (가산)
                        </td>
                      </tr>
                    )}
                    {annualLeavePay > 0 && (
                      <tr>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#cbd5e1', fontWeight: 600 }}>연차수당</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff', textAlign: 'center' }}>{Math.round(monthlyLeaveHours * 100) / 100}시간</td>
                        <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '5px 8px', color: '#fff' }}>
                          {Math.round(monthlyLeaveHours * 100) / 100}시간 × {displayedHourlyWage.toLocaleString()}원 (선지급 분할)
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

■ 지급 내역
- 기본급: ${basePay.toLocaleString()}원 (${Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간)
- 주휴수당: ${weeklyHolidayPay.toLocaleString()}원 (${Math.round(weeklyHolidayHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간)
${overtimePay > 0 ? `- 연장근로수당: ${overtimePay.toLocaleString()}원 (${Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간)\n` : ''}${nightPay > 0 ? `- 야간근로수당: ${nightPay.toLocaleString()}원 (${Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간)\n` : ''}${holidayWorkPay > 0 ? `- 휴일근로수당: ${holidayWorkPay.toLocaleString()}원 (${Math.round(monthlyHolidayWorkHours * 100) / 100}시간)\n` : ''}${annualLeavePay > 0 ? `- 연차수당: ${annualLeavePay.toLocaleString()}원 (${Math.round(monthlyLeaveHours * 100) / 100}시간)\n` : ''}${adjustPay !== 0 ? `- 추가연장수당(조정): ${adjustPay.toLocaleString()}원\n` : ''}- 지급액 합계: ${computedGrossTotal.toLocaleString()}원

■ 공제 내역
${deductionType === '4대보험' || !deductionType ? `- 국민연금: ${deductions.nationalPension.toLocaleString()}원
- 건강보험: ${deductions.healthInsurance.toLocaleString()}원
- 장기요양보험: ${deductions.longTermCare.toLocaleString()}원
- 고용보험: ${deductions.employmentInsurance.toLocaleString()}원` : deductionType === '3.3%' ? `- 사업소득세(3.3%): ${(deductions.incomeTax + deductions.localIncomeTax).toLocaleString()}원` : `- 고용보험: ${deductions.employmentInsurance.toLocaleString()}원
- 일용소득세: ${deductions.incomeTax.toLocaleString()}원`}${deductions.incomeTax > 0 && deductionType !== '3.3%' ? `\n- 소득세: ${deductions.incomeTax.toLocaleString()}원\n- 지방소득세: ${deductions.localIncomeTax.toLocaleString()}원` : ''}
- 공제액 합계: ${deductions.totalDeductions.toLocaleString()}원

■ 실수령액 (차인 지급액)
★ 실수령액: ${deductions.netPay.toLocaleString()}원

■ 임금 계산 상세 명세 (시급: ${displayedHourlyWage.toLocaleString()}원)
- 기본급: ${Math.round(regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × 시급
- 주휴수당: ${Math.round(weeklyHolidayHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × 시급
${overtimePay > 0 ? `- 연장수당: ${Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × 시급 × ${is5Over ? '1.5' : '1.0'}\n` : ''}${nightPay > 0 ? `- 야간수당: ${Math.round(weeklyNightHours * AVG_WEEKS_PER_MONTH * 10) / 10}시간 × 시급 × ${is5Over ? '0.5' : '0.0'}\n` : ''}
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
    </div>
  );
}

export default ReverseSalaryCalculator;
