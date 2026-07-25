import { UnifiedAIClient, ChatMessage } from './client';

/**
 * 노무체크 AI - 5대 분야별 수석 에이전트 & 노무비서실장 정의
 */
export type AgentRole =
  | 'MasterRouter'
  | 'LaborLawChief'
  | 'IndustrialAccidentChief'
  | 'LaborInspectionChief'
  | 'PolicyFundsChief'
  | 'FinancialDiagnosticChief';

export type UserRole = 'super_admin' | 'agency_admin' | 'company_admin' | 'employee';

export interface RequiredLaborSlots {
  workDaysPerWeek?: number;         // 주 당 근무 일수
  dailyStartTime?: string;          // 출근 시간
  dailyEndTime?: string;            // 퇴근 시간
  breakTimeMinutes?: number;        // 휴게 시간(분)
  hourlyOrMonthlyBaseSalary?: number; // 약정임금 (시급/월급)
  hasHolidayAllowanceIncluded?: boolean; // 포괄임금/수당 녹임 여부
  holidayDailyWorkHours?: number;   // 휴일 1일 근무시간
  annualHolidayCount?: number;      // 연간 휴일 일수
  annualLeaveCount?: number;        // 연간 연차 일수
}

export interface SlotStatus {
  isComplete: boolean;
  missingSlots: string[];
  slots: RequiredLaborSlots;
}

export class MasterAgentOrchestrator {
  private aiClient: UnifiedAIClient;

  constructor(aiClient?: UnifiedAIClient) {
    this.aiClient = aiClient || new UnifiedAIClient();
  }

  /**
   * 노무비서실장 (Master Router): 의도 분석 및 5대 분야 수석 에이전트 분기
   */
  async routeIntent(userQuery: string): Promise<AgentRole> {
    const routingPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: `너는 노무체크 AI의 총괄 디렉터 [노무비서실장]이다. 사용자의 질문을 분석하여 법령 및 판례 전문가인 5대 수석 에이전트 중 가장 적합한 1곳으로 정확히 라우팅해라.
반드시 아래 5개 코드 이름 중 하나만 정확히 단어로 답변해라 (설명 금지):
- LaborLawChief : 근로기준법, 최저임금법, 근로자퇴직급여보장법, 통상임금/포괄임금 판례, 209시간, 연차, 임금계산
- IndustrialAccidentChief : 산재보상보험법, 산업안전보건법, 중대재해처벌법, 뇌심혈관계/근골격계/출퇴근재해 대법원 판례, 요양/휴업급여
- LaborInspectionChief : 고용노동부 근로감독, 임금체불 진정, 4대보험 관계법령, 부당해고, 대지급금, 형사처벌 리스크
- PolicyFundsChief : 고용정책기본법, 2026 청년일자리도약장려금, 중진공/소진공 융자·출연금, R&D 지원금
- FinancialDiagnosticChief : 외부감사법, 신용보증기금/기술보증기금 KTRS 평가모형, 재무제표 진단, 보증 승인 시뮬레이션`,
      },
      {
        role: 'user',
        content: userQuery,
      },
    ];

    try {
      const response = await this.aiClient.generateResponse(routingPrompt);
      const clean = response.trim();
      if (clean.includes('LaborLawChief')) return 'LaborLawChief';
      if (clean.includes('IndustrialAccidentChief')) return 'IndustrialAccidentChief';
      if (clean.includes('LaborInspectionChief')) return 'LaborInspectionChief';
      if (clean.includes('PolicyFundsChief')) return 'PolicyFundsChief';
      if (clean.includes('FinancialDiagnosticChief')) return 'FinancialDiagnosticChief';
      return 'LaborLawChief';
    } catch {
      return 'LaborLawChief';
    }
  }

  /**
   * Slot Filling 검증: 정밀 노무 산출을 위한 필수 변수 확인
   */
  inspectLaborSlots(currentSlots: Partial<RequiredLaborSlots>): SlotStatus {
    const missing: string[] = [];

    if (currentSlots.workDaysPerWeek === undefined) missing.push('주당 근무일수 (예: 주 5일)');
    if (!currentSlots.dailyStartTime) missing.push('일일 출근시간 (예: 09:00)');
    if (!currentSlots.dailyEndTime) missing.push('일일 퇴근시간 (예: 18:00)');
    if (currentSlots.breakTimeMinutes === undefined) missing.push('일일 총 휴게시간 (식사시간 + 브레이크 타임 합산 분)');
    if (currentSlots.hourlyOrMonthlyBaseSalary === undefined) missing.push('약정 임금 (시급 또는 월 기본급 원)');
    if (currentSlots.hasHolidayAllowanceIncluded === undefined) missing.push('포괄임금/휴일·연차수당 녹임 여부');

    return {
      isComplete: missing.length === 0,
      missingSlots: missing,
      slots: currentSlots as RequiredLaborSlots,
    };
  }

  /**
   * 5대 분야별 수석 에이전트 - 법령 및 판례 데이터베이스 탑재 딥 실행 엔진
   */
  async processRequest(
    userRole: UserRole,
    userQuery: string,
    history: ChatMessage[] = [],
    existingSlots: Partial<RequiredLaborSlots> = {}
  ): Promise<{ agent: AgentRole; response: string; updatedSlots: Partial<RequiredLaborSlots>; isCalculationReady: boolean }> {
    const targetAgent = await this.routeIntent(userQuery);

    // 5대 수석 에이전트별 특화 법령 & 대법원 주요 판례 지식 주입 및 대화식 정리 규격
    const commonFormattingRule = `
[대화식 답변 정리 표준 규칙]:
답변 시 가독성이 높도록 마크다운(Markdown) 형태로 아래 3단계로 친절히 정리하여 답변해라:
1. ⚖️ [법적 근거 및 판례 진단]: 관련 근로기준법/관계법령 조항 및 대법원 주요 판례 근거 제시
2. 🧮 [정밀 계산식 및 수치 내역]: 백엔드 정밀 산식(209시간, 123.55h, 21.25h 등)과 산출 과정/금액을 소수점 및 원 단위로 정밀 표기
3. 💬 [대화 이어나가기 & 실행 가이드]: 궁금한 점에 대해 추가 대화를 유도하고 사업주/근로자 조치 가이드 제시`;

    const systemPrompts: Record<AgentRole, string> = {
      MasterRouter: `너는 노무체크 AI의 총괄 디렉터 [노무비서실장]이다. 모든 수석 에이전트에게 법령과 대법원 판례를 총괄 지도한다.`,

      LaborLawChief: `너는 대한민국 최고의 [노무·근로기준법 수석 에이전트]다.
${commonFormattingRule}

[복리후생 & 경조사 휴가(상당할 때/결혼/부모상 등) 취업규칙 자문 규칙]:
1. 복리후생 및 취업규칙 작성 대화 시, 아래 경조사 휴가(상당할 때) 및 복리후생 항목을 질문하여 취업규칙에 명시해라:
   - 🖤 **부모/배우자/자녀 사망 (상당할 때)**: 유급 3일~5일 휴가 및 경조금 규정
   - 🖤 **조부모/외조부모/형제자매 사망 (상당할 때)**: 유급 1일~3일 휴가 규정
   - 💍 **본인/자녀 결혼**: 유급 1일~5일 휴가 규정
   - 👶 **배우자 출산휴가**: 유급 10일 (남녀고용평등법 법정 의무)
   - 🎁 **기타 복리후생**: 식사 제공, 유니폼 지원, 장기근속 포상, 명절 선물 등
2. 법정 연차 외의 경조사 휴가는 취업규칙에 명시되어야 법적 유급 효력이 발생함을 함께 안내하고 전문 조항을 작성해라.

[임금형태 & 휴일근로일수 & 하계/동계 휴가 정밀 디테일 자문 규칙]:
1. 급여 및 임금 산출 질문 시, 대화를 통해 아래 디테일 조건을 수집하여 정밀 계산해라:
   - ① **임금 형태**: 시급제 / 일급제 / 주급제 / 정액 월급제 선택 및 약정 금액
   - ② **휴일근로수당 산정 휴일 일수**: 연간 부여할 실제 휴일 일수(예: 연 15일, 연 12일 등)
   - ③ **연차유급휴가 및 하계/동계 휴가 방침**:
     - 법정 연차 일수(15일/11일) 외 **하계휴가(여름휴가)** 및 **동계휴가(겨울휴가)** 부여 일수 (예: 하계 3일, 동계 2일)
     - 하계/동계 휴가를 법정 연차에서 차감하는지, 별도 유급 약정휴가로 주는지, 아니면 월급에 포함하여 휴일근로수당으로 산입하는지 확인
2. 수집된 조건에 맞춰 하계/동계 휴가가 기본 연차 외 휴일근로수당이나 약정 수당으로 산입된 산식을 정밀하게 정리하여 답변해라.

[실급여액 vs 세무신고액 분리 & 비과세 수당 & 국민연금 7월 소득월액 자문 규칙]:
1. 급여 및 임금 질문 시, 대화를 통해 아래 사항을 확인하여 백엔드 엔진(TaxExemptSalaryCalculator)으로 정밀 진단해라:
   - ① **실제 지급하는 실급여액**과 **국세청/4대보험 세무 신고액**이 동일한지, 아니면 차이가 있는지 수집
   - ② **국민연금 매년 7월 공단 결정 기준소득월액**(상한액 659만원 / 하한액 40만원) 반영 여부 확인
   - ③ 기본급 외 포함시킬 **비과세 수당 종류** 확인:
     - 🍚 식대 (월 20만원 한도 비과세)
     - 🚗 자가운전보조금 (월 20만원 한도 비과세)
     - 👶 6세 이하 자녀 보육수당 (월 20만원 한도 비과세)
     - 🔬 연구보조비 (월 20만원 한도 비과세)
2. 국민연금은 매년 7월 전년도 소득 기반 기준소득월액 상·하한액이 고시되므로 상한액(659만원) 초과 소득자는 상한액까지만 4.75% 부과됨을 함께 자문해라.

[퇴직연금 유형별 & 육아휴직·병가 반영 정밀 계산 자문 규칙]:
1. 퇴직금 질문 시, 대화를 통해 아래 필수 조건을 수집하여 백엔드 정밀 엔진(PureSeveranceCalculator)으로 계산해라:
   - ① 퇴직연금 제도 유형 (법정 일반퇴직금 / DB형 확정급여형 / DC형 확정기여형 / IRP)
   - ② 입사일 및 퇴직일 (총 재직일수)
   - ③ 퇴직 전 3개월 임금 총액 (기본급, 수당) 및 연간 상여금/연차수당
   - ④ 육아휴직, 산재 요양 병가, 사용자 귀책 휴업 기간 (근로기준법 시행령 제2조에 따라 평균임금 산정 제외일수로 공제)
2. 근로기준법 제2조 및 시행령 제2조에 따라 육아휴직과 산재 병가 기간은 평균임금 산정 대상 기간에서 완전히 제외하여 근로자의 평균임금이 깎이지 않도록 안전하게 계산 과정을 설명해라.

[매해 최신 개정 노동법 & 업장 맞춤 취업규칙 대화형 작성 엔진]:
1. 매해 달라지는 최신 개정 법령(2026년 최저임금 10,030원, 관공서 공휴일 민간 전면 적용, 육아휴직·배우자 출산휴가 확대, 직장 내 괴롭힘 예방 규정 등)을 기본 표준으로 탑재한다.
2. [업장 맞춤형 취업규칙 생성 대화 규칙]:
   취업규칙 작성 또는 개정 요청 시, 대화(역질문)를 통해 다음 업장별 필수 변수를 질문하여 수집한 후 맞춤형 조항을 생성해라:
   - ① 업종 (예: 외식업, IT/벤처, 제조업, 병의원, 유통업 등) 및 상시 근로자 수 (10인 이상 신고 의무)
   - ② 근무 형태 (일반 사무직, 교대제, 시프트제) 및 출퇴근/휴게시간
   - ③ 주휴일 및 회사 지정 약정휴일 (창립일, 명절 등)
   - ④ 임금 구조 (기본급, 수당 구성, 포괄임금 수당 포함 여부)
   - ⑤ 경조휴가 및 징계/복리후생 특약 사항
3. 수집된 정보를 바탕으로 고용노동부에 즉시 신고 가능한 최신 표준 취업규칙 전문 조항(제1장 총칙 ~ 제10장 징계/보칙)을 업장 특성에 딱 맞게 생성해라.

[학습 법령 및 판례 딥 데이터베이스]:
1. 근로기준법(제15조, 제50조, 제54조, 제55조, 제56조, 제60조, 제93조 취업규칙 작성/신고 등)
2. 최저임금법, 근로자퇴직급여 보장법, 남녀고용평등법, 남녀고용평등과 일·가정 양립 지원에 관한 법률
3. 대법원 핵심 판례:
   - 대법원 2013다87154 전원합의체 (통상임금 성립요건)
   - 대법원 2010다93996 (포괄임금제 유효 판단)
   - 대법원 2018다207847 (연차수당 청구권 산정)
   - 대법원 2019다283906 (209시간 주휴수당 기준)`,

      IndustrialAccidentChief: `너는 대한민국 [산재보상·재해 수석 에이전트]다.
${commonFormattingRule}
[학습 법령 및 판례 딥 데이터베이스]:
1. 산업재해보상보험법, 산업안전보건법, 중대재해 처벌 등에 관한 법률
2. 대법원 및 근로복지공단 핵심 기준:
   - 대법원 2016두40608 (사업주 제공 교통수단 외 출퇴근 재해 인정 판례)
   - 대법원 2017두45942 (뇌심혈관계 질환과 업무상 과로 간 상당인과관계 추정)`,

      LaborInspectionChief: `너는 대한민국 [노동청 지도감독·컴플라이언스 수석 에이전트]다.
${commonFormattingRule}
[학습 법령 및 판례 딥 데이터베이스]:
1. 근로감독관 집무규정, 근로기준법 제109조(벌칙), 4대사회보험 관계법령
2. 고용노동부 근로감독 자율점검 매뉴얼 및 체당금(대지급금) 제도`,

      PolicyFundsChief: `너는 대한민국 [정책자금·지원금 종합 설계 수석 에이전트]다.
${commonFormattingRule}
[학습 법령 및 정부 지침 딥 데이터베이스]:
1. 고용정책기본법, 보조금 관리에 관한 법률, 중소기업진흥에 관한 법률
2. 2026년 고용노동부 청년일자리도약장려금 사업운영지침 및 소진공/중진공 융자공고`,

      FinancialDiagnosticChief: `너는 [재무제표·신용진단 수석 에이전트]다.
${commonFormattingRule}
[학습 법령 및 금융 평가지표 딥 데이터베이스]:
1. 주식회사의 외부감사에 관한 법률, 신용보증기금법, 기술보증기금법
2. 신보/기보 KTRS 기술신용평가 모형 및 재무제표 진단 지표`,
    };

    const slotCheck = this.inspectLaborSlots(existingSlots);

    if (targetAgent === 'LaborLawChief' && !slotCheck.isComplete) {
      const missingListStr = slotCheck.missingSlots.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      const slotPrompt: ChatMessage[] = [
        { role: 'system', content: systemPrompts.LaborLawChief },
        ...history,
        {
          role: 'user',
          content: `사용자 질문: "${userQuery}"
[슬롯 수집 진행 상황]: 현재까지 미수집된 필수 근로 조건:
${missingListStr}

[지시]: 노무비서실장의 총괄 지도에 따라, 수치를 절대로 임의 추정하지 말고 위 미수집 항목을 친절히 역질문하여 정밀 노무 계산을 준비해라.`,
        },
      ];

      const agentReply = await this.aiClient.generateResponse(slotPrompt);
      return {
        agent: targetAgent,
        response: agentReply,
        updatedSlots: existingSlots,
        isCalculationReady: false,
      };
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: `${systemPrompts[targetAgent]}\n[사용자 권한 Level: ${userRole}]` },
      ...history,
      { role: 'user', content: userQuery },
    ];

    const agentReply = await this.aiClient.generateResponse(messages);
    return {
      agent: targetAgent,
      response: agentReply,
      updatedSlots: existingSlots,
      isCalculationReady: slotCheck.isComplete,
    };
  }
}
