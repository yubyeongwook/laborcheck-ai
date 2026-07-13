import React from 'react';
import { Link } from 'react-router-dom';
import { User, Coins, Calendar, Clock, PiggyBank, FileText, HeartPulse } from 'lucide-react';

const TOOLS = [
  { to: '/worker/report', icon: <FileText size={22} color="#38bdf8" />, title: 'AI 자가진단 리포트', desc: '겪고 있는 노무 이슈(임금체불, 부당해고, 휴게시간 미보장 등)를 입력하면 관련 법령을 대조해 권리 구제 방향을 정리해 드립니다.' },
  { to: '/worker/injury', icon: <HeartPulse size={22} color="#f87171" />, title: '산재 대응 가이드', desc: '업무 중 사고가 발생했을 때 지금 바로 해야 할 행동요령과 산재 신청 절차를 안내합니다.' },
  { to: '/tools/salary', icon: <Coins size={22} color="#f59e0b" />, title: '월급 계산기', desc: '내 시급/월급 기준으로 실수령액과 각종 수당을 계산합니다.' },
  { to: '/tools/reverse-salary', icon: <Coins size={22} color="#38bdf8" />, title: '역산 월급 계산기', desc: '받는 총 월급(세전)에서 실제 시급과 수당 구성을 역산합니다.' },
  { to: '/tools/weekly-holiday', icon: <Calendar size={22} color="#38bdf8" />, title: '주휴수당 계산기', desc: '내가 주휴수당 대상인지, 얼마를 받아야 하는지 확인합니다.' },
  { to: '/tools/annual-leave', icon: <Clock size={22} color="#a78bfa" />, title: '연차 계산기', desc: '입사일 기준으로 지금까지 발생한 연차 개수를 계산합니다.' },
  { to: '/tools/severance', icon: <PiggyBank size={22} color="#34d399" />, title: '퇴직금 계산기', desc: '퇴사 시 받을 수 있는 예상 퇴직금을 미리 계산해 봅니다.' },
];

function WorkerHub() {
  return (
    <div className="page-container">
      <div className="hub-header worker">
        <div className="hub-header-icon"><User size={32} color="#38bdf8" /></div>
        <div>
          <h1 className="hub-header-title">근로자를 위한 도구</h1>
          <p className="hub-header-desc">내 권리를 지키기 위해 필요한 계산기와 진단 리포트를 모았습니다. 모든 계산기는 무료로 이용할 수 있습니다.</p>
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

export default WorkerHub;
