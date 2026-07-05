import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase initialization failed:', err);
  }
}

import ReactMarkdown from 'react-markdown';
import { 
  ShieldAlert, 
  FileText, 
  Building2, 
  Clock, 
  Clipboard, 
  Check, 
  Download, 
  User, 
  Briefcase,
  AlertCircle,
  Coins,
  Calendar,
  Coffee,
  FileSignature,
  Upload,
  X,
  FileImage,
  FileVideo,
  Activity
} from 'lucide-react';

const LOADING_TIPS = [
  "근로기준법 제18조: 4주 동안 평균하여 1주 동안의 소정근로시간이 15시간 미만인 근로자에게는 주휴수당 규정이 적용되지 않습니다.",
  "근로기준법 제23조: 5인 이상 사업장에서는 정당한 이유 없이 근로자를 해고할 수 없으나, 5인 미만 사업장은 해고 제한 규정이 적용되지 않습니다.",
  "근로기준법 제56조: 5인 이상 사업장은 연장·야간·휴일근로에 대해 50% 이상의 가산수당을 지급해야 합니다.",
  "최저임금법 제6조: 모든 사업주는 근로자에게 고용노동부장관이 고시한 최저임금액 이상의 임금을 지급해야 합니다.",
  "근로기준법 제17조: 근로계약서 미작성 및 미교부는 500만원 이하의 벌금 또는 과태료 처분을 받을 수 있습니다."
];

function App() {
  // Supabase Auth 상태 관리
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (supabase) {
      // 초기 세션 획득
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      // 인증 상태 변경 리스너
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message || '로그인에 실패했습니다.');
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      alert('회원가입 확인 메일이 발송되었습니다! 이메일 링크를 확인해 주세요.');
      setIsSigningUp(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message || '회원가입에 실패했습니다.');
    }
  };

  const handleOAuthLogin = async (provider) => {
    if (!supabase) {
      alert('Supabase가 구성되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      alert(`${provider} 로그인 시도 중 에러가 발생했습니다: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  // 기본 상태 값
  const [userType, setUserType] = useState('근로자');
  const [companySize, setCompanySize] = useState('5인 이상');
  
  // 신규 수당 및 급여 세분화 조건
  const [salaryType, setSalaryType] = useState('월급');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [allowanceIncluded, setAllowanceIncluded] = useState('확인불가');
  const [pattern1Days, setPattern1Days] = useState('5');
  const [pattern1Hours, setPattern1Hours] = useState('8');
  const [pattern2Days, setPattern2Days] = useState('0');
  const [pattern2Hours, setPattern2Hours] = useState('0');
  const [weeklyNightHours, setWeeklyNightHours] = useState('0');
  const [breakTime, setBreakTime] = useState('60');

  // Derived working hours variables
  const p1Days = parseFloat(pattern1Days) || 0;
  const p1Hours = parseFloat(pattern1Hours) || 0;
  const p2Days = parseFloat(pattern2Days) || 0;
  const p2Hours = parseFloat(pattern2Hours) || 0;
  const weeklyDays = p1Days + p2Days;
  const dailyHours = weeklyDays > 0 ? ((p1Days * p1Hours) + (p2Days * p2Hours)) / weeklyDays : 0;
  
  // 멀티모달 파일 상태
  const [fileBase64, setFileBase64] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // 기존 근무/급여 텍스트 설명 및 사연
  const [workHours, setWorkHours] = useState('');
  const [issueText, setIssueText] = useState('');
  
  // UI 컨트롤 및 결과 상태
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // 신규 대시보드 및 시뮬레이션 상태
  const [activeRightTab, setActiveRightTab] = useState('dashboard');
  const [simulatedOvertime, setSimulatedOvertime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // 로딩 팁 롤링 타이머
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // 파일 처리 핸들러
  const processFile = (file) => {
    if (!file) return;
    
    // 10MB 크기 제한
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 최대 10MB까지 업로드 가능합니다.');
      return;
    }

    setFileName(file.name);
    setFileMime(file.type);
    setError('');

    // Trigger scanning simulation
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result);
      if (file.type.startsWith('image/')) {
        setFilePreview(reader.result);
      } else {
        setFilePreview('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleRemoveFile = () => {
    setFileBase64('');
    setFileMime('');
    setFileName('');
    setFilePreview('');
    setIsScanning(false);
    setScanComplete(false);
  };

  // 1. 노무 리스크 점수 계산
  const calculateRiskScore = () => {
    let score = 100;
    
    // 근로계약서 미작성
    if (allowanceIncluded === '근로계약서 작성 안 함') {
      score -= 40;
    }
    
    // 휴게시간 미준수
    const hours = parseFloat(dailyHours) || 0;
    const breakMin = parseFloat(breakTime) || 0;
    if (hours >= 8 && breakMin < 60) {
      score -= 25;
    } else if (hours >= 4 && hours < 8 && breakMin < 30) {
      score -= 25;
    }
    
    // 포괄임금제 위험도
    if (companySize === '5인 이상') {
      if (allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)') {
        score -= 15;
      } else if (allowanceIncluded === '확인불가') {
        score -= 10;
      }
    }
    
    // 연장근로 한도 초과
    const days = parseFloat(weeklyDays) || 0;
    const weeklyWorkingHours = hours * days;
    if (weeklyWorkingHours > 52) {
      if (companySize === '5인 이상') {
        score -= 20;
      } else {
        score -= 10;
      }
    }
    
    // 최저임금 미달 여부
    const breakdown = calculateSalaryBreakdown(0); // 0 simulated overtime
    if (breakdown.hourlyWage > 0 && breakdown.hourlyWage < 10030) {
      score -= 30;
    }
    
    return Math.max(score, 0);
  };

  // 2. 실시간 급여 항목 시뮬레이션 계산
  const calculateSalaryBreakdown = (extraWeeklyOvertime = 0) => {
    const amt = parseFloat(salaryAmount) || 0;
    
    const p1D = parseFloat(pattern1Days) || 0;
    const p1H = parseFloat(pattern1Hours) || 0;
    const p2D = parseFloat(pattern2Days) || 0;
    const p2H = parseFloat(pattern2Hours) || 0;
    const wNightHours = parseFloat(weeklyNightHours) || 0;

    const weeklyHours = (p1D * p1H) + (p2D * p2H);
    
    // 소정근로시간 (하루 8시간 초과분 제외, 주 40시간 초과분 제외)
    const p1RegularDaily = Math.min(p1H, 8);
    const p2RegularDaily = Math.min(p2H, 8);
    const weeklyRegularHours = (p1D * p1RegularDaily) + (p2D * p2RegularDaily);
    const regularWorkHoursForBasePay = Math.min(weeklyRegularHours, 40);
    
    // 연장근로시간 계산 (1일 8시간 초과분 합산)
    const p1DailyOvertime = Math.max(p1H - 8, 0) * p1D;
    const p2DailyOvertime = Math.max(p2H - 8, 0) * p2D;
    const dailyOvertime = p1DailyOvertime + p2DailyOvertime;
    
    // 주 40시간 초과분
    const weeklyOvertimeLimit = Math.max(weeklyRegularHours - 40, 0);
    const weeklyOvertimeHours = dailyOvertime + weeklyOvertimeLimit + extraWeeklyOvertime;

    // 주휴수당 기준: 1주 15시간 이상 근무
    const hasWeeklyHoliday = weeklyHours >= 15;
    const weeklyHolidayHours = hasWeeklyHoliday ? (regularWorkHoursForBasePay / 40) * 8 : 0;
    
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
      basePay = Math.round(hourlyWage * regularWorkHoursForBasePay * 4.345);
      weeklyHolidayPay = Math.round(hourlyWage * weeklyHolidayHours * 4.345);
      overtimePay = Math.round(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * 4.345);
      nightPay = Math.round(hourlyWage * wNightHours * nightMultiplier * 4.345);
      totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
    } else if (salaryType === '일급') {
      const averageDailyHours = (p1D + p2D) > 0 ? weeklyHours / (p1D + p2D) : 8;
      hourlyWage = averageDailyHours > 0 ? amt / averageDailyHours : 0;
      basePay = Math.round(hourlyWage * regularWorkHoursForBasePay * 4.345);
      weeklyHolidayPay = Math.round(hourlyWage * weeklyHolidayHours * 4.345);
      overtimePay = Math.round(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * 4.345);
      nightPay = Math.round(hourlyWage * wNightHours * nightMultiplier * 4.345);
      totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
    } else if (salaryType === '주급') {
      const divisor = regularWorkHoursForBasePay + weeklyHolidayHours + (weeklyOvertimeHours * overtimeMultiplier) + (wNightHours * nightMultiplier);
      hourlyWage = divisor > 0 ? amt / divisor : 0;
      basePay = Math.round(hourlyWage * regularWorkHoursForBasePay * 4.345);
      weeklyHolidayPay = Math.round(hourlyWage * weeklyHolidayHours * 4.345);
      overtimePay = Math.round(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * 4.345);
      nightPay = Math.round(hourlyWage * wNightHours * nightMultiplier * 4.345);
      totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
    } else { // 월급
      const weeklyBaseAndHoliday = regularWorkHoursForBasePay + weeklyHolidayHours;
      const monthlyStandardDivisor = weeklyBaseAndHoliday * 4.345;
      hourlyWage = monthlyStandardDivisor > 0 ? amt / monthlyStandardDivisor : 0;
      
      basePay = Math.round(hourlyWage * regularWorkHoursForBasePay * 4.345);
      weeklyHolidayPay = Math.round(hourlyWage * weeklyHolidayHours * 4.345);
      overtimePay = Math.round(hourlyWage * weeklyOvertimeHours * overtimeMultiplier * 4.345);
      nightPay = Math.round(hourlyWage * wNightHours * nightMultiplier * 4.345);
      
      if (is5Over && allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)') {
        const totalMultiplierDivisor = (regularWorkHoursForBasePay + weeklyHolidayHours + (weeklyOvertimeHours * overtimeMultiplier) + (wNightHours * nightMultiplier)) * 4.345;
        if (totalMultiplierDivisor > 0) {
          const actualHourly = amt / totalMultiplierDivisor;
          hourlyWage = actualHourly;
          basePay = Math.round(actualHourly * regularWorkHoursForBasePay * 4.345);
          weeklyHolidayPay = Math.round(actualHourly * weeklyHolidayHours * 4.345);
          overtimePay = Math.round(actualHourly * weeklyOvertimeHours * overtimeMultiplier * 4.345);
          nightPay = Math.round(actualHourly * wNightHours * nightMultiplier * 4.345);
        }
        totalPay = amt;
      } else {
        totalPay = basePay + weeklyHolidayPay + overtimePay + nightPay;
      }
    }
    
    // 4대보험 공제 (약 9.4%)
    const nationalPension = Math.round(totalPay * 0.045);
    const healthInsurance = Math.round(totalPay * 0.03545);
    const longTermCare = Math.round(healthInsurance * 0.1295);
    const employmentInsurance = Math.round(totalPay * 0.009);
    const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;
    
    // 소득세 단순화 모델
    let incomeTax = 0;
    if (totalPay >= 5000000) {
      incomeTax = Math.round(totalPay * 0.05);
    } else if (totalPay >= 3000000) {
      incomeTax = Math.round(totalPay * 0.03);
    } else if (totalPay >= 1500000) {
      incomeTax = Math.round(totalPay * 0.015);
    }
    const localIncomeTax = Math.round(incomeTax * 0.1);
    const totalTax = incomeTax + localIncomeTax;
    
    const totalDeductions = totalInsurance + totalTax;
    const netPay = Math.max(totalPay - totalDeductions, 0);
    
    return {
      hourlyWage: Math.round(hourlyWage),
      basePay,
      weeklyHolidayPay,
      overtimePay,
      nightPay,
      totalPay,
      nationalPension,
      healthInsurance,
      longTermCare,
      employmentInsurance,
      totalInsurance,
      incomeTax,
      localIncomeTax,
      totalTax,
      totalDeductions,
      netPay
    };
  };

  // 3. 실시간 대시보드 렌더링 함수
  const renderDashboard = () => {
    const riskScore = calculateRiskScore();
    const breakdown = calculateSalaryBreakdown(simulatedOvertime);
    
    // 반원 SVG 게이지 채우기
    const strokeDashoffset = 220 - (riskScore / 100) * 220;
    const needleRotation = -90 + (riskScore / 100) * 180;
    
    let riskLevel = '안전';
    let riskColor = '#10b981';
    if (riskScore < 50) {
      riskLevel = '위험';
      riskColor = '#ef4444';
    } else if (riskScore < 80) {
      riskLevel = '주의';
      riskColor = '#f59e0b';
    }
    
    const p1D = parseFloat(pattern1Days) || 0;
    const p1H = parseFloat(pattern1Hours) || 0;
    const p2D = parseFloat(pattern2Days) || 0;
    const p2H = parseFloat(pattern2Hours) || 0;
    const weeklyHours = (p1D * p1H) + (p2D * p2H);

    const parts = [
      { label: '기본급', value: breakdown.basePay, color: '#6366f1' },
      { label: '주휴수당', value: breakdown.weeklyHolidayPay, color: '#10b981' },
      { label: '연장수당', value: breakdown.overtimePay, color: '#f59e0b' },
      { label: '야간수당', value: breakdown.nightPay, color: '#a5b4fc' },
      { label: '공제액', value: breakdown.totalDeductions, color: '#f87171' }
    ];
    
    const validParts = parts.filter(p => p.value > 0);
    const partsSum = validParts.reduce((sum, p) => sum + p.value, 0);
    
    let accumulatedPercent = 0;
    const donutSegments = validParts.map((p, idx) => {
      const pct = partsSum > 0 ? (p.value / partsSum) * 100 : 0;
      const strokeLength = (pct / 100) * 251.2;
      const strokeOffset = 251.2 - strokeLength + (accumulatedPercent / 100) * 251.2;
      accumulatedPercent += pct;
      return {
        ...p,
        percent: pct,
        dasharray: `${strokeLength} ${251.2 - strokeLength}`,
        dashoffset: -((accumulatedPercent - pct) / 100) * 251.2
      };
    });
    
    const isRestTimeViolated = (p1H >= 8 && parseFloat(breakTime) < 60) || 
                               (p1H >= 4 && p1H < 8 && parseFloat(breakTime) < 30) ||
                               (p2D > 0 && p2H >= 8 && parseFloat(breakTime) < 60) ||
                               (p2D > 0 && p2H >= 4 && p2H < 8 && parseFloat(breakTime) < 30);
    
    return (
      <div className="dashboard-view" style={{ animation: 'fadeIn 0.4s ease' }}>
        <h3 className="dashboard-title">
          <Activity size={20} color="#38bdf8" /> 실시간 자가진단 대시보드
        </h3>
        
        <div className="dashboard-grid">
          {/* Risk Gauge Card */}
          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className="dashboard-card-title">
                <ShieldAlert size={16} color={riskColor} /> 노무 리스크 지수
              </h4>
              <div className="risk-gauge-box">
                <svg className="gauge-svg">
                  <path 
                    d="M 20 90 A 70 70 0 0 1 160 90" 
                    className="gauge-bg" 
                  />
                  <path 
                    d="M 20 90 A 70 70 0 0 1 160 90" 
                    className="gauge-fill" 
                    style={{ stroke: riskColor, strokeDashoffset }}
                  />
                  <line 
                    x1="90" y1="90" x2="90" y2="30" 
                    className="gauge-needle"
                    style={{ transform: `rotate(${needleRotation}deg)`, stroke: riskColor, strokeWidth: 4, strokeLinecap: 'round' }}
                  />
                  <circle cx="90" cy="90" r="6" fill="#f8fafc" />
                </svg>
                <div className="gauge-text" style={{ marginTop: '-12px' }}>
                  <span className="gauge-score" style={{ color: riskColor }}>{riskScore}점</span>
                  <div className="gauge-label" style={{ color: riskColor, fontSize: '0.75rem', fontWeight: 'bold' }}>[{riskLevel}]</div>
                </div>
              </div>
            </div>
            
            {/* Compliance Checklist */}
            <div className="compliance-list">
              <div className="compliance-item">
                <span className="compliance-name">
                  📄 근로계약서 작성
                </span>
                <span className={`compliance-badge ${
                  allowanceIncluded === '근로계약서 작성 안 함' ? 'danger' : 'pass'
                }`}>
                  {allowanceIncluded === '근로계약서 작성 안 함' ? '미작성' : '작성'}
                </span>
              </div>
              <div className="compliance-item">
                <span className="compliance-name">
                  ☕ 법정 휴게시간
                </span>
                <span className={`compliance-badge ${
                  isRestTimeViolated ? 'danger' : 'pass'
                }`}>
                  {isRestTimeViolated ? '미달' : '준수'}
                </span>
              </div>
              <div className="compliance-item">
                <span className="compliance-name">
                  ⏰ 주당 총 근로시간
                </span>
                <span className={`compliance-badge ${
                  weeklyHours > 52 ? 'danger' : 'pass'
                }`}>
                  {weeklyHours}시간 {weeklyHours > 52 ? '(초과)' : '(준수)'}
                </span>
              </div>
              <div className="compliance-item">
                <span className="compliance-name">
                  🪙 최저임금 준수
                </span>
                <span className={`compliance-badge ${
                  breakdown.hourlyWage > 0 && breakdown.hourlyWage < 10030 ? 'danger' : 'pass'
                }`}>
                  {breakdown.hourlyWage > 0 && breakdown.hourlyWage < 10030 ? '미달' : '준수'}
                </span>
              </div>
              {companySize === '5인 이상' && (
                <div className="compliance-item">
                  <span className="compliance-name">
                    💼 포괄임금 안전성
                  </span>
                  <span className={`compliance-badge ${
                    allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)' ? 'warning' : 'pass'
                  }`}>
                    {allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)' ? '점검필요' : '양호'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Salary Breakdown & Donut Chart Card */}
          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className="dashboard-card-title">
                <Coins size={16} color="#f59e0b" /> 실시간 급여 분석
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', margin: '0.25rem 0' }}>
                <div className="salary-breakdown-list">
                  <div className="salary-breakdown-item">
                    <span className="salary-breakdown-label">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></span>
                      기본급
                    </span>
                    <span className="salary-breakdown-value">{breakdown.basePay.toLocaleString()}원</span>
                  </div>
                  <div className="salary-breakdown-item">
                    <span className="salary-breakdown-label">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                      주휴수당
                    </span>
                    <span className="salary-breakdown-value">{breakdown.weeklyHolidayPay.toLocaleString()}원</span>
                  </div>
                  <div className="salary-breakdown-item">
                    <span className="salary-breakdown-label">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                      연장수당
                    </span>
                    <span className="salary-breakdown-value">{breakdown.overtimePay.toLocaleString()}원</span>
                  </div>
                  <div className="salary-breakdown-item">
                    <span className="salary-breakdown-label">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#a5b4fc' }}></span>
                      야간수당
                    </span>
                    <span className="salary-breakdown-value">{breakdown.nightPay.toLocaleString()}원</span>
                  </div>
                  <div className="salary-breakdown-item" style={{ color: '#ef4444' }}>
                    <span className="salary-breakdown-label">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }}></span>
                      공제총액
                    </span>
                    <span className="salary-breakdown-value">-{breakdown.totalDeductions.toLocaleString()}원</span>
                  </div>
                  <div className="salary-breakdown-item" style={{ borderBottom: 'none' }}>
                    <span className="salary-breakdown-label" style={{ color: '#38bdf8', fontWeight: 800 }}>
                      실수령액
                    </span>
                    <span className="salary-breakdown-value" style={{ color: '#38bdf8', fontWeight: 800 }}>{breakdown.netPay.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* SVG Donut Chart */}
                <div className="donut-chart-box">
                  <svg className="donut-chart-svg">
                    <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="16" fill="transparent" />
                    {donutSegments.map((seg, idx) => (
                      <circle 
                        key={idx}
                        cx="60" 
                        cy="60" 
                        r="40" 
                        className="donut-segment"
                        stroke={seg.color}
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={seg.dashoffset}
                      />
                    ))}
                  </svg>
                  <div className="donut-center-text">
                    시급 환산
                    <div className="donut-center-val">{breakdown.hourlyWage.toLocaleString()}원</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Simulation Slider */}
            <div className="simulation-slider-box">
              <div className="simulation-slider-header">
                <span>연장근로 시뮬레이션 (주당 추가 시간)</span>
                <span style={{ color: '#38bdf8' }}>+{simulatedOvertime}시간</span>
              </div>
              <input 
                type="range" 
                className="sim-slider" 
                min="0" 
                max="24" 
                value={simulatedOvertime}
                onChange={(e) => setSimulatedOvertime(Number(e.target.value))}
              />
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.3 }}>
                슬라이더를 움직여 주간 연장근로 발생 시 가산 수당 및 예상 실수령액의 변화를 즉시 확인해 보세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 리포트 생성 요청
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!salaryAmount.trim()) {
      setError('급여 금액을 입력해 주세요.');
      return;
    }
    if (!issueText.trim()) {
      setError('상세 사연(쟁점 사항)을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setReport('');
    setLoadingTipIndex(0);

    // 백엔드로 보낼 페이로드 구성
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
      weekly_night_hours: Number(weeklyNightHours),
      daily_hours: Number(dailyHours),
      weekly_days: Number(weeklyDays),
      break_time: Number(breakTime),
      work_hours: workHours, 
      issue_text: issueText,
      file_data: fileBase64,
      file_mime: fileMime
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
      const response = await fetch('https://api.xn--ai-h74ir53a94vh9e.com/api/generate-report', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리포트 생성에 실패했습니다.');
      }

      const data = await response.json();
      setReport(data.report);
      setActiveRightTab('report');
    } catch (err) {
      console.error(err);
      setError(err.message || '서버와의 통신 도중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 클립보드 복사
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

  // PDF로 저장 (인쇄 대화상자 호출)
  const handlePrintPDF = () => {
    if (!user) {
      setAuthError('PDF 다운로드는 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }
    window.print();
  };

  return (
    <div>
      {/* App Header */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '2rem' }}>
        <div>
          <h1 className="app-logo" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={36} color="#6366f1" /> LaborCheck AI
          </h1>
          <p className="app-subtitle" style={{ margin: '0.25rem 0 0 0' }}>대한민국 근로기준법 기반 자가진단 리포트 생성기</p>
        </div>
        
        {/* Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '500' }}>
                  {user.email}님
                </span>
              </div>
              <button 
                type="button"
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; e.target.style.color = '#f8fafc'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={() => { setAuthError(''); setShowLoginModal(true); }}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }}
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="main-container">
        {/* Left Panel: Form Input */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
            <FileText size={20} color="#38bdf8" /> 자가진단 상세 정보 입력
          </h2>

          <form onSubmit={handleGenerateReport}>
            {/* User Type */}
            <div className="form-group">
              <label className="form-label">
                <User size={16} /> 사용자 유형
              </label>
              <div className="radio-group">
                <div 
                  id="usertype-worker-btn"
                  className={`radio-card ${userType === '근로자' ? 'active' : ''}`}
                  onClick={() => setUserType('근로자')}
                >
                  <span className="radio-card-title">근로자</span>
                  <span className="radio-card-desc">권리 구제 및 법령 진단</span>
                </div>
                <div 
                  id="usertype-employer-btn"
                  className={`radio-card ${userType === '사업주' ? 'active' : ''}`}
                  onClick={() => setUserType('사업주')}
                >
                  <span className="radio-card-title">사업주</span>
                  <span className="radio-card-desc">노무 리스크 사전 진단</span>
                </div>
              </div>
            </div>

            {/* Company Size */}
            <div className="form-group">
              <label className="form-label">
                <Building2 size={16} /> 사업장 규모
              </label>
              <div className="radio-group">
                <div 
                  id="companysize-under5-btn"
                  className={`radio-card ${companySize === '5인 미만' ? 'active' : ''}`}
                  onClick={() => setCompanySize('5인 미만')}
                >
                  <span className="radio-card-title">5인 미만</span>
                  <span className="radio-card-desc">일부 규정 적용 제외</span>
                </div>
                <div 
                  id="companysize-over5-btn"
                  className={`radio-card ${companySize === '5인 이상' ? 'active' : ''}`}
                  onClick={() => setCompanySize('5인 이상')}
                >
                  <span className="radio-card-title">5인 이상</span>
                  <span className="radio-card-desc">가산 수당 및 연차 적용</span>
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label">
                <Coins size={16} color="#f59e0b" /> 급여 구분 및 금액
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <select 
                  id="salary-type-select"
                  className="text-input" 
                  value={salaryType} 
                  onChange={(e) => setSalaryType(e.target.value)}
                  style={{ padding: '0.85rem 0.5rem' }}
                >
                  <option value="시급">시급</option>
                  <option value="일급">일급</option>
                  <option value="주급">주급</option>
                  <option value="월급">월급</option>
                </select>
                <input 
                  id="salary-amount-input"
                  type="number" 
                  className="text-input" 
                  placeholder="금액 입력 (예: 2500000)" 
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                />
              </div>
            </div>

            {/* 5인 이상 전용: 수당 포괄 포함 진단 대시보드 */}
            {companySize === '5인 이상' && (
              <div id="allowance-dashboard-panel" className="form-group" style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '1.25rem', borderRadius: '16px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                <label className="form-label" style={{ color: '#a5b4fc', fontWeight: 'bold' }}>
                  <FileSignature size={16} /> 근로계약서 수당 포함 대시보드
                </label>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                  5인 이상 사업장은 법정 가산수당이 발생합니다. 근로계약서상 해당 수당들이 기본 급여 내에 포함되어 있는 형태인지 표시해 주세요.
                </p>
                
                <select 
                  id="allowance-included-select"
                  className="text-input"
                  value={allowanceIncluded}
                  onChange={(e) => setAllowanceIncluded(e.target.value)}
                  style={{ marginBottom: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                  <option value="확인불가">계약서 조항 확인 불가 / 모름</option>
                  <option value="기본급 외 수당 모두 포함 (포괄임금)">수당 모두 포함 (포괄임금제 형태)</option>
                  <option value="기본급 외 일부 수당만 포함">일부 수당만 급여에 포함</option>
                  <option value="포함되지 않음 (기본급 기준 연장수당 별도 계산)">포함 안 됨 (연장 등 수당 매월 별도 계산)</option>
                  <option value="근로계약서 작성 안 함">근로계약서를 작성하지 않음</option>
                </select>

                {/* 대시보드형 안내 피드백 */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {allowanceIncluded === '기본급 외 수당 모두 포함 (포괄임금)' && (
                    <span style={{ color: '#f59e0b' }}>⚠️ <strong>포괄임금 주의</strong>: 합의를 했더라도 실제 연장근로 시간이 계약된 시간보다 많으면 그 차액을 추가 지급해야 합니다.</span>
                  )}
                  {allowanceIncluded === '포함되지 않음 (기본급 기준 연장수당 별도 계산)' && (
                    <span style={{ color: '#10b981' }}>✅ <strong>이상적 형태</strong>: 실제 근로한 시간에 따라 적법하게 계산된 연장/야간 수당을 지급받는 구조입니다.</span>
                  )}
                  {allowanceIncluded === '근로계약서 작성 안 함' && (
                    <span style={{ color: '#f87171' }}>🚫 <strong>법 위반 소지</strong>: 근로기준법 제17조 위반으로 사용자는 500만원 이하 벌금형 또는 과태료가 발생할 수 있습니다.</span>
                  )}
                  {allowanceIncluded === '확인불가' && (
                    <span style={{ color: '#94a3b8' }}>💡 계약서상 '연장수당 OO원 포함', '포괄역산' 등의 단어가 있는지 확인해 보시기 바랍니다.</span>
                  )}
                  {allowanceIncluded === '기본급 외 일부 수당만 포함' && (
                    <span style={{ color: '#60a5fa' }}>ℹ️ 포함된 수당 명칭과 금액이 계약서상 명확히 분리 기재되어 있어야 적법성이 인정됩니다.</span>
                  )}
                </div>
              </div>
            )}

            {/* Work Time Details */}
            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label">
                <Clock size={16} color="#38bdf8" /> 상세 근로 및 휴게 시간
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {/* 근무 패턴 1 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>근무 패턴 1</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주 근무일수 (일)</span>
                      <input 
                        id="pattern1-days-input"
                        type="number" 
                        className="text-input" 
                        value={pattern1Days}
                        onChange={(e) => setPattern1Days(e.target.value)}
                        min="0" max="7"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>하루 근로시간 (시간)</span>
                      <input 
                        id="pattern1-hours-input"
                        type="number" 
                        className="text-input" 
                        value={pattern1Hours}
                        onChange={(e) => setPattern1Hours(e.target.value)}
                        min="0" max="24"
                      />
                    </div>
                  </div>
                </div>

                {/* 근무 패턴 2 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>근무 패턴 2 (선택)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주 근무일수 (일)</span>
                      <input 
                        id="pattern2-days-input"
                        type="number" 
                        className="text-input" 
                        value={pattern2Days}
                        onChange={(e) => setPattern2Days(e.target.value)}
                        min="0" max="7"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>하루 근로시간 (시간)</span>
                      <input 
                        id="pattern2-hours-input"
                        type="number" 
                        className="text-input" 
                        value={pattern2Hours}
                        onChange={(e) => setPattern2Hours(e.target.value)}
                        min="0" max="24"
                      />
                    </div>
                  </div>
                </div>

                {/* 야간 근로시간 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>
                    주당 야간 근로시간 (시간)
                  </span>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                    오후 10시부터 다음날 오전 6시 사이의 주당 총 근로 시간입니다. (5인 이상 50% 가산)
                  </p>
                  <input 
                    id="weekly-night-hours-input"
                    type="number" 
                    className="text-input" 
                    value={weeklyNightHours}
                    onChange={(e) => setWeeklyNightHours(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                  하루 평균 휴게시간 (분) <span style={{ color: '#6366f1' }}>(법정: 4시간당 30분, 8시간당 1시간)</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    id="break-time-input"
                    type="number" 
                    className="text-input" 
                    value={breakTime}
                    onChange={(e) => setBreakTime(e.target.value)}
                    min="0"
                  />
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>분</span>
                </div>
              </div>
            </div>

            {/* Optional extra explanation */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} /> 기타 특이사항 (선택)
              </label>
              <input 
                id="work-hours-input"
                type="text" 
                className="text-input"
                placeholder="예: 주말 고정 당직 4시간 존재, 교대근무 3조 2교대 등"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
              />
            </div>

            {/* Multi-modal File Upload Area */}
            <div className="form-group">
              <label className="form-label">
                <Upload size={16} /> 서류 이미지 및 증빙 영상 감별 (선택)
              </label>
              
              <div 
                className="text-input scan-container-box"
                style={{ 
                  border: isDragOver ? '2px dashed #6366f1' : '1px dashed rgba(255, 255, 255, 0.15)',
                  background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('document-file-input').click()}
              >
                <input 
                  id="document-file-input"
                  type="file" 
                  accept="image/*, video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                
                {isScanning && (
                  <div className="scanner-overlay">
                    <div className="scanner-line"></div>
                    <div className="scanner-status">
                      <div className="scan-pulse-circle"></div>
                      <span>AI 서류 분석 스캔 중...</span>
                    </div>
                  </div>
                )}
                
                {fileName ? (
                  /* File Uploaded State */
                  <div id="file-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {fileMime.startsWith('image/') ? (
                      filePreview ? (
                        <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <FileImage size={36} color="#38bdf8" />
                      )
                    ) : (
                      <FileVideo size={36} color="#a5b4fc" />
                    )}
                    <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, wordBreak: 'break-all' }}>{fileName}</span>
                    {scanComplete && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', color: '#06b6d4', fontSize: '0.75rem', fontWeight: 700 }}>
                        ✓ AI 스캔 완료
                      </div>
                    )}
                    <button 
                      id="file-remove-btn"
                      type="button" 
                      onClick={handleRemoveFile}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        padding: '0.25rem 0.5rem', 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        borderRadius: '6px', 
                        color: '#f87171', 
                        fontSize: '0.75rem', 
                        cursor: 'pointer',
                        marginTop: '0.25rem',
                        position: 'relative',
                        zIndex: 11
                      }}
                    >
                      <X size={12} /> 삭제
                    </button>
                  </div>
                ) : (
                  /* Empty Upload State */
                  <div>
                    <Upload size={28} style={{ color: '#475569', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.25rem 0' }}>근로계약서 이미지 또는 증빙 영상을 업로드하세요.</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>드래그 앤 드롭 또는 클릭하여 업로드 (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Issue Text */}
            <div className="form-group">
              <label className="form-label">
                <Briefcase size={16} /> 상세 사연 (쟁점 사항)
              </label>
              <textarea 
                id="issue-text-input"
                className="textarea-input"
                rows="4"
                placeholder="예: 지난달 연장근로를 20시간 넘게 했는데 가산수당을 주지 않고 기본 시급으로만 지급받았습니다. 이에 대해 노동청 진정이 가능한지 궁금합니다."
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button id="generate-report-btn" type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'AI 리포트 작성 중...' : '리포트 생성하기'}
            </button>
          </form>
        </section>

        {/* Right Panel: Report Result & Dashboard */}
        <section className="glass-panel">
          {isLoading ? (
            /* Loading State */
            <div className="loader-container">
              <div className="spinner"></div>
              <p className="loading-text">노동법 법령 대조 및 리스크 분석 중...</p>
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', maxWidth: '500px' }}>
                <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>노동법 참고 지식</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                  {LOADING_TIPS[loadingTipIndex]}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Tab Selector - only shown when report exists */}
              {report && (
                <div className="dashboard-toggle-tabs">
                  <button 
                    type="button"
                    className={`dashboard-tab-btn ${activeRightTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveRightTab('report')}
                  >
                    <FileText size={16} /> AI 진단 리포트
                  </button>
                  <button 
                    type="button"
                    className={`dashboard-tab-btn ${activeRightTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveRightTab('dashboard')}
                  >
                    <Activity size={16} /> 실시간 대시보드
                  </button>
                </div>
              )}

              {activeRightTab === 'report' && report ? (
                /* Report Render State */
                <div>
                  <div className="report-action-bar">
                    <button id="copy-text-btn" className="btn-action" onClick={handleCopyToClipboard}>
                      {copied ? (
                        <>
                          <Check size={14} color="#10b981" /> 복사 완료
                        </>
                      ) : (
                        <>
                          <Clipboard size={14} /> 텍스트 복사
                        </>
                      )}
                    </button>
                    <button id="download-pdf-btn" className="btn-action" onClick={handlePrintPDF}>
                      <Download size={14} /> PDF/인쇄 다운로드
                    </button>
                  </div>
                  
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
                              {/* Blurred Area */}
                              <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
                                <ReactMarkdown>{part2}</ReactMarkdown>
                              </div>
                              
                              {/* CTA Banner Overlay */}
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', background: 'linear-gradient(to bottom, transparent 0%, rgba(30, 41, 59, 0.8) 20%, rgba(30, 41, 59, 1) 90%)', padding: '1rem', textAlign: 'center' }}>
                                <div style={{ background: '#1e293b', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.75rem', maxWidth: '360px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', marginTop: '2rem' }}>
                                  <Coins size={32} color="#6366f1" style={{ marginBottom: '0.75rem' }} />
                                  <h4 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                                    상세 분석 리포트 잠금 해제
                                  </h4>
                                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
                                    가입하시면 관련 법령 대조 결과, 벌칙 리스크 진단, 준비 서류 체크리스트를 포함한 전체 리포트를 즉시 확인하실 수 있습니다.
                                  </p>
                                  <button 
                                    type="button"
                                    onClick={() => { setAuthError(''); setShowLoginModal(true); }}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                                  >
                                    1초 로그인 / 회원가입
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="report-content">
                      <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                /* Dashboard View */
                renderDashboard()
              )}
            </div>
          )}
        </section>
      </main>

      {/* Login / Sign Up Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
            
            <button 
              type="button"
              onClick={() => setShowLoginModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#f8fafc', textAlign: 'center', fontWeight: 'bold' }}>
              {isSigningUp ? '회원가입' : '로그인'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              리포트 상세 분석과 PDF 다운로드 권한이 부여됩니다.
            </p>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* Email/PW Form */}
            <form onSubmit={isSigningUp ? handleEmailSignUp : handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>이메일 주소</span>
                <input 
                  type="email" 
                  className="text-input" 
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>비밀번호</span>
                <input 
                  type="password" 
                  className="text-input" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}
              >
                {isSigningUp ? '이메일로 가입하기' : '로그인'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>또는</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
            </div>

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                type="button"
                onClick={() => handleOAuthLogin('kakao')}
                style={{ background: '#fee500', color: '#191919', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span>💬 카카오톡 1초 로그인</span>
              </button>
              <button 
                type="button"
                onClick={() => handleOAuthLogin('google')}
                style={{ background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span>🌐 구글 계정으로 로그인</span>
              </button>
            </div>

            {/* Switch Sign Up / Sign In */}
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
              {isSigningUp ? '이미 계정이 있으신가요?' : '아직 회원이 아니신가요?'} {' '}
              <span 
                onClick={() => { setIsSigningUp(!isSigningUp); setAuthError(''); }}
                style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                {isSigningUp ? '로그인하기' : '회원가입하기'}
              </span>
            </p>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
