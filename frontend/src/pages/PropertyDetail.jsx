import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import api, { formatPrice, formatDate } from '../api/api';
import { showToast } from '../components/Toast';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState({ tenantName: '', tenantEmail: '', tenantPhone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => { setProperty(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.message || 'Property not found'); setLoading(false); });
  }, [id]);

  // Pre-fill contact form for logged-in users
  useEffect(() => {
    if (user) setContactForm((f) => ({ ...f, tenantName: user.name, tenantEmail: user.email }));
  }, [user]);

  const sendMessage = async () => {
    if (!contactForm.tenantName || !contactForm.tenantEmail || !contactForm.message)
      return showToast('Please fill name, email and message', 'error');
    setSending(true);
    try {
      await api.post(`/contact/${id}`, contactForm);
      showToast('Message sent to landlord! 🎉', 'success');
      setSent(true);
      setContactForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
    } finally { setSending(false); }
  };

  if (loading) return <><Navbar /><Spinner fullPage /></>;
  if (error) return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">Property not found</div>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Listings</Link>
        </div>
      </div>
    </>
  );

  const p = property;
  const images = p.images || [];
  const initials = p.landlord?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          ← Back to listings
        </Link>

        {/* Gallery */}
        {images.length > 0 ? (
          <div className="property-detail-gallery">
            <div className="gallery-main">
              <img src={`/uploads/${images[0].split('/uploads/')[1]}`} alt={p.title} />
            </div>
            {images.length >= 2 && (
              <div className="gallery-side">
                <img src={`/uploads/${images[1].split('/uploads/')[1]}`} alt={`${p.title} 2`} />
                <img src={`/uploads/${(images[2] || images[1]).split('/uploads/')[1]}`} alt={`${p.title} 3`} />
              </div>
            )}
          </div>
        ) : (
          <div className="gallery-placeholder">🏠</div>
        )}

        <div className="detail-layout">
          {/* LEFT: Info */}
          <div>
            <span className="property-type-badge">{p.propertyType}</span>
            {p.available
              ? <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>✓ Available</span>
              : <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Not Available</span>}

            <h1 className="detail-title">{p.title}</h1>
            <p className="detail-location">📍 {p.address}, {p.city}{p.state ? `, ${p.state}` : ''}</p>
            <div className="detail-price">{formatPrice(p.price)}<span>/month</span></div>

            <div className="detail-specs">
              <div className="spec-item"><div className="spec-value">🛏️ {p.bedrooms}</div><div className="spec-label">Bedrooms</div></div>
              <div className="spec-item"><div className="spec-value">🚿 {p.bathrooms}</div><div className="spec-label">Bathrooms</div></div>
              {p.area > 0 && <div className="spec-item"><div className="spec-value">📐 {p.area}</div><div className="spec-label">Sq. Ft.</div></div>}
              <div className="spec-item"><div className="spec-value">🏗️ {p.propertyType}</div><div className="spec-label">Type</div></div>
            </div>

            <div className="detail-section">
              <h3>About this property</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{p.description}</p>
            </div>

            {p.amenities?.length > 0 && (
              <div className="detail-section">
                <h3>Amenities</h3>
                <div className="amenities-list">
                  {p.amenities.map((a) => <span key={a} className="amenity-tag">✓ {a}</span>)}
                </div>
              </div>
            )}

            {images.length > 3 && (
              <div className="detail-section">
                <h3>More Photos</h3>
                <div className="image-preview-grid">
                  {images.slice(3).map((img, i) => (
                    <img key={i} className="preview-img" src={`/uploads/${img.split('/uploads/')[1]}`} alt="photo" />
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>Listed on</h3>
              <p style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</p>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div>
            <div className="landlord-card">
              <div className="landlord-avatar">{initials}</div>
              <div className="landlord-name">{p.landlord?.name}</div>
              <div className="landlord-contact">📧 {p.landlord?.email}</div>
              {p.landlord?.phone && <div className="landlord-contact" style={{ marginTop: '0.3rem' }}>📞 {p.landlord.phone}</div>}
            </div>

            <div className="contact-form-card">
              <h3>Send Message to Landlord</h3>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input type="text" className="form-control" placeholder="Full name"
                  value={contactForm.tenantName} onChange={(e) => setContactForm({ ...contactForm, tenantName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="your@email.com"
                  value={contactForm.tenantEmail} onChange={(e) => setContactForm({ ...contactForm, tenantEmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input type="tel" className="form-control" placeholder="+91 98765 43210"
                  value={contactForm.tenantPhone} onChange={(e) => setContactForm({ ...contactForm, tenantPhone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-control" placeholder="Hi, I'm interested in this property..."
                  value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={sendMessage} disabled={sending || sent}>
                {sent ? '✓ Message Sent!' : sending ? 'Sending...' : '📨 Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2024 <strong>Maison</strong> — Premium House Rental Platform. All rights reserved.</p>
      </footer>
    </>
  );
}
