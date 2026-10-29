import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { UtensilsCrossed, UserPlus, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function StudentRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
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
      const res = await api.auth.studentRegister({
        name,
        email,
        studentId,
        password,
        confirmPassword
      });

      if (res.success) {
        setSuccessMsg('Account created! Auto-subscribed to Amazon SNS order alerts. Redirecting to Login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              registeredEmail: email, 
              message: 'Account registered! Confirm the AWS SNS verification email in your inbox to receive order receipts.' 
            } 
          });
        }, 1500);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      paddingTop: '40px',
      paddingBottom: '60px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div className="card" style={{
        maxWidth: '480px',
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
            Create Student Account
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Sign up to pre-order food, get tokens, and skip canteen lines
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
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || Boolean(successMsg)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">College Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || Boolean(successMsg)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student ID / Roll No</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. CS2026-44"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={loading || Boolean(successMsg)}
              />
            </div>
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
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading || Boolean(successMsg)}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Validating & Saving...' : 'Create Account'}</span>
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
            Already have a student account?{' '}
            <Link to="/login" style={{ color: 'var(--color-forest)', fontWeight: '700' }}>
              Sign In here
            </Link>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Are you a Canteen Owner?{' '}
            <Link to="/owner/register" style={{ color: 'var(--color-orange)', fontWeight: '700' }}>
              Owner Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
