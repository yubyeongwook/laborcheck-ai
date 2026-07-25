import { UnifiedAIClient, ChatMessage } from './client';

/**
 * 5대 분야별 수석 에이전트 Enum 및 Slot-Filling 정의
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
  workDaysPerWeek?: number;         // 주 당 근무 일수 (예: 5일)
  dailyStartTime?: string;          // 시작 시간 (예: "09:00")
  dailyEndTime?: string;            // 종료 시간 (예: "18:00")
  breakTimeMinutes?: number;        // 휴게 시간(분) (예: 60분)
  hourlyOrMonthlyBaseSalary?: number; // 약정임금 또는 시급/월급 (원)
  hasHolidayAllowanceIncluded?: boolean; // 휴일/연차 녹임(포괄임금) 여부
  holidayDailyWorkHours?: number;   // 휴일 1일 근무시간 (예: 10.5시간)
  annualHolidayCount?: number;      // 연간 휴일 일수 (예: 15일)
  annualLeaveCount?: number;        // 연간 연차 일수 (예: 11일 또는 15일)
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
   * Master Router: Analyze user query intent and route to the appropriate Chief Agent
   */
  async routeIntent(userQuery: string): Promise<AgentRole> {
    const routingPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: `너는 노무체크 AI의 [Master Router]다. 사용자의 질문을 분석하여 5대 수석 에이전트 중 가장 적합한 1곳으로 정확히 라우팅해라.
반드시 아래 5개 코드 이름 중 하나만 정확히 단어로 답변해라 (설명 금지):
- LaborLawChief : 근로계약, 임금, 주휴수당, 209시간, 연차, 퇴직금, 근로시간 계산 질문
- IndustrialAccidentChief : 산재, 업무상 재해, 요양급여, 휴업급여, 장해급여 서식 및 판단
- LaborInspectionChief : 노동청 근로감독, 임금체불 진정, 4대보험 리스크, 컴플라이언스
- PolicyFundsChief : 고용장려금, 청년일자리 도약장려금, 정부 융자/출연금, R&D 지원금
- FinancialDiagnosticChief : 재무제표 분석, 신용보증기금/기술보증기금 평가, 정책자금 승인 확률 시뮬레이션`,
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
      return 'LaborLawChief'; // Default fallback
    } catch {
      return 'LaborLawChief';
    }
  }

  /**
   * Slot Filling Inspector: Verify if all parameters required for 0%-error calculation are gathered.
   * STRICT RULE: Do not output any calculated figure before all slots are filled.
   */
  inspectLaborSlots(currentSlots: Partial<RequiredLaborSlots>): SlotStatus {
    const missing: string[] = [];

    if (currentSlots.workDaysPerWeek === undefined) missing.push('주당 근무일수 (예: 주 5일)');
    if (!currentSlots.dailyStartTime) missing.push('일일 출근시간 (예: 09:00)');
    if (!currentSlots.dailyEndTime) missing.push('일일 퇴근시간 (예: 18:00)');
    if (currentSlots.breakTimeMinutes === undefined) missing.push('일일 휴게시간 (예: 60분)');
    if (currentSlots.hourlyOrMonthlyBaseSalary === undefined) missing.push('약정 임금 (시급 또는 월 기본급 원)');
    if (currentSlots.hasHolidayAllowanceIncluded === undefined) missing.push('포괄임금/휴일·연차수당 녹임(포함) 여부');

    return {
      isComplete: missing.length === 0,
      missingSlots: missing,
      slots: currentSlots as RequiredLaborSlots,
    };
  }

  /**
   * Chief Agent Dispatcher with RBAC and Slot Enforcement
   */
  async processRequest(
    userRole: UserRole,
    userQuery: string,
    history: ChatMessage[] = [],
    existingSlots: Partial<RequiredLaborSlots> = {}
  ): Promise<{ agent: AgentRole; response: string; updatedSlots: Partial<RequiredLaborSlots>; isCalculationReady: boolean }> {
    // 1. Master Router Intent Analysis
    const targetAgent = await this.routeIntent(userQuery);

    // 2. Specialized System Prompts per Chief Agent
    const systemPrompts: Record<AgentRole, string> = {
      MasterRouter: '너는 노무체크 AI의 Master Router다.',
      LaborLawChief: `너는 대한민국 최고의 [노무·근로기준법 수석 에이전트]다.
근로기준법, 대법원 판례, 209시간 기준선 및 중복가산 수당(연장 1.5배, 휴일 8h이내 1.5배 / 8h초과 2.0배, 야간 0.5배)을 완벽히 이해한다.
[엄격 규칙]: 필수 근로조건(근무일수, 출퇴근시간, 휴게시간, 약정임금, 휴일녹임여부)이 수집되기 전에는 절대 추정 금액이나 수치를 먼저 제시하지 마라.
부족한 조건이 있으면 친절하고 정교하게 역질문하여 정보를 수집해라.`,

      IndustrialAccidentChief: `너는 대한민국 [산재보상·재해 수석 에이전트]다.
업무상 재해(뇌심혈관계 질환, 근골격계 질환, 출퇴근 재해) 인정기준, 요양/휴업/장해급여 산정 및 근로복지공단 서식 작성 가이드를 전문적으로 제공한다.`,

      LaborInspectionChief: `너는 대한민국 [노동청 지도감독·컴플라이언스 수석 에이전트]다.
고용노동부 근로감독관 점검 대비, 4대보험 리스크 방어, 임금체불 진정 대응 및 자율점검 체크리스트를 전담한다.`,

      PolicyFundsChief: `너는 대한민국 [정책자금 수석 에이전트]다.
중소벤처기업진흥공단, 소상공인시장진흥공단 융자/출연금, R&D 지원금, 청년일자리도약장려금 등 기업 맞춤형 고용/설비 지원금을 매칭한다.`,

      FinancialDiagnosticChief: `너는 [재무제표·신용진단 수석 에이전트]다.
기업의 재무제표(부채비율, 영업이익률, 매출증가율) 분석 및 신용보증기금/기술보증기금 보증서 발급 승인 확률을 정밀 시뮬레이션한다.`,
    };

    // 3. For LaborLawChief, verify Slot-Filling status
    const slotCheck = this.inspectLaborSlots(existingSlots);
    
    if (targetAgent === 'LaborLawChief' && !slotCheck.isComplete) {
      const missingListStr = slotCheck.missingSlots.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      const slotPrompt: ChatMessage[] = [
        { role: 'system', content: systemPrompts.LaborLawChief },
        ...history,
        {
          role: 'user',
          content: `사용자 질문: "${userQuery}"
[슬롯 수집 진행 상황]: 현재까지 수집되지 않은 필수 정보가 있습니다:
${missingListStr}

[지시]: 추정 수치나 금액을 절대로 직접 계산하거나 언급하지 말고, 수집되지 않은 위 항목들을 사용자에게 친절히 역질문하여 정밀 계산을 준비해라.`,
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

    // 4. Standard Agent Execution
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
