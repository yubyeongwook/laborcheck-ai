const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
app.use(cors());
app.use(express.json());

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

    // LLM 호출 (gemini-2.5-flash 사용)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(systemPrompt);
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

// 기본 헬스체크 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
