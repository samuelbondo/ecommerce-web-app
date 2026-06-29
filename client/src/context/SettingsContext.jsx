import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api';

const SettingsContext = createContext();

const DEFAULTS = {
  site_name: '',
  site_tagline: '',
  site_logo: '',
  currency: '',
  banner_title: '',
  banner_subtitle: '',
  banner_cta: '',
  banner_bg: '#1a1a2e',
  footer_about: '',
  footer_email: '',
  footer_phone: '',
  footer_address: '',
  accent_color: '#e94560',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    API.get('/settings').then((res) => {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const formatPrice = (amount) =>
    `${settings.currency} ${Number(amount).toLocaleString()}`;

  return (
    <SettingsContext.Provider value={{ settings, formatPrice, loaded, paypalRate: Number(settings.paypal_rate) || 1 }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
