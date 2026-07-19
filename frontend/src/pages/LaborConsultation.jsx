import React, { useState } from 'react';
import { MessageCircleQuestion, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../context/AuthContext.jsx';

function LaborConsultation() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('상담 접수 기능이 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setError('이름, 연락처, 이메일, 궁금한 내용은 필수입니다.');
      return;
    }
    if (!privacyAgreed) {
      setError('개인정보 수집·이용에 동의해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('inquiries').insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        type: 'consultation'
      });
      if (insertError) throw insertError;

      // 관리자에게 이메일 알림 발송 (실패해도 상담 신청 자체는 이미 접수된 것으로 처리)
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiBaseUrl}/api/send-consultation-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), message: message.trim() })
        });
      } catch (emailErr) {
        console.error('상담 신청 이메일 알림 발송 실패:', emailErr);
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setPrivacyAgreed(false);
    } catch (err) {
      setError(err.message || '상담 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><MessageCircleQuestion size={26} color="#38bdf8" /> 노무 상담받기</h1>
        <p className="tool-page-desc">
          궁금한 노무 이슈를 남겨주시면 담당자가 확인 후 이메일 또는 연락처로 답변드립니다.
        </p>
      </div>

      <section className="glass-panel">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={40} color="#34d399" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>상담 신청이 접수되었습니다</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              남겨주신 이메일 또는 연락처로 확인 후 순차적으로 답변드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{ marginTop: '1.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              새 상담 신청하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="form-label">이름 *</label>
              <input type="text" className="text-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">연락처 *</label>
              <input type="tel" className="text-input" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">이메일 *</label>
              <input type="email" className="text-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">궁금한 내용 *</label>
              <textarea
                className="textarea-input"
                rows={6}
                placeholder="어떤 노무 이슈로 상담을 받고 싶으신지 자세히 적어주세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ marginTop: '0.15rem' }}
              />
              <span>
                (필수) <a href="#/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>개인정보 수집·이용</a>에 동의합니다.
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <Send size={16} />
              {submitting ? '접수 중...' : '상담 신청하기'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default LaborConsultation;
