import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coins, RefreshCw, Calendar, Sun, PiggyBank, ShieldCheck } from 'lucide-react';

import SalaryCalculator from './SalaryCalculator.jsx';
import ReverseSalaryCalculator from './ReverseSalaryCalculator.jsx';
import WeeklyHolidayCalculator from './WeeklyHolidayCalculator.jsx';
import AnnualLeaveCalculator from './AnnualLeaveCalculator.jsx';
import SeveranceCalculator from './SeveranceCalculator.jsx';
import InsuranceCalculator from './InsuranceCalculator.jsx';

const TOOLS_TABS = [
  { id: 'salary', label: '💰 월급·209시간 정밀계산', path: '/tools/salary', icon: <Coins size={18} /> },
  { id: 'reverse-salary', label: '🔄 실수령액 역산계산기', path: '/tools/reverse-salary', icon: <RefreshCw size={18} /> },
  { id: 'weekly-holiday', label: '📅 주휴수당 계산기', path: '/tools/weekly-holiday', icon: <Calendar size={18} /> },
  { id: 'annual-leave', label: '🌴 연차수당 계산기', path: '/tools/annual-leave', icon: <Sun size={18} /> },
  { id: 'severance', label: '🎁 퇴직금 계산기', path: '/tools/severance', icon: <PiggyBank size={18} /> },
  { id: 'insurance', label: '🛡️ 4대보험 계산기', path: '/employer/insurance', icon: <ShieldCheck size={18} /> }
];

export default function UnifiedToolsHub() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current pathname
  const currentTab = TOOLS_TABS.find(tab => tab.path === location.pathname)?.id || 'salary';
  const [activeTab, setActiveTab] = useState(currentTab);

  React.useEffect(() => {
    const tabId = TOOLS_TABS.find(tab => tab.path === location.pathname)?.id || 'salary';
    setActiveTab(tabId);
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path, { replace: true });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* 🛠️ AI 노동관리 도구 통합 서브 헤더 탭 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '1.2rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛠️ AI 노동관리 도구 <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>(통합 노무계산기 Hub)</span>
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0.3rem 0 0 0' }}>
              2026 최저임금, 209시간, 실수령액 역산, 주휴·연차·퇴직금, 4대보험 계산기를 한곳에서 자유롭게 이용하세요.
            </p>
          </div>
        </div>

        {/* 서브 탭 스위처 */}
        <div style={{
          display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem',
          scrollbarWidth: 'thin'
        }}>
          {TOOLS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '#0f172a',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(56, 189, 248, 0.35)' : 'none'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🧮 활성화된 계산기 컴포넌트 렌더링 */}
      <div>
        {activeTab === 'salary' && <SalaryCalculator />}
        {activeTab === 'reverse-salary' && <ReverseSalaryCalculator />}
        {activeTab === 'weekly-holiday' && <WeeklyHolidayCalculator />}
        {activeTab === 'annual-leave' && <AnnualLeaveCalculator />}
        {activeTab === 'severance' && <SeveranceCalculator />}
        {activeTab === 'insurance' && <InsuranceCalculator />}
      </div>
    </div>
  );
}
