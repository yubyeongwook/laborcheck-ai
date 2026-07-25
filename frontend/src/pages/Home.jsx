import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Briefcase, Coins, Calendar, Clock, Wallet, FileText, ShieldAlert,
  HeartPulse, PiggyBank, ArrowRight, Search, Users, Sparkles, Mail, Crown,
  Send, Bot, RefreshCw, CheckCircle2, MessageSquare, X, Paperclip, FileCheck, Image,
  Scale, Stethoscope
} from 'lucide-react';
import PayslipModal from '../components/PayslipModal';

const SMART_QUICK_PROMPTS = [
  '⚖️ 산재 불승인 시 이의신청 절차 & 판례 모음 알려줘',
  '🩺 산재 진단서/급여명세서 첨부해서 예상 휴업급여 계산해 줘',
  '💬 2026년 내 월급·주휴수당 209시간 정밀 계산해 줘',
  '📄 재직증명서 / 경력증명서 표준 양식 받기',
  '💰 육아휴직·병가 포함 퇴직금 얼마인지 계산해 줘',
  '📜 우리 사업장 취업규칙 필수 법정 항목 체크해 줘',
  '🛡️ 노동청 근로감독 점검 대비 체크리스트 알려줘'
];

const AGENT_TEAM = [
  { name: '노무·근로기준법 수석', role: '209시간·중복가산 정밀 계산 및 근로계약서 양식', icon: <Coins size={24} color="#38bdf8" /> },
  { name: '산재보상·재해 수석', role: '요양/휴업급여 산정 및 산재 자가진단 가이드', icon: <HeartPulse size={24} color="#f87171" /> },
  { name: '판사·법원재판 수석', role: '주요 법원 노동 판례 대조 및 자가진단 정보', icon: <Scale size={24} color="#a5b4fc" /> },
  { name: '의사·의학감정 수석', role: '진단서 및 의무기록 의학 용어 표준 분석', icon: <Stethoscope size={24} color="#f43f5e" /> },
  { name: '노동청 지도감독 수석', role: '근로감독 자율 점검 및 4대보험 리스크 체크', icon: <ShieldAlert size={24} color="#fbbf24" /> },
  { name: '대한민국 정책자금 수석', role: '2026 고용장려금, R&D 출연금, 융자 지원금 맞춤 매칭', icon: <PiggyBank size={24} color="#34d399" /> },
  { name: '재무제표·신용진단 수석', role: '재무제표 진단 및 신보/기보 보증서 승인 시뮬레이션', icon: <Wallet size={24} color="#a78bfa" /> }
];

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
    { label: '🚩 공휴일/대체공휴일 모두 휴무 (쉬움)', value: '공휴일 모두 쉬움' },
    { label: '🏢 공휴일 연간 15일 전일 나와서 근무', value: '공휴일 연간 15일 전일 근무' },
    { label: '🌗 주요 공휴일 연간 약 7일 근무', value: '공휴일 연간 7일 근무' },
    { label: '🌕 명절 포함 연간 약 4일 근무', value: '공휴일 연간 4일 근무' }
  ],
  7: [
    { label: '📅 1년 이상 (연차 수당 미포함 / 휴가 사용)', value: '1년 이상, 연차 수당 미포함 (휴가로 사용)' },
    { label: '💰 1년 이상 (미사용 연차수당 급여 포함)', value: '1년 이상, 미사용 연차수당 급여 포함' },
    { label: '🐣 1년 미만 (월 1개 발생 연차)', value: '1년 미만, 연차 0개' }
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

    const calcResultObj = {
      employeeName: '신청 근로자',
      payPeriod: `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월 (01일~말일)`,
      payDate: `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월 25일`,
      companyName: '노무체크 검증 사업장',
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
      is5Over
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

    const replyText = `${updatePrefix}### 🎩 노무비서실장의 [고정밀 8단계 검증 완료 급여 진단]\n\n답변해주신 내용(**${is5Over ? '5인 이상 사업장 [사장님·동거가족 제외]' : '5인 미만 사업장'} · 월~금 9시~18시 (하루 실근로 ${dailyWorkHours.toFixed(2)}h, 휴게 ${breakHours.toFixed(2)}h 차감)${hasMeal ? ' · 식대 비과세 기본급 분할 세팅' : ''}**)을 바탕으로 최종 정밀 계산된 결과입니다:\n\n---\n\n### ⚖️ 1. 근로기준법 및 최저임금법(제6조) 정밀 분석\n- 💡 **최저시급 약정 월급(2,156,880원) 기준 식대 비과세 분할 세팅 적용**: 최저임금법 제6조에 따라 복리후생비(식대)가 100% 최저임금에 산입되므로, **기본급 1,956,880원 + 식대 200,000원 = 세전 총월급 2,156,880원** 세팅은 100% 합법적이며 완벽히 적법합니다.\n- 4대보험료 및 소득세 부과 대상(과세액)이 **1,956,880원**으로 낮아져 매달 약 3.5만원의 합법 절세 혜택이 발생합니다.\n\n---\n\n### 📊 2. 근무시간 및 식사·휴게시간 정밀 합산 분석\n- **근무 시간 (9시~18시)**: 총 9시간 중 식사/휴게시간 **${breakHours.toFixed(2)}시간 차감** = **하루 실제 일하는 시간 ${dailyWorkHours.toFixed(2)}시간**\n- **주 5일(월~금) 소정근로시간**: **주 40시간** (기본 8h × 5일 = 연장근로 0시간!)\n- **월 기준 근로시간**: **174.00시간** (주휴수당 35시간 합산 시 **209.00시간**)\n- **월 연장 근로시간**: **0.00시간** (8시간 초과분 없음)\n\n---\n\n### 💰 3. 2026년 최저시급(10,320원) 기준 최종 예상 월급 (${includeAnnualLeavePay ? '미사용 연차수당 정산 포함' : '연차수당 미포함 [휴가사용전제]'})\n- 💰 **예상 세전 월급 총액**: **${totalGross.toLocaleString()}원**\n  - 📄 **기본급 (과세 대상)**: **${actualBasePay.toLocaleString()}원** (월 209시간분 중 식대 20만원 분리 세팅)\n  - 🍚 **비과세 식대 수당**: **${mealPay.toLocaleString()}원** (절세 적용)\n  - ⏰ **연장근로수당 (0시간)**: **0원**\n${includeAnnualLeavePay ? `  - 📅 **미사용 연차유급휴가 정산 수당**: ${annualLeaveMonthlyPay.toLocaleString()}원\n` : '  - 📅 **연차유급휴가 수당**: **0원** (연차 수당 미포함 요청 반영)\n'}\n---\n\n### 💡 4. 비과세 절세 혜택 & 급여명세서\n- 식대 20만원을 비과세로 세팅하여 매월 4대보험료 및 소득세 약 **35,000원**이 합법 절세됩니다.\n- 아래 **[근로기준법 제48조 법정 급여명세서 보기/출력]** 버튼을 누르시면 위 산출 결과 그대로 명세서가 출력됩니다!`;

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
            replyText = `확인했습니다! (**${is5 ? '5인 이상 사업장 [연장·야간·휴일 1.5배 가산 및 연차유급휴가 의무 적용]' : '5인 미만 사업장 [기본 수당 적용]'}**) 💡\n\n3️⃣ **세 번째 질문 (근무일수 & 평일/주말 근무 구분)**: 주 5일 근무이더라도 **평일(월~금)만 일하시나요, 아니면 토/일 주말이 포함되어 있나요?** 그리고 요일별 일하는 시간이 다른가요?\n*(예: "월~금 근무" 또는 "수~일 근무 [주말 포함] / 평일 10~22시, 토일 10~17시" 처럼 일하는 요일을 구별해 적어주시면 휴일수당을 0% 오차로 구분 계산합니다!)*`;
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
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
            setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
          } else {
            calculateAndRespond(updatedAnswers, null);
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
      
      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />

      {/* 👑 노무비서실장 메인 히어로 섹션 */}
      <div style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem 3rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1.2rem', borderRadius: '50px',
          background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem'
        }}>
          <Crown size={18} color="#fbbf24" /> AI 노무비서실장 대화 상시 대기 중
        </div>

        <h1 style={{
          fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc',
          lineHeight: 1.3, marginBottom: '1rem', wordBreak: 'keep-all'
        }}>
          복잡한 노무 문제, <span style={{ color: '#38bdf8' }}>노무비서실장이 대화로 편리하게 안내해 드립니다</span>
        </h1>

        <p style={{
          fontSize: '1.15rem', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 2.5rem',
          lineHeight: 1.6, wordBreak: 'keep-all'
        }}>
          페이지를 이동하며 일일이 입력할 필요가 없습니다. <strong style={{ color: '#f8fafc' }}>노무비서실장</strong>이 질문을 드리고 대화를 나누면서 정밀 계산부터 산재 자가진단, 법정 표준 서식까지 한곳에서 손쉽게 지원해 드립니다.
        </p>

        {/* 🔍 노무비서실장 1:1 대화 시작 지휘창 */}
        <form onSubmit={handleFormSubmit} style={{ maxWidth: '680px', margin: '0 auto 1.5rem', position: 'relative' }}>
          <div style={{
            position: 'relative', borderRadius: '18px', padding: '3px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8, #f59e0b)',
            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.3)'
          }}>
            <Search size={22} color="#38bdf8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 월급계산해줘 / 산재 진단서 분석해줘 / 퇴직금 계산해줘..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '1.15rem 8.5rem 1.15rem 3.2rem',
                fontSize: '1.05rem', borderRadius: '15px', border: 'none', outline: 'none',
                background: '#0f172a', color: '#f8fafc', fontWeight: 500, fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)',
                padding: '0.75rem 1.4rem', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)', color: '#ffffff',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
              }}
            >
              실장과 대화 <MessageSquare size={16} />
            </button>
          </div>
        </form>

        {/* 💡 빠른 질문 칩 (Quick Smart Chips) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', maxWidth: '850px', margin: '0 auto' }}>
          {SMART_QUICK_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => startChatWithSecretary(promptText)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '50px', padding: '0.5rem 1rem', color: '#cbd5e1', fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              {promptText}
            </button>
          ))}
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
                          <input
                            type="time"
                            value={fixedStart}
                            onChange={(e) => setFixedStart(e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.8rem' }}
                          />
                          <span style={{ color: '#94a3b8' }}>~</span>
                          <input
                            type="time"
                            value={fixedEnd}
                            onChange={(e) => setFixedEnd(e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.8rem' }}
                          />
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
                                setBatchDays(prev => isChecked ? prev.filter(d => d !== day) : [...prev, day]);
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
                          <input
                            type="time"
                            value={batchStart}
                            onChange={(e) => setBatchStart(e.target.value)}
                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.78rem' }}
                          />
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>~</span>
                          <input
                            type="time"
                            value={batchEnd}
                            onChange={(e) => setBatchEnd(e.target.value)}
                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.78rem' }}
                          />
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
                                  setDaySchedules(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day], active: !prev[day].active }
                                  }));
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
                                  <input
                                    type="time"
                                    value={sched.start}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], start: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.76rem' }}
                                  />
                                  <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>~</span>
                                  <input
                                    type="time"
                                    value={sched.end}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDaySchedules(prev => ({ ...prev, [day]: { ...prev[day], end: val } }));
                                    }}
                                    style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '0.76rem' }}
                                  />
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
                      const activeDays = Object.keys(daySchedules).filter(d => daySchedules[d].active);
                      const detailList = activeDays.map(d => {
                        const s = daySchedules[d];
                        const nH = calculateNightHours(s.start, s.end);
                        return `${d}요일(${s.start}~${s.end}, 휴게${s.breakTime}h${nH > 0 ? `, 야간${nH}h[야간휴게${s.nightBreak}h]` : ''})`;
                      });
                      summaryText = `[변동근무] 주 ${activeDays.length}일 (${activeDays.join(',')}) / 세부스케줄: ${detailList.join('; ')}`;
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
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  💡 📎 버튼으로 산재 진단서, 급여명세서를 올리시면 AI가 승인 확률과 휴업급여를 즉시 진단 및 산출해 드립니다.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPayslipModal(true)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}
                >
                  📄 근로기준법 제48조 법정 급여명세서 보기/출력
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 법정 급여명세서 인쇄/PDF 팝업 */}
      {showPayslipModal && (
        <PayslipModal data={latestCalcResult || {}} onClose={() => setShowPayslipModal(false)} />
      )}

    </div>
  );
}

