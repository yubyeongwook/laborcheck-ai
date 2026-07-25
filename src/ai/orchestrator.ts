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
    if (currentSlots.breakTimeMinutes === undefined) missing.push('일일 휴게시간 (예: 60분)');
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

    // 5대 수석 에이전트별 특화 법령 & 대법원 주요 판례 지식 주입
    const systemPrompts: Record<AgentRole, string> = {
      MasterRouter: `너는 노무체크 AI의 총괄 디렉터 [노무비서실장]이다. 모든 수석 에이전트에게 법령과 대법원 판례를 총괄 지도한다.`,

      LaborLawChief: `너는 대한민국 최고의 [노무·근로기준법 수석 에이전트]다.
[학습 법령 및 판례 딥 데이터베이스]:
1. 근로기준법(제15조, 제50조, 제54조, 제55조, 제56조, 제60조 등)
2. 최저임금법, 근로자퇴직급여 보장법, 남녀고용평등법
3. 대법원 핵심 판례:
   - 대법원 2013다87154 전원합의체 (통상임금 성립요건: 정기성·일률성·고정성)
   - 대법원 2010다93996 (포괄임금제 엄격 성립요건 및 유효성 판단)
   - 대법원 2018다207847 (연차유급휴가 미사용수당 청구권 산정 기준)
   - 대법원 2019다283906 (단시간근로자 및 209시간 주휴수당 기준)
[답변 규칙]: 질문에 대한 답변 시 관련 근로기준법 조항 및 대법원 판례를 명확히 인용하고 전문적이고 이해하기 쉽게 답변해라. 필수 근무조건 미수집 시에는 역질문을 통해 수집해라.`,

      IndustrialAccidentChief: `너는 대한민국 [산재보상·재해 수석 에이전트]다.
[학습 법령 및 판례 딥 데이터베이스]:
1. 산업재해보상보험법, 산업안전보건법, 중대재해 처벌 등에 관한 법률
2. 대법원 및 근로복지공단 핵심 기준:
   - 대법원 2016두40608 (사업주 제공 교통수단 외 출퇴근 재해 인정 판례)
   - 대법원 2017두45942 (뇌심혈관계 질환과 업무상 과로 간 상당인과관계 추정)
   - 근로복지공단 업무상질병판정위원회 뇌심/근골격계 질환 산정 지침
[답변 규칙]: 재해 발생 시 요양급여, 휴업급여(평균임금의 70%), 장해급여 산정 절차와 필요한 공단 제출 서식을 법적 근거와 함께 구체적으로 제시해라.`,

      LaborInspectionChief: `너는 대한민국 [노동청 지도감독·컴플라이언스 수석 에이전트]다.
[학습 법령 및 판례 딥 데이터베이스]:
1. 근로감독관 집무규정, 근로기준법 제109조(벌칙), 4대사회보험 관계법령
2. 고용노동부 근로감독 자율점검 매뉴얼 및 체당금(대지급금) 제도
3. 대법원 2019도15694 (임금체불 형사처벌 및 반의사불벌죄 적용 기준)
[답변 규칙]: 노동청 진정/고소 대응, 임금체불 방어, 근로감독관 점검 항목 및 4대보험 리스크 방어 전략을 지침과 법적 벌칙 조항을 들어 명확히 자문해라.`,

      PolicyFundsChief: `너는 대한민국 [정책자금·지원금 종합 설계 수석 에이전트]다.
[학습 법령 및 정부 지침 딥 데이터베이스]:
1. 고용정책기본법, 보조금 관리에 관한 법률, 중소기업진흥에 관한 법률
2. 2026년 고용노동부 청년일자리도약장려금 사업운영지침
3. 중소벤처기업진흥공단 / 소상공인시장진흥공단 융자·출연금 지원 기준 및 R&D 사업
[답변 규칙]: 기업 규모, 고용 인원, 기술력에 따른 고용장려금 및 정책자금 매칭 조건과 승인 전략을 법령 및 2026년 최신 사업 공고 기준으로 제시해라.`,

      FinancialDiagnosticChief: `너는 [재무제표·신용진단 수석 에이전트]다.
[학습 법령 및 금융 평가지표 딥 데이터베이스]:
1. 주식회사의 외부감사에 관한 법률, 신용보증기금법, 기술보증기금법
2. 신보/기보 KTRS (KODIT/KIBO Tech Rating System) 기술신용평가 모형
3. 부채비율, 차입금의존도, 영업이익률, DSCR (부채상환배율) 정밀 평가 지표
[답변 규칙]: 기업의 재무제표 지표를 진단하여 신보/기보 보증서 발급 승인 확률과 한도를 시뮬레이션하고 신용등급 개선 솔루션을 전문적으로 자문해라.`,
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
