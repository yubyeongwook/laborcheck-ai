import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, FileText, ShieldAlert, CheckCircle, 
  HelpCircle, Upload, Play, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const SAMPLE_CONTRACTS = {
  contract: `근 로 계 약 서 (샘플)

1. 양 당사자
- 사업주(갑): (주)대박상사 대표 김갑동
- 근로자(을): 홍길동

2. 근로 조건
- 업무 내용: 매장 판매 및 재고 관리
- 근로 시간: 오전 9시부터 오후 6시까지로 함. 휴게시간은 별도로 정하지 않고 업무 중 틈틈이 알아서 쉬기로 함.
- 근무 일수: 주 6일 근무 (월요일~토요일)
- 임금: 시간당 시급 10,030원만 지급하며 주휴수당은 따로 지급하지 않는다.

3. 기타 사항
- 을이 중도 퇴사할 경우, 인수인계 미비 시 일별 급여에서 10%를 차감한 후 지급한다.
- 수습기간 3개월 동안은 최저임금의 80%만 지급한다.`,
  rules: `취업규칙 및 사내 내규 (샘플)

제1조 (목적)
본 규칙은 사원들의 근무 기강 확립을 목적으로 한다.

제2조 (근무 기강 및 징계)
1. 무단결근 1일 발생 시, 감급 제재로서 당월 총 급여의 20%를 감액한다.
2. 직원이 회사에 손해를 끼쳤을 경우, 소명 기회 없이 즉각 해고하며 손해 배상금 500만 원을 퇴직금에서 선공제한다.

제3조 (연장 근로)
회사의 업무 사정에 따라 연장 및 야간 근로를 지시할 수 있으며, 직원은 이에 무조건 응해야 한다. 단, 연장 근무 수당은 별도로 지급하지 않고 월 기본급에 포함된 것으로 간주한다.`
};

function AiConsultant() {
  const { session, user } = useAuth();
  const [analysisType, setAnalysisType] = useState('contract'); // 'contract' | 'rules'
  const [documentText, setDocumentText] = useState(SAMPLE_CONTRACTS.contract);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // 탭 변경 시 예시 텍스트도 매칭 변경
  const handleTypeChange = (type) => {
    setAnalysisType(type);
    setDocumentText(SAMPLE_CONTRACTS[type]);
  };

  // 파일 업로드는 아직 지원하지 않음 (OCR/PDF 파싱 미구현) - 사용자의 실제 문서를 임의로 바꿔치기하지 않도록 안내만 표시
  const handleFileChange = (e) => {
    const hadFile = e.target.files.length > 0;
    e.target.value = '';
    if (hadFile) {
      alert('파일 업로드(이미지/PDF 자동 인식)는 아직 지원되지 않습니다. 아래 입력창에 문서 내용을 직접 붙여넣어 주세요.');
    }
  };

  // 분석 실행
  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      alert('분석할 문서 텍스트를 입력하거나 예시를 불러와 주세요.');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/analyze-contract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contractText: documentText,
          analysisType
        })
      });

      if (!res.ok) throw new Error('AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      const data = await res.json();
      setResult(data.report);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="tool-page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="tool-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={28} color="#fbbf24" /> AI 노무 컨설턴트
        </h1>
        <p className="tool-page-desc">
          사업주가 등록할 근로계약서나 사내 취업규칙을 법적으로 정밀 진단합니다. 
          노동법(근로기준법) 위반 리스크를 식별하고, 사업주와 근로자 모두 보호할 수 있는 안전한 대안 문구를 추천해 드립니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* 왼쪽: 계약서 입력 영역 */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={18} color="#fbbf24" /> 분석 대상 서류
            </h3>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(15, 23, 42, 0.4)', padding: '2px', borderRadius: '8px' }}>
              <button
                type="button"
                className={`navbar-btn-ghost ${analysisType === 'contract' ? 'active' : ''}`}
                style={{ 
                  padding: '0.35rem 0.75rem', 
                  fontSize: '0.75rem', 
                  background: analysisType === 'contract' ? '#fbbf24' : 'transparent',
                  color: analysisType === 'contract' ? '#0f172a' : '#cbd5e1'
                }}
                onClick={() => handleTypeChange('contract')}
              >
                근로계약서
              </button>
              <button
                type="button"
                className={`navbar-btn-ghost ${analysisType === 'rules' ? 'active' : ''}`}
                style={{ 
                  padding: '0.35rem 0.75rem', 
                  fontSize: '0.75rem', 
                  background: analysisType === 'rules' ? '#fbbf24' : 'transparent',
                  color: analysisType === 'rules' ? '#0f172a' : '#cbd5e1'
                }}
                onClick={() => handleTypeChange('rules')}
              >
                취업규칙
              </button>
            </div>
          </div>

          {/* 모의 드롭존 */}
          <div 
            style={{ 
              border: '2px dashed rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              textAlign: 'center', 
              background: 'rgba(15, 23, 42, 0.3)',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <input 
              type="file" 
              accept=".txt,.pdf,.png,.jpg" 
              onChange={handleFileChange}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <Upload size={24} color="#a78bfa" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 'bold' }}>
              근로계약서 이미지/PDF 파일 업로드 (준비 중)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
              현재는 아래 입력창에 문서 내용을 직접 붙여넣어 분석할 수 있습니다
            </div>
          </div>

          <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>서류 본문 내용 직접 작성/수정</span>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setDocumentText(SAMPLE_CONTRACTS[analysisType])}
              >
                <RefreshCw size={10} /> 기본 샘플 불러오기
              </button>
            </label>
            <textarea
              className="text-input"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="여기에 근로계약서 조항들이나 취업규칙 텍스트를 붙여넣으세요..."
              style={{ flex: 1, minHeight: '300px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5', padding: '0.75rem' }}
            />
          </div>

          <button
            type="button"
            className="navbar-btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              padding: '0.85rem',
              fontWeight: 'bold'
            }}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                진단 분석 중...
              </>
            ) : (
              <>
                <Play size={16} /> AI 위법 리스크 분석 시작
              </>
            )}
          </button>
        </section>

        {/* 오른쪽: AI 진단 결과 출력 영역 */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={18} color="#818cf8" /> AI 정밀 리스크 보고서
          </h3>

          {result ? (
            <div 
              className="ai-report-markdown" 
              style={{ 
                color: '#cbd5e1', 
                fontSize: '0.85rem', 
                lineHeight: '1.7', 
                overflowY: 'auto', 
                flex: 1,
                paddingRight: '0.5rem'
              }}
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center', padding: '2rem' }}>
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={40} style={{ color: '#818cf8', marginBottom: '1rem' }} />
                  <p style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Gemini AI가 노동법 위반 소지가 있는 독소 조항을 찾고 있습니다...</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>약 5~10초 정도 소요될 수 있습니다.</p>
                </>
              ) : (
                <>
                  <HelpCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 'bold' }}>진단 대기 중</p>
                  <p style={{ fontSize: '0.75rem', maxWidth: '300px', margin: '0.2rem auto 0 auto' }}>
                    왼쪽 문서 영역에 계약서 내용을 입력하고 아래 'AI 분석 시작' 버튼을 클릭하시면 실시간 legal-compliance 보고서가 이곳에 출력됩니다.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AiConsultant;
