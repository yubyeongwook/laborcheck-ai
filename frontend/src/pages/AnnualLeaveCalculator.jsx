import React, { useState } from 'react';
import { Clock, Building2 } from 'lucide-react';
import { calculateAnnualLeave } from '../utils/laborCalc.js';

const today = new Date().toISOString().slice(0, 10);

function AnnualLeaveCalculator() {
  const [companySize, setCompanySize] = useState('5인 이상');
  const [hireDate, setHireDate] = useState('');
  const [refDate, setRefDate] = useState(today);
  const [dailyWage, setDailyWage] = useState('');
  const [usedDays, setUsedDays] = useState('0');

  const isUnder5 = companySize === '5인 미만';
  const result = hireDate ? calculateAnnualLeave(hireDate, refDate) : null;
  const remainingDays = result ? Math.max(result.leaveDays - (parseFloat(usedDays) || 0), 0) : 0;
  const wage = parseFloat(dailyWage) || 0;
  const leavePayEstimate = wage > 0 ? Math.round(remainingDays * wage) : 0;

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Clock size={26} color="#a78bfa" /> 연차 계산기</h1>
        <p className="tool-page-desc">
          근로기준법 제60조에 따라 입사일 기준으로 발생하는 연차유급휴가 개수를 계산합니다.
          입사 1년 미만은 월 개근 시 1일씩(최대 11일), 1년 이상은 최초 15일에 2년마다 1일씩 가산(최대 25일)됩니다.
          단, 연차유급휴가는 <strong>상시근로자 5인 이상 사업장에만 법적 의무</strong>이며 5인 미만 사업장은 근로기준법 시행령상 적용 제외 대상입니다.
        </p>
      </div>

      <div className="tool-grid">
        <section className="glass-panel">
          <div className="form-group">
            <label className="form-label"><Building2 size={16} /> 사업장 규모</label>
            <div className="radio-group">
              <div className={`radio-card ${companySize === '5인 미만' ? 'active' : ''}`} onClick={() => setCompanySize('5인 미만')}>
                <span className="radio-card-title">5인 미만</span>
                <span className="radio-card-desc">연차 법적 의무 없음</span>
              </div>
              <div className={`radio-card ${companySize === '5인 이상' ? 'active' : ''}`} onClick={() => setCompanySize('5인 이상')}>
                <span className="radio-card-title">5인 이상</span>
                <span className="radio-card-desc">연차유급휴가 의무 적용</span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">입사일</label>
            <input type="date" className="text-input" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">기준일</label>
            <input type="date" className="text-input" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>보통 오늘 날짜 또는 퇴사(예정)일을 기준으로 계산합니다.</p>
          </div>
          <div className="form-group">
            <label className="form-label">1일 통상임금 (선택, 원)</label>
            <input type="number" className="text-input" placeholder="미사용 연차수당 계산 시 입력" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">이미 사용한 연차 일수 (선택)</label>
            <input type="number" className="text-input" value={usedDays} onChange={(e) => setUsedDays(e.target.value)} min="0" />
          </div>
        </section>

        <section className="glass-panel">
          {!result ? (
            <div className="empty-state">
              <Clock size={40} className="empty-icon" />
              <p className="empty-title">입사일을 입력해 주세요</p>
              <p className="empty-desc">입사일을 입력하면 현재까지 발생한 연차 개수를 계산해 드립니다.</p>
            </div>
          ) : (
            <>
              {isUnder5 && (
                <div className="info-callout warning" style={{ marginBottom: '1.25rem' }}>
                  <strong>5인 미만 사업장은 연차유급휴가가 법적 의무가 아닙니다.</strong> 근로기준법 제11조 및 시행령 별표1에 따라 제60조(연차유급휴가)는 상시근로자 5인 미만 사업장에는 적용되지 않습니다.
                  아래 수치는 5인 이상 사업장 기준을 적용했을 때의 참고용 계산 결과이며, 실제 지급 의무는 없습니다(사업주가 자율적으로 부여하는 것은 가능).
                </div>
              )}

              <div className="result-highlight">
                <div className="result-highlight-label">
                  {isUnder5 ? '참고용 연차 일수 (법적 의무 아님)' : (result.isUnderOneYear ? '현재까지 발생한 연차 (입사 1년 미만)' : '연간 발생 연차')}
                </div>
                <div className="result-highlight-value">{result.leaveDays}일</div>
                <div className="result-highlight-sub">다음 연차 발생 예정일: {result.nextGrantDate}</div>
              </div>

              <div className="result-row">
                <span className="result-row-label">사용한 연차</span>
                <span className="result-row-value">{parseFloat(usedDays) || 0}일</span>
              </div>
              <div className="result-row">
                <span className="result-row-label">잔여 연차</span>
                <span className="result-row-value">{remainingDays}일</span>
              </div>
              {wage > 0 && (
                <div className="result-row">
                  <span className="result-row-label">미사용 연차수당 추정액</span>
                  <span className="result-row-value" style={{ color: '#38bdf8' }}>{leavePayEstimate.toLocaleString()}원</span>
                </div>
              )}

              {!isUnder5 && (
                result.isUnderOneYear ? (
                  <div className="info-callout info">
                    입사 1년 미만이므로 매월 개근 시 1일씩 발생하며, 최대 11일까지 발생합니다.
                  </div>
                ) : (
                  <div className="info-callout info">
                    입사 1년 이상 근속하여 최초 15일에서 2년마다 1일씩 가산됩니다(최대 25일). 실제 발생 여부는 해당 기간 출근율(80% 이상)에 따라 달라질 수 있습니다.
                  </div>
                )
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default AnnualLeaveCalculator;
