import { assetUrl } from '../bootstrap.js';

export default function ProductCard({ product, saved, onSave, onOpen }) {
  return <article className="product-card"><button className="save-button" aria-label={saved ? 'Remove saved design' : 'Save this design'} onClick={onSave}>{saved ? '♥' : '♡'}</button><button className="product-image" onClick={onOpen}><img src={assetUrl(product.image)} alt={product.name} /><span>{product.availability === 'ready' ? 'Available now' : 'Made to order'}</span></button><div className="product-copy"><span className="product-meta">{product.purity} · About {product.approxGrossWeight}g</span><h3>{product.name}</h3><p>{product.description}</p><button className="ask-link" onClick={onOpen}>See details <span>→</span></button></div></article>;
}
