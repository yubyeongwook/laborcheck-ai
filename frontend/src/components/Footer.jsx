import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <ShieldAlert size={20} color="#6366f1" />
            <span>LaborCheck AI</span>
          </div>
          <p className="site-footer-desc">
            대한민국 근로기준법 기반 노무 자가진단 및 계산기 서비스입니다.<br />
            근로자와 사업주 모두를 위한 무료 도구를 제공합니다.
          </p>
        </div>

        <div className="site-footer-links">
          <div className="site-footer-col">
            <span className="site-footer-col-title">근로자</span>
            <Link to="/worker/report">AI 자가진단 리포트</Link>
            <Link to="/worker/injury">산재 대응 가이드</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">사업주</span>
            <Link to="/employer/report">AI 리스크 진단</Link>
            <Link to="/employer/insurance">4대보험 계산기</Link>
            <Link to="/employer/injury">산재 예방 체크리스트</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">공용 계산기</span>
            <Link to="/tools/salary">월급 계산기</Link>
            <Link to="/tools/weekly-holiday">주휴수당 계산기</Link>
            <Link to="/tools/annual-leave">연차 계산기</Link>
            <Link to="/tools/severance">퇴직금 계산기</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-col-title">고객센터</span>
            <Link to="/contact">문의하기</Link>
          </div>
        </div>
      </div>

      <div className="site-footer-disclaimer">
        본 서비스가 제공하는 모든 계산 결과와 리포트는 참고용 정보이며 법률 자문이 아닙니다.
        구체적인 사건 해결 및 법적 판단은 공인노무사·변호사 등 전문가와 직접 상담하시기 바랍니다.
        <br />
        © {new Date().getFullYear()} LaborCheck AI. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
