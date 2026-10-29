import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChefHat, ShieldCheck, LogIn, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

export default function OwnerLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isOwner, login } = useAuth();

  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isOwner) {
      navigate('/owner/dashboard', { replace: true });
    }
  }, [isAuthenticated, isOwner, navigate]);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.ownerLogin({ 
        email: email.trim(), 
        password 
      });

      if (res.success && res.token) {
        login(res.token, res.user);
        navigate('/owner/dashboard', { replace: true });
      } else {
        setError(res.error || 'Authentication failed. Please check your owner credentials.');
      }
    } catch (err) {
      setError(err.message || 'Owner sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      paddingTop: '60px',
      paddingBottom: '80px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 32px'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-forest)',
            color: 'var(--color-orange)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <ChefHat size={26} />
          </div>
          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', marginBottom: '6px' }}>
            CANTEEN ADMINISTRATION
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '4px' }}>
            Owner Sign In
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Sign into the administrative portal to manage orders and menus
          </p>
        </div>

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '18px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Authorized Owner Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="canteen.owner@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-accent" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Verifying Credentials...' : 'Sign In as Owner'}</span>
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-muted)'
        }}>
          <div>
            Need to register a new Owner account?{' '}
            <Link to="/owner/register" style={{ color: 'var(--color-orange)', fontWeight: '700' }}>
              Create Owner Account
            </Link>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Are you a student?{' '}
            <Link to="/login" style={{ color: 'var(--color-forest)', fontWeight: '700' }}>
              Student Sign In
            </Link>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            <Link to="/auth" style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
              Switch Role / Welcome Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
