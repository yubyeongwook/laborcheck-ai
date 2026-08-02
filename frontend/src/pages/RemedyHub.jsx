import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, User, Briefcase, Calculator, ShieldCheck, AlertTriangle, 
  ArrowRight, Copy, X, FileCheck, CheckCircle2, Sparkles, FileText 
} from 'lucide-react';

const REMEDY_DOC_TEMPLATES = [
  {
    id: 'notice_allowance_petition',
    title: '📜 30일분 해고예고수당 정식 청구서 (5인 미만/이상 공통)',
    desc: '30일 전 미리 서면 통지 없이 구두나 문자로 즉시 해고당했을 때 30일분 통상임금을 청구하는 서식',
    content: `[해 고 예 고 수 당  청 구 서]

1. 청구인 (근로자)
 - 성명: ____________________
 - 연락처: ___________________
 - 주소: _____________________

2. 피청구인 (사업주/회사)
 - 회사/상호명: _______________
 - 대표자 성명: _______________
 - 사업장 소재지: _____________

3. 해고 경위 및 체불 해고예고수당 금액
 - 입사일자: 202X년 __월 __일
 - 당일 해고 통보일자: 2026년 __월 __일 (※ 30일 전 예고 미이행)
 - 월 통상임금: 약 ______________원
 ▶ 청구 해고예고수당 금액: 30일분 통상임금 __________________원

4. 청구 취지
 피청구인은 근로기준법 제26조(해고의 예고) 규정을 위반하여 30일 전에 해고를 예고하지 아니하고 당일 구두/문자로 해고를 통보하였는바, 법정 30일분 이상의 통상임금(해고예고수당)을 즉시 지급하여 주시기 바랍니다.

작성일자: 2026년 ___월 ___일
청구인 서명: ________________ (인)`
  },
  {
    id: 'labour_committee_remedy',
    title: '⚖️ 지방노동위원회 부당해고 구제신청서 서식 (5인 이상 전용)',
    desc: '정당한 이유 없이 부당해고당한 경우 노동위원회에 제출하는 정식 구제신청서 (해고 3개월 이내 접수)',
    content: `[부 당 해 고  구 제 신 청 서]

1. 신청인 (근로자)
 - 성명: ____________________
 - 연락처: ___________________
 - 주소: _____________________

2. 피신청인 (사용자)
 - 상호/사업장명: ____________
 - 대표자: ___________________
 - 상시 근로자 수: 5인 이상 [  ]

3. 신청 취지
 "피신청인이 2026년 __월 __일 신청인에 대하여 행한 해고는 부당해고임을 인정한다. 피신청인은 신청인을 원직에 복직시키고, 해고 기간 동안 정상적으로 근무하였으면 받을 수 있었던 임금 상당액을 지급하라."

4. 신청 이유 (구체적 부당해고 경위)
 - 사용자는 근로기준법 제23조 제1항의 정당한 이유 없이 서면 통지(제27조) 의무를 위반하여 부당하게 해고 처분함.

작성일: 2026년 ___월 ___일
신청인 서명: ________________ (인)
지방노동위원회 위원장 귀하`
  }
];

function RemedyHub() {
  const [monthlyOrdinaryPay, setMonthlyOrdinaryPay] = useState(2500000);
  const [is5Over, setIs5Over] = useState(true);
  const [noticeDaysBefore, setNoticeDaysBefore] = useState(0); // 당일 해고: 0일전 알림
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  // 1일 통상임금 (월 209시간 기준 통상시급 = 월통상임금 / 209)
  const hourlyOrdinary = Math.round(monthlyOrdinaryPay / 209);
  const dailyOrdinary = hourlyOrdinary * 8;
  
  // 30일분 해고예고수당 (30일 × 1일 통상임금)
  const noticePay = dailyOrdinary * 30;

  // 30일 전 예고 미달 여부
  const isViolatedNotice = noticeDaysBefore < 30;

  const handleCopyDoc = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container page-container-narrow" style={{ maxWidth: '1050px', paddingBottom: '5rem' }}>
      
      {/* 👑 헤더 Banner */}
      <div className="hub-header" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(165, 180, 252, 0.35)',
        borderRadius: '24px',
        padding: '2rem 2.2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="hub-header-icon" style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(165, 180, 252, 0.25), rgba(129, 140, 248, 0.25))',
          border: '1px solid rgba(165, 180, 252, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Scale size={30} color="#a5b4fc" />
        </div>
        <div>
          <div className="glow-badge" style={{ marginBottom: '0.5rem', borderColor: '#a5b4fc', color: '#a5b4fc', background: 'rgba(165, 180, 252, 0.12)' }}>
            <ShieldCheck size={14} color="#a5b4fc" /> 근로기준법 제26조 & 제28조 정밀 판정
          </div>
          <h1 className="hub-header-title" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            부당해고 구제신청 & <span style={{ color: '#a5b4fc' }}>30일 해고예고수당 계산기</span>
          </h1>
          <p className="hub-header-desc" style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            5인 미만/이상 사업장 판정 기준부터 30일분 통상임금 해고예고수당 0% 오차 정밀 산출 및 노동위원회 신청서를 발급받으세요.
          </p>
        </div>
      </div>

      {/* 🧮 30일 해고예고수당 정밀 계산기 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(165, 180, 252, 0.35)',
        borderRadius: '20px', padding: '1.8rem', marginBottom: '2.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={22} color="#a5b4fc" /> 0% 오차 30일분 해고예고수당 정밀 산출
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
              월 통상임금 (기본급 + 식대 등)
            </label>
            <input 
              type="number"
              step="10000"
              value={monthlyOrdinaryPay}
              onChange={(e) => setMonthlyOrdinaryPay(Number(e.target.value))}
              style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 800, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
              사업장 상시 근로자 수
            </label>
            <select
              value={is5Over ? 'over' : 'under'}
              onChange={(e) => setIs5Over(e.target.value === 'over')}
              style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 800, boxSizing: 'border-box' }}
            >
              <option value="over">상시 5인 이상 사업장 (부당해고 구제 가능)</option>
              <option value="under">상시 5인 미만 사업장 (해고예고수당 100% 가능)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
              해고 사전 예고 기간 (일 전 통보)
            </label>
            <input 
              type="number"
              value={noticeDaysBefore}
              onChange={(e) => setNoticeDaysBefore(Number(e.target.value))}
              placeholder="0 (당일 해고 시 0 입력)"
              style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 800, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* 정밀 산출 요약 */}
        <div style={{ background: '#0f172a', padding: '1.3rem', borderRadius: '14px', border: '1px solid rgba(165, 180, 252, 0.4)', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#94a3b8' }}>1일 통상임금 (209시간 산식):</span>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>{dailyOrdinary.toLocaleString()} 원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#94a3b8' }}>해고 예고 위반 여부 ({noticeDaysBefore}일전 알림):</span>
            <span style={{ color: isViolatedNotice ? '#f87171' : '#34d399', fontWeight: 800 }}>
              {isViolatedNotice ? `⚠️ 30일 미달 (${30 - noticeDaysBefore}일 부족 - 30일분 수당 발생!)` : '✅ 30일 이상 정상 예고'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem', marginTop: '0.6rem' }}>
            <span style={{ color: '#f8fafc', fontWeight: 900, fontSize: '1rem' }}>청구 가능 30일분 해고예고수당:</span>
            <span style={{ color: '#a5b4fc', fontWeight: 900, fontSize: '1.35rem' }}>{noticePay.toLocaleString()} 원</span>
          </div>
        </div>

        {/* 사업장 규모별 팁 */}
        <div style={{ marginTop: '1.2rem', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '12px' }}>
          {is5Over ? (
            <div>
              💡 <strong>상시 5인 이상 사업장</strong>: 부당해고 당한 날로부터 <strong>3개월 이내</strong> 관할 지방노동위원회에 구제신청 시 <strong>원직복직</strong> 또는 해고기간 <strong>임금 상당액 금전보상</strong> 명령을 받으실 수 있습니다.
            </div>
          ) : (
            <div>
              💡 <strong>상시 5인 미만 사업장</strong>: 노동위원회 부당해고 구제신청은 불가하지만, <strong>근로기준법 제26조 30일 해고예고수당</strong>은 100% 강행 적용되므로 노동청 진정을 통해 30일분 통상임금을 전액 청구하실 수 있습니다.
            </div>
          )}
        </div>
      </div>

      {/* 📜 1클릭 부당해고 & 해고예고수당 정식 서식 모달 발급 */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={22} color="#a5b4fc" /> 1클릭 부당해고 & 해고예고수당 정식 서식 발급
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>💡 원하는 서식을 클릭하여 내용 복사 및 편집이 가능합니다.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {REMEDY_DOC_TEMPLATES.map((doc) => (
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
              <div style={{ marginTop: '1.1rem', color: '#a5b4fc', fontSize: '0.84rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                서식 미리보기 & 복사하기 <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📄 양식 미리보기 & 복사 팝업 모달 */}
      {selectedDoc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '680px', maxHeight: '88vh',
            background: '#0f172a', border: '1px solid rgba(165, 180, 252, 0.4)',
            borderRadius: '20px', padding: '1.8rem', color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a5b4fc', margin: 0 }}>
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
                  background: copied ? '#16a34a' : 'linear-gradient(135deg, #6366f1, #a5b4fc)',
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

export default RemedyHub;

