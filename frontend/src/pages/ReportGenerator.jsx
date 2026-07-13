import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText, Building2, Clock, Clipboard, Check, Download, Briefcase,
  AlertCircle, Coins, Calendar, FileSignature, Upload, X, FileImage, FileVideo, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateHoursAndNightHours, NON_TAXABLE_MONTHLY_CAP } from '../utils/laborCalc.js';

const LOADING_TIPS = [
  "근로기준법 제18조: 4주 동안 평균하여 1주 동안의 소정근로시간이 15시간 미만인 근로자에게는 주휴수당 규정이 적용되지 않습니다.",
  "근로기준법 제23조: 5인 이상 사업장에서는 정당한 이유 없이 근로자를 해고할 수 없으나, 5인 미만 사업장은 해고 제한 규정이 적용되지 않습니다.",
  "근로기준법 제56조: 5인 이상 사업장은 연장·야간·휴일근로에 대해 50% 이상의 가산수당을 지급해야 합니다.",
  "최저임금법 제6조: 모든 사업주는 근로자에게 고용노동부장관이 고시한 최저임금액 이상의 임금을 지급해야 합니다.",
  "근로기준법 제17조: 근로계약서 미작성 및 미교부는 500만원 이하의 벌금 또는 과태료 처분을 받을 수 있습니다."
];

function ReportGenerator({ userType }) {
  const { session, user, setAuthError, setShowLoginModal } = useAuth();
  const isWorker = userType === '근로자';

  const [companySize, setCompanySize] = useState('5인 이상');
  const [salaryType, setSalaryType] = useState('월급');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [allowanceIncluded, setAllowanceIncluded] = useState('확인불가');
  const [pattern1Days, setPattern1Days] = useState('5');
  const [pattern1Hours, setPattern1Hours] = useState('8');
  const [pattern2Days, setPattern2Days] = useState('0');
  const [pattern2Hours, setPattern2Hours] = useState('0');
  const [pattern3Days, setPattern3Days] = useState('0');
  const [pattern3Hours, setPattern3Hours] = useState('0');
  const [weeklyNightHours, setWeeklyNightHours] = useState('0');
  const [breakTime, setBreakTime] = useState('60');
  const [pensionBasis, setPensionBasis] = useState('');
  const [extraWeeklyOvertime, setExtraWeeklyOvertime] = useState('');
  const [holidayWorkDays, setHolidayWorkDays] = useState('');
  const [annualLeaveDays, setAnnualLeaveDays] = useState('');
  const [mealAllowance, setMealAllowance] = useState('');
  const [carAllowance, setCarAllowance] = useState('');
  const [childcareAllowance, setChildcareAllowance] = useState('');
  const [otherNonTaxable, setOtherNonTaxable] = useState('');
  const [taxableAllowance, setTaxableAllowance] = useState('');

  const [pattern1Start, setPattern1Start] = useState('09:00');
  const [pattern1End, setPattern1End] = useState('18:00');
  const [pattern2Start, setPattern2Start] = useState('09:00');
  const [pattern2End, setPattern2End] = useState('18:00');
  const [pattern3Start, setPattern3Start] = useState('09:00');
  const [pattern3End, setPattern3End] = useState('18:00');

  useEffect(() => {
    const p1 = calculateHoursAndNightHours(pattern1Start, pattern1End, breakTime);
    const p2 = calculateHoursAndNightHours(pattern2Start, pattern2End, breakTime);
    const p3 = calculateHoursAndNightHours(pattern3Start, pattern3End, breakTime);

    setPattern1Hours(p1.workHours.toString());
    setPattern2Hours(p2.workHours.toString());
    setPattern3Hours(p3.workHours.toString());

    const p1DaysNum = parseFloat(pattern1Days) || 0;
    const p2DaysNum = parseFloat(pattern2Days) || 0;
    const p3DaysNum = parseFloat(pattern3Days) || 0;
    const totalWeeklyNight = (p1.nightHours * p1DaysNum) + (p2.nightHours * p2DaysNum) + (p3.nightHours * p3DaysNum);
    setWeeklyNightHours((Math.round(totalWeeklyNight * 100) / 100).toString());
  }, [pattern1Start, pattern1End, pattern2Start, pattern2End, pattern3Start, pattern3End, breakTime, pattern1Days, pattern2Days, pattern3Days]);

  const p1Days = parseFloat(pattern1Days) || 0;
  const p1Hours = parseFloat(pattern1Hours) || 0;
  const p2Days = parseFloat(pattern2Days) || 0;
  const p2Hours = parseFloat(pattern2Hours) || 0;
  const p3Days = parseFloat(pattern3Days) || 0;
  const p3Hours = parseFloat(pattern3Hours) || 0;
  const weeklyDays = p1Days + p2Days + p3Days;
  const dailyHours = weeklyDays > 0 ? ((p1Days * p1Hours) + (p2Days * p2Hours) + (p3Days * p3Hours)) / weeklyDays : 0;

  const [fileBase64, setFileBase64] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const [workHours, setWorkHours] = useState('');
  const [issueText, setIssueText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 최대 10MB까지 업로드 가능합니다.');
      return;
    }
    setFileName(file.name);
    setFileMime(file.type);
    setError('');
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result);
      if (file.type.startsWith('image/')) setFilePreview(reader.result);
      else setFilePreview('');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files[0]); };
  const handleRemoveFile = () => {
    setFileBase64(''); setFileMime(''); setFileName(''); setFilePreview('');
    setIsScanning(false); setScanComplete(false);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!salaryAmount.trim()) { setError('급여 금액을 입력해 주세요.'); return; }
    if (!issueText.trim()) { setError('상세 사연(쟁점 사항)을 입력해 주세요.'); return; }

    setIsLoading(true);
    setError('');
    setReport('');
    setLoadingTipIndex(0);

    const payload = {
      user_type: userType,
      company_size: companySize,
      salary_type: salaryType,
      salary_amount: salaryAmount,
      allowance_included: companySize === '5인 이상' ? allowanceIncluded : '해당 없음 (5인 미만)',
      pattern1_days: Number(pattern1Days),
      pattern1_hours: Number(pattern1Hours),
      pattern2_days: Number(pattern2Days),
      pattern2_hours: Number(pattern2Hours),
      pattern3_days: Number(pattern3Days),
      pattern3_hours: Number(pattern3Hours),
      weekly_night_hours: Number(weeklyNightHours),
      daily_hours: Number(dailyHours),
      weekly_days: Number(weeklyDays),
      break_time: Number(breakTime),
      pension_basis: pensionBasis ? Number(pensionBasis) : 0,
      extra_weekly_overtime: extraWeeklyOvertime ? Number(extraWeeklyOvertime) : 0,
      holiday_work_days: holidayWorkDays ? Number(holidayWorkDays) : 0,
      annual_leave_days: annualLeaveDays ? Number(annualLeaveDays) : 0,
      meal_allowance: mealAllowance ? Number(mealAllowance) : 0,
      car_allowance: carAllowance ? Number(carAllowance) : 0,
      childcare_allowance: childcareAllowance ? Number(childcareAllowance) : 0,
      other_non_taxable: otherNonTaxable ? Number(otherNonTaxable) : 0,
      taxable_allowance: taxableAllowance ? Number(taxableAllowance) : 0,
      work_hours: workHours,
      issue_text: issueText,
      file_data: fileBase64,
      file_mime: fileMime
    };

    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.xn--ai-h74ir53a94vh9e.com';
      const response = await fetch(`${apiBaseUrl}/api/generate-report`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리포트 생성에 실패했습니다.');
      }
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      console.error(err);
      setError(err.message || '서버와의 통신 도중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!report) return;
    if (!user) {
      setAuthError('리포트 복사는 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrintPDF = () => {
    if (!user) {
      setAuthError('PDF 다운로드는 회원가입 후 이용하실 수 있습니다.');
      setShowLoginModal(true);
      return;
    }
    window.print();
  };

  function TimeSelectInput({ value, onChange }) {
    const [hStr, mStr] = (value || '00:00').split(':');

    const handleHourChange = (e) => {
      onChange(`${e.target.value}:${mStr}`);
    };

    const handleMinuteChange = (e) => {
      onChange(`${hStr}:${e.target.value}`);
    };

    return (
      <div style={{ display: 'flex', gap: '0.2rem', width: '100%' }}>
        <select className="text-input" value={hStr} onChange={handleHourChange} style={{ padding: '0.75rem 0.2rem', textAlign: 'center', flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
          {Array.from({ length: 24 }, (_, i) => {
            const val = String(i).padStart(2, '0');
            return <option key={val} value={val}>{val}시</option>;
          })}
        </select>
        <select className="text-input" value={mStr} onChange={handleMinuteChange} style={{ padding: '0.75rem 0.2rem', textAlign: 'center', flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
          {Array.from({ length: 60 }, (_, i) => {
            const val = String(i).padStart(2, '0');
            return <option key={val} value={val}>{val}분</option>;
          })}
        </select>
      </div>
    );
  }

  const renderPattern = (label, days, setDays, start, setStart, end, setEnd, hours) => (
    <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주 근무일수</span>
          <input type="number" className="text-input" value={days} onChange={(e) => setDays(e.target.value)} min="0" max="7" />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>출근 시간</span>
          <TimeSelectInput value={start} onChange={setStart} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>퇴근 시간</span>
          <TimeSelectInput value={end} onChange={setEnd} />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
        하루 근로시간: <strong>{hours}시간</strong> (휴게 {breakTime}분 제외)
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title">
          <FileText size={26} color="#38bdf8" /> {isWorker ? 'AI 자가진단 리포트 (근로자용)' : 'AI 리스크 진단 리포트 (사업주용)'}
        </h1>
        <p className="tool-page-desc">
          {isWorker
            ? '근무 조건과 겪고 계신 쟁점을 입력하면 관련 법령을 대조해 권리 구제 방향을 정리해 드립니다.'
            : '사업장의 급여·근로시간 조건을 입력하면 법 위반 리스크와 대응 체크리스트를 정리해 드립니다.'}
        </p>
      </div>

      <main className="main-container">
        <section className="glass-panel">
          <form onSubmit={handleGenerateReport}>
            <div className="form-group">
              <label className="form-label"><Building2 size={16} /> 사업장 규모</label>
              <div className="radio-group">
                <div className={`radio-card ${companySize === '5인 미만' ? 'active' : ''}`} onClick={() => setCompanySize('5인 미만')}>
                  <span className="radio-card-title">5인 미만</span>
                  <span className="radio-card-desc">일부 규정 적용 제외</span>
                </div>
                <div className={`radio-card ${companySize === '5인 이상' ? 'active' : ''}`} onClick={() => setCompanySize('5인 이상')}>
                  <span className="radio-card-title">5인 이상</span>
                  <span className="radio-card-desc">가산 수당 및 연차 적용</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label"><Coins size={16} color="#f59e0b" /> 급여 구분 및 금액</label>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                <select className="text-input" value={salaryType} onChange={(e) => setSalaryType(e.target.value)} style={{ padding: '0.85rem 0.5rem' }}>
                  <option value="시급">시급</option>
                  <option value="일급">일급</option>
                  <option value="주급">주급</option>
                  <option value="월급">월급</option>
                </select>
                <input type="number" className="text-input" placeholder="금액 입력 (예: 2500000)" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
              </div>
            </div>

            {companySize === '5인 이상' && (
              <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '1.25rem', borderRadius: '16px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                <label className="form-label" style={{ color: '#a5b4fc', fontWeight: 'bold' }}><FileSignature size={16} /> 근로계약서 수당 포함 여부</label>
                <select className="text-input" value={allowanceIncluded} onChange={(e) => setAllowanceIncluded(e.target.value)}>
                  <option value="확인불가">계약서 조항 확인 불가 / 모름</option>
                  <option value="기본급 외 수당 모두 포함 (포괄임금)">수당 모두 포함 (포괄임금제 형태)</option>
                  <option value="기본급 외 일부 수당만 포함">일부 수당만 급여에 포함</option>
                  <option value="포함되지 않음 (기본급 기준 연장수당 별도 계산)">포함 안 됨 (연장 등 수당 매월 별도 계산)</option>
                  <option value="근로계약서 작성 안 함">근로계약서를 작성하지 않음</option>
                </select>
              </div>
            )}

            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label className="form-label"><Clock size={16} color="#38bdf8" /> 상세 근로 및 휴게 시간</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {renderPattern('근무 패턴 1', pattern1Days, setPattern1Days, pattern1Start, setPattern1Start, pattern1End, setPattern1End, pattern1Hours)}
                {renderPattern('근무 패턴 2 (선택)', pattern2Days, setPattern2Days, pattern2Start, setPattern2Start, pattern2End, setPattern2End, pattern2Hours)}
                {renderPattern('근무 패턴 3 (선택)', pattern3Days, setPattern3Days, pattern3Start, setPattern3Start, pattern3End, setPattern3End, pattern3Hours)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>하루 평균 휴게시간 (분)</span>
                  <input type="number" className="text-input" value={breakTime} onChange={(e) => setBreakTime(e.target.value)} min="0" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>국민연금 기준소득월액 (선택, 원)</span>
                  <input type="number" className="text-input" placeholder="예: 2500000" value={pensionBasis} onChange={(e) => setPensionBasis(e.target.value)} min="0" />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                * 국민연금 기준소득월액 미입력 시에는 소정근로 계약급(기본급+주휴수당) 기준으로 자동 산출됩니다.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>주당 추가 연장근로시간 (선택)</span>
                  <input type="number" className="text-input" placeholder="예: 5" value={extraWeeklyOvertime} onChange={(e) => setExtraWeeklyOvertime(e.target.value)} min="0" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 휴일근로 일수 (선택)</span>
                  <input type="number" className="text-input" placeholder="예: 12" value={holidayWorkDays} onChange={(e) => setHolidayWorkDays(e.target.value)} min="0" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>연간 연차유급 일수 (선택)</span>
                  <input type="number" className="text-input" placeholder="예: 15" value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} min="0" />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                * 매주 고정적으로 발생하는 추가 연장근로, 연간 휴일근로 일수, 연간 연차유급 일수가 있다면 입력하세요. AI 진단 리포트에 반영됩니다.
              </p>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Utensils size={14} /> 비과세 수당 (선택, 월 지급액)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>식대</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={mealAllowance} onChange={(e) => setMealAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>자가운전보조금</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={carAllowance} onChange={(e) => setCarAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>육아수당 (6세 이하)</span>
                    <input type="number" className="text-input" placeholder="예: 200000" value={childcareAllowance} onChange={(e) => setChildcareAllowance(e.target.value)} min="0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>기타 비과세</span>
                    <input type="number" className="text-input" placeholder="예: 0" value={otherNonTaxable} onChange={(e) => setOtherNonTaxable(e.target.value)} min="0" />
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                  식대·자가운전보조금·육아수당은 각각 월 {NON_TAXABLE_MONTHLY_CAP.toLocaleString()}원까지 비과세로 인정되어 세금·4대보험 산정에서 제외됩니다. 급여명세서에 별도 항목으로 표기되어 있다면 입력하세요.
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#f87171', display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>과세 수당 (선택, 직책수당·상여금 등)</span>
                <input type="number" className="text-input" placeholder="예: 0" value={taxableAllowance} onChange={(e) => setTaxableAllowance(e.target.value)} min="0" />
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
                  비과세와 달리 세금·4대보험 산정 기준액에도 그대로 포함되는 직책수당·상여금 등이 있다면 입력하세요.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Calendar size={16} /> 기타 특이사항 (선택)</label>
              <input type="text" className="text-input" placeholder="예: 주말 고정 당직 4시간 존재, 교대근무 3조 2교대 등" value={workHours} onChange={(e) => setWorkHours(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label"><Upload size={16} /> 서류 이미지 및 증빙 영상 감별 (선택)</label>
              <div
                className="text-input scan-container-box"
                style={{
                  border: isDragOver ? '2px dashed #6366f1' : '1px dashed rgba(255, 255, 255, 0.15)',
                  background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                  padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', position: 'relative'
                }}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => document.getElementById('report-file-input').click()}
              >
                <input id="report-file-input" type="file" accept="image/*, video/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {isScanning && (
                  <div className="scanner-overlay">
                    <div className="scanner-line"></div>
                    <div className="scanner-status"><div className="scan-pulse-circle"></div><span>AI 서류 분석 스캔 중...</span></div>
                  </div>
                )}
                {fileName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {fileMime.startsWith('image/') ? (
                      filePreview ? <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} /> : <FileImage size={36} color="#38bdf8" />
                    ) : <FileVideo size={36} color="#a5b4fc" />}
                    <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, wordBreak: 'break-all' }}>{fileName}</span>
                    {scanComplete && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', color: '#06b6d4', fontSize: '0.75rem', fontWeight: 700 }}>✓ AI 스캔 완료</div>
                    )}
                    <button type="button" onClick={handleRemoveFile} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <X size={12} /> 삭제
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color: '#475569', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.25rem 0' }}>근로계약서 이미지 또는 증빙 영상을 업로드하세요.</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>드래그 앤 드롭 또는 클릭하여 업로드 (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Briefcase size={16} /> 상세 사연 (쟁점 사항)</label>
              <textarea
                className="textarea-input" rows="4"
                placeholder={isWorker ? "예: 지난달 연장근로를 20시간 넘게 했는데 가산수당을 주지 않고 기본 시급으로만 지급받았습니다." : "예: 5인 이상 사업장인데 포괄임금제로 계약했습니다. 실제 연장근로시간을 초과 지급해야 하는지 확인하고 싶습니다."}
                value={issueText} onChange={(e) => setIssueText(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} /><span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'AI 리포트 작성 중...' : '리포트 생성하기'}
            </button>
          </form>
        </section>

        <section className="glass-panel">
          {isLoading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p className="loading-text">노동법 법령 대조 및 리스크 분석 중...</p>
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', maxWidth: '500px' }}>
                <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>노동법 참고 지식</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{LOADING_TIPS[loadingTipIndex]}</p>
              </div>
            </div>
          ) : report ? (
            <div>
              <div className="report-action-bar">
                <button className="btn-action" onClick={handleCopyToClipboard}>
                  {copied ? <><Check size={14} color="#10b981" /> 복사 완료</> : <><Clipboard size={14} /> 텍스트 복사</>}
                </button>
                <button className="btn-action" onClick={handlePrintPDF}><Download size={14} /> PDF/인쇄 다운로드</button>
              </div>

              {!user ? (
                (() => {
                  let part1 = report;
                  let part2 = '';
                  const splitIndex = report.indexOf('## 2.');
                  if (splitIndex !== -1) {
                    part1 = report.substring(0, splitIndex);
                    part2 = report.substring(splitIndex);
                  }
                  return (
                    <div className="report-content" style={{ position: 'relative' }}>
                      <ReactMarkdown>{part1}</ReactMarkdown>
                      {part2 && (
                        <div style={{ position: 'relative', marginTop: '1.5rem', minHeight: '300px', overflow: 'hidden' }}>
                          <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
                            <ReactMarkdown>{part2}</ReactMarkdown>
                          </div>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', background: 'linear-gradient(to bottom, transparent 0%, rgba(30, 41, 59, 0.8) 20%, rgba(30, 41, 59, 1) 90%)', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ background: '#1e293b', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.75rem', maxWidth: '360px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', marginTop: '2rem' }}>
                              <Coins size={32} color="#6366f1" style={{ marginBottom: '0.75rem' }} />
                              <h4 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>상세 분석 리포트 잠금 해제</h4>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>가입하시면 관련 법령 대조 결과, 벌칙 리스크 진단, 준비 서류 체크리스트를 포함한 전체 리포트를 즉시 확인하실 수 있습니다.</p>
                              <button type="button" onClick={() => { setAuthError(''); setShowLoginModal(true); }} style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>1초 로그인 / 회원가입</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="report-content"><ReactMarkdown>{report}</ReactMarkdown></div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <p className="empty-title">아직 생성된 리포트가 없습니다</p>
              <p className="empty-desc">왼쪽 양식을 작성하고 리포트 생성하기 버튼을 눌러주세요.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ReportGenerator;
