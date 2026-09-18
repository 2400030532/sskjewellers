import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_RATES, PRODUCTS_DATA, STORE_CONFIG } from '../products.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://ssk-jewellers-api.onrender.com').replace(/\/$/, '');
const assetUrl = path => path.startsWith('http') ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const whatsappUrl = message => `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
const money = value => `₹${Number(value).toLocaleString('en-IN')}`;

function App() {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [rateStatus, setRateStatus] = useState('Using latest available prices');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('ssk_saved_designs') || '[]'));
  const [selected, setSelected] = useState(null);
  const [weight, setWeight] = useState(20);
  const [metal, setMetal] = useState('gold22k');

  const keepBackendAwake = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      await fetch(`${API_BASE_URL}/actuator/health`, { cache: 'no-store', signal: controller.signal });
    } catch {
      // The catalogue remains useful when the API is sleeping or unavailable.
    } finally {
      clearTimeout(timeout);
    }
  };

  const loadRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rates/live`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Live rates unavailable');
      const liveRates = await response.json();
      setRates(liveRates);
      setRateStatus('Updated just now');
    } catch {
      setRateStatus('Showing the latest saved prices');
    }
  };

  useEffect(() => {
    keepBackendAwake();
    loadRates();
    const healthTimer = setInterval(keepBackendAwake, 5 * 60 * 1000);
    const rateTimer = setInterval(loadRates, 5 * 60 * 1000);
    const onVisible = () => document.visibilityState === 'visible' && keepBackendAwake();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(healthTimer);
      clearInterval(rateTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ssk_saved_designs', JSON.stringify(saved));
  }, [saved]);

  const filteredProducts = useMemo(() => PRODUCTS_DATA.filter(product => {
    const matchesCategory = category === 'all' || product.category === category;
    const text = `${product.name} ${product.stoneDetails} ${product.sku}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [category, query]);

  const estimate = Math.round((Number(weight) || 0) * (rates[metal] || 0));
  const toggleSaved = product => setSaved(items => items.some(item => item.id === product.id)
    ? items.filter(item => item.id !== product.id)
    : [...items, product]);

  return (
    <>
      <a className="skip-link" href="#catalog">Skip to jewellery</a>
      <header className="site-header">
        <div className="topline"><span>Open every day, 9:00 AM to 9:00 PM</span><a href={`tel:${STORE_CONFIG.phoneRaw}`}>{STORE_CONFIG.phoneDisplay}</a></div>
        <nav className="nav shell" aria-label="Main navigation">
          <a className="brand" href="#home"><span>SSK</span><strong>Sri Sai Krishna Jewellers</strong><small>Etikoppaka</small></a>
          <div className="nav-links"><a href="#catalog">Browse</a><a href="#rates">Today's prices</a><a href="#custom">Ask for a design</a><a href="#visit">Visit our shop</a></div>
          <a className="whatsapp-button compact" href={whatsappUrl('Namaste Sri Sai Krishna Jewellers, please help me choose a design.')} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
        </nav>
      </header>

      <main>
        <section className="hero shell" id="home">
          <div className="hero-copy"><span className="eyebrow">Welcome to Sri Sai Krishna Jewellers</span><h1>Find jewellery<br /><em>you will love.</em></h1><p>Browse our designs, check today's price, or message us for help. We will make it easy to choose.</p><div className="hero-actions"><a className="button primary" href="#catalog">See jewellery</a><a className="button secondary" href="#rates">Check today's price</a></div><div className="quick-start"><span>Not sure where to begin?</span><a href="#catalog">Browse designs</a><a href="#custom">Tell us what you want</a></div></div>
          <div className="hero-photo"><img src={assetUrl('assets/hero.jpg')} alt="Gold jewellery from Sri Sai Krishna Jewellers" /><div><strong>Made with care in Etikoppaka</strong><span>916 gold and 925 silver</span></div></div>
        </section>

        <section className="rates-section" id="rates"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Today's prices</span><h2>Gold and silver prices</h2><p>{rateStatus}. Final jewellery prices may include making charges and GST.</p></div><button className="text-button" onClick={loadRates}>Refresh prices</button></div><div className="rate-grid"><RateCard label="22K Gold (916)" value={rates.gold22k} /><RateCard label="24K Gold" value={rates.gold24k} /><RateCard label="18K Gold" value={rates.gold18k} /><RateCard label="925 Silver" value={rates.silver} /></div></div></section>

        <section className="catalog shell" id="catalog"><div className="section-heading centered"><span className="eyebrow">Our collection</span><h2>Browse our jewellery</h2><p>Tap a design to see details. Save the ones you like and ask us about them on WhatsApp.</p></div><div className="catalog-tools"><div className="filters">{[['all', 'Everything'], ['gold-bridal', 'Bridal and temple'], ['gold-daily', 'Daily wear'], ['silver-pooja', 'Pooja items'], ['silver-jewellery', 'Silver jewellery'], ['gold-coins', 'Gold coins']].map(([value, label]) => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{label}</button>)}</div><label className="search"><span>Search</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or design code" /></label></div><div className="product-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} saved={saved.some(item => item.id === product.id)} onSave={() => toggleSaved(product)} onOpen={() => setSelected(product)} />)}</div></section>

        <section className="calculator-band"><div className="shell calculator"><div><span className="eyebrow">Plan your budget</span><h2>Get a quick price estimate</h2><p>This is an estimate for the metal only. We will confirm the final price with you.</p></div><div className="calculator-fields"><label>How many grams?<input type="number" min="0.5" step="0.5" value={weight} onChange={event => setWeight(event.target.value)} /></label><label>Choose gold or silver<select value={metal} onChange={event => setMetal(event.target.value)}><option value="gold22k">22K Gold</option><option value="gold24k">24K Gold</option><option value="gold18k">18K Gold</option><option value="silver">925 Silver</option></select></label><div className="estimate"><span>Estimated metal cost</span><strong>{money(estimate)}</strong></div></div></div></section>

        <section className="custom shell" id="custom"><div><span className="eyebrow">Want something made?</span><h2>Tell us what you want</h2><p>Send us a photo or describe your idea. We can make jewellery to suit your style, weight, and budget.</p></div><a className="whatsapp-button" href={whatsappUrl('Namaste Sri Sai Krishna Jewellers, I would like help with a custom jewellery design.')} target="_blank" rel="noopener noreferrer">Ask for a design on WhatsApp</a></section>

        <section className="visit shell" id="visit"><div><span className="eyebrow">Come and see us</span><h2>Visit our shop</h2><p>{STORE_CONFIG.address}</p><p>Open every day, 9:00 AM to 9:00 PM</p></div><div className="visit-actions"><a className="button primary" href={`tel:${STORE_CONFIG.phoneRaw}`}>Call us</a><a className="button secondary" href="https://maps.google.com/?q=Etikoppaka+Andhra+Pradesh" target="_blank" rel="noopener noreferrer">Get directions</a></div></section>
      </main>
      <footer><div className="shell"><strong>Sri Sai Krishna Jewellers</strong><span>Gold and silver jewellery from Etikoppaka</span><a href={`tel:${STORE_CONFIG.phoneRaw}`}>{STORE_CONFIG.phoneDisplay}</a></div></footer>
      {selected && <ProductModal product={selected} saved={saved.some(item => item.id === selected.id)} onSave={() => toggleSaved(selected)} onClose={() => setSelected(null)} />}
    </>
  );
}

function RateCard({ label, value }) { return <div className="rate-card"><span>{label}</span><strong>{money(value)}<small>/g</small></strong></div>; }

function ProductCard({ product, saved, onSave, onOpen }) {
  return <article className="product-card"><button className="save-button" aria-label={saved ? 'Remove saved design' : 'Save this design'} onClick={onSave}>{saved ? '♥' : '♡'}</button><button className="product-image" onClick={onOpen}><img src={assetUrl(product.image)} alt={product.name} /><span>{product.availability === 'ready' ? 'Available now' : 'Made to order'}</span></button><div className="product-copy"><span className="product-meta">{product.purity} · About {product.approxGrossWeight}g</span><h3>{product.name}</h3><p>{product.description}</p><button className="ask-link" onClick={onOpen}>See details <span>→</span></button></div></article>;
}

function ProductModal({ product, saved, onSave, onClose }) {
  const message = `Namaste Sri Sai Krishna Jewellers, I would like to ask about ${product.name} (${product.sku}). Please share today's price and availability.`;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Design details" onClick={event => event.target === event.currentTarget && onClose()}><div className="modal"><button className="close-button" onClick={onClose} aria-label="Close design details">×</button><img src={assetUrl(product.image)} alt={product.name} /><div><span className="eyebrow">{product.purity}</span><h2>{product.name}</h2><p>{product.description}</p><dl><div><dt>About this piece</dt><dd>{product.approxGrossWeight}g total, {product.approxNetWeight}g gold or silver</dd></div><div><dt>Availability</dt><dd>{product.availabilityText}</dd></div><div><dt>Details</dt><dd>{product.stoneDetails}</dd></div></dl><div className="modal-actions"><a className="whatsapp-button" href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer">Ask about this design</a><button className="button secondary" onClick={onSave}>{saved ? 'Saved' : 'Save this design'}</button></div></div></div></div>;
}

export default App;
