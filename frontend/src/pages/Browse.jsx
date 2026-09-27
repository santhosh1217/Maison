import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import Spinner from '../components/Spinner';
import api from '../api/api';

export default function Browse() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBeds, setFilterBeds] = useState('');
  const [resultTitle, setResultTitle] = useState('All Available Listings');

  const fetchProperties = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/properties', { params });
      setProperties(data);
    } catch(e) {
      setProperties([]);
//alert(JSON.stringify(e))
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const doSearch = () => {
    const params = {};
    if (search.trim()) { params.search = search.trim(); setResultTitle(`Results for "${search.trim()}"`); }
    else setResultTitle('All Available Listings');
    if (filterType) params.propertyType = filterType;
    if (filterBeds) params.bedrooms = filterBeds;
    fetchProperties(params);
  };

  const clearFilters = () => {
    setSearch(''); setFilterType(''); setFilterBeds('');
    setResultTitle('All Available Listings');
    fetchProperties();
  };

  const hasFilters = search || filterType || filterBeds;

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🏡 Verified Listings · Zero Brokerage</div>
            <h1>Find Your <span className="gradient-text">Dream Home</span> Without the Hassle</h1>
            <p>Browse verified rental properties directly from landlords. No middlemen, no hidden fees.</p>

            <div className="search-bar">
              <div className="search-input-wrap">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search city, locality or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                />
              </div>
              <div className="search-divider" />
              <div className="search-input-wrap" style={{ flex: 0.5 }}>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); }}>
                  <option value="">Any Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="villa">Villa</option>
                  <option value="room">Room</option>
                </select>
              </div>
              <div className="search-divider" />
              <div className="search-input-wrap" style={{ flex: 0.5 }}>
                <select value={filterBeds} onChange={(e) => { setFilterBeds(e.target.value); }}>
                  <option value="">Any Beds</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={doSearch}>Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section style={{ paddingBottom: '4rem' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{resultTitle}</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {!loading && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} found
                </span>
              )}
              {hasFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
              )}
            </div>
          </div>

          {loading ? (
            <Spinner />
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No properties found</div>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <p>© 2024 <strong>Maison</strong> — Premium House Rental Platform. All rights reserved.</p>
      </footer>
    </>
  );
}
