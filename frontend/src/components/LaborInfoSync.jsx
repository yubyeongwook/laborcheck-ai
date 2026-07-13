import React, { useState, useEffect } from 'react';
import { Save, FolderOpen } from 'lucide-react';

function LaborInfoSync({ onLoad, currentInfo }) {
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(!!localStorage.getItem('laborcheck_user_info'));
  }, []);

  const handleSave = () => {
    if (!currentInfo) return;
    
    // UI에 종속적인 id나 year 등은 저장하지 않거나 정제하여 저장
    const infoToSave = { ...currentInfo };
    delete infoToSave.id;
    
    localStorage.setItem('laborcheck_user_info', JSON.stringify(infoToSave));
    setHasSaved(true);
    alert('현재 입력된 근무 조건이 브라우저에 저장되었습니다. 다른 계산기나 AI 리포트 생성기에서도 [내 정보 불러오기]를 통해 언제든지 이 정보를 다시 사용할 수 있습니다.');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('laborcheck_user_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        onLoad(parsed);
        alert('저장된 근무 정보를 불러왔습니다.');
      } catch (e) {
        alert('저장된 정보를 불러오는 데 실패했습니다.');
      }
    } else {
      alert('저장된 근무 정보가 없습니다. 먼저 근무 조건을 입력하고 [정보 저장]을 눌러주세요.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.75rem', 
      marginBottom: '1.5rem', 
      background: 'rgba(99, 102, 241, 0.04)', 
      padding: '0.75rem 1rem', 
      borderRadius: '12px', 
      border: '1px solid rgba(99, 102, 241, 0.15)', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      flexWrap: 'wrap'
    }}>
      <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 500 }}>
        💡 입력한 근무 조건을 저장하면 다른 계산기와 AI 리포트 작성 시 바로 불러올 수 있습니다. (기기 내에만 안전하게 저장됨)
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={handleSave} 
          style={{ 
            padding: '0.45rem 0.75rem', 
            fontSize: '0.75rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            background: 'rgba(99, 102, 241, 0.15)', 
            border: '1px solid rgba(99, 102, 241, 0.35)', 
            borderRadius: '8px',
            color: '#a5b4fc', 
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
        >
          <Save size={13} /> 정보 저장
        </button>
        <button 
          type="button" 
          onClick={handleLoad} 
          disabled={!hasSaved}
          style={{ 
            padding: '0.45rem 0.75rem', 
            fontSize: '0.75rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            background: hasSaved ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)', 
            border: hasSaved ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '8px',
            color: hasSaved ? '#38bdf8' : '#64748b', 
            cursor: hasSaved ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (hasSaved) e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
          }}
          onMouseLeave={(e) => {
            if (hasSaved) e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
          }}
        >
          <FolderOpen size={13} /> 정보 불러오기
        </button>
      </div>
    </div>
  );
}

export default LaborInfoSync;
