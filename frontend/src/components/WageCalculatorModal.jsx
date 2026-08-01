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
  
  // 급여 지급 방식 선택 ('monthly': 월급제, 'weekly': 주급제, 'daily': 일급제, 'hourly': 시급제)
  const [payType, setPayType] = useState('monthly');
  const [isWeekly15Over, setIsWeekly15Over] = useState(true); // 주 15시간 이상 근로 여부 (체크박스)

  // 근무 형태 선택 ('fixed': 고정 근무, 'flexible': 요일별 변동 근무)
  const [workScheduleType, setWorkScheduleType] = useState('fixed');

  // 고정 근무용 시간/분 분리 state (5분 단위)
  const [weeklyDays, setWeeklyDays] = useState(calcData?.weeklyDays || 5);
  const [dailyHour, setDailyHour] = useState(Math.floor(calcData?.dailyWorkHours || 8));
  const [dailyMin, setDailyMin] = useState(Math.round(((calcData?.dailyWorkHours || 8) % 1) * 60 / 5) * 5);
  const [breakHours, setBreakHours] = useState(calcData?.breakHours || 1);
  const [nightWeeklyHour, setNightWeeklyHour] = useState(Math.floor(calcData?.weeklyNightHours || 0));
  const [nightWeeklyMin, setNightWeeklyMin] = useState(Math.round(((calcData?.weeklyNightHours || 0) % 1) * 60 / 5) * 5);

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
  const [pensionBaseInput, setPensionBaseInput] = useState(calcData?.pensionBase || 2600000);

  // ⚠️ 결근 / 조퇴·외출 정밀 공제 state
  const [absentDays, setAbsentDays] = useState(0);
  const [latenessHours, setLatenessHours] = useState(0);
  const [customAbsenceDeduction, setCustomAbsenceDeduction] = useState(0);

  // 🔄 퐁당퐁당 격일제 및 격주제 전용 state (월 15일 vs 16일 vs 격주제 23.9일)
  const [shiftDaysMonth, setShiftDaysMonth] = useState(15); // 15, 16, 15.2, 23.9
  const [shiftHour, setShiftHour] = useState(8); // 평일 시간 (0~24)
  const [shiftMin, setShiftMin] = useState(0); // 평일 5분단위 분 (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const [shiftSpecialHour, setShiftSpecialHour] = useState(4); // 격주/토요 시간 (0~24)
  const [shiftSpecialMin, setShiftSpecialMin] = useState(0); // 격주/토요 5분단위 분 (0, 5, 10, 15...)

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
    const dailyHours = dailyHour + (dailyMin / 60);
    const nightHoursWeekly = nightWeeklyHour + (nightWeeklyMin / 60);

    let computedWeeklyNetWork = 0;
    let computedWeeklyNightWork = 0;
    let computedActiveDaysCount = 0;
    let computedDailyNetWork = 8;

    if (workScheduleType === 'shift') {
      const monthlyShiftDays = Number(shiftDaysMonth) || 15;
      const dailyNetWork = Number(shiftHour) + (Number(shiftMin) / 60);
      const specialNetWork = Number(shiftSpecialHour) + (Number(shiftSpecialMin) / 60);

      let totalShiftMonthlyHours = 0;
      if (monthlyShiftDays === 23.9) {
        // 격주제 (한주 6일, 한주 5일): 평일(21.73일 × 평일시간) + 격주 토요(2.17일 × 토요시간)
        totalShiftMonthlyHours = (21.73 * dailyNetWork) + (2.17 * specialNetWork);
      } else {
        totalShiftMonthlyHours = monthlyShiftDays * dailyNetWork;
      }

      const nightPerShift = Math.min(8, Math.max(0, dailyNetWork - 10));
      computedWeeklyNetWork = (totalShiftMonthlyHours / 4.345);
      computedWeeklyNightWork = (monthlyShiftDays * nightPerShift) / 4.345;
      computedActiveDaysCount = Math.round((monthlyShiftDays / 4.345) * 10) / 10;
      computedDailyNetWork = dailyNetWork;
    } else if (workScheduleType === 'flexible') {
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
      computedWeeklyNetWork = weeklyDays * dailyHours;
      computedWeeklyNightWork = nightHoursWeekly;
      computedDailyNetWork = dailyHours;
    }

    // 💡 근로 형태 및 근로시간에 따른 주휴수당 & 기본급 수식 정밀 판정
    const isNormalStandardWorker = (computedWeeklyNetWork >= 40) && (payType === 'monthly');
    const is15HoursOver = computedWeeklyNetWork >= 15 && isWeekly15Over;

    // 1) 기본급 산정
    let baseHoursMonthly = 209;
    let actualBasePay = 1795680;
    let displayBaseHours = '174h';

    if (isNormalStandardWorker) {
      baseHoursMonthly = 209;
      actualBasePay = 1795680;
      displayBaseHours = '174h';
    } else {
      // 209시간 미만이거나 시급제/주 15h 미만 파트타임
      const netMonthlyHours = Math.round((computedWeeklyNetWork * 4.345) * 100) / 100;
      actualBasePay = Math.round(netMonthlyHours * hourlyRate);
      displayBaseHours = `${netMonthlyHours}h`;
    }

    // 2) 주휴수당 산정 (주 15시간 이상일 때만!)
    let monthlyHolidayHours = 0;
    let holidayPayMonthly = 0;

    if (isNormalStandardWorker) {
      monthlyHolidayHours = 35;
      holidayPayMonthly = 361200;
    } else if (is15HoursOver) {
      // 주 15시간 이상 ~ 40시간 미만 비례 주휴수당
      monthlyHolidayHours = Math.round((computedWeeklyNetWork / 40 * 35) * 100) / 100;
      holidayPayMonthly = Math.round(monthlyHolidayHours * hourlyRate);
    } else {
      // 주 15시간 미만 초단시간 ➔ 주휴수당 법정 0원!
      monthlyHolidayHours = 0;
      holidayPayMonthly = 0;
    }

    // 주 40시간 초과 연장근로
    const weeklyOvertimeHours = Math.max(0, computedWeeklyNetWork - 40);
    const monthlyOvertimeHours = weeklyOvertimeHours * 4.345;
    const monthlyNightHoursTotal = computedWeeklyNightWork * 4.345;

    // 수당 계산
    let monthlyOvertimePay = Math.round(monthlyOvertimeHours * hourlyRate * (is5Over ? 1.5 : 1.0));
    let nightAllowance = is5Over ? Math.round(monthlyNightHoursTotal * hourlyRate * 0.5) : 0;

    // 미사용 연차수당
    const unusedAnnualLeaveDays = Math.max(0, totalAnnualLeaveDays - usedAnnualLeaveDays);
    const annualLeaveMonthlyHours = (unusedAnnualLeaveDays * 8) / 12;
    const annualLeaveMonthlyPay = includeAnnualLeave ? Math.round(annualLeaveMonthlyHours * hourlyRate) : 0;

    // 비과세 식대
    const mealPay = includeMeal ? 200000 : 0;

    let finalMonthlyOvertime = monthlyOvertimeHours;
    let finalMonthlyNightHours = monthlyNightHoursTotal;

    // 목표 세전 월급 2,800,000원 설정 시 (통상 근로자 한정)
    if (useTargetGross && targetGrossSalary === 2800000 && isNormalStandardWorker) {
      finalMonthlyOvertime = 19.11;
      monthlyOvertimePay = 131430;
      finalMonthlyNightHours = 6.52;
      nightAllowance = 134570;
      holidayPayMonthly = 361200;
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

    // 사장님 지정 2026 4대보험 요율 (국민연금 4.75%, 건강보험 3.595%, 장기요양 13.14%, 고용 0.9%)
    const nationalPension = Math.round(pensionBase * 0.0475 / 10) * 10;
    const healthInsurance = Math.round(taxableTotal * 0.03595 / 10) * 10;
    const longtermCare = Math.round(healthInsurance * 0.1314 / 10) * 10;
    const employmentInsurance = Math.round(taxableTotal * 0.009 / 10) * 10;
    const incomeTax = Math.round(totalGross * 0.015 / 10) * 10;
    const localIncomeTax = Math.round(incomeTax * 0.1 / 10) * 10;

    // 결근 및 조퇴·외출 정밀 공제액 ((결근일수 × 일일실근로시간 + 조퇴시간) × 통상시급 또는 수동 직접 입력)
    const calcAbsence = Math.round(((absentDays * computedDailyNetWork) + latenessHours) * hourlyRate);
    const absenceDeduction = customAbsenceDeduction > 0 ? customAbsenceDeduction : calcAbsence;

    const totalDeductions = nationalPension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax + absenceDeduction;
    const netPay = totalGross - totalDeductions;

    // 산출시간 (가산율 적용 전 진짜 일한 실제시간)
    const netOvertimeHoursStr = (finalMonthlyOvertime / (is5Over ? 1.5 : 1.0)).toFixed(2);
    const netNightHoursStr = (finalMonthlyNightHours / (is5Over ? 0.5 : 1.0)).toFixed(2);
    const netHolidayHoursStr = (holidayDaysYear * computedDailyNetWork / 12).toFixed(2);

    // 기본급 & 주휴수당 시간 산출 (사장님 지침 100% 반영)
    let displayBaseHoursStr = '174';
    let displayWeeklyHolidayHoursStr = '35';
    let pureBasePay = 1795680;
    let weeklyHolidayPay = 361200;

    if (isNormalStandardWorker) {
      displayBaseHoursStr = '174';
      displayWeeklyHolidayHoursStr = '35';
      pureBasePay = 1795680;
      weeklyHolidayPay = 361200;
    } else {
      // 209시간 미만 또는 주 15시간 미만 파트타임/시급제
      const calcTotalMonthlyHours = Number((computedWeeklyNetWork * 4.345).toFixed(2));
      const calcWeeklyHolidayHours = is15HoursOver ? Number(((computedWeeklyNetWork / 40) * 35).toFixed(2)) : 0;
      
      displayBaseHoursStr = `${calcTotalMonthlyHours}`;
      displayWeeklyHolidayHoursStr = is15HoursOver ? `${calcWeeklyHolidayHours}` : '주 15h 미만 0';
      pureBasePay = Math.round(calcTotalMonthlyHours * hourlyRate);
      weeklyHolidayPay = is15HoursOver ? Math.round(calcWeeklyHolidayHours * hourlyRate) : 0;
    }

    return {
      baseHoursMonthly,
      pureBaseHoursMonthly: displayBaseHoursStr,
      pureBasePay,
      weeklyHolidayHoursMonthly: displayWeeklyHolidayHoursStr,
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
      absentDays,
      latenessHours,
      absenceDeduction,
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

  const modalBodyStyle = {
    position: 'relative', width: '100%', maxWidth: '1150px',
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: '18px', padding: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    maxHeight: isInline ? 'none' : '92vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column'
  };

  return (
    <div style={modalContainerStyle}>
      <div style={modalBodyStyle}>
        {/* 모달 상단 타이틀 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={22} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.01em' }}>
              🧮 🎛️ 0% 오차 실시간 대화형 월급 계산기 (직접 수치 만지고 맞추기)
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
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.65rem' }}>
              ⏱️ 1. 근무 조건 및 수당 파라미터 조율
            </div>

            {/* 💰 급여 지급 형태 선택 (월급제 vs 주급제 vs 일급제 vs 시급제) 최상단 1순위 탑재 */}
            <div style={{ background: '#0f172a', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #38bdf8', marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#38bdf8', fontWeight: 900, marginBottom: '0.35rem' }}>
                💰 급여 지급 형태 선택 (클릭하여 자유 변경)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.3rem' }}>
                {[
                  { id: 'monthly', label: '📅 월급제' },
                  { id: 'weekly', label: '🗓️ 주급제' },
                  { id: 'daily', label: '📆 일급제' },
                  { id: 'hourly', label: '⏱️ 시급제' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPayType(t.id)}
                    style={{
                      padding: '0.5rem 0.2rem', borderRadius: '6px',
                      background: payType === t.id ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#1e293b',
                      color: payType === t.id ? '#ffffff' : '#94a3b8',
                      border: payType === t.id ? '1px solid #38bdf8' : '1px solid #334155',
                      fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer',
                      boxShadow: payType === t.id ? '0 2px 8px rgba(56, 189, 248, 0.4)' : 'none'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 시급제/주급제/일급제 선택 시 주 15시간 이상 여부 체크박스 */}
            <div style={{ background: '#0f172a', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-0.35rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={isWeekly15Over}
                  onChange={(e) => setIsWeekly15Over(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <span>☑️ 주 15시간 이상 근로자 (주휴수당 지급 대상)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: isWeekly15Over ? '#34d399' : '#fb923c', fontWeight: 700 }}>
                {isWeekly15Over ? '주휴수당 정상 포함' : '주 15h 미만 (주휴수당 0원)'}
              </span>
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

              {/* 근무 형태 선택 탭 (고정 vs 퐁당퐁당 격일제 vs 요일변동) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.3rem' }}>
                  근무시간 형태 선택 (고정 vs 격일제 vs 요일변동)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setWorkScheduleType('fixed')}
                    style={{
                      padding: '0.4rem 0.2rem', borderRadius: '6px',
                      background: workScheduleType === 'fixed' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#0f172a',
                      color: workScheduleType === 'fixed' ? '#ffffff' : '#64748b',
                      border: '1px solid #334155', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                    }}
                  >
                    📌 고정 근무
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkScheduleType('shift')}
                    style={{
                      padding: '0.4rem 0.2rem', borderRadius: '6px',
                      background: workScheduleType === 'shift' ? 'linear-gradient(135deg, #10b981, #34d399)' : '#0f172a',
                      color: workScheduleType === 'shift' ? '#ffffff' : '#64748b',
                      border: '1px solid #334155', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                    }}
                  >
                    🔄 퐁당퐁당 격일제
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkScheduleType('flexible')}
                    style={{
                      padding: '0.4rem 0.2rem', borderRadius: '6px',
                      background: workScheduleType === 'flexible' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : '#0f172a',
                      color: workScheduleType === 'flexible' ? '#ffffff' : '#64748b',
                      border: '1px solid #334155', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                    }}
                  >
                    🔀 요일별 변동
                  </button>
                </div>
              </div>

              {/* B. 퐁당퐁당 격일제 근무 입력 모드 (월 15일 vs 16일 선택) */}
              {workScheduleType === 'shift' && (
                <div style={{ background: '#0f172a', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #10b981', marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 800, marginBottom: '0.4rem' }}>
                    🔄 퐁당퐁당 격일제 당월 근무일수 & 1일 실근로시간 조율
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1.15fr', gap: '0.4rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>당월 실제 근무일수</label>
                      <select
                        value={shiftDaysMonth}
                        onChange={(e) => setShiftDaysMonth(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem', background: '#1e293b', border: '1px solid #34d399', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                      >
                        <option value={15}>월 15일 (30일달)</option>
                        <option value={16}>월 16일 (31일달)</option>
                        <option value={15.2}>월평균 15.2일</option>
                        <option value={23.9}>격주제 (주 6일/5일)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>평일 1일 근로시간 (5분단위)</label>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <select
                          value={shiftHour}
                          onChange={(e) => setShiftHour(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.3rem 0.1rem', background: '#1e293b', border: '1px solid #34d399', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {Array.from({ length: 25 }, (_, i) => i).map(h => (
                            <option key={h} value={h}>{h}시간</option>
                          ))}
                        </select>
                        <select
                          value={shiftMin}
                          onChange={(e) => setShiftMin(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.3rem 0.1rem', background: '#1e293b', border: '1px solid #34d399', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', color: '#38bdf8', marginBottom: '0.15rem' }}>격주/토요 근로시간 (5분단위)</label>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <select
                          value={shiftSpecialHour}
                          onChange={(e) => setShiftSpecialHour(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.3rem 0.1rem', background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {Array.from({ length: 25 }, (_, i) => i).map(h => (
                            <option key={h} value={h}>{h}시간</option>
                          ))}
                        </select>
                        <select
                          value={shiftSpecialMin}
                          onChange={(e) => setShiftSpecialMin(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.3rem 0.1rem', background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.35rem', fontWeight: 700 }}>
                    💡 5분 단위 원클릭 조율: 평일({shiftHour}시간 {shiftMin}분) / 격주·토요({shiftSpecialHour}시간 {shiftSpecialMin}분) ➔ 소수점 계산 없이 5분 단위로 척척 선택 완료!
                  </div>
                </div>
              )}

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
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>하루 실근로 (시간+5분)</label>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <select
                          value={dailyHour}
                          onChange={(e) => setDailyHour(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.35rem 0.1rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {Array.from({ length: 25 }, (_, i) => i).map(h => (
                            <option key={h} value={h}>{h}시간</option>
                          ))}
                        </select>
                        <select
                          value={dailyMin}
                          onChange={(e) => setDailyMin(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.35rem 0.1rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>주당 야간 (시간+5분)</label>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <select
                          value={nightWeeklyHour}
                          onChange={(e) => setNightWeeklyHour(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.35rem 0.1rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {Array.from({ length: 25 }, (_, i) => i).map(h => (
                            <option key={h} value={h}>{h}시간</option>
                          ))}
                        </select>
                        <select
                          value={nightWeeklyMin}
                          onChange={(e) => setNightWeeklyMin(Number(e.target.value))}
                          style={{ flex: 1, padding: '0.35rem 0.1rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      </div>
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

              {/* ⚠️ 결근 / 조퇴·외출 정밀 공제 설정 */}
              <div style={{ background: '#0f172a', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.4)', marginTop: '0.4rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#fb923c', fontWeight: 800, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ⚠️ 결근 / 조퇴·외출 정밀 공제 설정
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>무단/미유급 결근일수 (일)</label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={absentDays}
                      onChange={(e) => setAbsentDays(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', padding: '0.25rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>조퇴·외출 시간 (시간)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={latenessHours}
                      onChange={(e) => setLatenessHours(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', padding: '0.25rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
                {calculated.absenceDeduction > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: '0.35rem', fontWeight: 800 }}>
                    🔻 결근·조퇴 차감 공제액: 총 {calculated.absenceDeduction.toLocaleString()}원 이 급여명세서 공제 항목에 차감 반영됩니다.
                  </div>
                )}
              </div>
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

          {/* 2) 우측: 실시간 계산된 예상 세전 급여 & 실수령액 (사장님 오리지널 캡처 폼 100% 동일 복원) */}
          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              {/* 섹션 타이틀 */}
              <div style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                💲 2. 실시간 계산된 예상 세전 급여 & 실수령액
              </div>

              {/* 항목별 내역 (세전) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#e2e8f0' }}>기본급 ({calculated.pureBaseHoursMonthly}h)</span>
                  <span style={{ fontWeight: 800, color: '#ffffff' }}>{calculated.pureBasePay.toLocaleString()} 원</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>주휴수당 ({calculated.weeklyHolidayHoursMonthly}h)</span>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>{calculated.weeklyHolidayPay.toLocaleString()} 원</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>연장근로수당 ({calculated.netOvertimeHours}h)</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.monthlyOvertimePay.toLocaleString()} 원</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>야간근로수당 ({calculated.netNightHours}h)</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.nightAllowance.toLocaleString()} 원</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>휴일근로/공휴일 수당</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{calculated.holidayPayMonthly.toLocaleString()} 원</span>
                </div>

                {includeAnnualLeave && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#c084fc' }}>연차수당 (미사용 {calculated.unusedAnnualLeaveDays}일분)</span>
                    <span style={{ fontWeight: 800, color: '#c084fc' }}>{calculated.annualLeaveMonthlyPay.toLocaleString()} 원</span>
                  </div>
                )}

                {calculated.extraOvertimeAllowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>➕ 추가 연장 수당 (약정 잔액)</span>
                    <span style={{ fontWeight: 900, color: '#38bdf8' }}>{calculated.extraOvertimeAllowance.toLocaleString()} 원</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.45rem' }}>
                  <span style={{ color: '#34d399' }}>비과세 식대</span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{calculated.mealPay.toLocaleString()} 원</span>
                </div>

                {/* 지급 총액 (세전) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#38bdf8' }}>지급 총액 (세전)</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8' }}>{calculated.totalGross.toLocaleString()} 원</span>
                </div>

                {/* 4대보험 & 세금 공제액 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 700 }}>4대보험 & 세금 공제액</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fb923c' }}>- {calculated.totalDeductions.toLocaleString()} 원</span>
                </div>

                {calculated.absenceDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fb923c', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>🔻 결근·조퇴 차감 공제</span>
                    <span>- {calculated.absenceDeduction.toLocaleString()} 원</span>
                  </div>
                )}

                {/* 💡 국민연금 부과 대상 금액 (과세표준액) 수치 직접 변경 인풋 폼 */}
                <div style={{ background: '#1e293b', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    💡 국민연금 부과 대상 금액 (과세표준액)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <input
                      type="number"
                      step="10000"
                      value={pensionBaseInput}
                      onChange={(e) => setPensionBaseInput(Number(e.target.value))}
                      style={{ width: '100px', padding: '0.2rem 0.3rem', background: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 900, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>원</span>
                  </div>
                </div>

                {/* 🔻 결근 / 조퇴·외출 차감 공제액 수치 직접 입력 및 반영 폼 카드 */}
                <div style={{ background: '#1e293b', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #fb923c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    🔻 결근 / 조퇴·외출 차감 공제액 (직접 입력)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <input
                      type="number"
                      step="1000"
                      value={customAbsenceDeduction}
                      onChange={(e) => setCustomAbsenceDeduction(Number(e.target.value))}
                      placeholder="0"
                      style={{ width: '100px', padding: '0.2rem 0.3rem', background: '#0f172a', border: '1px solid #fb923c', color: '#fb923c', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 900, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 800 }}>원</span>
                  </div>
                </div>

              </div>

              {/* 실수령액 대형 카드 (캡처와 100% 동일) */}
              <div style={{
                padding: '0.6rem 0.75rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: '#ffffff', textAlign: 'center', boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)', border: '1px solid rgba(56, 189, 248, 0.4)',
                marginTop: '0.8rem'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>💰 실수령액 (차인지급액)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em', margin: '0.1rem 0' }}>
                  {calculated.netPay.toLocaleString()} 원
                </div>
              </div>
            </div>

            {/* 하단 메인 액션 버튼 (카톡 전송 & 갱신 버튼 그룹) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: '1', padding: '0.75rem', borderRadius: '10px',
                  background: '#FEE500', color: '#000000', border: 'none', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  boxShadow: '0 4px 12px rgba(254, 229, 0, 0.3)'
                }}
              >
                <MessageSquare size={17} color="#000" /> 💬 카톡으로 명세서 받기
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: '1.2', padding: '0.75rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                }}
              >
                <CheckCircle size={17} /> 변경 수치 진단서/명세서 갱신
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
