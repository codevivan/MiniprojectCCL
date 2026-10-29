import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  ChefHat, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

export default function OwnerRegisterPage() {
  const [name, setName] = useState('');
  const [canteenName, setCanteenName] = useState('CampusBite College Canteen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.ownerRegister({
        name: name.trim(),
        canteenName: canteenName.trim(),
        email: email.trim(),
        password,
        confirmPassword
      });

      if (res.success) {
        setSuccessMsg('Owner account registered successfully! Redirecting to Owner Sign In...');
        setTimeout(() => {
          navigate('/owner/login', { 
            state: { 
              registeredEmail: email.trim(), 
              message: 'Owner registration successful! Please log in with your credentials.' 
            } 
          });
        }, 1500);
      } else {
        setError(res.error || 'Owner registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Owner registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      paddingTop: '40px',
      paddingBottom: '70px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '36px 32px'
      }}>
        {/* Brand header */}
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
            marginBottom: '10px'
          }}>
            <ChefHat size={28} />
          </div>
          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', marginBottom: '6px' }}>
            CANTEEN ADMINISTRATION
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '4px' }}>
            Create Owner Account
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Register a Canteen Owner account to manage menus and live orders
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
            <label className="form-label">Owner Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Ramesh Hegde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || Boolean(successMsg)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Canteen / Cafeteria Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. CampusBite Central Canteen"
              value={canteenName}
              onChange={(e) => setCanteenName(e.target.value)}
              required
              disabled={loading || Boolean(successMsg)}
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
              disabled={loading || Boolean(successMsg)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="At least 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || Boolean(successMsg)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || Boolean(successMsg)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-accent" 
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading || Boolean(successMsg)}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating Owner Account...' : 'Create Owner Account'}</span>
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-muted)'
        }}>
          <div>
            Already have an Owner account?{' '}
            <Link to="/owner/login" style={{ color: 'var(--color-forest)', fontWeight: '700' }}>
              Owner Sign In
            </Link>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Are you a student?{' '}
            <Link to="/login" style={{ color: 'var(--color-forest)', fontWeight: '700' }}>
              Student Portal
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
