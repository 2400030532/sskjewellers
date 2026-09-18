import { STORE_CONFIG } from '../../products.js';

const whatsappUrl = message => `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

export default function SiteHeader({ page, onNavigate }) {
  const links = [
    ['home', 'Home'],
    ['catalogue', 'Browse jewellery'],
    ['rates', "Today's prices"],
    ['custom', 'Ask for a design'],
    ['visit', 'Visit our shop']
  ];

  return <>
    <a className="skip-link" href="#page-content">Skip to page content</a>
    <header className="site-header">
      <div className="topline"><span>Open every day, 9:00 AM to 9:00 PM</span><a href={`tel:${STORE_CONFIG.phoneRaw}`}>{STORE_CONFIG.phoneDisplay}</a></div>
      <nav className="nav shell" aria-label="Main navigation">
        <button className="brand" onClick={() => onNavigate('home')} aria-label="Go to home">
          <span>SSK</span><strong>Sri Sai Krishna Jewellers</strong><small>Etikoppaka</small>
        </button>
        <div className="nav-links">{links.map(([value, label]) => <button key={value} className={page === value ? 'active' : ''} onClick={() => onNavigate(value)}>{label}</button>)}</div>
        <a className="whatsapp-button compact" href={whatsappUrl('Namaste Sri Sai Krishna Jewellers, please help me choose a design.')} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
      </nav>
    </header>
  </>;
}
