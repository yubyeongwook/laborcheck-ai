import React from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * 근로기준법 제48조 규격 정식 법정 급여명세서 컴포넌트
 */
export default function PayslipModal({ data, onClose }) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    employeeName = '홍길동',
    payPeriod = '2026년 07월 (2026.07.01 ~ 2026.07.31)',
    payDate = '2026년 08월 05일',
    companyName = '(주)노무체크',
    hourlyRate = 12000,
    baseHours = 209,
    baseSalary = 2508000,
    overtimeHours = 123.55,
    overtimeAllowance = 2223900,
    holidayHours = 21.25,
    holidayAllowance = 382500,
    annualLeaveHours = 7.33,
    annualLeaveAllowance = 131940,
    mealAllowanceTaxExempt = 200000,
    drivingAllowanceTaxExempt = 200000,
    totalGrossSalary = 5446340,
    
    // 4대보험 및 세금 공제액
    nationalPension = 227080,
    healthInsurance = 179120,
    longtermCare = 23190,
    employmentInsurance = 45410,
    incomeTax = 285400,
    localIncomeTax = 28540,
    totalDeduction = 788740,
    netPay = 4657600
  } = data;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
        background: '#ffffff', color: '#0f172a', borderRadius: '16px',
        padding: '2.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        {/* 닫기 및 인쇄 버튼 (인쇄 시 숨김) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 700 }}>
            <ShieldCheck size={22} /> 근로기준법 제48조 규격 정식 급여명세서
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px',
                padding: '0.6rem 1.2rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <Printer size={18} /> 인쇄 / PDF 저장
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px',
                padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 📄 정식 임금명세서 문서 서식 영역 */}
        <div id="print-area">
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem 0', letterSpacing: '4px' }}>
              임 금 명 세 서
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              지급대상기간: {payPeriod} | 급여지급일: {payDate}
            </p>
          </div>

          {/* 근로자 및 사업장 정보 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#f8fafc', fontWeight: 700, width: '15%' }}>성 명</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', width: '35%' }}>{employeeName}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#f8fafc', fontWeight: 700, width: '15%' }}>사업장명</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', width: '35%' }}>{companyName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#f8fafc', fontWeight: 700 }}>통상 시급</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem' }}>{hourlyRate.toLocaleString()} 원</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', background: '#f8fafc', fontWeight: 700 }}>기본 산정시간</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem' }}>{baseHours} 시간 (주 40시간 기준)</td>
              </tr>
            </tbody>
          </table>

          {/* 지급 및 공제 내역 표 (2열 비교) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* 지급 내역 */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', background: '#e0f2fe', color: '#0369a1', padding: '0.5rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
                지 급 내 역 (세전)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>지급 항목</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>산출시간</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>금액 (원)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>기본급</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{baseHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{baseSalary.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>연장근로수당 (1.5배)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{overtimeHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{overtimeAllowance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>휴일근로수당 (중복가산)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{holidayHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{holidayAllowance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>연차휴가수당</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{annualLeaveHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{annualLeaveAllowance.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', color: '#16a34a' }}>🍚 식대 (비과세)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>-</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', color: '#16a34a' }}>{mealAllowanceTaxExempt.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', color: '#16a34a' }}>🚗 자가운전 (비과세)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>-</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', color: '#16a34a' }}>{drivingAllowanceTaxExempt.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#e0f2fe', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.6rem' }}>지급액 계</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', textAlign: 'right', color: '#0369a1' }}>{totalGrossSalary.toLocaleString()} 원</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 공제 내역 */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', background: '#fee2e2', color: '#b91c1c', padding: '0.5rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
                공 제 내 역 (4대보험 & 세금)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>공제 항목</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>요율/기준</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>금액 (원)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>국민연금</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>4.5%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{nationalPension.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>건강보험</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>3.545%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{healthInsurance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>장기요양보험</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>12.95%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{longtermCare.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>고용보험</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>0.9%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{employmentInsurance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>근로소득세</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>간이세액표</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{incomeTax.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>지방소득세</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>10%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{localIncomeTax.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#fee2e2', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.6rem' }}>공제액 계</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', textAlign: 'right', color: '#b91c1c' }}>{totalDeduction.toLocaleString()} 원</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 최종 실 수령액 배너 */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#ffffff',
            padding: '1.25rem 1.5rem', borderRadius: '12px', textAlign: 'center',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>💰 실 수령액 (차인지급액)</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8' }}>
              {netPay.toLocaleString()} 원
            </span>
          </div>

          {/* 근로기준법 제48조 계산식 명시 푸터 */}
          <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 0.3rem 0', fontWeight: 700, color: '#334155' }}>
              ⚖️ [근로기준법 제48조 계산방법 명시]
            </p>
            • 연장근로수당 = 통상시급({hourlyRate.toLocaleString()}원) × 연장근로시간({overtimeHours}h) × 1.5배<br/>
            • 휴일근로수당 = 통상시급({hourlyRate.toLocaleString()}원) × 휴일근로시간({holidayHours}h) × 가산율(8h이하 1.5배, 8h초과 2.0배)<br/>
            • 본 명세서는 근로기준법 제48조 제2항에 따라 발행된 정식 전자 임금명세서입니다.
          </div>
        </div>

      </div>
    </div>
  );
}
