import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { getSocket, joinOrderRoom, leaveOrderRoom } from '../../services/socket';
import { generateReceiptPdf } from '../../services/pdfGenerator';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { 
  CheckCircle2, 
  Download, 
  Clock, 
  ArrowRight, 
  Utensils, 
  Receipt, 
  ShieldCheck,
  AlertCircle 
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!order) {
      api.orders.getById(id)
        .then(res => {
          if (res.success && res.order) {
            setOrder(res.order);
          }
        })
        .catch(err => console.error('Failed to fetch confirmed order:', err))
        .finally(() => setLoading(false));
    }

    joinOrderRoom(id);
    const socket = getSocket();

    const onStatusUpdated = (updatedOrder) => {
      if (updatedOrder.orderId === id) {
        setOrder(updatedOrder);
      }
    };

    const onPaymentVerified = (updatedOrder) => {
      if (updatedOrder.orderId === id) {
        setOrder(updatedOrder);
      }
    };

    socket.on('order:status_updated', onStatusUpdated);
    socket.on('order:payment_verified', onPaymentVerified);

    return () => {
      leaveOrderRoom(id);
      socket.off('order:status_updated', onStatusUpdated);
      socket.off('order:payment_verified', onPaymentVerified);
    };
  }, [id]);

  const handleDownloadReceipt = () => {
    if (!order) return;
    setDownloading(true);
    try {
      generateReceiptPdf(order);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-muted)' }}>Retrieving your order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ color: '#DC2626' }}>Order Not Found</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '8px' }}>
          Could not locate order #{id}.
        </p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px', maxWidth: '780px' }}>
      {/* Success Banner */}
      <div style={{
        backgroundColor: '#F0FDF4',
        border: '1.5px solid #86EFAC',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#DCFCE7',
          color: '#15803D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <CheckCircle2 size={32} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ORDER REGISTERED IN DYNAMODB
          </span>
          <h1 style={{ fontSize: '1.8rem', color: '#166534', marginTop: '2px' }}>
            Order Confirmed Successfully!
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#15803D', marginTop: '2px' }}>
            Your meal preparation request has been sent to the canteen kitchen.
          </p>
        </div>
      </div>

      {/* Unique Token Showcase Card */}
      <div className="card" style={{
        padding: '32px 28px',
        backgroundColor: 'var(--color-forest)',
        color: 'var(--color-white)',
        textAlign: 'center',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }} />

        <span style={{
          fontSize: '0.85rem',
          fontWeight: '700',
          color: 'var(--color-orange)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'block',
          marginBottom: '8px'
        }}>
          YOUR OFFICIAL CANTEEN TOKEN
        </span>

        <div style={{
          fontSize: 'clamp(3rem, 8vw, 4.5rem)',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-white)',
          letterSpacing: '2px',
          textShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {order.tokenNumber}
        </div>

        <p style={{ fontSize: '0.95rem', color: '#D1DBD4', maxWidth: '480px', margin: '8px auto 20px' }}>
          Please keep this token handy. When your live order status changes to <strong>READY FOR PICKUP</strong>, show this token at the food collection counter.
        </p>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem'
        }}>
          <span>Order ID: <strong>{order.orderId}</strong></span>
          <span>•</span>
          <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>

        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px 18px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.82rem',
          color: '#FEF08A'
        }}>
          <span>📧 Order receipt notification dispatched via Amazon SNS to <strong>{order.studentEmail || 'registered email'}</strong></span>
        </div>
      </div>

      {/* Order Meta & Actions */}
      <div className="card" style={{ padding: '28px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '18px' }}>
          Order & Payment Summary
        </h2>

        {/* Status Pills Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block' }}>Order Status</span>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block' }}>Payment Method</span>
            <strong style={{ fontSize: '0.9rem' }}>{order.paymentMethod}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block' }}>Payment Status</span>
            <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block' }}>Total Paid/Due</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>₹{order.totalAmount}</strong>
          </div>
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
            Ordered Food Items
          </span>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <div>
                <strong>{it.name}</strong> <span style={{ color: 'var(--color-muted)' }}>× {it.quantity}</span>
              </div>
              <span>₹{it.price * it.quantity}</span>
            </div>
          ))}
        </div>

        {/* Notice for cash payments */}
        {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={20} color="#D97706" />
            <p style={{ fontSize: '0.85rem', color: '#92400E' }}>
              <strong>Cash Payment Pending:</strong> Please pay ₹{order.totalAmount} at the canteen collection counter. The canteen owner will verify your payment in the system upon handover.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '10px' }}>
          <button 
            onClick={handleDownloadReceipt}
            className="btn btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={downloading}
          >
            <Download size={18} />
            <span>{downloading ? 'Generating PDF...' : 'Download Receipt PDF'}</span>
          </button>

          <Link 
            to={`/orders/track/${order.orderId}`}
            className="btn btn-accent" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Clock size={18} />
            <span>Track Live Order</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
