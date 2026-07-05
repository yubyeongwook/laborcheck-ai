const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 환경변수 로드
dotenv.config();

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
      file_data,  // Base64 데이터 URL 또는 순수 Base64
      file_mime   // mimeType
    } = req.body;

    // 입력값 검증
    if (!user_type || !company_size || !issue_text) {
      return res.status(400).json({ error: '필수 입력 변수(user_type, company_size, issue_text)가 누락되었습니다.' });
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
    const systemPrompt = `너는 대한민국 노동법 자가진단 리포트를 작성하는 AI 어시스턴트다.
이 리포트는 법률 자문이 아니라, 사용자가 입력한 정보를 근로기준법 등 관련 법령에 대조해 정리하는 참고용 정보 리포트다.
너는 특정 노무사나 변호사를 소개, 연결, 알선하지 않는다.
너는 사건의 승패나 결과를 단정적으로 예측하지 않는다. "~할 가능성이 있습니다", "~로 판단될 여지가 있습니다" 등 참고적 표현만 사용한다.

[입력 변수]
- 사용자 유형: ${user_type} (근로자 / 사업주)
- 사업장 규모: ${company_size} (5인 미만 / 5인 이상)
- 기존 근무/급여 설명: ${work_hours || '상세 입력 참조'}
- 급여 유형 및 금액: ${salary_type || '미입력'} (${salary_amount ? Number(salary_amount).toLocaleString() : 0}원)
- 근로 시간 정보: 하루 ${daily_hours || 0}시간, 주 ${weekly_days || 0}일 근무
- 휴게 시간 정보: 하루 ${break_time || 0}분 휴게
- 근로계약서상 수당 포함 여부 (5인 이상 전용): ${company_size === '5인 이상' ? (allowance_included || '해당 없음/확인불가') : '해당 없음 (5인 미만)'}
- 사연: ${issue_text}
- 첨부 파일 여부: ${filePart ? `있음 (MIME: ${file_mime}) - 이미지 또는 동영상 파일이 함께 입력되었습니다.` : '없음'}

[법령 대조 및 멀티모달 분석 유의 사항]
1. 근로기준법 제54조(휴게): 근로시간이 4시간인 경우 30분 이상, 8시간인 경우 1시간 이상의 휴게시간이 근로시간 도중에 주어져야 합니다. 사용자가 입력한 근로시간과 휴게시간을 비교하여 이 법적 기준에 미달하는지 짚어주어야 합니다.
2. 근로기준법 제56조(연장·야간 및 휴일 근로): 5인 이상 사업장의 경우 연장, 야간, 휴일 근로에 대해 50% 가산수당 지급 의무가 있습니다.
3. 포괄임금 약정 (수당 포함 여부 관련): 5인 이상 사업장에서 근로계약서상 각종 수당(연차, 연장, 야간, 휴일 등)이 포함되어 있다고 명시된 경우, 실제 제공한 연장근로 등에 따른 법정 가산수당 총액보다 포괄수당액이 적다면 차액을 지급해야 할 의무가 있으며, 유효한 포괄임금 약정인지 검토가 필요함을 지적하십시오.
4. **첨부 서류/영상 판독**: 만약 이미지(근로계약서, 임금명세서 등)나 동영상(구두 지시, 현장 증빙 등) 파일이 첨부된 경우, 해당 파일에서 추출할 수 있는 명시 조항이나 상황 증거를 정밀하게 분석하여 보고서의 [2. 관련 법령 대조] 섹션 밑에 **"■ 첨부 서류/영상 판독 결과"**로 내용을 상세히 기록해 주십시오.

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

    // API 키가 없거나 기본값인 경우 데모 모드로 가상 리포트 반환
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
      console.log('ℹ️ GEMINI_API_KEY 미설정으로 데모 모드(Mock Report)를 작동합니다.');
      
      const calcWeeklyHours = (daily_hours || 0) * (weekly_days || 0);
      const isBreakTimeValid = (daily_hours >= 8 && break_time >= 60) || (daily_hours >= 4 && daily_hours < 8 && break_time >= 30) || (daily_hours < 4);
      
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

      const mockReport = `# [자가진단 리포트] (데모 모드)

## 1. 쟁점 요약
1. 사용자가 입력한 조건: ${salary_type || '월급'} ${salary_amount ? Number(salary_amount).toLocaleString() : '0'}원, 일 ${daily_hours || 0}시간 (주 ${weekly_days || 0}일, 총 주 ${calcWeeklyHours}시간), 일 휴게 ${break_time || 0}분
2. 핵심 쟁점: 5인 이상 사업장에서 근로계약서상 수당 포함 여부(${allowance_included || '미작성/모름'})와 실제 노동법상 의무(휴게시간 보장, 수당 추가 청구) 부합 여부가 주된 쟁점입니다.
3. 비식별화 검토: 사연 속의 고유 명칭(인명, 상호, 상세 주소 등)은 모두 [비식별 처리]로 처리되었습니다.

## 2. 관련 법령 대조
- **근로기준법 제54조 (휴게)**: 사용자는 근로시간이 4시간인 경우에는 30분 이상, 8시간인 경우에는 1시간 이상의 휴게시간을 근로시간 도중에 주어야 합니다. 
  * 현재 조건: 일 ${daily_hours || 0}시간 근로 대비 휴게시간이 ${break_time || 0}분으로 설정되어 있어, ${isBreakTimeValid ? '법적 휴게 의무 기준에 부합하는 것으로 판단됩니다.' : '현행법상 휴게시간 최저 기준에 미달하여 법 위반 소지가 있을 수 있습니다.'}
- **근로기준법 제17조 및 제56조 (수당 포괄 포함 검토)**: 
  * ${company_size === '5인 이상' ? `5인 이상 사업장이므로 연장·야간·휴일근로에 대한 가산 의무가 전면 적용됩니다. 근로계약서상 수당 포함 합의('${allowance_included}')가 있더라도, 실제 발생한 가산수당 기준 금액이 계약서상 명시된 정액 수당보다 크다면 그 차액에 대해 임금체불 소지가 발생할 수 있습니다.` : '5인 미만 사업장이므로 연장·야간·휴일 가산 수당(50% 가산) 의무는 법적으로 강제되지 않습니다.'}

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

      return res.json({ report: mockReport });
    }

    // LLM 호출 (gemini-1.5-flash 사용)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ report: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: '리포트 생성 도중 오류가 발생했습니다.', details: error.message });
  }
});

// 기본 헬스체크 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
