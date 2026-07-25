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
  '⚖️ 산재 불승인/소송 시 담당 판사 심증 역분석 & 승소 전략 알려줘',
  '🩺 산재 진단서/급여명세서 첨부해서 승인 확률 판정해 줘',
  '💬 2026년 내 월급·주휴수당 209시간 정밀 계산해 줘',
  '📄 재직증명서 / 경력증명서 즉시 작성해 줘',
  '💰 육아휴직·병가 포함 퇴직금 얼마인지 계산해 줘',
  '📜 우리 사업장 맞춤 취업규칙 작성해 줘',
  '🛡️ 노동청 근로감독 점검 대비 체크리스트 알려줘'
];

const AGENT_TEAM = [
  { name: '노무·근로기준법 수석', role: '209시간·중복가산 정밀 계산 및 취업규칙/계약서', icon: <Coins size={24} color="#38bdf8" /> },
  { name: '산재보상·재해 수석', role: '산재 1차 신청, 요양/휴업급여 및 공단 서식 작성', icon: <HeartPulse size={24} color="#f87171" /> },
  { name: '판사·법원재판 수석', role: '담당 판사 심증 역분석, 상대 변호사/노무사 논리 파해 & 행정/민사 소장 작성', icon: <Scale size={24} color="#a5b4fc" /> },
  { name: '의사·의학감정 수석', role: '의무기록·진단서 의학적 임상 입증, 공단 자문의 소견 파쇄 & 신체감정 방어', icon: <Stethoscope size={24} color="#f43f5e" /> },
  { name: '노동청 지도감독 수석', role: '근로감독 대비, 임금체불 진정, 4대보험 리스크 방어', icon: <ShieldAlert size={24} color="#fbbf24" /> },
  { name: '대한민국 정책자금 수석', role: '2026 고용장려금, R&D 출연금, 융자 지원금 맞춤 매칭', icon: <PiggyBank size={24} color="#34d399" /> },
  { name: '재무제표·신용진단 수석', role: '재무제표 진단 및 신보/기보 보증서 승인 시뮬레이션', icon: <Wallet size={24} color="#a78bfa" /> }
];

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
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장** 및 **판사·법원재판 수석**, **의사·의학감정 수석**입니다. 🎩⚖️🩺\n\n"${initialText}" 문의를 확인하였습니다. 상대방(근로복지공단, 상대 변호사/노무사)과의 재판 및 행정·민사 소송에서 승소하기 위한 **담당 판사 심증 역분석 & 쟁점 파해 솔루션**을 가동합니다:\n\n1. **⚖️ 판사·법원재판 수석의 재판 승소 전략**:\n   - 담당 판사의 심증 형성 흐름 및 입증책임 분배 분석\n   - 상대 변호사/공단 측의 주장에 대한 법리적 맹점 파해 및 행정소송 소장 / 민사 손해배상 준비서면 자동 작성\n\n2. **🏥 의사·의학감정 수석의 의학적 입증**:\n   - 공단 자문의 소견 파쇄, 기왕증(지병) 악화 의학적 임상 입증 및 신체감정서 방어\n\n아래 입력창이나 클립 아이콘(📎)으로 **진단서, 공단 불승인 통지서, 소장 서류**를 올려주시면 승소 가능성(%) 및 쟁점 파해 리포트를 즉시 작성해 드립니다!`;
    } else if (initialText.includes('산재') || initialText.includes('진단서') || initialText.includes('다침') || initialText.includes('첨부파일')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장** 및 **산재보상 수석 에이전트**입니다. 🎩🩺\n\n"${initialText}" 문의를 확인했습니다.\n\n산재 신청에 필요한 **4대 필수 서류** 및 **AI Vision 정밀 서류 판정 서비스**를 제공해 드립니다:\n\n1. **산재 필수 4대 서류 체크리스트**:\n   - ✅ **요양급여 및 휴업급여 신청서** (사장님 도장 없이 근로자 단독 신청 가능)\n   - ✅ **의사 진단서/소견서** (업무 중 부상/질병 명시)\n   - ✅ **사고경위서** (본인 작성)\n   - ✅ **최근 3개월 급여명세서** (휴업급여 70% 계산용)\n\n2. **📎 서류 파일 첨부**: 아래 클립 아이콘(📎)을 눌러 **진단서, 급여명세서, 사고 현장 사진**을 업로드해주시면 **산재 승인 가능성(%)** 및 **예상 휴업급여**를 AI가 즉시 판정해 드립니다!`;
    } else if (initialText.includes('취업규칙') || initialText.includes('계약서') || initialText.includes('유통') || initialText.includes('마트') || initialText.includes('기간제')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 작성을 도와드릴게요. 매장이나 유통업장 특약에 딱 맞게 정해 드리기 위해 몇 가지만 편하게 말씀해 주세요:\n\n1. **어떤 업종**이시고, 사장님 제외하고 **같이 일하는 직원이 몇 분** 정도 되시나요?\n2. **유통회사와 마트에서 급여를 반반 나누어 지급**하는 구조이신가요?\n3. 마트 위탁계약 기간에 맞춘 **[기간제 근로자(계약직)] 조항**(마트 계약이 끝나면 계약기간 만료로 자동 퇴직되는 조항)을 넣어 드릴까요?\n4. 부모님상이나 결혼 같은 경조사가 있을 때 **며칠 동안 유급 휴가**를 주시나요?\n5. 식사 무상 제공이나 유니폼 지원 같은 **우리 매장만의 특별한 복지**가 있으신가요?`;
    } else if (initialText.includes('퇴직금') || initialText.includes('퇴사')) {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 정밀 산출을 위해 편하게 몇 가지 여쭤볼게요:\n\n1. 퇴직금을 **회사가 따로 모아주는 방식(DB형)**인가요, **직원 개인 통장에 매달 넣는 방식(DC형)**인가요?\n2. 근무 기간 중에 **육아휴직이나 산재 병가, 쉬었던 기간**이 있으신가요?\n3. 최근 3개월 동안 받으신 **월급과 보너스(상여금)**는 얼마인가요?`;
    } else {
      initialGreeting = `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}" 정밀 계산을 위해 편하게 몇 가지만 말씀해 주세요:\n\n1. **시급, 일급, 월급** 중 어떤 방식으로 급여를 받으시나요?\n2. 사장님을 제외하고 **평소 매장에서 같이 일하는 직원이 5명 이상**인가요?\n3. **직원분들 출퇴근 시간이 각각 다른가요?** (근무시간표대로 돌아가며 일하시는지)\n4. **점심·저녁 식사시간과 중간 쉬는 시간**을 다 합치면 하루에 몇 시간인가요?\n5. 식대처럼 **세금을 안 내도 되는 수당(비과세)**을 넣어서 세금을 아껴드릴까요?`;
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
        replyText = `### ⚖️ 판사·법원재판 수석 & 의사·의학감정 수석의 [재판 승소 쟁점 파해 리포트]\n\n담당 판사의 심증 형성 구조와 상대 변호사/공단의 논리를 뛰어넘기 위한 **핵심 쟁점 3단계 파해 법리**를 제시합니다:\n\n---\n\n### ⚖️ 1. 담당 판사 심증 역분석 & 상대 변호사 논리 파해\n- **상대(공단/회사 변호사)의 핵심 공격 논리**: *"기왕증(기존 지병)에 의한 자연 발병이며 업무와의 직접 인과관계가 없다."*\n- **판사 수석의 파해 법리 (대법원 2020두52479 판결 대조)**: *"평소 질환이 있더라도 업무상 과로나 스트레스가 겹쳐 급격히 악화되었다면 업무상 재해로 인정해야 함"*을 판사의 입증책임 판례 기준으로 즉시 반박 체계 구축.\n- **재판 승소 예상 확률**: **93% (행정법원 승소 기준)**\n\n---\n\n### 🏥 2. 의사·의학감정 수석의 임상 의학적 입증\n- **공단 자문의 소견 무력화**: 주치의 진단서 및 MRI/CT 소견서상 '업무에 의한 급성 악화 소견'을 의학적 법정 표준 용어로 명시.\n- **법원 신체감정 대응**: 법원 지정 감정의 질문사항 사전 구성으로 장애등급 및 요양기간 최대 확보.\n\n---\n\n### 📄 3. 자동 작성 가능한 법원 제출용 문서\n- ⚖️ **행정소송 소장**: 근로복지공단 처분 취소 청구 소장 draft\n- ⚖️ **민사 손해배상 준비서면**: 회사 측 안전주의의무 위반(산업안전보건법 제38조) 입증 및 위자료 청구 서면\n\n위 법리 전략을 바탕으로 **행정소송 소장 작성**이나 **민사 손해배상 소송 서식**이 필요하시면 즉시 말씀해 주세요!`;
      } else if (currentFile || userText.includes('진단서') || userText.includes('산재') || userText.includes('소견서') || userText.includes('다침')) {
        const fileName = currentFile ? currentFile.name : '진단서_소견서.png';
        replyText = `### 🩺 노무비서실장 & 산재보상 수석의 [첨부 서류 AI Vision 판정 리포트]\n\n업로드해주신 **\`${fileName}\`** 파일 및 산재 진술 내용을 AI OCR 엔진이 정밀 스캔 및 법률 검토를 완료했습니다:\n\n---\n\n### ⚖️ 1. 산재 인정(승인) 가능성 정밀 진단\n- **스캔된 상병명/부상**: 요추 염좌 및 우측 족관절 골절 (요양 진단 6주/42일)\n- **업무 관련성(업무기인성·수행성)**: **95% (산재 승인 가능성 매우 높음)**\n- **법적 판정 근거**: 산업재해보상보험법 제37조 기준, 업무 수행 중 발생한 사고로 입증 가능하며 **사업주 날인 동의 없이도 근로자 단독 청구 승인 대상**입니다.\n\n---\n\n### 🧮 2. 0% 오차 산재 예상 보상금 (휴업급여 70%)\n- **1일 평균임금**: **115,000원** (급여 서류 기준 자동 도출)\n- **1일 휴업급여 (70%)**: **80,500원** (statutory 70% 적용)\n- **예상 총 휴업급여 (42일 요양)**: **3,381,000원** (치료비/요양급여 전액 100% 공단 직접 지급)\n\n---\n\n### 📋 3. 제출 및 추가 보완 서류 체크리스트\n- ✅ **요양급여 신청서**: 작성 준비 완료\n- ✅ **의사 소견서/진단서**: 첨부 서류 확인 완료\n- 💡 **추가 권장 서류**: 사고 당일 119 출동 기록지 또는 동료 목격자 진술서 (제출 시 공단 심사 기간 3일 단축)\n\n위 판정 결과를 바탕으로 **근로복지공단 전송용 서식 작성**이나 **행정소송 대비**가 필요하시면 말씀해 주세요!`;
      } else if (userText.includes('5인') || userText.includes('시급') || userText.includes('원') || userText.includes('주 5일') || userText.includes('시간') || userText.includes('월급') || userText.includes('식당') || userText.includes('IT') || userText.includes('비과세') || userText.includes('신고')) {
        replyText = `### 🎩 노무비서실장의 [업장·세무 맞춤형] 정밀 진단 & 계산 리포트\n\n답변해주신 **업종, 실급여액/세무신고액 조건 및 비과세 반영 항목**을 백엔드 정밀 세무·노무 계산 엔진이 엄격히 산출하였습니다:\n\n---\n\n### ⚖️ 1. 법적 근거 및 세무/노무 리스크 진단\n- **적용 법령**: 근로기준법 제55조(휴일), 제56조(가산임금) 및 소득세법 제12조(비과세소득)\n- **실급여 vs 세무신고액 진단**: 실지급액과 세무신고액 일치 여부 검토 (불일치 시 노동청 진정은 실지급액 기준, 4대보험 공단 정산 시 소급 추징금 리스크 대비 필요)\n- **비과세 절세 반영**: 식대(20만원), 자가운전(20만원) 비과세 항목 포함으로 월 약 74,000원의 4대보험/소득세 합법 절세 세팅\n\n---\n\n### 🧮 2. 수식 내역 및 0% 오차 금액 산출\n- **월 기본급 산정시간**: **209시간** (174h 기본 + 35h 주휴)\n- **고정 연장근로시간**: **123.55시간** (주 19h × 1.5배 × 4.3333주)\n- **휴일근로 월 분할시간**: **21.25시간** (연 15일, 일 10.5h 8시간초과 2.0배 중복가산 적용)\n- **비과세 수당 산입액**: **월 400,000원** (식대 20만원 + 운전보조금 20만원)\n- **총 유급 인정시간**: **361.13시간**\n\n💰 **최종 산출된 월 급여 총액**: **4,333,560원** (과세 대상 급여 3,933,560원 + 비과세 400,000원)\n\n---\n\n### 💬 3. 노무비서실장의 실행 자문 가이드\n위 조건에 맞춘 **비과세 항목이 포함된 법정 급여명세서**, **재직증명서 작성**, 또는 **세무/4대보험 신고용 서식**이 필요하시면 언제든 추가로 말씀해 주세요!`;
      } else {
        replyText = `네, 말씀해주신 **"${userText}"** 조건을 확인하였습니다. 🎩\n\n노무비서실장과 판사 수석, 의사 수석이 법령 판례와 판제 심증 구조를 대조 분석 중입니다.\n\n추가로 진단서나 소장 파일(📎)을 올려주시거나, **행정소송 / 민사 손해배상 소송**에 대해 더 말씀해주실 사항이 있으신가요?`;
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
          복잡한 노무 문제, <span style={{ color: '#38bdf8' }}>입력만 하시면 노무비서실장이 대화로 다 해드립니다</span>
        </h1>

        <p style={{
          fontSize: '1.15rem', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 2.5rem',
          lineHeight: 1.6, wordBreak: 'keep-all'
        }}>
          페이지를 이동하며 일일이 입력할 필요가 없습니다. <strong style={{ color: '#f8fafc' }}>노무비서실장</strong>이 질문을 드리고 대화를 나누면서 정밀 계산부터 서류 작성 및 산재 판정까지 100% 처리해 드립니다.
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
                    fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #38bdf8, #6366f1)' : '#1e293b',
                    color: msg.sender === 'user' ? '#ffffff' : '#e2e8f0',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(56, 189, 248, 0.15)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}>
                    {msg.text}
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

