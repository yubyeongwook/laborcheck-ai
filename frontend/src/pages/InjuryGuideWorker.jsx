import React from 'react';
import { HeartPulse } from 'lucide-react';
import UsageGuide from '../components/UsageGuide.jsx';

function InjuryGuideWorker() {
  return (
    <div className="page-container page-container-narrow">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><HeartPulse size={26} color="#f87171" /> 산재 발생 시 근로자 대응 가이드</h1>
        <p className="tool-page-desc">
          업무 중 다치거나 질병에 걸렸다면, 사업주의 확인 없이도 근로자가 직접 산업재해보상보험(산재보험)을 신청할 수 있습니다.
          당황하지 않도록 초기 대응 순서와 신청 절차를 미리 알아두세요.
        </p>
      </div>

      <UsageGuide guideKey="workerInjury" />

      <section className="glass-panel guide-content">
        <h2>① 사고 직후 즉시 해야 할 일</h2>
        <div className="guide-step-list">
          <div className="guide-step">
            <span className="guide-step-num">1</span>
            <div>
              <div className="guide-step-body-title">안전 확보 및 응급조치</div>
              <div className="guide-step-body-desc">가장 먼저 추가 부상을 막고, 필요하다면 119에 신고해 병원 치료를 받으세요.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">2</span>
            <div>
              <div className="guide-step-body-title">병원에서 &quot;업무 중 발생한 사고&quot;임을 명확히 알리기</div>
              <div className="guide-step-body-desc">진료기록에 산재 여부가 남아야 이후 요양급여 신청 시 중요한 증빙자료가 됩니다.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">3</span>
            <div>
              <div className="guide-step-body-title">증거 확보</div>
              <div className="guide-step-body-desc">사고 현장 사진, CCTV 영상 확보 요청, 목격자 연락처, 당시 업무 지시 메신저 기록 등을 최대한 남겨두세요.</div>
            </div>
          </div>
          <div className="guide-step">
            <span className="guide-step-num">4</span>
            <div>
              <div className="guide-step-body-title">회사에 사고 사실 통보</div>
              <div className="guide-step-body-desc">구두로라도 사업주(또는 관리자)에게 사고 사실을 알리고, 가능하면 문자나 메신저 등 기록이 남는 방식으로 통보하세요.</div>
            </div>
          </div>
        </div>

        <h2>② 산재 신청 절차</h2>
        <p>
          산재 요양급여는 <strong>근로복지공단</strong>에 신청합니다. 사업주의 확인(날인)이 없어도 근로자 본인이 직접 신청할 수 있으며,
          사업주가 협조하지 않는다는 이유로 신청을 미룰 필요가 없습니다.
        </p>
        <ul>
          <li><strong>요양급여 신청서</strong>를 작성해 근로복지공단(온라인 토탈서비스, 지사 방문, 우편)에 제출합니다.</li>
          <li>병원에서 발급하는 <strong>소견서</strong>를 함께 제출하면 처리가 빨라집니다.</li>
          <li>근로복지공단이 사업주에게 사실관계를 확인하는 절차를 거치며, 승인되면 치료비(요양급여)와 휴업기간 임금의 일부(휴업급여) 등을 지급받을 수 있습니다.</li>
        </ul>

        <h2>③ 요양 기간에 따른 차이</h2>
        <ul>
          <li><strong>4일 이상 요양이 필요한 경우</strong>: 산재보험 절차로 처리되며, 사업주는 근로복지공단에 산업재해조사표를 제출할 의무가 있습니다.</li>
          <li><strong>3일 이내 요양으로 끝나는 경우</strong>: 산재보험 대신 사업주가 근로기준법상 재해보상(요양보상, 휴업보상)을 직접 지급할 수 있으나, 원한다면 이 경우에도 산재 신청이 가능합니다.</li>
        </ul>

        <h2>④ 사업주가 산재 처리를 거부하거나 은폐하려 할 때</h2>
        <p>
          &quot;산재 처리하면 회사에 불이익이 있다&quot;, &quot;공상 처리로 합의하자&quot;는 식으로 산재 신청을 만류하는 경우가 있습니다.
          이는 근로자의 법적 권리를 침해하는 것이며, 다음과 같이 대응할 수 있습니다.
        </p>
        <ul>
          <li>사업주 동의 없이도 근로복지공단에 <strong>직접 산재를 신청</strong>할 수 있습니다.</li>
          <li>사업주가 산재 발생 사실을 은폐하거나 축소 보고하면 산업재해보상보험법 및 산업안전보건법 위반으로 처벌 대상이 될 수 있습니다.</li>
          <li>공상 처리(회사가 사적으로 치료비만 지급하고 산재 미신청) 합의는 추후 후유증 발생 시 불리할 수 있으므로 신중히 판단하세요.</li>
          <li>부당한 압박이 있었다면 관련 대화 내용(문자, 녹취 등)을 증거로 남겨두는 것이 좋습니다.</li>
        </ul>

        <h2>⑤ 준비 서류 체크리스트</h2>
        <ul>
          <li>요양급여 신청서 (근로복지공단 양식)</li>
          <li>병원 진단서 또는 소견서</li>
          <li>사고 경위서 (본인 작성)</li>
          <li>목격자 진술서 또는 연락처</li>
          <li>사고 현장 사진, CCTV 영상 확보 요청 내역</li>
          <li>업무 지시 관련 메신저·문자 기록</li>
          <li>급여 관련 자료 (근로계약서, 최근 3개월 급여명세서 — 휴업급여 산정용)</li>
        </ul>

        <h2>⑥ 관련 법령 근거</h2>
        <ul>
          <li><strong>산업재해보상보험법</strong>: 요양급여, 휴업급여, 장해급여 등 산재보험 급여 전반을 규정</li>
          <li><strong>근로기준법 제78조~제92조</strong>: 사업주의 재해보상 의무(요양보상, 휴업보상, 장해보상 등)</li>
          <li><strong>산업안전보건법</strong>: 사업주의 산업재해 은폐 금지 및 보고 의무</li>
        </ul>

        <div className="guide-disclaimer">
          본 가이드는 일반적인 절차 안내를 위한 참고용 정보이며 법률 자문이 아닙니다. 실제 산재 신청 및 보상과 관련한 구체적인 판단은 근로복지공단, 공인노무사 또는 변호사 등 전문가와 상담하시기 바랍니다.
        </div>
      </section>
    </div>
  );
}

export default InjuryGuideWorker;
