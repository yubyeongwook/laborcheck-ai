// 근로기준법 기반 공용 계산 유틸리티

export const MIN_WAGE = 10030; // 시간당 최저임금 (원, 기본값 = 2025년 기준)
export const AVG_WEEKS_PER_MONTH = 4.35;

// 금액(원) 계산 결과의 10원 미만을 절사 (엑셀 ROUNDDOWN(x, -1)와 동일)
export const roundDownToTen = (amount) => Math.floor(amount / 10) * 10;

// 하루 휴일근로에 대한 지급액 계산 (근로기준법 제56조 2항)
// 5인 이상: 8시간 이내분은 통상임금의 50% 가산(1.5배), 8시간 초과분은 100% 가산(2.0배)
// 5인 미만: 가산수당 적용 제외, 근로한 시간만큼만 지급
export const calculateHolidayDayPay = (dailyHours, wage, is5Over) => {
  const hours = Math.max(parseFloat(dailyHours) || 0, 0);
  if (!is5Over) return hours * wage;
  const within8 = Math.min(hours, 8);
  const beyond8 = Math.max(hours - 8, 0);
  return (within8 * wage * 1.5) + (beyond8 * wage * 2.0);
};

// 연도별 법정 최저시급 (원) - 고용노동부 고시 기준. 목록에 없는 연도는 가장 가까운 연도 값을 사용
export const MIN_WAGE_BY_YEAR = {
  2017: 6470,
  2018: 7530,
  2019: 8350,
  2020: 8590,
  2021: 8720,
  2022: 9160,
  2023: 9620,
  2024: 9860,
  2025: 10030,
  2026: 10320
};

export const getMinWageForYear = (year) => {
  const y = parseInt(year, 10);
  if (MIN_WAGE_BY_YEAR[y]) return MIN_WAGE_BY_YEAR[y];
  const years = Object.keys(MIN_WAGE_BY_YEAR).map(Number);
  const closest = years.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
  return MIN_WAGE_BY_YEAR[closest];
};

export const DEDUCTION_RATES_BY_YEAR = {
  2017: { health: 0.0306, care: 0.0655, pension: 0.045, employment: 0.0065 },
  2018: { health: 0.0312, care: 0.0738, pension: 0.045, employment: 0.0065 },
  2019: { health: 0.0323, care: 0.0851, pension: 0.045, employment: 0.0065 },
  2020: { health: 0.03335, care: 0.1025, pension: 0.045, employment: 0.008 },
  2021: { health: 0.0343, care: 0.1152, pension: 0.045, employment: 0.008 },
  2022: { health: 0.03495, care: 0.1227, pension: 0.045, employment: 0.0085 },
  2023: { health: 0.03545, care: 0.1281, pension: 0.045, employment: 0.009 },
  2024: { health: 0.03545, care: 0.1295, pension: 0.045, employment: 0.009 },
  2025: { health: 0.03545, care: 0.1295, pension: 0.045, employment: 0.009 },
  2026: { health: 0.03595, care: 0.1314, pension: 0.0475, employment: 0.009 }
};

export const getDeductionRatesForYear = (year) => {
  const y = parseInt(year, 10);
  if (DEDUCTION_RATES_BY_YEAR[y]) return DEDUCTION_RATES_BY_YEAR[y];
  const years = Object.keys(DEDUCTION_RATES_BY_YEAR).map(Number);
  const closest = years.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
  return DEDUCTION_RATES_BY_YEAR[closest];
};

// 비과세 항목 월 한도 (소득세법 시행령 기준, 참고용) - 식대/자가운전보조금/육아수당 각각 월 20만원
export const NON_TAXABLE_MONTHLY_CAP = 200000;

// 비과세 수당(식대/자가운전보조금/육아수당/기타비과세) 입력을 받아 과세제외액과 한도초과(과세) 금액을 산출
export const calculateNonTaxableBreakdown = ({
  mealAllowance = 0,
  carAllowance = 0,
  childcareAllowance = 0,
  otherNonTaxable = 0
} = {}) => {
  const meal = parseFloat(mealAllowance) || 0;
  const car = parseFloat(carAllowance) || 0;
  const childcare = parseFloat(childcareAllowance) || 0;
  const other = parseFloat(otherNonTaxable) || 0;

  const mealExcess = Math.max(meal - NON_TAXABLE_MONTHLY_CAP, 0);
  const carExcess = Math.max(car - NON_TAXABLE_MONTHLY_CAP, 0);
  const childcareExcess = Math.max(childcare - NON_TAXABLE_MONTHLY_CAP, 0);

  const totalAllowance = meal + car + childcare + other; // 급여에 더해지는 전체 수당액
  const totalTaxableExcess = mealExcess + carExcess + childcareExcess; // 한도초과분 (과세대상으로 편입)
  const totalNonTaxable = totalAllowance - totalTaxableExcess; // 실제 비과세로 인정되는 금액

  return {
    meal, car, childcare, other,
    mealExcess, carExcess, childcareExcess,
    totalAllowance,
    totalNonTaxable,
    totalTaxableExcess
  };
};

// 월 급여 총액 기준 4대보험·소득세 공제 계산 (근로자 부담분, 참고용 개략치)
// nonTaxableAmount: 총 지급액(totalPay) 중 비과세로 인정되어 세금·4대보험 산정에서 제외되는 금액
export const applyDeductions = (totalPay, year = 2026, pensionBasis = 0, nonTaxableAmount = 0, deductionType = '4대보험', workingDaysCount = 20) => {
  const rates = getDeductionRatesForYear(year);
  const taxableBase = Math.max(totalPay - (parseFloat(nonTaxableAmount) || 0), 0);

  let nationalPension = 0;
  let healthInsurance = 0;
  let longTermCare = 0;
  let employmentInsurance = 0;
  let incomeTax = 0;
  let localIncomeTax = 0;

  if (deductionType === '3.3%') {
    incomeTax = roundDownToTen(totalPay * 0.03);
    localIncomeTax = roundDownToTen(incomeTax * 0.1);
  } else if (deductionType === '일용직') {
    // 고용보험 0.9% 적용
    employmentInsurance = roundDownToTen(taxableBase * rates.employment);

    // 일용직 소득세: 하루 평균 소정급여가 15만원 이하는 비과세
    const days = Math.max(parseFloat(workingDaysCount) || 20, 1);
    const dailyPay = totalPay / days;
    const dailyTaxable = Math.max(dailyPay - 150000, 0);
    let dailyIncomeTax = dailyTaxable * 0.06 * 0.45; // 55% 세액공제 감면
    dailyIncomeTax = Math.floor(dailyIncomeTax);

    // 소액부징수: 1일 산출소득세가 1,000원 미만 시 징수 면제
    if (dailyIncomeTax < 1000) {
      dailyIncomeTax = 0;
    }

    incomeTax = roundDownToTen(dailyIncomeTax * days);
    localIncomeTax = roundDownToTen(incomeTax * 0.1);
  } else {
    // 일반 4대보험 적용 근로자
    const pensionTarget = pensionBasis > 0 ? pensionBasis : taxableBase;
    nationalPension = roundDownToTen(pensionTarget * rates.pension);
    healthInsurance = roundDownToTen(taxableBase * rates.health);
    longTermCare = roundDownToTen(healthInsurance * rates.care);
    employmentInsurance = roundDownToTen(taxableBase * rates.employment);

    if (taxableBase >= 5000000) {
      incomeTax = roundDownToTen(taxableBase * 0.05);
    } else if (taxableBase >= 3000000) {
      incomeTax = roundDownToTen(taxableBase * 0.03);
    } else if (taxableBase >= 1500000) {
      incomeTax = roundDownToTen(taxableBase * 0.015);
    }
    localIncomeTax = roundDownToTen(incomeTax * 0.1);
  }

  const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  const totalTax = incomeTax + localIncomeTax;
  const totalDeductions = totalInsurance + totalTax;
  const netPay = Math.max(totalPay - totalDeductions, 0);

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalInsurance,
    incomeTax,
    localIncomeTax,
    totalTax,
    totalDeductions,
    netPay,
    taxableBase
  };
};

// 출퇴근 시각(HH:mm)과 휴게시간(분)으로 실근로시간 및 야간근로시간(22:00~익일 06:00)을 계산
// nightBreakMinutes: 전체 휴게시간 중 22:00~06:00 사이에 사용한 휴게시간 (야간근로시간에서 차감)
export const calculateHoursAndNightHours = (startStr, endStr, breakMinutes, nightBreakMinutes = 0) => {
  if (!startStr || !endStr) return { workHours: 0, nightHours: 0, nightOverlapRaw: 0 };

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  let startDecimal = startH + startM / 60;
  let endDecimal = endH + endM / 60;

  if (endDecimal <= startDecimal) {
    endDecimal += 24; // 자정 교차
  }

  const totalElapsed = endDecimal - startDecimal;
  const totalBreakMinutes = (parseFloat(breakMinutes) || 0) + (parseFloat(nightBreakMinutes) || 0);
  const breakHours = totalBreakMinutes / 60;
  const workHours = Math.max(0, totalElapsed - breakHours);

  // 22:00 ~ 익일 06:00 (dec: 22 ~ 30)
  const overlapNight1 = Math.max(0, Math.min(endDecimal, 30) - Math.max(startDecimal, 22));
  // 00:00 ~ 06:00 (dec: 0 ~ 6) - 새벽 일찍 출근한 경우
  const overlapNight2 = Math.max(0, Math.min(endDecimal, 6) - Math.max(startDecimal, 0));

  const nightOverlapRaw = overlapNight1 + overlapNight2;
  const nightBreakHours = (parseFloat(nightBreakMinutes) || 0) / 60;
  // "야간휴게시간"은 총 휴게시간 중 야간대에 해당하는 몫을 사용자가 별도로 입력해야 반영되는 값이라,
  // 입력을 빠뜨리면 일반 휴게시간이 야간대와 겹쳐도 야간근로시간에서 빠지지 않아 실근로시간(workHours)보다
  // 야간근로시간이 더 많아지는 (물리적으로 불가능한) 결과가 나올 수 있다. 실근로시간을 상한으로 둔다.
  const totalNight = Math.min(Math.max(nightOverlapRaw - nightBreakHours, 0), workHours);

  return {
    workHours: Math.round(workHours * 100) / 100,
    nightHours: Math.round(totalNight * 100) / 100,
    nightOverlapRaw: Math.round(nightOverlapRaw * 100) / 100
  };
};

// 근로기준법 제54조(휴게)에 따른 법정 최소 휴게시간(분)
// 근로시간 4시간 이하: 0분, 4시간 초과 8시간 이하: 30분, 8시간 초과: 60분
export const getStatutoryBreakMinutes = (elapsedHours) => {
  const hours = parseFloat(elapsedHours) || 0;
  if (hours > 8) return 60;
  if (hours > 4) return 30;
  return 0;
};

// 출퇴근 시각(HH:mm) 사이의 총 경과시간(휴게시간 차감 전, 자정 교차 포함)을 시간 단위로 반환
export const calculateElapsedHours = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  let startDecimal = startH + startM / 60;
  let endDecimal = endH + endM / 60;
  if (endDecimal <= startDecimal) endDecimal += 24;
  return endDecimal - startDecimal;
};

// 출퇴근 시간(useState 세터 기반) 변경 시, 사용자가 휴게시간을 직접 수정한 적이 없다면(Auto 플래그)
// 근로기준법 제54조 기준으로 휴게시간(시/분)을 자동 재계산해 주는 공용 핸들러 팩토리
export const makeAutoBreakHandlers = ({ startVal, endVal, setStart, setEnd, setBreakH, setBreakM, breakAuto, setBreakAuto }) => {
  const recalc = (start, end) => {
    if (!breakAuto) return;
    const minutes = getStatutoryBreakMinutes(calculateElapsedHours(start, end));
    setBreakH(String(Math.floor(minutes / 60)));
    setBreakM(String(minutes % 60));
  };
  return {
    onStartChange: (value) => { setStart(value); recalc(value, endVal); },
    onEndChange: (value) => { setEnd(value); recalc(startVal, value); },
    onBreakHChange: (value) => { setBreakH(value); setBreakAuto(false); },
    onBreakMChange: (value) => { setBreakM(value); setBreakAuto(false); }
  };
};

// 근무 패턴(최대 3개) + 급여 정보로 월 예상 급여 항목을 산출
export const calculateSalaryBreakdown = ({
  salaryType,
  salaryAmount,
  companySize,
  allowanceIncluded,
  pattern1Days, pattern1Hours,
  pattern2Days = 0, pattern2Hours = 0,
  pattern3Days = 0, pattern3Hours = 0,
  weeklyNightHours = 0,
  extraWeeklyOvertime = 0,
  year = 2026,
  pensionBasis = 0,
  mealAllowance = 0,
  carAllowance = 0,
  childcareAllowance = 0,
  otherNonTaxable = 0,
  taxableAllowance = 0,
  allowancesIncludedInTotal = false,
  scheduleType = '패턴별',
  directWeeklyWorkDays = 5,
  directWeeklyRegularHours = 40,
  directWeeklyOvertimeHours = 0,
  directWeeklyNightHours = 0,
  directAvgDailyHours = 8,
  deductionType = '4대보험',
  workingDaysCount = 0
}) => {
  const amt = parseFloat(salaryAmount) || 0;

  const p1D = parseFloat(pattern1Days) || 0;
  const p1H = parseFloat(pattern1Hours) || 0;
  const p2D = parseFloat(pattern2Days) || 0;
  const p2H = parseFloat(pattern2Hours) || 0;
  const p3D = parseFloat(pattern3Days) || 0;
  const p3H = parseFloat(pattern3Hours) || 0;
  const wNightHours = parseFloat(weeklyNightHours) || 0;

  let weeklyHours = 0;
  let regularWorkHoursForBasePay = 0;
  let weeklyOvertimeHours = 0;
  let weeklyNightHoursVal = 0;
  let avgDailyHours = 8;
  let totalWeeklyDays = 5;

  if (scheduleType === '직접입력' || scheduleType === '요일별') {
    totalWeeklyDays = parseFloat(directWeeklyWorkDays) || 5;
    weeklyHours = parseFloat(directWeeklyRegularHours) || 0;
    regularWorkHoursForBasePay = Math.min(weeklyHours, 40);
    weeklyOvertimeHours = parseFloat(directWeeklyOvertimeHours) || 0;
    weeklyNightHoursVal = parseFloat(directWeeklyNightHours) || 0;
    avgDailyHours = parseFloat(directAvgDailyHours) || 8;
  } else {
    weeklyHours = (p1D * p1H) + (p2D * p2H) + (p3D * p3H);
    const p1RegularDaily = Math.min(p1H, 8);
    const p2RegularDaily = Math.min(p2H, 8);
    const p3RegularDaily = Math.min(p3H, 8);
    const weeklyRegularHours = (p1D * p1RegularDaily) + (p2D * p2RegularDaily) + (p3D * p3RegularDaily);
    regularWorkHoursForBasePay = Math.min(weeklyRegularHours, 40);
    totalWeeklyDays = p1D + p2D + p3D;
    avgDailyHours = totalWeeklyDays > 0 ? regularWorkHoursForBasePay / totalWeeklyDays : 8;

    const p1DailyOvertime = Math.max(p1H - 8, 0) * p1D;
    const p2DailyOvertime = Math.max(p2H - 8, 0) * p2D;
    const p3DailyOvertime = Math.max(p3H - 8, 0) * p3D;
    const dailyOvertime = p1DailyOvertime + p2DailyOvertime + p3DailyOvertime;

    const weeklyOvertimeLimit = Math.max(weeklyRegularHours - 40, 0);
    weeklyOvertimeHours = dailyOvertime + weeklyOvertimeLimit + parseFloat(extraWeeklyOvertime);
    weeklyNightHoursVal = wNightHours;
  }

  // 주휴수당·연차유급휴가 기준: 4주 평균 1주 소정근로시간 15시간 이상 근무 (근로기준법 제18조 3항 - 미만이면 제55조·제60조 적용 제외)
  const hasWeeklyHoliday = weeklyHours >= 15;
  const weeklyHolidayHours = hasWeeklyHoliday ? (regularWorkHoursForBasePay / 40) * 8 : 0;

  // 174시간 및 209시간(174 + 35) 기준 적용을 위해 월별 시간 계산법 보완
  const monthlyRegularHours = Math.round(regularWorkHoursForBasePay * 4.35); // 40시간 -> 174시간
  const monthlyWeeklyHolidayHours = hasWeeklyHoliday ? Math.round((regularWorkHoursForBasePay / 40) * 35) : 0; // 40시간 -> 35시간

  // 5인 이상 여부
  const is5Over = companySize === '5인 이상';
  const overtimeMultiplier = is5Over ? 1.5 : 1.0;
  const nightMultiplier = is5Over ? 0.5 : 0.0;

  let hourlyWage = 0;
  let basePay = 0;
  let weeklyHolidayPay = 0;
  let overtimePay = 0;
  let nightPay = 0;
  let totalPay = 0;

  if (salaryType === '시급') {
    hourlyWage = amt;
    basePay = roundDownToTen(hourlyWage * monthlyRegularHours);
    weeklyHolidayPay = roundDownToTen(hourlyWage * monthlyWeeklyHolidayHours);
    overtimePay = roundDownToTen(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
    nightPay = roundDownToTen(hourlyWage * weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);
    totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
  } else if (salaryType === '일급') {
    const averageDailyHours = scheduleType === '직접입력' ? avgDailyHours : (totalWeeklyDays > 0 ? weeklyHours / totalWeeklyDays : 8);
    hourlyWage = averageDailyHours > 0 ? amt / averageDailyHours : 0;
    basePay = roundDownToTen(hourlyWage * monthlyRegularHours);
    weeklyHolidayPay = roundDownToTen(hourlyWage * monthlyWeeklyHolidayHours);
    overtimePay = roundDownToTen(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
    nightPay = roundDownToTen(hourlyWage * weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);
    totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
  } else if (salaryType === '주급') {
    const divisor = regularWorkHoursForBasePay + weeklyHolidayHours + (weeklyOvertimeHours * overtimeMultiplier) + (weeklyNightHoursVal * nightMultiplier);
    hourlyWage = divisor > 0 ? amt / divisor : 0;
    basePay = roundDownToTen(hourlyWage * monthlyRegularHours);
    weeklyHolidayPay = roundDownToTen(hourlyWage * monthlyWeeklyHolidayHours);
    overtimePay = roundDownToTen(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
    nightPay = roundDownToTen(hourlyWage * weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);
    totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
  } else { // 월급
    const monthlyStandardDivisor = monthlyRegularHours + monthlyWeeklyHolidayHours;
    hourlyWage = monthlyStandardDivisor > 0 ? amt / monthlyStandardDivisor : 0;

    basePay = roundDownToTen(hourlyWage * monthlyRegularHours);
    weeklyHolidayPay = roundDownToTen(hourlyWage * monthlyWeeklyHolidayHours);
    overtimePay = roundDownToTen(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
    nightPay = roundDownToTen(hourlyWage * weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);

    if (is5Over && allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)') {
      const totalMultiplierDivisor = monthlyStandardDivisor + (weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH) + (weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);
      if (totalMultiplierDivisor > 0) {
        const actualHourly = amt / totalMultiplierDivisor;
        hourlyWage = actualHourly;
        basePay = roundDownToTen(actualHourly * monthlyRegularHours);
        weeklyHolidayPay = roundDownToTen(actualHourly * monthlyWeeklyHolidayHours);
        overtimePay = roundDownToTen(actualHourly * weeklyOvertimeHours * overtimeMultiplier * AVG_WEEKS_PER_MONTH);
        nightPay = roundDownToTen(actualHourly * weeklyNightHoursVal * nightMultiplier * AVG_WEEKS_PER_MONTH);
      }
      totalPay = amt;
    } else {
      totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
    }
  }

  const allowances = calculateNonTaxableBreakdown({ mealAllowance, carAllowance, childcareAllowance, otherNonTaxable });
  const taxableAllowanceAmt = parseFloat(taxableAllowance) || 0;
  const allowancesTotal = allowances.totalAllowance + taxableAllowanceAmt;

  if (allowancesIncludedInTotal) {
    // 입력한 급여액에 수당이 이미 포함되어 있으므로 총 지급액은 그대로 두고 기본급에서만 분리해 표시
    basePay = roundDownToTen(Math.max(basePay - allowancesTotal, 0));
  } else {
    // 수당은 입력한 급여액과 별도로 추가 지급
    totalPay += allowancesTotal;
  }

  const daysVal = parseFloat(workingDaysCount) || (totalWeeklyDays * AVG_WEEKS_PER_MONTH) || 20;
  const defaultPensionBasis = pensionBasis > 0 ? pensionBasis : (basePay + weeklyHolidayPay);
  const deductions = applyDeductions(totalPay, year, defaultPensionBasis, allowances.totalNonTaxable, deductionType, daysVal);

  const monthlyTotalPay = totalPay;
  const monthlyNetPay = deductions.netPay;

  const weeklyTotalPay = roundDownToTen(monthlyTotalPay / AVG_WEEKS_PER_MONTH);
  const weeklyNetPay = roundDownToTen(monthlyNetPay / AVG_WEEKS_PER_MONTH);

  const dailyTotalPay = roundDownToTen(monthlyTotalPay / daysVal);
  const dailyNetPay = roundDownToTen(monthlyNetPay / daysVal);

  return {
    hourlyWage: roundDownToTen(hourlyWage),
    taxableAllowance: taxableAllowanceAmt,
    basePay,
    weeklyHolidayPay,
    overtimePay,
    nightPay,
    mealAllowance: allowances.meal,
    carAllowance: allowances.car,
    childcareAllowance: allowances.childcare,
    otherNonTaxable: allowances.other,
    totalNonTaxable: allowances.totalNonTaxable,
    totalTaxableExcess: allowances.totalTaxableExcess,
    totalPay,
    avgDailyHours: Math.round(avgDailyHours * 100) / 100,
    weeklyHours: Math.round(weeklyHours * 100) / 100,
    isEligibleForWeeklyBenefits: hasWeeklyHoliday, // 주 15시간 미만이면 주휴수당·연차유급휴가 모두 적용 제외
    ...deductions,
    monthlyTotalPay,
    monthlyNetPay,
    weeklyTotalPay,
    weeklyNetPay,
    dailyTotalPay,
    dailyNetPay,
    deductionType,
    workingDaysCount: daysVal,
    weeklyRegularHours: Math.round(regularWorkHoursForBasePay * 10) / 10,
    weeklyOvertimeHours: Math.round(weeklyOvertimeHours * 10) / 10,
    weeklyNightHours: Math.round(weeklyNightHoursVal * 10) / 10,
    weeklyTotalHours: Math.round((regularWorkHoursForBasePay + weeklyOvertimeHours) * 10) / 10,
    regularWorkHoursMonthly: monthlyRegularHours,
    weeklyHolidayHoursMonthly: monthlyWeeklyHolidayHours,
    overtimeHoursMonthly: Math.round(weeklyOvertimeHours * AVG_WEEKS_PER_MONTH * 10) / 10,
    nightHoursMonthly: Math.round(wNightHours * AVG_WEEKS_PER_MONTH * 10) / 10
  };
};

// 입사일 기준 오늘까지의 근속 개월수/일수
export const getTenure = (hireDateStr, refDateStr) => {
  const hireDate = new Date(hireDateStr);
  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  if (Number.isNaN(hireDate.getTime()) || Number.isNaN(refDate.getTime()) || refDate < hireDate) {
    return null;
  }
  const diffMs = refDate.getTime() - hireDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const totalYears = (refDate.getFullYear() - hireDate.getFullYear()) +
    (refDate.getMonth() - hireDate.getMonth()) / 12 +
    (refDate.getDate() - hireDate.getDate()) / 365;
  return { totalDays, totalYears: Math.max(totalYears, 0) };
};

// 연차 발생 개수 계산 (근로기준법 제60조)
export const calculateAnnualLeave = (hireDateStr, refDateStr) => {
  const tenure = getTenure(hireDateStr, refDateStr);
  if (!tenure) return null;

  const hireDate = new Date(hireDateStr);
  const refDate = refDateStr ? new Date(refDateStr) : new Date();

  // 근속 만 1년 미만: 매월 개근 시 1일씩 발생 (최대 11일)
  let monthsCompleted = (refDate.getFullYear() - hireDate.getFullYear()) * 12 + (refDate.getMonth() - hireDate.getMonth());
  if (refDate.getDate() < hireDate.getDate()) monthsCompleted -= 1;
  monthsCompleted = Math.max(0, Math.min(monthsCompleted, 11));

  if (tenure.totalYears < 1) {
    const nextMonthDate = new Date(hireDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + monthsCompleted + 1);
    return {
      isUnderOneYear: true,
      leaveDays: monthsCompleted,
      nextGrantDate: nextMonthDate.toISOString().slice(0, 10)
    };
  }

  // 근속 만 1년 이상: 최초 15일, 이후 2년마다 1일 가산 (최대 25일)
  const fullYears = Math.floor(tenure.totalYears);
  const leaveDays = Math.min(15 + Math.floor((fullYears - 1) / 2), 25);

  const nextAnniversary = new Date(hireDate);
  nextAnniversary.setFullYear(hireDate.getFullYear() + fullYears + 1);

  return {
    isUnderOneYear: false,
    leaveDays,
    fullYears,
    nextGrantDate: nextAnniversary.toISOString().slice(0, 10)
  };
};

// 퇴직금 계산 (근로기준법 제34조, 근로자퇴직급여보장법)
export const calculateSeverancePay = ({
  hireDateStr,
  resignDateStr,
  recentThreeMonthsPay, // 최근 3개월 임금 총액
  recentThreeMonthsDays, // 최근 3개월 총 일수 (달력일 기준)
  annualBonus = 0, // 최근 1년간 지급된 상여금 총액
  annualLeavePay = 0 // 최근 1년간 지급된 연차수당 총액
}) => {
  const tenure = getTenure(hireDateStr, resignDateStr);
  if (!tenure) return null;

  const pay = parseFloat(recentThreeMonthsPay) || 0;
  const days = parseFloat(recentThreeMonthsDays) || 0;
  const bonus = parseFloat(annualBonus) || 0;
  const leavePay = parseFloat(annualLeavePay) || 0;

  if (days <= 0) {
    return { totalDays: tenure.totalDays, isEligible: tenure.totalDays >= 365, averageDailyWage: 0, severancePay: 0 };
  }

  const averageDailyWage = (pay + (bonus * 3 / 12) + (leavePay * 3 / 12)) / days;
  const severancePay = roundDownToTen(averageDailyWage * 30 * (tenure.totalDays / 365));

  return {
    totalDays: tenure.totalDays,
    isEligible: tenure.totalDays >= 365,
    averageDailyWage: roundDownToTen(averageDailyWage),
    severancePay: Math.max(severancePay, 0)
  };
};

// 주휴수당 계산 (근로기준법 제55조)
export const calculateWeeklyHolidayPay = ({ hourlyWage, weeklyWorkDays, weeklyWorkHours }) => {
  const wage = parseFloat(hourlyWage) || 0;
  const days = parseFloat(weeklyWorkDays) || 0;
  const hours = parseFloat(weeklyWorkHours) || 0;

  const isEligible = hours >= 15 && days > 0;
  if (!isEligible) {
    return { isEligible: false, dailyGrantHours: 0, weeklyHolidayPay: 0, averageDailyHours: 0 };
  }

  const averageDailyHours = Math.min(hours / days, 8);
  const dailyGrantHours = Math.min((hours / 40) * 8, 8);
  const weeklyHolidayPay = roundDownToTen(wage * dailyGrantHours);

  return { isEligible: true, dailyGrantHours: Math.round(dailyGrantHours * 100) / 100, weeklyHolidayPay, averageDailyHours };
};

// 4대보험 사업주 부담금 계산 (참고용 개략치)
export const calculateEmployerInsurance = ({ monthlyWage, industrialAccidentRate = 0.7, year = 2026 }) => {
  const wage = parseFloat(monthlyWage) || 0;
  const accidentRate = parseFloat(industrialAccidentRate) || 0;

  const rates = getDeductionRatesForYear(year);

  const nationalPension = roundDownToTen(wage * rates.pension); // 사업주 4.5% (근로자와 동일 분담)
  const healthInsurance = roundDownToTen(wage * rates.health); // 사업주 건강보험
  const longTermCare = roundDownToTen(healthInsurance * rates.care); // 장기요양보험
  const employmentInsuranceBase = roundDownToTen(wage * rates.employment); // 실업급여 사업주분
  const employmentStabilityFund = roundDownToTen(wage * 0.0025); // 고용안정·직업능력개발사업
  const employmentInsurance = employmentInsuranceBase + employmentStabilityFund;
  const industrialAccidentInsurance = roundDownToTen(wage * (accidentRate / 100)); // 업종별 상이, 전액 사업주 부담

  const totalEmployerBurden = nationalPension + healthInsurance + longTermCare + employmentInsurance + industrialAccidentInsurance;

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsuranceBase,
    employmentStabilityFund,
    employmentInsurance,
    industrialAccidentInsurance,
    totalEmployerBurden
  };
};

// 연도별 급여 이력 항목 계산 (해당 연도 급여액 + 근무패턴 기준, 연차일수/휴일근로일수 연간 기준 1/12 분할 반영)
// salaryType: '시급' | '일급' | '주급' | '월급' - salaryAmount는 해당 급여 구분의 금액
export const calculateYearlyEntryPay = ({
  year,
  companySize,
  salaryType = '시급',
  salaryAmount,
  allowanceIncluded,
  pattern1Days, pattern1Hours,
  pattern2Days = 0, pattern2Hours = 0,
  pattern3Days = 0, pattern3Hours = 0,
  weeklyNightHours = 0,
  annualLeaveDays = 0, // 연간 연차일수 (1/12 분할 자동 산정)
  holidayWorkDays = 0, // 연간 휴일근로일수 (1/12 분할 자동 산정)
  pensionBasis = 0,
  extraWeeklyOvertime = 0,
  mealAllowance = 0,
  carAllowance = 0,
  childcareAllowance = 0,
  otherNonTaxable = 0,
  taxableAllowance = 0,
  allowancesIncludedInTotal = false,
  scheduleType = '패턴별',
  directWeeklyWorkDays = 5,
  directWeeklyRegularHours = 40,
  directWeeklyOvertimeHours = 0,
  directWeeklyNightHours = 0,
  directAvgDailyHours = 8,
  deductionType = '4대보험',
  workingDaysCount = 0
}) => {
  const breakdown = calculateSalaryBreakdown({
    salaryType,
    salaryAmount,
    companySize,
    allowanceIncluded,
    pattern1Days, pattern1Hours,
    pattern2Days, pattern2Hours,
    pattern3Days, pattern3Hours,
    weeklyNightHours,
    year,
    pensionBasis,
    extraWeeklyOvertime,
    mealAllowance,
    carAllowance,
    childcareAllowance,
    otherNonTaxable,
    taxableAllowance,
    allowancesIncludedInTotal,
    scheduleType,
    directWeeklyWorkDays,
    directWeeklyRegularHours,
    directWeeklyOvertimeHours,
    directWeeklyNightHours,
    directAvgDailyHours,
    deductionType,
    workingDaysCount
  });

  const is5Over = companySize === '5인 이상';
  // 휴일근로수당/연차수당 1/12 분할 지급 산정 및 최저임금 준수 여부 판단에는
  // 입력 급여 구분과 무관하게 산출된 실제 시급을 기준으로 삼는다
  const wage = breakdown.hourlyWage;
  // 1일 소정근로시간도 8시간 고정이 아닌, 입력한 근무 패턴 기준 평균 소정근로시간을 사용
  // (단시간근로자의 경우 실제 근로시간에 비례해 연차·휴일근로수당이 산정됨)
  const dailyHours = breakdown.avgDailyHours;

  // 휴일근로수당 연간 일수 기준 1/12 분할 지급
  // 하루 8시간 이내분은 50% 가산, 8시간 초과분은 100% 가산 (근로기준법 제56조 2항)
  const holidayWorkHoursMonthly = (parseFloat(holidayWorkDays) || 0) * dailyHours / 12;
  const holidayDayPay = calculateHolidayDayPay(dailyHours, wage, is5Over);
  const holidayWorkPay = roundDownToTen((parseFloat(holidayWorkDays) || 0) * holidayDayPay / 12);

  // 연차수당 연간 일수 기준 1/12 분할 지급
  // 4주 평균 주 15시간 미만 근로자는 근로기준법 제18조 3항에 따라 연차유급휴가(제60조) 적용 제외
  const leavePayHoursMonthly = breakdown.isEligibleForWeeklyBenefits ? (parseFloat(annualLeaveDays) || 0) * dailyHours / 12 : 0;
  const leavePayMonthly = roundDownToTen(leavePayHoursMonthly * wage);

  const grossTotal = breakdown.totalPay + leavePayMonthly + holidayWorkPay;
  const defaultPensionBasis = pensionBasis > 0 ? pensionBasis : (breakdown.basePay + breakdown.weeklyHolidayPay);

  const daysVal = parseFloat(workingDaysCount) || (breakdown.workingDaysCount) || 20;
  const deductions = applyDeductions(grossTotal, year, defaultPensionBasis, breakdown.totalNonTaxable, deductionType, daysVal);

  const minWage = getMinWageForYear(year);
  const isMinWageCompliant = wage >= minWage;

  const monthlyTotalPay = grossTotal;
  const monthlyNetPay = deductions.netPay;

  const weeklyTotalPay = roundDownToTen(monthlyTotalPay / AVG_WEEKS_PER_MONTH);
  const weeklyNetPay = roundDownToTen(monthlyNetPay / AVG_WEEKS_PER_MONTH);

  const dailyTotalPay = roundDownToTen(monthlyTotalPay / daysVal);
  const dailyNetPay = roundDownToTen(monthlyNetPay / daysVal);

  return {
    year,
    companySize,
    salaryType,
    baseHourlyWage: wage,
    minWage,
    isMinWageCompliant,
    basePay: breakdown.basePay,
    weeklyHolidayPay: breakdown.weeklyHolidayPay,
    overtimePay: breakdown.overtimePay,
    nightPay: breakdown.nightPay,
    mealAllowance: breakdown.mealAllowance,
    carAllowance: breakdown.carAllowance,
    childcareAllowance: breakdown.childcareAllowance,
    otherNonTaxable: breakdown.otherNonTaxable,
    totalNonTaxable: breakdown.totalNonTaxable,
    totalTaxableExcess: breakdown.totalTaxableExcess,
    taxableAllowance: breakdown.taxableAllowance,
    leavePayMonthly,
    holidayWorkPay,
    avgDailyHours: dailyHours,
    grossTotal,
    ...deductions,
    grossAnnual: grossTotal * 12,
    netAnnual: deductions.netPay * 12,
    regularWorkHoursMonthly: breakdown.regularWorkHoursMonthly,
    weeklyHolidayHoursMonthly: breakdown.weeklyHolidayHoursMonthly,
    overtimeHoursMonthly: breakdown.overtimeHoursMonthly,
    nightHoursMonthly: breakdown.nightHoursMonthly,
    leavePayHoursMonthly: Math.round(leavePayHoursMonthly * 100) / 100,
    holidayWorkHoursMonthly: Math.round(holidayWorkHoursMonthly * 100) / 100,
    weeklyHours: breakdown.weeklyHours,
    weeklyRegularHours: breakdown.weeklyRegularHours,
    weeklyOvertimeHours: breakdown.weeklyOvertimeHours,
    weeklyNightHours: breakdown.weeklyNightHours,
    isEligibleForWeeklyBenefits: breakdown.isEligibleForWeeklyBenefits,
    monthlyTotalPay,
    monthlyNetPay,
    weeklyTotalPay,
    weeklyNetPay,
    dailyTotalPay,
    dailyNetPay,
    deductionType,
    workingDaysCount: daysVal
  };
};

// "1시간 30분" 형태로 표시
export const formatMinutesAsHM = (totalMinutes) => {
  const m = Math.max(Math.round(totalMinutes), 0);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}분`;
  if (rest === 0) return `${h}시간`;
  return `${h}시간 ${rest}분`;
};

