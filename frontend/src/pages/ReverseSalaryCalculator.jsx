import React, { useState } from 'react';
import { Coins, Building2, Clock, CalendarClock, Sun, ShieldAlert, BadgeAlert, Utensils } from 'lucide-react';
import { calculateHoursAndNightHours, getMinWageForYear, applyDeductions, getDeductionRatesForYear, calculateNonTaxableBreakdown, NON_TAXABLE_MONTHLY_CAP } from '../utils/laborCalc.js';

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

function ReverseSalaryCalculator() {
  const [year, setYear] = useState(String(currentYear));
  const [companySize, setCompanySize] = useState('5인 이상');
  const [grossSalaryInput, setGrossSalaryInput] = useState('2500000');

  // 패턴 1, 2, 3 상태
  const [pattern1Days, setPattern1Days] = useState('5');
  const [pattern1Start, setPattern1Start] = useState('09:00');
  const [pattern1End, setPattern1End] = useState('18:00');
  const [pattern1BreakH, setPattern1BreakH] = useState('1');
  const [pattern1BreakM, setPattern1BreakM] = useState('0');
  const [pattern1NightBreakH, setPattern1NightBreakH] = useState('0');
  const [pattern1NightBreakM, setPattern1NightBreakM] = useState('0');

  const [pattern2Days, setPattern2Days] = useState('0');
  const [pattern2Start, setPattern2Start] = useState('09:00');
  const [pattern2End, setPattern2End] = useState('18:00');
  const [pattern2BreakH, setPattern2BreakH] = useState('1');
  const [pattern2BreakM, setPattern2BreakM] = useState('0');
  const [pattern2NightBreakH, setPattern2NightBreakH] = useState('0');
  const [pattern2NightBreakM, setPattern2NightBreakM] = useState('0');

  const [pattern3Days, setPattern3Days] = useState('0');
  const [pattern3Start, setPattern3Start] = useState('09:00');
  const [pattern3End, setPattern3End] = useState('18:00');
  const [pattern3BreakH, setPattern3BreakH] = useState('1');
  const [pattern3BreakM, setPattern3BreakM] = useState('0');
  const [pattern3NightBreakH, setPattern3NightBreakH] = useState('0');
  const [pattern3NightBreakM, setPattern3NightBreakM] = useState('0');

  // 추가 수당 항목
  const [holidayWorkDays, setHolidayWorkDays] = useState('0');
  const [holidayStart, setHolidayStart] = useState('09:00');
  const [holidayEnd, setHolidayEnd] = useState('18:00');
  const [holidayBreakTime, setHolidayBreakTime] = useState('60');
  const [annualLeaveDays, setAnnualLeaveDays] = useState('0');
  const [pensionBasisInput, setPensionBasisInput] = useState('0');
  const [extraWeeklyOvertimeInput, setExtraWeeklyOvertimeInput] = useState('0');
  const [mealAllowanceInput, setMealAllowanceInput] = useState('0');
  const [carAllowanceInput, setCarAllowanceInput] = useState('0');
  const [childcareAllowanceInput, setChildcareAllowanceInput] = useState('0');
  const [otherNonTaxableInput, setOtherNonTaxableInput] = useState('0');

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

  const pHoliday = calculateHoursAndNightHours(holidayStart, holidayEnd, parseFloat(holidayBreakTime) || 0);
  const holidayWorkHoursPerDay = pHoliday.workHours;
  const pensionBasis = parseFloat(pensionBasisInput) || 0;
  const extraWeeklyOvertime = parseFloat(extraWeeklyOvertimeInput) || 0;

  const p1D = parseFloat(pattern1Days) || 0;
  const p2D = parseFloat(pattern2Days) || 0;
  const p3D = parseFloat(pattern3Days) || 0;
  const totalWeeklyDays = p1D + p2D + p3D;

  const weeklyHours = (p1.workHours * p1D) + (p2.workHours * p2D) + (p3.workHours * p3D);
  const weeklyNightHours = (p1.nightHours * p1D) + (p2.nightHours * p2D) + (p3.nightHours * p3D);

  // 소정근로시간 (주 최대 40시간)
  const p1RegularDaily = Math.min(p1.workHours, 8);
  const p2RegularDaily = Math.min(p2.workHours, 8);
  const p3RegularDaily = Math.min(p3.workHours, 8);
  const weeklyRegularHours = (p1D * p1RegularDaily) + (p2D * p2RegularDaily) + (p3D * p3RegularDaily);
  const regularWorkHoursForBasePay = Math.min(weeklyRegularHours, 40);

  // 연장근로시간 계산
  const p1DailyOvertime = Math.max(p1.workHours - 8, 0) * p1D;
  const p2DailyOvertime = Math.max(p2.workHours - 8, 0) * p2D;
  const p3DailyOvertime = Math.max(p3.workHours - 8, 0) * p3D;
  const dailyOvertime = p1DailyOvertime + p2DailyOvertime + p3DailyOvertime;
  const weeklyOvertimeLimit = Math.max(weeklyRegularHours - 40, 0);
  const weeklyOvertimeHours = dailyOvertime + weeklyOvertimeLimit + extraWeeklyOvertime;

  // 주휴수당 기준: 1주 15시간 이상 근무
  const hasWeeklyHoliday = weeklyHours >= 15;
  const weeklyHolidayHours = hasWeeklyHoliday ? (regularWorkHoursForBasePay / 40) * 8 : 0;

  // 5인 이상 여부
  const is5Over = companySize === '5인 이상';
  const overtimeMultiplier = is5Over ? 1.5 : 1.0;
  const nightMultiplier = is5Over ? 0.5 : 0.0;
  const holidayMultiplier = is5Over ? 1.5 : 1.0;

  const AVG_WEEKS_PER_MONTH = 4.345;

  // 추가 수당 항목
  const holDays = parseFloat(holidayWorkDays) || 0;
  const holHours = parseFloat(holidayWorkHoursPerDay) || 0;
  const monthlyHolidayWorkHours = (holDays * holHours) / 12;

  const annDays = parseFloat(annualLeaveDays) || 0;
  const monthlyLeaveHours = (annDays * 8) / 12;

  // 분모(Paid hours factor) 계산
  const weeklyPaidHours = regularWorkHoursForBasePay + weeklyHolidayHours + (weeklyOvertimeHours * overtimeMultiplier) + (weeklyNightHours * nightMultiplier);
  const monthlyPaidHoursFromWeekly = weeklyPaidHours * AVG_WEEKS_PER_MONTH;
  const monthlyPaidHoursFromHoliday = monthlyHolidayWorkHours * holidayMultiplier;
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
  const workRelatedGross = Math.max(grossSalary - allowances.totalAllowance, 0);

  let calculatedHourlyWage = 0;
  if (totalPaidHoursDivisor > 0) {
    calculatedHourlyWage = workRelatedGross / totalPaidHoursDivisor;
  }

  const basePay = Math.round(calculatedHourlyWage * regularWorkHoursForBasePay * AVG_WEEKS_PER_MONTH);
  const weeklyHolidayPay = Math.round(calculatedHourlyWage * weeklyHolidayHours * AVG_WEEKS_PER_MONTH);
  const overtimePay = Math.round(calculatedHourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
  const nightPay = Math.round(calculatedHourlyWage * weeklyNightHours * nightMultiplier * AVG_WEEKS_PER_MONTH);
  const holidayWorkPay = Math.round(calculatedHourlyWage * monthlyHolidayWorkHours * holidayMultiplier);
  const annualLeavePay = Math.round(calculatedHourlyWage * monthlyLeaveHours);

  // 세전 급여 합계 (검증용, 단수 차이가 있을 수 있음)
  const computedGrossTotal = basePay + weeklyHolidayPay + overtimePay + nightPay + holidayWorkPay + annualLeavePay + allowances.totalAllowance;

  // 공제 및 실수령액
  const defaultPensionBasis = pensionBasis > 0 ? pensionBasis : (basePay + weeklyHolidayPay);
  const deductions = applyDeductions(grossSalary, year, defaultPensionBasis, allowances.totalNonTaxable);
  const rates = getDeductionRatesForYear(year);
  
  const minWage = getMinWageForYear(year);
  const isMinWageCompliant = calculatedHourlyWage >= minWage;

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Coins size={26} color="#38bdf8" /> 역산 월급 계산기 (포괄임금 분할)</h1>
        <p className="tool-page-desc">
          지급받는 총 세전 월급과 실제 근무형태(출퇴근 시각, 주 근무일수, 휴게시간) 및 연차·휴일근로 일수를 입력하여 
          계약된 세전 급여 속에 숨겨진 **실제 기초시급**이 얼마인지 역산하고, 노동법 기준 최저임금 준수 여부 및 기본급·수당 세부 구성표를 자동으로 산출해 드립니다.
        </p>
      </div>

      <div className="main-container">
        <section className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 1.25rem 0', fontWeight: 'bold' }}>1. 근무 기준 및 급여 입력</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
            <label className="form-label"><Clock size={16} color="#38bdf8" /> 상세 근무 패턴 설정</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <PatternInput 
                label="근무 패턴 1" 
                days={pattern1Days} onDaysChange={setPattern1Days} 
                start={pattern1Start} onStartChange={setPattern1Start} 
                end={pattern1End} onEndChange={setPattern1End} 
                hours={p1.workHours} 
                breakH={pattern1BreakH} onBreakHChange={setPattern1BreakH} 
                breakM={pattern1BreakM} onBreakMChange={setPattern1BreakM} 
                breakMinutes={p1BreakMinutes} 
                nightOverlapRaw={p1.nightOverlapRaw} nightHours={p1.nightHours} 
                nightBreakH={pattern1NightBreakH} onNightBreakHChange={setPattern1NightBreakH} 
                nightBreakM={pattern1NightBreakM} onNightBreakMChange={setPattern1NightBreakM} 
              />
              <PatternInput 
                label="근무 패턴 2 (선택)" 
                days={pattern2Days} onDaysChange={setPattern2Days} 
                start={pattern2Start} onStartChange={setPattern2Start} 
                end={pattern2End} onEndChange={setPattern2End} 
                hours={p2.workHours} 
                breakH={pattern2BreakH} onBreakHChange={setPattern2BreakH} 
                breakM={pattern2BreakM} onBreakMChange={setPattern2BreakM} 
                breakMinutes={p2BreakMinutes} 
                nightOverlapRaw={p2.nightOverlapRaw} nightHours={p2.nightHours} 
                nightBreakH={pattern2NightBreakH} onNightBreakHChange={setPattern2NightBreakH} 
                nightBreakM={pattern2NightBreakM} onNightBreakMChange={setPattern2NightBreakM} 
              />
              <PatternInput 
                label="근무 패턴 3 (선택)" 
                days={pattern3Days} onDaysChange={setPattern3Days} 
                start={pattern3Start} onStartChange={setPattern3Start} 
                end={pattern3End} onEndChange={setPattern3End} 
                hours={p3.workHours} 
                breakH={pattern3BreakH} onBreakHChange={setPattern3BreakH} 
                breakM={pattern3BreakM} onBreakMChange={setPattern3BreakM} 
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
                <input type="number" className="text-input" value={holidayBreakTime} onChange={(e) => setHolidayBreakTime(e.target.value)} min="0" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>휴일 출근 시간</span>
                <TimeSelectInput value={holidayStart} onChange={setHolidayStart} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>휴일 퇴근 시간</span>
                <TimeSelectInput value={holidayEnd} onChange={setHolidayEnd} />
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginBottom: '1.25rem', textAlign: 'right', fontWeight: '500' }}>
              하루 휴일근로시간: <strong style={{ color: '#f8fafc' }}>{holidayWorkHoursPerDay}시간</strong> (휴게 {holidayBreakTime}분 제외) · <span style={{ color: '#94a3b8' }}>월 평균 {(monthlyHolidayWorkHours).toFixed(2)}시간 반영 (1/12 분할)</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>연간 연차수당 지급 대상 일수 (일/년)</span>
              <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                연차휴가 미사용 수당이 월 급여에 정액 포괄로 합의되어 지급되는 경우, 반영할 연차 개수를 입력하세요 (12개월 분할 반영).
              </p>
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
        </section>

        <section className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 1.25rem 0', fontWeight: 'bold' }}>2. 포괄임금 역산 분석 결과</h3>

          <div className="result-highlight" style={{ background: isMinWageCompliant ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderColor: isMinWageCompliant ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)' }}>
            <div className="result-highlight-label">역산된 실제 기초시급</div>
            <div className="result-highlight-value" style={{ color: isMinWageCompliant ? '#10b981' : '#f87171' }}>
              {Math.round(calculatedHourlyWage).toLocaleString()}원
            </div>
            <div className="result-highlight-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
              {isMinWageCompliant ? (
                <span className="compliance-badge pass">{year}년 법정 최저시급 ({minWage.toLocaleString()}원) 준수</span>
              ) : (
                <span className="compliance-badge danger">{year}년 법정 최저시급 ({minWage.toLocaleString()}원) 미달! 위반 소지 있음</span>
              )}
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
                <span className="result-row-label">휴일근로수당 (월 {monthlyHolidayWorkHours}시간분 · {holidayMultiplier}배 가산)</span>
                <span className="result-row-value">{holidayWorkPay.toLocaleString()}원</span>
              </div>
            )}
            {annualLeavePay > 0 && (
              <div className="result-row">
                <span className="result-row-label">연차수당 (연간 {annDays}일 미사용 분할지급)</span>
                <span className="result-row-value">{annualLeavePay.toLocaleString()}원</span>
              </div>
            )}
            {allowances.totalAllowance > 0 && (
              <div className="result-row">
                <span className="result-row-label" style={{ color: '#34d399' }}>비과세 수당 (식대·차량·육아·기타)</span>
                <span className="result-row-value" style={{ color: '#34d399' }}>{allowances.totalAllowance.toLocaleString()}원</span>
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
              4대보험 공제 및 월 예상 실수령액
            </h4>
            {deductions.taxableBase < grossSalary && (
              <p style={{ fontSize: '0.7rem', color: '#34d399', margin: '0 0 0.75rem 0' }}>
                비과세 {(grossSalary - deductions.taxableBase).toLocaleString()}원은 아래 건강보험·고용보험·소득세 산정 기준액에서 제외되었습니다.
              </p>
            )}
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
            <div className="info-callout warning" style={{ marginTop: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderColor: '#f87171' }}>
              <BadgeAlert size={16} style={{ color: '#f87171', marginRight: '0.4rem', float: 'left', marginTop: '0.1rem' }} />
              <strong>주의: 최저임금 위반 소지!</strong><br />
              지급받으시는 세전 {grossSalary.toLocaleString()}원은 현재 근무시간 대비 법정 시급 기준에 현저히 못 미칩니다. 
              기본 소정근로시간 및 추가 연장시간이 노동청 진정 또는 수당 반환 소송의 법적 쟁점이 될 수 있습니다. 
              상단의 <strong>'권리구제(AI)'</strong> 리포트를 받아 증빙 자료를 확보하시는 것을 권장합니다.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ReverseSalaryCalculator;
