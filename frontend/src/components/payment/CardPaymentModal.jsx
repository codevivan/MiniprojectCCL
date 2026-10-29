import React, { useState } from 'react';
import { CreditCard, ShieldCheck, X } from 'lucide-react';

export default function CardPaymentModal({ type = 'CREDIT_CARD', amount, onConfirm, onCancel, isProcessing }) {
  const [cardholderName, setCardholderName] = useState('Rahul Sharma');
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('789');
  const [error, setError] = useState('');

  const handleCardNumberChange = (e) => {
    // Format with spaces
    const clean = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = clean.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : clean);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawNumber = cardNumber.replace(/\s+/g, '');
    if (rawNumber.length < 16) {
      setError('Please enter a valid 16-digit simulated card number.');
      return;
    }
    if (!expiry || !expiry.includes('/')) {
      setError('Please enter an expiry in MM/YY format.');
      return;
    }
    if (cvv.length < 3) {
      setError('Please enter a 3-digit demo CVV.');
      return;
    }

    setError('');
    // Pass only demo verification confirmation without persisting raw credentials
    onConfirm({
      cardholderName,
      cardNumber: `**** **** **** ${rawNumber.slice(-4)}`
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)' }}>
                Demo {type === 'CREDIT_CARD' ? 'Credit Card' : 'Debit Card'}
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SIMULATED LAB PAYMENT
              </span>
            </div>
          </div>
          <button onClick={onCancel} style={{ color: 'var(--color-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Demo Warning */}
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px'
        }}>
          <ShieldCheck size={20} color="#D97706" />
          <p style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.4 }}>
            For College Mini-Project Demonstration only. Card numbers are validated locally and NEVER sent to any payment gateway.
          </p>
        </div>

        {/* Amount Due Box */}
        <div style={{
          backgroundColor: 'var(--color-cream)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontWeight: '600' }}>
            Payable Amount:
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
            ₹{amount}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cardholder Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Demo Card Number (16 Digits)</label>
            <input 
              type="text" 
              className="form-input" 
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4532 8912 3456 7890"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input 
                type="text" 
                className="form-input" 
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Demo CVV</label>
              <input 
                type="password" 
                className="form-input" 
                value={cvv}
                onChange={(e) => setCvv(e.target.value.slice(0, 3))}
                placeholder="•••"
                maxLength={3}
                required
              />
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
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
              style={{ flex: 2 }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Simulating Authorization...' : `Pay ₹${amount} (Demo)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
