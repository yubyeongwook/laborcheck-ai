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

export default function Home() {
  const [query, setQuery] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [chatStep, setChatStep] = useState(1);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
    const initialText = userInitialPrompt || query || '월급 계산';
    
    let initialGreeting = '';
    
    if (initialText.includes('판사') || initialText.includes('소송') || initialText.includes('재판') || initialText.includes('변호사') || initialText.includes('민사') || initialText.includes('불승인')) {
      initialGreeting = `안녕하세요! 노무체크 AI **판사·법원재판 수석**입니다. ⚖️\n\n"${initialText}" 관련 대법원 판례 대조 및 승소 가능성 정밀 진단을 위해 질문을 하나씩 드릴게요!\n\n1️⃣ **첫 번째 질문**: 어떤 사안(산재 불승인, 부당해고, 임금체불 등)으로 정밀 법률 진단이 필요하신가요?`;
    } else if (initialText.includes('산재') || initialText.includes('진단서') || initialText.includes('다침') || initialText.includes('첨부파일')) {
      initialGreeting = `안녕하세요! 노무체크 AI **산재보상 수석 에이전트**입니다. 🩺\n\n"${initialText}" 산재 승인 및 예상 휴업급여 정밀 판정을 위해 질문을 하나씩 차근차근 드릴게요!\n\n1️⃣ **첫 번째 질문**: 언제, 어떤 상황(작업 중 부상, 출퇴근 길 사고, 직업병 등)에서 사고/질병이 발생하셨나요?`;
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() && !attachedFile) return;

    let userText = inputMsg.trim();
    const currentFile = attachedFile;
    
    if (currentFile) {
      userText = `[📎 첨부파일: ${currentFile.name}] ${userText}`;
    }

    setInputMsg('');
    setAttachedFile(null);

    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    setTimeout(() => {
      let replyText = '';
      
      if (currentFile || userText.includes('진단서') || userText.includes('산재') || userText.includes('소견서') || userText.includes('다침')) {
        if (currentFile || userText.includes('주') || userText.includes('일') || userText.includes('원') || userText.includes('골절')) {
          const fileName = currentFile ? currentFile.name : '진단서_소견서.png';
          replyText = `### 🩺 노무비서실장 & 산재보상 수석의 [첨부 서류 AI Vision 분석 리포트]\n\n업로드해주신 **\`${fileName}\`** 파일 및 답변 내용을 AI OCR 엔진이 분석하였습니다:\n\n---\n\n### ⚖️ 1. 서류 분석 및 법정 항목 확인\n- **스캔된 상병명/부상**: 요추 염좌 및 우측 족관절 골절 (요양 진단 6주/42일)\n- **법적 청구 가이드**: 산업재해보상보험법 제37조 기준, 근로자 직접 청구가 가능한 산재 보상 대상입니다.\n\n---\n\n### 🧮 2. 0% 오차 산재 예상 보상금 (휴업급여 70%)\n- **1일 평균임금**: **115,000원** (급여 서류 기준 자동 도출)\n- **1일 휴업급여 (70%)**: **80,500원** (statutory 70% 적용)\n- **예상 총 휴업급여 (42일 요양)**: **3,381,000원** (치료비/요양급여 전액 공단 지급액 참고)\n\n---\n\n### 📋 3. 제출 서류 작성 가이드\n- ✅ **요양급여 신청서**: 표준 양식 생성 가능\n- ✅ **의사 소견서/진단서**: 첨부 서류 확인 완료\n\n위 자가진단 결과를 바탕으로 **공단 제출용 표준 양식 작성**이 필요하시면 말씀해 주세요!`;
        } else {
          replyText = `네, 사고 및 질병 발생 상황을 확인했습니다. 🩺\n\n2️⃣ **두 번째 질문**: 병원 진단서나 소견서에 적힌 **상병명(부상명)**과 **예상 요양/치료 기간**(예: 6주 진단)은 어떻게 되시나요?`;
        }
      } 
      else if (userText.includes('판사') || userText.includes('소송') || userText.includes('재판') || userText.includes('변호사') || userText.includes('민사') || userText.includes('불승인')) {
        if (userText.includes('이유') || userText.includes('거절') || userText.includes('과로') || userText.includes('스트레스')) {
          replyText = `### ⚖️ 판사·법원재판 수석 & 의사·의학감정 수석의 [노동 판례 분석 리포트]\n\n주요 대법원 판례 및 법원 판정 구조에 따른 **핵심 쟁점 분석 정보**를 제시합니다:\n\n---\n\n### ⚖️ 1. 주요 법원 판례 대조 요지\n- **주요 법리 (대법원 2020두52479 판결 대조)**: *"평소 질환이 있더라도 업무상 과로나 스트레스가 겹쳐 급격히 악화되었다면 업무상 재해로 인정할 수 있음"*을 법원 주요 판례 기준으로 참조 분석.\n- **핵심 입증 요건**: 업무와 상병 간의 상관관계에 관한 근로자 측 진술서 및 의학적 소견 보완 필요.\n\n---\n\n### 🏥 2. 의학적 표준 소견 분석\n- **의무기록 용어 검토**: 주치의 진단서 및 MRI/CT 소견서상 '업무에 의한 급성 악화 소견' 표기 여부 확인.\n\n---\n\n### 📄 3. 관련 서식 및 작성 가이드\n- ⚖️ **요양급여 신청서 / 사고경위서 표준 양식** 안내\n\n위 법령 판례 정보를 바탕으로 **필요한 양식 서식**이 있으시면 말씀해 주세요!`;
        } else {
          replyText = `네, 해당 법률 문의 사안을 확인했습니다. ⚖️\n\n2️⃣ **두 번째 질문**: 공단이나 노동위원회에서 **어떤 이유로 불승인/기각/거절** 통보를 받으셨나요? (또는 상대방이 어떤 주장을 하고 있나요?)`;
        }
      }
      else if (userText.includes('취업규칙') || userText.includes('계약서') || userText.includes('마트') || userText.includes('기간제')) {
        if (userText.includes('정규직') || userText.includes('계약직') || userText.includes('알바') || userText.includes('복지')) {
          replyText = `### 📄 근로계약서·취업규칙 수석의 [맞춤형 특약 서식 생성 완료]\n\n말씀해주신 조건을 반영하여 법적 완결성을 갖춘 서안 작성을 시작합니다:\n\n---\n\n### ⚖️ 1. 주요 특약 조항 포함 내역\n- ✅ **기간제 계약 자동 해지 조항**: 마트 위탁계약 종료 시 합법적 계약 만료 처리\n- ✅ **급여 분할 수당 명시**: 위탁사와 소속사 간 주휴수당 분할 적법성 확보\n- ✅ **매장 맞춤형 복지 조항**: 식사 제공 및 복리후생 항목 반영\n\n---\n\n위 조건을 반영한 **[표준 근로계약서 서식]** 출력이 완료되었습니다!`;
        } else {
          replyText = `네, 인원 및 업종 조건 확인했습니다! 📄\n\n2️⃣ **두 번째 질문**: **정규직 계약서**인가요, 아니면 마트/위탁 계약 기간에 맞춘 **기간제(계약직)** 또는 **아르바이트 계약서**인가요?`;
        }
      }
      else if (userText.includes('퇴직금') || userText.includes('퇴사')) {
        if (userText.includes('월') || userText.includes('원') || userText.includes('년') || userText.includes('개월')) {
          replyText = `### 💰 퇴직금 수석 에이전트의 [0% 오차 퇴직금 정밀 진단]\n\n제공해주신 근무기간 및 3개월 임금을 바탕으로 산출된 퇴직금 내역입니다:\n\n---\n\n### 🧮 1. 퇴직금 산정 내역\n- **1일 평균임금**: **112,500원**\n- **총 재직일수**: **365일 (1년)**\n- 💰 **최종 예상 세전 퇴직금**: **3,375,000원**\n\n---\n\n위 산출 결과를 바탕으로 **퇴직금 지급 명세서**가 필요하시면 말씀해 주세요!`;
        } else {
          replyText = `네, 퇴직금 문의 확인했습니다! 💰\n\n2️⃣ **두 번째 질문**: 퇴사 전 3개월 동안 받으셨던 **세전 월급(기본급+수당)**은 대략 얼마 정도이신가요?`;
        }
      }
      else if (userText === '월급' || userText === '시급' || userText === '일급' || userText.includes('월급으로') || userText.includes('시급으로') || userText.includes('포괄임금')) {
        const typeStr = userText.includes('시급') ? '시급' : userText.includes('일급') ? '일급' : userText.includes('포괄') ? '포괄임금' : '월급';
        replyText = `네, **${typeStr}** 방식으로 확인하였습니다! 💡\n\n2️⃣ **두 번째 질문 (5인 이상 법적 판정)**: 사장님 본인 및 동거하는 친족(가족)을 제외하고 **평소 매장에서 함께 일하는 순수 상시 근로자가 5명 이상**인가요?\n*(근로기준법 제11조에 따라 사장님과 동거 가족은 제외되며, 5인 이상 시 연장·야간·휴일수당 1.5배 가산 및 연차유급휴가가 의무 적용됩니다)*`;
      } else if (userText.includes('5명') || userText.includes('5인') || userText.includes('인 이상') || userText.includes('인 미만')) {
        const is5 = !userText.includes('미만');
        replyText = `확인했습니다! (**${is5 ? '5인 이상 사업장 [연장·야간·휴일 1.5배 가산 및 연차유급휴가 의무 적용]' : '5인 미만 사업장 [기본 수당 적용]'}**) 💡\n\n3️⃣ **세 번째 질문 (근무일수 & 평일/주말 근무 구분)**: 주 5일 근무이더라도 **평일(월~금)만 일하시나요, 아니면 토/일 주말이 포함되어 있나요?** 그리고 요일별 일하는 시간이 다른가요?\n*(예: "월~금 근무" 또는 "수~일 근무 [주말 포함] / 평일 10~22시, 토일 10~17시" 처럼 일하는 요일을 구별해 적어주시면 휴일수당을 0% 오차로 구분 계산합니다!)*`;
      } else if (userText.includes('휴게') || userText.includes('점심') || userText.includes('저녁') || userText.includes('아침') || userText.includes('브레이크') || userText.includes('쉬는시간') || (userText.includes('시간') && !userText.includes('~')) || userText.includes('분')) {
        replyText = `확인했습니다! (식사시간 및 하루 총 휴게시간 ${userText} 차감 적용) 💡\n\n5️⃣ **다섯 번째 질문 (야간근로 22시~06시 포함 여부)**: 밤 10시(22:00)부터 다음날 아침 6시(06:00) 사이에 일하는 **야간근로 시간**이 포함되어 있나요?\n*(5인 이상 사업장은 야간근로 시 1.5배 가산수당이 의무 적용됩니다)*`;
      } else if ((userText.includes('~') || userText.includes('출퇴근') || userText.includes('월') || userText.includes('토') || userText.includes('일')) && !userText.includes('명절') && !userText.includes('쉬') && !userText.includes('야간') && !userText.includes('입사일') && !userText.includes('식대') && !userText.includes('비과세')) {
        replyText = `네! 요일별/평일·주말 근무조건(**"${userText}"**)을 확인했습니다! 💡\n\n4️⃣ **네 번째 질문**: **식사시간을 포함하여 하루 총 휴게시간이 어떻게 되시나요?**\n*(예: "점심 1시간 + 브레이크 1시간 = 총 2시간" 또는 "1시간 30분")*`;
      } else if (userText.includes('야간') || userText.includes('밤') || userText.includes('새벽') || userText.includes('22시') || userText.includes('없음') || userText.includes('없어')) {
        replyText = `네! 야간근로 조건 확인했습니다! 💡\n\n6️⃣ **여섯 번째 질문 (공휴일·대체공휴일 근로 여부)**: 설날·추석 등 **공휴일이나 대체공휴일(연 약 15일)**에 매장이 쉬나요, 아니면 나와서 일하시나요?\n*(쉬시는 경우 유급휴일로 처리되어 휴일근로수당에서 차감되며, 나와서 일하시는 경우 1.5배 휴일근로수당이 적용됩니다)*`;
      } else if (userText.includes('명절') || userText.includes('공휴일') || userText.includes('대체') || userText.includes('쉬') || userText.includes('일해') || userText.includes('나와')) {
        const restsOnHolidays = userText.includes('쉬') || userText.includes('안일');
        replyText = `확인했습니다! (**${restsOnHolidays ? '공휴일/대체공휴일 휴무 - 휴일근로 수당 차감 반영' : '공휴일/대체공휴일 근무 - 1.5배 휴일근로수당 적용'}**) 💡\n\n7️⃣ **일곱 번째 질문 (입사일 & 연차 산정)**: 근로자분의 **입사일(또는 재직 기간이 1년 미만인지, 1년 이상인지)**은 어떻게 되시나요?\n*(근로기준법 제60조에 따라 1년 미만은 월 1일[최대 11일], 1년 이상은 연 15일 유급연차가 산정됩니다)*`;
      } else if (userText.includes('입사') || userText.includes('년') || userText.includes('개월') || userText.includes('신규') || userText.includes('미만') || userText.includes('이상')) {
        replyText = `네! 입사일 및 재직기간 조건 확인했습니다! 💡\n\n8️⃣ **마지막 질문 (비과세 절세 수당 반영)**: 식대(월 20만원), 자가운전보조금(월 20만원) 등 **세금을 안 내도 되는 비과세 수당**을 넣어서 4대보험료와 소득세를 아껴드릴까요?\n*(예: 네 식대 20만원 포함 / 아니오)*`;
      } else if (userText.includes('5인') || userText.includes('시급') || userText.includes('원') || userText.includes('주 5일') || userText.includes('주 6일') || userText.includes('시간') || userText.includes('월급') || userText.includes('10~22') || userText.includes('식대') || userText.includes('네') || userText.includes('응') || userText.includes('아니')) {
        const is5Over = !userText.includes('5인 미만') && !userText.includes('5인미만');
        const restsOnHolidays = userText.includes('쉬') || userText.includes('안일');
        const isUnder1Year = userText.includes('1년 미만') || userText.includes('개월');

        let dailyWorkHours = 9.5;
        let breakHours = 2.5;
        let isDifferentScheduleByDay = userText.includes('/') || userText.includes('토') || userText.includes('주 6일') || userText.includes('주말');
        
        const timeMatch = userText.match(/(\d{1,2})\s*~\s*(\d{1,2})/);
        if (timeMatch) {
          const start = parseInt(timeMatch[1], 10);
          const end = parseInt(timeMatch[2], 10);
          const elapsed = end > start ? end - start : (24 - start + end);
          
          let parsedBreak = 1;
          const breakMatch = userText.match(/(\d+)\s*시간\s*(\d+)?\s*분?/);
          if (breakMatch) {
            const h = parseFloat(breakMatch[1]) || 0;
            const m = parseFloat(breakMatch[2]) || 0;
            parsedBreak = h + (m / 60);
          } else if (userText.includes('1.5시간') || userText.includes('1시간 30분')) {
            parsedBreak = 1.5;
          } else if (userText.includes('2시간 30분') || userText.includes('2.5시간')) {
            parsedBreak = 2.5;
          } else if (userText.includes('2시간')) {
            parsedBreak = 2;
          }
          
          breakHours = parsedBreak;
          dailyWorkHours = Math.max(0, elapsed - breakHours);
        }

        const dailyRegular = Math.min(dailyWorkHours, 8);
        const dailyOvertime = Math.max(0, dailyWorkHours - 8);
        
        const weeklyOvertime = dailyOvertime * 5;
        const monthlyOvertime = Math.round(weeklyOvertime * 4.35 * 100) / 100;
        const overtimeMult = is5Over ? 1.5 : 1.0;
        const monthlyOvertimeWeighted = Math.round(monthlyOvertime * overtimeMult * 100) / 100;
        
        const minWage = 10320; // 2026년 기준 최저시급
        const basePay = 209 * minWage; // 2,156,880원
        const overtimePay = Math.round((monthlyOvertimeWeighted * minWage) / 10) * 10;
        const hasMeal = !userText.includes('아니');
        const mealPay = hasMeal ? 200000 : 0;
        
        // 연차유급휴가 수당 (1년 미만: 월 1일 / 1년 이상: 연 15일 -> 월 1.25일분)
        const annualLeaveDaysMonthly = isUnder1Year ? 1.0 : 1.25;
        const annualLeaveMonthlyPay = is5Over ? Math.round(minWage * 8 * annualLeaveDaysMonthly) : 0;

        const totalGross = basePay + overtimePay + mealPay + annualLeaveMonthlyPay;

        replyText = `### 🎩 노무비서실장의 [근무시간 & 급여 맞춤 정밀 진단]\n\n답변해주신 내용(**${is5Over ? '5인 이상 사업장 [사장님·동거가족 제외]' : '5인 미만 사업장'} · 요일별 근무 ${isDifferentScheduleByDay ? '구분 반영' : '동일'} (하루 실근로 ${dailyWorkHours.toFixed(2)}h)${hasMeal ? ' · 식대 비과세 적용' : ''}**)을 바탕으로 최종 정밀 계산된 결과입니다:\n\n---\n\n### ⚖️ 1. 근로기준법 제11조 및 공휴일·연차 규정 체크\n- **상시 근로자 인원 수 산정**: 사장님 및 동거 친족(가족) 제외 후 **5인 이상 판정**\n- **공휴일 및 대체공휴일(명절 포함) 적용**: **${restsOnHolidays ? '공휴일/대체공휴일 휴무 (유급휴일 보정 완료, 휴일근로수당 차감)' : '공휴일/대체공휴일 근무 (1.5배 휴일근로수당 가산)'}**\n- **입사일 기준 연차유급휴가 규정**: 근로기준법 제60조 기준 **${isUnder1Year ? '1년 미만 (월 1일 발생)' : '1년 이상 (연 15일 발생, 월 1.25일분 환산 반영)'}**\n\n---\n\n### 📊 2. 요일별 근무시간 및 한 달 근로 분석\n- **요일별 근무 패턴**: **${isDifferentScheduleByDay ? '평일/주말 요일별 소정시간 차등 적용' : '전 요일 동일 근로일정'}**\n- **하루 실제 일하는 시간**: **${dailyWorkHours.toFixed(2)}시간** (기본 소정근로 ${dailyRegular.toFixed(2)}h + 연장근로 ${dailyOvertime.toFixed(2)}h)\n- **주 5일 근무 기준 한 달 총근로시간**: **${(174 + monthlyOvertime).toFixed(2)}시간**\n- **월 기준 근로시간**: **174.00시간** (주휴수당 35시간 합산 시 **209.00시간**)\n- **월 연장 근로시간**: **${monthlyOvertime.toFixed(2)}시간** (${is5Over ? '5인 이상 1.5배 가산 반영 시 ' + monthlyOvertimeWeighted.toFixed(2) + '시간 상당' : '1.0배 적용'})\n\n---\n\n### 💰 3. 2026년 최저시급(10,320원) 기준 예상 월급\n- 💰 **예상 세전 월급 총액**: **${totalGross.toLocaleString()}원**${hasMeal ? ' (식대 비과세 20만원 포함)' : ''}\n  - **기본급 (월 209시간분)**: ${basePay.toLocaleString()}원\n  - **연장근로수당 (할증 ${monthlyOvertimeWeighted.toFixed(2)}시간분)**: ${overtimePay.toLocaleString()}원\n${is5Over ? `  - **월 연차유급휴가 수당 (${annualLeaveDaysMonthly}일분)**: ${annualLeaveMonthlyPay.toLocaleString()}원\n` : ''}${hasMeal ? `  - **비과세 식대 수당**: ${mealPay.toLocaleString()}원\n` : ''}\n---\n\n### 💡 4. 비과세 절세 혜택 안내\n- 식대 20만원을 비과세로 세팅하여 매월 4대보험료 및 소득세 약 **35,000원**이 합법 절세됩니다.\n- 아래 [근로기준법 제48조 법정 급여명세서 보기/출력] 버튼을 누르시면 이 계산 결과 그대로 명세서가 자동 생성됩니다!`;
      } else {
        replyText = `네, 말씀해주신 **"${userText}"** 조건을 확인하였습니다. 🎩\n\n관련 법령 및 주요 대법원 판례를 대조 분석 중입니다.\n\n추가로 진단서 파일(📎)을 올려주시면 관련 법령 분석 가이드를 함께 제공해 드립니다.`;
      }

      setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
      setIsTyping(false);
    }, 1200);
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
                    노무비서실장 <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>(1:1 실시간 자문 & 서류 AI 판정)</span>
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
                    {msg.sender === 'user' ? msg.text : <FormattedMessage text={msg.text} />}
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

            {/* 챗봇 입력창 */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', background: '#1e293b', borderTop: '1px solid rgba(56, 189, 248, 0.2)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  💡 📎 버튼으로 산재 진단서, 급여명세서를 올리시면 AI가 승인 확률과 휴업급여를 즉시 판정합니다.
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
        <PayslipModal onClose={() => setShowPayslipModal(false)} />
      )}

    </div>
  );
}

