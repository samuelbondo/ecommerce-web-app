import { useEffect, useState } from 'react';
import Toast from '../../components/Toast';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api';

const DEFAULTS = { store_name: 'Samuel Store', store_email: 'admin@samuelstore.com', store_phone: '+254 700 000 000', store_address: 'Nairobi, Kenya', currency: 'KES', paypal_rate: '130', tax_rate: '16', shipping_fee: '200', free_shipping_threshold: '5000', meta_title: 'Samuel Store', meta_description: 'Quality products at the best prices', facebook: '', instagram: '', twitter: '' };

const PAYPAL_SUPPORTED = ['AUD','BRL','CAD','CNY','CZK','DKK','EUR','HKD','HUF','ILS','JPY','MYR','MXN','TWD','NZD','NOK','PHP','PLN','GBP','SGD','SEK','CHF','THB','USD'];

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('store');
  const { currency } = useSettings();
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    API.get('/admin/settings').then(r => setSettings(prev => ({ ...prev, ...r.data }))).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post('/admin/settings', { settings });
      notify('Settings saved successfully!');
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const TABS = [
    { id: 'store', icon: '🏪', label: 'Store' },
    { id: 'currency', icon: '💱', label: 'Currency & Tax' },
    { id: 'shipping', icon: '🚚', label: 'Shipping' },
    { id: 'seo', icon: '🔍', label: 'SEO' },
    { id: 'social', icon: '📱', label: 'Social Media' },
  ];

  return (
    <div style={s.wrap}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={s.pageHeader}>
        <div><h2 style={s.pageTitle}>Settings</h2><p style={s.pageSub}>Manage your store configuration</p></div>
        <button onClick={handleSave} disabled={saving || loading} style={s.btnSave}>{saving ? 'Saving...' : '💾 Save All'}</button>
      </div>

      <div style={s.layout}>
        {/* Sidebar Tabs */}
        <div style={s.tabSidebar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tabItem, ...(tab === t.id ? s.tabItemActive : {}) }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={s.content}>
          {tab === 'store' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🏪 Store Information</h3>
              <div style={s.grid2}>
                <Field label="Store Name" k="store_name" settings={settings} onChange={set} />
                <Field label="Store Email" k="store_email" type="email" settings={settings} onChange={set} />
                <Field label="Phone Number" k="store_phone" settings={settings} onChange={set} />
                <Field label="Store Address" k="store_address" settings={settings} onChange={set} />
              </div>
            </div>
          )}

          {tab === 'currency' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>💱 Currency & Tax</h3>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Currency Symbol</label>
                  <select value={settings.currency} onChange={e => set('currency', e.target.value)} style={s.input}>
                    {['KES','USD','EUR','GBP','TZS','UGX','ETB','ZAR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Tax Rate (%)" k="tax_rate" type="number" settings={settings} onChange={set} />
              </div>
              {!PAYPAL_SUPPORTED.includes(settings.currency) && (
                <div style={s.grid2}>
                  <Field label={`PayPal Rate (1 USD = ? ${settings.currency})`} k="paypal_rate" type="number" placeholder="e.g. 130" settings={settings} onChange={set} />
                  <div style={s.field}>
                    <label style={s.label}>Example</label>
                    <div style={{ ...s.input, background: '#f9fafb', color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}>
                      {settings.currency} 1000 → USD {(1000 / (Number(settings.paypal_rate) || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              <div style={s.infoBox}>
                💡 Currency changes apply across the entire storefront immediately after saving.
                {!PAYPAL_SUPPORTED.includes(settings.currency) && <> Since <strong>{settings.currency}</strong> is not directly supported by PayPal, set the conversion rate above so PayPal charges the correct USD equivalent.</>}
                {PAYPAL_SUPPORTED.includes(settings.currency) && <> <strong>{settings.currency}</strong> is supported by PayPal — no conversion rate needed.</>}
              </div>
            </div>
          )}

          {tab === 'shipping' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🚚 Shipping</h3>
              <div style={s.grid2}>
                <Field label={`Standard Shipping Fee (${currency})`} k="shipping_fee" type="number" settings={settings} onChange={set} />
                <Field label={`Free Shipping Threshold (${currency})`} k="free_shipping_threshold" type="number" settings={settings} onChange={set} />
              </div>
              <div style={s.infoBox}>💡 Orders above the threshold qualify for free shipping automatically.</div>
            </div>
          )}

          {tab === 'seo' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>🔍 SEO Settings</h3>
              <Field label="Meta Title" k="meta_title" settings={settings} onChange={set} />
              <div style={s.field}>
                <label style={s.label}>Meta Description</label>
                <textarea value={settings.meta_description || ''} onChange={e => set('meta_description', e.target.value)} style={s.textarea} rows={3} placeholder="Short description for search engines..." />
              </div>
            </div>
          )}

          {tab === 'social' && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>📱 Social Media Links</h3>
              <div style={s.grid2}>
                <Field label="Facebook URL" k="facebook" placeholder="https://facebook.com/..." settings={settings} onChange={set} />
                <Field label="Instagram URL" k="instagram" placeholder="https://instagram.com/..." settings={settings} onChange={set} />
                <Field label="Twitter / X URL" k="twitter" placeholder="https://twitter.com/..." settings={settings} onChange={set} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, k, type = 'text', placeholder = '', settings, onChange }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input value={settings[k] || ''} onChange={e => onChange(k, e.target.value)} style={s.input} type={type} placeholder={placeholder} />
    </div>
  );
}

const s = {
  wrap: { padding: '24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  pageSub: { color: '#888', fontSize: '0.85rem', margin: '4px 0 0' },
  btnSave: { padding: '10px 22px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' },
  layout: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  tabSidebar: { display: 'flex', flexDirection: 'column', gap: '4px', width: '160px', flexShrink: 0, background: '#fff', borderRadius: '14px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tabItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#555', textAlign: 'left' },
  tabItemActive: { background: '#1a1a2e', color: '#fff' },
  content: { flex: 1 },
  section: { background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#555' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  textarea: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', resize: 'vertical' },
  infoBox: { background: '#eff6ff', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: '#3b82f6', borderLeft: '3px solid #3b82f6' },
};
