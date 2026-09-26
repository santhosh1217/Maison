import { Link } from 'react-router-dom';
import { formatPrice } from '../api/api';

export default function PropertyCard({ property: p }) {
  const imgSrc = p.images?.length > 0 ? `/uploads/${p.images[0].split('/uploads/')[1]}` : null;

  return (
    <Link to={`/property/${p._id}`} className="property-card">
      {imgSrc ? (
        <img className="property-card-img" src={imgSrc} alt={p.title} loading="lazy" />
      ) : (
        <div className="property-card-img-placeholder">🏠</div>
      )}
      <div className="property-card-body">
        <span className="property-type-badge">{p.propertyType}</span>
        <div className="property-card-title">{p.title}</div>
        <div className="property-card-city">📍 {p.city}{p.state ? `, ${p.state}` : ''}</div>
        <div className="property-card-price">
          {formatPrice(p.price)}<span>/month</span>
        </div>
        <div className="property-meta">
          <span>🛏️ {p.bedrooms} bed</span>
          <span>🚿 {p.bathrooms} bath</span>
          {p.area > 0 && <span>📐 {p.area} sqft</span>}
        </div>
      </div>
    </Link>
  );
}
