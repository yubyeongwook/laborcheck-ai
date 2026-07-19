import React, { useState, useEffect } from 'react';
import { ShieldAlert, Inbox, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../context/AuthContext.jsx';

const ADMIN_EMAIL = 'aigoid1203@gmail.com';

function AdminInquiries() {
  const { user, openLoginModal } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadInquiries = async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setInquiries(data || []);
    } catch (err) {
      setError(err.message || '문의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="page-container page-container-narrow">
        <div className="tool-page-header">
          <h1 className="tool-page-title"><ShieldAlert size={26} color="#fbbf24" /> 관리자 페이지</h1>
        </div>
        <section className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>로그인이 필요합니다.</p>
          <button type="button" className="navbar-btn-primary" onClick={openLoginModal} style={{ border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
            로그인 / 회원가입
          </button>
        </section>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page-container page-container-narrow">
        <div className="tool-page-header">
          <h1 className="tool-page-title"><ShieldAlert size={26} color="#f87171" /> 관리자 페이지</h1>
        </div>
        <section className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#f87171' }}>이 페이지는 관리자 계정만 접근할 수 있습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Inbox size={26} color="#38bdf8" /> 문의 목록</h1>
        <p className="tool-page-desc">사이트에 접수된 문의를 최신순으로 확인합니다.</p>
      </div>

      <section className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>총 {inquiries.length}건</span>
          <button
            type="button"
            onClick={loadInquiries}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {inquiries.length === 0 && !loading && !error && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>접수된 문의가 없습니다.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {inquiries.map((inq) => (
            <div key={inq.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '999px',
                    background: inq.type === 'consultation' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: inq.type === 'consultation' ? '#34d399' : '#38bdf8'
                  }}>
                    {inq.type === 'consultation' ? '노무상담' : '문의하기'}
                  </span>
                  <strong style={{ color: '#f8fafc' }}>{inq.name}</strong>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{inq.email}</span>
                  {inq.phone && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{inq.phone}</span>}
                </div>
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  {new Date(inq.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' }}>{inq.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminInquiries;
