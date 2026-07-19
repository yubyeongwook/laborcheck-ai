import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Coins, Calendar, Clock, Wallet, FileText, ShieldAlert,
  HeartPulse, PiggyBank, ArrowRight, Search, Users, Sparkles, Mail
} from 'lucide-react';

const COMMON_TOOLS = [
  { to: '/tools/salary', icon: <Coins size={22} color="#f59e0b" />, title: '월급 계산기 & 급여명세서', desc: '실수령액 계산과 동시에 법정 급여명세서를 발급받고 카카오톡으로 전송합니다.', tag: '공용', keywords: '월급 급여 실수령액 명세서 시급 일급 연장 야간 수당' },
  { to: '/tools/reverse-salary', icon: <Coins size={22} color="#38bdf8" />, title: '역산 월급 계산기', desc: '받는 총 월급(세전)에서 근무 형태별 실제 시급과 수당 구성을 역산합니다.', tag: '공용', keywords: '역산 포괄임금 기초시급' },
  { to: '/tools/weekly-holiday', icon: <Calendar size={22} color="#38bdf8" />, title: '주휴수당 계산기', desc: '주 15시간 이상 근무 시 발생하는 주휴수당을 빠르게 확인합니다.', tag: '공용', keywords: '주휴수당 주휴' },
  { to: '/tools/annual-leave', icon: <Clock size={22} color="#a78bfa" />, title: '연차 계산기', desc: '입사일 기준 발생한 연차 개수와 미사용 연차수당을 계산합니다.', tag: '공용', keywords: '연차 휴가 연차수당' },
  { to: '/tools/severance', icon: <PiggyBank size={22} color="#34d399" />, title: '퇴직금 계산기', desc: '평균임금과 재직일수를 기반으로 예상 퇴직금을 산출합니다.', tag: '공용', keywords: '퇴직금 퇴사 평균임금' },
];

const WORKER_TOOLS = [
  { to: '/worker/report', icon: <FileText size={22} color="#38bdf8" />, title: 'AI 자가진단 리포트', desc: '겪고 있는 노무 이슈를 입력하면 관련 법령을 대조해 권리 구제 방향을 정리해 드립니다.', keywords: '자가진단 권리구제 리포트 진단' },
  { to: '/worker/injury', icon: <HeartPulse size={22} color="#f87171" />, title: '산재 대응 가이드', desc: '산재 발생 시 근로자가 즉시 해야 할 행동과 신청 절차를 안내합니다.', keywords: '산재 산업재해 다침 부상' },
];

const EMPLOYER_TOOLS = [
  { to: '/employer/report', icon: <ShieldAlert size={22} color="#fbbf24" />, title: 'AI 리스크 진단 리포트', desc: '사업장 조건을 입력하면 법 위반 리스크와 대응 체크리스트를 정리해 드립니다.', keywords: '리스크 진단 위반 체크리스트' },
  { to: '/employer/insurance', icon: <Wallet size={22} color="#fbbf24" />, title: '4대보험 사업주 부담금', desc: '월 급여 기준 국민연금·건강보험·고용보험·산재보험 사업주 부담액을 계산합니다.', keywords: '4대보험 국민연금 건강보험 고용보험 산재보험 부담금' },
  { to: '/employer/injury', icon: <HeartPulse size={22} color="#fbbf24" />, title: '산재 예방·대응 체크리스트', desc: '산재 발생을 막기 위한 사전 준비와 사고 발생 시 법적 의무를 안내합니다.', keywords: '산재 예방 체크리스트' },
  { to: '/employer/employees', icon: <Users size={22} color="#fbbf24" />, title: '직원관리', desc: '사업장별 직원을 등록하고 급여명세서 발행, 근태 기록까지 관리합니다.', keywords: '직원관리 직원 등록 근태 급여명세서 발행' },
  { to: '/employer/ai-consultant', icon: <Sparkles size={22} color="#fbbf24" />, title: 'AI 컨설턴트', desc: '근로계약서·취업규칙을 AI가 검토해 법 위반 리스크와 안전한 대안 문구를 제안합니다.', keywords: 'ai 컨설턴트 근로계약서 취업규칙 검토' },
  { to: '/contact', icon: <Mail size={22} color="#38bdf8" />, title: '문의하기', desc: '서비스 이용 중 궁금한 점이나 오류 제보, 제휴 문의를 남겨주세요.', keywords: '문의 문의하기 오류제보 연락처 고객센터' },
];

// 검색창에서 찾을 때 쓰는 전체 목록 (홈 화면 카드에는 없는 항목도 포함)
const ALL_TOOLS = [...COMMON_TOOLS, ...WORKER_TOOLS, ...EMPLOYER_TOOLS];

function ToolCard({ to, icon, title, desc, tag, tagClass }) {
  return (
    <Link to={to} className="feature-card">
      {tag && <span className={`feature-card-tag ${tagClass || ''}`}>{tag}</span>}
      <div className="feature-card-icon">{icon}</div>
      <h4 className="feature-card-title">{title}</h4>
      <p className="feature-card-desc">{desc}</p>
    </Link>
  );
}

function HelpSearch() {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOOLS.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      (t.keywords || '').toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  const goTo = (to) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(to);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (matches.length > 0) goTo(matches[0].to);
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', maxWidth: '560px', margin: '2.25rem auto 0' }}>
      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.6rem' }}>
        🔍 무엇을 도와드릴까요?
      </div>
      <div style={{
        position: 'relative', borderRadius: '16px', padding: '2px',
        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
        boxShadow: '0 8px 28px rgba(56, 189, 248, 0.25)'
      }}>
        <Search size={20} color="#38bdf8" style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="예: 월급, 주휴수당, 연차, 산재..."
          style={{
            width: '100%', boxSizing: 'border-box', padding: '1.05rem 1.2rem 1.05rem 3rem',
            fontSize: '1rem', borderRadius: '14px', border: 'none', outline: 'none',
            background: '#0f172a', color: '#f8fafc', fontFamily: 'inherit'
          }}
        />
      </div>

      {showSuggestions && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0, zIndex: 20,
          background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px',
          overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
        }}>
          {matches.map((m) => (
            <button
              key={m.to}
              type="button"
              onMouseDown={() => goTo(m.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.75rem 1rem', background: 'transparent', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              {m.icon}
              <div>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function Home() {
  return (
    <div className="page-container">
      <section className="hero-section">
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-content">
          <span className="hero-badge">대한민국 근로기준법 · 최저임금법 기반</span>
          <h1 className="hero-title">
            노무 이슈, <span className="hero-title-gradient">AI로 먼저</span> 진단하세요
          </h1>
          <p className="hero-subtitle">
            월급·주휴수당·연차·퇴직금 계산부터 AI 자가진단 리포트, 산재 대응까지.
            근로자와 사업주 각자에게 필요한 도구를 한곳에서 무료로 이용하세요.
          </p>

          <HelpSearch />

          <div className="hero-persona-grid">
            <Link to="/worker" className="hero-persona-card">
              <div className="hero-persona-icon"><User size={26} color="#38bdf8" /></div>
              <span className="hero-persona-title">근로자</span>
              <span className="hero-persona-desc">권리 구제, 임금 계산, 산재 대응 가이드</span>
            </Link>
            <Link to="/employer" className="hero-persona-card">
              <div className="hero-persona-icon"><Briefcase size={26} color="#fbbf24" /></div>
              <span className="hero-persona-title">사업주</span>
              <span className="hero-persona-desc">리스크 진단, 4대보험, 산재 예방 체크리스트</span>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div className="section-eyebrow">근로자 전용</div>
          <h2 className="section-title">권리 구제와 산재 대응</h2>
          <p className="section-desc">부당한 처우를 겪고 있거나 산재를 당했을 때 무엇을 해야 하는지 안내합니다.</p>
        </div>
        <div className="card-grid">
          {WORKER_TOOLS.map((t) => <ToolCard key={t.to} {...t} tag="근로자" tagClass="tag-worker" />)}
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div className="section-eyebrow">사업주 전용</div>
          <h2 className="section-title">리스크 진단과 사전 준비</h2>
          <p className="section-desc">법 위반 리스크를 사전에 점검하고, 산재 발생에 대비한 준비를 도와드립니다.</p>
        </div>
        <div className="card-grid">
          {EMPLOYER_TOOLS.map((t) => <ToolCard key={t.to} {...t} tag="사업주" tagClass="tag-employer" />)}
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div className="section-eyebrow">공용 계산기</div>
          <h2 className="section-title">근로자와 사업주 모두 사용하는 도구</h2>
          <p className="section-desc">급여, 주휴수당, 연차, 퇴직금 등 자주 확인하는 항목을 계산기로 바로 확인할 수 있습니다.</p>
        </div>
        <div className="card-grid">
          {COMMON_TOOLS.map((t) => <ToolCard key={t.to} {...t} />)}
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '3rem 0' }}>
        <Link to="/worker" className="navbar-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', fontSize: '0.95rem', textDecoration: 'none' }}>
          지금 시작하기 <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

export default Home;
