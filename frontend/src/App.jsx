import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AuthModal from './components/AuthModal.jsx';

import Home from './pages/Home.jsx';
import WorkerHub from './pages/WorkerHub.jsx';
import EmployerHub from './pages/EmployerHub.jsx';
import SalaryCalculator from './pages/SalaryCalculator.jsx';
import WeeklyHolidayCalculator from './pages/WeeklyHolidayCalculator.jsx';
import AnnualLeaveCalculator from './pages/AnnualLeaveCalculator.jsx';
import SeveranceCalculator from './pages/SeveranceCalculator.jsx';
import InsuranceCalculator from './pages/InsuranceCalculator.jsx';
import ReportGenerator from './pages/ReportGenerator.jsx';
import InjuryGuideWorker from './pages/InjuryGuideWorker.jsx';
import InjuryGuideEmployer from './pages/InjuryGuideEmployer.jsx';

import RemedyHub from './pages/RemedyHub.jsx';
import InjuryHub from './pages/InjuryHub.jsx';
import ReverseSalaryCalculator from './pages/ReverseSalaryCalculator.jsx';
import EmployeeManager from './pages/EmployeeManager.jsx';
import AiConsultant from './pages/AiConsultant.jsx';
import ContactForm from './pages/ContactForm.jsx';


function App() {
  React.useEffect(() => {
    // 1. 우클릭 메뉴 방지
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. 키보드 단축키 방지 (Ctrl+C, Ctrl+X, Ctrl+U, F12, Ctrl+Shift+I 등)
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey; // Windows Ctrl or Mac Cmd
      const tag = e.target?.tagName;
      const isEditableField = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      // 입력창 안에서는 값 복사/잘라내기 편의를 위해 Ctrl+C, Ctrl+X는 막지 않음
      if (
        !isEditableField && (
          (isCtrl && (e.key === 'c' || e.key === 'C')) || // 복사
          (isCtrl && (e.key === 'x' || e.key === 'X'))    // 잘라내기
        )
      ) {
        e.preventDefault();
        return;
      }

      if (
        (isCtrl && (e.key === 'u' || e.key === 'U')) || // 소스 보기
        e.key === 'F12' || // 개발자 도구
        (isCtrl && e.shiftKey && (e.key === 'i' || e.key === 'I')) || // 개발자 도구
        (isCtrl && e.shiftKey && (e.key === 'c' || e.key === 'C')) || // 요소 선택
        (isCtrl && e.shiftKey && (e.key === 'j' || e.key === 'J'))    // 콘솔
      ) {
        e.preventDefault();
      }
    };

    // 3. 드래그 시작 방지
    const handleDragStart = (e) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/remedy" element={<RemedyHub />} />
        <Route path="/injury" element={<InjuryHub />} />
        <Route path="/worker" element={<WorkerHub />} />
        <Route path="/employer" element={<EmployerHub />} />

        <Route path="/tools/salary" element={<SalaryCalculator />} />
        <Route path="/tools/reverse-salary" element={<ReverseSalaryCalculator />} />
        <Route path="/tools/weekly-holiday" element={<WeeklyHolidayCalculator />} />
        <Route path="/tools/annual-leave" element={<AnnualLeaveCalculator />} />
        <Route path="/tools/severance" element={<SeveranceCalculator />} />

        <Route path="/worker/report" element={<ReportGenerator userType="근로자" />} />
        <Route path="/employer/report" element={<ReportGenerator userType="사업주" />} />
        <Route path="/employer/insurance" element={<InsuranceCalculator />} />
        <Route path="/employer/employees" element={<EmployeeManager />} />
        <Route path="/employer/ai-consultant" element={<AiConsultant />} />


        <Route path="/worker/injury" element={<InjuryGuideWorker />} />
        <Route path="/employer/injury" element={<InjuryGuideEmployer />} />

        <Route path="/contact" element={<ContactForm />} />

        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <AuthModal />
    </AuthProvider>
  );
}

export default App;
