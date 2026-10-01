import { useState } from 'react';
import { DEFAULT_RATES } from '../../products.js';
import { money } from '../bootstrap.js';
import RateCard from '../components/RateCard.jsx';

export default function Rates({ rates, status, onRefresh }) {
  const [weight, setWeight] = useState(20);
  const [metal, setMetal] = useState('gold22k');
  const estimate = Math.round((Number(weight) || 0) * (rates[metal] || DEFAULT_RATES[metal] || 0));
  return <section className="page" id="page-content"><section className="rates-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Today's prices</span><h2>Gold and silver prices</h2><p>{status}. Final jewellery prices may include making charges and GST.</p></div><button className="text-button" onClick={onRefresh}>Refresh prices</button></div><div className="rate-grid"><RateCard label="22K Gold (916)" value={rates.gold22k} /><RateCard label="24K Gold" value={rates.gold24k} /><RateCard label="18K Gold" value={rates.gold18k} /><RateCard label="925 Silver" value={rates.silver} /></div></div></section><section className="calculator-band"><div className="shell calculator"><div><span className="eyebrow">Plan your budget</span><h2>Get a quick price estimate</h2><p>This is an estimate for the metal only. We will confirm the final price with you.</p></div><div className="calculator-fields"><label>How many grams?<input type="number" min="0.5" step="0.5" value={weight} onChange={event => setWeight(event.target.value)} /></label><label>Choose gold or silver<select value={metal} onChange={event => setMetal(event.target.value)}><option value="gold22k">22K Gold</option><option value="gold24k">24K Gold</option><option value="gold18k">18K Gold</option><option value="silver">925 Silver</option></select></label><div className="estimate"><span>Estimated metal cost</span><strong>{money(estimate)}</strong></div></div></div></section></section>;
}
