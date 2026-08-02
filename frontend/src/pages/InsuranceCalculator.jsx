import React, { useState } from 'react';
import { Wallet, Building2, Factory, HardHat, Copy, Printer, CheckCircle2 } from 'lucide-react';
import { calculateEmployerInsurance, getDeductionRatesForYear } from '../utils/laborCalc.js';
import UsageGuide from '../components/UsageGuide.jsx';

function InsuranceCalculator() {
  const [year, setYear] = useState('2026');
  const [monthlyWage, setMonthlyWage] = useState('2500000');
  const [industrialAccidentRate, setIndustrialAccidentRate] = useState('0.7');
  const [copied, setCopied] = useState(false);

  const result = calculateEmployerInsurance({ monthlyWage, industrialAccidentRate, year });
  const rates = getDeductionRatesForYear(year);

  const wageNum = parseFloat(monthlyWage) || 0;
  const totalEmployerBurden = result.totalEmployerBurden || 0;
  const totalPayrollCost = wageNum + totalEmployerBurden;

  const handleCopySummary = () => {
    const text = `[2026 사업주 4대보험 및 인건비 정산]
- 직원 월 세전 급여: ${wageNum.toLocaleString()}원
- 4대보험 사업주 부담금: ${totalEmployerBurden.toLocaleString()}원
 (국민연금: ${result.nationalPension.toLocaleString()}원 / 건강: ${result.healthInsurance.toLocaleString()}원 / 요양: ${result.longTermCare.toLocaleString()}원 / 고용: ${result.employmentInsurance.toLocaleString()}원 / 산재: ${result.industrialAccidentInsurance.toLocaleString()}원)
- 사업주 실질 인건비 총액: ${totalPayrollCost.toLocaleString()}원`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Wallet size={26} color="#fbbf24" /> 4대보험 사업주 부담금 정산기</h1>
        <p className="tool-page-desc">
          직원 1인당 월 세전 급여 기준 2026년 국민연금·건강보험·장기요양보험·고용보험·산재보험 사업주 부담액과 실질 총 인건비를 정밀 계산합니다.
        </p>
      </div>

      <UsageGuide guideKey="insurance" />

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
            <label className="form-label">직원 1인당 월 세전 급여 (원)</label>
            <input
              type="text"
              className="text-input"
              value={wageNum ? wageNum.toLocaleString() : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(raw)) setMonthlyWage(raw);
              }}
              placeholder="예: 2,500,000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">산재보험료율 (%) - 1클릭 업종 선택</label>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setIndustrialAccidentRate('0.7')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                  background: industrialAccidentRate === '0.7' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: industrialAccidentRate === '0.7' ? '#0f172a' : '#cbd5e1', border: 'none', cursor: 'pointer'
                }}
              >
                🏢 사무직 (0.7%)
              </button>
              <button
                type="button"
                onClick={() => setIndustrialAccidentRate('1.8')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                  background: industrialAccidentRate === '1.8' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: industrialAccidentRate === '1.8' ? '#0f172a' : '#cbd5e1', border: 'none', cursor: 'pointer'
                }}
              >
                🏭 제조업 (1.8%)
              </button>
              <button
                type="button"
                onClick={() => setIndustrialAccidentRate('3.8')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                  background: industrialAccidentRate === '3.8' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: industrialAccidentRate === '3.8' ? '#0f172a' : '#cbd5e1', border: 'none', cursor: 'pointer'
                }}
              >
                🏗️ 건설업 (3.8%)
              </button>
            </div>
            <input type="number" className="text-input" step="0.1" value={industrialAccidentRate} onChange={(e) => setIndustrialAccidentRate(e.target.value)} min="0" />
          </div>

          <div className="info-callout info" style={{ marginTop: '0.5rem' }}>
            국민연금·건강보험료는 근로자와 동일하게 사업주가 절반씩 부담하며, 고용보험·산재보험은 사업주가 추가로 더 부담합니다.
          </div>
        </section>

        <section className="glass-panel">
          <div className="result-highlight" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2))', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div className="result-highlight-label">직원 1인당 월 사업주 부담 4대보험 총액</div>
            <div className="result-highlight-value" style={{ color: '#38bdf8' }}>{totalEmployerBurden.toLocaleString()}원</div>
          </div>

          <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '12px', padding: '1rem', margin: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 700 }}>💼 사업주 실질 월 총 인건비 (급여 + 4대보험)</span>
            <span style={{ fontSize: '1.25rem', color: '#4ade80', fontWeight: 900 }}>{totalPayrollCost.toLocaleString()}원</span>
          </div>

          <div className="result-row">
            <span className="result-row-label">국민연금 ({(rates.pension * 100).toFixed(2)}%)</span>
            <span className="result-row-value">{result.nationalPension.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">건강보험 ({(rates.health * 100).toFixed(3)}%)</span>
            <span className="result-row-value">{result.healthInsurance.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">장기요양보험 (건강보험료의 {(rates.care * 100).toFixed(2)}%)</span>
            <span className="result-row-value">{result.longTermCare.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">고용보험 (실업급여 {(rates.employment * 100).toFixed(1)}% + 고용안정·직업능력)</span>
            <span className="result-row-value">{result.employmentInsurance.toLocaleString()}원</span>
          </div>
          <div className="result-row">
            <span className="result-row-label">산재보험 ({industrialAccidentRate}%, 전액 사업주 부담)</span>
            <span className="result-row-value">{result.industrialAccidentInsurance.toLocaleString()}원</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
            <button
              onClick={handleCopySummary}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '10px',
                background: copied ? '#16a34a' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.88rem'
              }}
            >
              <Copy size={16} /> {copied ? '복사 완료!' : '정산 요약 복사'}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: '0.75rem 1.2rem', borderRadius: '10px',
                background: '#334155', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.88rem'
              }}
            >
              <Printer size={16} /> 인쇄/PDF
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default InsuranceCalculator;

