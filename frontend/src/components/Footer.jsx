import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #38bdf8)', borderRadius: '8px', padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>노무체크 AI</span>
            <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
              2026 최저임금 10,320원 검증
            </span>
          </div>
          <p className="site-footer-desc" style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginTop: '0.8rem' }}>
            대한민국 근로기준법 및 대법원 판례 기반 노무 자가진단 SaaS 플랫폼입니다.<br />
            2026년 209시간 월급 산식, 5인 이상/미만 법적 판정 및 산재 70% 휴업급여를 0% 오차 정밀 계산합니다.
          </p>

          <div style={{ marginTop: '1rem' }}>
            <a
              href="http://www.laborcheckai.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                color: '#38bdf8', fontSize: '0.84rem', fontWeight: 800, textDecoration: 'none',
                background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '0.4rem 0.85rem', borderRadius: '8px', transition: 'all 0.2s ease'
              }}
            >
              <Globe size={15} /> 노무체크 AI 공식 법률 지식 블로그 <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="site-footer-links">
          <div className="site-footer-col">
            <span className="site-footer-col-title">근로자 센터</span>
            <Link to="/worker">근로자 서류 자동생성</Link>
            <Link to="/worker/report">AI 권리구제 리포트</Link>
            <Link to="/worker/injury">산재 70% 대응 가이드</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">사업주 센터</span>
            <Link to="/employer">사업주 서류 자동생성</Link>
            <Link to="/employer/report">AI 노무 리스크 진단</Link>
            <Link to="/employer/insurance">4대보험 사업주 부담금</Link>
            <Link to="/employer/employees">직원 관리 대시보드</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">공용 계산기</span>
            <Link to="/tools/salary">209시간 월급 계산기</Link>
            <Link to="/tools/weekly-holiday">주휴수당 계산기</Link>
            <Link to="/tools/annual-leave">연차 개수/수당 계산기</Link>
            <Link to="/tools/severance">퇴직금 계산기</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">고객센터 & 법정</span>
            <Link to="/education">2026 법정의무교육</Link>
            <Link to="/contact">1:1 노무상담 및 문의</Link>
            <Link to="/privacy">개인정보처리방침</Link>
          </div>
        </div>
      </div>

      <div className="site-footer-disclaimer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.2rem', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
        본 서비스가 제공하는 모든 계산 결과 및 AI 진단 리포트는 근로기준법 및 관련 고용노동부 고시 기준 참고용 정보입니다.<br />
        개별 분쟁 및 재판 절차는 공인노무사·변호사 등 법률 전문가와 직접 상담을 권장합니다.<br />
        © {new Date().getFullYear()} LaborCheck AI. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;

