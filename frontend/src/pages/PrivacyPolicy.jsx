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
          <p style={{ margin: '0 0 0.5rem 0' }}>회사는 다음과 같은 개인정보를 수집합니다.</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>회원가입 시: 이메일 주소, 비밀번호, 휴대폰 번호</li>
            <li>문의하기 이용 시: 이름, 이메일 주소, 연락처(선택), 문의 내용</li>
            <li>서비스 이용 과정에서 자동 생성·수집되는 정보: 접속 로그, 서비스 이용 기록</li>
          </ul>
          <p style={{ margin: '0.5rem 0 0 0' }}>수집 방법: 홈페이지 회원가입 및 문의하기 양식을 통한 이용자 직접 입력</p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>2. 개인정보의 수집 및 이용 목적</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>회원 식별 및 로그인, 서비스 이용 권한 관리</li>
            <li>문의 접수 및 답변, 서비스 관련 안내(카카오톡·이메일 등) 발송</li>
            <li>서비스 부정 이용 방지 및 오류 대응</li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>3. 개인정보의 보유 및 이용 기간</h3>
          <p style={{ margin: 0 }}>
            원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 회원 탈퇴 시까지, 또는 문의 처리 완료 후 3년간 보관하며,
            관계 법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>4. 개인정보의 제3자 제공 및 처리위탁</h3>
          <p style={{ margin: 0 }}>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 서비스 운영을 위해 아래와 같이 데이터 처리 업무를 위탁하고 있습니다.
          </p>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
            <li>Supabase (데이터베이스 및 인증 서비스 운영)</li>
            <li>Render (웹사이트 호스팅)</li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>5. 이용자의 권리와 행사 방법</h3>
          <p style={{ margin: 0 }}>
            이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 문의하기 페이지 또는 아래 연락처를 통해 요청해 주시면
            지체 없이 조치하겠습니다.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>6. 개인정보 보호책임자 및 문의처</h3>
          <p style={{ margin: 0 }}>
            개인정보 관련 문의사항은 <a href="#/contact" style={{ color: '#38bdf8' }}>문의하기</a> 페이지를 통해 접수해 주시기 바랍니다.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>7. 개인정보처리방침의 변경</h3>
          <p style={{ margin: 0 }}>
            이 개인정보처리방침은 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 수 있으며, 변경 시 서비스 내 공지사항 등을 통해
            고지합니다.
          </p>
        </div>

        <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
          시행일: 2026년 7월 19일
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
