import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Coins, Calendar, Clock, PiggyBank, FileText, HeartPulse, 
  ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Copy, Printer, X, Download, FileCheck
} from 'lucide-react';

const WORKER_DOC_TEMPLATES = [
  {
    id: 'contract',
    title: '📄 근로자용 표준 근로계약서 양식',
    desc: '2026 최저시급(10,320원) 및 근로기준법 제17조 필수 기재 항목이 반영된 정식 근로계약서 서식',
    content: `[표준 근로계약서 (근로자 보관용)]

1. 계약 당사자
 - 사업주(사용자): (회사/매장명 입력)
 - 근로자(피용자): (성명 입력)

2. 근로 개시일 및 장소
 - 근로개시일: 2026년 ___월 ___일부터
 - 근무 장소: _______________________________
 - 담당 업무: _______________________________

3. 근로시간 및 휴게시간
 - 주 소정근로시간: 주 ___시간 (평일 09:00 ~ 18:00, 휴게시간 1시간 포함)
 - 주휴일: 매주 일요일 (유급주휴일)

4. 임금 및 지급일
 - 시급/월급: 2026년 최저임금(10,320원) 이상 적용
 - 매월 ___일 근로자 명의 계좌 입금 (임금명세서 서면/전자 교부 필수)

5. 기타 조건
 - 본 계약서에 명시되지 않은 사항은 근로기준법 및 관련 노동관계 법령에 따릅니다.

작성일자: 2026년 ___월 ___일
근로자 서명: ________________ (인)`
  },
  {
    id: 'overdue_petition',
    title: '⚖️ 고용노동부 체불임금·주휴수당 진정서 서식',
    desc: '미지급 주휴수당, 연장수당, 최저임금 미달 차액을 노동청에 진정할 때 제출하는 표준 신청서',
    content: `[임금체불 및 주휴수당 미지급 진정서]

1. 진정인 (근로자)
 - 성명: ____________________
 - 연락처: ___________________
 - 주소: _____________________

2. 피진정인 (사업주/회사)
 - 회사/상호명: _______________
 - 대표자 성명: _______________
 - 사업장 소재지: _____________

3. 체불 내역 및 청구 금액
 - 재직 기간: 202X년 __월 __일 ~ 202X년 __월 __일
 - 미지급 항목: 주휴수당 / 연장근로수당 / 최저임금 미달 차액 / 미사용 연차수당
 - 체불 총 예상 금액: 약 ______________원

4. 진정 취지
 피진정인은 근로기준법 제36조(금품 정산) 및 제43조(임금 지급)를 위반하여 위 체불 임금을 지급하지 않고 있는바, 관할 지방고용노동청의 정밀 조사를 통해 체불 임금을 정산받고자 진정서를 접수합니다.

작성일: 2026년 ___월 ___일
진정인 서명: ________________ (인)`
  },
  {
    id: 'resignation',
    title: '✉️ 권리보호 정식 사직서 양식',
    desc: '자진퇴사이더라도 퇴사 사유(임금체불, 원거리 이사 등)를 명확히 기록하여 실업급여 인정에 유리한 사직서',
    content: `[사 직 서]

성 명: _________________
소 속: _________________
직 위: _________________
입사일자: 202X년 __월 __일
퇴사예정일: 2026년 __월 __일

사직 사유: (※ 실업급여 수급 필요 시 정당한 사유 명시)
[  ] 개인 사정
[  ] 계약기간 만료 및 권고사직
[  ] 2개월 이상 임금체불 발생에 따른 불가피한 퇴사
[  ] 사업장 이전으로 왕복 통근 3시간 이상 소요
[  ] 기타: __________________________________________________

상기 본인은 위 사유로 인하여 2026년 __월 __일자로 사직하고자 하오니 승인하여 주시기 바랍니다.

2026년 ___월 ___일
신청인: __________________ (인)
대표자 귀하`
  }
];

const TOOL_CATEGORIES = [
  {
    categoryName: '📄 AI 서류 & 권리 진단 리포트',
    items: [
      { to: '/worker/report', icon: <FileText size={24} color="#38bdf8" />, title: 'AI 권리 구제 리포트', desc: '임금체불, 부당해고, 휴게시간 미보장 등 겪고 있는 노무 이슈의 법적 구제 방향 진단' },
      { to: '/worker/injury', icon: <HeartPulse size={24} color="#f87171" />, title: '산재 승인 & 휴업급여 가이드', desc: '출퇴근 사고, 작업 중 부상 시 70% 휴업급여 및 진단서 AI OCR 분석' },
    ]
  },
  {
    categoryName: '💰 임금·월급 & 수당 정밀 계산',
    items: [
      { to: '/tools/salary', icon: <Coins size={24} color="#f59e0b" />, title: '209시간 월급 계산기', desc: '2026 최저시급(10,320원) 기준 실수령액 및 수당 분리 정밀 산출' },
      { to: '/tools/reverse-salary', icon: <Coins size={24} color="#38bdf8" />, title: '역산 월급 계산기', desc: '받는 세전 총 월급에서 시급, 기본급, 주휴수당 비중을 거꾸로 역산' },
      { to: '/tools/weekly-holiday', icon: <Calendar size={24} color="#38bdf8" />, title: '주휴수당 팩트 체크기', desc: '주 15시간 이상 근무 시 법정 유급 주휴수당 발생 여부 및 금액 계산' },
    ]
  },
  {
    categoryName: '🌴 연차휴가 & 퇴직금 정산',
    items: [
      { to: '/tools/annual-leave', icon: <Clock size={24} color="#a78bfa" />, title: '연차 개수 & 수당 계산기', desc: '입사일 기준 발생 연차 일수 및 미사용 연차수당 급여 정산액 산출' },
      { to: '/tools/severance', icon: <PiggyBank size={24} color="#34d399" />, title: '퇴직금 정밀 계산기', desc: '3개월 평균임금 및 육아휴직/병가 포함 법정 예상 퇴직금 미리보기' },
    ]
  }
];

function WorkerHub() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyDoc = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', paddingBottom: '5rem' }}>
      
      {/* 👑 근로자 전용 히어로 헤더 */}
      <div className="hub-header worker" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        padding: '2rem 2.2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="hub-header-icon" style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.25))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <User size={30} color="#38bdf8" />
        </div>
        <div>
          <div className="glow-badge" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} color="#38bdf8" /> 근로자 권리보호 0% 오차 SaaS 센터
          </div>
          <h1 className="hub-header-title" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            근로자를 위한 <span style={{ color: '#38bdf8' }}>통합 법률 서류 & 계산기 센터</span>
          </h1>
          <p className="hub-header-desc" style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            내 월급 수치가 적정한지, 주휴수당이나 산재·퇴직금이 미달되었는지 10초 만에 정밀 계산하고 필수 정식 법정 서식 양식을 발급받으세요.
          </p>
        </div>
      </div>

      {/* 📑 1클릭 근로자 표준 양식 발급 모듈 */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={22} color="#38bdf8" /> 1클릭 근로자 정식 법정 서식 양식 보기 & 복사
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>💡 원하는 서식을 클릭하여 내용 복사 및 수정이 가능합니다.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {WORKER_DOC_TEMPLATES.map((doc) => (
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
              <div style={{ marginTop: '1.1rem', color: '#38bdf8', fontSize: '0.84rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                서식 미리보기 & 복사하기 <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛠️ 카테고리별 근로자 계산기 & 리포트 매트릭스 */}
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
                <div className="feature-card-action">
                  계산/진단 바로가기 <ArrowRight size={16} />
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
            background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px', padding: '1.8rem', color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
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
                  background: copied ? '#16a34a' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
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

    </div>
  );
}

export default WorkerHub;

