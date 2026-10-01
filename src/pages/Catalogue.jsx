import { useMemo, useState } from 'react';
import { PRODUCTS_DATA } from '../../products.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';

export default function Catalogue({ saved, onSave }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const products = useMemo(() => PRODUCTS_DATA.filter(product => {
    const matchesCategory = category === 'all' || product.category === category;
    const text = `${product.name} ${product.stoneDetails} ${product.sku}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [category, query]);
  return <section className="page catalog shell" id="page-content"><div className="section-heading centered"><span className="eyebrow">Our collection</span><h2>Browse our jewellery</h2><p>Tap a design to see details. Save the ones you like and ask us about them on WhatsApp.</p></div><div className="catalog-tools"><div className="filters">{[['all', 'Everything'], ['gold-bridal', 'Bridal and temple'], ['gold-daily', 'Daily wear'], ['silver-pooja', 'Pooja items'], ['silver-jewellery', 'Silver jewellery'], ['gold-coins', 'Gold coins']].map(([value, label]) => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{label}</button>)}</div><label className="search"><span>Search</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or design code" /></label></div>{products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} saved={saved.some(item => item.id === product.id)} onSave={() => onSave(product)} onOpen={() => setSelected(product)} />)}</div> : <div className="empty-results"><h3>We could not find that design</h3><p>Try a different word or choose Everything.</p></div>}{selected && <ProductModal product={selected} saved={saved.some(item => item.id === selected.id)} onSave={() => onSave(selected)} onClose={() => setSelected(null)} />}</section>;
}
