import React, { useState } from 'react';
import { X, Printer, CheckCircle, PiggyBank } from 'lucide-react';

export default function SeveranceReceiptModal({ isOpen, onClose, severanceData }) {
  if (!isOpen || !severanceData) return null;

  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [companyName, setCompanyName] = useState('(주) 사업장명');
  const [paymentMethod, setPaymentMethod] = useState('IRP 계좌 이체');
  const [bankAccount, setBankAccount] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const handlePrint = () => {
    window.print();
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
        
        {/* 화면용 상단 컨트롤러 (인쇄 시 숨김) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PiggyBank size={24} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              📄 퇴직금 수령확인서 (법정 표준 서식)
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#059669', color: '#fff',
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

        {/* 📄 실제 인쇄되는 퇴직금 수령확인서 양식 */}
        <div style={{ padding: '0.5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.3em', marginBottom: '1.5rem', borderBottom: '3px double #0f172a', paddingBottom: '0.5rem' }}>
            퇴 직 금 수 령 확 인 서
          </h2>

          {/* 수령인 및 사업장 기본 정보 테이블 */}
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
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>사업장명</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>퇴직연금 유형</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', fontWeight: 800, color: '#0369a1' }}>
                  {severanceData.pensionType === 'dc' ? 'DC형 (확정기여형)' : 'DB형 (확정급여형 / 일반퇴직금)'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>입 사 일</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem' }}>{severanceData.hireDateStr || '미지정'}</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>퇴 사 일</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem' }}>{severanceData.resignDateStr || todayStr}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, textAlign: 'center' }}>총 재직일수</td>
                <td colSpan="3" style={{ border: '1px solid #334155', padding: '0.5rem', fontWeight: 700 }}>
                  {severanceData.totalDays} 일 (약 {severanceData.tenureYears}년)
                </td>
              </tr>
            </tbody>
          </table>

          {/* 💰 퇴직금 산출 및 세금 공제 명세 테이블 */}
          <h4 style={{ margin: '1.2rem 0 0.4rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
            1. 퇴직금 산출 및 세금 원천징수 명세
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f1f5f9', fontWeight: 800, width: '35%' }}>① 세전 총 퇴직금액</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', textAlign: 'right', fontWeight: 900, color: '#0284c7', fontSize: '1rem' }}>
                  {severanceData.severancePay.toLocaleString()} 원
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f1f5f9', fontWeight: 800 }}>② 근속연수 공제액 (소득세법)</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', textAlign: 'right', color: '#64748b' }}>
                  -{severanceData.taxInfo.tenureDeduction.toLocaleString()} 원
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f1f5f9', fontWeight: 800 }}>③ 법정 퇴직소득세</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                  -{severanceData.taxInfo.incomeTax.toLocaleString()} 원
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f1f5f9', fontWeight: 800 }}>④ 지방소득세 (퇴직소득세의 10%)</td>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                  -{severanceData.taxInfo.localTax.toLocaleString()} 원
                </td>
              </tr>
              <tr style={{ background: '#ecfdf5' }}>
                <td style={{ border: '2px solid #059669', padding: '0.65rem', fontWeight: 900, color: '#065f46', fontSize: '0.95rem' }}>⑤ 최종 세후 실수령액</td>
                <td style={{ border: '2px solid #059669', padding: '0.65rem', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '1.25rem' }}>
                  {severanceData.taxInfo.netSeverancePay.toLocaleString()} 원
                </td>
              </tr>
            </tbody>
          </table>

          {/* 💳 지급 방법 및 계좌 */}
          <h4 style={{ margin: '1.2rem 0 0.4rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
            2. 지급 방법 및 계좌 정보
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800, width: '25%' }}>지급 방법</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', outline: 'none' }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '0.5rem', background: '#f8fafc', fontWeight: 800 }}>입금 계좌 / IRP 계좌</td>
                <td style={{ border: '1px solid #334155', padding: '0.4rem 0.5rem' }}>
                  <input
                    type="text"
                    placeholder="은행명 및 계좌번호 입력 (예: 국민은행 123456-04-123456)"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem', outline: 'none' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* 수령 확인 확약 문구 */}
          <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '2rem' }}>
            본인은 위 사업장에서 근무하고 퇴직함에 있어, 상기 계산 명세와 같이 세후 실수령액 <strong>금 {severanceData.taxInfo.netSeverancePay.toLocaleString()}원</strong>을 정히 수령(또는 지정 IRP 계좌로 입금 수령)하였음을 확인하며, 향후 본 퇴직금에 대하여 어떠한 민·형사상 이의를 제기하지 아니할 것을 확약하고 본 확인서를 제출합니다.
          </div>

          {/* 서명 및 제출 연월일 */}
          <div style={{ textAlign: 'center', margin: '2rem 0 1rem 0' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>
              {todayStr.slice(0, 4)}년 {todayStr.slice(5, 7)}월 {todayStr.slice(8, 10)}일
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>위 수령인 (근로자):</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, marginLeft: '0.5rem', borderBottom: '1px solid #0f172a', paddingBottom: '0.2rem', paddingLeft: '1rem', paddingRight: '2rem' }}>
                  {workerName || '(서명 또는 인)'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>지급자 (사업주/대표자):</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, marginLeft: '0.5rem', borderBottom: '1px solid #0f172a', paddingBottom: '0.2rem', paddingLeft: '1rem', paddingRight: '2rem' }}>
                  (직인 또는 서명)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
