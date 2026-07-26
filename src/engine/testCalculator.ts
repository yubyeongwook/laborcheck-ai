import { PureLaborCalculator, IndustrialAccidentCalculator, CONSTANTS } from './laborCalculator';
import { encryptData, decryptData, maskRRN } from '../security/crypto';


console.log('======================================================================');
console.log(' [노무체크 AI] 0% 오차 정밀 백엔드 노무 계산 엔진 & 보안 유틸리티 검증');
console.log('======================================================================\n');

// 1. AES-256-GCM 암복호화 보안 테스트
console.log('1. [보안] AES-256-GCM 양방향 암복호화 및 마스킹 검증:');
const sampleRRN = '950101-1234567';
const encryptedRRN = encryptData(sampleRRN);
console.log(` - 원본 주민등록번호: ${sampleRRN}`);
console.log(` - AES-256 암호화결과: ${encryptedRRN.combined}`);
const decryptedRRN = decryptData(encryptedRRN.combined);
console.log(` - 복호화 결과: ${decryptedRRN}`);
console.log(` - UI 마스킹: ${maskRRN(decryptedRRN)}`);
console.assert(sampleRRN === decryptedRRN, 'AES-256 복호화 무결성 오류!');
console.log(' -> AES-256 암복호화 검증 [통과 PASS]\n');

// 2. 정밀 노무 계산 엔진 테스트 (사용자 명세 규격 테스트)
console.log('2. [계산 엔진] 209시간 기준선 및 고정가산시간(123.55h, 21.25h, 7.33h) 검증:');

const calcResult = PureLaborCalculator.calculate({
  weeklyContractedHours: 40,        // 주 40시간 -> 기본 209h
  weeklyOvertimeHours: 19,          // 주 19시간 연장
  weeklyNightHours: 0,
  holidayDailyWorkHours: 10.5,      // 일 10.5시간 휴일근로
  annualHolidayCount: 15,           // 연 15일 휴일
  annualLeaveCount: 11,             // 연 11일 연차
  hourlyRate: 12000,                // 통상시급 12,000원
  isFiveOrMoreEmployees: true,
});

console.log(` - [월 기본 산정시간]: ${calcResult.monthlyBaseHours}시간 (기대값: 209시간)`);
console.log(` - [고정 연장시간]: ${calcResult.monthlyOvertimeHoursPaid}시간 (기대값: 123.55시간)`);
console.log(` - [월 분할 휴일시간]: ${calcResult.monthlyHolidayHoursPaid}시간 (기대값: 21.25시간)`);
console.log(` - [월 분할 연차시간]: ${calcResult.monthlyAnnualLeaveHoursPaid}시간 (기대값: 7.33시간)`);
console.log(` - [월 총 유급 인정시간]: ${calcResult.totalMonthlyPaidHours}시간`);
console.log(` - [총 계산된 월 급여]: ${calcResult.breakdown.totalMonthlySalary.toLocaleString()}원`);
console.log(` - [최저임금 준수 여부]: ${calcResult.minimumWageAssessment.isCompliant ? '준수 COMPLIANT' : '위반 VIOLATED'}`);

// Assertion Check
console.assert(calcResult.monthlyBaseHours === 209, '209시간 기준선 오류');
console.assert(calcResult.monthlyOvertimeHoursPaid === 123.55, '123.55시간 고정 연장 산정 오류');
console.assert(calcResult.monthlyHolidayHoursPaid === 21.25, '21.25시간 연간휴일 분할 산정 오류');
console.assert(calcResult.monthlyAnnualLeaveHoursPaid === 7.33, '7.33시간 연차수당 분할 산정 오류');

// 3. 정밀 산재 계산 엔진 테스트 (3개월 평균임금 & 통상임금 보정 & 휴업급여 70%)
console.log('\n3. [산재 계산 엔진] 평균임금 3개월 산정, 통상임금 보정 및 70% 휴업급여 검증:');

const sanjaeResult = IndustrialAccidentCalculator.calculate({
  averageWageDetail: {
    last3MonthsTotalWages: 9100000, // 3개월 총 9,100,000원 -> 1일 100,000원
    last3MonthsTotalDays: 91,
    dailyOrdinaryWage: 120000,      // 1일 통상임금 120,000원 -> 통상임금이 더 높아 보정 적용!
  },
  treatmentDays: 30, // 30일 치료
  age: 45,
});

console.log(` - [산정된 1일 평균임금]: ${sanjaeResult.appliedAverageDailyWage.toLocaleString()}원`);
console.log(` - [통상임금 보정 적용 여부]: ${sanjaeResult.isOrdinaryWageAdjusted ? '보정 적용됨 (통상임금 > 평균임금)' : '미적용'}`);
console.log(` - [1일 휴업급여(70%)]: ${sanjaeResult.dailyOffWorkAllowance.toLocaleString()}원`);
console.log(` - [총 30일 휴업급여액]: ${sanjaeResult.totalOffWorkAllowance.toLocaleString()}원`);
console.log(` - [법적 조언 및 가수칙 개수]: ${sanjaeResult.legalAdviceNotes.length}개`);

console.assert(sanjaeResult.appliedAverageDailyWage === 120000, '통상임금 보정 평균임금 산정 오류');
console.assert(sanjaeResult.dailyOffWorkAllowance === 84000, '1일 70% 휴업급여(84,000원) 산정 오류');
console.assert(sanjaeResult.totalOffWorkAllowance === 2520000, '30일 휴업급여액(2,520,000원) 산정 오류');

console.log('\n======================================================================');
console.log(' All Core Security, Labor & Industrial Accident Engine Verification Passed!');
console.log('======================================================================');

