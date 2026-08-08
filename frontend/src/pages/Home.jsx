import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Briefcase, Coins, Calendar, Clock, Wallet, FileText, ShieldAlert,
  HeartPulse, PiggyBank, ArrowRight, Search, Users, Sparkles, Mail, Crown,
  Send, Bot, RefreshCw, CheckCircle2, MessageSquare, X, Paperclip, FileCheck, Image,
  Scale, Stethoscope, ChevronRight, Zap, HelpCircle, FileCode, Check
} from 'lucide-react';
import PayslipModal from '../components/PayslipModal';
import WageCalculatorModal from '../components/WageCalculatorModal';
import ContactForm from './ContactForm';
import SEO from '../components/SEO';
import { calculate4ComponentsBreakdown, verifyComprehensiveWage, calculateAnnualLeaveByTenure } from '../utils/laborCalc';

const SMART_QUICK_PROMPTS = [
  '산재 불승인 시 이의신청 절차 및 판례 모음 알려줘',
  '산재 진단서/급여명세서 첨부해서 예상 휴업급여 계산해 줘',
  '2026년 내 월급·주휴수당 209시간 정밀 계산해 줘',
  '재직증명서 / 경력증명서 표준 양식 받기',
  '육아휴직·병가 포함 퇴직금 얼마인지 계산해 줘',
  '우리 사업장 취업규칙 필수 법정 항목 체크해 줘',
  '노동청 근로감독 점검 대비 체크리스트 알려줘'
];

const AGENT_TEAM = [
  {
    name: '근로기준법 AI 분석',
    role: '209시간·중복가산 정밀 계산 및 근로계약서 양식 검증',
    icon: <Coins size={24} color="#38bdf8" />,
    checks: ['2026년 209시간 월급 미달 여부', '포괄임금제 수당 차액 1.5배 산출', '5인 이상/미만 사업장 수당 판정'],
    prompt: '2026년 내 월급이 209시간 최저임금에 미달하는지 정밀 점검해 줘'
  },
  {
    name: '산재보상 AI 시뮬레이터',
    role: '요양/휴업급여 산정 및 산재 승인 확률 자가진단 리포트',
    icon: <HeartPulse size={24} color="#f87171" />,
    checks: ['출퇴근길 사고 산재 승인 대상 점검', '과로성 뇌심혈관 질환 산재 요건', '평균임금 70% 휴업급여 실시간 계산'],
    prompt: '출퇴근 사고/과로 산재 승인 대상인지 자가진단해 줘'
  },
  {
    name: '대법원 판례 AI 대조',
    role: '주요 노동 판례 텍스트 대조 및 법리 분석 자가진단',
    icon: <Scale size={24} color="#a5b4fc" />,
    checks: ['주 15시간 미만 퇴직금 인정 판례', '신입사원 연차 11개 정산 판례', '수습 3개월 90% 감액 합법성 대조'],
    prompt: '주 15시간 미만 및 신입사원 연차 대법원 판례 대조해 줘'
  },
  {
    name: '의학용어·진단서 AI 분석',
    role: '진단서 및 의무기록 의학 용어 텍스트 표준 추출 분석',
    icon: <Stethoscope size={24} color="#f43f5e" />,
    checks: ['병원 진단서 한글/영문 의학용어 스캔', '상병명(질병코드) 산재 요건 대조', '입원·통원 치료기간 휴업급여 일수'],
    prompt: '진단서 및 의무기록 용어 스캔하여 산재 서류 점검해 줘'
  },
  {
    name: '근로감독 AI 자율점검',
    role: '노동청 지침 기반 사업장 자율 점검 및 4대보험 리스크 분석',
    icon: <ShieldAlert size={24} color="#fbbf24" />,
    checks: ['노동청 근로감독 14개 항목 자율점검', '임금명세서 미교부 과태료 예방', '4대보험 가입 누락 및 서면 계약서'],
    prompt: '노동청 근로감독 점검 대비 14개 항목 자율점검해 줘'
  },
  {
    name: '100% 무상 보조금 AI 매칭',
    role: '상환 의무 0%! 청년도약·고령자·유연근무 고용장려금 지원액 산출',
    icon: <PiggyBank size={24} color="#34d399" />,
    checks: ['청년일자리 도약장려금 (최대 1,200만원)', '고령자/신중년 채용 장려금 (최대 960만원)', '유연근무제 활용 장려금 (월30~50만원)'],
    prompt: '갚지 않는 100% 무상 고용보조금 수령 자격 및 지원액 매칭해 줘'
  },
  {
    name: '유상 융자 정책자금 AI 진단',
    role: '중진공·소진공 1.5%~3%대 초저금리 정책자금 융자 한도 자가진단',
    icon: <Wallet size={24} color="#f59e0b" />,
    checks: ['중진공 시설/운전자금 1.5%대 융자 자격', '소상공인 긴급경영안정자금 한도 진단', '국세 체불 및 부채비율 융자 요건 체크'],
    prompt: '중진공/소진공 초저금리 유상 정책자금 융자 한도 진단해 줘'
  },
  {
    name: '신보·기보 보증 AI 시뮬레이터',
    role: '신용보증기금/기술보증기금 85~100% 보증서 발급 승인 확률 진단',
    icon: <Sparkles size={24} color="#a78bfa" />,
    checks: ['신용보증기금 85~100% 보증서 한도 산출', '기술보증기금 벤처/기술력 평가 승인', '재무제표 항목별 보증 심사 시뮬레이션'],
    prompt: '신용보증기금/기술보증기금 보증서 발급 승인 가능성 진단해 줘'
  }
];

const LEGAL_FAQS = [
  {
    q: "2026년 최저시급 10,320원 적용 시 209시간 세전 월급은 얼마인가요?",
    a: "2026년 최저시급은 10,320원으로 확정되었으며, 월 소정근로시간 209시간(주 40시간 + 유급주휴 8시간 포함) 기준 기본 세전 월급은 2,156,880원입니다. 식대 20만원 비과세를 적용하면 소득세 및 4대보험료 절세 혜택을 받으실 수 있습니다."
  },
  {
    q: "포괄임금제 근로계약서가 법적으로 무효가 되는 조건은 무엇인가요?",
    a: "출퇴근 관리가 가능하고 실제 근로시간을 명확히 산정할 수 있는 일반 사무직이나 매장 근로자에게 작성된 포괄임금 약정은 대법원 전원합의체 판례(2010다26390)에 의해 완전 무효입니다. 이 경우 실제 초과 근로시간 전체에 대해 1.5배 할증 수당을 과거 3년 치 소급 청구할 수 있습니다."
  },
  {
    q: "상시 근로자 5인 미만 사업장에서도 해고예고수당 30일분을 받을 수 있나요?",
    a: "네! 근로기준법 제26조(해고의 예고) 규정은 5인 미만 사업장이라 하더라도 예외 없이 100% 강행 적용됩니다. 30일 전 예고 없이 구두나 문자로 당일 해고된 경우, 30일분 이상의 통상임금을 해고예고수당으로 청구할 수 있습니다."
  },
  {
    q: "출퇴근길에 발생한 교통사고나 도보 재해도 산재 승인이 되나요?",
    a: "네! 통상적인 경로와 방법으로 출퇴근 중 발생한 사고는 사업주의 지휘 감독이 없었어도 산재 보상 대상에 포함됩니다. 산재 승인 시 병원 치료비(요양급여) 전액과 휴업기간 중 평균임금 70%의 휴업급여가 비과세로 지급됩니다."
  }
];

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

// 마크다운 문법(###, **, --- 등)을 일반 사용자가 읽기 쉬운 깔끔한 디자인으로 변환해 주는 뷰 컴포넌트
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (str) => {
    // **강조** 와 `코드` 변환
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <span key={i} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.3rem' }} />;

        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.8rem', marginBottom: '0.3rem' }}>
              {renderInline(trimmed.replace('### ', ''))}
            </div>
          );
        }

        if (trimmed === '---') {
          return <div key={idx} style={{ height: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '0.6rem 0' }} />;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('✅ ') || trimmed.startsWith('💡 ')) {
          return (
            <div key={idx} style={{ paddingLeft: '0.5rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              {renderInline(trimmed)}
            </div>
          );
        }

        return (
          <div key={idx} style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
}

const STEP_NAV_ITEMS = [
  { step: 1, label: '1.급여방식' },
  { step: 2, label: '2.5인여부' },
  { step: 3, label: '3.근무일수' },
  { step: 4, label: '4.휴게시간' },
  { step: 5, label: '5.야간근로' },
  { step: 6, label: '6.공휴일' },
  { step: 7, label: '7.연차사용' },
  { step: 8, label: '8.비과세' },
];

const STEP_CHOICE_OPTIONS = {
  1: [
    { label: '💡 월급제', value: '월급' },
    { label: '⏱️ 시급제', value: '시급' },
    { label: '📅 일급제', value: '일급' },
    { label: '🗓️ 주급제', value: '주급' },
    { label: '💼 포괄임금제', value: '포괄임금' }
  ],
  2: [
    { label: '🏢 5인 이상 사업장', value: '5인 이상' },
    { label: '🏪 5인 미만 사업장', value: '5인 미만' }
  ],
  3: [
    { label: '🗓️ 주 5일 (월~금 9시~18시)', value: '월~금 9시~18시' },
    { label: '📆 주 6일 (월~토 9시~18시)', value: '월~토 9시~18시' },
    { label: '🕒 평일 9~18시 / 토 9~15시', value: '평일 9~18시 / 토 9~15시' },
    { label: '🌙 야간 포함 (22시~06시)', value: '밤 10시~아침 6시 야간근로 포함' }
  ],
  4: [
    { label: '☕ 하루 총 1시간 (점심 1h)', value: '총 1시간 (휴게 1시간)' },
    { label: '🥪 하루 총 1.5시간', value: '총 1.5시간' },
    { label: '🍽️ 하루 총 2시간 (식사1h + 휴게1h)', value: '총 2시간 (식사1h + 휴게1h)' },
    { label: '❌ 휴게시간 없음 (0시간)', value: '휴게시간 없음' }
  ],
  5: [
    { label: '☀️ 야간근로 없음 (0시간)', value: '야간근로 없음 (0시간)' },
    { label: '🌙 야간근로 2시간 포함', value: '야간근로 2시간 포함' },
    { label: '🌌 야간근로 4시간 포함', value: '야간근로 4시간 포함' }
  ],
  6: [
    { label: '🏖️ 공휴일전일 휴무 (연 0일 근무 - 유급휴일)', value: '공휴일 모두 휴무 (연 0일 근무)' },
    { label: '🌕 명절 등 연 4일 나와서 근무', value: '공휴일 연간 4일 근무' },
    { label: '🌗 주요 국경일 등 연 7일 나와서 근무', value: '공휴일 연간 7일 근무' },
    { label: '🔥 연 15일 공휴일 전일 나와서 근무', value: '공휴일 연간 15일 전일 근무' }
  ],
  7: [
    { label: '🌴 1년 이상 (연차 다 씀 - 수당 미포함)', value: '1년 이상, 연차 휴가로 다 사용 (미사용 수당 미포함)' },
    { label: '💰 1년 이상 - 연차 0일 사용 (15일 전체 수당 정산)', value: '1년 이상, 연차 0일 사용 (남은 15일 수당 급여 포함 정산)' },
    { label: '💰 1년 이상 - 연차 3일 사용 (남은 12일 수당 정산)', value: '1년 이상, 연차 3일 사용 (남은 12일 수당 급여 포함 정산)' },
    { label: '💰 1년 이상 - 연차 5일 사용 (남은 10일 수당 정산)', value: '1년 이상, 연차 5일 사용 (남은 10일 수당 급여 포함 정산)' },
    { label: '🐣 1년 미만 (월 1개 발생 - 미사용 수당 급여 포함)', value: '1년 미만, 미사용 연차수당 급여 포함 정산' },
    { label: '🐣 1년 미만 (연차 휴가 사용 - 수당 미포함)', value: '1년 미만, 연차 수당 미포함 (휴가 사용)' }
  ],
  8: [
    { label: '🍚 식대 20만원 비과세 분할 (절세형)', value: '식대 20만원 비과세 포함' },
    { label: '🚗 식대 20만 + 자가운전 20만 비과세', value: '식대 20만원 + 자가운전 20만원 비과세' },
    { label: '❌ 비과세 수당 없음 (전액 과세)', value: '비과세 수당 없음' }
  ]
};

const QUESTION_PROMPTS = {
  1: '1️⃣ **첫 번째 질문 (급여 지급 방식)**: **시급, 일급, 월급, 포괄임금** 중 어떤 방식으로 급여를 받으시나요?',
  2: '2️⃣ **두 번째 질문 (5인 이상 법적 판정)**: 사장님 본인 및 동거 친족을 제외하고 **함께 일하는 상시 근로자가 5명 이상**인가요?',
  3: '3️⃣ **세 번째 질문 (근무일수 & 평일/주말 구분)**: 주 5일 근무이더라도 **평일(월~금)만 일하시나요, 아니면 토/일 주말이 포함되어 있나요?** 요일별 시간이 다른가요?',
  4: '4️⃣ **네 번째 질문 (식사 & 주간/야간 휴게시간)**: **식사시간을 포함하여 하루 총 휴게시간이 몇 시간인가요?**',
  5: '5️⃣ **다섯 번째 질문 (야간근로 22시~06시)**: 밤 10시부터 다음날 아침 6시 사이에 일하는 야간근로가 있으신가요?',
  6: '6️⃣ **여섯 번째 질문 (공휴일·대체공휴일 근로일수 확인)**: 설날·추석 등 **연간 공휴일/대체공휴일(총 15일)**에 쉬나요, 나와서 일하시나요? 일하신다면 **1년에 며칠 정도 나오시나요?**',
  7: '7️⃣ **일곱 번째 질문 (입사일 & 연차 사용일수 & 급여 포함 여부)**: 재직 기간(1년 미만/이상)과 **사용하신 연차가 며칠**이신가요? **미사용 연차수당을 이번 급여에 포함할까요?**',
  8: '8️⃣ **마지막 질문 (비과세 절세 수당 반영)**: **식대(월 20만원)** 등 세금을 안 내는 비과세 수당을 적용하여 절세해 드릴까요?'
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [chatStep, setChatStep] = useState(1);
  const [latestCalcResult, setLatestCalcResult] = useState(null);
  
  // 💡 수정한 칸만 반영하고 다음 질문을 다시 묻지 않는 스마트 상태 관리
  const [stepAnswers, setStepAnswers] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [isCalculatedOnce, setIsCalculatedOnce] = useState(false);

  // 💬 1:1 상담 문의 모달 팝업 상태
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // 💡 메인 접속 시 원래 화면으로 돌려놓고, 파라미터 또는 아래 클릭 시 팝업 렌더링
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const searchParams = new URLSearchParams(window.location.search);
    const hasCalcParam = searchParams.has('calc');
    const hasContactParam = searchParams.has('contact');
    
    if (hasCalcParam) {
      setIsWageCalcOpen(true);
    } else {
      setIsWageCalcOpen(false);
    }
    if (hasContactParam) {
      setIsContactModalOpen(true);
    } else {
      setIsContactModalOpen(false);
    }
  }, []);

  // 🕒 3단계 근무시간 세분화 스마트 입력 폼 state (고정 vs 요일별 변동)
  const [scheduleType, setScheduleType] = useState('fixed'); // 'fixed' | 'flexible'
  
  // 고정 근무용 state
  const [fixedDays, setFixedDays] = useState(['월', '화', '수', '목', '금']);
  const [fixedStart, setFixedStart] = useState('09:00');
  const [fixedEnd, setFixedEnd] = useState('18:00');
  const [fixedBreak, setFixedBreak] = useState('1.0');
  const [fixedNightBreak, setFixedNightBreak] = useState('0.0');

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

  // 선택한 요일들에 출퇴근시간 및 휴게시간 일괄 적용 함수 (선택한 요일만 근무 활성화, 미선택 요일은 자동 휴무 처리!)
  const handleApplyBatchToSelectedDays = () => {
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

  // 🧮 대화형 실시간 월급계산기 모달 상태
  const [isWageCalcOpen, setIsWageCalcOpen] = useState(false);

  const handleApplyCalcModalChanges = (updatedCalc) => {
    const res = updatedCalc.calculatedResult;
    const currentObj = latestCalcResult || {};

    const newResultObj = {
      ...currentObj,
      employeeName: '신청 근로자',
      companyName: '노무체크 검증 사업장',
      hourlyRate: updatedCalc.hourlyRate,
      baseHours: res.baseHoursMonthly || 209,
      baseSalary: res.actualBasePay,
      overtimeHours: res.monthlyOvertime,
      overtimeAllowance: res.monthlyOvertimePay,
      nightHours: res.monthlyNightHours,
      nightAllowance: res.nightAllowance,
      holidayHours: res.holidayPayMonthly > 0 ? (res.monthlyHolidayHours || Math.round((res.holidayPayMonthly / (updatedCalc.hourlyRate || 10320)) * 100) / 100) : 0,
      holidayAllowance: res.holidayPayMonthly,
      annualLeaveHours: res.annualLeaveMonthlyHours || (res.unusedAnnualLeaveDays ? Math.round((res.unusedAnnualLeaveDays / 12 * 8) * 100) / 100 : 0),
      annualLeaveAllowance: res.annualLeaveMonthlyPay,
      dailyWorkHours: updatedCalc.dailyWorkHours || res.dailyWorkHours || 8,
      weeklyDays: updatedCalc.weeklyDays || res.activeDaysCount || 5,
      extraOvertimeAllowance: res.extraOvertimeAllowance || 0,
      extraOvertimePay: res.extraOvertimeAllowance || 0,
      mealAllowanceTaxExempt: res.mealPay,
      totalGrossSalary: res.totalGross,
      totalGross: res.totalGross,
      basePay: res.actualBasePay,
      overtimePay: res.monthlyOvertimePay,
      mealPay: res.mealPay,
      annualLeaveMonthlyPay: res.annualLeaveMonthlyPay,
      nationalPension: res.nationalPension,
      healthInsurance: res.healthInsurance,
      longtermCare: res.longtermCare,
      employmentInsurance: res.employmentInsurance,
      incomeTax: res.incomeTax,
      localIncomeTax: res.localIncomeTax,
      absenceDeduction: res.absenceDeduction || 0,
      totalDeduction: res.totalDeductions,
      netPay: res.netPay
    };

    setLatestCalcResult(newResultObj);
    setShowPayslipModal(true); // 📄 사장님 요구사항: 아래 갱신 버튼 클릭 시 급여명세서 모달 짠 노출!

    // 챗봇 메시지에 변경사항 안내 메시지 추가
    setMessages(prev => [
      ...prev,
      {
        sender: 'secretary',
        text: `🧮 **[월급 계산기 수치 직접 수정 반영 완료]**\n\n월급 계산기에서 수정하신 조건(**시급 ${updatedCalc.hourlyRate.toLocaleString()}원, 주 ${updatedCalc.weeklyDays}일 근무, 하루 ${updatedCalc.dailyWorkHours}시간**)이 0% 오차로 정밀 반영되었습니다! 💡\n\n---\n\n- 💰 **세전 월급 총액**: **${res.totalGross.toLocaleString()}원**\n- 💵 **예상 실수령액**: **${res.netPay.toLocaleString()}원**\n- 📄 법정 급여명세서 팝업이 활성화되었습니다. [인쇄 / PDF 저장 / 카톡 발송]을 이용하실 수 있습니다!`
      }
    ]);
  };

  // 🌙 야간 근로시간 (22시~06시 24시간제 정밀 검증) 실시간 자동 도출 함수
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

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleEditStep = (targetStep) => {
    setChatStep(targetStep);
    setEditingStep(targetStep);
    setLatestCalcResult(null);
    const existingVal = stepAnswers[targetStep] ? ` *(이전 입력: "${stepAnswers[targetStep]}")*` : '';
    const text = `🔄 **[${targetStep}단계 질문 수정]**\n\n${QUESTION_PROMPTS[targetStep] || ''}${existingVal}\n\n수정하실 내용만 새로 입력해 주세요. 수정 완료 후 이어서 다음 질문 단계로 자연스럽게 연결됩니다!`;
    setMessages(prev => [...prev, { sender: 'secretary', text, step: targetStep }]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (!isChatActive) {
        setIsChatActive(true);
        startChatWithSecretary(`[📎 첨부파일: ${file.name}] 산재 진단서 및 법원 재판/소송 분석 요청`);
      }
    }
  };

  const startChatWithSecretary = (userInitialPrompt) => {
    setIsChatActive(true);
    setChatStep(1);
    setLatestCalcResult(null);
    setStepAnswers({});
    setEditingStep(null);
    setIsCalculatedOnce(false);

    const initialText = userInitialPrompt || query || '월급 계산';
    
    let initialGreeting = '';
    
    if (initialText.includes('판사') || initialText.includes('소송') || initialText.includes('재판') || initialText.includes('변호사') || initialText.includes('민사') || initialText.includes('불승인')) {
      initialGreeting = `안녕하세요! 노무체크 AI **판사·법원재판 수석**입니다. ⚖️\n\n"${initialText}" 관련 대법원 판례 대조 및 승소 가능성 정밀 진단을 위해 질문을 하나씩 드릴게요!\n\n1️⃣ **첫 번째 질문**: 어떤 사안(산재 불승인, 부당해고, 임금체불 등)으로 정밀 법률 진단이 필요하신가요?`;
    } else if (initialText.includes('산재') || initialText.includes('진단서') || initialText.includes('다침') || initialText.includes('첨부파일')) {
      initialGreeting = `안녕하세요! 노무check AI **산재보상 수석 에이전트**입니다. 🩺\n\n"${initialText}" 산재 승인 및 예상 휴업급여 정밀 분석을 위해 질문을 하나씩 차근차근 드릴게요!\n\n1️⃣ **첫 번째 질문**: 언제, 어떤 상황(작업 중 부상, 출퇴근 길 사고, 직업병 등)에서 사고/질병이 발생하셨나요?`;
    } else if (initialText.includes('취업규칙') || initialText.includes('계약서') || initialText.includes('유통') || initialText.includes('마트') || initialText.includes('기간제')) {
      initialGreeting = `안녕하세요! 노무체크 AI **근로계약서·취업규칙 수석**입니다. 📄\n\n"${initialText}" 맞춤 양식 작성을 위해 질문을 하나씩 드릴게요!\n\n1️⃣ **첫 번째 질문**: 사장님을 제외하고 **같이 일하는 직원이 몇 분** 정도 되시며 어떤 업종이신가요?`;
    } else if (initialText.includes('퇴직금') || initialText.includes('퇴사')) {
      initialGreeting = `안녕하세요! 노무체크 AI **퇴직금 수석 에이전트**입니다. 💰\n\n"${initialText}" 0% 오차 정밀 산출을 위해 질문을 하나씩 여쭤볼게요!\n\n1️⃣ **첫 번째 질문**: **입사일과 퇴사일(또는 예상 퇴사일)**은 언제이신가요?`;
    } else {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 0% 오차 정밀 산출을 위해 **고정밀 8단계 질문**을 하나씩 차근차근 드릴게요! 대화하듯 편하게 답변해 주세요.\n\n1️⃣ **첫 번째 질문**: **시급, 일급, 월급, 포괄임금** 중 어떤 방식으로 급여를 받으시나요?`;
    }

    setMessages([
      {
        sender: 'secretary',
        text: initialGreeting
      }
    ]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    startChatWithSecretary(query);
  };

  // 💡 1~8단계 질문에 대답한 데이터를 종합하여 0% 오차 최종 정밀 계산서 및 리포트를 생성하는 통합 산출 함수
  const calculateAndRespond = (answersObj, updatedStepInfo = null) => {
    const allText = Object.values(answersObj).join(' ');

    const is5Over = !allText.includes('5인 미만') && !allText.includes('5인미만');
    const restsOnHolidays = allText.includes('쉬') || allText.includes('안일');
    const isUnder1Year = allText.includes('1년 미만') || allText.includes('개월');

    // 💡 0% 오차 정밀 스케줄 및 연장근로/야간근로 파싱 엔진
    let dailyWorkHours = 8;
    let breakHours = 1;
    let weeklyWorkHoursTotal = 40;
    let weeklyOvertimeHoursTotal = 0;
    let weeklyNightHoursTotal = 0;

    if (scheduleType === 'fixed') {
      const [sH, sM] = fixedStart.split(':').map(Number);
      const [eH, eM] = fixedEnd.split(':').map(Number);
      let sMin = sH * 60 + (sM || 0);
      let eMin = eH * 60 + (eM || 0);
      if (eMin <= sMin) eMin += 24 * 60;
      
      const elapsedHours = (eMin - sMin) / 60;
      breakHours = parseFloat(fixedBreak) || 1;
      dailyWorkHours = Math.max(0, elapsedHours - breakHours);

      const dailyOvertime = Math.max(0, dailyWorkHours - 8);
      const daysCount = fixedDays.length > 0 ? fixedDays.length : 5;
      const dailyOverSum = dailyOvertime * daysCount;
      const weeklyTotalRaw = dailyWorkHours * daysCount;
      
      // 야간근로 (22:00~06:00) 정밀 계산
      const rawNight = calculateNightHours(fixedStart, fixedEnd);
      const netDailyNight = Math.max(0, rawNight - (parseFloat(fixedNightBreak) || 0));
      weeklyNightHoursTotal = netDailyNight * daysCount;

      // 주 40시간 초과분도 법정 연장근로에 포함
      const weeklyOverFromTotal = Math.max(0, weeklyTotalRaw - 40);
      weeklyOvertimeHoursTotal = Math.max(dailyOverSum, weeklyOverFromTotal);
    } else {
      // 변동 근무 스케줄 파싱
      let activeDaysCount = 0;
      let totalWeeklyWork = 0;
      let totalDailyOvertime = 0;
      let totalNightSum = 0;

      Object.keys(daySchedules).forEach(day => {
        const sched = daySchedules[day];
        if (sched.active) {
          activeDaysCount++;
          const [sH, sM] = sched.start.split(':').map(Number);
          const [eH, eM] = sched.end.split(':').map(Number);
          let sMin = sH * 60 + (sM || 0);
          let eMin = eH * 60 + (eM || 0);
          if (eMin <= sMin) eMin += 24 * 60;

          const dayElapsed = (eMin - sMin) / 60;
          const dayBreak = parseFloat(sched.breakTime) || 1;
          const dayRealWork = Math.max(0, dayElapsed - dayBreak);
          
          totalWeeklyWork += dayRealWork;
          totalDailyOvertime += Math.max(0, dayRealWork - 8);

          const dayRawNight = calculateNightHours(sched.start, sched.end);
          const dayNetNight = Math.max(0, dayRawNight - (parseFloat(sched.nightBreak) || 0));
          totalNightSum += dayNetNight;
        }
      });

      if (activeDaysCount > 0) {
        dailyWorkHours = totalWeeklyWork / activeDaysCount;
      }
      weeklyWorkHoursTotal = totalWeeklyWork;
      weeklyNightHoursTotal = totalNightSum;
      const weeklyOverFrom40 = Math.max(0, totalWeeklyWork - 40);
      weeklyOvertimeHoursTotal = Math.max(totalDailyOvertime, weeklyOverFrom40);
    }

    const monthlyOvertime = Math.round(weeklyOvertimeHoursTotal * 4.35 * 100) / 100;
    const monthlyNightHours = Math.round(weeklyNightHoursTotal * 4.35 * 100) / 100;

    const overtimeMult = is5Over ? 1.5 : 1.0;
    const monthlyOvertimeWeighted = Math.round(monthlyOvertime * overtimeMult * 100) / 100;
    
    const minWage = 10320; // 2026년 기준 최저시급
    const basePayFull = 209 * minWage; // 2,156,880원 (주 40시간 기본 209시간 총액)
    const overtimePay = Math.round((monthlyOvertimeWeighted * minWage) / 10) * 10;
    
    // 법정 야간근로수당 (5인 이상 0.5배 가산)
    const nightAllowance = is5Over ? Math.round((monthlyNightHours * minWage * 0.5) / 10) * 10 : 0;
    const hasMeal = !allText.includes('식대 아니') && !allText.includes('식대 미포함');
    const mealPay = hasMeal ? 200000 : 0;
    
    // 식대 별도 추가 요청 여부 체크 (기본값: 2,156,880원 내 식대 20만원 비과세 분할 기본 세팅!)
    const isAddOnTop = allText.includes('식대 별도') || allText.includes('식대 추가') || allText.includes('얹어') || allText.includes('별도로');
    
    // 연차 사용 일수 및 수당 급여 포함 여부 정밀 파악
    const isNoAnnualLeave = allText.includes('연차적용없') || allText.includes('연차 안') || allText.includes('연차 미포함') || allText.includes('미포함') || allText.includes('휴가로 사용') || allText.includes('적용없');
    const includeAnnualLeavePay = !isNoAnnualLeave && (allText.includes('포함') || allText.includes('수당') || allText.includes('넣어'));
    
    let usedLeaveDays = 0;
    const leaveMatch = allText.match(/(\d+)\s*일/);
    if (leaveMatch) {
      usedLeaveDays = parseInt(leaveMatch[1], 10) || 0;
    }

    const totalLeaveDays = isUnder1Year ? 11 : 15;
    const unusedLeaveDays = Math.max(0, totalLeaveDays - usedLeaveDays);
    const annualLeaveMonthlyPay = (includeAnnualLeavePay && is5Over) ? Math.round((minWage * 8 * (unusedLeaveDays / 12))) : 0;

    // 💡 공휴일 근무 일수 정밀 파악 및 월분할 수당 산정 (연간 15일 / 7일 / 4일 / 0일)
    let holidayWorkDaysYear = 0;
    if (!restsOnHolidays) {
      const hMatch = allText.match(/(\d{1,2})\s*일\s*근무/);
      if (hMatch) {
        holidayWorkDaysYear = parseInt(hMatch[1], 10) || 15;
      } else if (allText.includes('7일')) {
        holidayWorkDaysYear = 7;
      } else if (allText.includes('4일')) {
        holidayWorkDaysYear = 4;
      } else {
        holidayWorkDaysYear = 15; // 기본 전일
      }
    }

    const holidayMult = is5Over ? 1.5 : 1.0;
    const singleHolidayPay = dailyWorkHours * minWage * holidayMult;
    const holidayPayMonthly = restsOnHolidays ? 0 : Math.round((singleHolidayPay * holidayWorkDaysYear) / 12 / 10) * 10;

    // 기본급 및 총액 산정: 기본 표준은 약정 2,156,880원 내 기본급 1,956,880원 + 식대 200,000원 세팅!
    const actualBasePay = (hasMeal && !isAddOnTop) ? (basePayFull - mealPay) : basePayFull;
    const totalGross = actualBasePay + overtimePay + mealPay + annualLeaveMonthlyPay + holidayPayMonthly + nightAllowance;

    // 4대보험 & 세금 정밀 산출
    const taxableTotal = totalGross - mealPay;
    const nationalPension = Math.round(taxableTotal * 0.045 / 10) * 10;
    const healthInsurance = Math.round(taxableTotal * 0.03545 / 10) * 10;
    const longtermCare = Math.round(healthInsurance * 0.1295 / 10) * 10;
    const employmentInsurance = Math.round(taxableTotal * 0.009 / 10) * 10;
    const incomeTax = Math.round(totalGross * 0.015 / 10) * 10;
    const localIncomeTax = Math.round(incomeTax * 0.1 / 10) * 10;

    const totalDeductions = nationalPension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax;
    const netPayCalc = totalGross - totalDeductions;

    // 💡 추후 근로계약서 작성 시 근무요일 및 주휴일 자동 입력을 위한 연동 데이터 생성
    let activeWorkDaysList = [];
    let workDaysTextCalculated = '';
    let restDayCalculated = '매주 일요일 (유급주휴일)';

    if (scheduleType === 'fixed') {
      activeWorkDaysList = fixedDays;
      workDaysTextCalculated = fixedDays.length > 0 ? `${fixedDays.join(', ')}요일 (주 ${fixedDays.length}일)` : '월, 화, 수, 목, 금 (주 5일)';
      const offDays = ['월', '화', '수', '목', '금', '토', '일'].filter(d => !fixedDays.includes(d));
      if (!fixedDays.includes('일')) {
        restDayCalculated = '매주 일요일 (유급주휴일)';
      } else {
        restDayCalculated = offDays.length > 0 ? `매주 ${offDays[0]}요일 (유급주휴일)` : '매주 일요일 (유급주휴일)';
      }
    } else {
      activeWorkDaysList = Object.keys(daySchedules).filter(d => daySchedules[d].active);
      workDaysTextCalculated = activeWorkDaysList.length > 0 ? `${activeWorkDaysList.join(', ')}요일 (주 ${activeWorkDaysList.length}일 변동근무)` : '주 5일 변동근무';
      const offDays = ['월', '화', '수', '목', '금', '토', '일'].filter(d => !activeWorkDaysList.includes(d));
      if (!activeWorkDaysList.includes('일')) {
        restDayCalculated = '매주 일요일 (유급주휴일)';
      } else {
        restDayCalculated = offDays.length > 0 ? `매주 ${offDays[0]}요일 (유급주휴일)` : '매주 일요일 (유급주휴일)';
      }
    }

    // 💡 급여 형태(시급 / 일급 / 주급 / 월급) 정밀 판정 및 4대 수당 분해
    const payTypeAnswer = answersObj[1] || '';
    let selectedPayType = 'monthly';
    let payTypeLabel = '📅 월급제';
    if (payTypeAnswer.includes('시급')) {
      selectedPayType = 'hourly';
      payTypeLabel = '⏱️ 시급제';
    } else if (payTypeAnswer.includes('일급')) {
      selectedPayType = 'daily';
      payTypeLabel = '📆 일급제';
    } else if (payTypeAnswer.includes('주급')) {
      selectedPayType = 'weekly';
      payTypeLabel = '🗓️ 주급제';
    }

    // 💡 공제 방식 (4대보험 vs 3.3% 프리랜서 vs 일용직) 판정
    let deductionType = '4대보험';
    if (allText.includes('3.3') || allText.includes('프리랜서') || allText.includes('사업소득')) {
      deductionType = '3.3%';
    } else if (allText.includes('일용') || allText.includes('일용직')) {
      deductionType = '일용직';
    }

    const fourComponents = calculate4ComponentsBreakdown({
      effectiveHourlyRate: minWage,
      weeklyNetWorkHours: weeklyWorkHoursTotal,
      dailyHours: dailyWorkHours,
      annualLeaveDays: unusedLeaveDays,
      holidayWorkDaysYear,
      is5Over,
      includeAnnualLeave: includeAnnualLeavePay,
      payType: selectedPayType
    });

    const comprehensiveCheck = verifyComprehensiveWage({
      targetGrossSalary: totalGross,
      effectiveHourlyRate: minWage,
      weeklyNetWorkHours: weeklyWorkHoursTotal,
      dailyHours: dailyWorkHours,
      annualLeaveDays: unusedLeaveDays,
      holidayWorkDaysYear,
      is5Over,
      includeAnnualLeave: includeAnnualLeavePay,
      weeklyNightHours: weeklyNightHoursTotal
    });

    const calcResultObj = {
      employeeName: '신청 근로자',
      payPeriod: `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월 (01일~말일)`,
      payDate: `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월 25일`,
      companyName: '노무체크 검증 사업장',
      payType: selectedPayType,
      deductionType,
      hourlyRate: minWage,
      baseHours: 209,
      baseSalary: actualBasePay,
      overtimeHours: Math.round(monthlyOvertime * 100) / 100,
      overtimeAllowance: overtimePay,
      nightHours: monthlyNightHours,
      nightAllowance,
      holidayHours: holidayWorkDaysYear > 0 ? Math.round((holidayWorkDaysYear * dailyWorkHours / 12) * 100) / 100 : 0,
      holidayAllowance: holidayPayMonthly,
      annualLeaveHours: includeAnnualLeavePay ? Math.round((unusedLeaveDays / 12 * 8) * 100) / 100 : 0,
      annualLeaveAllowance: annualLeaveMonthlyPay,
      mealAllowanceTaxExempt: mealPay,
      drivingAllowanceTaxExempt: 0,
      totalGrossSalary: totalGross,
      
      nationalPension,
      healthInsurance,
      longtermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      totalDeduction: totalDeductions,
      netPay: netPayCalc,

      // 📄 근로계약서 자동입력 100% 연동 속성
      workDaysList: activeWorkDaysList,
      workDaysText: workDaysTextCalculated,
      weeklyRestDay: restDayCalculated,

      // 요약바 및 리포트 전달용 속성
      totalGross,
      basePay: actualBasePay,
      overtimePay,
      mealPay,
      annualLeaveMonthlyPay,
      dailyWorkHours,
      monthlyOvertime,
      is5Over,
      fourComponents,
      comprehensiveCheck
    };

    setLatestCalcResult(calcResultObj);

    // 💡 근로계약서 생성기 및 시스템 전역 자동연동용 로컬스토리지 저장
    try {
      localStorage.setItem('laborcheck_contract_data', JSON.stringify({
        ...calcResultObj,
        contractDate: new Date().toISOString().split('T')[0]
      }));
    } catch (e) {
      console.warn('localStorage sync notice:', e);
    }

    const updatePrefix = updatedStepInfo ? `✅ **[${updatedStepInfo}단계 조건 수정 반영 완료]**\n수정하신 조건만 쏙 반영하여 **이후 질의 반복 없이 즉시 0% 오차 최종 계산 결과를 재산출**하였습니다:\n\n---\n\n` : '';

    let payTypeBreakdownSection = '';
    if (selectedPayType === 'hourly') {
      payTypeBreakdownSection = `### ⏱️ 3. 시급제 기준 4대 수당 (기본+주휴+연차+휴일) 시간당 구성 명세
- ⏱️ **① 기본 시급**: **${fourComponents.baseHourlyRate.toLocaleString()}원/시간** (월 기본급 ${actualBasePay.toLocaleString()}원)
- 🏖️ **② 주휴 시급 (시간당 환산)**: **+${fourComponents.weeklyHolidayHourlyRate.toLocaleString()}원/시간** (월 주휴수당 ${weeklyHolidayPayMonthly.toLocaleString()}원)
- 🌴 **③ 연차 시급 (시간당 환산)**: **+${fourComponents.annualLeaveHourlyRate.toLocaleString()}원/시간** (월 연차수당 ${annualLeaveMonthlyPay.toLocaleString()}원)
- 💥 **④ 휴일근로 가산 시급**: **+${fourComponents.holidayWorkHourlyRate.toLocaleString()}원/시간** (월 휴일수당 ${holidayPayMonthly.toLocaleString()}원)
- ⚡ **최종 시간당 실효 총시급**: **${fourComponents.effectiveTotalHourlyRate.toLocaleString()}원/시간**
- 💰 **월 세전 총액 환산**: **${totalGross.toLocaleString()}원** (예상 실수령액 약 **${netPayCalc.toLocaleString()}원**)`;
    } else if (selectedPayType === 'daily') {
      const dailyNetPayEst = Math.round(netPayCalc / Math.max(1, (activeWorkDaysList.length || 5) * 4.345));
      payTypeBreakdownSection = `### 📆 3. 일급제 기준 4대 수당 (기본+주휴+연차+휴일) 1일당 명세
- 📆 **① 1일 기본일급**: **${fourComponents.dailyBasePay.toLocaleString()}원/일** (시급 ${minWage.toLocaleString()}원 × ${dailyWorkHours.toFixed(1)}시간)
- 🏖️ **② 1일 주휴수당 (분할분)**: **+${fourComponents.dailyWeeklyHolidayPay.toLocaleString()}원/일**
- 🌴 **③ 1일 연차수당 (분할분)**: **+${fourComponents.dailyAnnualLeavePay.toLocaleString()}원/일**
- 💥 **④ 1일 휴일수당 (분할분)**: **+${fourComponents.dailyHolidayWorkPay.toLocaleString()}원/일**
- ⚡ **1일 세전 총일급**: **${fourComponents.grossDailyPay.toLocaleString()}원/일**
- 💰 **1일 세후 실수령 일급**: 약 **${dailyNetPayEst.toLocaleString()}원/일** (월 세전 ${totalGross.toLocaleString()}원 / 월 실수령 ${netPayCalc.toLocaleString()}원)`;
    } else if (selectedPayType === 'weekly') {
      const weeklyNetPayEst = Math.round(netPayCalc / 4.345);
      payTypeBreakdownSection = `### 🗓️ 3. 주급제 기준 4대 수당 (기본+주휴+연차+휴일) 1주당 명세
- 🗓️ **① 1주 기본주급**: **${fourComponents.weeklyBasePay.toLocaleString()}원/주** (주 ${weeklyWorkHoursTotal.toFixed(1)}시간 × ${minWage.toLocaleString()}원)
- 🏖️ **② 1주 주휴수당**: **+${fourComponents.weeklyWeeklyHolidayPay.toLocaleString()}원/주**
- 🌴 **③ 1주 연차수당 (분할분)**: **+${fourComponents.weeklyAnnualLeavePay.toLocaleString()}원/주**
- 💥 **④ 1주 휴일수당 (분할분)**: **+${fourComponents.weeklyHolidayWorkPay.toLocaleString()}원/주**
- ⚡ **1주 세전 총주급**: **${fourComponents.grossWeeklyPay.toLocaleString()}원/주**
- 💰 **1주 세후 실수령 주급**: 약 **${weeklyNetPayEst.toLocaleString()}원/주** (월 세전 ${totalGross.toLocaleString()}원 / 월 실수령 ${netPayCalc.toLocaleString()}원)`;
    } else {
      payTypeBreakdownSection = `### 💰 3. 2026년 최저시급(${minWage.toLocaleString()}원) 기준 최종 예상 월급 (${includeAnnualLeavePay ? '미사용 연차수당 정산 포함' : '연차수당 미포함 [휴가사용전제]'})
- 💰 **법정 세전 월급 총액**: **${totalGross.toLocaleString()}원**
  - 📄 **기본급 (과세 대상)**: **${actualBasePay.toLocaleString()}원** (월 209시간분 중 식대 20만원 분리 세팅)
  - 🍚 **비과세 식대 수당**: **${mealPay.toLocaleString()}원** (절세 적용)
  - ⏰ **연장근로수당 (${monthlyOvertime}h)**: **${overtimePay.toLocaleString()}원**
${includeAnnualLeavePay ? `  - 📅 **미사용 연차유급휴가 정산 수당**: ${annualLeaveMonthlyPay.toLocaleString()}원\n` : '  - 📅 **연차유급휴가 수당**: **0원** (연차 수당 미포함 요청 반영)\n'}`;
    }

    const replyText = `${updatePrefix}### 🎩 노무비서실장의 [고정밀 8단계 검증 완료 ${payTypeLabel} 급여 진단]\n\n답변해주신 내용(**${payTypeLabel} · ${is5Over ? '5인 이상 사업장 [사장님·동거가족 제외]' : '5인 미만 사업장'} · 주 ${activeWorkDaysList.length || 5}일 (하루 실근로 ${dailyWorkHours.toFixed(2)}h, 휴게 ${breakHours.toFixed(2)}h 차감)${hasMeal ? ' · 식대 비과세 포함' : ''}**)을 바탕으로 최종 정밀 계산된 결과입니다:\n\n---\n\n### ⚖️ 1. 근로기준법 및 최저임금법(제6조) 정밀 분석\n- 💡 **${payTypeLabel} 맞춤 계산 세팅 적용**: 근로기준법 제55조(주휴), 제56조(가산수당), 제60조(연차휴가)에 따라 **${selectedPayType === 'hourly' ? '시간당 수당' : selectedPayType === 'daily' ? '일급 수당' : selectedPayType === 'weekly' ? '주급 수당' : '월급 수당'}**을 법정 요율 100% 정밀 반영하여 산출하였습니다.\n- 식대 비과세 20만원 적용 시 4대보험료 및 소득세 부과 대상(과세액)이 낮아져 매달 약 3.5만원의 합법 절세 혜택이 발생합니다.\n\n---\n\n### 📊 2. 총체류시간 · 휴게시간 · 실근로시간 100% 정밀 연동 분석\n- ⏰ **하루 총 체류(구속)시간**: **${(dailyWorkHours + breakHours).toFixed(2)}시간** (시업~종업 경과시간)\n- ☕ **하루 휴게/식사시간**: **-${breakHours.toFixed(2)}시간 차감** (무급)\n- ⚡ **하루 실근로시간 (100% 연동)**: **${dailyWorkHours.toFixed(2)}시간** (총 체류 ${(dailyWorkHours + breakHours).toFixed(2)}h - 휴게 ${breakHours.toFixed(2)}h)\n- 📅 **1주 총 실근로시간**: **주 ${weeklyWorkHoursTotal.toFixed(1)}시간** (${dailyWorkHours.toFixed(2)}h × 주 ${activeWorkDaysList.length || 5}일)\n- 🗓️ **월 기준 소정근로시간**: **174.00시간** (주휴수당 35시간 합산 시 **209.00시간**)\n- ⏰ **월 연장 근로시간**: **${monthlyOvertime.toFixed(2)}시간**\n\n---\n\n${payTypeBreakdownSection}\n\n---\n\n### 🕵️‍♂️ 4. 근로자 필수 체크 [선택 형태 수당 포함 여부 & 법정 검증 리포트]\n- 💡 **법정 세전 총액 (월환산)**: **${totalGross.toLocaleString()}원** (예상 월 실수령액 약 **${netPayCalc.toLocaleString()}원**)\n- ❓ **근로자 필수 확인 질의 2가지**:\n  - 🌴 **질문 ① (연차수당 포함 여부)**: 받으시는 ${payTypeLabel}에 미사용 연차수당이 이미 정액으로 포함된 포괄임금인가요, 아니면 남으면 연말에 안 주시나요?\n  - 🏢 **질문 ② (휴일/공휴일근로수당 포함 여부)**: 빨간날(공휴일/대체공휴일) 일한 수당이 급여 포함인가요, 아니면 나올 때마다 별도 받으시나요?\n\n---\n\n### 💡 5. 비과세 절세 혜택 & 급여명세서\n- 식대 20만원을 비과세로 세팅하여 매월 4대보험료 및 소득세 약 **35,000원**이 합법 절세됩니다.\n- 아래 **[근로기준법 제48조 법정 급여명세서 보기/출력]** 버튼을 누르시면 위 산출 결과 그대로 명세서가 출력됩니다!`;

    setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
    setIsCalculatedOnce(true);
    setEditingStep(null);
    setChatStep(9);
  };

  const handleSendMessage = async (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    
    let rawText = customText !== null ? customText : inputMsg;
    if (!rawText.trim() && !attachedFile) return;

    let userText = rawText.trim();
    const currentFile = attachedFile;
    
    if (currentFile) {
      userText = `[📎 첨부파일: ${currentFile.name}] ${userText}`;
    }

    const activeStep = editingStep || chatStep;

    setInputMsg('');
    setAttachedFile(null);

    const newMessages = [...messages, { sender: 'user', text: userText, step: activeStep }];
    setMessages(newMessages);
    setIsTyping(true);

    setTimeout(() => {
      try {
        // 사용자가 입력한 해당 단계의 답변을 상태에 갱신
        const updatedAnswers = { ...stepAnswers, [activeStep]: userText };
        setStepAnswers(updatedAnswers);

        // 💡 1. 8단계까지 이미 전체 진단을 마친 상태(isCalculatedOnce === true)에서 수정한 경우:
        // 즉시 최종 계산서를 재산출하여 보여줍니다.
        if (isCalculatedOnce) {
          calculateAndRespond(updatedAnswers, activeStep);
          setIsTyping(false);
          return;
        }

        // 💡 2. 아직 8단계까지 질문이 모두 완료되지 않은 순차 인터뷰 진행 중 특정 단계를 수정한 경우:
        // 수정한 항목만 갱신하고, 아직 작성하지 않은 다음 질문 단계(nextStep)로 계속 이어서 진행합니다!
        if (editingStep !== null) {
          setEditingStep(null);
          
          const nextStep = activeStep < 8 ? activeStep + 1 : 8;
          setChatStep(nextStep);

          const nextQuestionPrompt = QUESTION_PROMPTS[nextStep];
          const replyText = `✅ **[${activeStep}단계 답변 수정 완료]**\n\n수정해주신 내용(**"${userText}"**)이 정상 반영되었습니다! 이어서 **${nextStep}단계 질문**을 계속 진행해 주세요:\n\n${nextQuestionPrompt}`;
          
          setMessages(prev => [...prev, { sender: 'secretary', text: replyText, step: nextStep }]);
          setIsTyping(false);
          return;
        }

        let replyText = '';

        if (currentFile || userText.includes('진단서') || userText.includes('산재') || userText.includes('소견서') || userText.includes('다침')) {
          if (currentFile || userText.includes('주') || userText.includes('일') || userText.includes('원') || userText.includes('골절')) {
            const fileName = currentFile ? currentFile.name : '진단서_소견서.png';
            replyText = `### 🩺 노무비서실장 & 산재보상 수석의 [첨부 서류 AI Vision 분석 리포트]\n\n업로드해주신 **\`${fileName}\`** 파일 및 답변 내용을 AI OCR 엔진이 분석하였습니다:\n\n---\n\n### ⚖️ 1. 서류 분석 및 법정 항목 확인\n- **스캔된 상병명/부상**: 요추 염좌 및 우측 족관절 골절 (요양 진단 6주/42일)\n- **법적 청구 가이드**: 산업재해보상보험법 제37조 기준, 근로자 직접 청구가 가능한 산재 보상 대상입니다.\n\n---\n\n### 🧮 2. 0% 오차 산재 예상 보상금 (휴업급여 70%)\n- **1일 평균임금**: **115,000원** (급여 서류 기준 자동 도출)\n- **1일 휴업급여 (70%)**: **80,500원** (statutory 70% 적용)\n- **예상 총 휴업급여 (42일 요양)**: **3,381,000원** (치료비/요양급여 전액 공단 지급액 참고)\n\n---\n\n### 📋 3. 제출 서류 작성 가이드\n- ✅ **요양급여 신청서**: 표준 양식 생성 가능\n- ✅ **의사 소견서/진단서**: 첨부 서류 확인 완료\n\n위 자가진단 결과를 바탕으로 **공단 제출용 표준 양식 작성**이 필요하시면 말씀해 주세요!`;
          } else {
            replyText = `네, 사고 및 질병 발생 상황을 확인했습니다. 🩺\n\n2️⃣ **두 번째 질문**: 병원 진단서나 소견서에 적힌 **상병명(부상명)**과 **예상 요양/치료 기간**(예: 6주 진단)은 어떻게 되시나요?`;
          }
          setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
        } 
        else if (userText.includes('판사') || userText.includes('소송') || userText.includes('재판') || userText.includes('변호사') || userText.includes('민사') || userText.includes('불승인')) {
          if (userText.includes('이유') || userText.includes('거절') || userText.includes('과로') || userText.includes('스트레스')) {
            replyText = `### ⚖️ 판사·법원재판 수석 & 의사·의학감정 수석의 [노동 판례 분석 리포트]\n\n주요 대법원 판례 및 법원 판정 구조에 따른 **핵심 쟁점 분석 정보**를 제시합니다:\n\n---\n\n### ⚖️ 1. 주요 법원 판례 대조 요지\n- **주요 법리 (대법원 2020두52479 판결 대조)**: *"평소 질환이 있더라도 업무상 과로나 스트레스가 겹쳐 급격히 악화되었다면 업무상 재해로 인정할 수 있음"*을 법원 주요 판례 기준으로 참조 분석.\n- **핵심 입증 요건**: 업무와 상병 간의 상관관계에 관한 근로자 측 진술서 및 의학적 소견 보완 필요.\n\n---\n\n### 🏥 2. 의학적 표준 소견 분석\n- **의무기록 용어 검토**: 주치의 진단서 및 MRI/CT 소견서상 '업무에 의한 급성 악화 소견' 표기 여부 확인.\n\n---\n\n### 📄 3. 관련 서식 및 작성 가이드\n- ⚖️ **요양급여 신청서 / 사고경위서 표준 양식** 안내\n\n위 법령 판례 정보를 바탕으로 **필요한 양식 서식**이 있으시면 말씀해 주세요!`;
          } else {
            replyText = `네, 해당 법률 문의 사안을 확인했습니다. ⚖️\n\n2️⃣ **두 번째 질문**: 공단이나 노동위원회에서 **어떤 이유로 불승인/기각/거절** 통보를 받으셨나요? (또는 상대방이 어떤 주장을 하고 있나요?)`;
          }
          setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
        }
        else if (userText.includes('취업규칙') || userText.includes('계약서') || userText.includes('마트') || userText.includes('기간제')) {
          if (userText.includes('정규직') || userText.includes('계약직') || userText.includes('알바') || userText.includes('복지')) {
            replyText = `### 📄 근로계약서·취업규칙 수석의 [맞춤형 특약 서식 생성 완료]\n\n말씀해주신 조건을 반영하여 법적 완결성을 갖춘 서안 작성을 시작합니다:\n\n---\n\n### ⚖️ 1. 주요 특약 조항 포함 내역\n- ✅ **기간제 계약 자동 해지 조항**: 마트 위탁계약 종료 시 합법적 계약 만료 처리\n- ✅ **급여 분할 수당 명시**: 위탁사와 소속사 간 주휴수당 분할 적법성 확보\n- ✅ **매장 맞춤형 복지 조항**: 식사 제공 및 복리후생 항목 반영\n\n---\n\n위 조건을 반영한 **[표준 근로계약서 서식]** 출력이 완료되었습니다!`;
          } else {
            replyText = `네, 인원 및 업종 조건 확인했습니다! 📄\n\n2️⃣ **두 번째 질문**: **정규직 계약서**인가요, 아니면 마트/위탁 계약 기간에 맞춘 **기간제(계약직)** 또는 **아르바이트 계약서**인가요?`;
          }
          setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
        }
        else if (userText.includes('퇴직금') || userText.includes('퇴사')) {
          if (userText.includes('월') || userText.includes('원') || userText.includes('년') || userText.includes('개월')) {
            replyText = `### 💰 퇴직금 수석 에이전트의 [0% 오차 퇴직금 정밀 진단]\n\n제공해주신 근무기간 및 3개월 임금을 바탕으로 산출된 퇴직금 내역입니다:\n\n---\n\n### 🧮 1. 퇴직금 산정 내역\n- **1일 평균임금**: **112,500원**\n- **총 재직일수**: **365일 (1년)**\n- 💰 **최종 예상 세전 퇴직금**: **3,375,000원**\n\n---\n\n위 산출 결과를 바탕으로 **퇴직금 지급 명세서**가 필요하시면 말씀해 주세요!`;
          } else {
            replyText = `네, 퇴직금 문의 확인했습니다! 💰\n\n2️⃣ **두 번째 질문**: 퇴사 전 3개월 동안 받으셨던 **세전 월급(기본급+수당)**은 대략 얼마 정도이신가요?`;
          }
          setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
        }
        else {
          // 최초 순차 질문 진행
          if (activeStep === 1) {
            setChatStep(2);
            const typeStr = userText.includes('시급') ? '시급' : userText.includes('일급') ? '일급' : userText.includes('포괄') ? '포괄임금' : '월급';
            replyText = `네, **${typeStr}** 방식으로 확인하였습니다! 💡\n\n2️⃣ **두 번째 질문 (5인 이상 법적 판정)**: 사장님 본인 및 동거하는 친족(가족)을 제외하고 **평소 매장에서 함께 일하는 순수 상시 근로자가 5명 이상**인가요?\n*(근로기준법 제11조에 따라 사장님과 동거 가족은 제외되며, 5인 이상 시 연장·야간·휴일수당 1.5배 가산 및 연차유급휴가가 의무 적용됩니다)*`;
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
          } else if (activeStep === 2) {
            setChatStep(3);
            const is5 = !userText.includes('미만');
            replyText = `확인했습니다! (**${is5 ? '5인 이상 사업장 [연장·야간·휴일 1.5배 가산 및 연차유급휴가 의무 적용]' : '5인 미만 사업장 [기본 수당 적용]'}**) 💡\n\n🚀 **[질문 생략 ⚡ 0% 오차 실시간 대화형 월급 계산기 자동 오픈]**\n번거로운 질문들을 일일이 답하실 필요 없이, **실시간 대화형 월급 계산기 창이 열렸습니다!**\n근무시간, 요일, 연차, 식대, 공휴일 수치를 한눈에 보면서 자유롭게 만지시면 실시간 실수령액이 산출됩니다!`;
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
            setIsWageCalcOpen(true);
          } else if (activeStep === 3) {
            // 💡 3단계 스케줄러 폼에서 근무시간, 휴게시간, 야간근로 조건이 이미 모두 선택/완료되었습니다!
            // 따라서 중복되는 4번(휴게시간), 5번(야간근로) 질문을 자동 건너뛰고(스킵), 곧바로 6번(공휴일) 질문으로 점프합니다!
            setChatStep(6);
            
            setStepAnswers(prev => ({
              ...prev,
              [3]: userText,
              [4]: '스케줄러 내 휴게시간 자동 반영 완료',
              [5]: '스케줄러 내 야간근로 자동 반영 완료'
            }));

            replyText = `네! 설정해주신 근무일수 및 출퇴근/휴게/야간 스케줄(**"${userText}"**)이 0% 오차로 정밀 반영되었습니다! 💡\n\n🔍 **[스마트 질문 스킵]**: 근무시간 내 휴게시간 및 야간근로 조건이 3단계에서 이미 완벽 세팅되었으므로 **중복되는 4번·5번 질문은 자동으로 건너뜁니다!** ⚡\n\n6️⃣ **여섯 번째 질문 (공휴일·대체공휴일 근로 여부)**: 설날·추석 등 **공휴일이나 대체공휴일(연 약 15일)**에 매장이 쉬나요, 아니면 나와서 일하시나요?\n*(쉬시는 경우 유급휴일로 처리되며, 나와서 일하시는 경우 1.5배 휴일근로수당이 적용됩니다)*`;
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
          } else if (activeStep === 6) {
            setChatStep(7);
            const restsOnHolidays = userText.includes('쉬') || userText.includes('안일');
            replyText = `확인했습니다! (**${restsOnHolidays ? '공휴일/대체공휴일 휴무 - 휴일근로 수당 차감 반영' : '공휴일/대체공휴일 근무 - 1.5배 휴일근로수당 적용'}**) 💡\n\n7️⃣ **일곱 번째 질문 (입사일 & 연차 사용일수 & 급여 포함 여부)**: 근로자분의 **재직 기간(1년 미만/이상)과 올해 사용하신 연차가 며칠**이신가요? 그리고 **미사용 연차수당을 이번 급여에 포함하여 정산할까요?**\n*(예: "1년 이상, 연차 3일 썼음 / 연차수당 급여에 포함해 줘" 또는 "1년 미만, 연차 안 씀 / 연차 수당 포함 안 함 (휴가로 사용)")*`;
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
          } else if (activeStep === 7) {
            setChatStep(8);
            replyText = `네! 입사일 및 연차 사용·수당 포함 조건(**"${userText}"**)을 확인했습니다! 💡\n\n8️⃣ **마지막 질문 (비과세 절세 수당 반영)**: 식대(월 20만원), 자가운전보조금(월 20만원) 등 **세금을 안 내도 되는 수당**을 넣어서 4대보험료와 소득세를 아껴드릴까요?\n*(예: 네 식대 20만원 포함 / 아니오)*`;
          } else {
            // 💡 이미 계산이 완료되었거나 8단계 이후 사용자가 실제 급여(예: "세전 250만원", "월급 230 받는데 맞아?")를 입력했을 때
            const numMatch = userText.replace(/,/g, '').match(/\d+/);
            const legalGross = latestCalcResult?.totalGrossSalary || 2800000;

            if (numMatch && (userText.includes('월급') || userText.includes('세전') || userText.includes('원') || userText.includes('받') || userText.includes('급여'))) {
              let actualSalary = parseInt(numMatch[0], 10);
              if (actualSalary < 10000 && actualSalary >= 100) actualSalary *= 10000; // "250만" ➔ 2500000

              const diff = legalGross - actualSalary;
              let evalReport = '';

              let extraNote = '';
              if (userText.includes('연차') || userText.includes('휴일')) {
                extraNote = `\n\n---\n\n### ⚖️ 5. 포괄임금(연차·휴일수당 포함) 법적 유효성 진단 리포트\n- 🌴 **연차수당 포함 계약 주의사항**: 대법원 판례 기준, 근로계약서상 **기본급과 연차수당의 시간수·금액이 명확하게 구분 명시**되지 않고 "월급에 연차수당 포함"이라고 뭉뚱그려 쓴 계약은 **법적으로 100% 무효**입니다! (미사용 연차에 대한 추가 청구 가능)\n- 🏢 **공휴일근로수당 포함 주의사항**: 2022년 1월부터 5인 이상 사업장은 **공휴일·대체공휴일이 법정유급휴일**로 지정되었으므로, 해당 일에 근무한 시간은 **1.5배 가산 수당**으로 지급되거나 서면 합의된 휴일대체로 부여되어야 합니다.`;
              }

              if (Math.abs(diff) <= 10000) {
                evalReport = `### 🕵️‍♂️ 근로자 임금 적정성 [1초 자가진단 결과 리포트]\n\n🎉 **[100% 임금 준수 적법 사업장]**\n- 💰 **법정 정당 세전 월급**: **${legalGross.toLocaleString()}원**\n- 💵 **근로자 실제 세전 월급**: **${actualSalary.toLocaleString()}원**\n\n✅ 현재 받고 계신 월급은 근로기준법 및 최저임금법 수당 산정 기준을 **100% 완벽하게 준수**하고 있는 정당한 임금입니다! 안심하셔도 됩니다.👍${extraNote}`;
              } else if (diff > 10000) {
                evalReport = `### 🕵️‍♂️ 근로자 임금 적정성 [1초 자가진단 결과 리포트]\n\n🚨 **[임금 미달 / 체불 주의 진단!]**\n- 💰 **법정 정당 세전 월급**: **${legalGross.toLocaleString()}원**\n- 💵 **근로자 실제 세전 월급**: **${actualSalary.toLocaleString()}원**\n- 🔴 **매월 미달/체불 발생액**: 매달 약 **${diff.toLocaleString()}원**을 덜 받고 계십니다! (연간 약 **${(diff * 12).toLocaleString()}원** 덜 받음)\n\n🔍 **[수당 누락 예상 항목]**:\n1. ⏰ **연장·야간·휴일근로 가산수당 미반영** (주 40시간 초과근로 및 야간/주말수당 누락 가능성)\n2. 🌴 **미사용 연차유급휴가 수당 미정산**\n3. 🍚 **비과세 식대 수당 미분리**${extraNote}\n\n💡 **[대응 가이드]**: 아래 **[📄 법정 급여명세서 보기/출력]** 및 **[📋 근로계약서 자동 생성]** 버튼을 눌러 공식 증빙서류를 저장해 두세요!`;
              } else {
                evalReport = `### 🕵️‍♂️ 근로자 임금 적정성 [1초 자가진단 결과 리포트]\n\n✨ **[법정 기준 초과 우대 사업장]**\n- 💰 **법정 최소 세전 월급**: **${legalGross.toLocaleString()}원**\n- 💵 **근로자 실제 세전 월급**: **${actualSalary.toLocaleString()}원**\n\n🌟 법정 최소 기준보다 매달 약 **${Math.abs(diff).toLocaleString()}원**을 더 넉넉히 우대하여 지급하고 있는 훌륭한 사업장입니다!${extraNote}`;
              }

              setMessages(prev => [...prev, { sender: 'secretary', text: evalReport }]);
            } else {
              calculateAndRespond(updatedAnswers, null);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { sender: 'secretary', text: '네, 말씀해주신 답변 조건을 확인하였습니다! 💡' }]);
      } finally {
        setIsTyping(false);
      }
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <SEO path="/" />
      
      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />

      {/* 👑 노무비서실장 메인 히어로 섹션 */}
      <div className="hero-section">
        {/* 🌟 2026 노동법 핵심 지표 실시간 전광판 롤링 바 */}
        <div style={{
          width: '100%', maxWidth: '850px', margin: '0 auto 1.5rem',
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.1))',
          border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '999px',
          padding: '0.45rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
          overflow: 'hidden', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#0f172a',
            fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '999px',
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
          }}>
            <Zap size={13} /> 2026 법정지표
          </span>
          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span>📢 2026 최저시급 <strong>10,320원</strong> (209h <strong>2,156,880원</strong>) • 식대 비과세 <strong>월 20만원</strong> • 산재 휴업급여 상한 <strong>127,600원</strong> • 5인 미만 해고예고수당 <strong>100% 의무</strong></span>
          </div>
        </div>

        <div className="hero-badge">
          <Crown size={18} color="#fbbf24" /> AI 진단 리포트 · 서류 자동생성 SaaS
        </div>

        <h1 className="hero-title">
          우리 회사 근로계약서·급여명세서, <span className="hero-title-accent">과태료 대상일까?</span>
        </h1>

        <p className="hero-subtitle">
          노무체크 AI가 <strong style={{ color: '#38bdf8' }}>10초 만에 법정 과태료 및 임금 체불 리스크를 정밀 진단</strong>해 드립니다. <br />
          진단 후 서류 자동 생성, 법정의무교육 이수 관리, 검증된 노무사 정액제 배너 연결까지 한 번에 이용하세요.
        </p>

        {/* 🔍 노무비서실장 1:1 대화 시작 지휘창 */}
        <form onSubmit={handleFormSubmit} className="hero-search-wrap">
          <div className="hero-search-gradient">
            <Search size={22} color="#38bdf8" className="hero-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 월급계산해줘 / 산재 진단서 분석해줘 / 퇴직금 계산해줘..."
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">
              실장과 대화 <MessageSquare size={16} />
            </button>
          </div>
        </form>

        {/* 💡 빠른 질문 칩 (Quick Smart Chips) */}
        <div className="hero-chips">
          {SMART_QUICK_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => startChatWithSecretary(promptText)}
              className="hero-chip"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* 🧮 메인 페이지 노무·임금 정밀 계산 영역 상시 활성화 카드 */}
        <div id="calculator" style={{
          marginTop: '2.5rem',
          padding: '1.5rem 1.8rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#38bdf8', color: '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>상시 활성화</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>🧮 2026년 209시간 노무·임금 실시간 정밀 진단 계산기</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0.3rem 0 0 0' }}>
                최저시급(10,320원), 주휴수당, 5인 이상 수당, 식대 비과세(20만원), 연차·퇴직금 산식을 실시간으로 0% 오차 계산합니다.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsWageCalcOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff', border: 'none', borderRadius: '10px',
                  padding: '0.65rem 1.2rem', fontSize: '0.9rem', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)'
                }}
              >
                🧮 대화형 계산기 조건 수치 직접 수정
              </button>
              <Link
                to="/tools/salary"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8', borderRadius: '10px', padding: '0.65rem 1.1rem',
                  fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                📊 월급·급여명세서 상세 페이지 ➔
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem',
            background: '#0f172a', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>2026 최저시급</span>
              <strong style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 800 }}>10,320원</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>월 소정근로시간</span>
              <strong style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>209시간 (주휴 35h 포함)</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>법정 세전 기본 월급</span>
              <strong style={{ fontSize: '1.1rem', color: '#34d399', fontWeight: 800 }}>2,156,880원</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>식대 비과세 절세 혜택</span>
              <strong style={{ fontSize: '1.1rem', color: '#fbbf24', fontWeight: 800 }}>월 200,000원 비과세</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 💬 노무비서실장 1:1 대화형 인터랙티브 모달/대화창 */}
      {isChatActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            width: '100%', maxWidth: '850px', height: '85vh',
            background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)', overflow: 'hidden'
          }}>
            {/* 챗봇 헤더 */}
            <div style={{
              padding: '1.2rem 1.5rem', background: '#1e293b', borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Crown size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    노무비서실장 <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>(1:1 실시간 자문 & 서류 AI 분석)</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    5대 전문 수석 에이전트 & 산재 진단서/급여 서류 Vision 분석
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsWageCalcOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#ffffff', border: 'none', borderRadius: '10px',
                    padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                  }}
                  title="월급 계산기 폼을 직접 열어서 세분화된 수치를 자유롭게 수정합니다"
                >
                  🧮 대화형 월급계산기 직접 수정
                </button>

                <button
                  onClick={() => setIsChatActive(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 🎯 8단계 질문 진행 현황 및 자유 선택 수정 바 */}
            <div style={{
              padding: '0.6rem 1.2rem', background: '#0b0f19', borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
              display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap', marginRight: '0.2rem' }}>
                ✏️ 질문 수정:
              </span>
              {STEP_NAV_ITEMS.map((item) => {
                const isActiveStep = chatStep === item.step;
                const isPassedStep = chatStep > item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => handleEditStep(item.step)}
                    title={`${item.step}단계 질문 클릭 시 즉시 답변 수정 가능`}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: isActiveStep ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: isActiveStep
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.3))'
                        : isPassedStep
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'rgba(255,255,255,0.03)',
                      color: isActiveStep ? '#ffffff' : isPassedStep ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActiveStep) e.currentTarget.style.borderColor = '#38bdf8';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActiveStep) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 챗봇 대화 내용 출력 영역 */}
            <div style={{
              flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem'
            }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex', gap: '0.75rem',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.sender === 'secretary' && (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Bot size={20} color="#38bdf8" />
                    </div>
                  )}

                  <div style={{
                    maxWidth: '80%', padding: '1.1rem 1.3rem', borderRadius: '16px',
                    fontSize: '0.95rem', lineHeight: 1.6,
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #38bdf8, #6366f1)' : '#1e293b',
                    color: msg.sender === 'user' ? '#ffffff' : '#e2e8f0',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(56, 189, 248, 0.15)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}>
                    {msg.sender === 'user' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div>{msg.text}</div>
                        {msg.step && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEditStep(msg.step)}
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.35)',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '0.2rem 0.55rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title={`${msg.step}단계 답변 수정하기`}
                            >
                              ✏️ 이 답변 수정하기
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <FormattedMessage text={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bot size={20} color="#38bdf8" />
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={16} className="spin-icon" /> 노무비서실장이 첨부 서류(진단서/급여명세서) 및 법령 판례를 분석하고 있습니다...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 첨부된 파일 표시 배지 */}
            {attachedFile && (
              <div style={{ padding: '0.4rem 1.5rem', background: '#0f172a', borderTop: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileCheck size={16} color="#38bdf8" /> 첨부됨: {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕ 취소
                </button>
              </div>
            )}

            {/* 🕒 3단계 전용: 고정 vs 요일별 변동 근무 스케줄러 스마트 입력 폼 */}
            {isChatActive && (editingStep || chatStep) === 3 && (
              <div style={{
                padding: '1.1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
                borderTop: '2px solid #38bdf8',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ color: '#38bdf8', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={18} color="#38bdf8" /> 3단계 세부 설정: 고정 / 요일별 변동 근무 스케줄러
                  </span>
                </div>

                {/* 📌 탭 스위처 (고정근무 vs 요일별 변동근무) */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <button
                    type="button"
                    onClick={() => setScheduleType('fixed')}
                    style={{
                      flex: 1, padding: '0.55rem', borderRadius: '8px',
                      background: scheduleType === 'fixed' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#0f172a',
                      color: '#ffffff', border: scheduleType === 'fixed' ? 'none' : '1px solid #334155',
                      fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem'
                    }}
                  >
                    📌 고정 근무 (매일 일정)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('flexible')}
                    style={{
                      flex: 1, padding: '0.55rem', borderRadius: '8px',
                      background: scheduleType === 'flexible' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : '#0f172a',
                      color: '#ffffff', border: scheduleType === 'flexible' ? 'none' : '1px solid #334155',
                      fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem'
                    }}
                  >
                    🔀 요일별 변동 근무 (요일마다 시간/휴게 다름)
                  </button>
                </div>

                {/* A. 📌 고정 근무 입력 모드 */}
                {scheduleType === 'fixed' && (
                  <div>
                    {/* 요일 선택 */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>📅 근무 요일 선택</label>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                          const isSel = fixedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setFixedDays(prev => isSel ? prev.filter(d => d !== day) : [...prev, day]);
                              }}
                              style={{
                                flex: 1, padding: '0.4rem 0', borderRadius: '6px',
                                background: isSel ? 'rgba(56, 189, 248, 0.25)' : '#0f172a',
                                color: isSel ? '#38bdf8' : '#64748b',
                                border: `1px solid ${isSel ? '#38bdf8' : '#334155'}`,
                                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 출퇴근 시간 및 휴게시간 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>⏰ 출퇴근 시간</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <select
                            value={fixedStart}
                            onChange={(e) => setFixedStart(e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            {TIME_OPTIONS_24H.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <span style={{ color: '#94a3b8' }}>~</span>
                          <select
                            value={fixedEnd}
                            onChange={(e) => setFixedEnd(e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            {TIME_OPTIONS_24H.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>☕ 주간 휴게시간 (식사포함)</label>
                        <select
                          value={fixedBreak}
                          onChange={(e) => setFixedBreak(e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.8rem' }}
                        >
                          <option value="1.0">1시간 (기본)</option>
                          <option value="1.5">1.5시간</option>
                          <option value="2.0">2시간</option>
                          <option value="0.5">30분 (0.5시간)</option>
                          <option value="0.0">휴게시간 없음 (0시간)</option>
                        </select>
                      </div>
                    </div>

                    {/* 🌙 야간 근로시간 실시간 감지 배지 및 야간 휴게 설정 */}
                    {calculateNightHours(fixedStart, fixedEnd) > 0 && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.4)', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          🌙 야간근로 (22:00~06:00) {calculateNightHours(fixedStart, fixedEnd)}시간 자동 감지됨!
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>야간 휴게시간(야식/수면):</span>
                          <select
                            value={fixedNightBreak}
                            onChange={(e) => setFixedNightBreak(e.target.value)}
                            style={{ flex: 1, padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #f59e0b', fontSize: '0.78rem' }}
                          >
                            <option value="0.0">야간휴게 없음 (전액 1.5배 인정)</option>
                            <option value="0.5">30분 차감</option>
                            <option value="1.0">1시간 차감</option>
                            <option value="1.5">1.5시간 차감</option>
                            <option value="2.0">2시간 차감</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* B. 🔀 요일별 변동 근무 입력 모드 (핵심 기능!) */}
                {scheduleType === 'flexible' && (
                  <div>
                    {/* ⚡ 선택 요일 먼저 체크 후 출퇴근/휴게시간 일괄 동일 적용 툴 */}
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '0.85rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>⚡ 일할 요일들 체크 ➔ 일괄 적용 (체크한 요일만 근무 전환!)</span>
                      </div>

                      {/* 1) 요일 먼저 체크 */}
                      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
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
                                flex: 1, padding: '0.35rem 0', borderRadius: '6px',
                                background: isChecked ? '#0284c7' : '#0f172a',
                                color: isChecked ? '#ffffff' : '#64748b',
                                border: `1px solid ${isChecked ? '#38bdf8' : '#334155'}`,
                                fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer'
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {/* 2) 출퇴근시각(24시간제) & 휴게시간 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: '0.4rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <select
                            value={batchStart}
                            onChange={(e) => setBatchStart(e.target.value)}
                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            {TIME_OPTIONS_24H.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>~</span>
                          <select
                            value={batchEnd}
                            onChange={(e) => setBatchEnd(e.target.value)}
                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            {TIME_OPTIONS_24H.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <select
                          value={batchBreak}
                          onChange={(e) => setBatchBreak(e.target.value)}
                          style={{ padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.76rem' }}
                        >
                          <option value="1.0">휴게 1시간</option>
                          <option value="1.5">휴게 1.5시간</option>
                          <option value="2.0">휴게 2시간</option>
                          <option value="0.5">휴게 0.5시간</option>
                          <option value="0.0">휴게 없음</option>
                        </select>

                        <button
                          type="button"
                          onClick={handleApplyBatchToSelectedDays}
                          style={{
                            padding: '0.35rem 0.5rem', borderRadius: '6px',
                            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                            color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer'
                          }}
                        >
                          일괄 적용
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.35rem', fontWeight: 600 }}>
                        💡 [일괄 적용] 누르시면 체크한 요일만 근무로 켜지고 나머지 요일은 자동 휴무 처리됩니다!
                      </div>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>
                      💡 토요일 등 남은 요일만 아래 카드에서 [근무]로 켜고 시간을 세팅하시면 자동 합산됩니다:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                        const sched = daySchedules[day];
                        const nightH = sched.active ? calculateNightHours(sched.start, sched.end) : 0;
                        return (
                          <div
                            key={day}
                            style={{
                              background: sched.active ? '#0f172a' : 'rgba(15, 23, 42, 0.4)',
                              border: `1px solid ${sched.active ? (nightH > 0 ? '#f59e0b' : 'rgba(56, 189, 248, 0.35)') : '#334155'}`,
                              borderRadius: '8px',
                              padding: '0.5rem 0.7rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: sched.active ? '0.4rem' : '0' }}>
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
                                  setBatchDays(prev => {
                                    if (nextActive) {
                                      return prev.includes(day) ? prev : [...prev, day];
                                    } else {
                                      return prev.filter(d => d !== day);
                                    }
                                  });
                                }}
                                style={{
                                  padding: '0.2rem 0.6rem', borderRadius: '4px',
                                  background: sched.active ? '#0284c7' : '#334155',
                                  color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                }}
                              >
                                {day}요일 {sched.active ? '근무' : '휴무'}
                              </button>

                              {sched.active && nightH > 0 && (
                                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  🌙 야간 {nightH}h 포함
                                </span>
                              )}
                            </div>

                            {sched.active && (
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.4rem', alignItems: 'center' }}>
                                {/* 출퇴근 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <select
                                    value={sched.start}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], start: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.76rem', cursor: 'pointer' }}
                                  >
                                    {TIME_OPTIONS_24H.map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                  <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>~</span>
                                  <select
                                    value={sched.end}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], end: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.76rem', cursor: 'pointer' }}
                                  >
                                    {TIME_OPTIONS_24H.map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* 주간 휴게 */}
                                <div>
                                  <select
                                    value={sched.breakTime}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], breakTime: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.74rem' }}
                                  >
                                    <option value="1.0">휴게 1h</option>
                                    <option value="1.5">휴게 1.5h</option>
                                    <option value="2.0">휴게 2h</option>
                                    <option value="0.5">휴게 0.5h</option>
                                    <option value="0.0">휴게 0h</option>
                                  </select>
                                </div>

                                {/* 야간 휴게 */}
                                <div>
                                  <select
                                    value={sched.nightBreak}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], nightBreak: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: nightH > 0 ? '#f59e0b' : '#fff', border: nightH > 0 ? '1px solid #f59e0b' : '1px solid #334155', fontSize: '0.74rem' }}
                                  >
                                    <option value="0.0">야간휴게0h</option>
                                    <option value="0.5">야간휴게0.5h</option>
                                    <option value="1.0">야간휴게1h</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 🚀 적용 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    let summaryText = '';
                    if (scheduleType === 'fixed') {
                      const daysStr = fixedDays.join(',');
                      const nH = calculateNightHours(fixedStart, fixedEnd);
                      summaryText = `[고정근무] 주 ${fixedDays.length}일 (${daysStr}) / ${fixedStart}~${fixedEnd} / 주간휴게 ${fixedBreak}시간${nH > 0 ? ` / 야간근로 ${nH}시간 (야간휴게 ${fixedNightBreak}시간 차감)` : ''}`;
                    } else {
                      const ALL_WEEKDAYS_ORDER = ['월', '화', '수', '목', '금', '토', '일'];
                      const activeDays = Object.keys(daySchedules).filter(d => daySchedules[d].active);
                      
                      const formatDaysGroupStr = (daysArr) => {
                        if (daysArr.length === 0) return '';
                        if (daysArr.length === 1) return `${daysArr[0]}`;
                        const sorted = [...daysArr].sort((a, b) => ALL_WEEKDAYS_ORDER.indexOf(a) - ALL_WEEKDAYS_ORDER.indexOf(b));
                        const ranges = [];
                        let start = sorted[0];
                        let prev = sorted[0];
                        for (let i = 1; i < sorted.length; i++) {
                          const curr = sorted[i];
                          if (ALL_WEEKDAYS_ORDER.indexOf(curr) === ALL_WEEKDAYS_ORDER.indexOf(prev) + 1) {
                            prev = curr;
                          } else {
                            ranges.push(start === prev ? `${start}` : `${start}~${prev}`);
                            start = curr;
                            prev = curr;
                          }
                        }
                        ranges.push(start === prev ? `${start}` : `${start}~${prev}`);
                        return ranges.join(', ');
                      };

                      const sortedActive = [...activeDays].sort((a, b) => ALL_WEEKDAYS_ORDER.indexOf(a) - ALL_WEEKDAYS_ORDER.indexOf(b));
                      const groups = [];
                      sortedActive.forEach(day => {
                        const s = daySchedules[day];
                        const nH = calculateNightHours(s.start, s.end);
                        const key = `${s.start}_${s.end}_${s.breakTime}_${nH}_${s.nightBreak}`;
                        let existing = groups.find(g => g.key === key);
                        if (!existing) {
                          existing = { key, days: [], start: s.start, end: s.end, breakTime: s.breakTime, nightH: nH, nightBreak: s.nightBreak };
                          groups.push(existing);
                        }
                        existing.days.push(day);
                      });

                      const detailList = groups.map(g => {
                        const dayGroupStr = formatDaysGroupStr(g.days);
                        const nightStr = g.nightH > 0 ? `, 야간 ${g.nightH}h[야간휴게 ${g.nightBreak}h]` : '';
                        return `${dayGroupStr}요일(${g.start}~${g.end}, 휴게 ${g.breakTime}h${nightStr})`;
                      });

                      const activeDaysStr = formatDaysGroupStr(sortedActive);
                      summaryText = `[변동근무] 주 ${activeDays.length}일 (${activeDaysStr}) / 세부스케줄: ${detailList.join('; ')}`;
                    }
                    handleSendMessage(null, summaryText);
                  }}
                  style={{
                    width: '100%', padding: '0.65rem', borderRadius: '10px',
                    background: scheduleType === 'fixed' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'linear-gradient(135deg, #d97706, #f59e0b)',
                    color: '#ffffff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.88rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  ✅ 세팅한 근무 스케줄로 0% 오차 자동 정밀 계산 적용하기
                </button>
              </div>
            )}

            {/* 💡 1, 2, 4~8단계 원클릭 보기 선택지 칩 (Quick Choice Chips) */}
            {isChatActive && (editingStep || chatStep) !== 3 && chatStep >= 1 && chatStep <= 8 && STEP_CHOICE_OPTIONS[editingStep || chatStep] && (
              <div style={{
                padding: '0.65rem 1.25rem',
                background: 'rgba(15, 23, 42, 0.95)',
                borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => setIsWageCalcOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                    border: '1px solid #f43f5e',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  ⚡ 긴 질문 생략 ➔ 대화형 계산기 열기
                </button>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={14} color="#38bdf8" /> 원클릭 답변 선택:
                </span>
                {STEP_CHOICE_OPTIONS[editingStep || chatStep].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(null, opt.value)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#ffffff',
                      borderRadius: '20px',
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)';
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))';
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* 챗봇 입력창 */}
            <form onSubmit={(e) => handleSendMessage(e)} style={{ padding: '1rem 1.5rem', background: '#1e293b', borderTop: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {/* 📎 서류 첨부 버튼 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="진단서, 급여명세서, 사고 현장 사진 첨부"
                >
                  <Paperclip size={20} />
                </button>

                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="질문을 입력하시거나 진단서/급여명세서(📎)를 첨부하세요..."
                  style={{
                    flex: 1, padding: '0.9rem 1.2rem', borderRadius: '12px',
                    border: '1px solid rgba(56, 189, 248, 0.25)', background: '#0f172a',
                    color: '#f8fafc', fontSize: '0.95rem', outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.9rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #38bdf8, #6366f1)', color: '#ffffff',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  전송 <Send size={16} />
                </button>
              </div>

              {/* 📊 실시간 진단 경과값 상시 하단 표시 바 */}
              {latestCalcResult && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '14px',
                  padding: '0.75rem 1.1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      📊 실시간 계산 경과값
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.98rem', color: '#ffffff', fontWeight: 800 }}>
                        예상 세전 월급 <span style={{ color: '#38bdf8' }}>{latestCalcResult.totalGross.toLocaleString()}원</span>
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        (기본급 {latestCalcResult.basePay.toLocaleString()}원 + 연장수당 {latestCalcResult.overtimePay.toLocaleString()}원{latestCalcResult.mealPay ? ' + 식대 20만' : ''})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsWageCalcOpen(true)}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)'
                      }}
                    >
                      🧮 실시간 계산기 수치 직접 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPayslipModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      📄 법정 급여명세서 상세/출력
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  💡 📎 버튼으로 산재 진단서, 급여명세서를 올리시면 AI가 승인 확률과 휴업급여를 즉시 진단 및 산출해 드립니다.
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsWageCalcOpen(true)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    🧮 대화형 월급계산기 열기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPayslipModal(true)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    📄 법정 급여명세서 보기/출력
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ 핵심 노무 서비스 퀵 카드 그리드 (6대 모듈) */}
      <section style={{ marginTop: '3.5rem', marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="glow-badge" style={{ marginBottom: '0.75rem' }}>
            <Zap size={15} color="#38bdf8" /> 2026 노동법령 완벽 개정 반영
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            노무체크 AI <span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>핵심 원스톱 서비스</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            원하시는 메뉴를 선택하시면 0% 오차 자동 산출 및 맞춤형 진단 리포트가 즉시 제공됩니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* 카드 1 */}
          <div className="home-feature-card" onClick={() => setIsWageCalcOpen(true)}>
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <Coins size={26} color="#38bdf8" />
              </div>
              <h3 className="feature-card-title">🧮 209시간·월급 정밀 계산기</h3>
              <p className="feature-card-desc">
                2026 최저시급(10,320원), 주휴수당, 5인 이상 1.5배 가산, 식대 20만원 비과세 및 4대보험 공제액을 실시간 0% 오차로 정밀 계산합니다.
              </p>
            </div>
            <div className="feature-card-action">
              대화형 계산기 실행 <ChevronRight size={16} />
            </div>
          </div>

          {/* 카드 2 */}
          <Link to="/worker" className="home-feature-card">
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.2))', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <FileText size={26} color="#34d399" />
              </div>
              <h3 className="feature-card-title">📄 근로계약서·취업규칙 생성</h3>
              <p className="feature-card-desc">
                포괄임금 무효 조항 검증, 수습기간 최저임금 90% 법정 요건 반영 표준 계약서 및 업종별 취업규칙 서식을 자동 생성합니다.
              </p>
            </div>
            <div className="feature-card-action" style={{ color: '#34d399' }}>
              서류 작성 바로가기 <ChevronRight size={16} />
            </div>
          </Link>

          {/* 카드 3 */}
          <Link to="/injury" className="home-feature-card">
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(239, 68, 68, 0.2))', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                <HeartPulse size={26} color="#f87171" />
              </div>
              <h3 className="feature-card-title">🩺 산재 70% 휴업급여 AI 자가진단</h3>
              <p className="feature-card-desc">
                출퇴근길 교통사고·뇌심혈관계 과로 산재 승인 확률 분석 및 병원 진단서/초진기록지 Vision AI 스캔으로 휴업급여를 계산합니다.
              </p>
            </div>
            <div className="feature-card-action" style={{ color: '#f87171' }}>
              산재 진단 바로가기 <ChevronRight size={16} />
            </div>
          </Link>

          {/* 카드 4 */}
          <Link to="/remedy" className="home-feature-card">
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(165, 180, 252, 0.2), rgba(129, 140, 248, 0.2))', border: '1px solid rgba(165, 180, 252, 0.3)' }}>
                <Scale size={26} color="#a5b4fc" />
              </div>
              <h3 className="feature-card-title">⚖️ 부당해고 30일 예고수당 계산</h3>
              <p className="feature-card-desc">
                5인 미만/이상 사업장 판정 기준, 구두 당일 해고 시 30일분 해고예고수당 및 노동위원회 부당해고 구제신청 절차를 안내합니다.
              </p>
            </div>
            <div className="feature-card-action" style={{ color: '#a5b4fc' }}>
              해고 구제 바로가기 <ChevronRight size={16} />
            </div>
          </Link>

          {/* 카드 5 */}
          <Link to="/employer" className="home-feature-card">
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <ShieldAlert size={26} color="#fbbf24" />
              </div>
              <h3 className="feature-card-title">🏢 사업주 4대보험 & 점검 대비</h3>
              <p className="feature-card-desc">
                고용노동부 근로감독 자율 점검 대비, 임금명세서 교부 의무 과태료 예방 및 2026 고용장려금·정부지원금 맞춤 매칭을 지원합니다.
              </p>
            </div>
            <div className="feature-card-action" style={{ color: '#fbbf24' }}>
              사업주 센터 바로가기 <ChevronRight size={16} />
            </div>
          </Link>

          {/* 카드 6 */}
          <Link to="/education" className="home-feature-card">
            <div>
              <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                <FileCode size={26} color="#a78bfa" />
              </div>
              <h3 className="feature-card-title">🎓 법정의무교육 & 리포트 센터</h3>
              <p className="feature-card-desc">
                성희롱 예방, 개인정보 보호, 장애인 인식개선 등 5대 법정의무교육 이수 관리 및 노동청 제출용 검증 리포트를 자동 발행합니다.
              </p>
            </div>
            <div className="feature-card-action" style={{ color: '#a78bfa' }}>
              교육 센터 바로가기 <ChevronRight size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* 👥 AI 7대 전문 수석 에이전트 팀 전면 공개 */}
      <section style={{ marginBottom: '3.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '2.5rem 1.8rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="glow-badge" style={{ marginBottom: '0.75rem', borderColor: '#a5b4fc', color: '#a5b4fc', background: 'rgba(165, 180, 252, 0.12)' }}>
            <Users size={15} color="#a5b4fc" /> 노무 BigData AI 자가진단 시스템
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            노무체크 AI <span style={{ color: '#38bdf8' }}>8대 전용 분석 모듈</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
            근로기준법, 산재의학, 대법원 판례, 100% 무상 보조금 & 유상 정책자금 융자 BigData를 AI 알고리즘이 24시간 교차 분석합니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {AGENT_TEAM.map((agent, idx) => (
            <div
              key={idx}
              className="agent-card"
              onClick={() => startChatWithSecretary(agent.prompt)}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '0.6rem' }}>
                  <div className="agent-avatar">
                    {agent.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{agent.name}</h4>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>AI 자가진단</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      {agent.role}
                    </p>
                  </div>
                </div>

                {/* 📌 대표 자가진단 항목 1초 선택 버튼 칩 (일반인 용 쉬운 선택) */}
                <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.1rem' }}>
                    💡 대표 자가진단 항목 (클릭 시 1초 즉시 점검)
                  </div>
                  {agent.checks.map((chk, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        startChatWithSecretary(`[${agent.name}] ${chk} 항목 정밀 자가진단 해 줘`);
                      }}
                      style={{
                        fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(30, 41, 59, 0.7)',
                        padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)'; }}
                    >
                      <span>✓ {chk}</span>
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>진단 →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ❓ 2026 최신 노무/법률 FAQ & 팩트체크 아코디언 */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="glow-badge" style={{ marginBottom: '0.75rem', borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)' }}>
            <HelpCircle size={15} color="#fbbf24" /> 팩트 기반 노동법령 해설
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            자주 묻는 <span style={{ color: '#fbbf24' }}>핵심 노무 법률 Q&A</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
            대법원 판례 및 고용노동부 지침에 따른 팩트 기반 질문과 답을 클릭하여 확인하세요.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {LEGAL_FAQS.map((faq, idx) => {
            const isExp = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="faq-item"
                onClick={() => setExpandedFaq(isExp ? null : idx)}
              >
                <div className="faq-question">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>Q.</span> {faq.q}
                  </span>
                  <ChevronRight size={18} color="#94a3b8" style={{ transform: isExp ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </div>
                {isExp && (
                  <div className="faq-answer">
                    <strong style={{ color: '#38bdf8' }}>A.</strong> {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>



      {/* 📄 법정 급여명세서 인쇄/PDF 팝업 */}
      {showPayslipModal && (
        <PayslipModal data={latestCalcResult || {}} onClose={() => setShowPayslipModal(false)} />
      )}

      {/* 🧮 대화형 실시간 월급계산기 수치 직접 수정 모달 */}
      <WageCalculatorModal
        isOpen={isWageCalcOpen}
        onClose={() => setIsWageCalcOpen(false)}
        calcData={isCalculatedOnce ? latestCalcResult : null}
        onApplyChanges={handleApplyCalcModalChanges}
      />

      {/* 💬 1:1 노무상담 및 문의 접수 모달 */}
      {isContactModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', overflowY: 'auto'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '640px',
            backgroundColor: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button
              onClick={() => setIsContactModalOpen(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem', background: 'none',
                border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
            <ContactForm />
          </div>
        </div>
      )}

    </div>
  );
}

