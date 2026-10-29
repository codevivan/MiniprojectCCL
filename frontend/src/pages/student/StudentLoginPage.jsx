import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UtensilsCrossed, LogIn, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, login } = useAuth();

  const [identifier, setIdentifier] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/menu';

  useEffect(() => {
    if (isAuthenticated && isStudent) {
      navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, isStudent, navigate]);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setIdentifier(location.state.registeredEmail);
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
      const res = await api.auth.studentLogin({ 
        email: identifier.trim(), 
        password 
      });

      if (res.success && res.token) {
        login(res.token, res.user);
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
            <UtensilsCrossed size={26} />
          </div>
          <span className="badge badge-completed" style={{ fontSize: '0.72rem', marginBottom: '6px' }}>
            STUDENT PORTAL
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '4px' }}>
            Student Sign In
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Enter your registered credentials to order food and track tokens
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
            <label className="form-label">College Email Address or Student ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. rahul@college.edu or CS2026-44"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Verifying Credentials...' : 'Sign In as Student'}</span>
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
            Don't have a student account?{' '}
            <Link to="/register" style={{ color: 'var(--color-forest)', fontWeight: '700' }}>
              Create Student Account
            </Link>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Are you a Canteen Owner?{' '}
            <Link to="/owner/login" style={{ color: 'var(--color-orange)', fontWeight: '700' }}>
              Owner Sign In
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
