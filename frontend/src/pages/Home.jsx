import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Coins, Calendar, Clock, Wallet, FileText, ShieldAlert,
  HeartPulse, PiggyBank, ArrowRight, Search, Users, Sparkles, Mail, Crown, CheckCircle2, MessageSquare
} from 'lucide-react';

const SMART_QUICK_PROMPTS = [
  { text: '💬 2026년 내 월급·주휴수당 209시간 정밀 계산해 줘', to: '/worker/report' },
  { text: '📄 재직증명서 / 경력증명서 즉시 작성해 줘', to: '/employer/ai-consultant' },
  { text: '💰 육아휴직·병가 포함 퇴직금 얼마인지 계산해 줘', to: '/tools/severance' },
  { text: '📜 우리 사업장 맞춤 취업규칙 작성해 줘', to: '/employer/ai-consultant' },
  { text: '🩺 산재 발생 시 처리 절차와 휴업급여 알려줘', to: '/worker/injury' },
  { text: '🛡️ 노동청 근로감독 점검 대비 체크리스트 알려줘', to: '/employer/report' }
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
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/worker/report?query=${encodeURIComponent(query)}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* 👑 노무비서실장 전면 부각 메인 히어로 섹션 */}
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
        {/* 은은한 배경 빛 효과 */}
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1.2rem', borderRadius: '50px',
          background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem'
        }}>
          <Crown size={18} color="#fbbf24" /> AI 노무비서실장 총괄 가동 중
        </div>

        <h1 style={{
          fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc',
          lineHeight: 1.3, marginBottom: '1rem', wordBreak: 'keep-all'
        }}>
          복잡한 노무 문제, <span style={{ color: '#38bdf8' }}>질문 한 줄만 입력하세요</span>
        </h1>

        <p style={{
          fontSize: '1.15rem', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 2.5rem',
          lineHeight: 1.6, wordBreak: 'keep-all'
        }}>
          직접 찾아서 계산할 필요가 없습니다. <strong style={{ color: '#f8fafc' }}>AI 노무비서실장</strong>이 1초 만에 관련 법령·판례 진단부터 0% 오차 정밀 계산, 재직증명서·취업규칙 서류 작성까지 알아서 다 해결해 드립니다.
        </p>

        {/* 🔍 노무비서실장 지휘 대화 입력창 */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '680px', margin: '0 auto 1.5rem', position: 'relative' }}>
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
              placeholder="예: 월급 209시간 계산해줘 / 재직증명서 작성해줘 / 육아휴직 퇴직금..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '1.15rem 7.5rem 1.15rem 3.2rem',
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
              질문하기 <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* 💡 빠른 질문 칩 (Quick Smart Chips) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', maxWidth: '800px', margin: '0 auto' }}>
          {SMART_QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => navigate(prompt.to)}
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
              {prompt.text}
            </button>
          ))}
        </div>
      </div>

      {/* 🏛️ 노무비서실장 산하 5대 전담 수석 에이전트 조직 안내 */}
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
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s'
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

      {/* 🚀 빠른 이동 전담 섹션 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'
      }}>
        <Link to="/worker/report" style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', padding: '2rem',
          textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <User size={24} color="#38bdf8" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>근로자 전담 상담</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              월급·주휴수당·연차 계산부터 산재 신청, 임금체불 권리 구제까지 노무비서실장이 친절히 자문해 드립니다.
            </p>
          </div>
          <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            근로자 서비스 바로가기 <ArrowRight size={18} />
          </span>
        </Link>

        <Link to="/employer/report" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '20px', padding: '2rem',
          textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Briefcase size={24} color="#fbbf24" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>사업주 전담 컨설팅</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              사업장 맞춤 취업규칙 작성, 재직증명서 발급, 4대보험 부담금, 2026 고용장려금 승인 진단까지 한 번에 해결하세요.
            </p>
          </div>
          <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            사업주 서비스 바로가기 <ArrowRight size={18} />
          </span>
        </Link>
      </div>

    </div>
  );
}
