import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import api, { formatPrice, formatDate } from '../api/api';
import { showToast } from '../components/Toast';

const EMPTY_FORM = {
  title: '', city: '', state: '', address: '', price: '',
  propertyType: 'apartment', bedrooms: '', bathrooms: '',
  area: '', amenities: '', description: '', available: 'true',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'landlord') { navigate('/'); return; }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [propsRes, msgsRes] = await Promise.all([
        api.get('/properties/my'),
        api.get('/contact/inbox'),
      ]);
      setProperties(propsRes.data);
      setMessages(msgsRes.data);
    } catch (err) {
      if (err.response?.status === 401) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'landlord') fetchData(); }, [user]);

  // ---- STATS ----
  const totalListings = properties.length;
  const available = properties.filter((p) => p.available).length;
  const unread = messages.filter((m) => !m.read).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  };

  // ---- MODAL ----
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreviews([]);
    if (fileRef.current) fileRef.current.value = '';
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      title: p.title, city: p.city, state: p.state || '', address: p.address,
      price: p.price, propertyType: p.propertyType, bedrooms: p.bedrooms,
      bathrooms: p.bathrooms, area: p.area || '', amenities: (p.amenities || []).join(', '),
      description: p.description, available: String(p.available),
    });
    setImagePreviews([]);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    const { title, city, address, price, bedrooms, bathrooms, description } = form;
    if (!title || !city || !address || !price || !bedrooms || !bathrooms || !description)
      return showToast('Please fill all required fields', 'error');

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const files = fileRef.current?.files || [];
      Array.from(files).forEach((f) => formData.append('images', f));

      if (editingId) {
        await api.put(`/properties/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Property updated! ✅', 'success');
      } else {
        await api.post('/properties', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Property listed! 🎉', 'success');
      }
      closeModal();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving property', 'error');
    } finally { setSubmitting(false); }
  };

  const deleteProperty = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      showToast('Property deleted', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const markRead = async (id) => {
    const msg = messages.find((m) => m._id === id);
    if (!msg || msg.read) return;
    try {
      await api.patch(`/contact/${id}/read`);
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, read: true } : m));
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return <><Navbar /><Spinner fullPage /></>;

  return (
    <>
      <Navbar />
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <button className={`sidebar-link${section === 'overview' ? ' active' : ''}`} onClick={() => setSection('overview')}>
            📊 Overview
          </button>
          <button className={`sidebar-link${section === 'listings' ? ' active' : ''}`} onClick={() => setSection('listings')}>
            🏠 My Listings
          </button>
          <button className={`sidebar-link${section === 'inbox' ? ' active' : ''}`} onClick={() => setSection('inbox')}>
            📨 Inbox {unread > 0 && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '99px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                {unread}
              </span>
            )}
          </button>
          <div className="sidebar-spacer" />
          <Link to="/" className="sidebar-link">← Browse Listings</Link>
          <button className="sidebar-link danger" onClick={handleLogout}>🚪 Logout</button>
        </aside>

        {/* MAIN */}
        <main className="dashboard-main">

          {/* === OVERVIEW === */}
          {section === 'overview' && (
            <>
              <div className="page-header">
                <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
                <p>Here's your rental portfolio overview</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-card-label">Total Listings</div><div className="stat-card-value">{totalListings}</div></div>
                <div className="stat-card"><div className="stat-card-label">Available</div><div className="stat-card-value" style={{ color: 'var(--success)' }}>{available}</div></div>
                <div className="stat-card"><div className="stat-card-label">Rented Out</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{totalListings - available}</div></div>
                <div className="stat-card"><div className="stat-card-label">Unread Messages</div><div className="stat-card-value" style={{ color: 'var(--primary-light)' }}>{unread}</div></div>
              </div>
              <div className="section-header">
                <h2 className="section-title">Recent Listings</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setSection('listings')}>View All</button>
              </div>
              {properties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏠</div>
                  <div className="empty-title">No listings yet</div>
                  <p>Start by adding your first property</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>+ Add Property</button>
                </div>
              ) : properties.slice(0, 3).map((p) => <ManageCard key={p._id} p={p} onEdit={openEdit} onDelete={deleteProperty} />)}
              {messages.filter((m) => !m.read).length > 0 && (
                <>
                  <div className="section-header" style={{ marginTop: '2rem' }}>
                    <h2 className="section-title">Unread Messages</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSection('inbox')}>View Inbox</button>
                  </div>
                  {messages.filter((m) => !m.read).slice(0, 3).map((m) => (
                    <InboxItem key={m._id} msg={m} onRead={markRead} />
                  ))}
                </>
              )}
            </>
          )}

          {/* === LISTINGS === */}
          {section === 'listings' && (
            <>
              <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div><h1>My Listings</h1><p>Manage your rental properties</p></div>
                  <button className="btn btn-primary" onClick={openAdd}>+ Add Property</button>
                </div>
              </div>
              {properties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏘️</div>
                  <div className="empty-title">No properties listed</div>
                  <p>Click "Add Property" to list your first rental</p>
                </div>
              ) : properties.map((p) => <ManageCard key={p._id} p={p} onEdit={openEdit} onDelete={deleteProperty} />)}
            </>
          )}

          {/* === INBOX === */}
          {section === 'inbox' && (
            <>
              <div className="page-header"><h1>Inbox</h1><p>Messages from interested tenants</p></div>
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📬</div>
                  <div className="empty-title">No messages yet</div>
                  <p>Tenant inquiries will appear here</p>
                </div>
              ) : messages.map((m) => <InboxItem key={m._id} msg={m} onRead={markRead} />)}
            </>
          )}
        </main>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Property' : 'Add New Property'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" className="form-control" placeholder="e.g. Spacious 2BHK near Metro"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input type="text" className="form-control" placeholder="Chennai"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" className="form-control" placeholder="Tamil Nadu"
                  value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Address *</label>
              <input type="text" className="form-control" placeholder="Street, Locality, Pincode"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Rent (₹) *</label>
                <input type="number" className="form-control" placeholder="15000"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select className="form-control" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="villa">Villa</option>
                  <option value="room">Room</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bedrooms *</label>
                <input type="number" className="form-control" placeholder="2"
                  value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bathrooms *</label>
                <input type="number" className="form-control" placeholder="1"
                  value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area (sq ft)</label>
                <input type="number" className="form-control" placeholder="850"
                  value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Available</label>
                <select className="form-control" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })}>
                  <option value="true">Yes — Available</option>
                  <option value="false">No — Not Available</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amenities (comma separated)</label>
              <input type="text" className="form-control" placeholder="WiFi, Parking, Gym, Pool"
                value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" rows={3} placeholder="Describe the property..."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Property Images (up to 6)</label>
              <div className="upload-zone">
                <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleFileChange} />
                <div className="upload-icon">📷</div>
                <div className="upload-text">Click to upload images (JPEG, PNG, WebP — max 5MB)</div>
              </div>
              {imagePreviews.length > 0 && (
                <div className="image-preview-grid">
                  {imagePreviews.map((src, i) => <img key={i} src={src} className="preview-img" alt="preview" />)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Property'}
              </button>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ManageCard({ p, onEdit, onDelete }) {
  const imgSrc = p.images?.length > 0 ? `/uploads/${p.images[0].split('/uploads/')[1]}` : null;
  return (
    <div className="manage-card">
      {imgSrc ? <img className="manage-card-img" src={imgSrc} alt={p.title} /> : <div className="manage-card-img-ph">🏠</div>}
      <div className="manage-card-info">
        <div className="manage-card-title">{p.title}</div>
        <div className="manage-card-sub">
          📍 {p.city} · 🛏️ {p.bedrooms} bed ·{' '}
          {p.available
            ? <span style={{ color: 'var(--success)' }}>Available</span>
            : <span style={{ color: 'var(--accent)' }}>Rented</span>}
        </div>
      </div>
      <div className="manage-card-price">{formatPrice(p.price)}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
      <div className="manage-card-actions">
        <Link to={`/property/${p._id}`} className="btn btn-ghost btn-sm" target="_blank">View</Link>
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(p)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(p._id)}>Delete</button>
      </div>
    </div>
  );
}

function InboxItem({ msg, onRead }) {
  return (
    <div className={`inbox-item${msg.read ? '' : ' unread'}`} onClick={() => onRead(msg._id)}>
      <div className="inbox-meta">
        <span className="inbox-sender">
          {msg.tenantName}
          {!msg.read && <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }}>New</span>}
        </span>
        <span className="inbox-date">{formatDate(msg.createdAt)}</span>
      </div>
      <div className="inbox-property">Re: {msg.property?.title || 'Property'}</div>
      <div className="inbox-preview">{msg.message}</div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        📧 {msg.tenantEmail}{msg.tenantPhone ? ` · 📞 ${msg.tenantPhone}` : ''}
      </div>
    </div>
  );
}
