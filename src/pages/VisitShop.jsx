import { STORE_CONFIG } from '../../products.js';
import { assetUrl } from '../bootstrap.js';

export default function VisitShop() {
  return <section className="page visit-page shell" id="page-content"><div><span className="eyebrow">Come and see us</span><h1>Visit our shop</h1><p className="lead">We are open every day and happy to help you choose in person.</p><div className="location-box"><strong>Sri Sai Krishna Jewellers</strong><span>{STORE_CONFIG.address}</span><span>{STORE_CONFIG.mapsLabel}</span><span>Open every day, 9:00 AM to 9:00 PM</span><span>{STORE_CONFIG.phoneDisplay}</span></div><div className="visit-actions"><a className="button primary" href={`tel:${STORE_CONFIG.phoneRaw}`}>Call us</a><a className="button secondary" href={STORE_CONFIG.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions</a></div></div><div className="visit-photo"><img src={assetUrl('assets/hero.jpg')} alt="Sri Sai Krishna Jewellers jewellery" /></div></section>;
}
