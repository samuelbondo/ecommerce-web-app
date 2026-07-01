import { useRef, useState } from 'react';
import API from '../api';

export default function ImageUpload({ currentUrl, onUpload, label = 'Image', size = 'md' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const h = size === 'sm' ? 80 : size === 'lg' ? 200 : 120;

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB'); return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUpload(res.data.url);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={s.label}>{label}</label>}
      <div
        style={{ ...s.zone, height: h, borderColor: drag ? '#e94560' : uploading ? '#3b82f6' : '#e5e7eb', background: drag ? '#fff5f7' : '#fafafa' }}
        onClick={() => !uploading && fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="preview" style={{ ...s.preview, height: h - 16 }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={s.placeholder}>
            <span style={{ fontSize: '1.6rem' }}>{uploading ? '⏳' : '📷'}</span>
            <span style={s.placeholderText}>
              {uploading ? 'Uploading…' : 'Click or drag image here'}
            </span>
            <span style={s.placeholderSub}>PNG, JPG, WEBP — max 5 MB</span>
          </div>
        )}
        {uploading && <div style={s.uploadingOverlay}><span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Uploading…</span></div>}
      </div>

      <div style={s.row}>
        <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} style={s.btn}>
          {uploading ? '⏳ Uploading…' : currentUrl ? '🔄 Change Image' : '📤 Upload Image'}
        </button>
        {currentUrl && (
          <button type="button" onClick={() => onUpload('')} style={s.btnRemove}>✕ Remove</button>
        )}
      </div>

      {error && <span style={s.error}>{error}</span>}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => upload(e.target.files[0])} />
    </div>
  );
}

const s = {
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#555' },
  zone: { border: '2px dashed', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s, background 0.2s' },
  preview: { width: '100%', objectFit: 'contain', display: 'block' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' },
  placeholderText: { fontSize: '0.85rem', color: '#64748b', fontWeight: 500 },
  placeholderSub: { fontSize: '0.72rem', color: '#aaa' },
  uploadingOverlay: { position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btn: { padding: '7px 14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  btnRemove: { padding: '7px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem' },
  error: { fontSize: '0.78rem', color: '#ef4444' },
};
