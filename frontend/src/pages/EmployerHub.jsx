import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Coins, Calendar, Clock, PiggyBank, ShieldAlert, Wallet, 
  HeartPulse, Users, Sparkles, ShieldCheck, ArrowRight, Copy, X, FileCheck, FileText 
} from 'lucide-react';
import GovernmentGrantModal from '../components/GovernmentGrantModal.jsx';

const EMPLOYER_DOC_TEMPLATES = [
  {
    id: 'employer_contract',
    title: '📄 사업주용 2026 표준 근로계약서 (과태료 예방)',
    desc: '근로기준법 제17조 위반 서면 교부 미이행 벌금(500만원 이하)을 100% 예방하는 합법적 계약서 서식',
    content: `[표준 근로계약서 (사업주 보관용 및 근로자 교부용)]

1. 사업장 및 근로자 정보
 - 사업장명(회사/매장): (회사명 입력)
 - 대표자(사용자): (대표자 성명 입력)
 - 근로자(피용자): (근로자 성명 입력)

2. 근로계약 기간 및 직무
 - 계약기간: 2026년 ___월 ___일 ~ (정규직은 기간의 정함이 없음)
 - 근무 장소: _______________________________
 - 담당 업무: _______________________________

3. 근로시간 및 휴게시간 (근로기준법 제50조, 제54조)
 - 소정근로시간: 주 ___시간 (평일 09:00 ~ 18:00)
 - 휴게시간: 12:00 ~ 13:00 (1시간, 식사시간 포함)
 - 주휴일: 매주 일요일 (유급)

4. 임금 구성 항목 및 지급일 (근로기준법 제48조 분리 교부)
 - 기본급: 월 ______________원
 - 식대(비과세): 월 200,000원 (소득세 및 4대보험 절세 합산)
 - 주휴수당: 기본급에 포괄 포함 표기 (월 209시간 기준)
 - 임금 지급일: 매월 ___일 (금융기관 계좌 직접 입금)

5. 근로계약서 교부 (근로기준법 제17조 제2항)
 - 사용자는 본 근로계약서를 체결함과 동시에 근로자에게 서면/전자문서로 1부 교부합니다.

작성일자: 2026년 ___월 ___일
사용자(사업주): ________________ (직인)
근로자: __________________ (인)`
  },
  {
    id: 'payslip_spec',
    title: '📊 근로기준법 제48조 표준 임금명세서 교부 서식',
    desc: '임금명세서 미교부 과태료(최대 500만원)를 100% 예방하는 산출 공식 명시 표준 명세서 양식',
    content: `[임 금 명 세 서 (사용자 교부용)]

수신(근로자): ____________ 귀하
지급 대상 기간: 2026년 ___월 01일 ~ 2026년 ___월 말일
지급일: 2026년 ___월 ___일

1. 지급 내역 (세전 총액)
 - 기본급 (174시간): ______________원
 - 유급 주휴수당 (35시간): ______________원
 - 식대 (비과세 20만원): ______________원
 - 연장근로수당: ______________원 (산식: 초과시간 × 통상시급 × 1.5배)
 - 야간근로수당: ______________원 (산식: 야간시간 × 통상시급 × 0.5배)
 ▶ 지급 총액: __________________원

2. 공제 내역 (4대보험 및 세금)
 - 국민연금 (4.75%): ______________원
 - 건강보험 (3.595%): ______________원
 - 노인장기요양보험 (건강보험의 13.14%): ______________원
 - 고용보험 (0.9%): ______________원
 - 소득세 및 지방소득세: ______________원
 ▶ 공제 총액: __________________원

3. 실수령액 (지급 총액 - 공제 총액): __________________원

발행처: (회사명) 대표자 (서명/인)`
  },
  {
    id: 'dismissal_notice',
    title: '📜 30일 전 해고예고 통지서 정식 서식',
    desc: '당일 구두 해고 시 발생하는 30일분 해고예고수당 분쟁을 방지하는 서면 통지서 양식',
    content: `[해 고 예 고 통 지 서]

수신(근로자) 성명: __________________
소속 및 직위: ______________________
생년월일: _________________________

근로기준법 제26조(해고의 예고) 규정에 의하여 아래와 같이 해고 예정 통지를 통보합니다.

1. 해고 예정 일자: 2026년 ___월 ___일 (※ 통지일로부터 최소 30일 이후)
2. 해고 사유: 
 (경영상 이유, 근로자의 중대한 계약 위반 등 구체적인 사유 기재)
 ____________________________________________________________________
 ____________________________________________________________________

본 통지서는 해고 예정일 30일 전에 정상 전달되었음을 확인합니다.

통지일자: 2026년 ___월 ___일
사용자(사업주): __________________ (직인)
수신인 확인: __________________ (서명)`
  }
];

const TOOL_CATEGORIES = [
  {
    categoryName: '🛡️ 노무 리스크 진단 & AI 컨설팅',
    items: [
      { to: '/employer/employees', icon: <Users size={24} color="#818cf8" />, title: '직원 관리 대시보드', desc: '사업장 직원 등록, 4대보험 부담금 및 인건비 실시간 통합 관리' },
      { to: '/employer/ai-consultant', icon: <Sparkles size={24} color="#a78bfa" />, title: 'AI 노무 컨설턴트 (독소조항 검증)', desc: '근로계약서/취업규칙의 위법 독소조항을 AI 노무사가 정밀 분석하고 안전 대안 제시' },
      { to: '/employer/report', icon: <ShieldAlert size={24} color="#fbbf24" />, title: 'AI 노무 리스크 진단 리포트', desc: '사업장 근로시간/급여 입력 시 법 위반 리스크 등급 및 과태료 방지 체크리스트 발행' },
    ]
  },
  {
    categoryName: '💼 인건비 & 4대보험 사업주 부담금',
    items: [
      { to: '/employer/insurance', icon: <Wallet size={24} color="#fbbf24" />, title: '4대보험 사업주 부담금 계산기', desc: '국민연금, 건강보험, 고용보험, 산재보험 사업주 실질 부담금 정밀 산출' },
      { to: '/tools/salary', icon: <Coins size={24} color="#f59e0b" />, title: '209시간 월급 계산기', desc: '직원별 최저임금 준수 여부 및 주휴수당 분리 명세서 미리보기' },
      { to: '/tools/reverse-salary', icon: <Coins size={24} color="#38bdf8" />, title: '역산 월급 계산기', desc: '약정 세전 총월급에서 합법적 기본급 및 수당 구조 역산' },
    ]
  },
  {
    categoryName: '🎓 노동청 점검 대비 & 산재 예방',
    items: [
      { to: '/employer/injury', icon: <HeartPulse size={24} color="#fbbf24" />, title: '산재 예방 & 법적 의무 체크리스트', desc: '산재 발생 시 사업주의 119/공단 보고 의무 및 과태료 예방 수칙' },
      { to: '/tools/annual-leave', icon: <Clock size={24} color="#a78bfa" />, title: '연차 촉진 & 수당 계산기', desc: '서면 연차 사용 촉진 절차 관리 및 미사용 수당 이월 정산' },
      { to: '/tools/severance', icon: <PiggyBank size={24} color="#34d399" />, title: '퇴직금 정산 계산기', desc: '퇴사 예정 직원 퇴직금 충당금 산출 및 퇴직연금 매칭' },
    ]
  }
];

function EmployerHub() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDoc = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', paddingBottom: '5rem' }}>
      
      {/* 👑 사업주 전용 히어로 헤더 */}
      <div className="hub-header employer" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        borderRadius: '24px',
        padding: '2rem 2.2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="hub-header-icon" style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.25))',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Briefcase size={30} color="#fbbf24" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="glow-badge" style={{ marginBottom: '0.5rem', borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)' }}>
            <ShieldCheck size={14} color="#fbbf24" /> 사업주 과태료 방지 & 노무 리스크 예방 SaaS
          </div>
          <h1 className="hub-header-title" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            사업주를 위한 <span style={{ color: '#fbbf24' }}>노무 리스크 방지 & 서류 관리 센터</span>
          </h1>
          <p className="hub-header-desc" style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 1.2rem 0', lineHeight: 1.6 }}>
            고용노동부 근로감독 점검 과태료를 사전에 예방하고, 합법적 근로계약서·임금명세서 및 4대보험 부담금을 1초 만에 관리하세요.
          </p>

          <button
            onClick={() => setShowGrantModal(true)}
            style={{
              padding: '0.75rem 1.4rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669, #34d399)', color: '#ffffff',
              fontWeight: 800, fontSize: '0.92rem', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(52, 211, 153, 0.4)'
            }}
          >
            <PiggyBank size={18} /> 💼 2026 고용지원금 (최대 1,200만원) 맞춤 매칭 툴 열기 ➔
          </button>
        </div>
      </div>

      {/* 📑 1클릭 사업주 필수 양식 발급 모듈 */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={22} color="#fbbf24" /> 1클릭 사업주 과태료 예방 정식 서식 발급
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>💡 클릭 시 즉시 텍스트 복사 및 양식 편집이 가능합니다.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {EMPLOYER_DOC_TEMPLATES.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="home-feature-card"
              style={{ padding: '1.4rem' }}
            >
              <div>
                <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>{doc.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{doc.desc}</p>
              </div>
              <div style={{ marginTop: '1.1rem', color: '#fbbf24', fontSize: '0.84rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                서식 미리보기 & 복사하기 <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛠️ 카테고리별 사업주 도구 매트릭스 */}
      {TOOL_CATEGORIES.map((cat, idx) => (
        <section key={idx} style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1.1rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
            {cat.categoryName}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
            {cat.items.map((t) => (
              <Link key={t.to} to={t.to} className="home-feature-card">
                <div>
                  <div className="feature-card-icon" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {t.icon}
                  </div>
                  <h4 className="feature-card-title">{t.title}</h4>
                  <p className="feature-card-desc">{t.desc}</p>
                </div>
                <div className="feature-card-action" style={{ color: '#fbbf24' }}>
                  이용하기 <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 📄 양식 미리보기 & 복사 팝업 모달 */}
      {selectedDoc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '680px', maxHeight: '88vh',
            background: '#0f172a', border: '1px solid rgba(251, 191, 36, 0.4)',
            borderRadius: '20px', padding: '1.8rem', color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', margin: 0 }}>
                {selectedDoc.title}
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <textarea
              readOnly
              value={selectedDoc.content}
              rows={14}
              style={{
                width: '100%', background: '#1e293b', border: '1px solid #334155',
                color: '#e2e8f0', borderRadius: '12px', padding: '1rem',
                fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.6,
                boxSizing: 'border-box', marginBottom: '1.2rem', outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => handleCopyDoc(selectedDoc.content)}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '10px',
                  background: copied ? '#16a34a' : 'linear-gradient(135deg, #d97706, #fbbf24)',
                  color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}
              >
                <Copy size={18} /> {copied ? '복사 완료!' : '양식 텍스트 전체 복사하기'}
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  padding: '0.8rem 1.2rem', borderRadius: '10px',
                  background: '#334155', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💼 사업주 2026 고용지원금 맞춤 매칭 모달 */}
      <GovernmentGrantModal isOpen={showGrantModal} onClose={() => setShowGrantModal(false)} />

    </div>
  );
}

export default EmployerHub;

