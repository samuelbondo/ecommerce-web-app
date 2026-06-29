import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

  return (
    <div style={{ ...s.toast, borderLeft: `4px solid ${colors[type]}` }}>
      <span style={{ ...s.dot, background: colors[type] }} />
      <span style={s.msg}>{message}</span>
      <button onClick={onClose} style={s.close}>×</button>
    </div>
  );
}

const s = {
  toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#fff', padding: '14px 18px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, minWidth: '260px', animation: 'slideIn 0.3s ease' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  msg: { flex: 1, fontSize: '0.9rem', color: '#333' },
  close: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999', padding: 0, lineHeight: 1 },
};
