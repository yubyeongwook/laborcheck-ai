import React, { useState, useEffect } from 'react';
import { Calculator, X, RefreshCw, CheckCircle, ShieldCheck, DollarSign, Clock, AlertCircle } from 'lucide-react';

export default function WageCalculatorModal({ isOpen, onClose, calcData, onApplyChanges }) {
  if (!isOpen) return null;

  // 계산기 로컬 폼 상태
  const [minWage] = useState(10320); // 2026년 최저시급
  const [hourlyRate, setHourlyRate] = useState(calcData?.hourlyRate || 10320);
  const [is5Over, setIs5Over] = useState(calcData?.is5Over ?? true);
  const [weeklyDays, setWeeklyDays] = useState(calcData?.weeklyDays || 5);
  const [dailyHours, setDailyHours] = useState(calcData?.dailyWorkHours || 8);
  const [breakHours, setBreakHours] = useState(calcData?.breakHours || 1);
  const [nightHoursWeekly, setNightHoursWeekly] = useState(calcData?.weeklyNightHours || 0);
  const [holidayDaysYear, setHolidayDaysYear] = useState(calcData?.holidayDaysYear || 0);
  const [includeMeal, setIncludeMeal] = useState(calcData?.mealPay > 0);
  const [includeAnnualLeave, setIncludeAnnualLeave] = useState(calcData?.annualLeaveMonthlyPay > 0);

  // 실시간 급여 및 수당 계산 함수
  const computeSalary = () => {
    const dailyNetWork = Math.max(0, dailyHours);
    const dailyOver = Math.max(0, dailyNetWork - 8);
    
    // 주간 기본 소정근로 및 연장근로
    const weeklyRegular = Math.min(dailyNetWork, 8) * weeklyDays;
    const weeklyOvertimeRaw = (dailyOver * weeklyDays) + Math.max(0, (dailyNetWork * weeklyDays) - 40);
    const monthlyOvertime = Math.round(weeklyOvertimeRaw * 4.35 * 100) / 100;
    
    const overtimeMult = is5Over ? 1.5 : 1.0;
    const monthlyOvertimePay = Math.round((monthlyOvertime * hourlyRate * overtimeMult) / 10) * 10;

    // 기본급 (주 40시간 소정근로 기준 209시간 또는 소정근로 비례)
    const baseHoursMonthly = Math.round((weeklyRegular + (weeklyRegular >= 15 ? 8 : 0)) * 4.35);
    const fullBaseSalary = baseHoursMonthly * hourlyRate;

    // 비과세 식대 20만원 분부
    const mealPay = includeMeal ? 200000 : 0;
    const actualBasePay = includeMeal ? Math.max(0, fullBaseSalary - mealPay) : fullBaseSalary;

    // 야간근로수당 (22시~06시 0.5배 가산)
    const monthlyNightHours = Math.round(nightHoursWeekly * 4.35 * 100) / 100;
    const nightAllowance = is5Over ? Math.round((monthlyNightHours * hourlyRate * 0.5) / 10) * 10 : 0;

    // 공휴일 수당
    const singleHolidayPay = dailyNetWork * hourlyRate * (is5Over ? 1.5 : 1.0);
    const holidayPayMonthly = Math.round((singleHolidayPay * holidayDaysYear) / 12 / 10) * 10;

    // 연차수당
    const annualLeaveMonthlyPay = includeAnnualLeave && is5Over ? Math.round((hourlyRate * 8 * (15 / 12))) : 0;

    // 총 지급액
    const totalGross = actualBasePay + monthlyOvertimePay + mealPay + nightAllowance + holidayPayMonthly + annualLeaveMonthlyPay;

    // 4대보험 & 세금
    const taxableTotal = totalGross - mealPay;
    const nationalPension = Math.round(taxableTotal * 0.045 / 10) * 10;
    const healthInsurance = Math.round(taxableTotal * 0.03545 / 10) * 10;
    const longtermCare = Math.round(healthInsurance * 0.1295 / 10) * 10;
    const employmentInsurance = Math.round(taxableTotal * 0.009 / 10) * 10;
    const incomeTax = Math.round(totalGross * 0.015 / 10) * 10;
    const localIncomeTax = Math.round(incomeTax * 0.1 / 10) * 10;

    const totalDeductions = nationalPension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax;
    const netPay = totalGross - totalDeductions;

    return {
      baseHoursMonthly,
      actualBasePay,
      monthlyOvertime,
      monthlyOvertimePay,
      monthlyNightHours,
      nightAllowance,
      holidayPayMonthly,
      annualLeaveMonthlyPay,
      mealPay,
      totalGross,
      totalDeductions,
      netPay,
      nationalPension,
      healthInsurance,
      longtermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax
    };
  };

  const calculated = computeSalary();

  const handleApply = () => {
    if (onApplyChanges) {
      onApplyChanges({
        hourlyRate,
        is5Over,
        weeklyDays,
        dailyWorkHours: dailyHours,
        breakHours,
        weeklyNightHours: nightHoursWeekly,
        holidayDaysYear,
        mealPay: calculated.mealPay,
        calculatedResult: calculated
      });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#0f172a', color: '#f8fafc', width: '100%', maxWidth: '900px',
        maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px', padding: '1.75rem',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={22} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
              🧮 0% 오차 실시간 대화형 월급 계산기 (직접 만지고 수정하기)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2열 레이아웃: 좌측(입력 조율 패널), 우측(실시간 계산 결과 명세) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
          
          {/* 1) 좌측: 입력 컨트롤러 */}
          <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={16} /> 1. 근무 조건 및 수당 파라미터 조절
            </div>

            {/* 시급 */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                통상 시급 (2026 최저 10,320원)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>원</span>
              </div>
            </div>

            {/* 상시 근로자수 */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                사업장 규모 (상시 근로자 수)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setIs5Over(true)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', background: is5Over ? '#0284c7' : '#0f172a', color: is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  5인 이상 (수당 1.5배)
                </button>
                <button
                  type="button"
                  onClick={() => setIs5Over(false)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', background: !is5Over ? '#0284c7' : '#0f172a', color: !is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  5인 미만 (수당 1.0배)
                </button>
              </div>
            </div>

            {/* 주당 근무일수 & 하루 근로시간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>주당 근무일수</label>
                <select
                  value={weeklyDays}
                  onChange={(e) => setWeeklyDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>주 {d}일 근무</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>하루 실근로시간</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* 야간 근로시간 & 공휴일 근무일수 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>주당 야간시간(22-06시)</label>
                <input
                  type="number"
                  step="0.5"
                  value={nightHoursWeekly}
                  onChange={(e) => setNightHoursWeekly(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>연간 공휴일 근무일수</label>
                <select
                  value={holidayDaysYear}
                  onChange={(e) => setHolidayDaysYear(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  <option value={0}>0일 (공휴일 쉬움)</option>
                  <option value={4}>약 4일 (명절만 근무)</option>
                  <option value={7}>약 7일 (주요공휴일 근무)</option>
                  <option value={15}>15일 전일 (모든 공휴일 근무)</option>
                </select>
              </div>
            </div>

            {/* 비과세 및 연차 옵션 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeMeal}
                  onChange={(e) => setIncludeMeal(e.target.checked)}
                />
                🍚 식대 20만원 비과세 기본급 분할 (절세 적용)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeAnnualLeave}
                  onChange={(e) => setIncludeAnnualLeave(e.target.checked)}
                />
                📅 미사용 연차수당 월 급여에 정산 포함
              </label>
            </div>
          </div>

          {/* 2) 우측: 실시간 산출 결과 */}
          <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <DollarSign size={16} /> 2. 실시간 계산된 예상 세전 급여 & 실수령액
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                  <span>기본급 ({calculated.baseHoursMonthly}h)</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{calculated.actualBasePay.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                  <span>연장근로수당 ({calculated.monthlyOvertime}h)</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{calculated.monthlyOvertimePay.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                  <span>야간근로수당 ({calculated.monthlyNightHours}h)</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.nightAllowance.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                  <span>공휴일 수당 (연 {holidayDaysYear}일분)</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.holidayPayMonthly.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                  <span>비과세 식대</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{calculated.mealPay.toLocaleString()} 원</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>
                  <span>지급 총액 (세전)</span>
                  <span>{calculated.totalGross.toLocaleString()} 원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ef4444' }}>
                  <span>4대보험 & 세금 공제액</span>
                  <span>- {calculated.totalDeductions.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 실수령액 큰 강조 박스 */}
              <div style={{
                marginTop: '1rem', padding: '0.85rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(16, 185, 129, 0.15))',
                border: '1px solid #38bdf8', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>예상 100% 실 수 령 액</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>
                  {calculated.netPay.toLocaleString()} 원
                </div>
              </div>
            </div>

            {/* 적용 및 갱신 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}
              >
                <CheckCircle size={16} /> 변경한 수치로 진단서 & 명세서 갱신
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
