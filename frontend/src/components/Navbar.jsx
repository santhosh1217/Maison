import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">Maison<span>.</span></Link>

        <ul className="nav-links">
          <li><Link to="/">Browse</Link></li>
          {!user && (
            <li><Link to="/login?tab=register&role=landlord">List Property</Link></li>
          )}
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user-name">Hi, {user.name.split(' ')[0]}</span>
              {user.role === 'landlord' && (
                <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              )}
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/login?tab=register" className="btn btn-primary btn-sm">List Property</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
