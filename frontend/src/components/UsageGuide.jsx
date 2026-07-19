import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { GUIDE_CONTENT } from '../data/guideContent.js';

function UsageGuide({ guideKey }) {
  const [open, setOpen] = useState(false);
  const guide = GUIDE_CONTENT[guideKey];
  if (!guide) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: open ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px',
          padding: '0.65rem 1rem', color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        <BookOpen size={16} />
        사용가이드 보기
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{
          marginTop: '0.6rem', background: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '10px', padding: '1rem 1.25rem'
        }}>
          <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', margin: '0 0 0.75rem 0' }}>{guide.title}</h3>
          <ol style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.7' }}>
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {guide.tips && guide.tips.length > 0 && (
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.6rem' }}>
              {guide.tips.map((tip, i) => (
                <p key={i} style={{ display: 'flex', gap: '0.4rem', margin: '0.3rem 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.6' }}>
                  <Lightbulb size={14} style={{ flexShrink: 0, marginTop: '0.15rem', color: '#fbbf24' }} />
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UsageGuide;
