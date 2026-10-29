import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getSocket, joinStudentRoom } from '../../services/socket';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { generateReceiptPdf } from '../../services/pdfGenerator';
import { 
  History, 
  Download, 
  ExternalLink, 
  Clock, 
  ShoppingBag, 
  AlertCircle 
} from 'lucide-react';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.orders.getMyOrders()
      .then(res => {
        if (res.success && res.orders) {
          setOrders(res.orders);
        }
      })
      .catch(err => {
        setError('Failed to load your order history. Please verify your login session.');
      })
      .finally(() => setLoading(false));

    if (user?.userId) {
      joinStudentRoom(user.userId);
    }
    const socket = getSocket();

    const handleStatusUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    };

    const handleOrderCreated = (newOrder) => {
      if (!user || newOrder.studentId === user.userId) {
        setOrders(prev => [newOrder, ...prev.filter(o => o.orderId !== newOrder.orderId)]);
      }
    };

    const handlePaymentVerified = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    };

    socket.on('order:status_updated', handleStatusUpdated);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:payment_verified', handlePaymentVerified);

    return () => {
      socket.off('order:status_updated', handleStatusUpdated);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:payment_verified', handlePaymentVerified);
    };
  }, [user]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'ACTIVE') {
      return ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus);
    }
    if (filter === 'COMPLETED') {
      return order.orderStatus === 'COMPLETED';
    }
    if (filter === 'CANCELLED') {
      return order.orderStatus === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)' }}>
            My Orders & Tokens
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
            View your canteen token history, live status, and official receipts.
          </p>
        </div>

        <Link to="/menu" className="btn btn-primary btn-sm">
          + Place New Order
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '6px' }}>
        {[
          { key: 'ALL', label: `All Orders (${orders.length})` },
          { key: 'ACTIVE', label: `Active Tokens (${orders.filter(o => ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.orderStatus)).length})` },
          { key: 'COMPLETED', label: `Completed (${orders.filter(o => o.orderStatus === 'COMPLETED').length})` },
          { key: 'CANCELLED', label: `Cancelled (${orders.filter(o => o.orderStatus === 'CANCELLED').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontWeight: filter === tab.key ? '700' : '600',
              fontSize: '0.85rem',
              backgroundColor: filter === tab.key ? 'var(--color-forest)' : 'var(--color-white)',
              color: filter === tab.key ? 'var(--color-white)' : 'var(--color-dark)',
              border: `1.5px solid ${filter === tab.key ? 'var(--color-forest)' : 'var(--color-border)'}`,
              whiteSpace: 'nowrap',
              transition: 'all 150ms'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'var(--color-muted)' }}>Retrieving your orders from DynamoDB...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <History size={48} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)', marginBottom: '6px' }}>
            No Orders in "{filter}" Category
          </h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '18px' }}>
            You don't have any past orders matching this filter.
          </p>
          <Link to="/menu" className="btn btn-secondary btn-sm">
            Browse Menu & Order
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map(order => {
            const isActive = ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus);

            return (
              <div 
                key={order.orderId}
                className="card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  borderLeft: isActive ? '6px solid var(--color-orange)' : '1px solid var(--color-border)'
                }}
              >
                {/* Left: Token & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--color-forest)' : 'var(--color-cream)',
                    color: isActive ? 'var(--color-white)' : 'var(--color-dark)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800'
                  }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>
                      TOKEN
                    </span>
                    <span style={{ fontSize: '1.15rem' }}>
                      {order.tokenNumber}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <OrderStatusBadge status={order.orderStatus} />
                      <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      Placed {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </div>

                    {/* Ordered items summary */}
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-dark)', marginTop: '4px' }}>
                      {(order.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Right: Total & Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginLeft: 'auto'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block' }}>Total Paid</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--color-forest)' }}>₹{order.totalAmount}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => generateReceiptPdf(order)}
                      className="btn btn-secondary btn-sm"
                      title="Download PDF Receipt"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Download size={14} />
                      <span>Receipt</span>
                    </button>

                    <Link 
                      to={`/orders/track/${order.orderId}`}
                      className="btn btn-accent btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <span>Track</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
