import { money } from '../bootstrap.js';

export default function RateCard({ label, value }) {
  return <div className="rate-card"><span>{label}</span><strong>{money(value)}<small>/g</small></strong></div>;
}
