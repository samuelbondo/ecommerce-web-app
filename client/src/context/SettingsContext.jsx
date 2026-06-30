import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API from '../api';

const SettingsContext = createContext();

const DEFAULTS = {
  site_name: 'Samuel Store',
  site_tagline: '',
  site_logo: '',
  currency: 'USD',
  accent_color: '#e94560',
  banner_title: '',
  banner_subtitle: '',
  banner_cta: '',
  banner_bg: '#1a1a2e',
  footer_about: '',
  footer_email: '',
  footer_phone: '',
  footer_address: '',
  paypal_rate: '1',
  tax_rate: '0',
  shipping_fee: '0',
  free_shipping_threshold: '0',
  meta_title: '',
  meta_description: '',
  facebook: '',
  instagram: '',
  twitter: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    API.get('/settings').then((res) => {
      setSettings({ ...DEFAULTS, ...res.data });
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const formatPrice = (amount) => {
    const sym = settings.currency || 'USD';
    return `${sym} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, formatPrice, loaded, reload, paypalRate: Number(settings.paypal_rate) || 1 }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
