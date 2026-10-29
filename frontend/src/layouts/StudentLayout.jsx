import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { api } from '../services/api';
import { AlertCircle, Megaphone } from 'lucide-react';

export default function StudentLayout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.settings.get()
      .then(res => {
        if (res.success && res.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Canteen Announcement / Closure Notice Banner */}
      {settings?.isTemporarilyClosed && (
        <div style={{
          backgroundColor: '#DC2626',
          color: 'var(--color-white)',
          padding: '10px 20px',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>Notice: The canteen is currently temporarily closed for new orders. Please check opening hours.</span>
        </div>
      )}

      {settings?.announcement && !settings.isTemporarilyClosed && (
        <div style={{
          backgroundColor: 'var(--color-orange)',
          color: '#10382C',
          padding: '8px 20px',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Megaphone size={16} />
          <span>{settings.announcement}</span>
        </div>
      )}

      <Navbar />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
