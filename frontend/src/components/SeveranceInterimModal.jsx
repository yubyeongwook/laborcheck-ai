import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function SeveranceInterimModal({ isOpen, onClose, severanceData }) {
  if (!isOpen || !severanceData) return null;

  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  // 근로자퇴직급여보장법 시행령 제3조 법정 6대 중간정산 사유
  const [reasonType, setReasonType] = useState('housing');
  const [reasonDetail, setReasonDetail] = useState('');
  const [requestedAmount, setRequestedAmount] = useState(severanceData.severancePay || 0);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handlePrint = () => {
    window.print();
  };

  const getReasonDocGuide = (type) => {
    switch (type) {
      case 'housing':
        return '무주택자 주택구입: 무주택자 등본, 건물 등기사항전부증명서, 매매계약서 사본 등';
      case 'lease':
        return '무주택자 전세금/보증금: 무주택자 등본, 임대차계약서 사본, 보증금 입금 영수증 등';
      case 'care':
        return '6개월 이상 요양: 진단서, 가족관계증명서(본인/부양가족 요양 시), 요양비 지출 영수증 등';
      case 'bankruptcy':
        return '5년 이내 파산/개인회생: 법원 파산선고문, 개인회생 인가 결정문 등';
      case 'time_reduction':
        return '근로시간 단축/임금피크제: 변경된 근로계약서, 임금피크제 적용 확인서 등';
      default:
        return '관련 규정 증빙 서류 제출';
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: '800px',
        background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1',
        borderRadius: '16px', padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        maxHeight: '90vh', overflowY: 'auto'
      }} className="print-modal-content">

        {/* 화면용 컨트롤러 (인쇄 시 숨김) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              📝 퇴직금 중간정산 신청서 (근로자퇴직급여보장법 법정 서식)
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#0284c7', color: '#fff',
                border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <Printer size={16} /> 인쇄 / PDF 저장
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.45rem 0.6rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b',
                border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 📝 실제 인쇄되는 퇴직금 중간정산 신청서 서식 */}
        <div style={{ padding: '0.5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.2em', marginBottom: '1.5rem', borderBottom: '3px double #0f172a', paddingBottom: '0.5rem' }}>
            퇴 직 금 中 간 정 산 신 청 서
          </h2>

          {/* 신청인 기본정보 테이블 */}
          <h4 style={{ margin: '1rem 0 0.4rem 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
            1. 신청 근로자 인적사항
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, width: '18%', textAlign: 'center' }}>성 명</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    placeholder="근로자 성명 입력"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, width: '18%', textAlign: 'center' }}>주민등록번호</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    placeholder="000000-0000000"
                    value={workerId}
                    onChange={(e) => setWorkerId(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', outline: 'none' }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>소속 / 부서</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    placeholder="부서명 입력"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', outline: 'none' }}
                  />
                </td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>직 위</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    placeholder="직급/직위 입력"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', outline: 'none' }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>입 사 일</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem' }}>{severanceData.hireDateStr || '미지정'}</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>중간정산기준일</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem' }}>{severanceData.resignDateStr || todayStr}</td>
              </tr>
            </tbody>
          </table>

          {/* 중간정산 신청 사유 선택 */}
          <h4 style={{ margin: '1.2rem 0 0.4rem 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
            2. 법정 중간정산 신청 사유 (근로자퇴직급여보장법 시행령 제3조)
          </h4>
          <div style={{ border: '1px solid #334155', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
            {[
              { id: 'housing', label: '1. 무주택자인 근로자가 본인 명의로 주택을 구입하는 경우' },
              { id: 'lease', label: '2. 무주택자인 근로자가 주거목적 임차보증금(전세금)을 부담하는 경우' },
              { id: 'care', label: '3. 근로자 본인, 배우자 또는 부양가족이 6개월 이상 요양을 필요로 하는 경우' },
              { id: 'bankruptcy', label: '4. 신청일 기준 최근 5년 이내 근로자가 파산선고 또는 개인회생절차 개시를 받은 경우' },
              { id: 'time_reduction', label: '5. 근로시간 단축/임금피크제 시행 등 법령에 따른 근로시간 조정' }
            ].map(item => (
              <label key={item.id} style={{ display: 'block', fontSize: '0.84rem', margin: '0.35rem 0', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="interimReason"
                  checked={reasonType === item.id}
                  onChange={() => setReasonType(item.id)}
                  style={{ marginRight: '0.4rem' }}
                />
                <span style={{ fontWeight: reasonType === item.id ? 800 : 400, color: reasonType === item.id ? '#0284c7' : '#1e293b' }}>
                  {item.label}
                </span>
              </label>
            ))}

            <div style={{ marginTop: '0.6rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                📌 상세 사유 설명:
              </label>
              <input
                type="text"
                placeholder="구체적인 사유 및 용도를 입력하세요 (예: 00시 00동 무주택 아파트 매수)"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* 중간정산 신청 금액 명세 */}
          <h4 style={{ margin: '1.2rem 0 0.4rem 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
            3. 중간정산 신청 금액
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, width: '30%' }}>산출 퇴직금액 (세전)</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', fontWeight: 900, color: '#0284c7' }}>
                  {severanceData.severancePay.toLocaleString()} 원
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800 }}>중간정산 신청 희망액</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                    style={{ width: '60%', padding: '0.3rem', border: '1px solid #0284c7', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 900, color: '#0284c7' }}
                  /> 원
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800 }}>첨부 증빙 서류 안내</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                  {getReasonDocGuide(reasonType)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 신청 확약 문구 */}
          <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '2rem' }}>
            본인은 관련 법령(근로자퇴직급여보장법 제8조 제2항 및 동법 시행령 제3조)에 따라 위와 같은 사유로 퇴직금 중간정산을 정식 신청하며, 제출한 사유 증빙 서류에 허위가 없음을 확인합니다.
          </div>

          {/* 서명 및 제출 연월일 */}
          <div style={{ textAlign: 'center', margin: '2rem 0 1rem 0' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>
              {todayStr.slice(0, 4)}년 {todayStr.slice(5, 7)}월 {todayStr.slice(8, 10)}일
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>신청인 (근로자):</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, marginLeft: '0.5rem', borderBottom: '1px solid #0f172a', paddingBottom: '0.2rem', paddingLeft: '1rem', paddingRight: '2rem' }}>
                  {workerName || '(서명 또는 인)'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>수령·접수자 (사업주/담당자):</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, marginLeft: '0.5rem', borderBottom: '1px solid #0f172a', paddingBottom: '0.2rem', paddingLeft: '1rem', paddingRight: '2rem' }}>
                  (서명 또는 인)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
