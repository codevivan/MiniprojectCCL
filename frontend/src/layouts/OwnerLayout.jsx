import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { ShieldCheck, Bell } from 'lucide-react';

export default function OwnerLayout() {
  const { user, isAuthenticated, isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-forest)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Verifying Owner credentials...</p>
        </div>
      </div>
    );
  }

  // Enforce Owner Authorization
  if (!isAuthenticated || !isOwner) {
    return <Navigate to="/owner/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAF8' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-completed">
              <ShieldCheck size={14} /> Master Administrator Active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Logged in as: <strong style={{ color: 'var(--color-forest)' }}>{user?.email}</strong>
            </span>
          </div>
        </header>

        {/* Content View */}
        <main style={{ padding: '28px', flex: 1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
