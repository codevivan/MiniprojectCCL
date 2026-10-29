import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ShieldAlert, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function OwnerSetupPage() {
  const [hasOwner, setHasOwner] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.getOwnerStatus()
      .then(res => {
        if (res.success) {
          setHasOwner(res.hasOwner);
        }
      })
      .catch(() => setHasOwner(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Master Owner password must be at least 8 characters for security.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.ownerSetup({
        name,
        email,
        password,
        confirmPassword
      });

      if (res.success && res.token) {
        login(res.token, res.user);
        navigate('/owner/dashboard');
      } else {
        setError(res.error || 'Setup failed.');
      }
    } catch (err) {
      setError(err.message || 'Owner initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  if (hasOwner === null) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-muted)' }}>Verifying security policy status...</p>
      </div>
    );
  }

  // If Master Owner is already initialized, prevent setup and enforce policy
  if (hasOwner) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '36px 32px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <ShieldAlert size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#991B1B', marginBottom: '8px' }}>
            Owner Setup Locked
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Security Policy Enforced: Exactly <strong>ONE</strong> Master Owner account is permitted for CampusBite. The master account has already been initialized in DynamoDB. Public registration is permanently locked.
          </p>

          <Link to="/owner/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Sign In to Owner Dashboard</span>
            <ArrowRight size={16} />
          </Link>

          <div style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.78rem',
            color: 'var(--color-muted)'
          }}>
            Forgot Master Owner credentials? Use the backend administrative script:
            <code style={{ display: 'block', backgroundColor: 'var(--color-cream)', padding: '6px', borderRadius: '4px', marginTop: '6px', color: 'var(--color-forest)', fontWeight: '700' }}>
              npm run reset-owner -- &lt;newPassword&gt;
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '70px', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-forest)',
            color: 'var(--color-orange)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={28} />
          </div>
          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', marginBottom: '8px' }}>
            FIRST-TIME SYSTEM INITIALIZATION
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)' }}>
            Master Owner Setup
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            Configure the single authorized master canteen administrative account.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Master Owner Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Chief Canteen Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Owner Email</label>
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
            <label className="form-label">Master Password (min 8 chars)</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Create strong admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Master Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-accent" 
            style={{ width: '100%', marginTop: '14px' }}
            disabled={loading}
          >
            <Lock size={18} />
            <span>{loading ? 'Initializing Master Owner...' : 'Complete Master Owner Setup'}</span>
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
          Once this account is created, public Owner registration is permanently disabled. Owner APIs will be strictly protected by JWT and Amazon Cognito claims.
        </p>
      </div>
    </div>
  );
}
