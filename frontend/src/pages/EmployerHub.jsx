import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Coins, Calendar, Clock, PiggyBank, ShieldAlert, Wallet, HeartPulse } from 'lucide-react';

const TOOLS = [
  { to: '/employer/report', icon: <ShieldAlert size={22} color="#fbbf24" />, title: 'AI 리스크 진단 리포트', desc: '사업장의 급여·근로시간 조건을 입력하면 법 위반 리스크 등급과 대응 체크리스트를 정리해 드립니다.' },
  { to: '/employer/insurance', icon: <Wallet size={22} color="#fbbf24" />, title: '4대보험 사업주 부담금', desc: '월 급여 기준으로 국민연금·건강보험·고용보험·산재보험의 사업주 부담액을 계산합니다.' },
  { to: '/employer/injury', icon: <HeartPulse size={22} color="#fbbf24" />, title: '산재 예방·대응 체크리스트', desc: '산재를 예방하기 위한 사전 준비와, 발생 시 사업주의 법적 의무를 초기 단계부터 안내합니다.' },
  { to: '/tools/salary', icon: <Coins size={22} color="#f59e0b" />, title: '월급 계산기', desc: '근로자별 급여 구성과 예상 지급액을 미리 계산해 인건비를 관리합니다.' },
  { to: '/tools/weekly-holiday', icon: <Calendar size={22} color="#38bdf8" />, title: '주휴수당 계산기', desc: '주휴수당 지급 대상 여부와 금액을 확인합니다.' },
  { to: '/tools/annual-leave', icon: <Clock size={22} color="#a78bfa" />, title: '연차 계산기', desc: '직원별 연차 발생 개수를 계산해 연차 관리에 활용합니다.' },
  { to: '/tools/severance', icon: <PiggyBank size={22} color="#34d399" />, title: '퇴직금 계산기', desc: '퇴직 예정 직원의 예상 퇴직금을 미리 계산합니다.' },
];

function EmployerHub() {
  return (
    <div className="page-container">
      <div className="hub-header employer">
        <div className="hub-header-icon"><Briefcase size={32} color="#fbbf24" /></div>
        <div>
          <h1 className="hub-header-title">사업주를 위한 도구</h1>
          <p className="hub-header-desc">노무 리스크를 사전에 점검하고, 인건비·보험료 계산까지 한 번에 관리하세요.</p>
        </div>
      </div>

      <div className="card-grid">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="feature-card">
            <div className="feature-card-icon">{t.icon}</div>
            <h4 className="feature-card-title">{t.title}</h4>
            <p className="feature-card-desc">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EmployerHub;
