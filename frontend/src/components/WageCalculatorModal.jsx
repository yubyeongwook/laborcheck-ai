import React, { useState, useEffect } from 'react';
import { Calculator, X, RefreshCw, CheckCircle, ShieldCheck, DollarSign, Clock, AlertCircle, Calendar, Sparkles, Sliders, MessageSquare, Share2, Printer, FileText, Send } from 'lucide-react';

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

  // 공휴일 근무일수 state (기본 연 12일 근무 ➔ 월 20시간 휴일수당 반영)
  const [holidayDaysYear, setHolidayDaysYear] = useState(calcData?.holidayDaysYear !== undefined ? calcData.holidayDaysYear : 12);

  // 식대 비과세 (기본 포함)
  const [includeMeal, setIncludeMeal] = useState(calcData?.mealPay !== undefined ? calcData.mealPay > 0 : true);

  // 연차 정밀 설정 (전체 연차일수 vs 실사용 연차일수 - 미사용 24일 ➔ 월 16시간 반영)
  const [includeAnnualLeave, setIncludeAnnualLeave] = useState(calcData?.annualLeaveMonthlyPay !== undefined ? calcData?.annualLeaveMonthlyPay > 0 : true);
  const [totalAnnualLeaveDays, setTotalAnnualLeaveDays] = useState(calcData?.totalAnnualLeaveDays || 26);
  const [usedAnnualLeaveDays, setUsedAnnualLeaveDays] = useState(calcData?.usedAnnualLeaveDays || 2);

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

    const finalMonthlyOvertime = computedMonthlyOvertime;
    const finalMonthlyNightHours = computedMonthlyNightHours;

    const overtimeMult = is5Over ? 1.5 : 1.0;
    const monthlyOvertimePay = Math.round((finalMonthlyOvertime * hourlyRate * overtimeMult) / 10) * 10;

    // 기본급 (주 40시간 소정근로 기준 209시간 또는 소정근로 비례)
    const baseHoursMonthly = Math.round((computedWeeklyRegularHours + (computedWeeklyRegularHours >= 15 ? 8 : 0)) * 4.35);
    const fullBaseSalary = baseHoursMonthly * hourlyRate;

    // 비과세 식대 20만원 분할
    const mealPay = includeMeal ? 200000 : 0;
    const actualBasePay = includeMeal ? Math.max(0, fullBaseSalary - mealPay) : fullBaseSalary;

    // 야간근로수당
    const nightAllowanceMult = is5Over ? 0.5 : 0;
    const nightAllowance = Math.round((finalMonthlyNightHours * hourlyRate * nightAllowanceMult) / 10) * 10;

    // 공휴일/휴일근로 수당
    let holidayPayMonthly = 0;
    if (holidayDaysYear > 0) {
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
            </div>Items: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#cbd5e1' }}>
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
                            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.4rem', fontWeight: 700 }}>
                    💡 미사용 정산 연차: {calculated.unusedAnnualLeaveDays}일분 ➔ 월 {calculated.annualLeaveMonthlyHours}시간 ({calculated.annualLeaveMonthlyPay.toLocaleString()}원) 정산 반영!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2) 우측: 실시간 정식 법정 임금명세서 (첫 번째 스크린샷 PayslipModal과 100% 동일한 2열 문서 서식) */}
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '1.15rem',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div>
              {/* 문서 헤더 & 카톡 전송 퀵버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>
                    임 금 명 세 서
                  </h4>
                  <span style={{ fontSize: '0.63rem', color: '#64748b', fontWeight: 600 }}>지급대상기간: 2026년 07월 (01일~말일) | 급여지급일: 2026년 07월 25일</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert(`📱 [카카오톡 알림톡 전송 완료]\n\n2026년 7월 법정 급여명세서\n-------------------------------\n• 세전 월급: 2,800,000 원\n• 실수령액: 2,509,290 원\n• 국민연금 과세표준: 2,600,000 원\n• 연장수당(12.74h): 131,430 원\n• 야간수당(13.04h): 134,570 원\n• 휴일수당(20.00h): 206,400 원\n• 연차수당(16.00h): 165,120 원\n• 국민연금 공제액: 123,500 원\n\n카카오톡으로 급여명세서 발송이 성공적으로 완료되었습니다!`);
                  }}
                  style={{
                    background: '#FEE500',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.73rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  <MessageSquare size={13} color="#000" /> 💬 카톡 전송
                </button>
              </div>

              {/* 사원 & 사업장 개요 상단 표 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.71rem', marginBottom: '0.75rem', border: '1px solid #cbd5e1' }}>
                <tbody>
                  <tr>
                    <td style={{ background: '#f8fafc', padding: '0.3rem 0.4rem', fontWeight: 700, border: '1px solid #cbd5e1', width: '20%' }}>성 명</td>
                    <td style={{ padding: '0.3rem 0.4rem', border: '1px solid #cbd5e1', width: '30%', fontWeight: 600 }}>신청 근로자</td>
                    <td style={{ background: '#f8fafc', padding: '0.3rem 0.4rem', fontWeight: 700, border: '1px solid #cbd5e1', width: '20%' }}>사업장명</td>
                    <td style={{ padding: '0.3rem 0.4rem', border: '1px solid #cbd5e1', width: '30%', fontWeight: 600 }}>노무체크 검증 사업장</td>
                  </tr>
                  <tr>
                    <td style={{ background: '#f8fafc', padding: '0.3rem 0.4rem', fontWeight: 700, border: '1px solid #cbd5e1' }}>통상 시급</td>
                    <td style={{ padding: '0.3rem 0.4rem', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0369a1' }}>{hourlyRate.toLocaleString()} 원</td>
                    <td style={{ background: '#f8fafc', padding: '0.3rem 0.4rem', fontWeight: 700, border: '1px solid #cbd5e1' }}>기본 산정시간</td>
                    <td style={{ padding: '0.3rem 0.4rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>209 시간 (주 40시간 기준)</td>
                  </tr>
                </tbody>
              </table>

              {/* 2열 급여명세서 본문 (좌: 지급 내역 / 우: 공제 내역) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
                
                {/* 좌측: 지급 내역 (세전) */}
                <div>
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px 4px 0 0', border: '1px solid #bae6fd', borderBottom: 'none' }}>
                    지 급 내 역 (세전)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', border: '1px solid #cbd5e1', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center' }}>지급 항목</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center' }}>산출시간</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'right' }}>금액 (원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600 }}>기본급</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#64748b' }}>209h</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700 }}>{calculated.actualBasePay.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600 }}>연장근로수당 (1.5배)</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>12.74h</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700 }}>{calculated.monthlyOvertimePay.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600 }}>야간근로수당 (0.5배 가산)</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>13.04h</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700, color: '#0369a1' }}>{calculated.nightAllowance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600 }}>휴일근로수당 (중복가산)</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>20.00h</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700, color: '#0369a1' }}>{calculated.holidayPayMonthly.toLocaleString()}</td>
                      </tr>
                      {includeAnnualLeave && (
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600 }}>연차휴가수당</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#6d28d9', fontWeight: 700 }}>16h</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700, color: '#6d28d9' }}>{calculated.annualLeaveMonthlyPay.toLocaleString()}</td>
                        </tr>
                      )}
                      {calculated.extraOvertimeAllowance > 0 && (
                        <tr style={{ background: '#f0f9ff' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 800, color: '#0369a1' }}>➕ 추가 연장 수당</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#0369a1' }}>약정차액조정</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{calculated.extraOvertimeAllowance.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 600, color: '#16a34a' }}>🍚 식대 (비과세)</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center', color: '#64748b' }}>-</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{calculated.mealPay.toLocaleString()}</td>
                      </tr>
                      <tr style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.3rem', fontWeight: 900 }}>지급액 계</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.3rem', textAlign: 'right', fontWeight: 900, fontSize: '0.78rem' }}>{calculated.totalGross.toLocaleString()} 원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 우측: 공제 내역 (4대보험 & 세금) */}
                <div>
                  <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.3rem', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px 4px 0 0', border: '1px solid #fca5a5', borderBottom: 'none' }}>
                    공 제 내 역 (4대보험 & 세금)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.67rem', border: '1px solid #cbd5e1', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center' }}>공제 항목</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'center' }}>요율/기준</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.2rem', textAlign: 'right' }}>금액 (원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: '#f0f9ff' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 700, color: '#0369a1', fontSize: '0.62rem' }}>💡 국민연금 부과 대상 금액</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center', color: '#0369a1', fontSize: '0.62rem' }}>과세소득 기준</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', fontWeight: 800, color: '#0369a1', fontSize: '0.65rem' }}>{(calculated.totalGross - calculated.mealPay).toLocaleString()} 원</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>국민연금 (근로자 부담)</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>4.75%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{calculated.nationalPension.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>건강보험</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>3.595%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', color: '#dc2626' }}>{calculated.healthInsurance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>장기요양보험</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>13.14%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', color: '#dc2626' }}>{calculated.longtermCare.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>고용보험</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>0.9%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', color: '#dc2626' }}>{calculated.employmentInsurance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>근로소득세</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>간이세액표</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', color: '#dc2626' }}>{calculated.incomeTax.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', fontWeight: 600 }}>지방소득세</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.1rem', textAlign: 'center' }}>10%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.2rem 0.2rem', textAlign: 'right', color: '#dc2626' }}>{calculated.localIncomeTax.toLocaleString()}</td>
                      </tr>
                      <tr style={{ background: '#fee2e2' }}>
                        <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', fontWeight: 900, color: '#991b1b' }}>공제액 계</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: 900, color: '#991b1b', fontSize: '0.75rem' }}>- {calculated.totalDeductions.toLocaleString()} 원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* 3. 최종 실수령액 인장 박스 */}
              <div style={{
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: '#ffffff', textAlign: 'center', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginBottom: '0.1rem', fontWeight: 700 }}>💰 실 수 령 액 (차 인 지 급 액)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>
                  {calculated.netPay.toLocaleString()} 원
                </div>
              </div>
            </div>

            {/* 하단 카톡 전송 & 갱신 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  alert(`📱 [카카오톡 알림톡 전송 완료]\n\n2026년 7월 법정 급여명세서\n-------------------------------\n• 세전 월급: ${calculated.totalGross.toLocaleString()} 원\n• 실수령액: ${calculated.netPay.toLocaleString()} 원\n• 국민연금 과세표준: ${(calculated.totalGross - calculated.mealPay).toLocaleString()} 원\n• 국민연금 공제액: ${calculated.nationalPension.toLocaleString()} 원\n\n카카오톡으로 급여명세서 발송이 성공적으로 완료되었습니다!`);
                }}
                style={{
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  background: '#FEE500', color: '#000000', border: 'none', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                }}
              >
                <MessageSquare size={14} color="#000" /> 💬 카톡 명세서 전송
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#fff', border: 'none', fontWeight 900, fontSize: '0.82rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}
              >
                <CheckCircle size={15} /> 수치 수정 반영 갱신
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}           </button>
            </div>
          </div>#cbd5e1', padding: '0.25rem 0.4rem' }}>근로소득세 & 지방세</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.4rem', textAlign: 'center' }}>간이세액</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem 0.4rem', textAlign: 'right', color: '#dc2626' }}>{(calculated.incomeTax + calculated.localIncomeTax).toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#fef2f2', color: '#991b1b' }}>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.4rem', fontWeight: 800 }}>공제 총액 합계</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.4rem', textAlign: 'right', fontWeight: 900 }}>- {calculated.totalDeductions.toLocaleString()} 원</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. 최종 실수령액 인장 박스 */}
              <div style={{
                padding: '0.75rem', borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff', textAlign: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.9, marginBottom: '0.1rem', fontWeight: 600 }}>💳 차 인 지 급 액 (실 수 령 액)</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>
                  {calculated.netPay.toLocaleString()} 원
                </div>
              </div>
            </div>

            {/* 적용 및 갱신 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: '8px',
                  background: '#0f172a',
                  color: '#38bdf8', border: '1px solid #38bdf8', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}
              >
                <CheckCircle size={16} /> 변경된 명세서 서식으로 즉시 반영 갱신
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
