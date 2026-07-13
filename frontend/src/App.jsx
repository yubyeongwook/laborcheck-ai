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

function App() {
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

        <Route path="/worker/injury" element={<InjuryGuideWorker />} />
        <Route path="/employer/injury" element={<InjuryGuideEmployer />} />

        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <AuthModal />
    </AuthProvider>
  );
}

export default App;
