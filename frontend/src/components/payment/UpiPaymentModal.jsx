import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  Clock, 
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react';

export default function UpiPaymentModal({ amount, onConfirm, onCancel, isProcessing }) {
  const [activeTab, setActiveTab] = useState('QR'); // 'QR' or 'VPA'
  const [upiId, setUpiId] = useState('student@okaxis');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [error, setError] = useState('');

  const merchantVpa = 'campusbite@okaxis';
  const merchantName = 'CampusBite College Canteen';

  // Standard UPI deep link payload
  const upiPayload = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Canteen%20Order%20Token`;

  // Generate authentic QR code on mount or amount change
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiPayload, {
      width: 240,
      margin: 2,
      color: {
        dark: '#174C3C', // CampusBite Forest Green
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiPayload]);

  // 5-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQrPaymentConfirm = () => {
    onConfirm({
      upiId: 'scanner@upi',
      merchantVpa,
      qrScanned: true,
      amount
    });
  };

  const handleVpaSubmit = (e) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid demo UPI ID (e.g. name@okaxis)');
      return;
    }
    setError('');
    onConfirm({
      upiId,
      merchantVpa,
      qrScanned: false,
      amount
    });
  };

  const quickUpiOptions = [
    'student@okaxis',
    'campus@okhdfcbank',
    'canteen@oksbi',
    'fastpay@paytm'
  ];

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 150ms ease' }}>
      <div className="modal-content" style={{ maxWidth: '480px', padding: '24px 26px', borderRadius: 'var(--radius-xl)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-dark)', lineHeight: 1.2 }}>
                UPI Instant Payment
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DEMO GATEWAY • BHIM UPI • ZERO FEES
              </span>
            </div>
          </div>

          <button 
            onClick={onCancel} 
            disabled={isProcessing}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-muted)', 
              cursor: 'pointer',
              padding: '4px' 
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher: Scan QR Code vs Enter UPI ID */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F3F4F6',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'QR' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'QR' ? 'var(--color-forest)' : 'var(--color-muted)',
              boxShadow: activeTab === 'QR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 150ms ease'
            }}
          >
            <QrCode size={16} />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VPA')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'VPA' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'VPA' ? 'var(--color-forest)' : 'var(--color-muted)',
              boxShadow: activeTab === 'VPA' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 150ms ease'
            }}
          >
            <Smartphone size={16} />
            <span>Enter UPI ID</span>
          </button>
        </div>

        {/* Amount Due Box */}
        <div style={{
          backgroundColor: 'var(--color-cream)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: '600', display: 'block' }}>
              Amount Payable:
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
              ₹{amount}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', display: 'block' }}>
              Merchant VPA:
            </span>
            <button
              onClick={handleCopyVpa}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--color-forest)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Click to copy UPI ID"
            >
              <span>{merchantVpa}</span>
              {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
            </button>
            {copied && <span style={{ fontSize: '0.68rem', color: '#16A34A', display: 'block' }}>Copied to clipboard!</span>}
          </div>
        </div>

        {/* ======================================= */}
        {/* TAB 1: SCAN QR CODE VIEW */}
        {/* ======================================= */}
        {activeTab === 'QR' && (
          <div>
            {/* QR Code Container */}
            <div style={{
              backgroundColor: 'var(--color-white)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                color: 'var(--color-forest)',
                marginBottom: '10px'
              }}>
                Scan with Google Pay, PhonePe, Paytm, or BHIM
              </div>

              {/* QR Image Canvas */}
              <div style={{
                position: 'relative',
                display: 'inline-block',
                padding: '8px',
                backgroundColor: 'var(--color-white)',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="UPI QR Code" 
                    style={{ 
                      width: '210px', 
                      height: '210px', 
                      display: 'block', 
                      margin: '0 auto',
                      borderRadius: '8px'
                    }} 
                  />
                ) : (
                  <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={28} className="spin" color="var(--color-forest)" />
                  </div>
                )}
              </div>

              {/* Supported UPI Apps Pills */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                marginTop: '12px',
                fontSize: '0.72rem',
                color: 'var(--color-muted)'
              }}>
                <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px' }}>Google Pay</span>
                <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#581C87', padding: '3px 8px' }}>PhonePe</span>
                <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#0369A1', padding: '3px 8px' }}>Paytm</span>
                <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#15803D', padding: '3px 8px' }}>BHIM UPI</span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: timeLeft < 60 ? '#DC2626' : 'var(--color-muted)',
              marginBottom: '18px'
            }}>
              <Clock size={14} />
              <span>QR code expires in <strong>{formatTimer(timeLeft)}</strong></span>
              {timeLeft <= 0 && (
                <button 
                  onClick={() => setTimeLeft(300)} 
                  style={{ border: 'none', background: 'none', color: 'var(--color-forest)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                >
                  Refresh QR
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isProcessing}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleQrPaymentConfirm}
                className="btn btn-accent"
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: '700'
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Verifying Scan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Confirm Paid ₹{amount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: ENTER VPA / UPI ID VIEW */}
        {/* ======================================= */}
        {activeTab === 'VPA' && (
          <form onSubmit={handleVpaSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                Enter Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                className="form-input"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. student@okaxis"
                required
                style={{ fontSize: '0.9rem' }}
              />
              {error && <span className="form-error">{error}</span>}
            </div>

            {/* Quick Demo Selectors */}
            <div style={{ marginBottom: '22px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Quick Demo Handles:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quickUpiOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setUpiId(opt)}
                    style={{
                      backgroundColor: upiId === opt ? 'var(--color-forest)' : 'var(--color-cream)',
                      color: upiId === opt ? 'var(--color-white)' : 'var(--color-dark)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: '4px 9px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Processing Demo...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Verify & Pay ₹{amount}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Demo Disclaimer */}
        <div style={{
          marginTop: '18px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.74rem',
          color: '#92400E'
        }}>
          <ShieldCheck size={16} color="#D97706" style={{ flexShrink: 0 }} />
          <span>Simulated CCL laboratory checkout. Real banking credentials and actual funds are never debited.</span>
        </div>
      </div>
    </div>
  );
}
