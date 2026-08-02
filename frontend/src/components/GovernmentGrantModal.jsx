import React, { useState } from 'react';
import { PiggyBank, Sparkles, CheckCircle2, DollarSign, Send, X, ArrowRight, ShieldCheck } from 'lucide-react';

const GRANT_PROGRAMS = [
  {
    id: 'youth',
    title: '청년일자리 도약장려금',
    target: '5인 이상 사업장 (우대업종 1인 이상)',
    amount: '최대 1,200만원 / 1인당',
    desc: '취업애로청년을 정규직으로 채용하여 6개월 이상 고용 유지 시, 1년간 월 60만원 + 2년차 480만원 일시지급',
    badge: '👑 대표 추천',
    typeTag: '🎁 100% 무상 보조금 (상환 의무 없음)',
    criteria: '만 15~34세 미취업 청년 정규직 채용, 고용보험 피보험자 수 5인 이상 (지식서비스/제조업 1인 이상 특례)',
    documents: [
      '① 표준 서면 근로계약서 사본 (주 30시간 이상)',
      '② 월별 임금명세서 및 금융기관 이체확인증',
      '③ 4대보험 사업장 가입자 명부',
      '④ 고용보험 피보험자 수 증빙 서류'
    ],
    checklist: [
      '□ 채용 전 3개월 및 채용 후 고용유지 기간 중 인원 감원(권고사직) 없을 것',
      '□ 2026 최저임금(10,320원) 및 209시간 월급 법정 기준 준수',
      '□ 주 30시간 이상 정규직 근로계약 체결'
    ]
  },
  {
    id: 'senior',
    title: '고령자 고용촉진장려금',
    target: '전 사업장 (60세 이상 채용)',
    amount: '최대 240만원 / 1인당',
    desc: '60세 이상 고령자를 1년 이상 정규직 또는 1년 이상 계약직으로 신규 채용 시 분기별 30만원씩 2년간 지원',
    badge: '👴 고령자 채용',
    typeTag: '🎁 100% 무상 보조금 (상환 의무 없음)',
    criteria: '채용일 기준 만 60세 이상 미취업 고령자 채용, 1년 이상 고용계약 체결',
    documents: [
      '① 근로계약서 사본 (1년 이상 계약)',
      '② 주민등록등본 또는 신분증 사본 (연령 증빙)',
      '③ 월별 급여 입금 내역서 및 임금명세서'
    ],
    checklist: [
      '□ 채용 전 3개월 간 인원 감원(권고사직) 부존재',
      '□ 사업주의 배우자, 4촌 이내 혈족·인척 채용 시 대상 제외'
    ]
  },
  {
    id: 'flexible',
    title: '유연근무 활용 장려금',
    target: '전 사업장 (재택/시차출퇴근)',
    amount: '월 30~50만원 / 1인당',
    desc: '재택근무, 시차출퇴근, 선택근무제 등 유연근무제를 도입하고 전자·기계적 출퇴근을 기록한 사업주 지원',
    badge: '💻 유연근무',
    typeTag: '🎁 100% 무상 보조금 (상환 의무 없음)',
    criteria: '취업규칙/근로계약서상 유연근무제 명시, 지문·카드·앱 등 전자·기계적 출퇴근 기록 보관',
    documents: [
      '① 유연근무제 도입 취업규칙 또는 노사합의서',
      '② 전자·기계적 출퇴근 타임스탬프 기록지',
      '③ 유연근무 근로계약서 사본'
    ],
    checklist: [
      '□ 수기 출퇴근부는 인정 불가 (전자적 태그 기록 필수)',
      '□ 주 1~2회 이상 유연근무 이행 실적 보관'
    ]
  },
  {
    id: 'middle',
    title: '신중년 적합직무 고용장려금',
    target: '전 사업장 (50세 이상 채용)',
    amount: '최대 960만원 / 1인당',
    desc: '50세 이상 미취업자를 신중년 적합직무(기술·경영·전문 직종)에 정규직 채용 시 1년간 월 40~80만원 지원',
    badge: '👔 신중년',
    typeTag: '🎁 100% 무상 보조금 (상환 의무 없음)',
    criteria: '만 50세 이상 미취업자 채용, 고용노동부 지정 신중년 적합직무 분야 수불 채용',
    documents: [
      '① 정규직 근로계약서 사본',
      '② 담당 업무 직무설명서 (적합직무 입증)',
      '③ 급여 이체증 및 4대보험 명부'
    ],
    checklist: [
      '□ 채용 후 3개월 고용 유지 후 1차 지원금 신청 가능',
      '□ 최저임금 100% 이상 지급'
    ]
  },
  {
    id: 'startup',
    title: '신규 사업자(창업 3년 이내) 전용 패키지',
    target: '창업 3년 미만 신규 사업자 및 예비 창업자',
    amount: '사업화 자금 최대 1억원 (무상) + 저리 융자 7,000만',
    desc: '신규 창업자가 초기 인건비·사무실 임차료·시제품 제작비를 부담 없이 확보하도록 지원하는 정부 100% 창업지원 프로그램',
    badge: '🚀 신규 창업자 특화',
    typeTag: '🚀 신규 창업 특화 지원 (무상 보조금 + 저리 융자)',
    criteria: '사업자등록일 기준 3년 미만 신규 사업자, 1인 창업기업 포함 (유흥/사행업 제외 전 업종)',
    documents: [
      '① 사업자등록증 사본 (또는 예비창업자 신분증)',
      '② 1페이지 요약 창업 사업계획서',
      '③ 대표자 이력서 및 대표자 국세 완납증명서'
    ],
    checklist: [
      '□ 대표자 개인 국세 및 지방세 체불 기록 없을 것',
      '□ 창업 3년 이내 신규 등록 사업주일 것',
      '□ 노무체크 AI 자동 검수로 1페이지 사업계획서 검증 완료할 것'
    ]
  },
  {
    id: 'policy_loan',
    title: '중진공·신보·기보 정책자금 융자',
    target: '전 중소기업 및 소상공인 사업장',
    amount: '최대 5억~50억원 (금리 1.5~3%대)',
    desc: '상환 의무가 존재하는 저금리 유상 정책자금. 신용보증기금·기술보증기금 보증서를 기반으로 시중은행 대비 초저금리로 시설/운전자금 융자',
    badge: '🏦 정책자금 융자',
    typeTag: '🏦 유상 융자 정책자금 (초저금리 상환형)',
    criteria: '사업자등록 1년 이상 정상 영업, 국세/지방세 체불 및 금융 연체 부존재, 부채비율 기준 충족',
    documents: [
      '① 사업자등록증 및 법인등기부등본',
      '② 최근 3개년 재무제표 증명원',
      '③ 국세 및 지방세 완납증명서',
      '④ 시설/운전자금 사업계획서'
    ],
    checklist: [
      '□ 최근 1년 이내 국세/지방세 체불 기록 없을 것',
      '□ 자본잠식 상태가 아니어야 함',
      '□ 신보/기보 보증 잔액 한도 사전 확인'
    ]
  }
];

export default function GovernmentGrantModal({ isOpen, onClose }) {
  const [companySize, setCompanySize] = useState('5인 이상');
  const [newHires, setNewHires] = useState('2');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [applied, setApplied] = useState(false);
  const [expandedId, setExpandedId] = useState('youth');

  if (!isOpen) return null;

  const hireNum = parseInt(newHires, 10) || 1;
  const estimatedMaxGrant = hireNum * 12000000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName || !phone) {
      alert('회사명과 연락처를 입력해 주세요.');
      return;
    }
    setApplied(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: '780px', maxHeight: '90vh',
        background: '#0f172a', border: '1px solid rgba(52, 211, 153, 0.4)',
        borderRadius: '24px', padding: '2rem', color: '#f8fafc',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        {/* 모달 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #059669, #34d399)', padding: '0.4rem', borderRadius: '10px' }}>
              <PiggyBank size={24} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', margin: 0 }}>
                사업주 및 창업자 지원금 100퍼센트 수령 필수 사전 준비 수칙
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                제출 전 국세 체불 0원, 209시간 근로계약서, 권고사직 이력 방지 필수 체크리스트
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* 💡 예상 최대 수령 지원금 계산기 카이샤 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.1))',
          border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '16px', padding: '1.2rem 1.5rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700 }}>신규 채용 {hireNum}명 기준 예상 최대 수령액</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', margin: '0.2rem 0 0 0' }}>
              최대 {estimatedMaxGrant.toLocaleString()}원 지원 가능
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>채용 예정 인원:</span>
            <select
              value={newHires}
              onChange={(e) => setNewHires(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #34d399', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}
            >
              {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}명</option>)}
            </select>
          </div>
        </div>

        {/* 📚 2026 4대 주요 고용장려금 프로그램 상세 자격 & 필수 서류 카드 그리드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {GRANT_PROGRAMS.map((p) => {
            const isExp = expandedId === p.id;
            return (
              <div key={p.id} style={{
                background: '#1e293b', border: `1px solid ${isExp ? '#34d399' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '1.2rem',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>{p.badge}</span>
                    <span style={{ background: p.id === 'policy_loan' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: p.id === 'policy_loan' ? '#fbbf24' : '#38bdf8', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>{p.typeTag}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{p.title}</h4>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>{p.amount}</span>
                </div>
                
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 0.8rem 0' }}>{p.desc}</p>

                {/* 필수 수령 자격 & 제출 서류 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExp ? null : p.id)}
                  style={{
                    width: '100%', padding: '0.45rem 0.8rem', borderRadius: '8px',
                    background: isExp ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: isExp ? '#34d399' : '#94a3b8', border: `1px solid ${isExp ? '#34d399' : '#334155'}`,
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <span>📋 수령 자격 기준, 필수 제출 서류 및 체크리스트 {isExp ? '접기 ▲' : '상세보기 ▼'}</span>
                  <ArrowRight size={14} style={{ transform: isExp ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
                </button>

                {/* 상세 자격 & 제출 서류 & 체크리스트 리포트 */}
                {isExp && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* 1. 수령 자격 기준 */}
                    <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', marginBottom: '0.2rem' }}>🎯 법적 수령 자격 기준</div>
                      <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>{p.criteria}</div>
                    </div>

                    {/* 2. 필수 제출 서류 목록 */}
                    <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.3rem' }}>📂 필수 제출 서류 목록</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {p.documents.map((doc, dIdx) => (
                          <div key={dIdx} style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{doc}</div>
                        ))}
                      </div>
                    </div>

                    {/* 3. 사전 점검 체크리스트 */}
                    <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.3rem' }}>✅ 사전 점검 체크리스트</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {p.checklist.map((chk, cIdx) => (
                          <div key={cIdx} style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{chk}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 📌 신규 및 기존 사업자 실제 지원금 100% 수령 실현 5단계 로드맵 */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem'
        }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#38bdf8', margin: '0 0 0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} color="#38bdf8" /> 신규 창업자 & 기존 기업 실제 지원금 100% 수령 5단계 로드맵
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>1단계 (사전검증)</div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700, marginTop: '0.1rem' }}>국세 체불 0원 & 권고사직 이력 체크</div>
            </div>
            <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>2단계 (서류세팅)</div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700, marginTop: '0.1rem' }}>209시간 근로계약서 & 급여 입금 내역</div>
            </div>
            <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800 }}>3단계 (사전신청)</div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700, marginTop: '0.1rem' }}>고용24 / 신보 1분 온라인 우선 등록</div>
            </div>
            <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 800 }}>4단계 (서류검수)</div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700, marginTop: '0.1rem' }}>AI 자동검증 서류 제출 (탈락율 0%)</div>
            </div>
            <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 800 }}>5단계 (지급승인)</div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700, marginTop: '0.1rem' }}>지원금 최종 승인 및 매월 통장 수령</div>
            </div>
          </div>
        </div>

        {/* 📝 지원금 무료 자격 심사 신청 폼 */}
        {applied ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#1e293b', borderRadius: '16px' }}>
            <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: '0.8rem' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem' }}>
              고용지원금 무료 매칭 신청이 등록되었습니다!
            </h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 1rem' }}>
              정책자금 전문 수석 매니저가 1시간 내로 (<strong>{phone}</strong>)로 매칭 가능 여부를 안내드립니다.
            </p>
            <button onClick={() => setApplied(false)} style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              추가 신청하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="#34d399" /> 우리 회사 2026 고용지원금 무료 매칭 사전 심사 신청
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>회사명 / 상호 *</label>
                <input
                  type="text"
                  placeholder="예: (주)노무체크"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.2rem' }}>대표자/담당자 연락처 *</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #34d399)', color: '#ffffff',
                fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                boxShadow: '0 4px 15px rgba(52, 211, 153, 0.4)'
              }}
            >
              <Send size={16} /> 2026 고용지원금 무료 매칭 사전 심사 요청하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
