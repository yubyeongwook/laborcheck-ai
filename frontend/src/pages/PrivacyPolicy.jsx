import React from 'react';
import { ShieldCheck } from 'lucide-react';

function PrivacyPolicy() {
  return (
    <div className="page-container page-container-narrow">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><ShieldCheck size={26} color="#38bdf8" /> 개인정보처리방침</h1>
        <p className="tool-page-desc">
          LaborCheck AI(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
        </p>
      </div>

      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: '#cbd5e1', fontSize: '0.9rem' }}>
        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>1. 수집하는 개인정보 항목 및 수집 방법</h3>
          <p style={{ margin: '0 0 0.5rem 0' }}>회사는 노무 진단, 1:1 상담 및 AI 법정 보고서 발급을 위해 아래와 같은 개인정보를 수집합니다.</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li><strong>회원가입 시:</strong> 이메일 주소, 비밀번호, 성명, 휴대전화번호</li>
            <li><strong>상담 및 리포트 신청 시:</strong> 성명, 이메일 주소, 휴대전화번호, 회사/사업장 정보, 상세 상담 내용, 첨부 증빙 파일(근로계약서 등)</li>
            <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 쿠키, IP 정보</li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>2. 개인정보의 수집 및 이용 목적</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>AI 급여·노무 정밀 진단서 및 법정 서식(급여명세서, 퇴직금 정산서) 생성·발급</li>
            <li>1:1 맞춤 노무 상담 처리 및 카카오톡 알림톡·문자(SMS)·이메일·전화를 통한 상담 진행 상황 및 결과 안내</li>
            <li><strong>추후 요청 시 전문 노무사 및 제휴 노무법인과의 1:1 상담 및 노무 사건 구제 대리 연결 서비스 제공</strong></li>
            <li>서비스 품질 향상, 불법/부정 이용 방지 및 고충 처리</li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: '#38bdf8', fontSize: '1rem', marginBottom: '0.5rem' }}>3. 개인정보의 제3자 제공 동의 (전문 노무사 연결 및 알림 서비스)</h3>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            회사는 이용자의 동의가 있거나 법률의 특별한 규정에 해당하는 경우에만 개인정보를 제3자에게 제공합니다. 이용자가 전문 상담 및 노무사 연결을 요청하거나 수락한 경우 아래와 같이 개인정보가 제공될 수 있습니다.
          </p>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
              <li><strong>제공받는 자:</strong> 제휴 노무법인 및 전문 노무사, 카카오톡 알림톡/문자(SMS)/이메일 발송 연동 사업자</li>
              <li><strong>제공 목적:</strong> 1:1 맞춤 노무 전문 상담, 노동청 진정·부당해고 구제 사건 대리 연결, 카카오톡·이메일·전화를 통한 상담 결과 안내</li>
              <li><strong>제공 항목:</strong> 성명, 연락처(휴대전화번호/이메일), 상담 신청 내용, 첨부 증빙 파일</li>
              <li><strong>보유 및 이용 기간:</strong> 상담 및 서비스 제공 목적 달성 완료 후 1년 보관 후 지체 없이 파기 (단, 관련 법령에 별도 규정이 있는 경우 해당 기간 준수)</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>4. 개인정보의 보유 및 파기 절차</h3>
          <p style={{ margin: 0 }}>
            원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 지체 없이 해당 정보를 파기합니다. 단, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 따라 보존할 필요가 있는 경우 해당 법정 기간(소비자 불만 또는 분쟁처리에 관한 기록 3년 등) 동안 안전하게 보관 후 영구 파기합니다.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>5. 이용자의 권리와 행사 방법</h3>
          <p style={{ margin: 0 }}>
            이용자는 언제든지 등록되어 있는 자신의 개인정보를 열람, 정정, 삭제, 동의 철회(제3자 제공 동의 철회 포함)할 수 있습니다. 개인정보 보호책임자 또는 문의하기를 통해 지체 없이 조치하겠습니다.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>6. 개인정보 보호책임자 및 문의처</h3>
          <p style={{ margin: 0 }}>
            개인정보 보호책임자: 노무체크 AI 개인정보 관리팀 (이메일: <a href="mailto:aigoid1203@gmail.com" style={{ color: '#38bdf8' }}>aigoid1203@gmail.com</a>)
          </p>
        </div>

        <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          본 방침은 2026년 8월 2일부터 강화 적용됩니다.
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
