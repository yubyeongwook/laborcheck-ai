import React, { useState } from 'react';
import { 
  GraduationCap, ShieldCheck, CheckCircle2, Award, FileText, Send, 
  Sparkles, AlertTriangle, Printer, Copy, X, FileCheck, Users, ShieldAlert 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MANDATORY_COURSES = [
  {
    id: 'harassment',
    title: '직장 내 성희롱 예방 교육',
    target: '상시 1인 이상 전 사업장 (연 1회 이상)',
    penalty: '미이수 시 과태료 최대 500만원',
    duration: '연 1회 (1시간 이상)',
    desc: '사업주 및 근로자 전체 대상 필수 교육. 성희롱 판단 기준과 신고·구제 절차 및 피해자 보호 조치.',
    icon: '🛡️'
  },
  {
    id: 'privacy',
    title: '개인정보 보호 교육',
    target: '개인정보 취급 사업장 전체',
    penalty: '시정명령 및 유출 사고 시 억대 과징금',
    duration: '연 1회 (1시간 이상)',
    desc: '고객 및 임직원 개인정보 관리 가이드, 데이터 암호화, 파기 절차 및 유출 사고 방지 실무.',
    icon: '🔒'
  },
  {
    id: 'disability',
    title: '장애인 인식 개선 교육',
    target: '상시 1인 이상 전 사업장 (연 1회 이상)',
    penalty: '미이수 시 과태료 최대 300만원',
    duration: '연 1회 (1시간 이상)',
    desc: '직장 내 장애인 차별 금지 및 정당한 편의 제공, 장애인 근로자 직무 적응 및 상생 조직 문화.',
    icon: '♿'
  },
  {
    id: 'safety',
    title: '산업안전보건 교육 / 중대재해예방',
    target: '5인 이상 사업장 (매분기 6시간)',
    penalty: '미이수 시 과태료 최대 500만원 / 형사처벌',
    duration: '분기별 6시간 (사무직 분기 3시간)',
    desc: '위험성 평가 실무, 안전 작업 수칙, 중대재해처벌법 대비 사업주 의무 조치 및 사고 예방.',
    icon: '⛑️'
  },
  {
    id: 'pension',
    title: '퇴직연금 가입자 교육',
    target: '퇴직연금(DB/DC) 도입 사업장 전체',
    penalty: '미이수 시 과태료 최대 500만원',
    duration: '연 1회 (1시간 이상)',
    desc: 'DB형/DC형 퇴직연금 운용 방법, 자산관리 및 퇴직소득 세제 안내.',
    icon: '💰'
  }
];

export default function EducationCenter() {
  const [selectedCourse, setSelectedCourse] = useState(MANDATORY_COURSES[0].title);
  const [companyName, setCompanyName] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 📜 자체 교육 실시 확인서 모달 상태
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certCourse, setCertCourse] = useState('직장 내 성희롱 예방 교육');
  const [certDate, setCertDate] = useState('2026-08-01');
  const [certAttendees, setCertAttendees] = useState('5');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName || !phone) {
      alert('회사명과 연락처를 입력해 주세요.');
      return;
    }
    setSubmitted(true);
  };

  const getCertText = () => {
    return `[2026 법정의무교육 자체 교육 실시 확인서]

1. 사업장 정보
 - 사업장명(상호): ${companyName || '(주)노무체크 검증 사업장'}
 - 대표자 성명: (대표자 성명 기재)
 - 사업장 소재지: (주소 기재)

2. 교육 실시 내역
 - 교육 과목: ${certCourse}
 - 교육 실시일: ${certDate}
 - 교육 방법: 자체 집체 교육 / 시청각 자료 배포 교재 이수
 - 참석 인원: 총 ${certAttendees}명 (전원 이수)

3. 교육 내용 요약
 - 법정 필수 항목 교안 교육 및 성희롱/개인정보/안전보건 관련 법률 준수 서약

본 사업장은 근로기준법 및 관련 노동관계 법령에 따라 상기 법정의무교육을 정식 실시하였음을 확인합니다.

작성일자: ${certDate}
사업주(사용자): __________________ (직인)`;
  };

  const handleCopyCert = () => {
    navigator.clipboard.writeText(getCertText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      
      {/* 🎓 법정의무교육 센터 히어로 섹션 */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
        borderRadius: '24px',
        padding: '3rem 2rem',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        marginBottom: '3rem'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(129, 140, 248, 0.4)', padding: '6px 16px', borderRadius: '50px', fontSize: '14px', color: '#818cf8', fontWeight: 700, marginBottom: '1.2rem' }}>
          <GraduationCap size={18} /> 2026 사업주 맞춤형 법정의무교육 솔루션
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.35, letterSpacing: '-0.02em' }}>
          과태료 최대 500만원 위험, <br />
          <span style={{ color: '#818cf8', textDecoration: 'underline' }}>노무체크 AI 법정의무교육 & 이수증 발급</span>으로 해결하세요
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '750px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          매년 반복되는 5대 필수 의무교육! 노동청 근로감독 점검 시 제출할 <strong>자체 교육 실시 확인서</strong>를 1초 만에 발급하고 <strong>무료/환급 수강 플랜</strong>을 신청하세요.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCertificateModal(true)}
            style={{
              padding: '0.85rem 1.6rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#fff',
              fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)'
            }}
          >
            <FileCheck size={20} /> 📜 1초 자체 교육 실시 확인서 출력/복사
          </button>
        </div>
      </div>

      {/* 📚 필수 5대 법정의무교육 코스 Grid */}
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📚 5대 필수 법정의무교육 안내 & 점검 체크리스트
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {MANDATORY_COURSES.map((course) => (
          <div key={course.id} style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{course.icon}</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem' }}>{course.title}</h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{course.desc}</p>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.82rem', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={14} /> {course.penalty}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                • 대상: <strong>{course.target}</strong> <br />
                • 주기: <strong>{course.duration}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(course.title);
                  const el = document.getElementById('education-apply-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                무료 가이드 신청
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📝 교육 수강 & 무료 컨설팅 신청 폼 */}
      <div id="education-apply-form" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
        maxWidth: '750px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem' }}>
            🎓 법정의무교육 지원 및 출강/온라인 단체 신청
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            전문 가이드가 사업장 규모에 맞는 최적의 환급/무료 수강 플랜을 안내해 드립니다.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={56} color="#4ade80" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem' }}>
              교육 지원 신청이 성공적으로 완료되었습니다!
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              담당 매니저가 작성해 주신 연락처(<strong>{phone}</strong>)로 1시간 이내에 맞춤 수강 가이드를 안내해 드립니다.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              추가 신청하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                희망 교육 과목
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
              >
                {MANDATORY_COURSES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                <option value="전체 5대 의무교육 패키지">전체 5대 의무교육 패키지 (추천)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  회사명 / 상호
                </label>
                <input
                  type="text"
                  placeholder="예: (주)노무체크"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  근로자 수 (규모)
                </label>
                <input
                  type="text"
                  placeholder="예: 15명"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  담당자 연락처 *
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  이메일 (이수증 수신용)
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.05rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Send size={18} /> 무료 수강 가이드 및 이수증 지원 신청하기
            </button>
          </form>
        )}
      </div>

      {/* 📜 자체 교육 실시 확인서 발급 모달 */}
      {showCertificateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '650px', maxHeight: '88vh',
            background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px', padding: '1.8rem', color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                📜 법정의무교육 자체 교육 실시 확인서 발급
              </h3>
              <button onClick={() => setShowCertificateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>교육 과목 선택</label>
                <select
                  value={certCourse}
                  onChange={(e) => setCertCourse(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                >
                  {MANDATORY_COURSES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>교육 실시 일자</label>
                <input
                  type="date"
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <textarea
              readOnly
              value={getCertText()}
              rows={12}
              style={{
                width: '100%', background: '#1e293b', border: '1px solid #334155',
                color: '#e2e8f0', borderRadius: '12px', padding: '1rem',
                fontFamily: 'monospace', fontSize: '0.86rem', lineHeight: 1.6,
                boxSizing: 'border-box', marginBottom: '1.2rem', outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={handleCopyCert}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '10px',
                  background: copied ? '#16a34a' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}
              >
                <Copy size={18} /> {copied ? '확인서 복사 완료!' : '확인서 텍스트 전체 복사하기'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '0.8rem 1.2rem', borderRadius: '10px',
                  background: '#334155', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}
              >
                <Printer size={18} /> 인쇄/PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

