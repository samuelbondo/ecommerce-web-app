import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api';

const SettingsContext = createContext();

const DEFAULTS = {
  site_name: 'Samuel Store',
  site_tagline: 'Quality products at the best prices',
  site_logo: '',
  currency: 'KES',
  banner_title: 'New Season. New Deals.',
  banner_subtitle: 'Shop the latest products at unbeatable prices.',
  banner_cta: 'Shop Now',
  banner_bg: '#1a1a2e',
  footer_about: 'Your one-stop shop for quality products delivered to your door.',
  footer_email: 'info@samuelstore.com',
  footer_phone: '+250 791 000 000',
  footer_address: 'Kigali, Rwanda',
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
