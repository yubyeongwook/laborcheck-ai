import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText, Building2, Clock, Clipboard, Check, Download, Briefcase,
  AlertCircle, Coins, Calendar, FileSignature, Upload, X, FileImage, FileVideo, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateHoursAndNightHours, NON_TAXABLE_MONTHLY_CAP, calculateElapsedHours, getStatutoryBreakMinutes, makeAutoBreakHandlers, formatMinutesAsHM } from '../utils/laborCalc.js';
import LaborInfoSync from '../components/LaborInfoSync.jsx';
import UsageGuide from '../components/UsageGuide.jsx';

const LOADING_TIPS = [
  "근로기준법 제18조: 4주 동안 평균하여 1주 동안의 소정근로시간이 15시간 미만인 근로자에게는 주휴수당 규정이 적용되지 않습니다.",
  "근로기준법 제23조: 5인 이상 사업장에서는 정당한 이유 없이 근로자를 해고할 수 없으나, 5인 미만 사업장은 해고 제한 규정이 적용되지 않습니다.",
  "근로기준법 제56조: 5인 이상 사업장은 연장·야간·휴일근로에 대해 50% 이상의 가산수당을 지급해야 합니다.",
  "최저임금법 제6조: 모든 사업주는 근로자에게 고용노동부장관이 고시한 최저임금액 이상의 임금을 지급해야 합니다.",
  "근로기준법 제17조: 근로계약서 미작성 및 미교부는 500만원 이하의 벌금 또는 과태료 처분을 받을 수 있습니다."
];

function ReportGenerator({ userType }) {
  const { session, user, setAuthError, setShowLoginModal } = useAuth();
  const isWorker = userType === '근로자';
  
  // 유료화 연동 플래그 (향후 결제 연동 도입 시 true로 설정)
  const REQUIRE_PAYMENT = false;

  const [companySize, setCompanySize] = useState('5인 이상');
  const [salaryType, setSalaryType] = useState('월급');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [allowanceIncluded, setAllowanceIncluded] = useState('확인불가');
  const [pattern1Days, setPattern1Days] = useState('5');
  const [pattern1Hours, setPattern1Hours] = useState('8');
  const [pattern2Days, setPattern2Days] = useState('0');
  const [pattern2Hours, setPattern2Hours] = useState('0');
  const [pattern3Days, setPattern3Days] = useState('0');
  const [pattern3Hours, setPattern3Hours] = useState('0');
  const [weeklyNightHours, setWeeklyNightHours] = useState('0');
  const [breakTime, setBreakTime] = useState('60');
  const [breakTimeAuto, setBreakTimeAuto] = useState(true);
  const [pensionBasis, setPensionBasis] = useState('');
  const [extraWeeklyOvertime, setExtraWeeklyOvertime] = useState('');
  const [holidayWorkDays, setHolidayWorkDays] = useState('');
  const [annualLeaveDays, setAnnualLeaveDays] = useState('');
  const [mealAllowance, setMealAllowance] = useState('');
  const [carAllowance, setCarAllowance] = useState('');
  const [childcareAllowance, setChildcareAllowance] = useState('');
  const [otherNonTaxable, setOtherNonTaxable] = useState('');
  const [taxableAllowance, setTaxableAllowance] = useState('');
  const [deductionType, setDeductionType] = useState('4대보험');

  // 직접 입력형 상태
  const [scheduleType, setScheduleType] = useState('패턴별');
  const [activeDay, setActiveDay] = useState('mon');

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

  const [pattern1Start, setPattern1Start] = useState('09:00');
  const [pattern1End, setPattern1End] = useState('18:00');
  const [pattern2Start, setPattern2Start] = useState('09:00');
  const [pattern2End, setPattern2End] = useState('18:00');
  const [pattern3Start, setPattern3Start] = useState('09:00');
  const [pattern3End, setPattern3End] = useState('18:00');

  const handleLoadInfo = (loaded) => {
    if (loaded.companySize) setCompanySize(loaded.companySize);
    if (loaded.salaryType) setSalaryType(loaded.salaryType);
    if (loaded.salaryAmount) setSalaryAmount(loaded.salaryAmount);
    if (loaded.allowanceIncluded) setAllowanceIncluded(loaded.allowanceIncluded);
    if (loaded.pattern1Days) setPattern1Days(loaded.pattern1Days);
    if (loaded.pattern1Start) setPattern1Start(loaded.pattern1Start);
    if (loaded.pattern1End) setPattern1End(loaded.pattern1End);
    
    const loadedBreakMin = (parseFloat(loaded.pattern1BreakH) || 0) * 60 + (parseFloat(loaded.pattern1BreakM) || 0);
    if (loadedBreakMin > 0) setBreakTime(String(loadedBreakMin));

    if (loaded.pensionBasis) setPensionBasis(loaded.pensionBasis);
    if (loaded.extraWeeklyOvertime) setExtraWeeklyOvertime(loaded.extraWeeklyOvertime);
    if (loaded.holidayWorkDays) setHolidayWorkDays(loaded.holidayWorkDays);
    if (loaded.annualLeaveDays) setAnnualLeaveDays(loaded.annualLeaveDays);
    
    if (loaded.mealAllowance) setMealAllowance(loaded.mealAllowance);
    if (loaded.carAllowance) setCarAllowance(loaded.carAllowance);
    if (loaded.childcareAllowance) setChildcareAllowance(loaded.childcareAllowance);
    if (loaded.otherNonTaxable) setOtherNonTaxable(loaded.otherNonTaxable);
    if (loaded.taxableAllowance) setTaxableAllowance(loaded.taxableAllowance);
    
    if (loaded.pattern2Days !== undefined) setPattern2Days(loaded.pattern2Days);
    if (loaded.pattern2Start) setPattern2Start(loaded.pattern2Start);
    if (loaded.pattern2End) setPattern2End(loaded.pattern2End);
    
    if (loaded.pattern3Days !== undefined) setPattern3Days(loaded.pattern3Days);
    if (loaded.pattern3Start) setPattern3Start(loaded.pattern3Start);
    if (loaded.pattern3End) setPattern3End(loaded.pattern3End);

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

    if (loaded.scheduleType) setScheduleType(loaded.scheduleType);
    if (loaded.directWeeklyWorkDays) setDirectWeeklyWorkDays(loaded.directWeeklyWorkDays);
    if (loaded.directWeeklyRegularHours) setDirectWeeklyRegularHours(loaded.directWeeklyRegularHours);
    if (loaded.directWeeklyOvertimeHours) setDirectWeeklyOvertimeHours(loaded.directWeeklyOvertimeHours);
    if (loaded.directWeeklyNightHours) setDirectWeeklyNightHours(loaded.directWeeklyNightHours);
    if (loaded.directAvgDailyHours) setDirectAvgDailyHours(loaded.directAvgDailyHours);
    if (loaded.deductionType) setDeductionType(loaded.deductionType);
  };

  const currentInfo = {
    companySize,
    salaryType,
    salaryAmount,
    allowanceIncluded,
    pattern1Days,
    pattern1Start,
    pattern1End,
    pattern1BreakH: String(Math.floor(parseFloat(breakTime) / 60) || 0),
    pattern1BreakM: String(parseFloat(breakTime) % 60 || 0),
    pattern2Days,
    pattern2Start,
    pattern2End,
    pattern2BreakH: String(Math.floor(parseFloat(breakTime) / 60) || 0),
    pattern2BreakM: String(parseFloat(breakTime) % 60 || 0),
    pattern3Days,
    pattern3Start,
    pattern3End,
    pattern3BreakH: String(Math.floor(parseFloat(breakTime) / 60) || 0),
    pattern3BreakM: String(parseFloat(breakTime) % 60 || 0),
    
    // 요일별 설정 포함
    monActive, monStart, monEnd, monBreakH, monBreakM, monNightBreakH, monNightBreakM,
    tueActive, tueStart, tueEnd, tueBreakH, tueBreakM, tueNightBreakH, tueNightBreakM,
    wedActive, wedStart, wedEnd, wedBreakH, wedBreakM, wedNightBreakH, wedNightBreakM,
    thuActive, thuStart, thuEnd, thuBreakH, thuBreakM, thuNightBreakH, thuNightBreakM,
    friActive, friStart, friEnd, friBreakH, friBreakM, friNightBreakH, friNightBreakM,
    satActive, satStart, satEnd, satBreakH, satBreakM, satNightBreakH, satNightBreakM,
    sunActive, sunStart, sunEnd, sunBreakH, sunBreakM, sunNightBreakH, sunNightBreakM,
 
    pensionBasis,
    extraWeeklyOvertime,
    holidayWorkDays,
    annualLeaveDays,
    mealAllowance,
    carAllowance,
    childcareAllowance,
    otherNonTaxable,
    taxableAllowance,
    scheduleType,
    directWeeklyWorkDays,
    directWeeklyRegularHours,
    directWeeklyOvertimeHours,
    directWeeklyNightHours,
    directAvgDailyHours,
    deductionType
  };

  const isDirect = scheduleType === '직접입력';
  const isWeekly = scheduleType === '요일별';

  // 요일별 스케줄 정보 집계용 매핑 객체 (각 요일의 실제 휴게시간 입력값을 사용)
  const daysState = {
    mon: { active: monActive, start: monStart, end: monEnd, breakMinutes: (parseFloat(monBreakH) || 0) * 60 + (parseFloat(monBreakM) || 0), nightBreakMinutes: (parseFloat(monNightBreakH) || 0) * 60 + (parseFloat(monNightBreakM) || 0) },
    tue: { active: tueActive, start: tueStart, end: tueEnd, breakMinutes: (parseFloat(tueBreakH) || 0) * 60 + (parseFloat(tueBreakM) || 0), nightBreakMinutes: (parseFloat(tueNightBreakH) || 0) * 60 + (parseFloat(tueNightBreakM) || 0) },
    wed: { active: wedActive, start: wedStart, end: wedEnd, breakMinutes: (parseFloat(wedBreakH) || 0) * 60 + (parseFloat(wedBreakM) || 0), nightBreakMinutes: (parseFloat(wedNightBreakH) || 0) * 60 + (parseFloat(wedNightBreakM) || 0) },
    thu: { active: thuActive, start: thuStart, end: thuEnd, breakMinutes: (parseFloat(thuBreakH) || 0) * 60 + (parseFloat(thuBreakM) || 0), nightBreakMinutes: (parseFloat(thuNightBreakH) || 0) * 60 + (parseFloat(thuNightBreakM) || 0) },
    fri: { active: friActive, start: friStart, end: friEnd, breakMinutes: (parseFloat(friBreakH) || 0) * 60 + (parseFloat(friBreakM) || 0), nightBreakMinutes: (parseFloat(friNightBreakH) || 0) * 60 + (parseFloat(friNightBreakM) || 0) },
    sat: { active: satActive, start: satStart, end: satEnd, breakMinutes: (parseFloat(satBreakH) || 0) * 60 + (parseFloat(satBreakM) || 0), nightBreakMinutes: (parseFloat(satNightBreakH) || 0) * 60 + (parseFloat(satNightBreakM) || 0) },
    sun: { active: sunActive, start: sunStart, end: sunEnd, breakMinutes: (parseFloat(sunBreakH) || 0) * 60 + (parseFloat(sunBreakM) || 0), nightBreakMinutes: (parseFloat(sunNightBreakH) || 0) * 60 + (parseFloat(sunNightBreakM) || 0) }
  };

  let weeklyHoursFromDays = 0;
  let weeklyNightHoursFromDays = 0;
  let totalWeeklyDaysFromDays = 0;

  if (isWeekly) {
    Object.keys(daysState).forEach(day => {
      const d = daysState[day];
      if (d.active === true || d.active === 'true') {
        const calc = calculateHoursAndNightHours(d.start, d.end, d.breakMinutes, d.nightBreakMinutes);
        weeklyHoursFromDays += calc.workHours;
        weeklyNightHoursFromDays += calc.nightHours;
        totalWeeklyDaysFromDays += 1;
      }
    });
  }

  useEffect(() => {
    const p1 = calculateHoursAndNightHours(pattern1Start, pattern1End, breakTime);
    const p2 = calculateHoursAndNightHours(pattern2Start, pattern2End, breakTime);
    const p3 = calculateHoursAndNightHours(pattern3Start, pattern3End, breakTime);

    setPattern1Hours(p1.workHours.toString());
    setPattern2Hours(p2.workHours.toString());
    setPattern3Hours(p3.workHours.toString());

    if (scheduleType === '요일별') {
      let totalWeeklyNight = 0;
      Object.keys(daysState).forEach(d => {
        const active = daysState[d].active === true || daysState[d].active === 'true';
        if (active) {
          const calc = calculateHoursAndNightHours(daysState[d].start, daysState[d].end, daysState[d].breakMinutes, daysState[d].nightBreakMinutes);
          totalWeeklyNight += calc.nightHours;
        }
      });
      setWeeklyNightHours((Math.round(totalWeeklyNight * 100) / 100).toString());
    } else {
      const p1DaysNum = parseFloat(pattern1Days) || 0;
      const p2DaysNum = parseFloat(pattern2Days) || 0;
      const p3DaysNum = parseFloat(pattern3Days) || 0;
      const totalWeeklyNight = (p1.nightHours * p1DaysNum) + (p2.nightHours * p2DaysNum) + (p3.nightHours * p3DaysNum);
      setWeeklyNightHours((Math.round(totalWeeklyNight * 100) / 100).toString());
    }
  }, [
    pattern1Start, pattern1End, pattern2Start, pattern2End, pattern3Start, pattern3End, breakTime, pattern1Days, pattern2Days, pattern3Days,
    scheduleType, monActive, monStart, monEnd, monBreakH, monBreakM, tueActive, tueStart, tueEnd, tueBreakH, tueBreakM, wedActive, wedStart, wedEnd, wedBreakH, wedBreakM, thuActive, thuStart, thuEnd, thuBreakH, thuBreakM, friActive, friStart, friEnd, friBreakH, friBreakM, satActive, satStart, satEnd, satBreakH, satBreakM, sunActive, sunStart, sunEnd, sunBreakH, sunBreakM
  ]);

  // 패턴1 출퇴근 시간 변경 시, 사용자가 휴게시간을 직접 수정한 적이 없다면(Auto 플래그) 공용 휴게시간(분)을 자동 재계산
  const pattern1BreakTimeHandlers = {
    onStartChange: (value) => {
      setPattern1Start(value);
      if (breakTimeAuto) setBreakTime(String(getStatutoryBreakMinutes(calculateElapsedHours(value, pattern1End))));
    },
    onEndChange: (value) => {
      setPattern1End(value);
      if (breakTimeAuto) setBreakTime(String(getStatutoryBreakMinutes(calculateElapsedHours(pattern1Start, value))));
    },
    onBreakTimeChange: (value) => { setBreakTime(value); setBreakTimeAuto(false); }
  };

  const p1Days = parseFloat(pattern1Days) || 0;
  const p1Hours = parseFloat(pattern1Hours) || 0;
  const p2Days = parseFloat(pattern2Days) || 0;
  const p2Hours = parseFloat(pattern2Hours) || 0;
  const p3Days = parseFloat(pattern3Days) || 0;
  const p3Hours = parseFloat(pattern3Hours) || 0;

  const weeklyDays = isDirect 
    ? (parseFloat(directWeeklyWorkDays) || 5) 
    : isWeekly 
      ? totalWeeklyDaysFromDays 
      : (p1Days + p2Days + p3Days);

  const dailyHours = isDirect 
    ? (parseFloat(directAvgDailyHours) || 8) 
    : isWeekly 
      ? (totalWeeklyDaysFromDays > 0 ? weeklyHoursFromDays / totalWeeklyDaysFromDays : 0) 
      : (weeklyDays > 0 ? ((p1Days * p1Hours) + (p2Days * p2Hours) + (p3Days * p3Hours)) / weeklyDays : 0);

  const [fileBase64, setFileBase64] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const [workHours, setWorkHours] = useState('');
  const [issueText, setIssueText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSendingKakao, setIsSendingKakao] = useState(false);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 최대 10MB까지 업로드 가능합니다.');
      return;
    }
    setFileName(file.name);
    setFileMime(file.type);
    setError('');
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result);
      if (file.type.startsWith('image/')) setFilePreview(reader.result);
      else setFilePreview('');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files[0]); };
  const handleRemoveFile = () => {
    setFileBase64(''); setFileMime(''); setFileName(''); setFilePreview('');
    setIsScanning(false); setScanComplete(false);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!salaryAmount.trim()) { setError('급여 금액을 입력해 주세요.'); return; }
    if (!issueText.trim()) { setError('상세 사연(쟁점 사항)을 입력해 주세요.'); return; }

    setIsLoading(true);
    setError('');
    setReport('');
    setLoadingTipIndex(0);

    const payload = {
      user_type: userType,
      company_size: companySize,
      salary_type: salaryType,
      salary_amount: salaryAmount,
      allowance_included: companySize === '5인 이상' ? allowanceIncluded : '해당 없음 (5인 미만)',
      pattern1_days: Number(pattern1Days),
      pattern1_hours: Number(pattern1Hours),
      pattern2_days: Number(pattern2Days),
      pattern2_hours: Number(pattern2Hours),
      pattern3_days: Number(pattern3Days),
      pattern3_hours: Number(pattern3Hours),
      weekly_night_hours: Number(weeklyNightHours),
      daily_hours: Number(dailyHours),
      weekly_days: Number(weeklyDays),
      break_time: Number(breakTime),
      pension_basis: pensionBasis ? Number(pensionBasis) : 0,
      extra_weekly_overtime: extraWeeklyOvertime ? Number(extraWeeklyOvertime) : 0,
      holiday_work_days: holidayWorkDays ? Number(holidayWorkDays) : 0,
      annual_leave_days: annualLeaveDays ? Number(annualLeaveDays) : 0,
      meal_allowance: mealAllowance ? Number(mealAllowance) : 0,
      car_allowance: carAllowance ? Number(carAllowance) : 0,
      childcare_allowance: childcareAllowance ? Number(childcareAllowance) : 0,
      other_non_taxable: otherNonTaxable ? Number(otherNonTaxable) : 0,
      taxable_allowance: taxableAllowance ? Number(taxableAllowance) : 0,
      work_hours: workHours,
      issue_text: issueText,
      file_data: fileBase64,
      file_mime: fileMime,
      schedule_type: scheduleType,
      direct_weekly_work_days: Number(directWeeklyWorkDays),
      direct_weekly_regular_hours: Number(directWeeklyRegularHours),
      direct_weekly_overtime_hours: Number(directWeeklyOvertimeHours),
      direct_weekly_night_hours: Number(directWeeklyNightHours),
      direct_avg_daily_hours: Number(directAvgDailyHours),
      deduction_type: deductionType,
      
      // 요일별 상세 데이터
      mon_active: monActive, mon_start: monStart, mon_end: monEnd, mon_break_h: Number(monBreakH), mon_break_m: Number(monBreakM), mon_night_break_h: Number(monNightBreakH), mon_night_break_m: Number(monNightBreakM),
      tue_active: tueActive, tue_start: tueStart, tue_end: tueEnd, tue_break_h: Number(tueBreakH), tue_break_m: Number(tueBreakM), tue_night_break_h: Number(tueNightBreakH), tue_night_break_m: Number(tueNightBreakM),
      wed_active: wedActive, wed_start: wedStart, wed_end: wedEnd, wed_break_h: Number(wedBreakH), wed_break_m: Number(wedBreakM), wed_night_break_h: Number(wedNightBreakH), wed_night_break_m: Number(wedNightBreakM),
      thu_active: thuActive, thu_start: thuStart, thu_end: thuEnd, thu_break_h: Number(thuBreakH), thu_break_m: Number(thuBreakM), thu_night_break_h: Number(thuNightBreakH), thu_night_break_m: Number(thuNightBreakM),
      fri_active: friActive, fri_start: friStart, fri_end: friEnd, fri_break_h: Number(friBreakH), fri_break_m: Number(friBreakM), fri_night_break_h: Number(friNightBreakH), fri_night_break_m: Number(friNightBreakM),
      sat_active: satActive, sat_start: satStart, sat_end: satEnd, sat_break_h: Number(satBreakH), sat_break_m: Number(satBreakM), sat_night_break_h: Number(satNightBreakH), sat_night_break_m: Number(satNightBreakM),
      sun_active: sunActive, sun_start: sunStart, sun_end: sunEnd, sun_break_h: Number(sunBreakH), sun_break_m: Number(sunBreakM), sun_night_break_h: Number(sunNightBreakH), sun_night_break_m: Number(sunNightBreakM)
    };

    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.xn--ai-h74ir53a94vh9e.com';
      const response = await fetch(`${apiBaseUrl}/api/generate-report`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리포트 생성에 실패했습니다.');
      }
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      console.error(err);
      setError(err.message || '서버와의 통신 도중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!report) return;
    if (!user) {
      setAuthError('리포트 복사는 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrintPDF = () => {
    if (!user) {
      setAuthError('PDF 다운로드는 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }

    if (REQUIRE_PAYMENT) {
      // 결제 체크 플레이스홀더 (향후 결제 연동 완료 후 상태 확인 적용)
      const hasPaid = false; 
      if (!hasPaid) {
        alert('이 기능은 결제가 필요한 서비스입니다. 결제 모듈을 연동해 주세요.');
        return;
      }
    }

    window.print();
  };

  const handleSendViaKakao = async () => {
    if (!report) return;
    if (!user) {
      setAuthError('카카오톡 자료 수신은 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }

    if (REQUIRE_PAYMENT) {
      // 결제 체크 플레이스홀더 (향후 결제 연동 완료 후 상태 확인 적용)
      const hasPaid = false;
      if (!hasPaid) {
        alert('이 기능은 결제가 필요한 서비스입니다. 결제 모듈을 연동해 주세요.');
        return;
      }
    }

    const defaultPhone = user?.user_metadata?.phone_number || '';
    const phone = prompt('자료를 전송받을 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)', defaultPhone);
    
    if (phone === null) return; // 취소
    if (!phone.trim()) {
      alert('휴대폰 번호를 입력해 주세요.');
      return;
    }

    try {
      setIsSendingKakao(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/send-kakao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          phone: phone,
          type: 'download',
          data: {
            title: `${userType || '노무'} 자가진단 리포트 결과`
          }
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || '알림톡 전송에 실패했습니다.');
      }
      
      alert('입력하신 휴대폰 번호의 카카오톡으로 자료 다운로드 링크가 발송되었습니다!');
    } catch (err) {
      alert(err.message || '전송 실패');
    } finally {
      setIsSendingKakao(false);
    }
  };

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

  const renderPattern = (label, days, setDays, start, setStart, end, setEnd, hours) => (
    <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주 근무일수</span>
          <input type="number" className="text-input" value={days} onChange={(e) => setDays(e.target.value)} min="0" max="7" />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
          <TimeSelectInput value={start} onChange={setStart} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
          <TimeSelectInput value={end} onChange={setEnd} />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
        하루 근로시간: <strong>{formatMinutesAsHM(hours * 60)}</strong> (휴게 {formatMinutesAsHM(breakTime)} 제외)
      </div>
    </div>
  );

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
          const isNightBreakMinutes = (parseFloat(item.nightBreakH) || 0) * 60 + (parseFloat(item.nightBreakM) || 0);
          const totalBreakMinutes = isBreakMinutes + isNightBreakMinutes;
          const elapsed = calculateElapsedHours(item.start, item.end);
          const workHours = Math.max(0, elapsed - totalBreakMinutes / 60);

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
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주간(일반) 휴게시간</span>
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
                실근로시간: <strong>{formatMinutesAsHM(workHours * 60)}</strong> (휴게 {formatMinutesAsHM(totalBreakMinutes)} 제외)
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title">
          <FileText size={26} color="#38bdf8" /> {isWorker ? 'AI 자가진단 리포트 (근로자용)' : 'AI 리스크 진단 리포트 (사업주용)'}
        </h1>
        <p className="tool-page-desc">
          {isWorker
            ? '근무 조건과 겪고 계신 쟁점을 입력하면 관련 법령을 대조해 권리 구제 방향을 정리해 드립니다.'
            : '사업장의 급여·근로시간 조건을 입력하면 법 위반 리스크와 대응 체크리스트를 정리해 드립니다.'}
        </p>
      </div>

      <UsageGuide guideKey={isWorker ? 'workerReport' : 'employerReport'} />

      <LaborInfoSync onLoad={handleLoadInfo} currentInfo={currentInfo} />

      <main className="main-container">

        <section className="glass-panel">
          <form onSubmit={handleGenerateReport}>
            <div className="form-group">
              <label className="form-label"><Building2 size={16} /> 사업장 규모</label>
              <div className="radio-group">
                <div className={`radio-card ${companySize === '5인 미만' ? 'active' : ''}`} onClick={() => setCompanySize('5인 미만')}>
                  <span className="radio-card-title">5인 미만</span>
                  <span className="radio-card-desc">일부 규정 적용 제외</span>
                </div>
                <div className={`radio-card ${companySize === '5인 이상' ? 'active' : ''}`} onClick={() => setCompanySize('5인 이상')}>
                  <span className="radio-card-title">5인 이상</span>
                  <span className="radio-card-desc">가산 수당 및 연차 적용</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label"><Coins size={16} color="#f59e0b" /> 급여 구분 및 금액</label>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                <select className="text-input" value={salaryType} onChange={(e) => setSalaryType(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                  <option value="시급">시급</option>
                  <option value="일급">일급</option>
                  <option value="주급">주급</option>
                  <option value="월급">월급</option>
                </select>
                <input type="number" className="text-input" placeholder="금액 입력 (예: 2500000)" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label"><Coins size={16} color="#34d399" /> 공제 구분 (세금/보험)</label>
              <select className="text-input" value={deductionType} onChange={(e) => setDeductionType(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                <option value="4대보험">4대보험 적용 (국민/건강/장기요양/고용보험 + 근소세)</option>
                <option value="3.3%">3.3% 프리랜서 원천징수 (사업소득세)</option>
                <option value="일용직">일용직 적용 (고용보험 0.9% + 소액부징수법 반영 소득세)</option>
              </select>
            </div>

            {companySize === '5인 이상' && (
              <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '1.25rem', borderRadius: '16px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                <label className="form-label" style={{ color: '#a5b4fc', fontWeight: 'bold' }}><FileSignature size={16} /> 근로계약서 수당 포함 여부</label>
                <select className="text-input" value={allowanceIncluded} onChange={(e) => setAllowanceIncluded(e.target.value)}>
                  <option value="확인불가">계약서 조항 확인 불가 / 모름</option>
                  <option value="기본급 외 수당 모두 포함 (포괄임금)">수당 모두 포함 (포괄임금제 형태)</option>
                  <option value="기본급 외 일부 수당만 포함">일부 수당만 급여에 포함</option>
                  <option value="포함되지 않음 (기본급 기준 연장수당 별도 계산)">포함 안 됨 (연장 등 수당 매월 별도 계산)</option>
                  <option value="근로계약서 작성 안 함">근로계약서를 작성하지 않음</option>
                </select>
              </div>
            )}

            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
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
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>국민연금 기준소득월액 (선택, 원)</span>
                    <input type="number" className="text-input" placeholder="예: 2500000" value={pensionBasis} onChange={(e) => setPensionBasis(e.target.value)} min="0" />
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 국민연금 기준소득월액 미입력 시에는 소정근로 계약급(기본급+주휴수당) 기준으로 자동 산출됩니다.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주당 추가 연장근로시간 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 5" value={extraWeeklyOvertime} onChange={(e) => setExtraWeeklyOvertime(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 휴일근로 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 12" value={holidayWorkDays} onChange={(e) => setHolidayWorkDays(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 연차유급 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 매주 고정적으로 발생하는 추가 연장근로, 연간 휴일근로 일수, 연간 연차유급 일수가 있다면 입력하세요. AI 진단 리포트에 반영됩니다.
                  </p>
                  {weeklyDays > 6 && (
                    <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                      요일별 근무일수 합계가 {weeklyDays}일입니다. 주휴일을 위해 주 근무일수가 6일을 넘지 않도록 조정해 주세요.
                    </div>
                  )}
                </>
              ) : scheduleType === '직접입력' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 소정근로일수 (일/주)</span>
                      <input type="number" className="text-input" placeholder="예: 5" value={directWeeklyWorkDays} onChange={(e) => setDirectWeeklyWorkDays(e.target.value)} min="1" max="7" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>하루 평균 근로시간 (시간)</span>
                      <input type="number" className="text-input" placeholder="예: 8" value={directAvgDailyHours} onChange={(e) => {
                        const value = e.target.value;
                        setDirectAvgDailyHours(value);
                        if (breakTimeAuto) setBreakTime(String(getStatutoryBreakMinutes(parseFloat(value) || 0)));
                      }} min="1" max="24" />
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>주 평균 총 소정근로시간 (시간)</span>
                    <input type="number" className="text-input" placeholder="예: 40" value={directWeeklyRegularHours} onChange={(e) => setDirectWeeklyRegularHours(e.target.value)} min="0" />
                    <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>* 주 최대 40시간까지만 기본 소정시간으로 연산됩니다.</p>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>하루 평균 휴게시간 (분)</span>
                      <input type="number" className="text-input" value={breakTime} onChange={(e) => pattern1BreakTimeHandlers.onBreakTimeChange(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>국민연금 기준소득월액 (선택, 원)</span>
                      <input type="number" className="text-input" placeholder="예: 2500000" value={pensionBasis} onChange={(e) => setPensionBasis(e.target.value)} min="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 국민연금 기준소득월액 미입력 시에는 소정근로 계약급(기본급+주휴수당) 기준으로 자동 산출됩니다.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 휴일근로 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 12" value={holidayWorkDays} onChange={(e) => setHolidayWorkDays(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 연차유급 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 연간 휴일근로 일수, 연간 연차유급 일수가 있다면 입력하세요. AI 진단 리포트에 반영됩니다.
                  </p>
                </div>
              ) : (
                <>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}><Clock size={16} color="#38bdf8" /> 상세 근로 및 휴게 시간</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {renderPattern('근무 패턴 1', pattern1Days, setPattern1Days, pattern1Start, pattern1BreakTimeHandlers.onStartChange, pattern1End, pattern1BreakTimeHandlers.onEndChange, pattern1Hours)}
                    {renderPattern('근무 패턴 2 (선택)', pattern2Days, setPattern2Days, pattern2Start, setPattern2Start, pattern2End, setPattern2End, pattern2Hours)}
                    {renderPattern('근무 패턴 3 (선택)', pattern3Days, setPattern3Days, pattern3Start, setPattern3Start, pattern3End, setPattern3End, pattern3Hours)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>하루 평균 휴게시간 (분)</span>
                      <input type="number" className="text-input" value={breakTime} onChange={(e) => pattern1BreakTimeHandlers.onBreakTimeChange(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>국민연금 기준소득월액 (선택, 원)</span>
                      <input type="number" className="text-input" placeholder="예: 2500000" value={pensionBasis} onChange={(e) => setPensionBasis(e.target.value)} min="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 국민연금 기준소득월액 미입력 시에는 소정근로 계약급(기본급+주휴수당) 기준으로 자동 산출됩니다.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주당 추가 연장근로시간 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 5" value={extraWeeklyOvertime} onChange={(e) => setExtraWeeklyOvertime(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 휴일근로 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 12" value={holidayWorkDays} onChange={(e) => setHolidayWorkDays(e.target.value)} min="0" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 연차유급 일수 (선택)</span>
                      <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                    * 매주 고정적으로 발생하는 추가 연장근로, 연간 휴일근로 일수, 연간 연차유급 일수가 있다면 입력하세요. AI 진단 리포트에 반영됩니다.
                  </p>
                  {weeklyDays > 6 && (
                    <div className="info-callout warning" style={{ marginTop: '0.75rem' }}>
                      패턴 1~3의 근무일수 합계가 {weeklyDays}일입니다. 주휴일을 위해 주 근무일수가 6일을 넘지 않도록 조정해 주세요.
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Utensils size={14} /> 비과세 수당 (선택, 월 지급액)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>식대</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={mealAllowance} onChange={(e) => setMealAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>자가운전보조금</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={carAllowance} onChange={(e) => setCarAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>육아수당 (6세 이하)</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={childcareAllowance} onChange={(e) => setChildcareAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>기타 비과세</span>
                    <input type="number" className="text-input" placeholder="예: 0" value={otherNonTaxable} onChange={(e) => setOtherNonTaxable(e.target.value)} min="0" />
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                  식대·자가운전보조금·육아수당은 각각 월 {NON_TAXABLE_MONTHLY_CAP.toLocaleString()}원까지 비과세로 인정되어 세금·4대보험 산정에서 제외됩니다. 급여명세서에 별도 항목으로 표기되어 있다면 입력하세요.
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#f87171', display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>과세 수당 (선택, 직책수당·상여금 등)</span>
                <input type="number" className="text-input" placeholder="예: 0" value={taxableAllowance} onChange={(e) => setTaxableAllowance(e.target.value)} min="0" />
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                  비과세와 달리 세금·4대보험 산정 기준액에도 그대로 포함되는 직책수당·상여금 등이 있다면 입력하세요.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Calendar size={16} /> 기타 특이사항 (선택)</label>
              <input type="text" className="text-input" placeholder="예: 주말 고정 당직 4시간 존재, 교대근무 3조 2교대 등" value={workHours} onChange={(e) => setWorkHours(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label"><Upload size={16} /> 서류 이미지 및 증빙 영상 감별 (선택)</label>
              <div
                className="text-input scan-container-box"
                style={{
                  border: isDragOver ? '2px dashed #6366f1' : '1px dashed rgba(255, 255, 255, 0.15)',
                  background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                  padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', position: 'relative'
                }}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => document.getElementById('report-file-input').click()}
              >
                <input id="report-file-input" type="file" accept="image/*, video/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {isScanning && (
                  <div className="scanner-overlay">
                    <div className="scanner-line"></div>
                    <div className="scanner-status"><div className="scan-pulse-circle"></div><span>AI 서류 분석 스캔 중...</span></div>
                  </div>
                )}
                {fileName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {fileMime.startsWith('image/') ? (
                      filePreview ? <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} /> : <FileImage size={36} color="#38bdf8" />
                    ) : <FileVideo size={36} color="#a5b4fc" />}
                    <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, wordBreak: 'break-all' }}>{fileName}</span>
                    {scanComplete && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', color: '#06b6d4', fontSize: '0.75rem', fontWeight: 700 }}>✓ AI 스캔 완료</div>
                    )}
                    <button type="button" onClick={handleRemoveFile} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <X size={12} /> 삭제
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color: '#475569', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.25rem 0' }}>근로계약서 이미지 또는 증빙 영상을 업로드하세요.</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>드래그 앤 드롭 또는 클릭하여 업로드 (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Briefcase size={16} /> 상세 사연 (쟁점 사항)</label>
              <textarea
                className="textarea-input" rows="4"
                placeholder={isWorker ? "예: 지난달 연장근로를 20시간 넘게 했는데 가산수당을 주지 않고 기본 시급으로만 지급받았습니다." : "예: 5인 이상 사업장인데 포괄임금제로 계약했습니다. 실제 연장근로시간을 초과 지급해야 하는지 확인하고 싶습니다."}
                value={issueText} onChange={(e) => setIssueText(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} /><span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'AI 리포트 작성 중...' : '리포트 생성하기'}
            </button>
          </form>
        </section>

        <section className="glass-panel">
          {isLoading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p className="loading-text">노동법 법령 대조 및 리스크 분석 중...</p>
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', maxWidth: '500px' }}>
                <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>노동법 참고 지식</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{LOADING_TIPS[loadingTipIndex]}</p>
              </div>
            </div>
          ) : report ? (
            <div>
              <div className="report-action-bar">
                <button className="btn-action" onClick={handleCopyToClipboard}>
                  {copied ? <><Check size={14} color="#10b981" /> 복사 완료</> : <><Clipboard size={14} /> 텍스트 복사</>}
                </button>
                <button className="btn-action" onClick={handlePrintPDF}><Download size={14} /> PDF/인쇄 다운로드</button>
                <button className="btn-action" onClick={handleSendViaKakao} disabled={isSendingKakao}>
                  {isSendingKakao ? '전송 중...' : '💬 카카오톡으로 받기'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                <span>🎁</span> <strong>오픈 베타 특별 혜택:</strong> 회원가입 시 전체 상세 분석 및 다운로드/카카오톡 발송 무료 제공 (추후 유료 전환 예정)
              </p>

              {!user ? (
                (() => {
                  let part1 = report;
                  let part2 = '';
                  const splitIndex = report.indexOf('## 2.');
                  if (splitIndex !== -1) {
                    part1 = report.substring(0, splitIndex);
                    part2 = report.substring(splitIndex);
                  }
                  return (
                    <div className="report-content" style={{ position: 'relative' }}>
                      <ReactMarkdown>{part1}</ReactMarkdown>
                      {part2 && (
                        <div style={{ position: 'relative', marginTop: '1.5rem', minHeight: '300px', overflow: 'hidden' }}>
                          <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
                            <ReactMarkdown>{part2}</ReactMarkdown>
                          </div>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', background: 'linear-gradient(to bottom, transparent 0%, rgba(30, 41, 59, 0.8) 20%, rgba(30, 41, 59, 1) 90%)', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ background: '#1e293b', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.75rem', maxWidth: '360px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', marginTop: '2rem' }}>
                              <Coins size={32} color="#6366f1" style={{ marginBottom: '0.75rem' }} />
                              <h4 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>상세 분석 리포트 잠금 해제</h4>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>가입하시면 관련 법령 대조 결과, 벌칙 리스크 진단, 준비 서류 체크리스트를 포함한 전체 리포트를 즉시 확인하실 수 있습니다.</p>
                              <button type="button" onClick={() => { setAuthError(''); setShowLoginModal(true); }} style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>1초 로그인 / 회원가입</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="report-content"><ReactMarkdown>{report}</ReactMarkdown></div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <p className="empty-title">아직 생성된 리포트가 없습니다</p>
              <p className="empty-desc">왼쪽 양식을 작성하고 리포트 생성하기 버튼을 눌러주세요.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ReportGenerator;
