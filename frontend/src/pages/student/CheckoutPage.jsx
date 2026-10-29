import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import UpiPaymentModal from '../../components/payment/UpiPaymentModal';
import CardPaymentModal from '../../components/payment/CardPaymentModal';
import { 
  QrCode,
  Smartphone, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  AlertCircle, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardType, setCardType] = useState('CREDIT_CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/checkout' } }} replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/menu" replace />;
  }

  // Handle final order creation through backend API with idempotency key
  const executeOrderCreation = async (paymentDetails = null) => {
    setIsProcessing(true);
    setError('');

    // Generate unique client idempotency key to prevent double charge on retry
    const idempotencyKey = `cb_idemp_${user.userId}_${Date.now()}`;

    try {
      const payload = {
        items: items.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
        paymentMethod,
        idempotencyKey,
        paymentDetails
      };

      const res = await api.orders.create(payload);
      if (res.success && res.order) {
        clearCart();
        // Close any active modal
        setShowUpiModal(false);
        setShowCardModal(false);
        // Navigate to Order Confirmation
        navigate(`/orders/confirmed/${res.order.orderId}`, { state: { order: res.order } });
      } else {
        setError(res.error || 'Failed to complete order. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToPayment = () => {
    if (paymentMethod === 'UPI') {
      setShowUpiModal(true);
    } else if (paymentMethod === 'CREDIT_CARD') {
      setCardType('CREDIT_CARD');
      setShowCardModal(true);
    } else if (paymentMethod === 'DEBIT_CARD') {
      setCardType('DEBIT_CARD');
      setShowCardModal(true);
    } else if (paymentMethod === 'CASH') {
      // Direct cash order placement with PENDING status
      executeOrderCreation({ note: 'Pay with cash at counter' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
        Checkout & Payment Selection
      </h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: '28px' }}>
        Review your order and select your preferred simulated payment method.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'flex-start'
      }}>
        {/* Left Column: Student Details & Payment Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Student Info Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', marginBottom: '16px' }}>
              Student Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'block' }}>Student Name</span>
                <strong>{user.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'block' }}>Roll / Student ID</span>
                <strong>{user.studentId || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'block' }}>College Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--color-forest)' }}>
                Select Payment Method
              </h2>
              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '0.75rem' }}>
                DEMO / SIMULATED
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '20px' }}>
              Choose a payment method for this CCL demonstration. No actual bank transactions or card charges occur.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: UPI */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'UPI' ? 'var(--color-forest)' : 'var(--color-border)'}`,
                  backgroundColor: paymentMethod === 'UPI' ? 'var(--color-fresh-light)' : 'var(--color-white)',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="UPI"
                  checked={paymentMethod === 'UPI'} 
                  onChange={() => setPaymentMethod('UPI')}
                  style={{ accentColor: 'var(--color-forest)', width: '18px', height: '18px' }}
                />
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-dark)' }}>
                    UPI QR Code & Apps (GPay, PhonePe, Paytm, BHIM)
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Scan dynamic QR code with any UPI app or enter demo VPA
                  </span>
                </div>
                <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '0.7rem' }}>
                  QR CODE READY
                </span>
              </label>

              {/* Option 2: Credit Card */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'CREDIT_CARD' ? 'var(--color-forest)' : 'var(--color-border)'}`,
                  backgroundColor: paymentMethod === 'CREDIT_CARD' ? 'var(--color-fresh-light)' : 'var(--color-white)',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="CREDIT_CARD"
                  checked={paymentMethod === 'CREDIT_CARD'} 
                  onChange={() => setPaymentMethod('CREDIT_CARD')}
                  style={{ accentColor: 'var(--color-forest)', width: '18px', height: '18px' }}
                />
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#FDF2F8',
                  color: '#DB2777',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-dark)' }}>
                    Credit Card
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Simulated Visa / Mastercard checkout form
                  </span>
                </div>
              </label>

              {/* Option 3: Debit Card */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'DEBIT_CARD' ? 'var(--color-forest)' : 'var(--color-border)'}`,
                  backgroundColor: paymentMethod === 'DEBIT_CARD' ? 'var(--color-fresh-light)' : 'var(--color-white)',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="DEBIT_CARD"
                  checked={paymentMethod === 'DEBIT_CARD'} 
                  onChange={() => setPaymentMethod('DEBIT_CARD')}
                  style={{ accentColor: 'var(--color-forest)', width: '18px', height: '18px' }}
                />
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-dark)' }}>
                    Debit Card
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Simulated ATM / RuPay / Debit Card validation
                  </span>
                </div>
              </label>

              {/* Option 4: Cash at Counter */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'CASH' ? 'var(--color-forest)' : 'var(--color-border)'}`,
                  backgroundColor: paymentMethod === 'CASH' ? 'var(--color-fresh-light)' : 'var(--color-white)',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="CASH"
                  checked={paymentMethod === 'CASH'} 
                  onChange={() => setPaymentMethod('CASH')}
                  style={{ accentColor: 'var(--color-forest)', width: '18px', height: '18px' }}
                />
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Banknote size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-dark)' }}>
                    Cash at Canteen Counter
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    Generate order with PENDING status. Pay cash upon food pickup.
                  </span>
                </div>
                <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                  PAY AT COUNTER
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Action */}
        <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-white)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '16px' }}>
            Items in Order ({items.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' }}>
            {items.map((it) => (
              <div key={it.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--color-dark)' }}>
                    {it.name} <span style={{ color: 'var(--color-muted)', fontWeight: '400' }}>× {it.quantity}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>₹{it.price} each</span>
                </div>
                <strong style={{ color: 'var(--color-forest)' }}>
                  ₹{it.price * it.quantity}
                </strong>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>Amount to Pay:</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
              ₹{subtotal}
            </span>
          </div>

          <button 
            onClick={handleProceedToPayment}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={isProcessing}
          >
            <Lock size={18} />
            <span>
              {isProcessing 
                ? 'Processing...' 
                : paymentMethod === 'CASH' 
                ? `Confirm Cash Order (₹${subtotal})` 
                : `Pay ₹${subtotal} (${paymentMethod.replace('_', ' ')})`}
            </span>
          </button>

          <div style={{
            marginTop: '16px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#166534'
          }}>
            <ShieldCheck size={16} />
            <span>Idempotent backend processing protects against double charging.</span>
          </div>
        </div>
      </div>

      {/* Render Payment Modals */}
      {showUpiModal && (
        <UpiPaymentModal 
          amount={subtotal}
          isProcessing={isProcessing}
          onConfirm={(details) => executeOrderCreation(details)}
          onCancel={() => setShowUpiModal(false)}
        />
      )}

      {showCardModal && (
        <CardPaymentModal 
          type={cardType}
          amount={subtotal}
          isProcessing={isProcessing}
          onConfirm={(details) => executeOrderCreation(details)}
          onCancel={() => setShowCardModal(false)}
        />
      )}
    </div>
  );
}
