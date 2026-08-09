const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');


// 환경변수 로드
dotenv.config();

const { createClient } = require('@supabase/supabase-js');

// Supabase API 설정
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase initialization failed in backend:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
// 클릭재킹, MIME 스니핑 등 기본적인 보안 헤더 적용 (순수 JSON API 서버라 CSP는 기본값 사용)
app.use(helmet());
// 허용된 출처(우리 사이트 + 로컬 개발 서버)에서만 브라우저 기반 요청을 받도록 제한.
// Origin 헤더가 없는 요청(서버 간 통신, curl 등)은 그대로 통과시킴.
const allowedOrigins = [
  process.env.SITE_URL || 'https://www.xn--ai-h74ir53a94vh9e.com',
  'https://xn--ai-h74ir53a94vh9e.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));
app.use(express.json());

// 브라우저 및 CDN 캐시 방지 미들웨어 (항상 최신 빌드 화면만 서빙)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 프론트엔드 정적 번들 자산 (JS, CSS) 우선 서빙
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));
app.use(express.static(path.join(__dirname, 'public')));



// Gemini API 설정
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.warn('⚠️ WARNING: GEMINI_API_KEY가 설정되지 않았거나 기본값입니다. .env 파일을 확인해 주세요.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// 카카오 알림톡 발송 자료 링크용 고정 사이트 주소 (클라이언트가 임의 URL을 주입하지 못하도록 서버에서 고정)
const SITE_URL = process.env.SITE_URL || 'https://www.xn--ai-h74ir53a94vh9e.com';

// Authorization 헤더의 Supabase Bearer 토큰을 검증해 로그인 사용자를 반환 (미로그인 시 null)
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
    try {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) return user;
    } catch (err) {
      console.error('Supabase JWT verification error:', err.message);
    }
  }
  return null;
}

// 카카오 발송 API 남용 방지를 위한 간단한 인메모리 요청 빈도 제한 (전화번호/IP 기준)
const kakaoRateLimitStore = new Map();
const KAKAO_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간
const KAKAO_RATE_LIMIT_MAX = 5; // 시간당 최대 5회

function checkKakaoRateLimit(key) {
  const now = Date.now();
  const timestamps = (kakaoRateLimitStore.get(key) || []).filter(t => now - t < KAKAO_RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= KAKAO_RATE_LIMIT_MAX) {
    kakaoRateLimitStore.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  kakaoRateLimitStore.set(key, timestamps);
  return true;
}

// Gemini AI 호출 API(계약서 분석 등) 남용 방지를 위한 IP 기준 요청 빈도 제한
const aiRateLimitStore = new Map();
const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간
const AI_RATE_LIMIT_MAX = 10; // 시간당 최대 10회

function checkAiRateLimit(key) {
  const now = Date.now();
  const timestamps = (aiRateLimitStore.get(key) || []).filter(t => now - t < AI_RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= AI_RATE_LIMIT_MAX) {
    aiRateLimitStore.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  aiRateLimitStore.set(key, timestamps);
  return true;
}

// 리포트 생성 API 엔드포인트
app.post('/api/generate-report', async (req, res) => {
  try {
    const { 
      user_type, 
      company_size, 
      work_hours, 
      issue_text,
      salary_type,
      salary_amount,
      allowance_included,
      daily_hours,
      weekly_days,
      break_time,
      pension_basis,
      extra_weekly_overtime,
      holiday_work_days,
      annual_leave_days,
      meal_allowance,
      car_allowance,
      childcare_allowance,
      other_non_taxable,
      taxable_allowance,
      file_data,  // Base64 데이터 URL 또는 순수 Base64
      file_mime,  // mimeType
      pattern1_days,
      pattern1_hours,
      pattern2_days,
      pattern2_hours,
      pattern3_days,
      pattern3_hours,
      weekly_night_hours,
      schedule_type,
      direct_weekly_work_days,
      direct_weekly_regular_hours,
      direct_weekly_overtime_hours,
      direct_weekly_night_hours,
      direct_avg_daily_hours,
      deduction_type,

      // 요일별 스케줄 데이터 추가
      mon_active, mon_start, mon_end, mon_break_h, mon_break_m, mon_night_break_h, mon_night_break_m,
      tue_active, tue_start, tue_end, tue_break_h, tue_break_m, tue_night_break_h, tue_night_break_m,
      wed_active, wed_start, wed_end, wed_break_h, wed_break_m, wed_night_break_h, wed_night_break_m,
      thu_active, thu_start, thu_end, thu_break_h, thu_break_m, thu_night_break_h, thu_night_break_m,
      fri_active, fri_start, fri_end, fri_break_h, fri_break_m, fri_night_break_h, fri_night_break_m,
      sat_active, sat_start, sat_end, sat_break_h, sat_break_m, sat_night_break_h, sat_night_break_m,
      sun_active, sun_start, sun_end, sun_break_h, sun_break_m, sun_night_break_h, sun_night_break_m
    } = req.body;

    // 입력값 검증
    if (!user_type || !company_size || !issue_text) {
      return res.status(400).json({ error: '필수 입력 변수(user_type, company_size, issue_text)가 누락되었습니다.' });
    }

    // Authorization 헤더 검증을 통한 로그인 상태 확인
    let isLoggedIn = false;
    const isSupabaseConfigured = !!supabase;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseConfigured) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          isLoggedIn = true;
        }
      } catch (err) {
        console.error('Supabase JWT verification error:', err.message);
      }
    }

    // 파일이 업로드된 경우 Gemini 인라인 데이터 파트로 변환
    let filePart = null;
    if (file_data && file_mime) {
      const base64DataOnly = file_data.includes(';base64,') 
        ? file_data.split(';base64,')[1] 
        : file_data;
      filePart = {
        inlineData: {
          data: base64DataOnly,
          mimeType: file_mime
        }
      };
    }

    // 시스템 프롬프트 구성 (멀티모달 맥락 반영)
    let systemPrompt = `너는 대한민국 노동법 자가진단 리포트를 작성하는 AI 어시스턴트다.
이 리포트는 법률 자문이 아니라, 사용자가 입력한 정보를 근로기준법 등 관련 법령에 대조해 정리하는 참고용 정보 리포트다.
너는 특정 노무사나 변호사를 소개, 연결, 알선하지 않는다.
너는 사건의 승패나 결과를 단정적으로 예측하지 않는다. "~할 가능성이 있습니다", "~로 판단될 여지가 있습니다" 등 참고적 표현만 사용한다.

[입력 변수]
- 사용자 유형: ${user_type} (근로자 / 사업주)
- 사업장 규모: ${company_size} (5인 미만 / 5인 이상)
- 기존 근무/급여 설명: ${work_hours || '상세 입력 참조'}
- 급여 유형 및 금액: ${salary_type || '미입력'} (${salary_amount ? Number(salary_amount).toLocaleString() : 0}원)
- 근로 시간 정보:
${schedule_type === '요일별' ? `  * 입력 방식: 요일별 상세 입력 (매일 근로시간이 다른 알바생 등)
  * 월요일: ${mon_active === true || mon_active === 'true' ? `근무함 (${mon_start}~${mon_end}, 휴게 ${mon_break_h || 0}시간 ${mon_break_m || 0}분, 야간휴게 ${mon_night_break_h || 0}시간 ${mon_night_break_m || 0}분)` : '근무 안함'}
  * 화요일: ${tue_active === true || tue_active === 'true' ? `근무함 (${tue_start}~${tue_end}, 휴게 ${tue_break_h || 0}시간 ${tue_break_m || 0}분, 야간휴게 ${tue_night_break_h || 0}시간 ${tue_night_break_m || 0}분)` : '근무 안함'}
  * 수요일: ${wed_active === true || wed_active === 'true' ? `근무함 (${wed_start}~${wed_end}, 휴게 ${wed_break_h || 0}시간 ${wed_break_m || 0}분, 야간휴게 ${wed_night_break_h || 0}시간 ${wed_night_break_m || 0}분)` : '근무 안함'}
  * 목요일: ${thu_active === true || thu_active === 'true' ? `근무함 (${thu_start}~${thu_end}, 휴게 ${thu_break_h || 0}시간 ${thu_break_m || 0}분, 야간휴게 ${thu_night_break_h || 0}시간 ${thu_night_break_m || 0}분)` : '근무 안함'}
  * 금요일: ${fri_active === true || fri_active === 'true' ? `근무함 (${fri_start}~${fri_end}, 휴게 ${fri_break_h || 0}시간 ${fri_break_m || 0}분, 야간휴게 ${fri_night_break_h || 0}시간 ${fri_night_break_m || 0}분)` : '근무 안함'}
  * 토요일: ${sat_active === true || sat_active === 'true' ? `근무함 (${sat_start}~${sat_end}, 휴게 ${sat_break_h || 0}시간 ${sat_break_m || 0}분, 야간휴게 ${sat_night_break_h || 0}시간 ${sat_night_break_m || 0}분)` : '근무 안함'}
  * 일요일: ${sun_active === true || sun_active === 'true' ? `근무함 (${sun_start}~${sun_end}, 휴게 ${sun_break_h || 0}시간 ${sun_break_m || 0}분, 야간휴게 ${sun_night_break_h || 0}시간 ${sun_night_break_m || 0}분)` : '근무 안함'}
  * 주당 총 야간 근로시간 (22시 ~ 익일 06시): ${weekly_night_hours || 0}시간
  * 평균 1일 근로시간: 하루 ${daily_hours || 0}시간, 주 ${weekly_days || 0}일 근무`
: schedule_type === '직접입력' ? `  * 입력 방식: 주/월 평균 직접 입력 (교대제/유동근로/알바 등)
  * 주 평균 근로일수: ${direct_weekly_work_days || 0}일/주
  * 하루 평균 소정근로시간 (수당 기준): ${direct_avg_daily_hours || 0}시간/일
  * 주 평균 총 소정근로시간: ${direct_weekly_regular_hours || 0}시간/주
  * 주 평균 연장근로시간: ${direct_weekly_overtime_hours || 0}시간/주
  * 주 평균 야간근로시간: ${direct_weekly_night_hours || 0}시간/주` : `  * 입력 방식: 요일/패턴별 입력 (고정 스케줄)
  * 패턴 1: 주 ${pattern1_days || 0}일, 하루 ${pattern1_hours || 0}시간 근무
  * 패턴 2: 주 ${pattern2_days || 0}일, 하루 ${pattern2_hours || 0}시간 근무 (선택)
  * 패턴 3: 주 ${pattern3_days || 0}일, 하루 ${pattern3_hours || 0}시간 근무 (선택)
  * 주당 총 야간 근로시간 (22시 ~ 익일 06시): ${weekly_night_hours || 0}시간
  * 평균 1일 근로시간: 하루 ${daily_hours || 0}시간, 주 ${weekly_days || 0}일 근무`}
- 휴게 시간 정보: 하루 ${break_time || 0}분 휴게
- 세부 추가근무 및 고정 공제 설정:
  * 국민연금 기준소득월액: ${pension_basis ? `${Number(pension_basis).toLocaleString()}원 (지정액)` : '미입력 (기본 소정급여 기준 자동 산정)'}
  * 주당 추가 연장근로시간: ${extra_weekly_overtime || 0}시간
  * 연간 휴일근로 일수: ${holiday_work_days || 0}일/년 (월 평균 ${(holiday_work_days / 12).toFixed(2)}일 분할 반영)
  * 연간 연차유급 일수: ${annual_leave_days || 0}일/년 (월 평균 ${(annual_leave_days / 12).toFixed(2)}일 분할 반영)
- 비과세 수당 (급여 총액에 포함, 세금·4대보험 산정에서는 제외되는 금액. 각 항목 월 20만원 한도, 초과분은 과세):
  * 식대: ${meal_allowance ? `${Number(meal_allowance).toLocaleString()}원` : '0원'}
  * 자가운전보조금: ${car_allowance ? `${Number(car_allowance).toLocaleString()}원` : '0원'}
  * 육아수당(6세 이하): ${childcare_allowance ? `${Number(childcare_allowance).toLocaleString()}원` : '0원'}
  * 기타 비과세: ${other_non_taxable ? `${Number(other_non_taxable).toLocaleString()}원` : '0원'}
- 과세 수당 (급여 총액에 포함되며, 비과세와 달리 세금·4대보험 산정 기준액에도 그대로 포함되는 금액. 직책수당·상여금 등): ${taxable_allowance ? `${Number(taxable_allowance).toLocaleString()}원` : '0원'}
- 근로계약서상 수당 포함 여부 (5인 이상 전용): ${company_size === '5인 이상' ? (allowance_included || '해당 없음/확인불가') : '해당 없음 (5인 미만)'}
- 세금 공제 구분 (4대보험/3.3% 프리랜서/일용직 세금): ${deduction_type || '4대보험'}
- 사연: ${issue_text}
- 첨부 파일 여부: ${filePart ? `있음 (MIME: ${file_mime}) - 이미지 또는 동영상 파일이 함께 입력되었습니다.` : '없음'}

[법령 대조 및 멀티모달 분석 유의 사항]
1. 근로기준법 제54조(휴게): 근로시간이 4시간인 경우 30분 이상, 8시간인 경우 1시간 이상의 휴게시간이 근로시간 도중에 주어져야 합니다. 사용자가 입력한 근로시간과 휴게시간을 비교하여 이 법적 기준에 미달하는지 짚어주어야 합니다.
2. 근로기준법 제56조(연장·야간 및 휴일 근로): 5인 이상 사업장의 경우 연장, 야간, 휴일 근로에 대해 50% 가산수당 지급 의무가 있습니다.
3. 포괄임금 약정 (수당 포함 여부 관련): 5인 이상 사업장에서 근로계약서상 각종 수당(연차, 연장, 야간, 휴일 등)이 포함되어 있다고 명시된 경우, 실제 제공한 연장근로 등에 따른 법정 가산수당 총액보다 포괄수당액이 적다면 차액을 지급해야 할 의무가 있으며, 유효한 포괄임금 약정인지 검토가 필요함을 지적하십시오.
4. **첨부 서류/영상 판독**: 만약 이미지(근로계약서, 임금명세서 등)나 동영상(구두 지시, 현장 증빙 등) 파일이 첨부된 경우, 해당 파일에서 추출할 수 있는 명시 조항이나 상황 증거를 정밀하게 분석하여 보고서의 [2. 관련 법령 대조] 섹션 밑에 **"■ 첨부 서류/영상 판독 결과"**로 내용을 상세히 기록해 주십시오.
5. **교대제/유동근로자 판정**: 사용자가 '주/월 평균 직접 입력'을 선택한 경우, 아르바이트나 교대근무 등으로 요일별 고정 스케줄이 없어 주/월 평균 근로시간을 직접 계측해 입력한 케이스입니다. 평균 입력값들을 토대로 법적 가산수당 요건 및 최저임금 준수 여부를 합리적으로 진단해주십시오. 명확한 요일 구분이 없더라도 주 평균 15시간 이상 근무 시 주휴수당 대상이라는 점 등을 활용하여 분석해야 합니다.
6. **세무 공제 방식별 리스크 판정**:
   - **4대보험 적용**: 일반 근로자 성격이 확실하며, 공제 및 실수령액의 정당성을 분석합니다.
   - **3.3% 프리랜서 (위장 프리랜서 리스크)**: 계약 형태는 프리랜서(사업소득)이지만 출퇴근 구속성, 지휘감독 여부 등 실질적인 '근로기준법상 근로자' 지위가 성립되는 경우 4대보험 당연가입 소급 및 퇴직금, 주휴수당, 가산수당 등의 청구 권리가 유효함을 리포트에 반영하고 리스크 여부를 짚어주십시오.
   - **일용직 (장기 근무 시 가입 리스크)**: 계속근로기간이 1개월 이상이면서 월 8일 이상 근무 시 건강보험 및 국민연금 당연 가입 의무가 생김을 상기하고, 일용직 형태의 명목상 신고로 퇴직금이나 연차 등의 권리를 누락하는 행위의 리스크를 진단하십시오.

[출력 규칙]
1. 이름, 연락처, 정확한 상호명, 구체적 주소는 [비식별 처리]로 표기한다.
2. 리포트 최하단에 다음 문구를 반드시 포함한다:
   "본 리포트는 AI가 생성한 참고용 정보이며 법률 자문이 아닙니다. 완전한 비식별·익명성을 보장하지 않으며, 구체적 사건 해결은 공인노무사·변호사 등 전문가와 직접 상담하시기 바랍니다."
3. 특정 전문가나 업체를 추천, 연결하는 문구를 포함하지 않는다.
4. 승소 확률, 확정적 처벌 수위 등 단정적 결론을 내리지 않는다.
5. 가독성을 위해 특수문자는 최소화하고 명확한 문장으로 작성한다.

[출력 구조]
# [자가진단 리포트]

## 1. 쟁점 요약
(사연에서 핵심 법적 쟁점만 3줄 이내로 정리)

## 2. 관련 법령 대조
(근로기준법, 최저임금법 등 관련 조문과 사연 내용 대조. 조문 번호 명시. 파일 첨부 시 판독 결과 기술)

## 3. 리스크/쟁점 수준 진단
- 근로자일 경우: 노동청 진정 시 예상 쟁점과 유의사항 (승소 확률 단정 금지)
- 사업주일 경우: 과태료/형사처벌 리스크 등급 (상/중/하) 및 근거

## 4. 다음 행동 체크리스트
(예: 노동청 진정 절차 순서, 준비해야 할 증거자료 목록, 기한 관련 주의사항)

## 5. 전문가 상담 권고
(구체적 사건 진행은 전문가 상담이 필요함을 안내. 특정 인물/업체명은 언급하지 않음)`;

    if (!isLoggedIn && isSupabaseConfigured) {
      systemPrompt += `

[CRITICAL INSTRUCTION]
이 사용자는 회원가입을 하지 않은 비로그인 사용자입니다. 
따라서 출력 구조 중 오직 '# [자가진단 리포트]'의 '## 1. 쟁점 요약' 섹션만 상세히 작성하십시오.
'## 2. 관련 법령 대조' 하단의 모든 섹션(2, 3, 4, 5번)의 내용물은 절대 적지 마시고, 오직 아래의 문구만 정확하게 적어 출력하십시오:
"🔒 상세 분석 정보는 회원가입 후 무료로 즉시 확인하실 수 있습니다."`;
    }

    // API 키가 없거나 기본값인 경우 데모 모드로 가상 리포트 반환
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
      console.log('ℹ️ GEMINI_API_KEY 미설정으로 데모 모드(Mock Report)를 작동합니다.');
      
      const calcWeeklyHours = (daily_hours || 0) * (weekly_days || 0);
      const isBreakTimeValid = (daily_hours > 8 && break_time >= 60) || (daily_hours > 4 && daily_hours <= 8 && break_time >= 30) || (daily_hours <= 4);
      
      // 파일 종류별 모의 판독 결과 구성
      let mockFileReport = '';
      if (file_data && file_mime) {
        if (file_mime.startsWith('image/')) {
          mockFileReport = `\n\n### 🔍 첨부 서류(이미지) 모의 판독 결과
- **판독 대상**: 근로계약서 / 임금 관련 증빙 서류 이미지
- **상세 분석**: 업로드된 계약 서류를 분석한 결과, 급여 총액 내역 중 '포괄임금 정액수당'이라는 명칭 아래 연장근로 20시간에 해당하는 금액이 사전 포괄되어 있음이 확인됩니다. 그러나 근로기준법상 법정 가산율(50% 가산)에 부합하는 명확한 기본시급 명시가 누락되어 있어 포괄 합의의 효력 자체가 법적으로 문제시될 수 있습니다.`;
        } else if (file_mime.startsWith('video/')) {
          mockFileReport = `\n\n### 🎥 첨부 영상(동영상) 모의 판독 결과
- **판독 대상**: 구두 약정 또는 근로 현장 관련 증빙 동영상
- **상세 분석**: 제출하신 동영상 파일의 음성 및 상황 분석에 의하면, 사용자가 주말 연장 근무에 대해 일정한 지시를 행하고 있음이 식별됩니다. 이는 구두로 연장 근로를 지시한 사실을 뒷받침하는 강력한 정황 증거가 될 수 있습니다. 다만 정산 청구를 위해서는 지시 사실뿐만 아니라 실제 실근로시간을 계측할 수 있는 메신저 기록이나 교통카드 등 추가 물증의 확보가 중요합니다.`;
        }
      }

      let mockReport = '';
      if (!isLoggedIn && isSupabaseConfigured) {
        mockReport = `# [자가진단 리포트] (데모 모드)

## 1. 쟁점 요약
1. 사용자가 입력한 조건: ${salary_type || '월급'} ${salary_amount ? Number(salary_amount).toLocaleString() : '0'}원, ${schedule_type === '요일별' ? '요일별 상세 스케줄' : `일 ${daily_hours || 0}시간 (주 ${weekly_days || 0}일)`}, 총 주 ${calcWeeklyHours}시간, 일 평균 휴게 ${break_time || 0}분
2. 핵심 쟁점: 5인 이상 사업장에서 근로계약서상 수당 포함 여부(${allowance_included || '미작성/모름'})와 실제 노동법상 의무(휴게시간 보장, 수당 추가 청구) 부합 여부가 주된 쟁점입니다.
3. 비식별화 검토: 사연 속의 고유 명칭(인명, 상호, 상세 주소 등)은 모두 [비식별 처리]로 처리되었습니다.

## 2. 관련 법령 대조
🔒 상세 분석 정보는 회원가입 후 무료로 즉시 확인하실 수 있습니다.

## 3. 리스크/쟁점 수준 진단
🔒 상세 분석 정보는 회원가입 후 무료로 즉시 확인하실 수 있습니다.

## 4. 다음 행동 체크리스트
🔒 상세 분석 정보는 회원가입 후 무료로 즉시 확인하실 수 있습니다.

## 5. 전문가 상담 권고
🔒 상세 분석 정보는 회원가입 후 무료로 즉시 확인하실 수 있습니다.`;
      } else {
        mockReport = `# [자가진단 리포트] (데모 모드)

## 1. 쟁점 요약
1. 사용자가 입력한 조건: ${salary_type || '월급'} ${salary_amount ? Number(salary_amount).toLocaleString() : '0'}원, ${schedule_type === '요일별' ? '요일별 상세 스케줄' : `일 ${daily_hours || 0}시간 (주 ${weekly_days || 0}일)`}, 총 주 ${calcWeeklyHours}시간, 일 평균 휴게 ${break_time || 0}분
2. 핵심 쟁점: 5인 이상 사업장에서 근로계약서상 수당 포함 여부(${allowance_included || '미작성/모름'})와 실제 노동법상 의무(휴게시간 보장, 수당 추가 청구) 부합 여부가 주된 쟁점입니다.
3. 비식별화 검토: 사연 속의 고유 명칭(인명, 상호, 상세 주소 등)은 모두 [비식별 처리]로 처리되었습니다.

## 2. 관련 법령 대조
- **근로기준법 제54조 (휴게)**: 사용자는 근로시간이 4시간인 경우에는 30분 이상, 8시간인 경우에는 1시간 이상의 휴게시간을 근로시간 도중에 주어야 합니다. 
  * 현재 조건: 일 평균 ${daily_hours || 0}시간 근로 대비 휴게시간이 ${break_time || 0}분으로 설정되어 있어, ${isBreakTimeValid ? '법적 휴게 의무 기준에 부합하는 것으로 판단됩니다.' : '현행법상 휴게시간 최저 기준에 미달하여 법 위반 소지가 있을 수 있습니다.'}
- **근로기준법 제17조 및 제56조 (수당 포괄 포함 검토)**: 
  * ${company_size === '5인 이상' ? `5인 이상 사업장이므로 연장·야간·휴일근로에 대한 가산 의무가 전면 적용됩니다. 근로계약서상 수당 포함 합의('${allowance_included}')가 있더라도, 실제 발생한 가산수당 기준 금액이 계약서상 명시된 정액 수당보다 크다면 그 차액에 대해 임금체불 소지가 발생할 수 있습니다.` : '5인 미만 사업장이므로 연장·야간·휴일 가산 수당(50% 가산) 의무는 법적으로 강제되지 않습니다.'}
- **세무 신고 방식에 따른 법적 리스크 (${deduction_type || '4대보험'})**:
  * ${deduction_type === '3.3%' ? '현재 3.3% 프리랜서로 신고 및 공제되고 있습니다. 형식은 사업소득자이나 사용자의 업무 지시를 받아 출퇴근이 지정되고 지휘감독을 받는 경우, 실질 근로자성이 성립됩니다. 이 경우 퇴직금, 주휴수당, 연차수당 및 가산근로수당 청구권이 보장되며, 4대보험 소급 가입으로 인한 대규모 과태료 및 보조금 징수 리스크가 회사 측에 부과될 수 있습니다.' : deduction_type === '일용직' ? '현재 일용직으로 신고 및 공제되고 있습니다. 일용근로자라 하더라도 1개월 이상 계속 일하고 한 달에 8일 이상 근무 시 건강보험 및 국민연금 당연 가입 대상입니다. 이를 누락할 시 소급 가입 지시 및 보험료 정산 리스크가 발생합니다.' : '일반적인 4대보험 가입 근로자이며, 근로자 지위 및 근로기준법상 모든 혜택이 정상적으로 인정되는 근무 관계입니다.'}

## 3. 리스크/쟁점 수준 진단
${user_type === '근로자' 
  ? `- **근로자 입장 진단**: 노동청 진정 시 예상 쟁점은 근로계약서상의 수당 포함 약정이 유효한 포괄임금제에 해당하는지 여부 및 실제 근로시간을 객관적 자료로 증명하는 것입니다. 승소 및 추가 청구 가능 여부는 객관적 출퇴근 기록 등의 증거 자료 확보율에 따라 달라질 여지가 있습니다.` 
  : `- **사업주 입장 진단**: 리스크 등급 [중]. 근거: 5인 이상 사업장에서 수당을 포괄로 명시해 두었으나 실제 근무 시간과 대조하여 미달분이 있거나, 휴게시간 법적 규정 위반이 확인될 경우 행정 시정지시 및 형사적 처벌 리스크가 존재할 수 있습니다.`}

## 4. 다음 행동 체크리스트
1. **근로계약서 세부 검토**: 계약서에 명시된 기본급 및 제수당의 구체적 산정 방식(연장 근로시간 등)을 체크
2. **근로시간 입증자료 확보**: 실제 출퇴근 시간 기록(지문 인식, 출근부, 교통카드 내역 등), 휴게시간 미보장 시 이를 증명할 업무 지시 이력 확보
3. **전문가와 상담 진행**: 분쟁 금액 및 입증 자료의 적절성을 확인하기 위한 관서 방문 전 조력 구하기

## 5. 전문가 상담 권고
본 리포트는 기재해주신 개략적인 정보를 근거로 노동법상의 일반론적인 기준에 비추어 작성되었습니다. 실제 분쟁 상황에서는 계약의 구체적 문구, 근무 형태, 실근로시간 입증 가능성에 따라 법적 평가가 현저히 달라질 수 있으므로, 최종적인 법적 대응 이전에 공인노무사 또는 변호사 등 자격을 갖춘 전문가의 정밀 조력을 반드시 받아보시기 바랍니다.

본 리포트는 AI가 생성한 참고용 정보이며 법률 자문이 아닙니다. 완전한 비식별·익명성을 보장하지 않으며, 구체적 사건 해결은 공인노무사·변호사 등 전문가와 직접 상담하시기 바랍니다.`;

      }
      return res.json({ report: mockReport });
    }

    // LLM 호출 (gemini-2.5-flash 사용) - 첨부파일이 있으면 반드시 함께 전달해야 실제로 판독함
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(filePart ? [systemPrompt, filePart] : systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ report: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: '리포트 생성 도중 오류가 발생했습니다.', details: error.message });
  }
});

// 카카오 알림톡/문자 발송 API 엔드포인트
app.post('/api/send-kakao', async (req, res) => {
  try {
    const { phone, type, data } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '수신인 휴대폰 번호가 누락되었습니다.' });
    }
    if (type !== 'signup' && type !== 'download') {
      return res.status(400).json({ error: '올바르지 않은 메시지 발송 형식(type)입니다.' });
    }

    // 휴대폰 번호 정규화 (숫자만 추출) 및 형식 검증
    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();
    if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: '올바른 휴대폰 번호 형식이 아닙니다.' });
    }

    // 리포트 다운로드 링크 발송은 임의 번호로 피싱 링크를 뿌리는 것을 막기 위해 로그인 사용자만 허용
    const authedUser = await getAuthenticatedUser(req);
    if (type === 'download' && !authedUser) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    // 남용 방지를 위한 요청 빈도 제한 (전화번호/IP 기준 시간당 5회)
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkKakaoRateLimit(`phone:${cleanPhone}`) || !checkKakaoRateLimit(`ip:${clientIp}`)) {
      return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
    }

    // 환경 변수에서 Solapi API 키 등 설정 로드
    const solapiApiKey = process.env.SOLAPI_API_KEY || '';
    const solapiApiSecret = process.env.SOLAPI_API_SECRET || '';
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER || '';
    const kakaoChannelId = process.env.SOLAPI_CHANNEL_ID || '';
    
    // 알림톡 템플릿 코드
    const templateSignup = process.env.SOLAPI_TEMPLATE_SIGNUP || 'TPL_SIGNUP_WELCOME';
    const templateDownload = process.env.SOLAPI_TEMPLATE_DOWNLOAD || 'TPL_DOWNLOAD_REPORT';

    let text = '';
    let templateId = '';

    if (type === 'signup') {
      templateId = templateSignup;
      text = `[노무체크 AI] 회원가입을 진심으로 축하드립니다!\n\n근로자와 사업주를 위한 법정 노무 계산기 및 AI 자가진단 리포트 작성을 이제 무료로 무제한 이용하실 수 있습니다.\n\n- 공식 홈페이지: https://www.xn--ai-h74ir53a94vh9e.com`;
    } else {
      templateId = templateDownload;
      // 자료명은 표시용으로만 사용하고, 줄바꿈 제거 및 길이 제한으로 메시지 본문 조작을 방지
      const reportTitle = (typeof data?.title === 'string' && data.title.trim())
        ? data.title.replace(/[\r\n]+/g, ' ').slice(0, 60)
        : '노무 자가진단 리포트';
      // 링크는 클라이언트 입력을 신뢰하지 않고 서버에서 고정된 자사 도메인만 사용 (피싱 링크 주입 방지)
      const downloadUrl = SITE_URL;
      text = `[노무체크 AI] 요청하신 분석 자료의 확인 링크가 준비되었습니다.\n\n- 자료명: ${reportTitle}\n- 바로가기 링크: ${downloadUrl}\n\n* 언제든지 링크에 접속하여 상세 분석 리포트를 다시 확인할 수 있습니다.`;
    }

    // Solapi API 키가 설정되지 않았거나 기본값인 경우 데모 모드로 가상 발송 로그 출력
    if (!solapiApiKey || solapiApiKey === 'your_solapi_key_here' || solapiApiKey === '') {
      console.log('\n=========================================');
      console.log('ℹ️ [데모 모드] 카카오톡 알림톡 발송 내역');
      console.log(`- 수신자 번호: ${cleanPhone}`);
      console.log(`- 발송 유형: ${type === 'signup' ? '회원가입 환영' : '자료 다운로드 링크'}`);
      console.log(`- 템플릿 ID: ${templateId}`);
      console.log(`- 발송 메시지 본문:\n${text}`);
      console.log('=========================================\n');
      
      return res.json({ 
        success: true, 
        message: '데모 모드로 알림톡 전송이 가상으로 성공 처리되었습니다. (서버 콘솔에서 메시지 로그를 확인할 수 있습니다.)', 
        mock: true,
        details: { phone: cleanPhone, type, text }
      });
    }

    // Solapi API 연동 전송 처리 (HMAC SHA256 서명 사용)
    const crypto = require('crypto');
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', solapiApiSecret)
      .update(date + salt)
      .digest('hex');

    const authHeader = `HMAC-SHA256 apiKey=${solapiApiKey}, date=${date}, salt=${salt}, signature=${signature}`;

    const payload = {
      message: {
        to: cleanPhone,
        from: senderNumber,
        text: text,
        kakaoOptions: {
          pfId: kakaoChannelId,
          templateId: templateId
        }
      }
    };

    // fetch를 활용하여 Solapi 발송 요청
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.errorMessage || '알림톡 발송 중 API 오류가 발생했습니다.');
    }

    return res.json({ success: true, result });
  } catch (error) {
    console.error('Kakao notification API error:', error);
    res.status(500).json({ error: '카카오톡 메시지 발송 도중 오류가 발생했습니다.', details: error.message });
  }
});


// In-memory mock storage for demo mode
let mockCompanies = [
  { id: 'demo-company-id-1', owner_id: 'demo-user', company_name: '(데모) 노무체크 상사', business_number: '123-45-67890', size_type: '5인 이상', created_at: new Date() }
];
let mockEmployees = [
  { id: 'demo-emp-id-1', company_id: 'demo-company-id-1', name: '홍길동', birthdate: '1990-01-01', phone: '010-1234-5678', join_date: '2023-01-01', contract_type: '정규직', salary_type: '월급', base_salary: 3000000, weekly_work_days: 5, daily_work_hours: 8, break_time_minutes: 60, annual_leave_days: 15, holiday_work_days: 0, night_work_hours: 0, night_break_minutes: 0, created_at: new Date() },
  { id: 'demo-emp-id-2', company_id: 'demo-company-id-1', name: '김철수', birthdate: '1995-05-15', phone: '010-9876-5432', join_date: '2024-03-01', contract_type: '알바', salary_type: '시급', base_salary: 10030, weekly_work_days: 3, daily_work_hours: 6, break_time_minutes: 30, annual_leave_days: 6, holiday_work_days: 1, night_work_hours: 0, night_break_minutes: 0, created_at: new Date() }
];

// Helper to check if Supabase is configured
const isSupabaseEnabled = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here';
};

// Helper to create client with request authorization header
function getSupabaseClient(req) {
  if (!isSupabaseEnabled()) return null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return null;
}

// -------------------------------------------------------------
// [사업장 CRUD API]
// -------------------------------------------------------------

// 사업장 목록 조회
app.get('/api/companies', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return res.json(data);
    } else {
      return res.json(mockCompanies);
    }
  } catch (error) {
    console.error('GET /api/companies error:', error);
    res.status(500).json({ error: '사업장 목록을 가져오는 데 실패했습니다.', details: error.message });
  }
});

// 사업장 등록
app.post('/api/companies', async (req, res) => {
  try {
    const { company_name, business_number, size_type } = req.body;
    if (!company_name) {
      return res.status(400).json({ error: '사업장 이름은 필수입니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('companies')
        .insert([{ 
          owner_id: user.id, 
          company_name, 
          business_number, 
          size_type: size_type || '5인 미만' 
        }])
        .select();
      
      if (error) throw error;
      return res.status(201).json(data[0]);
    } else {
      const newCompany = {
        id: `demo-company-id-${Date.now()}`,
        owner_id: 'demo-user',
        company_name: `(데모) ${company_name}`,
        business_number,
        size_type: size_type || '5인 미만',
        created_at: new Date()
      };
      mockCompanies.push(newCompany);
      return res.status(201).json(newCompany);
    }
  } catch (error) {
    console.error('POST /api/companies error:', error);
    res.status(500).json({ error: '사업장 등록에 실패했습니다.', details: error.message });
  }
});

// 사업장 수정
app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, business_number, size_type } = req.body;
    
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('companies')
        .update({ company_name, business_number, size_type })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: '수정할 사업장을 찾을 수 없거나 권한이 없습니다.' });
      }
      return res.json(data[0]);
    } else {
      const idx = mockCompanies.findIndex(c => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: '수정할 사업장을 찾을 수 없습니다.' });
      }
      mockCompanies[idx] = { ...mockCompanies[idx], company_name, business_number, size_type };
      return res.json(mockCompanies[idx]);
    }
  } catch (error) {
    console.error('PUT /api/companies/:id error:', error);
    res.status(500).json({ error: '사업장 수정에 실패했습니다.', details: error.message });
  }
});

// 사업장 삭제
app.delete('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { error } = await dbClient
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.json({ success: true, message: '사업장이 성공적으로 삭제되었습니다.' });
    } else {
      mockCompanies = mockCompanies.filter(c => c.id !== id);
      mockEmployees = mockEmployees.filter(e => e.company_id !== id);
      return res.json({ success: true, message: '데모 사업장이 성공적으로 삭제되었습니다.' });
    }
  } catch (error) {
    console.error('DELETE /api/companies/:id error:', error);
    res.status(500).json({ error: '사업장 삭제에 실패했습니다.', details: error.message });
  }
});


// -------------------------------------------------------------
// [직원 CRUD API]
// -------------------------------------------------------------

// 특정 사업장의 직원 목록 조회
app.get('/api/employees', async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id 쿼리 파라미터가 필요합니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('employees')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return res.json(data);
    } else {
      const emps = mockEmployees.filter(e => e.company_id === company_id);
      return res.json(emps);
    }
  } catch (error) {
    console.error('GET /api/employees error:', error);
    res.status(500).json({ error: '직원 목록을 가져오는 데 실패했습니다.', details: error.message });
  }
});

// 직원 등록
app.post('/api/employees', async (req, res) => {
  try {
    const {
      company_id, name, birthdate, phone, join_date,
      contract_type, salary_type, base_salary,
      weekly_work_days, daily_work_hours, break_time_minutes,
      annual_leave_days, holiday_work_days,
      night_work_hours, night_break_minutes
    } = req.body;

    if (!company_id || !name) {
      return res.status(400).json({ error: 'company_id와 name은 필수 입력 항목입니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('employees')
        .insert([{
          company_id, name, birthdate: birthdate || null, phone, join_date: join_date || null,
          contract_type: contract_type || '정규직', salary_type: salary_type || '월급',
          base_salary: Number(base_salary) || 0,
          weekly_work_days: Number(weekly_work_days) || 5,
          daily_work_hours: Number(daily_work_hours) || 8,
          break_time_minutes: Number(break_time_minutes) || 60,
          annual_leave_days: Number(annual_leave_days) || 0,
          holiday_work_days: Number(holiday_work_days) || 0,
          night_work_hours: Number(night_work_hours) || 0,
          night_break_minutes: Number(night_break_minutes) || 0
        }])
        .select();
      
      if (error) throw error;
      return res.status(201).json(data[0]);
    } else {
      const newEmp = {
        id: `demo-emp-id-${Date.now()}`,
        company_id,
        name,
        birthdate,
        phone,
        join_date,
        contract_type: contract_type || '정규직',
        salary_type: salary_type || '월급',
        base_salary: Number(base_salary) || 0,
        weekly_work_days: Number(weekly_work_days) || 5,
        daily_work_hours: Number(daily_work_hours) || 8,
        break_time_minutes: Number(break_time_minutes) || 60,
        annual_leave_days: Number(annual_leave_days) || 0,
        holiday_work_days: Number(holiday_work_days) || 0,
        night_work_hours: Number(night_work_hours) || 0,
        night_break_minutes: Number(night_break_minutes) || 0,
        created_at: new Date()
      };
      mockEmployees.push(newEmp);
      return res.status(201).json(newEmp);
    }
  } catch (error) {
    console.error('POST /api/employees error:', error);
    res.status(500).json({ error: '직원 등록에 실패했습니다.', details: error.message });
  }
});

// 직원 정보 수정
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, birthdate, phone, join_date,
      contract_type, salary_type, base_salary,
      weekly_work_days, daily_work_hours, break_time_minutes,
      annual_leave_days, holiday_work_days,
      night_work_hours, night_break_minutes
    } = req.body;

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('employees')
        .update({
          name, birthdate: birthdate || null, phone, join_date: join_date || null,
          contract_type, salary_type, base_salary: Number(base_salary),
          weekly_work_days: Number(weekly_work_days),
          daily_work_hours: Number(daily_work_hours),
          break_time_minutes: Number(break_time_minutes),
          annual_leave_days: Number(annual_leave_days) || 0,
          holiday_work_days: Number(holiday_work_days) || 0,
          night_work_hours: Number(night_work_hours) || 0,
          night_break_minutes: Number(night_break_minutes) || 0
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: '수정할 직원 정보를 찾을 수 없거나 권한이 없습니다.' });
      }
      return res.json(data[0]);
    } else {
      const idx = mockEmployees.findIndex(e => e.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: '수정할 직원 정보를 찾을 수 없습니다.' });
      }
      mockEmployees[idx] = {
        ...mockEmployees[idx],
        name, birthdate, phone, join_date,
        contract_type, salary_type, base_salary: Number(base_salary),
        weekly_work_days: Number(weekly_work_days),
        daily_work_hours: Number(daily_work_hours),
        break_time_minutes: Number(break_time_minutes),
        annual_leave_days: Number(annual_leave_days) || 0,
        holiday_work_days: Number(holiday_work_days) || 0,
        night_work_hours: Number(night_work_hours) || 0,
        night_break_minutes: Number(night_break_minutes) || 0
      };
      return res.json(mockEmployees[idx]);
    }
  } catch (error) {
    console.error('PUT /api/employees/:id error:', error);
    res.status(500).json({ error: '직원 정보 수정에 실패했습니다.', details: error.message });
  }
});

// 직원 삭제
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { error } = await dbClient
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.json({ success: true, message: '직원이 성공적으로 삭제되었습니다.' });
    } else {
      mockEmployees = mockEmployees.filter(e => e.id !== id);
      return res.json({ success: true, message: '데모 직원이 성공적으로 삭제되었습니다.' });
    }
  } catch (error) {
    console.error('DELETE /api/employees/:id error:', error);
    res.status(500).json({ error: '직원 삭제에 실패했습니다.', details: error.message });
  }
});


let mockPayStubs = [
  {
    id: 'demo-stub-id-1',
    company_id: 'demo-company-id-1',
    employee_id: 'demo-emp-id-1',
    target_month: '2026-06',
    base_pay: 2750000,
    weekly_holiday_pay: 250000,
    overtime_pay: 0,
    night_pay: 0,
    allowances_total: 0,
    total_pay: 3000000,
    national_pension: 135000,
    health_insurance: 106350,
    long_term_care: 13770,
    employment_insurance: 27000,
    income_tax: 45000,
    local_income_tax: 4500,
    total_deductions: 331620,
    net_pay: 2668380,
    sent_status: '발송성공',
    created_at: new Date()
  }
];

// -------------------------------------------------------------
// [급여명세서 CRUD 및 발송 API]
// -------------------------------------------------------------

// 특정 직원의 급여명세서 목록 조회
app.get('/api/pay-stubs', async (req, res) => {
  try {
    const { employee_id } = req.query;
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id 쿼리 파라미터가 필요합니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data, error } = await dbClient
        .from('pay_stubs')
        .select('*')
        .eq('employee_id', employee_id)
        .order('target_month', { ascending: false });
      
      if (error) throw error;
      return res.json(data);
    } else {
      const stubs = mockPayStubs.filter(s => s.employee_id === employee_id);
      return res.json(stubs);
    }
  } catch (error) {
    console.error('GET /api/pay-stubs error:', error);
    res.status(500).json({ error: '급여명세서 목록을 가져오는 데 실패했습니다.', details: error.message });
  }
});

// 급여명세서 발행 및 저장
app.post('/api/pay-stubs', async (req, res) => {
  try {
    const { 
      company_id, employee_id, target_month, 
      base_pay, weekly_holiday_pay, overtime_pay, night_pay, allowances_total, total_pay,
      national_pension, health_insurance, long_term_care, employment_insurance, income_tax, local_income_tax,
      total_deductions, net_pay,
      hourly_wage, base_hours, weekly_holiday_hours, overtime_hours, night_hours,
      holiday_work_hours, annual_leave_hours, extra_overtime_hours
    } = req.body;

    if (!company_id || !employee_id || !target_month) {
      return res.status(400).json({ error: '필수 변수(company_id, employee_id, target_month)가 누락되었습니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data: existing } = await dbClient
        .from('pay_stubs')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('target_month', target_month);

      const updateData = {
        base_pay: Number(base_pay),
        weekly_holiday_pay: Number(weekly_holiday_pay),
        overtime_pay: Number(overtime_pay),
        night_pay: Number(night_pay),
        allowances_total: Number(allowances_total),
        total_pay: Number(total_pay),
        national_pension: Number(national_pension),
        health_insurance: Number(health_insurance),
        long_term_care: Number(long_term_care),
        employment_insurance: Number(employment_insurance),
        income_tax: Number(income_tax),
        local_income_tax: Number(local_income_tax),
        total_deductions: Number(total_deductions),
        net_pay: Number(net_pay),
        hourly_wage: Number(hourly_wage || 0),
        base_hours: Number(base_hours || 0),
        weekly_holiday_hours: Number(weekly_holiday_hours || 0),
        overtime_hours: Number(overtime_hours || 0),
        night_hours: Number(night_hours || 0),
        holiday_work_hours: Number(holiday_work_hours || 0),
        annual_leave_hours: Number(annual_leave_hours || 0),
        extra_overtime_hours: Number(extra_overtime_hours || 0)
      };

      if (existing && existing.length > 0) {
        const { data, error } = await dbClient
          .from('pay_stubs')
          .update(updateData)
          .eq('id', existing[0].id)
          .select();
        
        if (error) throw error;
        return res.json(data[0]);
      } else {
        const { data, error } = await dbClient
          .from('pay_stubs')
          .insert([{
            company_id, employee_id, target_month,
            ...updateData,
            sent_status: '미발송'
          }])
          .select();
        
        if (error) throw error;
        return res.status(201).json(data[0]);
      }
    } else {
      const existingIdx = mockPayStubs.findIndex(s => s.employee_id === employee_id && s.target_month === target_month);
      const stubData = {
        id: existingIdx !== -1 ? mockPayStubs[existingIdx].id : `demo-stub-id-${Date.now()}`,
        company_id, employee_id, target_month,
        base_pay: Number(base_pay),
        weekly_holiday_pay: Number(weekly_holiday_pay),
        overtime_pay: Number(overtime_pay),
        night_pay: Number(night_pay),
        allowances_total: Number(allowances_total),
        total_pay: Number(total_pay),
        national_pension: Number(national_pension),
        health_insurance: Number(health_insurance),
        long_term_care: Number(long_term_care),
        employment_insurance: Number(employment_insurance),
        income_tax: Number(income_tax),
        local_income_tax: Number(local_income_tax),
        total_deductions: Number(total_deductions),
        net_pay: Number(net_pay),
        hourly_wage: Number(hourly_wage || 0),
        base_hours: Number(base_hours || 0),
        weekly_holiday_hours: Number(weekly_holiday_hours || 0),
        overtime_hours: Number(overtime_hours || 0),
        night_hours: Number(night_hours || 0),
        holiday_work_hours: Number(holiday_work_hours || 0),
        annual_leave_hours: Number(annual_leave_hours || 0),
        extra_overtime_hours: Number(extra_overtime_hours || 0),
        sent_status: existingIdx !== -1 ? mockPayStubs[existingIdx].sent_status : '미발송',
        created_at: new Date()
      };

      if (existingIdx !== -1) {
        mockPayStubs[existingIdx] = stubData;
      } else {
        mockPayStubs.push(stubData);
      }
      return res.status(existingIdx !== -1 ? 200 : 201).json(stubData);
    }
  } catch (error) {
    console.error('POST /api/pay-stubs error:', error);
    res.status(500).json({ error: '급여명세서 발행에 실패했습니다.', details: error.message });
  }
});

// 급여명세서 삭제
app.delete('/api/pay-stubs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { error } = await dbClient
        .from('pay_stubs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.json({ success: true, message: '급여명세서가 삭제되었습니다.' });
    } else {
      mockPayStubs = mockPayStubs.filter(s => s.id !== id);
      return res.json({ success: true, message: '데모 급여명세서가 삭제되었습니다.' });
    }
  } catch (error) {
    console.error('DELETE /api/pay-stubs/:id error:', error);
    res.status(500).json({ error: '급여명세서 삭제에 실패했습니다.', details: error.message });
  }
});

// 급여명세서 알림톡/SMS 발송
app.post('/api/pay-stubs/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    let payStub = null;
    let employeeName = '';
    let employeePhone = '';
    let companyName = '노무체크 AI';

    if (user && dbClient) {
      const { data: stub, error } = await dbClient
        .from('pay_stubs')
        .select('*, employees(*), companies(*)')
        .eq('id', id)
        .single();
      
      if (error || !stub) {
        return res.status(404).json({ error: '급여명세서를 찾을 수 없습니다.' });
      }
      payStub = stub;
      employeeName = stub.employees?.name || '근로자';
      employeePhone = stub.employees?.phone || '';
      companyName = stub.companies?.company_name || '노무체크 AI';
    } else {
      const stub = mockPayStubs.find(s => s.id === id);
      if (!stub) {
        return res.status(404).json({ error: '급여명세서를 찾을 수 없습니다.' });
      }
      payStub = stub;
      employeeName = '홍길동(데모)';
      employeePhone = '01012345678';
      companyName = '(데모) 노무체크 상사';
    }

    if (!employeePhone) {
      return res.status(400).json({ error: '직원의 휴대폰 번호가 등록되지 않았습니다.' });
    }

    const cleanPhone = employeePhone.replace(/[^0-9]/g, '').trim();
    if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: '직원의 휴대폰 번호 형식이 올바르지 않습니다.' });
    }

    const totalTax = (payStub.income_tax || 0) + (payStub.local_income_tax || 0);
    const text = `[${companyName} 급여명세서]
${employeeName}님의 ${payStub.target_month} 급여 상세 내역이 발행되었습니다.

■ 지급 항목 합계: ${Number(payStub.total_pay).toLocaleString()}원
 - 기본급: ${Number(payStub.base_pay).toLocaleString()}원
 - 주휴수당: ${Number(payStub.weekly_holiday_pay).toLocaleString()}원
 - 연장근로수당: ${Number(payStub.overtime_pay).toLocaleString()}원
 - 야간근로수당: ${Number(payStub.night_pay).toLocaleString()}원
 - 기타수당: ${Number(payStub.allowances_total).toLocaleString()}원

■ 공제 항목 합계: ${Number(payStub.total_deductions).toLocaleString()}원
 - 국민연금: ${Number(payStub.national_pension).toLocaleString()}원
 - 건강보험: ${Number(payStub.health_insurance).toLocaleString()}원
 - 장기요양보험: ${Number(payStub.long_term_care).toLocaleString()}원
 - 고용보험: ${Number(payStub.employment_insurance).toLocaleString()}원
 - 소득세/지방세: ${totalTax.toLocaleString()}원

■ 실 수령액 (세후): ${Number(payStub.net_pay).toLocaleString()}원

* 본 명세서의 조회 및 인쇄는 아래 링크에서 확인하실 수 있습니다.
- 바로가기: ${process.env.SITE_URL || 'https://www.xn--ai-h74ir53a94vh9e.com'}`;

    const solapiApiKey = process.env.SOLAPI_API_KEY || '';
    const solapiApiSecret = process.env.SOLAPI_API_SECRET || '';
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER || '';
    const kakaoChannelId = process.env.SOLAPI_CHANNEL_ID || '';
    const templateId = process.env.SOLAPI_TEMPLATE_DOWNLOAD || 'TPL_DOWNLOAD_REPORT';

    if (!solapiApiKey || solapiApiKey === 'your_solapi_key_here' || solapiApiKey === '') {
      console.log('\n=========================================');
      console.log('ℹ️ [데모 모드] 급여명세서 카카오톡 발송 내역');
      console.log(`- 수신자: ${employeeName} (${cleanPhone})`);
      console.log(`- 발송 메시지 본문:\n${text}`);
      console.log('=========================================\n');

      if (user && dbClient) {
        await dbClient.from('pay_stubs').update({ sent_status: '발송성공' }).eq('id', id);
      } else {
        const idx = mockPayStubs.findIndex(s => s.id === id);
        if (idx !== -1) mockPayStubs[idx].sent_status = '발송성공';
      }

      return res.json({ 
        success: true, 
        message: '데모 모드로 알림톡이 가상 발송되었습니다. (콘솔 확인 가능)', 
        mock: true,
        sent_status: '발송성공'
      });
    }

    const crypto = require('crypto');
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', solapiApiSecret)
      .update(date + salt)
      .digest('hex');

    const authHeader = `HMAC-SHA256 apiKey=${solapiApiKey}, date=${date}, salt=${salt}, signature=${signature}`;

    const payload = {
      message: {
        to: cleanPhone,
        from: senderNumber,
        text: text,
        kakaoOptions: {
          pfId: kakaoChannelId,
          templateId: templateId
        }
      }
    };

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      if (user && dbClient) {
        await dbClient.from('pay_stubs').update({ sent_status: '발송실패' }).eq('id', id);
      } else {
        const idx = mockPayStubs.findIndex(s => s.id === id);
        if (idx !== -1) mockPayStubs[idx].sent_status = '발송실패';
      }
      throw new Error(result.errorMessage || '알림톡 발송 중 API 오류가 발생했습니다.');
    }

    if (user && dbClient) {
      await dbClient.from('pay_stubs').update({ sent_status: '발송성공' }).eq('id', id);
    } else {
      const idx = mockPayStubs.findIndex(s => s.id === id);
      if (idx !== -1) mockPayStubs[idx].sent_status = '발송성공';
    }

    return res.json({ success: true, message: '급여명세서가 카카오톡으로 성공적으로 발송되었습니다.', sent_status: '발송성공' });
  } catch (error) {
    console.error('POST /api/pay-stubs/:id/send error:', error);
    res.status(500).json({ error: '급여명세서 발송 도중 오류가 발생했습니다.', details: error.message });
  }
});


let mockAttendance = [
  { id: 'demo-att-1', company_id: 'demo-company-id-1', employee_id: 'demo-emp-id-1', work_date: '2026-07-01', clock_in: '2026-07-01T09:00:00Z', clock_out: '2026-07-01T18:00:00Z', work_hours: 8, break_minutes: 60, status: '정상', created_at: new Date() },
  { id: 'demo-att-2', company_id: 'demo-company-id-1', employee_id: 'demo-emp-id-1', work_date: '2026-07-02', clock_in: '2026-07-02T09:00:00Z', clock_out: '2026-07-02T19:00:00Z', work_hours: 9, break_minutes: 60, status: '정상', created_at: new Date() },
  { id: 'demo-att-3', company_id: 'demo-company-id-1', employee_id: 'demo-emp-id-1', work_date: '2026-07-03', clock_in: '2026-07-03T09:00:00Z', clock_out: '2026-07-03T18:00:00Z', work_hours: 8, break_minutes: 60, status: '정상', created_at: new Date() }
];

// -------------------------------------------------------------
// [근태(출퇴근) CRUD API]
// -------------------------------------------------------------

// 특정 직원의 근태 목록 조회
app.get('/api/attendance', async (req, res) => {
  try {
    const { employee_id, year_month } = req.query;
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id 쿼리 파라미터가 필요합니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      let query = dbClient
        .from('attendance')
        .select('*')
        .eq('employee_id', employee_id);
      
      if (year_month) {
        // YYYY-MM 포맷으로 필터링
        query = query.like('work_date', `${year_month}%`);
      }
      
      const { data, error } = await query.order('work_date', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } else {
      let emps = mockAttendance.filter(a => a.employee_id === employee_id);
      if (year_month) {
        emps = emps.filter(a => a.work_date.startsWith(year_month));
      }
      return res.json(emps);
    }
  } catch (error) {
    console.error('GET /api/attendance error:', error);
    res.status(500).json({ error: '출퇴근 기록 목록을 가져오는 데 실패했습니다.', details: error.message });
  }
});

// 근태 일별 기록 등록 및 수정
app.post('/api/attendance', async (req, res) => {
  try {
    const { company_id, employee_id, work_date, clock_in, clock_out, work_hours, break_minutes, status } = req.body;
    if (!company_id || !employee_id || !work_date) {
      return res.status(400).json({ error: '필수 변수(company_id, employee_id, work_date)가 누락되었습니다.' });
    }

    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { data: existing } = await dbClient
        .from('attendance')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('work_date', work_date);

      if (existing && existing.length > 0) {
        const { data, error } = await dbClient
          .from('attendance')
          .update({
            clock_in,
            clock_out,
            work_hours: Number(work_hours),
            break_minutes: Number(break_minutes),
            status: status || '정상'
          })
          .eq('id', existing[0].id)
          .select();
        
        if (error) throw error;
        return res.json(data[0]);
      } else {
        const { data, error } = await dbClient
          .from('attendance')
          .insert([{
            company_id,
            employee_id,
            work_date,
            clock_in,
            clock_out,
            work_hours: Number(work_hours),
            break_minutes: Number(break_minutes),
            status: status || '정상'
          }])
          .select();
        
        if (error) throw error;
        return res.status(201).json(data[0]);
      }
    } else {
      const existingIdx = mockAttendance.findIndex(a => a.employee_id === employee_id && a.work_date === work_date);
      const attData = {
        id: existingIdx !== -1 ? mockAttendance[existingIdx].id : `demo-att-id-${Date.now()}`,
        company_id,
        employee_id,
        work_date,
        clock_in,
        clock_out,
        work_hours: Number(work_hours),
        break_minutes: Number(break_minutes),
        status: status || '정상',
        created_at: new Date()
      };

      if (existingIdx !== -1) {
        mockAttendance[existingIdx] = attData;
      } else {
        mockAttendance.push(attData);
      }
      return res.status(existingIdx !== -1 ? 200 : 201).json(attData);
    }
  } catch (error) {
    console.error('POST /api/attendance error:', error);
    res.status(500).json({ error: '출퇴근 기록 등록에 실패했습니다.', details: error.message });
  }
});

// 근태 기록 삭제
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getAuthenticatedUser(req);
    const dbClient = getSupabaseClient(req);
    if (isSupabaseEnabled() && !(user && dbClient)) {
      return res.status(401).json({ error: '로그인 후 이용 가능한 기능입니다.' });
    }

    if (user && dbClient) {
      const { error } = await dbClient
        .from('attendance')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.json({ success: true, message: '출퇴근 기록이 삭제되었습니다.' });
    } else {
      mockAttendance = mockAttendance.filter(a => a.id !== id);
      return res.json({ success: true, message: '데모 출퇴근 기록이 삭제되었습니다.' });
    }
  } catch (error) {
    console.error('DELETE /api/attendance/:id error:', error);
    res.status(500).json({ error: '출퇴근 기록 삭제에 실패했습니다.', details: error.message });
  }
});


// [AI 근로계약서 / 취업규칙 위험조항 점검 - 참고용 자가진단]
app.post('/api/analyze-contract', async (req, res) => {
  try {
    const { contractText, analysisType, docYear, companySize, industry, file_data, file_mime } = req.body;
    const hasText = typeof contractText === 'string' && contractText.trim().length > 0;
    const hasFile = !!(file_data && file_mime);
    if (!hasText && !hasFile) {
      return res.status(400).json({ error: '분석할 문서 텍스트 또는 첨부 파일이 누락되었습니다.' });
    }
    if (hasText && contractText.length > 20000) {
      return res.status(400).json({ error: '분석할 텍스트가 너무 깁니다. 20,000자 이내로 입력해 주세요.' });
    }

    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkAiRateLimit(`ip:${clientIp}`)) {
      return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
    }

    // 첨부 파일이 있으면 Gemini 멀티모달 인라인 데이터 파트로 변환
    let filePart = null;
    if (hasFile) {
      const base64DataOnly = file_data.includes(';base64,') ? file_data.split(';base64,')[1] : file_data;
      filePart = { inlineData: { data: base64DataOnly, mimeType: file_mime } };
    }

    const typeLabel = analysisType === 'rules' ? '취업규칙' : '근로계약서';
    const currentYear = new Date().getFullYear();
    const yearNote = docYear ? `사용자가 밝힌 이 문서의 작성/최종 개정 연도: ${docYear}년` : '문서 작성/최종 개정 연도는 미입력 상태이므로 문서 내용 자체에서 추정하거나, 추정이 어려우면 알 수 없다고 명시';

    const rulesComparisonBlock = analysisType === 'rules' ? `
[취업규칙 연도별 기준 비교 요구사항 - 반드시 반영]
이 문서는 취업규칙이므로, 단순 위반 여부 나열이 아니라 "이 규정이 작성된 시점 대비 ${currentYear}년 현재 법정 기준으로 무엇이 달라졌는지"를 비교하는 방식으로 작성하십시오.
${yearNote}
각 조항을 아래 4개 범주 중 하나로 명확히 분류하여 표시하십시오:
- 🆕 [신규 반영 필요] : ${currentYear}년 기준 새로 생긴 법정 의무인데 규정에 아예 없는 부분 (예: 직장 내 괴롭힘 금지, 육아휴직 관련 최신 개정 등)
- 🔄 [변경 필요] : 과거 기준으로 작성되어 현재 법정 기준(최저임금, 가산율, 휴가 일수 등 수치 포함)과 어긋나는 부분
- ✏️ [수정 권장] : 위법은 아니지만 표현이 모호하거나 분쟁 소지가 있어 다듬는 게 좋은 부분
- ✅ [이미 준수됨] : 현재 법정 기준에 이미 부합하는 부분 (짧게 확인만)
` : '';

    const specialWorkingHoursBlock = `
[특수 근로시간제 점검 요구사항 - 문서에 관련 내용이 있는지 반드시 확인]
문서 안에 아래와 같은 특수 근로시간제 관련 표현이나 취지가 있는지 살펴보고, 있다면 해당 제도별 법정 요건을 갖추었는지 별도 소제목("■ 특수 근로시간제 점검")으로 점검하십시오. 없다면 이 섹션은 생략해도 됩니다.
- **간주근로시간제(사업장 밖 간주근로, 근로기준법 제58조 제1항·제2항)**: 출장 등으로 근로시간 산정이 어려운 경우 적용. 통상 소정근로시간을 초과해 근로가 필요한 업무라면 근로자대표와의 서면합의로 그 시간을 정해야 함 - 서면합의 존재 여부 확인.
- **재량근로시간제(근로기준법 제58조 제3항, 시행령 제31조)**: 신상품·신기술 연구개발, 정보처리시스템 설계·분석, 신문·방송 취재편집, 의복·실내장식 등 디자인, 방송프로듀서·감독, 회계·법률·건축·심사 등 시행령이 열거한 업무에만 적용 가능. (1) 대상 업무가 열거 업무에 해당하는지, (2) 근로자대표와의 서면합의(업무 내용, 간주 근로시간, 업무수행 수단·시간배분에 대한 근로자 재량 보장 등)가 있는지 확인.
- **탄력적 근로시간제(근로기준법 제51조, 제51조의2)**: 단위기간이 2주 이내면 취업규칙(또는 이에 준하는 것), 3개월 이내 또는 3개월 초과~6개월 이내면 근로자대표와의 서면합의가 필요하며 대상 근로자, 단위기간, 근로일별 근로시간 등을 명시해야 함. 임산부·연소자 적용 제외 여부도 확인.
- **선택적 근로시간제(근로기준법 제52조)**: 취업규칙에 업무 시작·종료 시각을 근로자 결정에 맡긴다는 근거를 두고, 근로자대표와의 서면합의(대상 근로자, 정산기간(원칙 1개월 이내, 신상품 연구개발 등은 3개월 이내), 총 근로시간, 표준근로시간 등)로 정해야 함.
위 서면합의·근거 규정이 문서에 없는데도 특수 근로시간제를 적용한다고 되어 있다면, 요건 미비로 통상의 근로시간 규정(연장·야간·휴일 가산수당 등)이 그대로 적용될 소지가 있다는 점을 짚어주십시오.
`;

    const workerCategoryBlock = `
[근로자 유형별 근로시간 차등 점검 - 문서에 여러 근로자 유형이 있는지 반드시 확인]
${typeLabel === '취업규칙' ? '취업규칙은 보통 정규직/계약직/단시간(파트타임)/교대제/재택 등 근로자 유형마다 근로시간 규정이 다르게 적용됩니다.' : '근로계약서 한 건이라도, 명시된 근로형태(교대제, 시간제, 격일제 등)에 따라 적용되는 법정 기준이 달라집니다.'}
문서에 근로자 유형(직군)별로 서로 다른 근로시간·근무형태 규정이 존재하는지 확인하고, 존재한다면 유형별로 각각 나누어 점검하십시오. 유형을 뭉뚱그려 하나의 기준으로만 판단하지 마십시오. 참고 기준:
- **통상근로자(정규직 등)**: 1주 40시간, 1일 8시간 원칙 (근로기준법 제50조)
- **단시간근로자(파트타임)**: 근로기준법 제18조 및 시행령 별표2 - 통상근로자의 소정근로시간에 비례하여 임금·휴일·휴가를 산정해야 하며, 초과근로는 원칙적으로 소정근로시간을 초과할 수 없고 초과 시 가산수당(50%) 지급 대상 (기간제 및 단시간근로자 보호법 제6조)
- **교대제 근로자**: 야간(22시~06시) 근로 가산수당(제56조 3항), 교대 간 최소 휴식시간 확보 여부, 야간작업 특수건강진단 관련 안내 필요 여부
- **격일제/24시간 교대 등 특수 근무형태**: 실근로시간과 휴게시간 구분이 명확한지, 감시·단속적 근로자로 고용노동부 승인을 받아 근로시간 특례(제63조)를 적용받는지 여부에 따라 결론이 달라짐을 유의
같은 문서 안에서 근로자 유형별로 규정이 다르면, 결과 리포트에서도 유형별 소제목으로 구분해 각각의 준수 여부를 별도로 정리하십시오.
`;

    const companySizeNote = companySize === '5인 미만' || companySize === '5인 이상'
      ? `사용자가 밝힌 사업장 규모: ${companySize}. 이 규모를 기준으로 아래 항목의 적용 여부를 명확히 판정하십시오.`
      : '사업장 규모가 입력되지 않았습니다(모름). 규모에 따라 결론이 갈리는 항목은 "5인 미만인 경우"와 "5인 이상인 경우"를 모두 나누어 안내하십시오.';
    const industryNote = industry ? `사용자가 밝힌 업종: ${industry}` : '업종은 입력되지 않았습니다. 문서 내용에서 업종을 추정할 수 있으면 참고하고, 어려우면 일반 기준으로 안내하십시오.';

    const companySizeBlock = `
[사업장 규모·업종별 적용 차등 점검 - 반드시 반영]
${companySizeNote}
${industryNote}
아래 항목들은 사업장 규모(상시근로자 5인 기준)에 따라 적용 여부가 완전히 달라지므로, 문서 내용을 규모와 무관하게 하나의 기준으로 판정하지 말고 반드시 규모를 반영해 판정하십시오:
- **연장·야간·휴일 가산수당(제56조)**: 5인 이상 사업장만 50% 가산 의무. 5인 미만은 가산수당 의무 없음(단, 정상임금 지급 의무는 있음).
- **해고 등의 제한 및 부당해고 구제신청(제23조, 제28조)**: 5인 이상 사업장에만 적용. 5인 미만은 정당한 이유 없는 해고라도 노동위원회 부당해고 구제신청 대상이 아님(다만 해고예고수당 의무는 5인 미만도 적용).
- **연차유급휴가(제60조)**: 5인 이상 사업장만 적용. 5인 미만은 연차휴가 부여 의무 자체가 없음.
- **근로시간 및 휴게(제50조~제54조)**: 5인 미만도 기본적으로 적용되나, 근로시간 한도 특례(제59조)는 육상·수상·항공 운송업, 보건업 등 법정 업종에서 근로자대표와 서면합의 시 연장근로 한도를 초과할 수 있음 - 업종이 해당하는지 확인.
- **직장 내 괴롭힘 금지(제76조의2, 3)**: 사업장 규모와 무관하게 모든 사업장에 적용됨에 유의.

[복지·급여성 항목 및 불이익 변경 점검]
식대, 명절 상여금, 경조사비 등 법정 의무는 아니지만 회사가 자율적으로 정한 복지·수당 항목이 문서에 있다면:
- 일단 취업규칙이나 근로계약에 명시되면 근로조건의 일부로 인정되어, 사업주가 일방적으로 축소·폐지할 경우 근로기준법 제94조(취업규칙 불이익 변경 시 근로자 과반수 동의 필요) 문제가 될 수 있음을 안내하십시오.
- 이런 복지 항목은 사업장마다 자유롭게 다르게 설계할 수 있는 영역이라는 점, 다만 일단 정해지면 절차 없이 축소하기 어렵다는 점을 함께 짚어주십시오.
`;

    const wageTypeBlock = `
[임금 지급 형태별 점검 - 문서에 명시된 지급 형태에 맞게 판단]
문서에 시급제/일급제/주급제/월급제/포괄임금제 중 어떤 방식으로 임금을 정했는지 확인하고, 그 형태에 맞는 기준으로 최저임금 위반 여부와 주휴수당 처리를 판단하십시오. 지급 형태를 명시하지 않고 총액만 적힌 경우, 그 자체가 불명확하다는 점을 지적하십시오.
- **시급제**: 시급 자체가 해당 연도 최저임금(2026년 10,320원) 이상인지 확인. 시급에 주휴수당이 포함된 것인지 별도 지급인지 명시가 없으면 무효 소지 (근로기준법 제55조).
- **일급제**: 일급 ÷ 1일 소정근로시간으로 환산한 시급이 최저임금 이상인지 확인. 일급에 휴게시간이 포함되어 계산된 것은 아닌지, 주휴수당이 별도 처리되는지 확인.
- **주급제**: 드문 형태이나 있다면 주급 ÷ 주 소정근로시간(주휴시간 제외)으로 환산해 최저임금 위반 여부 확인.
- **월급제**: 월급을 209시간(주 40시간+주휴 8시간 기준, 사업장 소정근로시간에 따라 다를 수 있음)으로 나눈 환산시급이 최저임금 이상인지 확인. 월급에 기본급 외 각종 수당(연장·야간·휴일·연차수당 등)이 포함되어 있다면 항목별로 구분 표시되어 있는지 확인.
- **포괄임금제**: (1) 실제 연장·야간·휴일근로 시간을 사전에 정확히 산정하기 어려운 업무 특성인지, (2) 기본급과 각 가산수당이 항목별로 명확히 구분되어 있는지, (3) 실제 근로시간에 따라 계산한 법정수당 총액이 포괄임금액보다 많다면 차액 지급 의무가 있음을 반드시 안내. 위 요건이 불명확하면 포괄임금 약정 자체의 유효성이 문제될 수 있음을 지적.
`;

    const allowanceChecklistBlock = `
[법정수당 항목별 체크리스트 - 아래 항목을 하나씩 빠짐없이 확인]
문서 내용과 위에서 판단한 사업장 규모·근로자 유형을 근거로, 아래 법정수당/금품 항목이 각각 (a) 문서에 명시되어 있는지, (b) 명시된 방식이 법정 기준(가산율·산정방식)에 맞는지, (c) 아예 언급이 없다면 실무상 어떤 리스크가 있는지 짧게 짚어 별도 소제목("■ 법정수당 항목별 점검")으로 정리하십시오. 해당 사항이 없는 항목(예: 애초에 연장근로가 없는 직무)은 "해당 없음"으로 짧게 처리하고 넘어가십시오.

**계산 기준 필수 규칙**: 각 수당 항목을 판단할 때 반드시 위 [임금 지급 형태별 점검]에서 확인한 지급 형태의 단위로 계산하십시오. 시급제라면 모든 수당 항목을 "시간" 단위(시급 × 가산율 × 초과시간)로 계산해서 제시하고, 일급제라면 일급을 소정근로시간으로 나눈 환산시급을 구한 뒤 그 시급을 기준으로 각 수당을 계산하되 결과는 일급 기준(해당 일의 추가 지급액)으로 제시하십시오. 월급제라면 월급을 209시간(또는 실제 소정근로시간)으로 나눈 환산시급을 기준으로 계산하십시오. 지급 형태를 무시하고 뭉뚱그려 계산하지 마십시오.
**사업장 규모 필수 규칙**: 아래 각 항목 옆에 표시된 적용 기준(5인 이상만 / 규모 무관)을 반드시 그대로 적용하십시오. 사용자가 밝힌 사업장 규모가 5인 미만이면 "5인 이상만" 표시된 항목은 가산 의무가 없다는 결론을 내리고, 5인 이상이면 가산 의무가 있다는 결론을 내리십시오. 규모가 "모름"이면 두 결론을 모두 제시하십시오.

- 연장근로수당 (제56조 1항, 5인 이상만 가산 의무) - 1일 8시간/1주 40시간 초과분 50% 가산
- 야간근로수당 (제56조 3항, 5인 이상만 가산 의무) - 22시~06시 근로 50% 가산
- 휴일근로수당 (제56조 2항, 5인 이상만 가산 의무) - 8시간 이내분 50%, 8시간 초과분 100% 가산
- 주휴수당 (제55조) - 주 15시간 이상 근무 및 소정근로일 개근 시 유급주휴 부여 (사업장 규모 무관 적용)
- 연차유급휴가수당 (제60조, 5인 이상만 적용) - 미사용 연차에 대한 수당 정산 규정 존재 여부
- 해고예고수당 (제26조, 사업장 규모 무관 적용) - 30일 전 예고 없는 해고 시 30일분 통상임금
- 퇴직금 (근로자퇴직급여 보장법 제4조, 1인 이상 사업장 모두 적용) - 계속근로 1년 이상 시 지급 의무 관련 규정 존재 여부
- 식대 등 비과세성 수당 - 세법상 비과세 한도(월 20만원 등) 내에서 설계되어 있는지, 통상임금 산입 여부와의 혼동은 없는지
`;

    const systemPrompt = `당신은 대한민국 근로기준법 등 노동관계법령에 정통한 AI 어시스턴트입니다. 당신은 공인노무사나 변호사가 아니며, 이 분석은 법률 자문이 아니라 참고용 자가진단 정보입니다.
다음 제공된 ${typeLabel}${hasFile ? ' (텍스트 및/또는 첨부 파일)' : ' 텍스트'}를 분석하여, 아래 기준에 따라 위반/위험 소지를 점검하고 참고용 대안 문구를 제시해 주세요.
${rulesComparisonBlock}${specialWorkingHoursBlock}${workerCategoryBlock}${companySizeBlock}${wageTypeBlock}${allowanceChecklistBlock}
[요구사항]
1. 종합 위험도 (위험 / 주의 / 양호) 참고 등급 - 확정적 법적 판단이 아님을 표현으로 드러낼 것 ("~일 가능성이 있습니다" 등)
2. 근로기준법 등 위반 소지가 있거나 독소 조항으로 볼 여지가 있는 부분 식별 (특수 근로시간제 요건 미비, 근로자 유형별 차등 규정, 임금 지급 형태별 최저임금 환산, 법정수당 항목별 누락 포함)
3. 조항별 구체적인 관련 법령 근거 (예: 근로기준법 제OO조) 제시
4. 문제 소지가 있는 조항에 대해 참고할 수 있는 대안 문구 제시 (반드시 채택해야 하는 확정 문구가 아님을 명시)
5. 전체 총평 및 확인 체크리스트
${hasFile ? '6. 첨부 파일이 이미지/PDF라면 그 안에서 읽을 수 있는 조항이나 내용을 최대한 판독하여 위 항목에 반영하고, "■ 첨부 파일 판독 결과" 섹션으로 별도 정리' : ''}

[금지 사항]
- 특정 노무사·변호사·업체를 소개, 연결, 알선하지 않는다.
- 소송/진정 결과나 처벌 수위를 단정적으로 예측하지 않는다.
- 응답 최하단에 반드시 다음 문구를 그대로 포함한다: "본 점검 결과는 AI가 생성한 참고용 정보이며 공인노무사·변호사의 법률 자문을 대체하지 않습니다. 개별 사안에 대한 최종 판단은 전문가와 상담하시기 바랍니다."

[출력 형식]
가독성이 높도록 마크다운(Markdown) 형식을 적극 사용하고, 제목, 구분선, 위험 지표를 이모티콘과 함께 구조화하여 한글로 작성해 주세요.
${hasText ? `
제공된 ${typeLabel} 텍스트:
"""
${contractText}
"""` : `제공된 ${typeLabel} 텍스트는 없으며, 첨부된 파일만 분석 대상입니다.`}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
      console.log('ℹ️ GEMINI_API_KEY 미설정으로 데모 모드 계약서 분석 리포트를 제공합니다.');
      const fileNote = hasFile ? `\n\n### 🔍 첨부 파일(${file_mime}) 모의 판독 결과\n- 데모 모드에서는 첨부 파일을 실제로 분석하지 않고 예시 결과만 표시합니다. 실제 파일 판독은 API 연동 후 제공됩니다.` : '';
      const rulesMock = analysisType === 'rules' ? `

### 📅 ${currentYear}년 기준 규정 비교 (데모 예시)
- 🆕 [신규 반영 필요] 직장 내 괴롭힘 금지 및 조치 절차 조항이 없습니다. (근로기준법 제76조의2, 제76조의3)
- 🔄 [변경 필요] "무단결근 1일 시 급여 20% 감급" 조항은 근로기준법 제95조(감급 제재의 제한, 1회 평균임금 1일분의 2분의 1 초과 금지)를 위반할 소지가 있습니다.
- ✏️ [수정 권장] "손해 배상금을 퇴직금에서 선공제" 조항은 근로기준법 제20조(위약 예정의 금지) 위반 소지가 있어 별도 절차로 분리하는 것이 안전합니다.
- ✅ [이미 준수됨] 연장근로 지시 관련 조항 자체는 형식상 문제 없습니다 (다만 수당 미지급 여부는 별도 확인 필요).` : '';
      const mockAnalysis = `### 🩺 AI 자가진단 참고 보고서 (${typeLabel})

#### 🚨 종합 위험도 (참고): **주의 (Yellow)**
일부 조항에서 근로기준법 위반 소지가 있을 가능성이 있거나, 모호한 규정으로 향후 분쟁 리스크가 있을 수 있습니다.
${rulesMock}
---

### 🔍 주요 위험 요인 및 참고 대안

#### 1. 주휴수당 지급 규정 미비 (근로기준법 제55조)
- **현행 조항**: *"기본 시급 10,030원만 지급하며 주휴수당은 별도 언급 없음."*
- **참고 사항**: 주 15시간 이상 근무하는 근로자에게는 주휴일과 주휴수당 부여 의무가 있습니다. 명시적 구분이 없으면 미지급으로 볼 여지가 있습니다.
- **참고 대안 문구**:
  > "을의 임금은 시급 10,030원으로 한다. 매주 개근 시 주휴수당을 별도 산정하여 합산 지급한다."

#### 2. 근로시간 및 휴게시간 규정 불일치 (근로기준법 제54조)
- **현행 조항**: *"09:00부터 18:00까지 근무하며, 휴게시간은 별도로 보장하지 않고 업무 중 틈틈이 쉰다."*
- **참고 사항**: 8시간 근무 시 1시간 이상의 휴게시간을 근로시간 도중 보장해야 합니다.
- **참고 대안 문구**:
  > "근로시간은 09:00 ~ 18:00으로 하되, 휴게시간은 12:00 ~ 13:00(60분)으로 근로시간 도중에 부여한다."
${fileNote}
---

### 📝 확인 체크리스트
- [ ] 시급제 알바 근로자의 주간 근무 시간이 15시간을 초과하는지 확인
- [ ] 서면 근로계약서 1부를 근로자에게 교부하고 교부 확인 서명을 받을 것

본 점검 결과는 AI가 생성한 참고용 정보이며 공인노무사·변호사의 법률 자문을 대체하지 않습니다. 개별 사안에 대한 최종 판단은 전문가와 상담하시기 바랍니다.`;
      return res.json({ report: mockAnalysis });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(filePart ? [systemPrompt, filePart] : systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ report: text });
  } catch (error) {
    console.error('AI Contract Analysis Error:', error);
    res.status(500).json({ error: '계약서 분석 도중 오류가 발생했습니다.', details: error.message });
  }
});

// 기본 헬스체크 API 라우트

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LaborCheck AI', time: new Date() });
});

// 메인 루트 / 요청 시 index.html 렌더링
app.get('/', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head><meta charset="UTF-8"><title>노무체크 AI Server</title></head>
    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>🚀 노무체크 AI 서버가 정상 구동 중입니다.</h1>
      <p>백엔드 API 및 정밀 계산 엔진이 포트에서 가동 중입니다.</p>
    </body>
    </html>
  `);
});

// 모든 기타 GET 요청은 React SPA index.html 서빙 또는 안전 리다이렉트
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API Not Found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  const altIndexPath = path.join(__dirname, 'dist', 'index.html');
  if (require('fs').existsSync(altIndexPath)) {
    return res.sendFile(altIndexPath);
  }
  return res.redirect('/');
});

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;
