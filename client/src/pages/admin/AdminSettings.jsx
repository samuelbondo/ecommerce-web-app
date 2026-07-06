import { useEffect, useState } from 'react';
import Toast from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

const PAYPAL_SUPPORTED = ['AUD','BRL','CAD','CNY','CZK','DKK','EUR','HKD','HUF','ILS','JPY','MYR','MXN','TWD','NZD','NOK','PHP','PLN','GBP','SGD','SEK','CHF','THB','USD'];

const DEFAULTS = {
  site_name: 'Samuel Store',
  site_tagline: 'Quality products at the best prices',
  site_logo: '',
  site_favicon: '',
  accent_color: '#e94560',
  footer_about: '',
  footer_email: '',
  footer_phone: '',
  footer_address: '',
  currency: 'USD',
  paypal_rate: '1',
  tax_rate: '0',
  shipping_fee: '0',
  free_shipping_threshold: '0',
  meta_title: 'Samuel Store',
  meta_description: 'Quality products at the best prices',
  facebook: '',
  instagram: '',
  twitter: '',
};

export default function AdminSettings() {
  const { reload } = useSettings();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('store');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    API.get('/admin/settings')
      .then(r => setForm(prev => ({ ...prev, ...r.data })))
      .catch(() => notify('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post('/admin/settings', { settings: form });
      notify('Settings saved — storefront updated!');
      reload(); // push changes to Navbar, Footer, everywhere immediately
    } catch { notify('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id: 'store',    icon: '🏪', label: 'Store'      },
    { id: 'branding', icon: '🎨', label: 'Branding'   },
    { id: 'footer',   icon: '📄', label: 'Footer'     },
    { id: 'currency', icon: '💱', label: 'Currency'   },
    { id: 'shipping', icon: '🚚', label: 'Shipping'   },
    { id: 'seo',      icon: '🔍', label: 'SEO'        },
    { id: 'social',   icon: '📱', label: 'Social'     },
  ];

  if (loading) return <div style={s.loading}>Loading settings…</div>;

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Settings</h2>
          <p style={s.pageSub}>Changes save to database and reflect across the entire storefront instantly</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={s.btnSave}>
          {saving ? 'Saving…' : '💾 Save All Changes'}
        </button>
      </div>

      <div style={s.layout}>
        <div style={s.tabSidebar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...s.tabItem, ...(tab === t.id ? s.tabActive : {}) }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={s.content}>

          {/* ── STORE ── */}
          {tab === 'store' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🏪 Store Information</h3>
              <p style={s.hint}>These values appear in the page title, order confirmations, and emails.</p>
              <div style={s.grid2}>
                <Field label="Store Name (site_name)" k="site_name" form={form} set={set} placeholder="Samuel Store" />
                <Field label="Tagline" k="site_tagline" form={form} set={set} placeholder="Quality products at the best prices" />
                <Field label="Contact Email" k="footer_email" form={form} set={set} type="email" placeholder="admin@example.com" />
                <Field label="Contact Phone" k="footer_phone" form={form} set={set} placeholder="+250 7XX XXX XXX" />
              </div>
              <Field label="Store Address" k="footer_address" form={form} set={set} placeholder="KK 508 ST, Kigali, Rwanda" />
            </div>
          )}

          {/* ── BRANDING ── */}
          {tab === 'branding' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🎨 Branding</h3>
              <p style={s.hint}>Logo URL and accent color are used in the Navbar, buttons, badges, and product cards everywhere on the storefront.</p>

              <ImageUpload
                label="Site Logo (upload or paste URL below)"
                currentUrl={form.site_logo || ''}
                onUpload={url => set('site_logo', url)}
                size="sm"
              />
              <div style={s.field}>
                <label style={s.label}>Or paste logo URL directly</label>
                <input
                  value={form.site_logo || ''}
                  onChange={e => set('site_logo', e.target.value)}
                  style={s.input}
                  placeholder="https://your-cdn.com/logo.png"
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Favicon <span style={{ color: '#94a3b8', fontWeight: 400 }}>(browser tab icon — square PNG/ICO, 32×32px)</span></label>
                <ImageUpload
                  label="Upload Favicon"
                  currentUrl={form.site_favicon || ''}
                  onUpload={url => set('site_favicon', url)}
                  size="sm"
                />
                <input
                  value={form.site_favicon || ''}
                  onChange={e => set('site_favicon', e.target.value)}
                  style={{ ...s.input, marginTop: 6 }}
                  placeholder="Or paste favicon URL directly"
                />
                {form.site_favicon && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <img src={form.site_favicon} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #e5e7eb' }} alt="favicon preview"
                      onError={e => { e.target.style.display = 'none'; }} />
                    <span style={{ fontSize: '0.78rem', color: '#10b981' }}>✅ Favicon set</span>
                  </div>
                )}
              </div>
              {!form.site_logo && (
                <div style={s.logoFallback}>
                  <div style={{ ...s.avatarBox, background: form.accent_color || '#e94560' }}>
                    {(form.site_name || 'S')[0]}
                  </div>
                  <span style={s.logoHint}>No logo set — Navbar will show this initial letter box</span>
                </div>
              )}

              <div style={s.field}>
                <label style={s.label}>Accent Color</label>
                <div style={s.colorRow}>
                  <input
                    type="color"
                    value={form.accent_color || '#e94560'}
                    onChange={e => set('accent_color', e.target.value)}
                    style={s.colorPicker}
                  />
                  <input
                    value={form.accent_color || '#e94560'}
                    onChange={e => set('accent_color', e.target.value)}
                    style={{ ...s.input, width: '130px' }}
                    placeholder="#e94560"
                  />
                  <div style={{ ...s.colorSwatch, background: form.accent_color || '#e94560' }} />
                  <span style={s.colorHint}>Used for buttons, badges, prices, and highlights site-wide</span>
                </div>
              </div>

              <div style={s.previewBox}>
                <div style={s.previewTitle}>Live Navbar Preview</div>
                <div style={{ ...s.navPreview, background: '#1a1a2e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {form.site_logo
                      ? <img src={form.site_logo} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} alt="logo" onError={e => { e.target.style.display='none'; }} />
                      : <div style={{ ...s.avatarBox, background: form.accent_color || '#e94560', width: 32, height: 32, fontSize: '0.95rem' }}>{(form.site_name || 'S')[0]}</div>
                    }
                    <span style={{ color: form.accent_color || '#e94560', fontWeight: 800, fontSize: '1.1rem' }}>
                      {form.site_name || 'Samuel Store'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    {['Home','Products','Cart'].map(l => (
                      <span key={l} style={{ color: '#cbd5e1', fontSize: '0.82rem', padding: '4px 10px', borderRadius: 6 }}>{l}</span>
                    ))}
                    <span style={{ background: form.accent_color || '#e94560', color: '#fff', fontSize: '0.82rem', padding: '4px 12px', borderRadius: 6 }}>Register</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          {tab === 'footer' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>📄 Footer Content</h3>
              <p style={s.hint}>This text appears in the footer across every page.</p>
              <div style={s.field}>
                <label style={s.label}>About / Description</label>
                <textarea value={form.footer_about || ''} onChange={e => set('footer_about', e.target.value)}
                  style={s.textarea} rows={3} placeholder="Short description of your store shown in the footer…" />
              </div>
              <div style={s.grid2}>
                <Field label="Footer Email" k="footer_email" form={form} set={set} type="email" placeholder="info@example.com" />
                <Field label="Footer Phone" k="footer_phone" form={form} set={set} placeholder="+250 7XX XXX XXX" />
              </div>
              <Field label="Footer Address" k="footer_address" form={form} set={set} placeholder="KK 508 ST, Kigali, Rwanda" />
            </div>
          )}

          {/* ── CURRENCY ── */}
          {tab === 'currency' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>💱 Currency & Tax</h3>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Currency</label>
                  <select value={form.currency || 'USD'} onChange={e => set('currency', e.target.value)} style={s.input}>
                    {['RWF','KES','USD','EUR','GBP','TZS','UGX','ETB','ZAR','NGN'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Field label="Tax Rate (%)" k="tax_rate" type="number" form={form} set={set} placeholder="0" />
              </div>
              {!PAYPAL_SUPPORTED.includes(form.currency) && (
                <div style={s.grid2}>
                  <Field label={`PayPal Rate (1 USD = ? ${form.currency})`} k="paypal_rate" type="number" form={form} set={set} placeholder="e.g. 1300" />
                  <div style={s.field}>
                    <label style={s.label}>Conversion example</label>
                    <div style={{ ...s.input, background: '#f9fafb', color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}>
                      {form.currency} 1000 → USD {(1000 / (Number(form.paypal_rate) || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              <div style={s.infoBox}>
                {PAYPAL_SUPPORTED.includes(form.currency)
                  ? <><strong>{form.currency}</strong> is natively supported by PayPal — no conversion rate needed.</>
                  : <><strong>{form.currency}</strong> is not directly supported by PayPal. Set the conversion rate so PayPal charges the correct USD equivalent.</>
                }
              </div>
            </div>
          )}

          {/* ── SHIPPING ── */}
          {tab === 'shipping' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🚚 Shipping</h3>
              <div style={s.grid2}>
                <Field label={`Standard Shipping Fee (${form.currency})`} k="shipping_fee" type="number" form={form} set={set} placeholder="0" />
                <Field label={`Free Shipping Threshold (${form.currency})`} k="free_shipping_threshold" type="number" form={form} set={set} placeholder="0" />
              </div>
              <div style={s.infoBox}>💡 Orders above the threshold automatically qualify for free shipping on the checkout page.</div>
            </div>
          )}

          {/* ── SEO ── */}
          {tab === 'seo' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🔍 SEO & Meta Tags</h3>
              <Field label="Meta Title" k="meta_title" form={form} set={set} placeholder="Samuel Store — Shop Online" />
              <div style={s.field}>
                <label style={s.label}>Meta Description</label>
                <textarea value={form.meta_description || ''} onChange={e => set('meta_description', e.target.value)}
                  style={s.textarea} rows={3} placeholder="Short description shown in Google search results…" />
              </div>
            </div>
          )}

          {/* ── SOCIAL ── */}
          {tab === 'social' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>📱 Social Media Links</h3>
              <p style={s.hint}>These links appear in the footer.</p>
              <div style={s.grid2}>
                <Field label="Facebook URL" k="facebook" form={form} set={set} placeholder="https://facebook.com/yourpage" />
                <Field label="Instagram URL" k="instagram" form={form} set={set} placeholder="https://instagram.com/yourpage" />
                <Field label="Twitter / X URL" k="twitter" form={form} set={set} placeholder="https://twitter.com/yourpage" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Field({ label, k, type = 'text', placeholder = '', form, set }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input value={form[k] || ''} onChange={e => set(k, e.target.value)}
        style={s.input} type={type} placeholder={placeholder} />
    </div>
  );
}

const s = {
  wrap: { padding: '16px' },
  loading: { padding: '48px', textAlign: 'center', color: '#aaa' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.82rem', margin: '4px 0 0' },
  btnSave: { padding: '11px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  layout: { display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' },
  tabSidebar: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px', width: '100%', background: '#fff', borderRadius: '14px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tabItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.84rem', color: '#555', textAlign: 'left', transition: 'all 0.15s' },
  tabActive: { background: '#1a1a2e', color: '#fff' },
  content: { flex: 1, minWidth: 0 },
  section: { background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  hint: { fontSize: '0.82rem', color: '#94a3b8', margin: 0 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', color: '#1a1a2e', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', resize: 'vertical', color: '#1a1a2e' },
  infoBox: { background: '#eff6ff', borderRadius: '8px', padding: '12px 14px', fontSize: '0.82rem', color: '#3b82f6', borderLeft: '3px solid #3b82f6' },
  logoPreview: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 },
  logoImg: { width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' },
  logoOk: { fontSize: '0.8rem', color: '#10b981' },
  logoFallback: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 },
  logoHint: { fontSize: '0.78rem', color: '#94a3b8' },
  avatarBox: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 },
  colorRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  colorPicker: { width: 44, height: 36, padding: 2, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'none' },
  colorSwatch: { width: 36, height: 36, borderRadius: 8, border: '1px solid #e5e7eb', flexShrink: 0 },
  colorHint: { fontSize: '0.78rem', color: '#94a3b8' },
  previewBox: { background: '#f8f9fb', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' },
  previewTitle: { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  navPreview: { borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
};
