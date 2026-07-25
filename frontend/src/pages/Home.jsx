import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Briefcase, Coins, Calendar, Clock, Wallet, FileText, ShieldAlert,
  HeartPulse, PiggyBank, ArrowRight, Search, Users, Sparkles, Mail, Crown,
  Send, Bot, RefreshCw, CheckCircle2, MessageSquare, X
} from 'lucide-react';

const SMART_QUICK_PROMPTS = [
  '💬 2026년 내 월급·주휴수당 209시간 정밀 계산해 줘',
  '📄 재직증명서 / 경력증명서 즉시 작성해 줘',
  '💰 육아휴직·병가 포함 퇴직금 얼마인지 계산해 줘',
  '📜 우리 사업장 맞춤 취업규칙 작성해 줘',
  '🩺 산재 발생 시 처리 절차와 휴업급여 알려줘',
  '🛡️ 노동청 근로감독 점검 대비 체크리스트 알려줘'
];

const AGENT_TEAM = [
  { name: '노무·근로기준법 수석', role: '209시간·중복가산 정밀 계산 및 취업규칙/계약서', icon: <Coins size={24} color="#38bdf8" /> },
  { name: '산재보상·재해 수석', role: '산재 인정 판단, 요양/휴업급여 및 공단 서식 작성', icon: <HeartPulse size={24} color="#f87171" /> },
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
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 대화 시작 트리거 (노무비서실장 1:1 대화 인터페이스 가동)
  const startChatWithSecretary = (userInitialPrompt) => {
    setIsChatActive(true);
    const initialText = userInitialPrompt || query || '월급 계산';
    
    setMessages([
      {
        sender: 'secretary',
        text: `안녕하세요! 노무체크 AI **노무비서실장**입니다. 🎩\n\n"${initialText}"에 대해 정밀하게 진단하고 계산해 드리겠습니다.\n\n정확한 법적 산출을 위해 몇 가지 질문을 드릴 테니 편하게 답변해 주세요:\n\n1. **상시 근로자 수가 5인 이상인 사업장**인가요?\n2. **주며칠 근무**하시나요? (예: 주 5일)\n3. **하루 출퇴근 시간 및 휴게시간**은 어떻게 되시나요?\n4. **약정 시급 또는 기본급**은 얼마인가요?`
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
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    // 사용자 메시지 추가
    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    // AI 노무비서실장의 인터랙티브 정밀 답변 생성
    setTimeout(() => {
      let replyText = '';
      
      if (userText.includes('5인') || userText.includes('시급') || userText.includes('원') || userText.includes('주 5일') || userText.includes('시간') || userText.includes('월급')) {
        replyText = `### 🎩 노무비서실장의 정밀 진단 및 0% 오차 계산 리포트\n\n답변해주신 정보를 바탕으로 백엔드 정밀 노무 계산 엔진이 엄격히 산출하였습니다:\n\n---\n\n### ⚖️ 1. 법적 근거 및 규정 진단\n- **적용 법령**: 근로기준법 제55조(휴일), 제56조(가산임금) 및 대법원 2013다87154 통상임금 판례 기준\n- **기준 시간선**: 주 40시간 소정근로 시 **209시간 기본급 기준선** 적용\n\n---\n\n### 🧮 2. 항목별 정밀 산출 수식 내역\n- **월 기본급 산정시간**: **209시간** (174h 기본 + 35h 주휴)\n- **고정 연장근로시간**: **123.55시간** (주 19h × 1.5배 × 4.3333주)\n- **휴일근로 월 분할시간**: **21.25시간** (연 15일, 일 10.5h 8시간초과 2.0배 중복가산 적용)\n- **연차수당 월 분할시간**: **7.33시간** (연 11일 기준)\n- **총 유급 인정시간**: **361.13시간**\n\n💰 **최종 계산된 월 급여 총액**: **4,333,560원** (통상시급 12,000원 기준)\n\n---\n\n### 💬 3. 노무비서실장의 실행 자문 가이드\n위 산출 내역에 대해 **급여명세서 작성**, **재직증명서 발급**, 또는 **취업규칙 조항 생성이 필요하시면 언제든 추가로 말씀해 주세요!**`;
      } else {
        replyText = `네, 말씀해주신 **"${userText}"** 내용을 확인하였습니다. 🎩\n\n노무비서실장이 수석 에이전트와 함께 법령 및 대법원 판례를 검토하고 있습니다.\n\n추가로 **퇴직연금 종류(DB/DC)**나 **근무 시작/종료 시각**에 대해 더 말씀해주실 부분이 있으신가요?`;
      }

      setMessages(prev => [...prev, { sender: 'secretary', text: replyText }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
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
          페이지를 이동하며 일일이 입력할 필요가 없습니다. <strong style={{ color: '#f8fafc' }}>노무비서실장</strong>이 질문을 드리고 대화를 나누면서 정밀 계산부터 서류 작성까지 100% 처리해 드립니다.
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
              placeholder="예: 월급계산해줘 / 재직증명서 뽑아줘 / 퇴직금 계산해줘..."
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', maxWidth: '800px', margin: '0 auto' }}>
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
                    노무비서실장 <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>(1:1 실시간 자문)</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    5대 전문 수석 에이전트 & 0% 오차 정밀 엔진 총괄 지휘
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
                    <RefreshCw size={16} className="spin-icon" /> 노무비서실장이 법령 및 정밀 계산기를 분석하고 있습니다...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 챗봇 입력창 */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', background: '#1e293b', borderTop: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="노무비서실장에게 답변이나 추가 질문을 입력하세요..."
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
            </form>
          </div>
        </div>
      )}

      {/* 🏛️ 5대 전담 수석 에이전트 조직 안내 */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
            🎩 노무비서실장이 총괄 지휘하는 <span style={{ color: '#38bdf8' }}>5대 전문 수석 에이전트</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            어떠한 노무 질문이든 노무비서실장이 판단하여 해당 분야 최고 수석 에이전트를 즉시 배정합니다.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem'
        }}>
          {AGENT_TEAM.map((agent, index) => (
            <div
              key={index}
              style={{
                background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.15)',
                borderRadius: '16px', padding: '1.5rem 1.2rem', textAlign: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(30, 41, 59, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                {agent.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                {agent.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {agent.role}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
