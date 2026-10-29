import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Settings, Save, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react';

export default function OwnerSettings() {
  const [canteenName, setCanteenName] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false);
  const [isOrderingAvailable, setIsOrderingAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.settings.get()
      .then(res => {
        if (res.success && res.settings) {
          setCanteenName(res.settings.canteenName || '');
          setOpeningHours(res.settings.openingHours || '');
          setAnnouncement(res.settings.announcement || '');
          setIsTemporarilyClosed(Boolean(res.settings.isTemporarilyClosed));
          setIsOrderingAvailable(Boolean(res.settings.isOrderingAvailable));
        }
      })
      .catch(err => setErrorMsg('Failed to load canteen settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.settings.update({
        canteenName,
        openingHours,
        announcement,
        isTemporarilyClosed,
        isOrderingAvailable
      });

      if (res.success) {
        setSuccessMsg('Canteen operational settings saved successfully to DynamoDB.');
      } else {
        setErrorMsg(res.error || 'Failed to update settings.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading settings...</p>;
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
          Canteen Operational Settings
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          Manage canteen working hours, live student announcements, and emergency ordering pause.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '18px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '18px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="card" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Canteen Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={canteenName}
              onChange={(e) => setCanteenName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Canteen Operating Hours</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 08:00 AM - 06:00 PM (Mon - Sat)"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Broadcast Announcement Banner</label>
            <textarea 
              className="form-textarea" 
              rows={2}
              placeholder="Notice displayed at the top of the student website..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            />
          </div>

          {/* Operational Switches */}
          <div style={{
            backgroundColor: 'var(--color-cream)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            margin: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-dark)', display: 'block' }}>
                  Enable Student Pre-Ordering
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  When disabled, students can browse the menu but checkout is blocked.
                </span>
              </div>
              <input 
                type="checkbox" 
                checked={isOrderingAvailable}
                onChange={(e) => setIsOrderingAvailable(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-forest)' }}
              />
            </label>

            <div style={{ borderTop: '1px solid var(--color-border)' }} />

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#DC2626', display: 'block' }}>
                  Temporary Emergency Closure
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  Displays an emergency closure banner across all student pages.
                </span>
              </div>
              <input 
                type="checkbox" 
                checked={isTemporarilyClosed}
                onChange={(e) => setIsTemporarilyClosed(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#DC2626' }}
              />
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={saving}
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Canteen Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
