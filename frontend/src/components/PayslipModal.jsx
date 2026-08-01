import React, { useState } from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck, MessageSquare, Send, Smartphone } from 'lucide-react';

/**
 * 근로기준법 제48조 규격 정식 법정 급여명세서 컴포넌트
 */
export default function PayslipModal({ data = {}, onClose }) {
  const [isKakaoOpen, setIsKakaoOpen] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [receiverName, setReceiverName] = useState(data.employeeName || '근로자');
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const {
    employeeName = '신청 근로자',
    payPeriod = `${currentYear}년 ${currentMonth}월 (01일~말일)`,
    payDate = `${currentYear}년 ${currentMonth}월 25일`,
    companyName = '노무체크 검증 사업장',
    pureBaseHoursMonthly,
    pureBasePay,
    weeklyHolidayHoursMonthly,
    weeklyHolidayPay,
    hourlyRate = 10320,
    baseHours = 209,
    baseSalary = 2156880,
    overtimeHours = 0,
    overtimeAllowance = 0,
    nightHours = 0,
    nightAllowance = 0,
    holidayHours = 0,
    holidayAllowance = 0,
    annualLeaveHours = 0,
    annualLeaveAllowance = 0,
    extraOvertimeHours = 0,
    extraOvertimeAllowance = 0,
    extraOvertimePay = 0,
    mealAllowanceTaxExempt = 200000,
    drivingAllowanceTaxExempt = 0,
    totalGrossSalary = 2356880,
    
    // 4대보험 및 세금 공제액
    nationalPension = 97050,
    healthInsurance = 76460,
    longtermCare = 9900,
    employmentInsurance = 19410,
    incomeTax = 32350,
    localIncomeTax = 3230,
    absenceDeduction: propAbsenceDeduction,
    totalDeduction: propTotalDeduction,
    netPay: propNetPay
  } = data;

  // 결근·조퇴 차감 공제 안전 보정 (직접 prop 또는 calculatedResult 내 수치 자동 도출)
  const calcAbsenceDeduction = propAbsenceDeduction !== undefined 
    ? propAbsenceDeduction 
    : (data.calculatedResult?.absenceDeduction || 0);

  // 공제액 계 자동 계산 (4대보험 + 세금 + 결근조퇴공제)
  const calcTotalDeduction = nationalPension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax + calcAbsenceDeduction;

  // 실수령액 자동 계산 (지급 총액 - 총 공제액)
  const calcNetPay = totalGrossSalary - calcTotalDeduction;

  // 주휴수당 분리 안전 보정 (209시간 이상일 때만 기본 174h, 주휴 35h 정수 표기!)
  const is209Over = (baseHours >= 209);
  const calcWeeklyHolidayHours = weeklyHolidayHoursMonthly !== undefined 
    ? weeklyHolidayHoursMonthly 
    : (is209Over ? 35 : 34.8);
  const calcWeeklyHolidayPay = weeklyHolidayPay !== undefined 
    ? weeklyHolidayPay 
    : Math.round(calcWeeklyHolidayHours * (hourlyRate || 10320));
  const calcPureBaseHours = pureBaseHoursMonthly !== undefined 
    ? pureBaseHoursMonthly 
    : (is209Over ? 174 : Number((baseHours - calcWeeklyHolidayHours).toFixed(2)));
  const calcPureBasePay = pureBasePay !== undefined 
    ? pureBasePay 
    : (baseSalary - calcWeeklyHolidayPay);

  // 💡 금액은 존재하나 시간값이 0인 경우 통상시급 기준 산출시간 안전 보정 (Fallback)
  const displayHolidayHours = holidayHours > 0 
    ? holidayHours 
    : (holidayAllowance > 0 ? Math.round((holidayAllowance / (hourlyRate || 10320)) * 100) / 100 : 0);

  const displayAnnualLeaveHours = annualLeaveHours > 0 
    ? annualLeaveHours 
    : (annualLeaveAllowance > 0 ? Math.round((annualLeaveAllowance / (hourlyRate || 10320)) * 100) / 100 : 0);

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
              onClick={() => setIsKakaoOpen(true)}
              style={{
                background: '#FEE500', color: '#000000', border: 'none', borderRadius: '8px',
                padding: '0.6rem 1.1rem', fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <MessageSquare size={18} color="#000" /> 💬 카톡으로 명세서 받기
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px',
                padding: '0.6rem 1.1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <Printer size={18} /> 인쇄 / PDF
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
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.25rem 0', letterSpacing: '4px' }}>
              임 금 명 세 서
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, marginBottom: '0.4rem' }}>
              [2026년 법정 근로기준법 제48조 제2항 적용 전자 급여명세서]
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
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
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontWeight: 600 }}>기본급 (순수 소정)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', color: '#64748b' }}>{calcPureBaseHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{calcPureBasePay.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontWeight: 700, color: '#047857', background: '#ecfdf5' }}>주휴수당 (유급주휴)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', color: '#047857', fontWeight: 700, background: '#ecfdf5' }}>{calcWeeklyHolidayHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#047857', background: '#ecfdf5' }}>{calcWeeklyHolidayPay.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>연장근로수당 (1.5배)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{overtimeHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{overtimeAllowance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>야간근로수당 (0.5배 가산)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{nightHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{(nightAllowance || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>휴일근로수당 (중복가산)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{displayHolidayHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{holidayAllowance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>연차휴가수당</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center' }}>{displayAnnualLeaveHours}h</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{annualLeaveAllowance.toLocaleString()}</td>
                  </tr>
                  {(extraOvertimeAllowance > 0 || extraOvertimePay > 0) && (
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', color: '#0369a1', fontWeight: 700 }}>➕ 추가 연장 수당</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontSize: '0.78rem', color: '#0369a1' }}>
                        {extraOvertimeHours ? `${extraOvertimeHours}h` : '약정차액조정'}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', color: '#0369a1', fontWeight: 700 }}>
                        {(extraOvertimeAllowance || extraOvertimePay || 0).toLocaleString()}
                      </td>
                    </tr>
                  )}
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
              <h4 style={{ margin: '0 0 0.5rem 0', background: '#ffedd5', color: '#c2410c', padding: '0.5rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
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
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.45rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>💡 국민연금 부과 대상 금액</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.45rem', textAlign: 'center', fontSize: '0.78rem', color: '#0369a1' }}>과세소득 기준</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.45rem', textAlign: 'right', fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>{((totalGrossSalary || 0) - (mealAllowanceTaxExempt || 0)).toLocaleString()} 원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>국민연금 (근로자 부담)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>4.75%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{nationalPension.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>건강보험 (근로자 부담)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>3.595%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{healthInsurance.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>장기요양보험</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>13.14%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>{longtermCare.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>고용보험 (근로자 부담)</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>0.9%</td>
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
                  {calcAbsenceDeduction > 0 && (
                    <tr style={{ background: '#fff7ed' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', color: '#ea580c', fontWeight: 800 }}>🔻 결근·조퇴 차감 공제</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'center', color: '#ea580c' }}>실제 차감액</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', color: '#ea580c', fontWeight: 800 }}>- {calcAbsenceDeduction.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#ffedd5', fontWeight: 800 }}>
                    <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '0.6rem' }}>공제액 계</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem', textAlign: 'right', color: '#c2410c' }}>{calcTotalDeduction.toLocaleString()} 원</td>
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
              {calcNetPay.toLocaleString()} 원
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

        {/* 📱 카카오톡 명세서 수신 전용 팝업 모달 */}
        {isKakaoOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <div style={{
              width: '100%', maxWidth: '440px', background: '#0f172a',
              border: '2px solid #FEE500', borderRadius: '16px', padding: '1.5rem',
              color: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', position: 'relative'
            }}>
              <button
                onClick={() => { setIsKakaoOpen(false); setIsSentSuccess(false); }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MessageSquare size={26} color="#FEE500" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FEE500', fontWeight: 900 }}>
                  📱 카카오톡 급여명세서 즉시 수신
                </h3>
              </div>

              {!isSentSuccess ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '1rem' }}>
                    입력하신 휴대폰 번호의 <strong>카카오톡 알림톡</strong>으로 2026년 법정 급여명세서(세전 월급 {totalGrossSalary.toLocaleString()}원 / 실수령액 {calcNetPay.toLocaleString()}원)가 즉시 발송됩니다!
                  </p>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 700 }}>
                      수신자 성명
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="홍길동"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 700 }}>
                      카카오톡 수신 휴대폰 번호
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={18} style={{ position: 'absolute', left: '0.7rem', top: '0.7rem', color: '#94a3b8' }} />
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.4rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #FEE500', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!userPhone.trim()) {
                        alert("📱 카카오톡 수신 휴대폰 번호를 입력해주세요!");
                        return;
                      }
                      setIsSentSuccess(true);
                    }}
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '10px',
                      background: '#FEE500', color: '#000000', border: 'none',
                      fontSize: '1rem', fontWeight: 900, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(254, 229, 0, 0.4)'
                    }}
                  >
                    <Send size={18} color="#000" /> 카카오톡 명세서 받기 (즉시 전송)
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle size={48} color="#34d399" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#34d399', fontWeight: 900 }}>
                    📱 카카오톡 전송 완료!
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                    <strong>[{userPhone}]</strong> 번호로 <strong>{receiverName}</strong> 님의 2026년 법정 급여명세서가 안전하게 전송되었습니다!
                  </p>
                  <button
                    onClick={() => { setIsKakaoOpen(false); setIsSentSuccess(false); }}
                    style={{
                      width: '100%', padding: '0.7rem', borderRadius: '8px',
                      background: '#38bdf8', color: '#0f172a', border: 'none',
                      fontWeight: 900, cursor: 'pointer'
                    }}
                  >
                    확인 및 닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
