import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { calculateEmployerInsurance, getDeductionRatesForYear } from '../utils/laborCalc.js';

function InsuranceCalculator() {
  const [year, setYear] = useState('2026');
  const [monthlyWage, setMonthlyWage] = useState('2500000');
  const [industrialAccidentRate, setIndustrialAccidentRate] = useState('0.7');

  const result = calculateEmployerInsurance({ monthlyWage, industrialAccidentRate, year });
  const rates = getDeductionRatesForYear(year);

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Wallet size={26} color="#fbbf24" /> 4대보험 사업주 부담금 계산기</h1>
        <p className="tool-page-desc">
          직원 1인당 월 급여를 기준으로 국민연금·건강보험·장기요양보험·고용보험·산재보험의 사업주 부담액을 개략적으로 계산합니다.
          산재보험료율은 업종에 따라 크게 달라지므로 직접 입력해 주세요.
        </p>
      </div>

      <div className="tool-grid">
        <section className="glass-panel">
          <div className="form-group">
            <label className="form-label">기준 연도</label>
            <select className="text-input" value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
              {Array.from({ length: 10 }, (_, i) => {
                const y = String(2026 - i);
                return <option key={y} value={y}>{y}년</option>;
              })}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">월 급여 (원)</label>
            <input type="number" className="text-input" value={monthlyWage} onChange={(e) => setMonthlyWage(e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">산재보험료율 (%)</label>
            <input type="number" className="text-input" step="0.1" value={industrialAccidentRate} onChange={(e) => setIndustrialAccidentRate(e.target.value)} min="0" />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              업종별 산재보험료율 예시 — 사무직 0.6~0.7%, 제조업 1~3%, 건설업 3~5% 이상. 정확한 요율은 근로복지공단에서 매년 고시하는 업종별 요율을 확인하세요.
            </p>
          </div>
          <div className="info-callout info" style={{ marginTop: '0.5rem' }}>
            국민연금·건강보험료는 근로자와 동일하게 사업주가 절반씩 부담하며, 고용보험·산재보험은 사업주가 추가로 더 부담합니다.
          </div>
        </section>

        <section className="glass-panel">
          <div className="result-highlight">
            <div className="result-highlight-label">직원 1인당 월 사업주 부담 총액</div>
            <div className="result-highlight-value">{result.totalEmployerBurden.toLocaleString()}원</div>
          </div>

          <div className="result-row">
            <span className="result-row-label">국민연금 (4.5%)</span>
            <span className="result-row-value">{result.nationalPension.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">건강보험 (3.545%)</span>
            <span className="result-row-value">{result.healthInsurance.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">장기요양보험 (건강보험료의 12.95%)</span>
            <span className="result-row-value">{result.longTermCare.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">고용보험 (실업급여 0.9% + 고용안정·직업능력개발)</span>
            <span className="result-row-value">{result.employmentInsurance.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">산재보험 ({industrialAccidentRate}%, 전액 사업주 부담)</span>
            <span className="result-row-value">{result.industrialAccidentInsurance.toLocaleString()}원</span>
          </div>

          <div className="info-callout warning" style={{ marginTop: '1rem' }}>
            본 계산 결과는 참고용 개략치입니다. 실제 보험료율과 부담 비율은 사업장 규모, 업종, 매년 고시되는 요율에 따라 달라질 수 있으므로 정확한 금액은 국민연금공단·국민건강보험공단·근로복지공단에서 확인하시기 바랍니다.
          </div>
        </section>
      </div>
    </div>
  );
}

export default InsuranceCalculator;
