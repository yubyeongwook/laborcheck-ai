import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../context/AuthContext.jsx';

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('문의 접수 기능이 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('이름, 이메일, 문의 내용은 필수입니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('inquiries').insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim()
      });
      if (insertError) throw insertError;
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err.message || '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Mail size={26} color="#38bdf8" /> 문의하기</h1>
        <p className="tool-page-desc">
          서비스 이용 중 궁금한 점이나 오류 제보, 제휴 문의 등을 남겨주시면 확인 후 답변드리겠습니다.
        </p>
      </div>

      <section className="glass-panel">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={40} color="#34d399" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>문의가 접수되었습니다</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              남겨주신 이메일로 확인 후 순차적으로 답변드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{ marginTop: '1.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              새 문의 작성하기
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
              <label className="form-label">이메일 *</label>
              <input type="email" className="text-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">연락처 (선택)</label>
              <input type="tel" className="text-input" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="form-label">문의 내용 *</label>
              <textarea
                className="textarea-input"
                rows={6}
                placeholder="궁금한 점이나 오류 내용을 자세히 적어주세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <Send size={16} />
              {submitting ? '접수 중...' : '문의 보내기'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default ContactForm;
