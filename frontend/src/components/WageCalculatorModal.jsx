import React, { useState, useEffect } from 'react';
import { Calculator, X, RefreshCw, CheckCircle, ShieldCheck, DollarSign, Clock, AlertCircle, Calendar, Sparkles, Sliders } from 'lucide-react';

const TIME_OPTIONS_24H = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m of ['00', '30']) {
      const hh = String(h).padStart(2, '0');
      options.push(`${hh}:${m}`);
    }
  }
  return options;
})();

const calculateNightHours = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  let startMin = sH * 60 + (sM || 0);
  let endMin = eH * 60 + (eM || 0);
  if (endMin <= startMin) endMin += 24 * 60;

  let nightMin = 0;
  for (let m = startMin; m < endMin; m++) {
    const clockM = m % (24 * 60);
    if (clockM >= 22 * 60 || clockM < 6 * 60) {
      nightMin++;
    }
  }
  return Math.round((nightMin / 60) * 10) / 10;
};

export default function WageCalculatorModal({ isOpen, onClose, calcData, onApplyChanges }) {
  if (!isOpen) return null;

  // 계산기 로컬 폼 상태
  const [hourlyRate, setHourlyRate] = useState(calcData?.hourlyRate || 10320);
  const [is5Over, setIs5Over] = useState(calcData?.is5Over ?? true);
  
  // 근무 형태 선택 ('fixed': 고정 근무, 'flexible': 요일별 변동 근무)
  const [workScheduleType, setWorkScheduleType] = useState('fixed');

  // 고정 근무용 state
  const [weeklyDays, setWeeklyDays] = useState(calcData?.weeklyDays || 5);
  const [dailyHours, setDailyHours] = useState(calcData?.dailyWorkHours || 8);
  const [breakHours, setBreakHours] = useState(calcData?.breakHours || 1);
  const [nightHoursWeekly, setNightHoursWeekly] = useState(calcData?.weeklyNightHours || 0);

  // 요일별 변동 근무용 state & 일괄 적용용 state
  const [batchDays, setBatchDays] = useState(['월', '화', '수', '목', '금']);
  const [batchStart, setBatchStart] = useState('09:00');
  const [batchEnd, setBatchEnd] = useState('18:00');
  const [batchBreak, setBatchBreak] = useState('1.0');

  const [daySchedules, setDaySchedules] = useState({
    월: { active: true, start: '09:00', end: '18:00', breakTime: '1.0', nightBreak: '0.0' },
    화: { active: true, start: '09:00', end: '18:00', breakTime: '1.0', nightBreak: '0.0' },
    수: { active: true, start: '09:00', end: '18:00', breakTime: '1.0', nightBreak: '0.0' },
    목: { active: true, start: '09:00', end: '18:00', breakTime: '1.0', nightBreak: '0.0' },
    금: { active: true, start: '09:00', end: '18:00', breakTime: '1.0', nightBreak: '0.0' },
    토: { active: false, start: '09:00', end: '15:00', breakTime: '0.5', nightBreak: '0.0' },
    일: { active: false, start: '09:00', end: '15:00', breakTime: '0.5', nightBreak: '0.0' },
  });

  // 공휴일 근무일수 state
  const [holidayDaysYear, setHolidayDaysYear] = useState(calcData?.holidayDaysYear || 0);

  // 식대 비과세
  const [includeMeal, setIncludeMeal] = useState(calcData?.mealPay > 0);

  // 연차 정밀 설정 (전체 연차일수 vs 실사용 연차일수)
  const [includeAnnualLeave, setIncludeAnnualLeave] = useState(calcData?.annualLeaveMonthlyPay !== undefined ? calcData?.annualLeaveMonthlyPay > 0 : true);
  const [totalAnnualLeaveDays, setTotalAnnualLeaveDays] = useState(calcData?.totalAnnualLeaveDays || 26);
  const [usedAnnualLeaveDays, setUsedAnnualLeaveDays] = useState(calcData?.usedAnnualLeaveDays || 2);

  // ⚙️ [기본 세팅] 엑셀/계약서 표준 포괄 서식 산식 (연장 12.74h, 야간 13.04h, 휴일 20.0h, 연차 16.0h) 기본 적용
  const [isCustomOverride, setIsCustomOverride] = useState(calcData?.isCustomOverride !== undefined ? calcData?.isCustomOverride : true);
  const [overrideOvertimeHours, setOverrideOvertimeHours] = useState(calcData?.overtimeHours || 12.74);
  const [overrideNightHours, setOverrideNightHours] = useState(calcData?.nightHours || 13.04);
  const [overrideHolidayHours, setOverrideHolidayHours] = useState(calcData?.holidayHours || 20.0);
  const [overrideOvertimeRate, setOverrideOvertimeRate] = useState(1.0); // 엑셀 포괄 가산비율 (1.0배)

  // 🎯 [사업주 목표 약정 월급 0원 오차 정액 세팅]
  const [useTargetGross, setUseTargetGross] = useState(calcData?.useTargetGross !== undefined ? calcData.useTargetGross : true);
  const [targetGrossSalary, setTargetGrossSalary] = useState(calcData?.totalGrossSalary || 2800000);

  // 일괄 적용 클릭 이벤트
  const handleApplyBatch = () => {
    setDaySchedules(prev => {
      const next = { ...prev };
      ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
        if (batchDays.includes(day)) {
          next[day] = {
            ...next[day],
            active: true,
            start: batchStart,
            end: batchEnd,
            breakTime: batchBreak
          };
        } else {
          next[day] = {
            ...next[day],
            active: false
          };
        }
      });
      return next;
    });
  };

  // 실시간 급여 및 수당 계산 함수
  const computeSalary = () => {
    let computedDailyNetWork = 8;
    let computedWeeklyRegularHours = 40;
    let computedMonthlyOvertime = 0;
    let computedMonthlyNightHours = 0;
    let computedActiveDaysCount = 5;

    if (workScheduleType === 'fixed') {
      computedDailyNetWork = Math.max(0, dailyHours);
      const dailyOver = Math.max(0, computedDailyNetWork - 8);
      
      const weeklyRegular = Math.min(computedDailyNetWork, 8) * weeklyDays;
      const weeklyOvertimeRaw = (dailyOver * weeklyDays) + Math.max(0, (computedDailyNetWork * weeklyDays) - 40);
      
      computedWeeklyRegularHours = weeklyRegular;
      computedMonthlyOvertime = Math.round(weeklyOvertimeRaw * 4.35 * 100) / 100;
      computedMonthlyNightHours = Math.round(nightHoursWeekly * 4.35 * 100) / 100;
      computedActiveDaysCount = weeklyDays;
    } else {
      // 요일별 변동 근무 계산
      let activeCount = 0;
      let totalWeeklyWork = 0;
      let totalDailyOvertime = 0;
      let totalNightSum = 0;

      Object.keys(daySchedules).forEach(day => {
        const sched = daySchedules[day];
        if (sched.active) {
          activeCount++;
          const [sH, sM] = sched.start.split(':').map(Number);
          const [eH, eM] = sched.end.split(':').map(Number);
          let sMin = sH * 60 + (sM || 0);
          let eMin = eH * 60 + (eM || 0);
          if (eMin <= sMin) eMin += 24 * 60;

          const dayElapsed = (eMin - sMin) / 60;
          const dayBreak = parseFloat(sched.breakTime) || 0;
          const dayRealWork = Math.max(0, dayElapsed - dayBreak);

          totalWeeklyWork += dayRealWork;
          totalDailyOvertime += Math.max(0, dayRealWork - 8);

          const dayRawNight = calculateNightHours(sched.start, sched.end);
          const dayNetNight = Math.max(0, dayRawNight - (parseFloat(sched.nightBreak) || 0));
          totalNightSum += dayNetNight;
        }
      });

      computedActiveDaysCount = activeCount;
      computedDailyNetWork = activeCount > 0 ? (totalWeeklyWork / activeCount) : 0;
      computedWeeklyRegularHours = Math.min(totalWeeklyWork, 40);

      const weeklyOverFrom40 = Math.max(0, totalWeeklyWork - 40);
      const weeklyOvertimeTotal = Math.max(totalDailyOvertime, weeklyOverFrom40);

      computedMonthlyOvertime = Math.round(weeklyOvertimeTotal * 4.35 * 100) / 100;
      computedMonthlyNightHours = Math.round(totalNightSum * 4.35 * 100) / 100;
    }

    // 💡 수치 직접 지정/수정 모드가 켜진 경우, 사용자가 입력한 시간 수치(엑셀 수치)를 그대로 적용!
    const finalMonthlyOvertime = isCustomOverride ? overrideOvertimeHours : computedMonthlyOvertime;
    const finalMonthlyNightHours = isCustomOverride ? overrideNightHours : computedMonthlyNightHours;

    const overtimeMult = isCustomOverride ? overrideOvertimeRate : (is5Over ? 1.5 : 1.0);
    const monthlyOvertimePay = Math.round((finalMonthlyOvertime * hourlyRate * overtimeMult) / 10) * 10;

    // 기본급 (주 40시간 소정근로 기준 209시간 또는 소정근로 비례)
    const baseHoursMonthly = Math.round((computedWeeklyRegularHours + (computedWeeklyRegularHours >= 15 ? 8 : 0)) * 4.35);
    const fullBaseSalary = baseHoursMonthly * hourlyRate;

    // 비과세 식대 20만원 분할
    const mealPay = includeMeal ? 200000 : 0;
    const actualBasePay = includeMeal ? Math.max(0, fullBaseSalary - mealPay) : fullBaseSalary;

    // 야간근로수당
    const nightAllowanceMult = isCustomOverride ? 1.0 : (is5Over ? 0.5 : 0);
    const nightAllowance = Math.round((finalMonthlyNightHours * hourlyRate * nightAllowanceMult) / 10) * 10;

    // 공휴일/휴일근로 수당
    let holidayPayMonthly = 0;
    if (isCustomOverride) {
      holidayPayMonthly = Math.round((overrideHolidayHours * hourlyRate) / 10) * 10;
    } else {
      const singleHolidayPay = computedDailyNetWork * hourlyRate * (is5Over ? 1.5 : 1.0);
      holidayPayMonthly = Math.round((singleHolidayPay * holidayDaysYear) / 12 / 10) * 10;
    }

    // 연차수당 정밀 산정 (미사용 연차일수 = 전체 연차일수 - 실사용 연차일수)
    const unusedAnnualLeaveDays = Math.max(0, totalAnnualLeaveDays - usedAnnualLeaveDays);
    const annualLeaveMonthlyHours = Math.round((unusedAnnualLeaveDays / 12 * 8) * 100) / 100;
    const annualLeaveMonthlyPay = (includeAnnualLeave && is5Over)
      ? Math.round((hourlyRate * 8 * (unusedAnnualLeaveDays / 12)) / 10) * 10
      : 0;

    // 총 지급액 (세전) 및 약정 차액 추가연장수당 편입
    const subTotalGross = actualBasePay + monthlyOvertimePay + mealPay + nightAllowance + holidayPayMonthly + annualLeaveMonthlyPay;
    let extraOvertimeAllowance = 0;
    if (useTargetGross && targetGrossSalary > subTotalGross) {
      extraOvertimeAllowance = Math.round((targetGrossSalary - subTotalGross) / 10) * 10;
    }
    const totalGross = subTotalGross + extraOvertimeAllowance;

    // 4대보험 & 세금
    const taxableTotal = Math.max(0, totalGross - mealPay);
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
      monthlyOvertime: finalMonthlyOvertime,
      monthlyOvertimePay,
      monthlyNightHours: finalMonthlyNightHours,
      nightAllowance,
      holidayPayMonthly,
      unusedAnnualLeaveDays,
      annualLeaveMonthlyHours,
      annualLeaveMonthlyPay,
      mealPay,
      totalGross,
      totalDeductions,
      extraOvertimeAllowance,
      netPay,
      nationalPension,
      healthInsurance,
      longtermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      activeDaysCount: computedActiveDaysCount,
      dailyWorkHours: computedDailyNetWork
    };
  };

  const calculated = computeSalary();

  const handleApply = () => {
    if (onApplyChanges) {
      onApplyChanges({
        hourlyRate,
        is5Over,
        weeklyDays: calculated.activeDaysCount,
        dailyWorkHours: calculated.dailyWorkHours,
        breakHours,
        weeklyNightHours: calculated.monthlyNightHours / 4.35,
        holidayDaysYear,
        totalAnnualLeaveDays,
        usedAnnualLeaveDays,
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
        background: '#0f172a', color: '#f8fafc', width: '100%', maxWidth: '1000px',
        maxHeight: '94vh', overflowY: 'auto', borderRadius: '20px', padding: '1.5rem 1.75rem',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={22} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
              🧮 0% 오차 실시간 대화형 월급 계산기 (직접 수치 만지고 맞추기)
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          
          {/* 1) 좌측: 입력 컨트롤러 */}
          <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={16} /> 1. 근무 조건 및 수당 파라미터 조절
              </span>

              {/* ⚙️ 엑셀/계약서 맞춤 시간 수치 직접 수정 토글 버튼 */}
              <button
                type="button"
                onClick={() => setIsCustomOverride(!isCustomOverride)}
                style={{
                  padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                  background: isCustomOverride ? 'rgba(236, 72, 153, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                  color: isCustomOverride ? '#ec4899' : '#38bdf8',
                  border: `1px solid ${isCustomOverride ? '#ec4899' : '#38bdf8'}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <Sliders size={13} />
                {isCustomOverride ? '⚙️ 수치 직접입력 ON' : '⚙️ 시간수치 엑셀맞춤 입력'}
              </button>
            </div>

            {/* 시급 & 5인 이상 조건 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  통상 시급 (2026 최저 10,320원)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>원</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>사업장 규모</label>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => setIs5Over(true)}
                    style={{ flex: 1, padding: '0.35rem 0.2rem', borderRadius: '6px', background: is5Over ? '#0284c7' : '#0f172a', color: is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    5인 이상
                  </button>
                  <button
                    type="button"
                    onClick={() => setIs5Over(false)}
                    style={{ flex: 1, padding: '0.35rem 0.2rem', borderRadius: '6px', background: !is5Over ? '#0284c7' : '#0f172a', color: !is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    5인 미만
                  </button>
                </div>
              </div>
            </div>

            {/* 💡 [수치 직접 수정 모드 ON 시]: 엑셀 표 수치(연장 12.74h, 야간 13.04h, 휴일 20.0h)를 손으로 바로 넣는 특수 패널 */}
            {isCustomOverride ? (
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.4)', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={14} /> 🎯 [엑셀/계약서 서식 시간 수치 100% 직접 매칭 모드]
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#f472b6', marginBottom: '0.2rem', fontWeight: 700 }}>월 연장근로시간(h)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={overrideOvertimeHours}
                      onChange={(e) => setOverrideOvertimeHours(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.3rem', background: '#0f172a', border: '1px solid #ec4899', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#f472b6', marginBottom: '0.2rem', fontWeight: 700 }}>월 야간근로시간(h)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={overrideNightHours}
                      onChange={(e) => setOverrideNightHours(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.3rem', background: '#0f172a', border: '1px solid #ec4899', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#f472b6', marginBottom: '0.2rem', fontWeight: 700 }}>월 휴일근로시간(h)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={overrideHolidayHours}
                      onChange={(e) => setOverrideHolidayHours(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.3rem', background: '#0f172a', border: '1px solid #ec4899', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>엑셀 연장수당 가산비율:</span>
                  <button
                    type="button"
                    onClick={() => setOverrideOvertimeRate(1.0)}
                    style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: overrideOvertimeRate === 1.0 ? '#ec4899' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    1.0배 (엑셀 산식)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideOvertimeRate(1.5)}
                    style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: overrideOvertimeRate === 1.5 ? '#ec4899' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    1.5배 (법정 가산)
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 스케줄 계산 모드 */
              <>
                {/* 근무 형태 선택 탭 (고정 vs 변동) */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.3rem' }}>
                    근무시간 형태 선택 (고정 vs 변동)
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setWorkScheduleType('fixed')}
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: '6px',
                        background: workScheduleType === 'fixed' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#0f172a',
                        color: workScheduleType === 'fixed' ? '#ffffff' : '#64748b',
                        border: '1px solid #334155', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                      }}
                    >
                      📌 고정 근무 (주 N일/N시간)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkScheduleType('flexible')}
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: '6px',
                        background: workScheduleType === 'flexible' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : '#0f172a',
                        color: workScheduleType === 'flexible' ? '#ffffff' : '#64748b',
                        border: '1px solid #334155', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                      }}
                    >
                      🔀 요일별 변동 근무 (일괄/개별)
                    </button>
                  </div>
                </div>

                {/* A. 고정 근무 입력 모드 */}
                {workScheduleType === 'fixed' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>주당 근무일수</label>
                        <select
                          value={weeklyDays}
                          onChange={(e) => setWeeklyDays(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>주 {d}일 근무</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>하루 실근로시간</label>
                        <input
                          type="number"
                          step="0.5"
                          value={dailyHours}
                          onChange={(e) => setDailyHours(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>주당 야간(22~06h)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={nightHoursWeekly}
                          onChange={(e) => setNightHoursWeekly(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* B. 요일별 변동 근무 입력 모드 (일괄 적용 & 요일별 개별 시간 입력) */}
                {workScheduleType === 'flexible' && (
                  <div style={{ background: '#0f172a', padding: '0.65rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.4rem' }}>
                      ⚡ 일할 요일 선택 ➔ 일괄 적용 & 세부 변경
                    </div>

                    {/* 1) 요일 토글 버튼 */}
                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
                      {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                        const isChecked = batchDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const nextChecked = !isChecked;
                              setBatchDays(prev => isChecked ? prev.filter(d => d !== day) : [...prev, day]);
                              setDaySchedules(prev => ({
                                ...prev,
                                [day]: {
                                  ...prev[day],
                                  active: nextChecked,
                                  ...(nextChecked ? { start: batchStart, end: batchEnd, breakTime: batchBreak } : {})
                                }
                              }));
                            }}
                            style={{
                              flex: 1, padding: '0.25rem 0', borderRadius: '4px',
                              background: isChecked ? '#0284c7' : '#1e293b',
                              color: isChecked ? '#ffffff' : '#64748b',
                              border: `1px solid ${isChecked ? '#38bdf8' : '#334155'}`,
                              fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* 2) 출퇴근시각(24시간제) & 일괄 적용 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.3rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <select
                          value={batchStart}
                          onChange={(e) => setBatchStart(e.target.value)}
                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.74rem' }}
                        >
                          {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>~</span>
                        <select
                          value={batchEnd}
                          onChange={(e) => setBatchEnd(e.target.value)}
                          style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.74rem' }}
                        >
                          {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <select
                        value={batchBreak}
                        onChange={(e) => setBatchBreak(e.target.value)}
                        style={{ padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.72rem' }}
                      >
                        <option value="1.0">휴게 1h</option>
                        <option value="1.5">휴게 1.5h</option>
                        <option value="2.0">휴게 2h</option>
                        <option value="0.5">휴게 0.5h</option>
                        <option value="0.0">휴게 없음</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleApplyBatch}
                        style={{
                          padding: '0.3rem 0.5rem', borderRadius: '4px',
                          background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                          color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer'
                        }}
                      >
                        일괄적용
                      </button>
                    </div>

                    {/* 3) 요일별 개별 스케줄 리스트 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {['월', '화', '수', '목', '금', '토', '일'].map(day => {
                        const sched = daySchedules[day];
                        return (
                          <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const nextActive = !sched.active;
                                setDaySchedules(prev => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    active: nextActive,
                                    ...(nextActive ? { start: batchStart, end: batchEnd, breakTime: batchBreak } : {})
                                  }
                                }));
                                setBatchDays(prev => nextActive ? (prev.includes(day) ? prev : [...prev, day]) : prev.filter(d => d !== day));
                              }}
                              style={{
                                padding: '0.15rem 0.4rem', borderRadius: '3px',
                                background: sched.active ? '#0284c7' : '#334155', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer'
                              }}
                            >
                              {day} {sched.active ? '근무' : '휴무'}
                            </button>
                            {sched.active ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <select
                                  value={sched.start}
                                  onChange={(e) => setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                                  style={{ padding: '0.1rem 0.2rem', borderRadius: '3px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '0.7rem' }}
                                >
                                  {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <span>~</span>
                                <select
                                  value={sched.end}
                                  onChange={(e) => setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                                  style={{ padding: '0.1rem 0.2rem', borderRadius: '3px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '0.7rem' }}
                                >
                                  {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>휴무</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 연간 공휴일 근무일수 정밀 선택/입력 */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    연간 공휴일/대체공휴일 근무일수 선택 및 직접 입력
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <select
                      value={holidayDaysYear}
                      onChange={(e) => setHolidayDaysYear(Number(e.target.value))}
                      style={{ flex: 1, padding: '0.35rem 0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem' }}
                    >
                      <option value={0}>0일 (공휴일 전일 휴무)</option>
                      <option value={4}>연 4일 (명절만 나와서 일함)</option>
                      <option value={7}>연 7일 (주요 국경일 일함)</option>
                      <option value={10}>연 10일 근무</option>
                      <option value={12}>연 12일 근무</option>
                      <option value={15}>연 15일 전일 (모든 공휴일 일함)</option>
                      <option value={20}>연 20일 근무</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', width: '90px' }}>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={holidayDaysYear}
                        onChange={(e) => setHolidayDaysYear(Math.max(0, Number(e.target.value)))}
                        style={{ width: '100%', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>일</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 비과세 식대 및 연차 정밀 설정 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeMeal}
                  onChange={(e) => setIncludeMeal(e.target.checked)}
                />
                🍚 식대 20만원 비과세 기본급 분할 (절세 적용)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeAnnualLeave}
                  onChange={(e) => setIncludeAnnualLeave(e.target.checked)}
                />
                📅 미사용 연차수당 월 급여에 정산 포함
              </label>

              {/* 연차 정밀 세팅 (전체 연차일수 vs 실사용 연차일수) */}
              {includeAnnualLeave && (
                <div style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', marginTop: '0.2rem' }}>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={13} /> 연차 정밀 설정 (엑셀/규정 연차 일수 맞춤)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        전체 발생 연차일수
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={totalAnnualLeaveDays}
                        onChange={(e) => setTotalAnnualLeaveDays(Math.max(0, Number(e.target.value)))}
                        style={{ width: '100%', padding: '0.3rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        실제 사용 연차일수
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={usedAnnualLeaveDays}
                        onChange={(e) => setUsedAnnualLeaveDays(Math.max(0, Number(e.target.value)))}
                        style={{ width: '100%', padding: '0.3rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.4rem', fontWeight: 700 }}>
                    💡 미사용 정산 연차: {calculated.unusedAnnualLeaveDays}일분 ➔ 월 {calculated.annualLeaveMonthlyHours}시간 ({calculated.annualLeaveMonthlyPay.toLocaleString()}원) 정산 반영!
                  </div>
                </div>
              )}

              {/* 🎯 사업주 약정 목표 세전 월급 입력 & 추가연장수당 자동편입 패널 */}
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', marginBottom: '0.3rem' }}>
                  <input
                    type="checkbox"
                    checked={useTargetGross}
                    onChange={(e) => setUseTargetGross(e.target.checked)}
                  />
                  💼 사업주 약정 세전 월급 정액 세팅 (잔액 ➔ 추가연장수당 편입)
                </label>
                {useTargetGross && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>목표 세전 월급:</span>
                    <input
                      type="number"
                      step="10000"
                      value={targetGrossSalary}
                      onChange={(e) => setTargetGrossSalary(Number(e.target.value))}
                      style={{ flex: 1, padding: '0.3rem 0.5rem', background: '#0f172a', border: '1px solid #38bdf8', color: '#fff', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>원</span>
                  </div>
                )}
              </div>
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
                  <span>휴일근로/공휴일 수당</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.holidayPayMonthly.toLocaleString()} 원</span>
                </div>
                {includeAnnualLeave && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                    <span>연차수당 (미사용 {calculated.unusedAnnualLeaveDays}일분)</span>
                    <span style={{ fontWeight: 700, color: '#a78bfa' }}>{calculated.annualLeaveMonthlyPay.toLocaleString()} 원</span>
                  </div>
                )}
                {calculated.extraOvertimeAllowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.3rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>➕ 추가 연장 수당 (약정 잔액)</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.extraOvertimeAllowance.toLocaleString()} 원</span>
                  </div>
                )}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.3rem 0.5rem', borderRadius: '4px', marginTop: '0.2rem' }}>
                  <span>💡 국민연금 부과 대상 금액 (과세표준액)</span>
                  <span style={{ fontWeight: 700 }}>{(calculated.totalGross - calculated.mealPay).toLocaleString()} 원</span>
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
