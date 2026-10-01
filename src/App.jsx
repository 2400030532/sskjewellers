import { useEffect, useState } from 'react';
import { DEFAULT_RATES, STORE_CONFIG } from '../products.js';
import { API_BASE_URL } from './bootstrap.js';
import SiteHeader from './components/SiteHeader.jsx';
import Home from './pages/Home.jsx';
import Catalogue from './pages/Catalogue.jsx';
import Rates from './pages/Rates.jsx';
import CustomDesign from './pages/CustomDesign.jsx';
import VisitShop from './pages/VisitShop.jsx';

function pageFromHash() {
  const value = window.location.hash.replace('#', '');
  return ['home', 'catalogue', 'rates', 'custom', 'visit'].includes(value) ? value : 'home';
}

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [rateStatus, setRateStatus] = useState('Using the latest available prices');
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('ssk_saved_designs') || '[]'));

  const navigate = nextPage => {
    window.location.hash = nextPage;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const keepBackendAwake = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try { await fetch(`${API_BASE_URL}/actuator/health`, { cache: 'no-store', signal: controller.signal }); } catch { /* The browser catalogue works without the API. */ } finally { clearTimeout(timeout); }
  };
  const loadRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rates/live`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Live prices unavailable');
      setRates(await response.json());
      setRateStatus('Updated just now');
    } catch { setRateStatus('Showing the latest saved prices'); }
  };

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    const onVisible = () => document.visibilityState === 'visible' && keepBackendAwake();
    document.addEventListener('visibilitychange', onVisible);
    keepBackendAwake();
    loadRates();
    const healthTimer = setInterval(keepBackendAwake, 5 * 60 * 1000);
    const rateTimer = setInterval(loadRates, 5 * 60 * 1000);
    return () => { window.removeEventListener('hashchange', onHashChange); document.removeEventListener('visibilitychange', onVisible); clearInterval(healthTimer); clearInterval(rateTimer); };
  }, []);

  useEffect(() => localStorage.setItem('ssk_saved_designs', JSON.stringify(saved)), [saved]);
  const onSave = product => setSaved(items => items.some(item => item.id === product.id) ? items.filter(item => item.id !== product.id) : [...items, product]);
  const content = { home: <Home onNavigate={navigate} />, catalogue: <Catalogue saved={saved} onSave={onSave} />, rates: <Rates rates={rates} status={rateStatus} onRefresh={loadRates} />, custom: <CustomDesign />, visit: <VisitShop /> }[page];

  return <><SiteHeader page={page} onNavigate={navigate} /><main>{content}</main><footer><div className="shell"><strong>{STORE_CONFIG.name}</strong><span>Gold and silver jewellery from Etikoppaka</span><a href={`tel:${STORE_CONFIG.phoneRaw}`}>{STORE_CONFIG.phoneDisplay}</a></div></footer></>;
}
