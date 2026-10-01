import { STORE_CONFIG } from '../../products.js';
import { assetUrl, whatsappUrl } from '../bootstrap.js';

export default function Home({ onNavigate }) {
  return <section className="page home-page" id="page-content">
    <div className="hero shell">
      <div className="hero-copy"><span className="eyebrow">Welcome to Sri Sai Krishna Jewellers</span><h1>Find jewellery<br /><em>you will love.</em></h1><p>Browse our designs, check today's price, or message us for help. We will make it easy to choose.</p><div className="hero-actions"><button className="button primary" onClick={() => onNavigate('catalogue')}>See jewellery</button><button className="button secondary" onClick={() => onNavigate('rates')}>Check today's price</button></div><div className="quick-start"><span>Not sure where to begin?</span><button onClick={() => onNavigate('catalogue')}>Browse designs</button><button onClick={() => onNavigate('custom')}>Tell us what you want</button></div></div>
      <div className="hero-photo"><img src={assetUrl('assets/hero.jpg')} alt="Gold jewellery from Sri Sai Krishna Jewellers" /><div><strong>Made with care in Etikoppaka</strong><span>916 gold and 925 silver</span></div></div>
    </div>
    <section className="home-help shell"><div><span className="eyebrow">Start here</span><h2>Choose what you need today</h2></div><div className="help-grid"><button onClick={() => onNavigate('catalogue')}><strong>Browse jewellery</strong><span>See designs and save your favourites</span></button><button onClick={() => onNavigate('rates')}><strong>Check today's price</strong><span>Plan your budget before you visit</span></button><button onClick={() => onNavigate('custom')}><strong>Ask for a design</strong><span>Send a photo or tell us your idea</span></button><button onClick={() => onNavigate('visit')}><strong>Visit our shop</strong><span>Get the address, hours, and directions</span></button></div></section>
    <section className="custom shell"><div><span className="eyebrow">Need help choosing?</span><h2>We are happy to help.</h2><p>Message us on WhatsApp and we will guide you to the right design.</p></div><a className="whatsapp-button" href={whatsappUrl('Namaste Sri Sai Krishna Jewellers, please help me choose a design.')} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp</a></section>
  </section>;
}
