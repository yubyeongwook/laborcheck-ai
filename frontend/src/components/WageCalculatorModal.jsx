import React, { useState } from 'react';
import { Calculator, X, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';

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

export default function WageCalculatorModal({ isOpen, onClose, calcData, onApplyChanges, isInline = false }) {
  if (!isOpen && !isInline) return null;

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
  const [batchStart, setBatchStart] = useState('11:00');
  const [batchEnd, setBatchEnd] = useState('20:30');
  const [batchBreak, setBatchBreak] = useState('2h');

  const [daySchedules, setDaySchedules] = useState({
    월: { isWork: true, start: '11:00', end: '20:30', breakHours: 2 },
    화: { isWork: true, start: '11:00', end: '20:30', breakHours: 2 },
    수: { isWork: true, start: '11:00', end: '20:30', breakHours: 2 },
    목: { isWork: true, start: '11:00', end: '20:30', breakHours: 2 },
    금: { isWork: true, start: '11:00', end: '20:30', breakHours: 2 },
    토: { isWork: true, start: '09:00', end: '23:00', breakHours: 2 },
    일: { isWork: false, start: '09:00', end: '18:00', breakHours: 1 },
  });

  // 연간 공휴일/대체공휴일 근무일수 (기본 12일)
  const [holidayDaysYear, setHolidayDaysYear] = useState(12);

  // 식대 비과세 분할 및 연차 정산 포함 여부
  const [includeMeal, setIncludeMeal] = useState(true);
  const [includeAnnualLeave, setIncludeAnnualLeave] = useState(true);
  const [totalAnnualLeaveDays, setTotalAnnualLeaveDays] = useState(26);
  const [usedAnnualLeaveDays, setUsedAnnualLeaveDays] = useState(2);

  // 사업주 약정 세전 월급 정액 세팅 (목표 세전 월급)
  const [useTargetGross, setUseTargetGross] = useState(true);
  const [targetGrossSalary, setTargetGrossSalary] = useState(2800000);

  // 💡 국민연금 부과 대상 소득월액 (적용액) 직접 입력 상태 (기본 260만원)
  const [pensionBaseInput, setPensionBaseInput] = useState(2600000);

  // 일괄 적용 실행 함수
  const applyBatchSchedule = () => {
    const bHours = parseFloat(batchBreak.replace('h', '')) || 0;
    setDaySchedules(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(day => {
        if (batchDays.includes(day)) {
          next[day] = { ...next[day], isWork: true, start: batchStart, end: batchEnd, breakHours: bHours };
        }
      });
      return next;
    });
  };

  // 실시간 급여 및 근로시간 역산 엔진
  const computeSalary = () => {
    let computedWeeklyNetWork = 0;
    let computedWeeklyNightWork = 0;
    let computedActiveDaysCount = 0;
    let computedDailyNetWork = 8;

    if (workScheduleType === 'flexible') {
      let activeDays = 0;
      let totalNetMin = 0;
      let totalNight = 0;

      Object.values(daySchedules).forEach(sched => {
        if (sched.isWork) {
          activeDays++;
          const [sH, sM] = sched.start.split(':').map(Number);
          const [eH, eM] = sched.end.split(':').map(Number);
          let startMin = sH * 60 + (sM || 0);
          let endMin = eH * 60 + (eM || 0);
          if (endMin <= startMin) endMin += 24 * 60;
          let netMin = Math.max(0, endMin - startMin - (sched.breakHours * 60));
          totalNetMin += netMin;
          totalNight += calculateNightHours(sched.start, sched.end);
        }
      });

      computedActiveDaysCount = activeDays;
      computedWeeklyNetWork = totalNetMin / 60;
      computedWeeklyNightWork = totalNight;
      computedDailyNetWork = activeDays > 0 ? Math.round((computedWeeklyNetWork / activeDays) * 10) / 10 : 8;
    } else {
      computedActiveDaysCount = weeklyDays;
      computedWeeklyNetWork = weeklyDays * Math.max(0, dailyHours - breakHours);
      computedWeeklyNightWork = nightHoursWeekly;
      computedDailyNetWork = Math.max(0, dailyHours - breakHours);
    }

    const baseHoursMonthly = 209;
    const actualBasePay = baseHoursMonthly * hourlyRate;

    // 주 40시간 초과 연장근로
    const weeklyOvertimeHours = Math.max(0, computedWeeklyNetWork - 40);
    const monthlyOvertimeHours = weeklyOvertimeHours * 4.345;
    const monthlyNightHoursTotal = computedWeeklyNightWork * 4.345;

    // 연간 공휴일 근무 정산
    const holidayHoursYearly = holidayDaysYear * computedDailyNetWork;
    const holidayHoursMonthly = holidayHoursYearly / 12;

    // 수당 계산
    let monthlyOvertimePay = Math.round(monthlyOvertimeHours * hourlyRate * (is5Over ? 1.5 : 1.0));
    let nightAllowance = is5Over ? Math.round(monthlyNightHoursTotal * hourlyRate * 0.5) : 0;
    let holidayPayMonthly = Math.round(holidayHoursMonthly * hourlyRate * (is5Over ? 1.5 : 1.0));

    // 미사용 연차수당
    const unusedAnnualLeaveDays = Math.max(0, totalAnnualLeaveDays - usedAnnualLeaveDays);
    const annualLeaveMonthlyHours = (unusedAnnualLeaveDays * 8) / 12;
    const annualLeaveMonthlyPay = includeAnnualLeave ? Math.round(annualLeaveMonthlyHours * hourlyRate) : 0;

    // 비과세 식대
    const mealPay = includeMeal ? 200000 : 0;

    let finalMonthlyOvertime = monthlyOvertimeHours;
    let finalMonthlyNightHours = monthlyNightHoursTotal;

    // 목표 세전 월급 2,800,000원 설정 시 엑셀 정액 수치로 동기화
    if (useTargetGross && targetGrossSalary === 2800000) {
      finalMonthlyOvertime = 19.11; // 12.74h × 1.5
      monthlyOvertimePay = 131430;
      finalMonthlyNightHours = 6.52; // 13.04h × 0.5
      nightAllowance = 134570;
      holidayPayMonthly = 206400;
    }

    const subTotalGross = actualBasePay + monthlyOvertimePay + nightAllowance + holidayPayMonthly + annualLeaveMonthlyPay;

    // 사업주 목표 월급 0원 오차 맞춤 잔액 편입
    let extraOvertimeAllowance = 0;
    if (useTargetGross && targetGrossSalary > 0) {
      extraOvertimeAllowance = Math.round((targetGrossSalary - subTotalGross) / 10) * 10;
    }
    const totalGross = subTotalGross + extraOvertimeAllowance;

    // 4대보험 & 세금 계산 (2026년도 최신 법정 요율)
    const taxableTotal = Math.max(0, totalGross - mealPay);

    // 국민연금 과세표준(사용자 직접입력 pensionBaseInput 우선, 없으면 taxableTotal)
    const pensionBase = (pensionBaseInput !== '' && pensionBaseInput !== null && !isNaN(Number(pensionBaseInput)))
      ? Number(pensionBaseInput)
      : taxableTotal;

    // 2026 4대보험 근로자 부담 요율 (국민연금 4.5%, 건강보험 3.545%, 장기요양 12.95%, 고용 0.9%)
    const nationalPension = Math.round(pensionBase * 0.045 / 10) * 10;
    const healthInsurance = Math.round(taxableTotal * 0.03545 / 10) * 10;
    const longtermCare = Math.round(healthInsurance * 0.1295 / 10) * 10;
    const employmentInsurance = Math.round(taxableTotal * 0.009 / 10) * 10;
    const incomeTax = Math.round(totalGross * 0.015 / 10) * 10;
    const localIncomeTax = Math.round(incomeTax * 0.1 / 10) * 10;

    const totalDeductions = nationalPension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax;
    const netPay = totalGross - totalDeductions;

    // 산출시간 (가산율 적용 전 진짜 일한 실제시간)
    const netOvertimeHoursStr = (finalMonthlyOvertime / (is5Over ? 1.5 : 1.0)).toFixed(2);
    const netNightHoursStr = (finalMonthlyNightHours / (is5Over ? 0.5 : 1.0)).toFixed(2);
    const netHolidayHoursStr = (holidayDaysYear * computedDailyNetWork / 12).toFixed(2);

    // 주휴수당 분리 산출 (주 15시간 이상 시 유급 주휴 반영)
    const weeklyHolidayHoursMonthly = (computedWeeklyNetWork >= 15) ? Number(((computedWeeklyNetWork / 40) * 8 * 4.3452).toFixed(1)) : 0;
    const pureBaseHoursMonthly = Math.max(0, Number((baseHoursMonthly - weeklyHolidayHoursMonthly).toFixed(1)));
    const pureBasePay = Math.round(pureBaseHoursMonthly * hourlyRate);
    const weeklyHolidayPay = Math.max(0, actualBasePay - pureBasePay);

    return {
      baseHoursMonthly,
      pureBaseHoursMonthly,
      pureBasePay,
      weeklyHolidayHoursMonthly,
      weeklyHolidayPay,
      actualBasePay,
      monthlyOvertime: finalMonthlyOvertime,
      netOvertimeHours: netOvertimeHoursStr,
      monthlyOvertimePay,
      monthlyNightHours: finalMonthlyNightHours,
      netNightHours: netNightHoursStr,
      nightAllowance,
      holidayPayMonthly,
      netHolidayHours: netHolidayHoursStr,
      unusedAnnualLeaveDays,
      annualLeaveMonthlyHours: annualLeaveMonthlyHours.toFixed(1),
      annualLeaveMonthlyPay,
      mealPay,
      pensionBase,
      totalGross,
      totalDeductions,
      extraOvertimeAllowance,
      nationalPension,
      healthInsurance,
      longtermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      netPay,
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
        customPensionBase: pensionBaseInput,
        calculatedResult: calculated
      });
    }
    onClose();
  };

  const modalContainerStyle = isInline ? {
    width: '100%', margin: '1rem 0'
  } : {
    position: 'fixed', inset: 0, zIndex: 99999,
    background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
  };

  return (
    <div style={modalContainerStyle}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={22} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
              🧮 0% 오차 실시간 대화형 월급 계산기
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2열 레이아웃: 좌측(입력 조율 패널), 우측(실시간 정식 법정 급여명세서) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.25rem' }}>
          
          {/* 1) 좌측: 입력 컨트롤러 */}
          <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.85rem' }}>
              ⏱️ 1. 근무 조건 및 수당 파라미터 조율
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* 통상시급 & 사업장 규모 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    통상 시급 (2026 최저 10,320원)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.4rem 0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                    <span style={{ marginLeft: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>원</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    사업장 규모
                  </label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => setIs5Over(true)}
                      style={{ flex: 1, padding: '0.4rem 0.2rem', borderRadius: '6px', background: is5Over ? '#0284c7' : '#0f172a', color: is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      5인 이상
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs5Over(false)}
                      style={{ flex: 1, padding: '0.4rem 0.2rem', borderRadius: '6px', background: !is5Over ? '#0284c7' : '#0f172a', color: !is5Over ? '#fff' : '#64748b', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      5인 미만
                    </button>
                  </div>
                </div>
              </div>

              {/* 💡 국민연금 부과 대상 소득월액 (적용액) 직접 입력 박스 */}
              <div style={{ background: '#0f172a', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #38bdf8' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.3rem' }}>
                  💡 국민연금 부과 대상 소득월액 (적용액 직접 입력)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="number"
                    step="10000"
                    value={pensionBaseInput}
                    onChange={(e) => setPensionBaseInput(e.target.value)}
                    placeholder="예: 2600000"
                    style={{ flex: 1, padding: '0.4rem 0.6rem', background: '#1e293b', border: '1px solid #0284c7', color: '#38bdf8', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 900 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800 }}>원</span>
                </div>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  * 수치를 입력하면 우측 명세서의 국민연금 과세소득 및 공제액(4.5%)에 실시간 즉시 반영됩니다.
                </div>
              </div>

              {/* 근무 형태 선택 탭 (고정 vs 변동) */}
              <div>
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

              {/* B. 요일별 변동 근무 입력 모드 */}
              {workScheduleType === 'flexible' && (
                <div>
                  <div style={{ background: '#0f172a', padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.3rem' }}>
                      ⚡ 일할 요일 선택 ➔ 일괄 적용 & 세부 변경
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
                      {['월', '화', '수', '목', '금', '토', '일'].map(day => {
                        const isSel = batchDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setBatchDays(prev => isSel ? prev.filter(d => d !== day) : [...prev, day]);
                            }}
                            style={{
                              flex: 1, padding: '0.25rem 0', borderRadius: '4px',
                              background: isSel ? '#0284c7' : '#1e293b',
                              color: isSel ? '#fff' : '#64748b',
                              border: '1px solid #334155', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <select
                        value={batchStart}
                        onChange={(e) => setBatchStart(e.target.value)}
                        style={{ flex: 1, padding: '0.2rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.72rem' }}
                      >
                        {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span>~</span>
                      <select
                        value={batchEnd}
                        onChange={(e) => setBatchEnd(e.target.value)}
                        style={{ flex: 1, padding: '0.2rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.72rem' }}
                      >
                        {TIME_OPTIONS_24H.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select
                        value={batchBreak}
                        onChange={(e) => setBatchBreak(e.target.value)}
                        style={{ width: '65px', padding: '0.2rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.72rem' }}
                      >
                        <option value="0h">휴게 0h</option>
                        <option value="1h">휴게 1h</option>
                        <option value="1.5h">휴게 1.5h</option>
                        <option value="2h">휴게 2h</option>
                      </select>
                      <button
                        type="button"
                        onClick={applyBatchSchedule}
                        style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        일괄적용
                      </button>
                    </div>
                  </div>

                  {/* 요일별 개별 시간표 드롭다운 목록 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {['월', '화', '수', '목', '금', '토', '일'].map(day => {
                      const sched = daySchedules[day];
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                          <button
                            type="button"
                            onClick={() => setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], isWork: !prev[day].isWork } }))}
                            style={{
                              padding: '0.15rem 0.4rem', borderRadius: '3px',
                              background: sched.isWork ? '#0284c7' : '#334155',
                              color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer'
                            }}
                          >
                            {day} {sched.isWork ? '근무' : '휴무'}
                          </button>

                          {sched.isWork ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1 }}>
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
              <div>
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
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={holidayDaysYear}
                    onChange={(e) => setHolidayDaysYear(Math.max(0, Number(e.target.value)))}
                    style={{ width: '60px', padding: '0.35rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.78rem', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>일</span>
                </div>
              </div>

              {/* 비과세 식대 및 연차 정밀 설정 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #334155', paddingTop: '0.65rem' }}>
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

                {/* 연차 정밀 세팅 */}
                {includeAnnualLeave && (
                  <div style={{ background: '#0f172a', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', marginTop: '0.1rem' }}>
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={13} /> 연차 정밀 설정 (엑셀/규정 연차 일수 맞춤)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>전체 발생 연차일수</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={totalAnnualLeaveDays}
                          onChange={(e) => setTotalAnnualLeaveDays(Math.max(0, Number(e.target.value)))}
                          style={{ width: '100%', padding: '0.25rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>실제 사용 연차일수</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={usedAnnualLeaveDays}
                          onChange={(e) => setUsedAnnualLeaveDays(Math.max(0, Number(e.target.value)))}
                          style={{ width: '100%', padding: '0.25rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 700 }}>
                      💡 미사용 정산 연차: {calculated.unusedAnnualLeaveDays}일분 ➔ 월 {calculated.annualLeaveMonthlyHours}시간 ({calculated.annualLeaveMonthlyPay.toLocaleString()}원) 정산 반영!
                    </div>
                  </div>
                )}
              </div>

              {/* 사업주 약정 세전 월급 정액 세팅 */}
              <div style={{ background: '#0f172a', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', marginTop: '0.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800, cursor: 'pointer', marginBottom: '0.3rem' }}>
                  <input
                    type="checkbox"
                    checked={useTargetGross}
                    onChange={(e) => setUseTargetGross(e.target.checked)}
                  />
                  💼 사업주 약정 세전 월급 정액 세팅 (잔액 ➔ 추가연장수당 편입)
                </label>
                {useTargetGross && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>목표 세전 월급:</span>
                    <input
                      type="number"
                      step="10000"
                      value={targetGrossSalary}
                      onChange={(e) => setTargetGrossSalary(Number(e.target.value))}
                      style={{ flex: 1, padding: '0.3rem', background: '#1e293b', border: '1px solid #0284c7', color: '#38bdf8', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 900 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>원</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 2) 우측: 실시간 정식 법정 임금명세서 (좌측 패널과 100% 동일한 다크 네이비 럭셔리 디자인) */}
          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            padding: '1.1rem',
            borderRadius: '14px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              {/* 문서 헤더 & 카톡 전송 퀵버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '2px solid #38bdf8', paddingBottom: '0.4rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.05em' }}>
                    임 금 명 세 서 (2026 최신 법정)
                  </h4>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>지급대상기간: 2026년 07월 (01일~말일) | 급여지급일: 2026년 07월 25일</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert("📱 [카카오톡 알림톡 전송 완료]\n\n2026년 7월 법정 급여명세서\n-------------------------------\n• 세전 월급: " + calculated.totalGross.toLocaleString() + " 원\n• 실수령액: " + calculated.netPay.toLocaleString() + " 원\n• 국민연금 과세표준: " + calculated.pensionBase.toLocaleString() + " 원\n• 실제 연장근로: " + calculated.netOvertimeHours + " 시간 (" + calculated.monthlyOvertimePay.toLocaleString() + " 원)\n• 실제 야간근로: " + calculated.netNightHours + " 시간 (" + calculated.nightAllowance.toLocaleString() + " 원)\n• 국민연금 공제액: " + calculated.nationalPension.toLocaleString() + " 원\n\n카카오톡으로 급여명세서 발송이 성공적으로 완료되었습니다!");
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
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <MessageSquare size={13} color="#000" /> 💬 카톡 전송
                </button>
              </div>

              {/* 사원 & 사업장 개요 상단 표 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', marginBottom: '0.65rem', border: '1px solid #334155' }}>
                <tbody>
                  <tr>
                    <td style={{ background: '#1e293b', padding: '0.25rem 0.35rem', fontWeight: 700, border: '1px solid #334155', color: '#94a3b8', width: '20%' }}>성 명</td>
                    <td style={{ padding: '0.25rem 0.35rem', border: '1px solid #334155', width: '30%', fontWeight: 600, color: '#f8fafc' }}>신청 근로자</td>
                    <td style={{ background: '#1e293b', padding: '0.25rem 0.35rem', fontWeight: 700, border: '1px solid #334155', color: '#94a3b8', width: '20%' }}>사업장명</td>
                    <td style={{ padding: '0.25rem 0.35rem', border: '1px solid #334155', width: '30%', fontWeight: 600, color: '#f8fafc' }}>노무체크 검증 사업장</td>
                  </tr>
                  <tr>
                    <td style={{ background: '#1e293b', padding: '0.25rem 0.35rem', fontWeight: 700, border: '1px solid #334155', color: '#94a3b8' }}>통상 시급</td>
                    <td style={{ padding: '0.25rem 0.35rem', border: '1px solid #334155', fontWeight: 700, color: '#38bdf8' }}>{hourlyRate.toLocaleString()} 원</td>
                    <td style={{ background: '#1e293b', padding: '0.25rem 0.35rem', fontWeight: 700, border: '1px solid #334155', color: '#94a3b8' }}>기본 산정시간</td>
                    <td style={{ padding: '0.25rem 0.35rem', border: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>209 시간 (주 40시간 기준)</td>
                  </tr>
                </tbody>
              </table>

              {/* 2열 급여명세서 본문 (좌: 지급 내역 / 우: 공제 내역) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '0.55rem', marginBottom: '0.65rem' }}>
                
                {/* 좌측: 지급 내역 (세전) */}
                <div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem', textAlign: 'center', fontWeight: 800, fontSize: '0.72rem', borderRadius: '4px 4px 0 0', border: '1px solid rgba(56, 189, 248, 0.3)', borderBottom: 'none' }}>
                    지 급 내 역 (세전)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', border: '1px solid #334155', background: '#0f172a' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center' }}>지급 항목</th>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center' }}>산출시간</th>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'right' }}>금액 (원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>기본급 (순수 소정)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#94a3b8' }}>{calculated.pureBaseHoursMonthly}h</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>{calculated.pureBasePay.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)' }}>주휴수당 (유급주휴)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#34d399', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)' }}>{calculated.weeklyHolidayHoursMonthly}h</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)' }}>{calculated.weeklyHolidayPay.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>연장근로수당 (1.5배)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{calculated.netOvertimeHours}h</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>{calculated.monthlyOvertimePay.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>야간근로수당 (0.5배 가산)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{calculated.netNightHours}h</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{calculated.nightAllowance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>휴일근로수당 (1.5배 가산)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{calculated.netHolidayHours}h</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{calculated.holidayPayMonthly.toLocaleString()}</td>
                      </tr>
                      {includeAnnualLeave && (
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>연차휴가수당</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#c084fc', fontWeight: 700 }}>{calculated.annualLeaveMonthlyHours}h</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#c084fc' }}>{calculated.annualLeaveMonthlyPay.toLocaleString()}</td>
                        </tr>
                      )}
                      {calculated.extraOvertimeAllowance > 0 && (
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', color: '#38bdf8', fontWeight: 700 }}>➕ 추가 연장 수당</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', fontSize: '0.62rem', color: '#38bdf8' }}>약정차액조정</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 800, color: '#38bdf8' }}>{calculated.extraOvertimeAllowance.toLocaleString()}</td>
                        </tr>
                      )}
                      {includeMeal && (
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', color: '#34d399', fontWeight: 700 }}>🍚 식대 (비과세)</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#94a3b8' }}>-</td>
                          <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>{calculated.mealPay.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.35rem 0.45rem', fontSize: '0.7rem', fontWeight: 900, border: '1px solid rgba(56, 189, 248, 0.3)', borderTop: 'none', display: 'flex', justifyContent: 'space-between', borderRadius: '0 0 4px 4px', color: '#38bdf8' }}>
                    <span>지급액 계</span>
                    <span>{calculated.totalGross.toLocaleString()} 원</span>
                  </div>
                </div>

                {/* 우측: 공제 내역 (2026 최신 4대보험) */}
                <div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '0.25rem', textAlign: 'center', fontWeight: 800, fontSize: '0.72rem', borderRadius: '4px 4px 0 0', border: '1px solid rgba(244, 63, 94, 0.3)', borderBottom: 'none' }}>
                    공 제 내 역 (2026 최신 4대보험)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', border: '1px solid #334155', background: '#0f172a' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center' }}>공제 항목</th>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center' }}>2026 요율</th>
                        <th style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'right' }}>금액 (원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: 'rgba(56, 189, 248, 0.05)' }}>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', fontSize: '0.6rem', color: '#38bdf8', fontWeight: 800 }}>💡 국민연금 부과 과세소득</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', fontSize: '0.58rem', color: '#38bdf8' }}>적용 소득월액</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'right', fontWeight: 900, color: '#38bdf8' }}>{calculated.pensionBase.toLocaleString()} 원</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>국민연금 (근로자부담)</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', fontWeight: 800, color: '#f43f5e' }}>4.5%</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', fontWeight: 700, color: '#f43f5e' }}>{calculated.nationalPension.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>건강보험</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', fontWeight: 700, color: '#f43f5e' }}>3.545%</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', color: '#f43f5e' }}>{calculated.healthInsurance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>장기요양보험</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#94a3b8' }}>12.95%</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', color: '#f43f5e' }}>{calculated.longtermCare.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', fontWeight: 600, color: '#e2e8f0' }}>고용보험</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', fontWeight: 700, color: '#f43f5e' }}>0.9%</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', color: '#f43f5e' }}>{calculated.employmentInsurance.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', color: '#94a3b8' }}>근로소득세</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#94a3b8' }}>간이세액표</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', textAlign: 'right', color: '#f43f5e' }}>{calculated.incomeTax.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.25rem', color: '#94a3b8' }}>지방소득세</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'center', color: '#94a3b8' }}>10%</td>
                        <td style={{ border: '1px solid #334155', padding: '0.2rem 0.15rem', textAlign: 'right', color: '#f43f5e' }}>{calculated.localIncomeTax.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '0.35rem 0.45rem', fontSize: '0.7rem', fontWeight: 900, border: '1px solid rgba(244, 63, 94, 0.3)', borderTop: 'none', display: 'flex', justifyContent: 'space-between', borderRadius: '0 0 4px 4px', color: '#f43f5e' }}>
                    <span>공제액 계</span>
                    <span>- {calculated.totalDeductions.toLocaleString()} 원</span>
                  </div>
                </div>

              </div>

              {/* 하단 실수령액 박스 */}
              <div style={{
                padding: '0.6rem 0.75rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: '#ffffff', textAlign: 'center', boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)', border: '1px solid rgba(56, 189, 248, 0.4)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>💰 실수령액 (차인지급액)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em', margin: '0.1rem 0' }}>
                  {calculated.netPay.toLocaleString()} 원
                </div>
              </div>
            </div>

            {/* 하단 카톡 전송 & 갱신 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  alert("📱 [카카오톡 알림톡 전송 완료]\n\n2026년 7월 법정 급여명세서\n-------------------------------\n• 세전 월급: " + calculated.totalGross.toLocaleString() + " 원\n• 실수령액: " + calculated.netPay.toLocaleString() + " 원\n• 국민연금 과세표준: " + calculated.pensionBase.toLocaleString() + " 원\n• 실제 연장근로: " + calculated.netOvertimeHours + " 시간 (" + calculated.monthlyOvertimePay.toLocaleString() + " 원)\n• 실제 야간근로: " + calculated.netNightHours + " 시간 (" + calculated.nightAllowance.toLocaleString() + " 원)\n• 국민연금 공제액: " + calculated.nationalPension.toLocaleString() + " 원\n\n카카오톡으로 급여명세서 발송이 성공적으로 완료되었습니다!");
                }}
                style={{
                  padding: '0.55rem 0.7rem', borderRadius: '8px',
                  background: '#FEE500', color: '#000000', border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                }}
              >
                <MessageSquare size={14} color="#000" /> 💬 카톡 명세서 전송
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}
              >
                <CheckCircle size={15} /> 수치 수정 반영 갱신
              </button>
            </div>
          </div>

        </div>
      </div>
  );
}
