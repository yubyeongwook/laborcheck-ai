import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Users, Edit2, Trash2, Calendar, 
  DollarSign, Clock, Settings, X, FileText, CheckCircle, 
  AlertCircle, Phone, Sparkles, Printer, Send, Eye, RefreshCw,
  Clock3, Trash, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateYearlyEntryPay, calculateEmployerInsurance, applyDeductions } from '../utils/laborCalc.js';
import UsageGuide from '../components/UsageGuide.jsx';

function EmployeeManager() {
  const { session, user, openLoginModal } = useAuth();
  
  // 상태 정의
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [payStubs, setPayStubs] = useState({}); // { employeeId: [stubs] }
  const [attendanceLogs, setAttendanceLogs] = useState({}); // { employeeId: [logs] }
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 모달 상태
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyModalMode, setCompanyModalMode] = useState('add'); // 'add' | 'edit'
  const [companyForm, setCompanyForm] = useState({ id: '', company_name: '', business_number: '', size_type: '5인 미만' });

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState('add'); // 'add' | 'edit'
  const [employeeForm, setEmployeeForm] = useState({
    id: '',
    name: '',
    birthdate: '',
    phone: '',
    join_date: '',
    contract_type: '정규직',
    salary_type: '월급',
    base_salary: '3000000',
    weekly_work_days: '5',
    daily_work_hours: '8',
    break_time_minutes: '60',
    annual_leave_days: '0',
    holiday_work_days: '0',
    night_work_hours: '0',
    night_break_minutes: '0'
  });

  // 급여명세서 발행 모달 상태
  const [showStubModal, setShowStubModal] = useState(false);
  const [activeEmployeeForStub, setActiveEmployeeForStub] = useState(null);
  const [stubForm, setStubForm] = useState({
    target_month: new Date().toISOString().substring(0, 7), // 'YYYY-MM'
    base_pay: 0,
    weekly_holiday_pay: 0,
    overtime_pay: 0,
    night_pay: 0,
    allowances_total: 0,
    total_pay: 0,
    national_pension: 0,
    health_insurance: 0,
    long_term_care: 0,
    employment_insurance: 0,
    income_tax: 0,
    local_income_tax: 0,
    total_deductions: 0,
    net_pay: 0,
    is_auto_calculated_from_attendance: false,
    attendance_summary: ''
  });

  // 근태 등록 모달 상태
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [activeEmployeeForAttendance, setActiveEmployeeForAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    work_date: new Date().toISOString().substring(0, 10), // 'YYYY-MM-DD'
    clock_in: '09:00',
    clock_out: '18:00',
    break_minutes: 60,
    status: '정상'
  });

  // 인쇄 및 상세 보기 모달 상태
  const [printStub, setPrintStub] = useState(null); // 인쇄/조회할 stub 상세 정보

  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  
  // 근태 / 명세서 탭 상태
  const [activeTabs, setActiveTabs] = useState({}); // { employeeId: 'stubs' | 'attendance' }

  // API 호출 헤더 구성
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. 사업장 목록 가져오기
  const fetchCompanies = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/companies`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('사업장 목록을 가져오는 데 실패했습니다.');
      const data = await res.json();
      setCompanies(data);
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 직원 목록 가져오기
  const fetchEmployees = async (companyId) => {
    if (!companyId) return;
    try {
      const res = await fetch(`${API_URL}/api/employees?company_id=${companyId}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('직원 목록을 가져오는 데 실패했습니다.');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. 특정 직원의 급여명세서 히스토리 가져오기
  const fetchPayStubs = async (employeeId) => {
    try {
      const res = await fetch(`${API_URL}/api/pay-stubs?employee_id=${employeeId}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPayStubs(prev => ({ ...prev, [employeeId]: data }));
    } catch (err) {
      console.error('Failed to load pay stubs:', err);
    }
  };

  // 4. 특정 직원의 출퇴근(근태) 일지 가져오기
  const fetchAttendance = async (employeeId) => {
    try {
      const res = await fetch(`${API_URL}/api/attendance?employee_id=${employeeId}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAttendanceLogs(prev => ({ ...prev, [employeeId]: data }));
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [session]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchEmployees(selectedCompanyId);
      setExpandedEmployeeId(null);
    } else {
      setEmployees([]);
    }
  }, [selectedCompanyId]);

  // 특정 직원 카드가 열릴 때 명세서 및 근태 데이터 로드
  useEffect(() => {
    if (expandedEmployeeId) {
      fetchPayStubs(expandedEmployeeId);
      fetchAttendance(expandedEmployeeId);
      if (!activeTabs[expandedEmployeeId]) {
        setActiveTabs(prev => ({ ...prev, [expandedEmployeeId]: 'stubs' }));
      }
    }
  }, [expandedEmployeeId]);

  // 사업장 생성/수정
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      const method = companyModalMode === 'add' ? 'POST' : 'PUT';
      const endpoint = companyModalMode === 'add' 
        ? `${API_URL}/api/companies` 
        : `${API_URL}/api/companies/${companyForm.id}`;
      
      const res = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          company_name: companyForm.company_name,
          business_number: companyForm.business_number,
          size_type: companyForm.size_type
        })
      });

      if (!res.ok) throw new Error('사업장 처리 중 오류가 발생했습니다.');
      const data = await res.json();

      if (companyModalMode === 'add') {
        setCompanies([...companies, data]);
        setSelectedCompanyId(data.id);
      } else {
        setCompanies(companies.map(c => c.id === data.id ? data : c));
      }
      setShowCompanyModal(false);
      setCompanyForm({ id: '', company_name: '', business_number: '', size_type: '5인 미만' });
    } catch (err) {
      alert(err.message);
    }
  };

  // 사업장 삭제
  const handleCompanyDelete = async (companyId) => {
    if (!window.confirm('정말 이 사업장을 삭제하시겠습니까? 관련 직원 정보도 모두 삭제됩니다.')) return;
    try {
      const res = await fetch(`${API_URL}/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('사업장 삭제에 실패했습니다.');
      
      const updated = companies.filter(c => c.id !== companyId);
      setCompanies(updated);
      if (selectedCompanyId === companyId) {
        setSelectedCompanyId(updated.length > 0 ? updated[0].id : '');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 직원 추가/수정 제출
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = employeeModalMode === 'add' ? 'POST' : 'PUT';
      const endpoint = employeeModalMode === 'add' 
        ? `${API_URL}/api/employees` 
        : `${API_URL}/api/employees/${employeeForm.id}`;

      const res = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          company_id: selectedCompanyId,
          ...employeeForm
        })
      });

      if (!res.ok) throw new Error('직원 처리 중 오류가 발생했습니다.');
      const data = await res.json();

      if (employeeModalMode === 'add') {
        setEmployees([...employees, data]);
      } else {
        setEmployees(employees.map(emp => emp.id === data.id ? data : emp));
      }
      setShowEmployeeModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // 직원 삭제
  const handleEmployeeDelete = async (employeeId) => {
    if (!window.confirm('정말 이 직원을 목록에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('직원 삭제에 실패했습니다.');
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  // 직원 세부 노무 계산 함수 (기본값 설정용)
  const getEmployeeCalculations = (emp) => {
    if (!selectedCompany) return null;

    const totalWeeklyHours = Number(emp.weekly_work_days) * Number(emp.daily_work_hours);
    const calcYear = new Date().getFullYear();

    // 5인 이상 사업장 + 주 15시간 이상 근로자는 기본급/주휴수당뿐 아니라 연차수당·휴일근로수당까지
    // 시급 기준으로 자동 산정되도록 calculateYearlyEntryPay 사용 (시급/일급/주급/월급 계약 모두 동일하게 적용)
    const netDailyNight = Math.max(Number(emp.night_work_hours || 0) - (Number(emp.night_break_minutes || 0) / 60), 0);
    const weeklyNightHours = netDailyNight * Number(emp.weekly_work_days || 5);

    const salaryResult = calculateYearlyEntryPay({
      year: calcYear,
      salaryType: emp.salary_type,
      salaryAmount: emp.base_salary,
      companySize: selectedCompany.size_type,
      allowanceIncluded: '기본급 외 수당 모두 포함 (포괄임금)',
      scheduleType: '직접입력',
      directWeeklyWorkDays: emp.weekly_work_days,
      directWeeklyRegularHours: Math.min(totalWeeklyHours, 40),
      directWeeklyOvertimeHours: Math.max(totalWeeklyHours - 40, 0),
      directWeeklyNightHours: weeklyNightHours,
      directAvgDailyHours: emp.daily_work_hours,
      annualLeaveDays: Number(emp.annual_leave_days) || 0,
      holidayWorkDays: Number(emp.holiday_work_days) || 0,
      deductionType: '4대보험',
      workingDaysCount: Number(emp.weekly_work_days) * 4.345
    });

    const monthlyTotal = salaryResult.monthlyTotalPay || 0;
    const insuranceResult = calculateEmployerInsurance({
      monthlyWage: monthlyTotal,
      industrialAccidentRate: 0.7,
      year: calcYear
    });

    return {
      salaryResult,
      insuranceResult,
      totalWeeklyHours
    };
  };

  // -------------------------------------------------------------
  // 근태 관리 핸들러
  // -------------------------------------------------------------
  const openAttendanceModal = (emp) => {
    setActiveEmployeeForAttendance(emp);
    setAttendanceForm({
      work_date: new Date().toISOString().substring(0, 10),
      clock_in: '09:00',
      clock_out: '18:00',
      break_minutes: 60,
      status: '정상'
    });
    setShowAttendanceModal(true);
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmployeeForAttendance || !selectedCompany) return;

    try {
      // 근무시간 계산
      const [inH, inM] = attendanceForm.clock_in.split(':').map(Number);
      const [outH, outM] = attendanceForm.clock_out.split(':').map(Number);
      let inDecimal = inH + inM / 60;
      let outDecimal = outH + outM / 60;
      if (outDecimal <= inDecimal) outDecimal += 24; // 자정 교차
      const elapsed = outDecimal - inDecimal;
      const breakHours = attendanceForm.break_minutes / 60;
      const work_hours = Math.max(elapsed - breakHours, 0);

      const res = await fetch(`${API_URL}/api/attendance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          company_id: selectedCompany.id,
          employee_id: activeEmployeeForAttendance.id,
          work_date: attendanceForm.work_date,
          clock_in: `${attendanceForm.work_date}T${attendanceForm.clock_in}:00`,
          clock_out: `${attendanceForm.work_date}T${attendanceForm.clock_out}:00`,
          work_hours: Math.round(work_hours * 100) / 100,
          break_minutes: Number(attendanceForm.break_minutes),
          status: attendanceForm.status
        })
      });

      if (!res.ok) throw new Error('출퇴근 기록 등록에 실패했습니다.');
      
      alert('일별 근태 기록이 정상적으로 저장되었습니다.');
      setShowAttendanceModal(false);
      
      // 근태 데이터 다시 로드
      fetchAttendance(activeEmployeeForAttendance.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAttendanceDelete = async (logId, employeeId) => {
    if (!window.confirm('정말 이 출퇴근 기록을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_URL}/api/attendance/${logId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('삭제 실패');
      fetchAttendance(employeeId);
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // 급여명세서 발행 핸들러 (근태 연동 포함)
  // -------------------------------------------------------------
  const openStubModal = (emp, targetMonthOverride = null) => {
    const calcs = getEmployeeCalculations(emp);
    if (!calcs) return;

    setActiveEmployeeForStub(emp);
    
    // 대상 월 지정
    const targetMonth = targetMonthOverride || new Date().toISOString().substring(0, 7);

    // 해당 월의 출퇴근 기록 조회 및 집계
    const employeeLogs = attendanceLogs[emp.id] || [];
    const logsInMonth = employeeLogs.filter(log => log.work_date.startsWith(targetMonth) && log.status === '정상');
    
    let hourly_wage = calcs.salaryResult.baseHourlyWage || Number(emp.base_salary);
    let base_hours = calcs.salaryResult.regularWorkHoursMonthly || 174;
    let weekly_holiday_hours = calcs.salaryResult.weeklyHolidayHoursMonthly || 35;

    // 5인 이상 여부
    const is5Over = selectedCompany.size_type === '5인 이상';
    const overtimeMultiplier = is5Over ? 1.5 : 1.0;
    const nightMultiplier = is5Over ? 0.5 : 0.0;

    let overtime_hours = (calcs.salaryResult.overtimeHoursMonthly || 0) * overtimeMultiplier;
    let night_hours = (calcs.salaryResult.nightHoursMonthly || 0) * nightMultiplier;

    // 연차수당/휴일근로수당은 실제 출퇴근 기록과 무관하게 연간 등록일수를 1/12씩 매월 선지급하는 방식
    // (5인 이상 사업장 + 주 15시간 이상 근로자만 연차수당 대상, calculateYearlyEntryPay가 이미 판정)
    // 휴일근로는 하루 8시간 이내 1.5배 / 8시간 초과분 2.0배로 가산율이 시간대별로 갈리므로,
    // 이 화면의 "시간 × 시급 = 금액" 표시 규칙을 지키기 위해 정확한 금액(holidayWorkPay)을
    // 시급으로 나눠 역산한 가산 반영 시간으로 표시한다
    const holidayWorkPayFromCalc = calcs.salaryResult.holidayWorkPay || 0;
    const holiday_work_hours = hourly_wage > 0 ? Math.round((holidayWorkPayFromCalc / hourly_wage) * 100) / 100 : 0;
    const annual_leave_hours = calcs.salaryResult.leavePayHoursMonthly || 0;
    let extra_overtime_hours = 0;

    let base_pay = hourly_wage * base_hours;
    let weekly_holiday_pay = hourly_wage * weekly_holiday_hours;
    let overtime_pay = hourly_wage * overtime_hours;
    let night_pay = hourly_wage * night_hours;
    
    let isAutoCalculated = false;
    let attendanceSummary = '';

    if (logsInMonth.length > 0) {
      isAutoCalculated = true;
      const totalDays = logsInMonth.length;
      const totalHours = logsInMonth.reduce((sum, l) => sum + Number(l.work_hours), 0);
      
      let base_hours_val = totalHours;
      let overtime_hours_val = 0;
      
      if (totalHours > 174) {
        base_hours_val = 174;
        overtime_hours_val = (totalHours - 174) * overtimeMultiplier;
        attendanceSummary = `💡 ${targetMonth.split('-')[1]}월 출퇴근 일지 ${totalDays}일 분석 적용: 누적 ${totalHours}h 근무 (174h 초과 연장 ${(totalHours - 174).toFixed(2)}h 반영)`;
      } else {
        base_hours_val = totalHours;
        overtime_hours_val = 0;
        attendanceSummary = `💡 ${targetMonth.split('-')[1]}월 출퇴근 일지 ${totalDays}일 분석 적용: 누적 ${totalHours}h 근무 (174h 이하로 연장 없음)`;
      }

      base_hours = base_hours_val;
      overtime_hours = overtime_hours_val;

      // 주휴수당 계산: 174시간 대비 비례 산정 (최대 35시간)
      const avgWeeklyHours = (totalHours / totalDays) * emp.weekly_work_days;
      if (avgWeeklyHours >= 15) {
        weekly_holiday_hours = Math.min(Math.round((totalHours / 174) * 35 * 100) / 100, 35);
      } else {
        weekly_holiday_hours = 0;
      }
      
      base_pay = hourly_wage * base_hours;
      weekly_holiday_pay = hourly_wage * weekly_holiday_hours;
      overtime_pay = hourly_wage * overtime_hours;
      night_pay = hourly_wage * night_hours;
    }

    const otherAllowances = (calcs.salaryResult.mealAllowance || 0) + (calcs.salaryResult.carAllowance || 0) + (calcs.salaryResult.childcareAllowance || 0) + (calcs.salaryResult.otherNonTaxable || 0);
    const holiday_work_pay = hourly_wage * holiday_work_hours;
    const annual_leave_pay = hourly_wage * annual_leave_hours;
    const extra_overtime_pay = hourly_wage * extra_overtime_hours;

    const allowances_total = holiday_work_pay + annual_leave_pay + extra_overtime_pay + otherAllowances;
    const total_pay = base_pay + weekly_holiday_pay + overtime_pay + night_pay + allowances_total;
    
    const deductionYear = Number(targetMonth.split('-')[0]) || new Date().getFullYear();
    const deductions = applyDeductions(total_pay, deductionYear, total_pay, 0, '4대보험', logsInMonth.length || 20);
    const totalDeductions = deductions.totalDeductions;
    const net_pay = Math.max(total_pay - totalDeductions, 0);

    setStubForm({
      target_month: targetMonth,
      hourly_wage: Math.round(hourly_wage),
      base_hours: Math.round(base_hours * 100) / 100,
      weekly_holiday_hours: Math.round(weekly_holiday_hours * 100) / 100,
      overtime_hours: Math.round(overtime_hours * 100) / 100,
      night_hours: Math.round(night_hours * 100) / 100,
      holiday_work_hours,
      annual_leave_hours,
      extra_overtime_hours,
      base_pay: Math.round(base_pay),
      weekly_holiday_pay: Math.round(weekly_holiday_pay),
      overtime_pay: Math.round(overtime_pay),
      night_pay: Math.round(night_pay),
      allowances_total: otherAllowances,
      total_pay: Math.round(total_pay),
      national_pension: deductions.nationalPension,
      health_insurance: deductions.healthInsurance,
      long_term_care: deductions.longTermCare,
      employment_insurance: deductions.employmentInsurance,
      income_tax: deductions.incomeTax,
      local_income_tax: deductions.localIncomeTax,
      total_deductions: totalDeductions,
      net_pay: Math.round(net_pay),
      is_auto_calculated_from_attendance: isAutoCalculated,
      attendance_summary: attendanceSummary
    });
    
    setShowStubModal(true);
  };

  // 귀속월 변경 시 출퇴근 합산 자동 재트리거
  const handleTargetMonthChange = (newMonth) => {
    if (activeEmployeeForStub) {
      setShowStubModal(false);
      openStubModal(activeEmployeeForStub, newMonth);
    }
  };

  // 명세서 수동 수정 시 실시간 계산 연동
  const updateStubFields = (updatedFields) => {
    setStubForm(prev => {
      const merged = { ...prev, ...updatedFields };
      
      const wage = Number(merged.hourly_wage);
      const base_pay = Math.round(wage * Number(merged.base_hours));
      const weekly_holiday_pay = Math.round(wage * Number(merged.weekly_holiday_hours));
      const overtime_pay = Math.round(wage * Number(merged.overtime_hours));
      const night_pay = Math.round(wage * Number(merged.night_hours));
      
      const holiday_work_pay = Math.round(wage * Number(merged.holiday_work_hours));
      const annual_leave_pay = Math.round(wage * Number(merged.annual_leave_hours));
      const extra_overtime_pay = Math.round(wage * Number(merged.extra_overtime_hours));

      const allowances_total = holiday_work_pay + annual_leave_pay + extra_overtime_pay + Number(merged.allowances_total || 0);
      const total_pay = base_pay + weekly_holiday_pay + overtime_pay + night_pay + allowances_total;
      
      const deductionYear = Number((merged.target_month || '').split('-')[0]) || new Date().getFullYear();
      const deductions = applyDeductions(
        total_pay,
        deductionYear,
        total_pay,
        0,
        '4대보험',
        20
      );

      const total_deductions = 
        deductions.nationalPension + 
        deductions.healthInsurance + 
        deductions.longTermCare + 
        deductions.employmentInsurance + 
        deductions.incomeTax + 
        deductions.localIncomeTax;
      
      const net_pay = Math.max(total_pay - total_deductions, 0);

      return {
        ...merged,
        base_pay,
        weekly_holiday_pay,
        overtime_pay,
        night_pay,
        total_pay,
        national_pension: deductions.nationalPension,
        health_insurance: deductions.healthInsurance,
        long_term_care: deductions.longTermCare,
        employment_insurance: deductions.employmentInsurance,
        income_tax: deductions.incomeTax,
        local_income_tax: deductions.localIncomeTax,
        total_deductions,
        net_pay
      };
    });
  };

  // 급여명세서 저장 제출
  const handleStubSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmployeeForStub || !selectedCompany) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pay-stubs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          company_id: selectedCompany.id,
          employee_id: activeEmployeeForStub.id,
          ...stubForm
        })
      });

      if (!res.ok) throw new Error('급여명세서 발행에 실패했습니다.');
      const data = await res.json();
      
      alert(`${stubForm.target_month} 급여명세서가 성공적으로 발행 및 저장되었습니다.`);
      setShowStubModal(false);
      
      // 히스토리 리로드
      fetchPayStubs(activeEmployeeForStub.id);
    } catch (err) {
      alert(err.message);
    }
  };

  // 급여명세서 카카오톡 발송 요청
  const handleSendKakao = async (stubId, employeeId) => {
    if (!window.confirm('선택한 급여명세서를 직원의 카카오톡으로 전송하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_URL}/api/pay-stubs/${stubId}/send`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '발송 실패');
      alert(data.message);
      
      fetchPayStubs(employeeId);
    } catch (err) {
      alert(`발송 오류: ${err.message}`);
    }
  };

  // 급여명세서 삭제 요청
  const handleStubDelete = async (stubId, employeeId) => {
    if (!window.confirm('정말 이 급여명세서 내역을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_URL}/api/pay-stubs/${stubId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('삭제 실패');
      fetchPayStubs(employeeId);
    } catch (err) {
      alert(err.message);
    }
  };

  // 인쇄 전용 CSS 주입 및 트리거
  const triggerPrint = (stub, emp) => {
    setPrintStub({ stub, emp });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="page-container">
      {/* 인쇄 전용 레이아웃 영역 */}
      {printStub && (
        <div className="paystub-print-only" style={{ display: 'none' }}>
          <div style={{ padding: '2cm', color: '#000', background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', letterSpacing: '8px', textDecoration: 'underline', margin: '0 0 1rem 0' }}>급 여 명 세 서</h1>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', border: '2px solid #000' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2', width: '15%' }}>사업장명</td>
                  <td style={{ border: '1px solid #000', padding: '10px', width: '35%' }}>{selectedCompany?.company_name}</td>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2', width: '15%' }}>귀속년월</td>
                  <td style={{ border: '1px solid #000', padding: '10px', width: '35%' }}>{printStub.stub.target_month.split('-')[0]}년 {printStub.stub.target_month.split('-')[1]}월분</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2' }}>성 명</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{printStub.emp.name}</td>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2' }}>생년월일</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{printStub.emp.birthdate || '미등록'}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2' }}>연락처</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{printStub.emp.phone || '미등록'}</td>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', background: '#f2f2f2' }}>입사일자</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{printStub.emp.join_date || '미등록'}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }} colSpan={3}>지 급 항 목</th>
                  </tr>
                  <tr style={{ background: '#f9f9f9', fontSize: '0.85rem' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>구성 항목</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '30%' }}>월 근무시간</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '35%' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>기본급</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.base_hours || 0).toFixed(2)}h</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.base_pay).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>주휴수당</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.weekly_holiday_hours || 0).toFixed(2)}h</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.weekly_holiday_pay).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>연장근로수당</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.overtime_hours || 0).toFixed(2)}h</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.overtime_pay).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>야간근로수당</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.night_hours || 0).toFixed(2)}h</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.night_pay).toLocaleString()}원</td>
                  </tr>
                  {Number(printStub.stub.holiday_work_hours || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>휴일근무수당</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.holiday_work_hours).toFixed(2)}h</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.holiday_work_hours)).toLocaleString()}원</td>
                    </tr>
                  )}
                  {Number(printStub.stub.annual_leave_hours || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>연차수당</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.annual_leave_hours).toFixed(2)}h</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.annual_leave_hours)).toLocaleString()}원</td>
                    </tr>
                  )}
                  {Number(printStub.stub.extra_overtime_hours || 0) > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>추가연장수당</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{Number(printStub.stub.extra_overtime_hours).toFixed(2)}h</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.extra_overtime_hours)).toLocaleString()}원</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>기타수당</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>-</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>
                      {Number(
                        printStub.stub.allowances_total - (
                          Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.holiday_work_hours || 0)) + 
                          Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.annual_leave_hours || 0)) + 
                          Math.round(Number(printStub.stub.hourly_wage || 0) * Number(printStub.stub.extra_overtime_hours || 0))
                        )
                      ).toLocaleString()}원
                    </td>
                  </tr>
                  <tr style={{ background: '#fafafa', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '10px 12px' }}>지급액 합계</td>
                    <td style={{ border: '1px solid #000', padding: '10px 12px', textAlign: 'center' }}>
                      {(Number(printStub.stub.base_hours || 0) + Number(printStub.stub.weekly_holiday_hours || 0) + Number(printStub.stub.overtime_hours || 0) + Number(printStub.stub.night_hours || 0) + Number(printStub.stub.holiday_work_hours || 0) + Number(printStub.stub.annual_leave_hours || 0) + Number(printStub.stub.extra_overtime_hours || 0)).toFixed(2)}h
                    </td>
                    <td style={{ border: '1px solid #000', padding: '10px 12px', textAlign: 'right' }}>{Number(printStub.stub.total_pay).toLocaleString()}원</td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }} colSpan={2}>공 제 항 목</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>국민연금 (4.5%)</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.national_pension).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>건강보험 (3.545%)</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.health_insurance).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>장기요양보험 (12.95%)</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.long_term_care).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>고용보험 (0.9%)</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{Number(printStub.stub.employment_insurance).toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px 12px' }}>소득세 / 지방소득세</td>
                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>{(Number(printStub.stub.income_tax) + Number(printStub.stub.local_income_tax)).toLocaleString()}원</td>
                  </tr>
                  <tr style={{ background: '#fafafa', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '10px 12px' }}>공제액 합계</td>
                    <td style={{ border: '1px solid #000', padding: '10px 12px', textAlign: 'right' }}>{Number(printStub.stub.total_deductions).toLocaleString()}원</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '3rem' }}>
              <tbody>
                <tr style={{ background: '#f2f2f2', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <td style={{ border: '1px solid #000', padding: '15px 20px', width: '50%' }}>실 수 령 액 (세후)</td>
                  <td style={{ border: '1px solid #000', padding: '15px 20px', textAlign: 'right', color: '#d32f2f', width: '50%' }}>
                    {Number(printStub.stub.net_pay).toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '1rem' }}>
              <p>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1.5rem' }}>{selectedCompany?.company_name} 대표자 (인)</p>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .paystub-print-only, .paystub-print-only * {
            visibility: visible;
          }
          .paystub-print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      ` }} />

      {/* 헤더 */}
      <div className="tool-page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="tool-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={28} color="#fbbf24" /> 직원 관리 대시보드
        </h1>
        <p className="tool-page-desc">
          사업장별 직원을 간편하게 등록하고 관리할 수 있습니다. 
          직원의 급여 조건을 입력하면 최신 근로기준법에 따른 예상 월급여와 사업주 부담 4대보험이 실시간으로 집계됩니다.
        </p>
      </div>

      <UsageGuide guideKey="employees" />

      {/* 로그인 권장 배너 */}
      {!user && (
        <div className="info-callout warning" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="#fbbf24" />
            <div>
              <div style={{ fontWeight: 'bold', color: '#fef08a' }}>데모 모드 동작 중</div>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>로그인하시면 등록하신 사업장과 직원 정보를 클라우드에 평생 안전하게 저장하실 수 있습니다.</span>
            </div>
          </div>
          <button 
            type="button" 
            className="navbar-btn-primary" 
            onClick={openLoginModal}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            1초 로그인 / 회원가입
          </button>
        </div>
      )}

      {/* 사업장 관리 섹션 */}
      <section className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
            <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>사업장 선택</label>
            {companies.length > 0 ? (
              <select 
                className="text-input" 
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{ padding: '0.5rem', flex: 1, maxWidth: '300px' }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.size_type})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>등록된 사업장이 없습니다.</span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="navbar-btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#475569', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={() => {
                setCompanyModalMode('add');
                setCompanyForm({ id: '', company_name: '', business_number: '', size_type: '5인 미만' });
                setShowCompanyModal(true);
              }}
            >
              <Plus size={16} /> 사업장 등록
            </button>
            {selectedCompany && (
              <>
                <button 
                  type="button" 
                  className="navbar-btn-ghost" 
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    setCompanyModalMode('edit');
                    setCompanyForm({
                      id: selectedCompany.id,
                      company_name: selectedCompany.company_name,
                      business_number: selectedCompany.business_number || '',
                      size_type: selectedCompany.size_type
                    });
                    setShowCompanyModal(true);
                  }}
                  title="사업장 정보 수정"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  type="button" 
                  className="navbar-btn-ghost" 
                  style={{ padding: '0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleCompanyDelete(selectedCompanyId)}
                  title="사업장 삭제"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 직원 관리 상세 섹션 */}
      {selectedCompany ? (
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#f8fafc', fontWeight: 'bold' }}>
                {selectedCompany.company_name} 직원 목록 ({employees.length}명)
              </h3>
            </div>
            <button 
              type="button" 
              className="navbar-btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              onClick={() => {
                setEmployeeModalMode('add');
                setEmployeeForm({
                  id: '',
                  name: '',
                  birthdate: '',
                  phone: '',
                  join_date: '',
                  contract_type: '정규직',
                  salary_type: '월급',
                  base_salary: '3000000',
                  weekly_work_days: '5',
                  daily_work_hours: '8',
                  break_time_minutes: '60',
                  annual_leave_days: '0',
                  holiday_work_days: '0',
                  night_work_hours: '0',
                  night_break_minutes: '0'
                });
                setShowEmployeeModal(true);
              }}
            >
              <Plus size={16} /> 신규 직원 추가
            </button>
          </div>

          {employees.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {employees.map(emp => {
                const calcs = getEmployeeCalculations(emp);
                const isExpanded = expandedEmployeeId === emp.id;
                const stubs = payStubs[emp.id] || [];
                const logs = attendanceLogs[emp.id] || [];
                const currentTab = activeTabs[emp.id] || 'stubs';
                
                return (
                  <div 
                    key={emp.id} 
                    style={{ 
                      background: 'rgba(30, 41, 59, 0.5)', 
                      border: '1px solid rgba(255,255,255,0.06)', 
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* 상단 요약 요율정보 */}
                    <div 
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                      onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{emp.name}</strong>
                          <span style={{ fontSize: '0.75rem', background: '#334155', color: '#cbd5e1', padding: '2px 8px', borderRadius: '12px', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                            {emp.contract_type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span>{emp.salary_type} {Number(emp.base_salary).toLocaleString()}원</span>
                          <span>
                            주 {emp.weekly_work_days}일 (일 {emp.daily_work_hours}시간
                            {Number(emp.night_work_hours) > 0 && ` / 야간 ${emp.night_work_hours}h`}
                            {Number(emp.night_break_minutes) > 0 && ` [야간휴게 ${emp.night_break_minutes}분]`})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>기본 세전 예측액</div>
                          <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                            {calcs ? calcs.salaryResult.monthlyTotalPay.toLocaleString() : 0}원
                          </strong>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            type="button" 
                            className="navbar-btn-ghost" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmployeeModalMode('edit');
                              setEmployeeForm({
                                id: emp.id,
                                name: emp.name,
                                birthdate: emp.birthdate || '',
                                phone: emp.phone || '',
                                join_date: emp.join_date || '',
                                contract_type: emp.contract_type,
                                salary_type: emp.salary_type,
                                base_salary: String(emp.base_salary),
                                weekly_work_days: String(emp.weekly_work_days),
                                daily_work_hours: String(emp.daily_work_hours),
                                break_time_minutes: String(emp.break_time_minutes),
                                annual_leave_days: String(emp.annual_leave_days || 0),
                                holiday_work_days: String(emp.holiday_work_days || 0),
                                night_work_hours: String(emp.night_work_hours || 0),
                                night_break_minutes: String(emp.night_break_minutes || 0)
                              });
                              setShowEmployeeModal(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            type="button" 
                            className="navbar-btn-ghost" 
                            style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeDelete(emp.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 확장 상세 데이터 영역 */}
                    {isExpanded && calcs && (
                      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(15, 23, 42, 0.3)' }}>
                        
                        {/* 3가지 요약 카드 (급여, 세금, 인건비) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', color: '#6366f1', margin: '0 0 0.75rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <DollarSign size={14} /> 월 급여 예상 명세 (참고용)
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>기본급</span>
                                <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.basePay.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>주휴수당 {calcs.salaryResult.isEligibleForWeeklyBenefits ? '(대상)' : '(제외)'}</span>
                                <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.weeklyHolidayPay.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>연장근로수당 ({calcs.salaryResult.weeklyOvertimeHours}시간)</span>
                                <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.overtimePay.toLocaleString()}원</span>
                              </div>
                              {calcs.salaryResult.nightPay > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                  <span style={{ color: '#94a3b8' }}>야간근로수당 ({calcs.salaryResult.weeklyNightHours}시간)</span>
                                  <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.nightPay.toLocaleString()}원</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>연차수당 (선지급, {calcs.salaryResult.isEligibleForWeeklyBenefits ? `연 ${emp.annual_leave_days || 0}일` : '주 15h 미만 제외'})</span>
                                <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.leavePayMonthly.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>휴일근로수당 (선지급, 연 {emp.holiday_work_days || 0}일 · {selectedCompany.size_type === '5인 이상' ? '1.5배' : '1.0배'})</span>
                                <span style={{ color: '#cbd5e1' }}>{calcs.salaryResult.holidayWorkPay.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#f8fafc' }}>총 지급액 합계</span>
                                <span style={{ color: '#fbbf24' }}>{calcs.salaryResult.monthlyTotalPay.toLocaleString()}원</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', margin: '0 0 0.75rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={14} /> 공제 내역 & 실수령액
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>4대보험 합계</span>
                                <span style={{ color: '#cbd5e1' }}>-{calcs.salaryResult.totalInsurance.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>근로소득세 + 지방세</span>
                                <span style={{ color: '#cbd5e1' }}>-{calcs.salaryResult.totalTax.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#f8fafc' }}>예상 월 실수령액 (세후)</span>
                                <span style={{ color: '#34d399' }}>{calcs.salaryResult.monthlyNetPay.toLocaleString()}원</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.85rem', color: '#fbbf24', margin: '0 0 0.75rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> 사업주 부담 인건비 요약
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                <span style={{ color: '#94a3b8' }}>4대보험 사업주 부담액</span>
                                <span style={{ color: '#cbd5e1' }}>+{calcs.insuranceResult.totalEmployerBurden.toLocaleString()}원</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#f8fafc' }}>1인당 총 인건비</span>
                                <span style={{ color: '#fbbf24' }}>
                                  {(calcs.salaryResult.monthlyTotalPay + calcs.insuranceResult.totalEmployerBurden).toLocaleString()}원
                                </span>
                              </div>
                              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {emp.birthdate && <span>📅 생년월일: {emp.birthdate}</span>}
                                {emp.phone && <span>📞 연락처: {emp.phone}</span>}
                                {emp.join_date && <span>🚀 입사일: {emp.join_date}</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 탭 인터페이스 (명세서 내역 vs 출퇴근 근태일지) */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                            <button
                              type="button"
                              className={`navbar-btn-ghost ${currentTab === 'stubs' ? 'active' : ''}`}
                              style={{ 
                                padding: '0.4rem 1rem', 
                                fontSize: '0.8rem', 
                                borderBottom: currentTab === 'stubs' ? '2px solid #fbbf24' : 'none',
                                borderRadius: 0,
                                color: currentTab === 'stubs' ? '#fbbf24' : '#94a3b8'
                              }}
                              onClick={() => setActiveTabs({ ...activeTabs, [emp.id]: 'stubs' })}
                            >
                              급여명세서 내역 ({stubs.length}건)
                            </button>
                            <button
                              type="button"
                              className={`navbar-btn-ghost ${currentTab === 'attendance' ? 'active' : ''}`}
                              style={{ 
                                padding: '0.4rem 1rem', 
                                fontSize: '0.8rem', 
                                borderBottom: currentTab === 'attendance' ? '2px solid #818cf8' : 'none',
                                borderRadius: 0,
                                color: currentTab === 'attendance' ? '#818cf8' : '#94a3b8'
                              }}
                              onClick={() => setActiveTabs({ ...activeTabs, [emp.id]: 'attendance' })}
                            >
                              출퇴근 근태일지 ({logs.length}건)
                            </button>
                          </div>

                          {/* 탭 1: 급여명세서 */}
                          {currentTab === 'stubs' && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h5 style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, fontWeight: 'bold' }}>
                                  명세서 교부 관리
                                </h5>
                                <button
                                  type="button"
                                  className="navbar-btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => openStubModal(emp)}
                                >
                                  <Plus size={14} /> 명세서 신규 발행
                                </button>
                              </div>

                              {stubs.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {stubs.map(stub => (
                                    <div 
                                      key={stub.id} 
                                      style={{ 
                                        background: 'rgba(15, 23, 42, 0.4)', 
                                        padding: '0.75rem 1rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <strong style={{ color: '#fbbf24' }}>
                                          {stub.target_month.split('-')[0]}년 {stub.target_month.split('-')[1]}월분
                                        </strong>
                                        <span style={{ color: '#cbd5e1' }}>
                                          지급액: {Number(stub.total_pay).toLocaleString()}원
                                        </span>
                                        <span style={{ color: '#34d399' }}>
                                          실수령: {Number(stub.net_pay).toLocaleString()}원
                                        </span>
                                        <span style={{ 
                                          fontSize: '0.7rem', 
                                          padding: '2px 8px', 
                                          borderRadius: '12px',
                                          fontWeight: 'bold',
                                          background: stub.sent_status === '발송성공' ? 'rgba(52, 211, 153, 0.1)' : stub.sent_status === '발송실패' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                          color: stub.sent_status === '발송성공' ? '#34d399' : stub.sent_status === '발송실패' ? '#ef4444' : '#94a3b8'
                                        }}>
                                          {stub.sent_status}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                          type="button"
                                          className="navbar-btn-ghost"
                                          style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                                          onClick={() => triggerPrint(stub, emp)}
                                        >
                                          <Printer size={13} /> 인쇄
                                        </button>
                                        <button
                                          type="button"
                                          className="navbar-btn-ghost"
                                          style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#818cf8' }}
                                          onClick={() => handleSendKakao(stub.id, emp.id)}
                                        >
                                          <Send size={13} /> 카카오 알림톡 전송
                                        </button>
                                        <button
                                          type="button"
                                          className="navbar-btn-ghost"
                                          style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}
                                          onClick={() => handleStubDelete(stub.id, emp.id)}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem 0', textAlign: 'center' }}>
                                  발행된 급여명세서가 없습니다.
                                </div>
                              )}
                            </div>
                          )}

                          {/* 탭 2: 출퇴근 일지 */}
                          {currentTab === 'attendance' && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h5 style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, fontWeight: 'bold' }}>
                                  일별 근무 관리
                                </h5>
                                <button
                                  type="button"
                                  className="navbar-btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => openAttendanceModal(emp)}
                                >
                                  <Plus size={14} /> 출퇴근 등록
                                </button>
                              </div>

                              {logs.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                                  {logs.map(log => {
                                    // 타임스탬프 파싱해서 시간 추출
                                    const clockInTime = log.clock_in ? new Date(log.clock_in).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                                    const clockOutTime = log.clock_out ? new Date(log.clock_out).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                                    
                                    return (
                                      <div 
                                        key={log.id} 
                                        style={{ 
                                          background: 'rgba(15, 23, 42, 0.4)', 
                                          padding: '0.75rem', 
                                          borderRadius: '8px', 
                                          border: '1px solid rgba(255,255,255,0.04)',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        <div>
                                          <strong style={{ color: '#818cf8', display: 'block', marginBottom: '0.2rem' }}>
                                            {log.work_date} ({log.status})
                                          </strong>
                                          <div style={{ color: '#cbd5e1' }}>
                                            ⏱️ {clockInTime} ~ {clockOutTime} (휴게 {log.break_minutes}분)
                                          </div>
                                          <div style={{ color: '#fbbf24', marginTop: '0.1rem', fontWeight: 'bold' }}>
                                            실 근로: {log.work_hours}시간
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          className="navbar-btn-ghost"
                                          style={{ padding: '0.3rem', color: '#ef4444' }}
                                          onClick={() => handleAttendanceDelete(log.id, emp.id)}
                                          title="삭제"
                                        >
                                          <Trash size={14} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem 0', textAlign: 'center' }}>
                                  기록된 출퇴근 일지가 없습니다.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              <Users size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <div>등록된 직원이 없습니다. 새로운 직원을 추가해 주세요!</div>
            </div>
          )}
        </section>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
          <Briefcase size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <h3>사업장을 먼저 생성해 주세요</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
            직원 관리를 시작하기 위해서는 사업장 등록이 필요합니다. 5인 이상 여부 등 사업장 정보에 따라 노동법 계산 규정이 맞춤형으로 적용됩니다.
          </p>
          <button 
            type="button" 
            className="navbar-btn-primary"
            onClick={() => {
              setCompanyModalMode('add');
              setCompanyForm({ id: '', company_name: '', business_number: '', size_type: '5인 미만' });
              setShowCompanyModal(true);
            }}
          >
            <Plus size={16} /> 첫 사업장 등록하기
          </button>
        </div>
      )}

      {/* 사업장 모달 */}
      {showCompanyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', width: '90%', maxWidth: '450px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowCompanyModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', fontWeight: 'bold' }}>
              {companyModalMode === 'add' ? '새로운 사업장 등록' : '사업장 정보 수정'}
            </h3>
            
            <form onSubmit={handleCompanySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">사업장 이름 *</label>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="예: 강남지점, 노무체크 상사"
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">사업자 등록 번호 (선택)</label>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="예: 123-45-67890"
                  value={companyForm.business_number}
                  onChange={(e) => setCompanyForm({ ...companyForm, business_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">상시 근로자 규모 *</label>
                <select 
                  className="text-input"
                  value={companyForm.size_type}
                  onChange={(e) => setCompanyForm({ ...companyForm, size_type: e.target.value })}
                  style={{ padding: '0.85rem 0.5rem' }}
                >
                  <option value="5인 미만">5인 미만 사업장 (근로기준법 가산수당 제외 등 완화 적용)</option>
                  <option value="5인 이상">5인 이상 사업장 (연장/야간/휴일근로 가산 및 연차 등 전면 적용)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="navbar-btn-primary" 
                style={{ marginTop: '0.5rem', padding: '0.75rem' }}
              >
                저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 직원 모달 */}
      {showEmployeeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', width: '90%', maxWidth: '600px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setShowEmployeeModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', fontWeight: 'bold' }}>
              {employeeModalMode === 'add' ? '신규 직원 등록' : '직원 정보 수정'}
            </h3>

            <form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">이름 *</label>
                  <input 
                    type="text" 
                    className="text-input" 
                    value={employeeForm.name} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">연락처</label>
                  <input 
                    type="tel" 
                    placeholder="010-1234-5678"
                    className="text-input" 
                    value={employeeForm.phone} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">생년월일</label>
                  <input 
                    type="date" 
                    className="text-input" 
                    value={employeeForm.birthdate} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, birthdate: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">입사일</label>
                  <input 
                    type="date" 
                    className="text-input" 
                    value={employeeForm.join_date} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, join_date: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">근로 형태 *</label>
                  <select 
                    className="text-input" 
                    value={employeeForm.contract_type} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, contract_type: e.target.value })}
                    style={{ padding: '0.85rem 0.5rem' }}
                  >
                    <option value="정규직">정규직</option>
                    <option value="계약직">계약직</option>
                    <option value="알바">알바 (초단시간 근로 포함)</option>
                    <option value="프리랜서">프리랜서</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">급여 형태 *</label>
                  <select 
                    className="text-input" 
                    value={employeeForm.salary_type} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, salary_type: e.target.value })}
                    style={{ padding: '0.85rem 0.5rem' }}
                  >
                    <option value="월급">월급</option>
                    <option value="시급">시급</option>
                    <option value="일급">일급</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">급여 금액 (원) *</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    value={employeeForm.base_salary} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, base_salary: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">주당 근무일수 (일) *</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    value={employeeForm.weekly_work_days} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, weekly_work_days: e.target.value })}
                    min="1" max="7" required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">하루 소정 근로시간 (시간) *</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="text-input" 
                    value={employeeForm.daily_work_hours} 
                    onChange={(e) => setEmployeeForm({ ...employeeForm, daily_work_hours: e.target.value })}
                    min="1" max="24" required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">하루 휴게시간 (분) *</label>
                  <input
                    type="number"
                    className="text-input"
                    value={employeeForm.break_time_minutes}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, break_time_minutes: e.target.value })}
                    min="0" required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">연간 연차일수 (일)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={employeeForm.annual_leave_days}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, annual_leave_days: e.target.value })}
                    min="0"
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    입력 시 매월 1/12씩 연차수당으로 선지급됩니다. (주 15시간 미만 근로자는 자동 제외)
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">연간 휴일근로일수 (일)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={employeeForm.holiday_work_days}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, holiday_work_days: e.target.value })}
                    min="0"
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    입력 시 매월 1/12씩 휴일근로수당으로 선지급됩니다. (5인 이상 사업장은 1.5배 가산)
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">하루 평균 야간근무시간 (시간)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={employeeForm.night_work_hours}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, night_work_hours: e.target.value })}
                    min="0" max="24" step="0.1"
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    22:00 ~ 익일 06:00 사이에 정기적으로 근무하는 시간입니다.
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">하루 평균 야간휴게시간 (분)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={employeeForm.night_break_minutes}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, night_break_minutes: e.target.value })}
                    min="0" max="480"
                  />
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                    야간근무시간대 중 주어지는 휴게시간입니다. 야간근로수당 산정 시 차감됩니다.
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                className="navbar-btn-primary" 
                style={{ marginTop: '1rem', padding: '0.75rem' }}
              >
                직원 정보 저장
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 급여명세서 발행 모달 */}
      {showStubModal && activeEmployeeForStub && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', width: '90%', maxWidth: '700px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setShowStubModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#fbbf24" /> {activeEmployeeForStub.name} 급여명세서 작성 및 발행
            </h3>

            <form onSubmit={handleStubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 귀속월 선택 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">귀속 년월 *</label>
                  <input 
                    type="month" 
                    className="text-input" 
                    value={stubForm.target_month}
                    onChange={(e) => handleTargetMonthChange(e.target.value)}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem' }}>
                  <button
                    type="button"
                    className="navbar-btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => openStubModal(activeEmployeeForStub, stubForm.target_month)}
                  >
                    <RefreshCw size={12} /> 입력값 초기화 (기본 세팅)
                  </button>
                </div>
              </div>

              {/* 근태 연동 정보 안내 알림 */}
              {stubForm.is_auto_calculated_from_attendance && (
                <div className="info-callout info" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#60a5fa' }}>
                  <Sparkles size={16} color="#60a5fa" />
                  <span>{stubForm.attendance_summary}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                {/* 1. 지급 항목 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>1. 지급 항목 설정</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>시급:</span>
                      <input 
                        type="number" 
                        className="text-input" 
                        style={{ padding: '0.2rem 0.4rem', width: '85px', fontSize: '0.75rem', textAlign: 'right' }} 
                        value={stubForm.hourly_wage}
                        onChange={(e) => updateStubFields({ hourly_wage: e.target.value })}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>원</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                          <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'left' }}>구성</th>
                          <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'center', width: '35%' }}>지급시간 (h)</th>
                          <th style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right', width: '40%' }}>금액 (원)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>기본급</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.base_hours} onChange={(e) => updateStubFields({ base_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{stubForm.base_pay.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>주휴수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.weekly_holiday_hours} onChange={(e) => updateStubFields({ weekly_holiday_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{stubForm.weekly_holiday_pay.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>연장수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.overtime_hours} onChange={(e) => updateStubFields({ overtime_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{stubForm.overtime_pay.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>야간수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.night_hours} onChange={(e) => updateStubFields({ night_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{stubForm.night_pay.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>휴일근무수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.holiday_work_hours} onChange={(e) => updateStubFields({ holiday_work_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{Math.round(Number(stubForm.hourly_wage) * Number(stubForm.holiday_work_hours)).toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>연차수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.annual_leave_hours} onChange={(e) => updateStubFields({ annual_leave_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{Math.round(Number(stubForm.hourly_wage) * Number(stubForm.annual_leave_hours)).toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>추가연장수당</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" step="0.01" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }} value={stubForm.extra_overtime_hours} onChange={(e) => updateStubFields({ extra_overtime_hours: e.target.value })} />
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right' }}>{Math.round(Number(stubForm.hourly_wage) * Number(stubForm.extra_overtime_hours)).toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', fontWeight: 'bold' }}>기타수당 (입력)</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'center', color: '#64748b' }}>-</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '2px' }}>
                            <input type="number" className="text-input" style={{ padding: '2px 4px', fontSize: '0.75rem', textAlign: 'right' }} value={stubForm.allowances_total} onChange={(e) => updateStubFields({ allowances_total: e.target.value })} />
                          </td>
                        </tr>
                        <tr style={{ background: 'rgba(56, 189, 248, 0.05)', fontWeight: 'bold' }}>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', color: '#38bdf8' }}>합계</td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'center', color: '#fff' }}>
                            {(Number(stubForm.base_hours) + Number(stubForm.weekly_holiday_hours) + Number(stubForm.overtime_hours) + Number(stubForm.night_hours) + Number(stubForm.holiday_work_hours) + Number(stubForm.annual_leave_hours) + Number(stubForm.extra_overtime_hours)).toFixed(2)}h
                          </td>
                          <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '6px', textAlign: 'right', color: '#38bdf8' }}>
                            {stubForm.total_pay.toLocaleString()}원
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. 공제 항목 */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#f87171', margin: '0 0 1rem 0', fontWeight: 'bold' }}>2. 공제 항목 (자동 계산됨)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8' }}>국민연금 (4.5%)</span>
                      <span style={{ color: '#cbd5e1' }}>{stubForm.national_pension.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8' }}>건강보험 (3.545%)</span>
                      <span style={{ color: '#cbd5e1' }}>{stubForm.health_insurance.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8' }}>장기요양보험 (12.95%)</span>
                      <span style={{ color: '#cbd5e1' }}>{stubForm.long_term_care.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8' }}>고용보험 (0.9%)</span>
                      <span style={{ color: '#cbd5e1' }}>{stubForm.employment_insurance.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8' }}>소득세 + 지방세</span>
                      <span style={{ color: '#cbd5e1' }}>{(stubForm.income_tax + stubForm.local_income_tax).toLocaleString()}원</span>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                      <span style={{ color: '#f87171' }}>공제액 합계</span>
                      <span style={{ color: '#fff' }}>{stubForm.total_deductions.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 최종 실 수령액 */}
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                <span style={{ color: '#34d399' }}>실 수령액 (세후 실수령액)</span>
                <span style={{ color: '#fff', fontSize: '1.25rem' }}>{stubForm.net_pay.toLocaleString()}원</span>
              </div>

              <button 
                type="submit" 
                className="navbar-btn-primary" 
                style={{ padding: '0.75rem', fontSize: '0.9rem' }}
              >
                급여명세서 발행 및 저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 근태 등록 모달 */}
      {showAttendanceModal && activeEmployeeForAttendance && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', width: '90%', maxWidth: '450px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAttendanceModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock3 size={20} color="#818cf8" /> {activeEmployeeForAttendance.name} 출퇴근 기록 등록
            </h3>

            <form onSubmit={handleAttendanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">근무 날짜 *</label>
                <input 
                  type="date" 
                  className="text-input" 
                  value={attendanceForm.work_date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, work_date: e.target.value })}
                  required
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">출근 시간 *</label>
                  <input 
                    type="time" 
                    className="text-input" 
                    value={attendanceForm.clock_in}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, clock_in: e.target.value })}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">퇴근 시간 *</label>
                  <input 
                    type="time" 
                    className="text-input" 
                    value={attendanceForm.clock_out}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, clock_out: e.target.value })}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">휴게 시간 (분) *</label>
                <input 
                  type="number" 
                  className="text-input" 
                  value={attendanceForm.break_minutes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, break_minutes: Number(e.target.value) })}
                  min="0" required
                />
              </div>
              <div className="form-group">
                <label className="form-label">근무 상태 *</label>
                <select
                  className="text-input"
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  style={{ padding: '0.85rem 0.5rem' }}
                >
                  <option value="정상">정상 근무</option>
                  <option value="지각">지각</option>
                  <option value="조퇴">조퇴</option>
                  <option value="휴가">유급 휴가</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="navbar-btn-primary" 
                style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#818cf8' }}
              >
                기록 저장하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManager;
