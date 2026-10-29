import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { getSocket, joinOrderRoom, leaveOrderRoom } from '../../services/socket';
import OrderTracker from '../../components/order/OrderTracker';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { generateReceiptPdf } from '../../services/pdfGenerator';
import { 
  Clock, 
  Download, 
  ArrowLeft, 
  UtensilsCrossed, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2,
  AlertCircle,
  ChefHat,
  CheckCheck
} from 'lucide-react';

export default function LiveTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial persisted order state
  const loadOrder = async () => {
    try {
      const res = await api.orders.getById(id);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.error || 'Order not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve order state.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrder();

    // Socket.io Real-Time Order Tracking
    const socket = getSocket();
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // Join order room
    joinOrderRoom(id);

    // Listen to real-time status update
    const onStatusUpdated = (updatedOrder) => {
      if (updatedOrder.orderId === id) {
        console.log('[Socket.IO] Real-time order status updated:', updatedOrder.orderStatus);
        setOrder(updatedOrder);
      }
    };

    const onPaymentVerified = (updatedOrder) => {
      if (updatedOrder.orderId === id) {
        console.log('[Socket.IO] Real-time payment verified:', updatedOrder.paymentStatus);
        setOrder(updatedOrder);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('order:status_updated', onStatusUpdated);
    socket.on('order:payment_verified', onPaymentVerified);

    return () => {
      leaveOrderRoom(id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:status_updated', onStatusUpdated);
      socket.off('order:payment_verified', onPaymentVerified);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-forest)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--color-muted)' }}>Connecting to live order tracker...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ color: '#DC2626' }}>Order Tracking Unavailable</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '8px' }}>
          {error || `Could not find order #${id}.`}
        </p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px', maxWidth: '820px' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
          <ArrowLeft size={16} /> My Orders
        </Link>

        {/* Live Socket Connection Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isConnected ? '#DCFCE7' : '#FEE2E2',
            color: isConnected ? '#15803D' : '#991B1B',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isConnected ? 'LIVE WEBSOCKET' : 'RECONNECTING'}</span>
          </div>

          <button 
            onClick={() => { setRefreshing(true); loadOrder(); }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Reload latest state from database"
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
            REAL-TIME TRACKING
          </span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)', marginTop: '2px' }}>
            Token #{order.tokenNumber}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            Order ID: {order.orderId} • Placed {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>

      {/* Visual Stepper */}
      <div style={{ marginBottom: '32px' }}>
        <OrderTracker orderStatus={order.orderStatus} />
      </div>

      {/* Status Phase Banners */}
      {order.orderStatus === 'ORDER_CONFIRMED' && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1.5px solid #FCD34D',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          color: '#92400E'
        }}>
          <Clock size={28} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Order Confirmed</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '2px' }}>
              Your order token is in the canteen kitchen queue. The kitchen staff will begin preparation shortly!
            </p>
          </div>
        </div>
      )}

      {order.orderStatus === 'PREPARING' && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '2px solid #60A5FA',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          color: '#1E40AF'
        }}>
          <ChefHat size={30} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Meal Being Prepared</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '2px' }}>
              The canteen kitchen is currently cooking and plating your meal. You'll receive a live notification here the instant it is ready!
            </p>
          </div>
        </div>
      )}

      {order.orderStatus === 'READY_FOR_PICKUP' && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '2px solid #22C55E',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          color: '#15803D'
        }} className="pulse">
          <CheckCircle2 size={32} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Your Food is Ready!</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '2px' }}>
              Please head to the canteen pickup counter and present Token <strong>#{order.tokenNumber}</strong> to collect your hot meal.
            </p>
          </div>
        </div>
      )}

      {order.orderStatus === 'COMPLETED' && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '2px solid #86EFAC',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          color: '#166534'
        }}>
          <CheckCheck size={30} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Order Picked Up & Completed</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '2px' }}>
              This order has been handed over at the counter. Enjoy your fresh meal!
            </p>
          </div>
        </div>
      )}

      {/* Order Details Card */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest)', marginBottom: '16px' }}>
          Meal Details
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <div>
                <strong>{it.name}</strong> <span style={{ color: 'var(--color-muted)' }}>× {it.quantity}</span>
              </div>
              <span>₹{it.price * it.quantity}</span>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--color-muted)', display: 'block' }}>Payment Method:</span>
            <strong>{order.paymentMethod}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-muted)', display: 'block' }}>Payment Status:</span>
            <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--color-muted)', display: 'block' }}>Total Paid/Due:</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--color-forest)' }}>₹{order.totalAmount}</strong>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', gap: '14px' }}>
        <button 
          onClick={() => generateReceiptPdf(order)}
          className="btn btn-secondary" 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Download size={18} />
          <span>Download PDF Receipt</span>
        </button>
        <Link to="/menu" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
          Order More Food
        </Link>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
