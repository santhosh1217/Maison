import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { showToast } from '../components/Toast';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('tenant');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) navigate(user.role === 'landlord' ? '/dashboard' : '/');
    if (searchParams.get('tab') === 'register') setTab('register');
    if (searchParams.get('role') === 'landlord') setRole('landlord');
  }, [user, searchParams, navigate]);

  const doLogin = async () => {
    if (!loginForm.email || !loginForm.password)
      return showToast('Please fill all fields', 'error');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', loginForm);
      login(data);
      showToast(`Welcome back, ${data.name}! 👋`, 'success');
      setTimeout(() => navigate(data.role === 'landlord' ? '/dashboard' : '/'), 600);
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  const doRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.password)
      return showToast('Please fill required fields', 'error');
    if (regForm.password.length < 6)
      return showToast('Password must be at least 6 characters', 'error');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { ...regForm, role });
      login(data);
      showToast(`Account created! Welcome, ${data.name} 🎉`, 'success');
      setTimeout(() => navigate(data.role === 'landlord' ? '/dashboard' : '/'), 600);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/" className="logo">Maison<span>.</span></Link>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
        </div>

        {tab === 'login' ? (
          <>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-sub">Sign in to your account to continue</p>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="you@example.com"
                value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Enter password"
                value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={doLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="auth-switch">Don't have an account? <a onClick={() => setTab('register')}>Create one</a></p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">Join Maison as a landlord or tenant</p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">I am a...</label>
              <div className="role-selector">
                <button className={`role-btn${role === 'tenant' ? ' active' : ''}`} onClick={() => setRole('tenant')}>
                  <span className="role-icon">🏡</span> Tenant
                </button>
                <button className={`role-btn${role === 'landlord' ? ' active' : ''}`} onClick={() => setRole('landlord')}>
                  <span className="role-icon">🔑</span> Landlord
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="Your full name"
                value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="you@example.com"
                value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-control" placeholder="+91 9876543210"
                value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Min. 6 characters"
                value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && doRegister()} />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={doRegister} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <p className="auth-switch">Already have an account? <a onClick={() => setTab('login')}>Sign in</a></p>
          </>
        )}
      </div>
    </div>
  );
}
