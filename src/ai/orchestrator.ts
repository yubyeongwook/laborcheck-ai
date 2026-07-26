import { UnifiedAIClient, ChatMessage } from './client';

/**
 * 노무체크 AI - 4대 주요 분야별 수석 에이전트 & 노무비서실장 정의
 */
export type DomainCategory = 'labor' | 'industrial_accident' | 'labor_office' | 'compliance';

export type AgentRole =
  | 'MasterRouter'
  | 'LaborLawChief'           // 노무·임금 수석 (labor)
  | 'IndustrialAccidentChief' // 산재보상·재해 수석 (industrial_accident)
  | 'LaborInspectionChief'    // 노동청 지도감독 수석 (labor_office)
  | 'ComplianceChief'         // 컴플라이언스·4대보험 수석 (compliance)
  | 'PolicyFundsChief'
  | 'FinancialDiagnosticChief';

export type UserRole = 'super_admin' | 'agency_admin' | 'company_admin' | 'employee';

export interface RequiredLaborSlots {
  workDaysPerWeek?: number;            // 주 당 근무 일수
  dailyStartTime?: string;             // 출근 시간
  dailyEndTime?: string;               // 퇴근 시간
  breakTimeMinutes?: number;           // 휴게 시간(분)
  hourlyOrMonthlyBaseSalary?: number;  // 약정임금 (시급/월급)
  hasHolidayAllowanceIncluded?: boolean; // 포괄임금/수당 녹임 여부
  holidayDailyWorkHours?: number;      // 휴일 1일 근무시간
  annualHolidayCount?: number;         // 연간 휴일 일수
  annualLeaveCount?: number;           // 연간 연차 일수
}

export interface RequiredSanjaeSlots {
  accidentDate?: string;               // 재해 발생일자 (YYYY-MM-DD)
  accidentType?: 'accident' | 'disease' | 'commuting'; // 사고/질병/출퇴근재해
  diseaseDetail?: string;              // 질병/상병명 또는 사고 내용
  treatmentDays?: number;              // 요양/치료 일수
  last3MonthsTotalWages?: number;     // 3개월간 임금 총액
  dailyOrdinaryWage?: number;          // 1일 통상임금 (보정용)
}

export interface SlotStatus<T> {
  isComplete: boolean;
  missingSlots: string[];
  slots: T;
}

export class MasterAgentOrchestrator {
  private aiClient: UnifiedAIClient;

  constructor(aiClient?: UnifiedAIClient) {
    this.aiClient = aiClient || new UnifiedAIClient();
  }

  /**
   * 노무비서실장 (Master Router): 사용자 질의 분석 후 4대 분야로 분기
   * (labor / industrial_accident / labor_office / compliance)
   */
  async routeDomain(userQuery: string): Promise<DomainCategory> {
    const routingPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: `너는 노무체크 AI의 총괄 디렉터 [노무비서실장]이다. 사용자의 질문을 분석하여 4대 전문 분야 중 1곳으로 정확히 라우팅해라.
반드시 아래 4개 단어 중 하나만 답변해라 (단어 외 답변 금지):
- labor : 근로계약, 포괄임금, 209시간, 급여계산, 연차유급휴가, 퇴직금, 주휴수당
- industrial_accident : 업무상 사고, 뇌심혈관계/근골격계/직무스트레스 질병, 산재승인, 휴업급여(70%), 평균임금/통상임금 보정, 요양급여 신청서, 재해경위서
- labor_office : 고용노동부 임금체불 진정, 근로감독 대비 체크리스트, 주 52시간 위반, 부당해고 진정
- compliance : 4대보험 취득/상실 데이터, 취업규칙 신고, 컴플라이언스 체크리스트, 세무 비과세`,
      },
      {
        role: 'user',
        content: userQuery,
      },
    ];

    try {
      const response = await this.aiClient.generateResponse(routingPrompt);
      const clean = response.trim().toLowerCase();
      if (clean.includes('industrial_accident') || clean.includes('산재')) return 'industrial_accident';
      if (clean.includes('labor_office') || clean.includes('노동청')) return 'labor_office';
      if (clean.includes('compliance') || clean.includes('4대보험')) return 'compliance';
      return 'labor';
    } catch {
      return 'labor';
    }
  }

  /**
   * AgentRole 호환용 라우팅 메서드
   */
  async routeIntent(userQuery: string): Promise<AgentRole> {
    const domain = await this.routeDomain(userQuery);
    switch (domain) {
      case 'labor': return 'LaborLawChief';
      case 'industrial_accident': return 'IndustrialAccidentChief';
      case 'labor_office': return 'LaborInspectionChief';
      case 'compliance': return 'ComplianceChief';
      default: return 'LaborLawChief';
    }
  }

  /**
   * Slot Filling 검증: 정밀 노무 산출 필수 변수
   */
  inspectLaborSlots(currentSlots: Partial<RequiredLaborSlots>): SlotStatus<Partial<RequiredLaborSlots>> {
    const missing: string[] = [];

    if (currentSlots.workDaysPerWeek === undefined) missing.push('주당 근무일수 (예: 주 5일)');
    if (!currentSlots.dailyStartTime) missing.push('일일 출근시간 (예: 09:00)');
    if (!currentSlots.dailyEndTime) missing.push('일일 퇴근시간 (예: 18:00)');
    if (currentSlots.breakTimeMinutes === undefined) missing.push('일일 총 휴게시간 (식사 및 브레이크 타임 분)');
    if (currentSlots.hourlyOrMonthlyBaseSalary === undefined) missing.push('약정 임금 (시급 또는 월 기본급 원)');
    if (currentSlots.hasHolidayAllowanceIncluded === undefined) missing.push('포괄임금/휴일·연차수당 녹임 여부');

    return {
      isComplete: missing.length === 0,
      missingSlots: missing,
      slots: currentSlots,
    };
  }

  /**
   * Slot Filling 검증: 정밀 산재 산출 및 요양신청서 생성을 위한 필수 변수
   */
  inspectSanjaeSlots(currentSlots: Partial<RequiredSanjaeSlots>): SlotStatus<Partial<RequiredSanjaeSlots>> {
    const missing: string[] = [];

    if (!currentSlots.accidentDate) missing.push('재해 발생일자 (예: 2026-03-15)');
    if (!currentSlots.accidentType) missing.push('재해 유형 (사고 / 뇌심·근골격계 질병 / 출퇴근 재해)');
    if (!currentSlots.diseaseDetail) missing.push('상병명 또는 재해 경위 내용');
    if (currentSlots.treatmentDays === undefined) missing.push('예상 치료/입원/통원 일수 (일)');
    if (currentSlots.last3MonthsTotalWages === undefined) missing.push('재해 이전 3개월간 지급된 임금 총액 (원)');

    return {
      isComplete: missing.length === 0,
      missingSlots: missing,
      slots: currentSlots,
    };
  }

  /**
   * 산재 요양급여 신청서 및 재해경위서 초안 자동 생성
   */
  async generateSanjaeApplicationDraft(
    slots: RequiredSanjaeSlots,
    employeeInfo: { name: string; rrnMasked: string; companyName: string; position: string }
  ): Promise<string> {
    const draftPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: `너는 근로복지공단 서식 전문 [산재보상 수석 에이전트]다.
근로자의 재해 정보와 슬롯 데이터를 기반으로 고용노동부/근로복지공단 제출용 [요양급여 신청서] 및 [재해경위서] 완벽 초안을 마크다운 문서 서식으로 생성해라.
사업주 날인이 없어도 근로자 단독 신청이 가능함을 명시하고, 대법원 판례 및 인과관계 입증 팁을 서식 하단에 명확히 첨부해라.`,
      },
      {
        role: 'user',
        content: `[근로자 및 사업장 정보]:
- 성명: ${employeeInfo.name} (주민번호: ${employeeInfo.rrnMasked})
- 소속 사업장: ${employeeInfo.companyName} (${employeeInfo.position})

[재해 슬롯 데이터]:
- 재해 발생일: ${slots.accidentDate}
- 재해 유형: ${slots.accidentType}
- 상병/재해 내용: ${slots.diseaseDetail}
- 요양 일수: ${slots.treatmentDays}일
- 3개월 임금 총액: ${slots.last3MonthsTotalWages?.toLocaleString()}원

위 정보를 사용하여 서면 제출 가능한 요양급여 신청서 및 재해경위서 전문 초안을 작성해 줘.`,
      },
    ];

    return await this.aiClient.generateResponse(draftPrompt);
  }

  /**
   * 4대 분야별 수석 에이전트 오케스트레이션 실행 엔진
   */
  async processRequest(
    userRole: UserRole,
    userQuery: string,
    history: ChatMessage[] = [],
    existingLaborSlots: Partial<RequiredLaborSlots> = {},
    existingSanjaeSlots: Partial<RequiredSanjaeSlots> = {}
  ): Promise<{
    domain: DomainCategory;
    agent: AgentRole;
    response: string;
    updatedLaborSlots: Partial<RequiredLaborSlots>;
    updatedSanjaeSlots: Partial<RequiredSanjaeSlots>;
    isCalculationReady: boolean;
  }> {
    const domain = await this.routeDomain(userQuery);
    const agent = await this.routeIntent(userQuery);

    const commonFormattingRule = `
[노무비서실장의 눈높이 친절 대화 원칙]:
답변 및 역질문 시 한자어 법률 용어나 딱딱한 행정 단어를 절대 사용하지 말고, 사장님과 근로자가 10초 만에 이해하고 편하게 답변할 수 있는 친근한 생활 대화체를 써라.

[대화식 답변 정리 표준 규칙]:
답변 시 마크다운(Markdown) 형태로 아래 3단계로 친절히 정리하여 대답해라:
1. ⚖️ [법적 근거 및 판례 진단]: 쉬운 설명과 함께 관련 근로기준법/산재보험법/판례 근거 제시
2. 🧮 [정밀 계산식 및 수치 내역]: 백엔드 Pure TypeScript 계산 수식(209시간, 123.55h, 산재 70% 통상임금 보정) 적용 결과
3. 💬 [대화 이어나가기 & 실행 가이드]: 사장님/근로자가 다음에 할 일을 친절히 안내`;

    const systemPrompts: Record<AgentRole, string> = {
      MasterRouter: `너는 노무체크 AI 총괄 [노무비서실장]이다. 노동 전담 부장판사의 법리 판단과 직업환경의학과 전문의의 의학 소견을 종합 지휘한다.`,

      LaborLawChief: `너는 대한민국 최고 권위의 [노동 전담 부장판사 및 노무·근로기준법 수석 에이전트]다.
${commonFormattingRule}
[판사급 핵심 지침]:
1. 대법원 전원합의체 판례(통상임금 성립요건 2013다87154, 포괄임금 유효성 2010다93996, 209시간 주휴수당 2019다283906 등)에 입각하여 위법성 및 수당 청구권을 명확히 법리 판단한다.
2. 백엔드 정밀 급여 산식(174h+35h=209h 기본, 주 19h 연장=123.55h, 연15일 일10.5h 휴일중복가산=21.25h)을 100% 연동하여 판결문에 준하는 오차 0% 결과를 제공한다.`,

      IndustrialAccidentChief: `너는 대한민국 최고의 [산재 전담 판사 & 직업환경의학과 전문의 수석 에이전트]다.
${commonFormattingRule}
[산재 승인 vs 부승인 사건사고 딥 판정 데이터베이스 100% 반영 지침]:
사용자의 질문 및 사건 재해 경위에 대해 아래 근로복지공단·고용노동부 지침 및 법원 판례 기준 [승인 vs 부승인] 가능성을 정밀 판정하고 입증 전략을 제안해라:

1. 🫀 **[뇌심혈관계 질환 (뇌출혈/뇌경색/심근경색/청사)]**:
   - ✅ **승인 케이스**:
     * 급성 과로: 발병 전 24시간 이내 예측 곤란한 돌발사태/급격한 업무 환경 변화
     * 단기 과로: 발병 전 1주일간 업무량/업무시간이 이전 12주간 평균 대비 30% 이상 증가
     * 만성 과로: 발병 전 12주간 주 평균 60시간 초과 (주 52시간 초과 시 야간근무·교대제·육체적 강도 등 가산요인 산입)
   - ❌ **부승인 케이스 및 방어책**: 주 52시간 미만 근무 + 고혈압/당뇨 기저질환의 단순 자연경과적 악화 주장 시 -> *업무상 강한 스트레스 및 유해 작업 환경을 입증하여 부승인 뒤집기 전략 제안*

2. 🦴 **[근골격계 질환 (요추/경추 디스크, 회전근개 파열, 수근관 증후군)]**:
   - ✅ **승인 케이스**: 신체부담작업(반복 동작, 부적절한 자세, 중량물 들기, 진동)을 수개월~수년간 지속 수행하여 기존 퇴행성 질환이 업무로 급격히 악화(자연경과 이상)된 경우
   - ❌ **부승인 케이스 및 방어책**: 단순 연령 증가에 따른 자연스러운 퇴행성 질환으로 보아 부승인 시 -> *작업 자세 사진, 중량물 무게/횟수 표, 동료 진술서로 신체부담 신체부위별 입증 표 작성 가이드*

3. 🧠 **[직무스트레스 & 정신질환 (우울증, 적응장애, 극단적 선택)]**:
   - ✅ **승인 케이스**: 직장 내 괴롭힘, 폭언/폭행, 업무상 중대한 실수/사고로 인한 PTSD, 극단적 선택 당시 업무상 스트레스로 정상적 인식/행위선택 능력이 현저히 떨어진 상태 입증 시
   - ❌ **부승인 케이스 및 방어책**: 사적 채무/가정사 원인으로 내모는 경우 -> *사내 카톡, 녹음 파일, 병원 정신건강의학과 기록, 동료 진술서 확보로 업무 관련성 100% 입증*

4. 🚗 **[업무상 사고 & 출퇴근 재해]**:
   - ✅ **승인 케이스**: 사업장 내 작업/대기/생리현상 중 사고, 통상적인 경로/방법에 의한 출퇴근 재해 (도보, 자가용, 버스, 지하철 등)
   - ❌ **부승인 케이스**: 근로자의 사적 일탈/가회 행동 중 사고, 범죄행위/음주운전에 의한 사고

5. 🧪 **[직업성 암 & 유해물질 노출 (벤젠, 석면, 용접휨, 먼지)]**:
   - ✅ **승인 케이스**: 유해 물질 장기 노출 역학조사 및 잠복기 부합 시 역학조사 생략/간이 승인

백엔드 산재 엔진으로 3개월 평균임금, 통상임금 보정(통상임금 > 평균임금 시 대체), 휴업급여(70%, 1일 80,240~127,600원 상하한)를 0% 오차로 정밀 계산하고, 고용노동부/근로복지공단 제출용 [요양급여 신청서] 및 [재해경위서] 초안을 작성해라.`,


      LaborInspectionChief: `너는 대한민국 [노동청 근로감독관 & 근로감독 전문 수석 에이전트]다.
${commonFormattingRule}
[핵심 지침]: 임금체불 진정 대응, 고용노동부 근로감독 대비 체크리스트, 주 52시간 준수, 대지급금 신청 대응 절차를 안내한다.`,

      ComplianceChief: `너는 대한민국 [컴플라이언스·4대보험 수석 에이전트]다.
${commonFormattingRule}
[핵심 지침]: 4대보험 취득/상실 신고 데이터 생성, 취업규칙 법령 준수 진단, 비과세 항목(식대 20만 등) 및 노무 컴플라이언스를 총괄한다.`,

      PolicyFundsChief: `너는 [정책자금 수석 에이전트]다.`,
      FinancialDiagnosticChief: `너는 [재무진단 수석 에이전트]다.`,
    };


    // 노무 분야 슬롯 검증
    const laborSlotCheck = this.inspectLaborSlots(existingLaborSlots);
    if (domain === 'labor' && !laborSlotCheck.isComplete && userQuery.includes('계산')) {
      const missingListStr = laborSlotCheck.missingSlots.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      const slotPrompt: ChatMessage[] = [
        { role: 'system', content: systemPrompts.LaborLawChief },
        ...history,
        {
          role: 'user',
          content: `사용자 질문: "${userQuery}"
[미수집 필수 근로조건]:
${missingListStr}

[지시]: 숫자를 절대 추정하지 말고 위 항목을 친절히 역질문해라.`,
        },
      ];

      const reply = await this.aiClient.generateResponse(slotPrompt);
      return {
        domain,
        agent: 'LaborLawChief',
        response: reply,
        updatedLaborSlots: existingLaborSlots,
        updatedSanjaeSlots: existingSanjaeSlots,
        isCalculationReady: false,
      };
    }

    // 산재 분야 슬롯 검증
    const sanjaeSlotCheck = this.inspectSanjaeSlots(existingSanjaeSlots);
    if (domain === 'industrial_accident' && !sanjaeSlotCheck.isComplete && (userQuery.includes('신청서') || userQuery.includes('경위서') || userQuery.includes('계산'))) {
      const missingListStr = sanjaeSlotCheck.missingSlots.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      const slotPrompt: ChatMessage[] = [
        { role: 'system', content: systemPrompts.IndustrialAccidentChief },
        ...history,
        {
          role: 'user',
          content: `사용자 질문: "${userQuery}"
[미수집 필수 산재/재해 항목]:
${missingListStr}

[지시]: 정확한 산재 보상금 계산 및 요양급여 신청서/재해경위서 초안 작성을 위해 위 미수집 항목을 친절히 역질문해라.`,
        },
      ];

      const reply = await this.aiClient.generateResponse(slotPrompt);
      return {
        domain,
        agent: 'IndustrialAccidentChief',
        response: reply,
        updatedLaborSlots: existingLaborSlots,
        updatedSanjaeSlots: existingSanjaeSlots,
        isCalculationReady: false,
      };
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: `${systemPrompts[agent]}\n[사용자 권한 Level: ${userRole}]` },
      ...history,
      { role: 'user', content: userQuery },
    ];

    const reply = await this.aiClient.generateResponse(messages);
    return {
      domain,
      agent,
      response: reply,
      updatedLaborSlots: existingLaborSlots,
      updatedSanjaeSlots: existingSanjaeSlots,
      isCalculationReady: domain === 'labor' ? laborSlotCheck.isComplete : sanjaeSlotCheck.isComplete,
    };
  }
}

