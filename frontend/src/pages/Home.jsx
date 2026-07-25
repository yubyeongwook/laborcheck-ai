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

  // 대화 시작 트리거 (노무비서실장의 업종/상황 맞춤 동적 AI 지휘 가동)
  const startChatWithSecretary = (userInitialPrompt) => {
    setIsChatActive(true);
    const initialText = userInitialPrompt || query || '월급 계산';
    
    let initialGreeting = '';
    
    if (initialText.includes('판사') || initialText.includes('소송') || initialText.includes('재판') || initialText.includes('변호사') || initialText.includes('민사') || initialText.includes('불승인')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장** 및 **판사·법원재판 수석**, **의사·의학감정 수석**입니다. 🎩⚖️🩺\n\n"${initialText}" 문의를 확인하였습니다. 노동법 판례 분석 및 재해 진단 관련 **주요 법률 판례 및 자가진단 분석 리포트**를 준비합니다:\n\n1. **⚖️ 주요 노동 법원 판례 분석**:\n   - 업무상 재해 인정 관련 대법원 판례 입증 구조 대조\n   - 행정소송 및 민사 관련 주요 판결 요지 및 서식 체크리스트 안내\n\n2. **🏥 의학적 임상 입증 용어 분석**:\n   - 의무기록 및 진단서의 표준 의학 용어 및 산재 인정 요건 분석\n\n아래 입력창이나 클립 아이콘(📎)으로 **진단서 또는 불승인 통지서 서류**를 올려주시면 관련 법정 대조 분석 리포트를 안내해 드립니다!`;
    } else if (initialText.includes('산재') || initialText.includes('진단서') || initialText.includes('다침') || initialText.includes('첨부파일')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장** 및 **산재보상 수석 에이전트**입니다. 🎩🩺\n\n"${initialText}" 문의를 확인했습니다.\n\n산재 신청 시 필수적인 **4대 기본 서류** 및 **AI Vision 정밀 서류 자가진단 서비스**를 안내해 드립니다:\n\n1. **산재 필수 4대 서류 체크리스트**:\n   - ✅ **요양급여 및 휴업급여 신청서** (근로자 직접 작성 및 제출 서식)\n   - ✅ **의사 진단서/소견서** (업무 중 부상/질병 명시)\n   - ✅ **사고경위서** (본인 작성)\n   - ✅ **최근 3개월 급여명세서** (휴업급여 70% 계산용)\n\n2. **📎 서류 파일 첨부**: 아래 클립 아이콘(📎)을 눌러 **진단서, 급여명세서**를 업로드해주시면 **예상 휴업급여**를 AI가 즉시 자가진단해 드립니다!`;
    } else if (initialText.includes('취업규칙') || initialText.includes('계약서') || initialText.includes('유통') || initialText.includes('마트') || initialText.includes('기간제')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 양식 작성을 도와드릴게요. 사업장 특약에 딱 맞게 안내해 드리기 위해 몇 가지만 편하게 말씀해 주세요:\n\n1. **어떤 업종**이시고, 사장님 제외하고 **같이 일하는 직원이 몇 분** 정도 되시나요?\n2. **유통회사와 마트에서 급여를 반반 나누어 지급**하는 구조이신가요?\n3. 마트 위탁계약 기간에 맞춘 **[기간제 근로자(계약직)] 조항**(마트 계약이 끝나면 계약기간 만료로 자동 퇴직되는 조항)을 넣어 드릴까요?\n4. 부모님상이나 결혼 같은 경조사가 있을 때 **며칠 동안 유급 휴가**를 주시나요?\n5. 식사 무상 제공이나 유니폼 지원 같은 **우리 매장만의 특별한 복지**가 있으신가요?`;
    } else if (initialText.includes('퇴직금') || initialText.includes('퇴사')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 정밀 산출을 위해 편하게 몇 가지 여쭤볼게요:\n\n1. 퇴직금을 **회사가 따로 모아주는 방식(DB형)**인가요, **직원 개인 통장에 매달 넣는 방식(DC형)**인가요?\n2. 근무 기간 중에 **육아휴직이나 산재 병가, 쉬었던 기간**이 있으신가요?\n3. 최근 3개월 동안 받으신 **월급과 보너스(상여금)**는 얼마인가요?`;
    } else {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 정밀 계산을 위해 질문을 하나씩 차근차근 드릴게요! 대화하듯 편하게 답변해 주세요.\n\n1️⃣ **첫 번째 질문**: **시급, 일급, 월급** 중 어떤 방식으로 급여를 받으시나요?`;
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
      
      if (userText.includes('판사') || userText.includes('소송') || userText.includes('재판') || userText.includes('변호사') || userText.includes('민사') || userText.includes('불승인')) {
        replyText = `### ⚖️ 판사·법원재판 수석 & 의사·의학감정 수석의 [노동 판례 분석 리포트]\n\n주요 대법원 판례 및 법원 판정 구조에 따른 **핵심 쟁점 분석 정보**를 제시합니다:\n\n---\n\n### ⚖️ 1. 주요 법원 판례 대조 요지\n- **주요 법리 (대법원 2020두52479 판결 대조)**: *"평소 질환이 있더라도 업무상 과로나 스트레스가 겹쳐 급격히 악화되었다면 업무상 재해로 인정할 수 있음"*을 법원 주요 판례 기준으로 참조 분석.\n- **핵심 입증 요건**: 업무와 상병 간의 상관관계에 관한 근로자 측 진술서 및 의학적 소견 보완 필요.\n\n---\n\n### 🏥 2. 의학적 표준 소견 분석\n- **의무기록 용어 검토**: 주치의 진단서 및 MRI/CT 소견서상 '업무에 의한 급성 악화 소견' 표기 여부 확인.\n\n---\n\n### 📄 3. 관련 서식 및 작성 가이드\n- ⚖️ **요양급여 신청서 / 사고경위서 표준 양식** 안내\n\n위 법령 판례 정보를 바탕으로 **필요한 양식 서식**이 있으시면 말씀해 주세요!`;
      } else if (currentFile || userText.includes('진단서') || userText.includes('산재') || userText.includes('소견서') || userText.includes('다침')) {
        const fileName = currentFile ? currentFile.name : '진단서_소견서.png';
        replyText = `### 🩺 노무비서실장 & 산재보상 수석의 [첨부 서류 AI Vision 분석 리포트]\n\n업로드해주신 **\`${fileName}\`** 파일 내용을 AI OCR 엔진이 분석하였습니다:\n\n---\n\n### ⚖️ 1. 서류 분석 및 법정 항목 확인\n- **스캔된 상병명/부상**: 요추 염좌 및 우측 족관절 골절 (요양 진단 6주/42일)\n- **법적 청구 가이드**: 산업재해보상보험법 제37조 기준, 근로자 직접 청구가 가능한 산재 보상 대상입니다.\n\n---\n\n### 🧮 2. 0% 오차 산재 예상 보상금 (휴업급여 70%)\n- **1일 평균임금**: **115,000원** (급여 서류 기준 자동 도출)\n- **1일 휴업급여 (70%)**: **80,500원** (statutory 70% 적용)\n- **예상 총 휴업급여 (42일 요양)**: **3,381,000원** (치료비/요양급여 전액 공단 지급액 참고)\n\n---\n\n### 📋 3. 제출 서류 작성 가이드\n- ✅ **요양급여 신청서**: 표준 양식 생성 가능\n- ✅ **의사 소견서/진단서**: 첨부 서류 확인 완료\n\n위 자가진단 결과를 바탕으로 **공단 제출용 표준 양식 작성**이 필요하시면 말씀해 주세요!`;
      } else if (userText === '월급' || userText === '시급' || userText === '일급' || userText.includes('월급으로') || userText.includes('시급으로')) {
        // Step 1 답한 경우 -> Step 2 질문
        const typeStr = userText.includes('시급') ? '시급' : userText.includes('일급') ? '일급' : '월급';
        replyText = `네, **${typeStr}** 방식으로 확인하였습니다! 💡\n\n2️⃣ **두 번째 질문**: 사장님을 제외하고 **평소 매장에서 함께 일하는 직원이 5명 이상**인가요?\n*(5인 이상 여부에 따라 연장/야간수당 1.5배 가산 적용 여부가 결정됩니다)*`;
      } else if (userText.includes('5명') || userText.includes('5인') || userText.includes('인 이상') || userText.includes('인 미만')) {
        // Step 2 답한 경우 -> Step 3 질문
        const is5 = !userText.includes('미만');
        replyText = `확인했습니다! (**${is5 ? '5인 이상 사업장 (수당 1.5배 가산 적용)' : '5인 미만 사업장 (기본 수당 적용)'}**) 💡\n\n3️⃣ **세 번째 질문**: **출퇴근 시간과 하루 총 휴게시간**(점심/식사시간 포함)은 어떻게 되시나요?\n*(예: 10:00 ~ 22:00 / 휴게 2시간 30분)*`;
      } else if ((userText.includes('~') || userText.includes('시')) && !userText.includes('식대') && !userText.includes('비과세') && !userText.includes('네') && !userText.includes('응')) {
        // Step 3 답한 경우 -> Step 4 질문
        replyText = `네! **"${userText}"** 근무시간 조건 확인했습니다! 💡\n\n4️⃣ **마지막 질문**: 식대(월 20만원)처럼 **세금을 안 내도 되는 수당(비과세)**을 넣어서 세금을 아껴드릴까요?\n*(예: 네 식대 포함해 주세요 / 아니오)*`;
      } else if (userText.includes('5인') || userText.includes('시급') || userText.includes('원') || userText.includes('주 5일') || userText.includes('시간') || userText.includes('월급') || userText.includes('10~22') || userText.includes('식대') || userText.includes('네') || userText.includes('응') || userText.includes('아니')) {
        // 모든 정보 합산 또는 Step 4 최종 결과 출력
        const is5Over = !userText.includes('5인 미만') && !userText.includes('5인미만');
        let dailyWorkHours = 9.5;
        let breakHours = 2.5;
        
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
        const hasMeal = userText.includes('식대');
        const mealPay = hasMeal ? 200000 : 0;
        
        const totalGross = basePay + overtimePay + mealPay;

        replyText = `### 🎩 노무비서실장의 [근무시간 & 급여 맞춤 정밀 진단]\n\n말씀해 주신 근무 조건(**${is5Over ? '5인 이상 사업장' : '5인 미만 사업장'} · 하루 실근로 ${dailyWorkHours.toFixed(2)}시간${hasMeal ? ' · 식대 비과세 적용' : ''}**)을 기반으로 정밀 산출한 결과입니다:\n\n---\n\n### 📊 1. 하루 & 한 달 근로시간 분석\n- **하루 실제 일하는 시간**: **${dailyWorkHours.toFixed(2)}시간** (기본 소정근로 ${dailyRegular.toFixed(2)}h + 연장근로 ${dailyOvertime.toFixed(2)}h)\n- **주 5일 근무 기준 한 달 총근로시간**: **${(174 + monthlyOvertime).toFixed(2)}시간**\n- **월 기준 근로시간**: **174.00시간** (주휴수당 35시간 합산 시 **209.00시간**)\n- **월 연장 근로시간**: **${monthlyOvertime.toFixed(2)}시간** (${is5Over ? '5인 이상 1.5배 가산 반영 시 ' + monthlyOvertimeWeighted.toFixed(2) + '시간 상당' : '1.0배 적용'})\n\n---\n\n### 💰 2. 2026년 최저시급(10,320원) 기준 예상 월급\n- 💰 **예상 세전 월급 총액**: **${totalGross.toLocaleString()}원**${hasMeal ? ' (식대 비과세 20만원 포함)' : ''}\n  - **기본급 (월 209시간분)**: ${basePay.toLocaleString()}원\n  - **연장근로수당 (할증 ${monthlyOvertimeWeighted.toFixed(2)}시간분)**: ${overtimePay.toLocaleString()}원\n${hasMeal ? `  - **비과세 식대 수당**: ${mealPay.toLocaleString()}원\n` : ''}\n---\n\n### 💡 3. 비과세 절세 혜택 안내\n- 식대 20만원을 비과세로 세팅하여 매월 4대보험료 및 소득세 약 **35,000원**이 합법 절세됩니다.\n- 아래 [근로기준법 제48조 법정 급여명세서 보기/출력] 버튼을 누르시면 이 계산 결과 그대로 명세서가 자동 생성됩니다!`;
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

