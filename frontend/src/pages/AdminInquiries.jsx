import React, { useState, useEffect } from 'react';
import { ShieldAlert, Inbox, RefreshCw, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../context/AuthContext.jsx';

const ADMIN_EMAIL = 'aigoid1203@gmail.com';

const STATUS_CONFIG = {
  pending: { label: '접수대기', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  in_progress: { label: '진행중', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
  completed: { label: '처리완료', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
  archived: { label: '보관함(숨김)', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' }
};

function AdminInquiries() {
  const { user, openLoginModal } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isAdmin = user?.email === ADMIN_EMAIL;

  const getDeletedIds = () => {
    try {
      return JSON.parse(localStorage.getItem('laborcheck_deleted_inquiry_ids') || '[]');
    } catch {
      return [];
    }
  };

  const saveDeletedId = (id) => {
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem('laborcheck_deleted_inquiry_ids', JSON.stringify(ids));
    }
  };

  const removeDeletedId = (id) => {
    const ids = getDeletedIds().filter(i => i !== id);
    localStorage.setItem('laborcheck_deleted_inquiry_ids', JSON.stringify(ids));
  };

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

      const deletedIds = getDeletedIds();
      const mapped = (data || []).map(inq => {
        if (deletedIds.includes(inq.id) || inq.status === 'archived') {
          return { ...inq, status: 'archived' };
        }
        return inq;
      });
      setInquiries(mapped);
    } catch (err) {
      setError(err.message || '문의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!supabase) return;
    try {
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', id);
      if (updateError) throw updateError;

      if (newStatus !== 'archived') {
        removeDeletedId(id);
      }

      setInquiries(prev =>
        prev.map(inq => (inq.id === id ? { ...inq, status: newStatus } : inq))
      );
    } catch (err) {
      alert('상태 변경 중 오류가 발생했습니다: ' + (err.message || '잠시 후 다시 시도해 주세요.'));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`'${name}' 님의 문의 건을 보관함(숨김목록)으로 이동하시겠습니까?\n\n(DB에 이력은 100% 안전하게 보관되며, 언제든지 보관함 탭에서 복원하실 수 있습니다.)`)) return;

    saveDeletedId(id);
    setInquiries(prev => prev.map(inq => (inq.id === id ? { ...inq, status: 'archived' } : inq)));

    if (supabase) {
      try {
        await supabase.from('inquiries').update({ status: 'archived' }).eq('id', id);
      } catch (err) {
        console.warn('Supabase archive update ignored:', err);
      }
    }
  };

  const handleRestore = async (id, name) => {
    removeDeletedId(id);
    setInquiries(prev => prev.map(inq => (inq.id === id ? { ...inq, status: 'pending' } : inq)));

    if (supabase) {
      try {
        await supabase.from('inquiries').update({ status: 'pending' }).eq('id', id);
      } catch (err) {
        console.warn('Supabase restore update ignored:', err);
      }
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

  const activeInquiries = inquiries.filter(i => i.status !== 'archived');
  const archivedInquiries = inquiries.filter(i => i.status === 'archived');

  const countPending = inquiries.filter(i => (i.status || 'pending') === 'pending').length;
  const countInProgress = inquiries.filter(i => i.status === 'in_progress').length;
  const countCompleted = inquiries.filter(i => i.status === 'completed').length;
  const countArchived = archivedInquiries.length;

  const filteredInquiries = inquiries.filter(inq => {
    const currentStatus = inq.status || 'pending';
    if (statusFilter === 'all') return currentStatus !== 'archived';
    return currentStatus === statusFilter;
  });

  return (
    <div className="page-container">
      <div className="tool-page-header">
        <h1 className="tool-page-title"><Inbox size={26} color="#38bdf8" /> 문의 목록 및 처리 관리</h1>
        <p className="tool-page-desc">사이트에 접수된 고객 문의 상태를 관리(진행중/처리완료)하고 삭제할 수 있습니다.</p>
      </div>

      <section className="glass-panel">
        {/* 상단 탭 및 새로고침 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === 'all' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                color: statusFilter === 'all' ? '#ffffff' : '#94a3b8',
                border: `1px solid ${statusFilter === 'all' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              전체 ({activeInquiries.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === 'pending' ? '#f59e0b' : '#94a3b8',
                border: `1px solid ${statusFilter === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              🟡 접수대기 ({countPending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === 'in_progress' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === 'in_progress' ? '#38bdf8' : '#94a3b8',
                border: `1px solid ${statusFilter === 'in_progress' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              🔵 진행중 ({countInProgress})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === 'completed' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === 'completed' ? '#34d399' : '#94a3b8',
                border: `1px solid ${statusFilter === 'completed' ? '#34d399' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              🟢 처리완료 ({countCompleted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === 'archived' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === 'archived' ? '#f1f5f9' : '#94a3b8',
                border: `1px solid ${statusFilter === 'archived' ? '#94a3b8' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              🗃️ 보관함 (숨김 {countArchived})
            </button>
          </div>

          <button
            type="button"
            onClick={loadInquiries}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            새로고침
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {filteredInquiries.length === 0 && !loading && !error && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem 0' }}>
            해당 조건의 접수된 문의가 없습니다.
          </p>
        )}

        {/* 문의 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredInquiries.map((inq) => {
            const curStatusKey = inq.status || 'pending';
            const curStatus = STATUS_CONFIG[curStatusKey] || STATUS_CONFIG.pending;
            const isArchived = curStatusKey === 'archived';

            return (
              <div
                key={inq.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${curStatus.border}`,
                  borderRadius: '10px',
                  padding: '1.1rem',
                  transition: 'all 0.2s ease',
                  opacity: isArchived ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {/* 이름 & 연락처 정보 */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '1.02rem' }}>{inq.name}</strong>
                      <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{inq.email}</span>
                      {inq.phone && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>📞 {inq.phone}</span>}
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      📅 {new Date(inq.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {/* 상태 선택 및 삭제/복원 버튼 컨트롤 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {/* 상태 설정 드롭다운 */}
                    <select
                      value={curStatusKey}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        background: curStatus.bg,
                        color: curStatus.color,
                        border: `1px solid ${curStatus.border}`,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="pending" style={{ background: '#0f172a', color: '#f59e0b' }}>🟡 접수대기</option>
                      <option value="in_progress" style={{ background: '#0f172a', color: '#38bdf8' }}>🔵 진행중</option>
                      <option value="completed" style={{ background: '#0f172a', color: '#34d399' }}>🟢 처리완료</option>
                      <option value="archived" style={{ background: '#0f172a', color: '#94a3b8' }}>🗃️ 보관함(숨김)</option>
                    </select>

                    {/* 보관 및 복원 버튼 */}
                    {isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(inq.id, inq.name)}
                        title="접수대기 목록으로 복원"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ↩️ 복원
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(inq.id, inq.name)}
                        title="보관함(숨김목록)으로 이동"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                        보관/삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* 문의 내용 */}
                <div style={{ background: '#0f172a', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {inq.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default AdminInquiries;

