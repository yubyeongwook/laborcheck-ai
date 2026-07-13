import React from 'react';
import { HeartPulse } from 'lucide-react';

function InjuryGuideEmployer() {
  return (
    <div className="page-container page-container-narrow">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><HeartPulse size={26} color="#fbbf24" /> 산재 예방 및 대응 체크리스트</h1>
        <p className="tool-page-desc">
          산업재해는 발생 후 대응보다 사전 준비가 훨씬 중요합니다. 평소 준비해야 할 사항과, 사고 발생 시 사업주가 반드시 지켜야 할
          법적 의무를 초기 단계부터 정리했습니다.
        </p>
      </div>

      <section className="glass-panel guide-content">
        <h2>① 사전 예방을 위해 지금 준비할 것</h2>
        <ul>
          <li><strong>산재보험 가입 확인</strong>: 근로자를 1인이라도 고용하면 산재보험 가입은 원칙적으로 의무입니다. 근로복지공단 토탈서비스에서 가입 여부를 확인하세요.</li>
          <li><strong>위험성평가 실시</strong>: 사업장의 유해·위험 요인을 정기적으로 조사하고 개선 계획을 문서로 남겨두세요.</li>
          <li><strong>안전보건관리체제 구축</strong>: 상시근로자 수에 따라 안전보건관리책임자, 관리감독자, (해당 시) 안전관리자·보건관리자 선임이 필요합니다.</li>
          <li><strong>안전교육 실시 및 기록 보관</strong>: 채용 시 교육, 정기 안전보건교육을 실시하고 교육일지를 반드시 보관하세요. 사고 발생 시 핵심 증빙자료가 됩니다.</li>
          <li><strong>중대재해처벌법 적용 여부 확인</strong>: 상시근로자 5인 이상 사업장은 중대재해처벌법의 적용을 받을 수 있습니다. 대표이사(경영책임자)의 안전보건 확보의무 이행 여부를 점검하세요.</li>
          <li><strong>비상 대응 매뉴얼 마련</strong>: 사고 발생 시 누가, 어떤 순서로 대응할지 미리 정해두고 관리자에게 공유하세요.</li>
        </ul>

        <h2>② 사고 발생 시 사업주의 법적 의무</h2>
        <div className="guide-step-list">
          <div className="guide-step">
            <span className="guide-step-num">1</span>
            <div>
              <div className="guide-step-body-title">즉시 응급조치 및 병원 이송</div>
              <div className="guide-step-body-desc">근로자의 안전과 치료를 최우선으로 조치합니다.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">2</span>
            <div>
              <div className="guide-step-body-title">중대재해 여부 판단 및 즉시 보고</div>
              <div className="guide-step-body-desc">사망, 3개월 이상 요양이 필요한 부상자가 동시에 2명 이상 발생하는 등 중대재해에 해당하면 고용노동부 및 관할 지방고용노동관서에 지체 없이 보고해야 합니다.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">3</span>
            <div>
              <div className="guide-step-body-title">산업재해조사표 제출</div>
              <div className="guide-step-body-desc">사망 또는 3일 이상의 휴업이 필요한 부상·질병이 발생하면 산업재해조사표를 작성해 1개월 이내에 관할 지방고용노동관서에 제출해야 합니다.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">4</span>
            <div>
              <div className="guide-step-body-title">근로자의 산재 신청 협조</div>
              <div className="guide-step-body-desc">근로자가 근로복지공단에 요양급여를 신청할 때 사실관계 확인에 협조해야 합니다. 신청을 방해하거나 만류해서는 안 됩니다.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">5</span>
            <div>
              <div className="guide-step-body-title">사고 경위 기록 및 재발 방지 대책 수립</div>
              <div className="guide-step-body-desc">사고 원인을 조사하고 재발 방지 대책을 문서화해 보관하세요. 이후 유사 사고 발생 시 성실한 관리 노력의 증빙이 됩니다.</div>
            </div>
          </div>
        </div>

        <h2>③ 산재 은폐·축소 시 불이익</h2>
        <p>
          산업재해를 은폐하거나, 산업재해조사표를 거짓으로 작성·제출하는 경우 산업안전보건법 및 산업재해보상보험법에 따라
          형사처벌(징역 또는 벌금) 및 과태료 부과 대상이 될 수 있습니다. &quot;공상 처리&quot;로 무마하려는 시도는 오히려
          더 큰 법적 리스크로 이어질 수 있으므로, 원칙적인 절차를 따르는 것이 사업주에게도 안전합니다.
        </p>

        <h2>④ 사전 준비 체크리스트</h2>
        <ul>
          <li>☐ 산재보험 가입 여부 확인</li>
          <li>☐ 위험성평가 실시 및 문서 보관</li>
          <li>☐ 안전보건관리책임자 등 선임 여부 확인</li>
          <li>☐ 정기 안전보건교육 실시 및 교육일지 보관</li>
          <li>☐ 중대재해처벌법 적용 대상 여부 및 경영책임자 의무 점검</li>
          <li>☐ 사고 발생 시 보고 체계(담당자, 연락망) 문서화</li>
          <li>☐ 비상 연락망 및 응급조치 매뉴얼 게시</li>
        </ul>

        <h2>⑤ 관련 법령 근거</h2>
        <ul>
          <li><strong>산업안전보건법</strong>: 안전보건관리체제, 위험성평가, 안전보건교육, 산업재해 발생 보고 및 은폐 금지</li>
          <li><strong>산업재해보상보험법</strong>: 산재보험 가입 의무, 산업재해조사표 제출 의무</li>
          <li><strong>중대재해 처벌 등에 관한 법률</strong>: 5인 이상 사업장 경영책임자의 안전보건 확보의무</li>
        </ul>

        <div className="guide-disclaimer">
          본 가이드는 일반적인 절차 안내를 위한 참고용 정보이며 법률 자문이 아닙니다. 사업장 규모, 업종에 따라 적용되는 의무가 다를 수 있으므로 구체적인 사항은 고용노동부, 안전보건공단 또는 공인노무사·변호사 등 전문가와 상담하시기 바랍니다.
        </div>
      </section>
    </div>
  );
}

export default InjuryGuideEmployer;
