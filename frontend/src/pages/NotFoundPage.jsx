import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '100px', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-cream)',
        color: 'var(--color-forest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <UtensilsCrossed size={32} />
      </div>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '1rem', maxWidth: '420px', margin: '0 auto 24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
