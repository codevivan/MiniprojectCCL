import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getSocket, joinOwnerRoom } from '../../services/socket';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import TokenStatusDropdown from '../../components/order/TokenStatusDropdown';
import { 
  Flame, 
  Search, 
  RefreshCw, 
  ChefHat, 
  CheckCircle2, 
  CheckCheck, 
  Banknote, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function OwnerLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.admin.getAllOrders();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    joinOwnerRoom();

    // Listen for new orders and status updates on owner_dashboard Socket room
    const socket = getSocket();

    const handleNewOrder = (newOrder) => {
      console.log('[Socket.IO Owner] New order incoming:', newOrder.tokenNumber);
      setOrders(prev => [newOrder, ...prev.filter(o => o.orderId !== newOrder.orderId)]);
      setNotification(`New order placed! Token #${newOrder.tokenNumber} (₹${newOrder.totalAmount})`);
      setTimeout(() => setNotification(null), 5000);
    };

    const handleStatusUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    };

    const handlePaymentVerified = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:status_updated', handleStatusUpdated);
    socket.on('order:payment_verified', handlePaymentVerified);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:status_updated', handleStatusUpdated);
      socket.off('order:payment_verified', handlePaymentVerified);
    };
  }, []);

  // Status transitions
  const handleAdvanceStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? res.order : o));
        setNotification(`Token #${res.order.tokenNumber} updated to ${newStatus.replace(/_/g, ' ')}!`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyCash = async (orderId) => {
    if (!window.confirm('Confirm that cash has been received from the student at the counter?')) return;
    setUpdatingId(orderId);
    try {
      const res = await api.orders.verifyCash(orderId);
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? res.order : o));
      }
    } catch (err) {
      alert(`Failed to verify cash payment: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchToken = o.tokenNumber.toLowerCase().includes(q);
      const matchName = (o.studentName || '').toLowerCase().includes(q);
      const matchOrder = o.orderId.toLowerCase().includes(q);
      return matchToken || matchName || matchOrder;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-orange)', marginBottom: '4px' }}>
            <Flame size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              REAL-TIME KITCHEN QUEUE
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
            Live Orders & Token Dispatch
          </h1>
        </div>

        <button 
          onClick={fetchOrders} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Floating Socket Notification Alert */}
      {notification && (
        <div className="alert alert-success" style={{ marginBottom: '20px', animation: 'fadeIn 200ms ease' }}>
          <Flame size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
            <Search size={16} color="var(--color-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '0.875rem' }}
              placeholder="Search token #, student name, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {[
              { key: 'ALL', label: 'All Orders' },
              { key: 'ORDER_CONFIRMED', label: 'Confirmed' },
              { key: 'PREPARING', label: 'Preparing' },
              { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
              { key: 'COMPLETED', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: statusFilter === tab.key ? '700' : '600',
                  backgroundColor: statusFilter === tab.key ? 'var(--color-forest)' : 'var(--color-cream)',
                  color: statusFilter === tab.key ? 'var(--color-white)' : 'var(--color-dark)',
                  border: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading orders queue...</p>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Clock size={40} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)' }}>No Orders Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            No orders match the current filter "{statusFilter}".
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Token & Order</th>
                  <th>Student Info</th>
                  <th>Items Ordered</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Update Status Dropdown</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const isUpdating = updatingId === order.orderId;

                  return (
                    <tr key={order.orderId}>
                      {/* Token & Order ID */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: 'var(--color-forest)',
                          backgroundColor: 'var(--color-cream)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)'
                        }}>
                          {order.tokenNumber}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                          {order.orderId}
                        </div>
                      </td>

                      {/* Student Info */}
                      <td>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>
                          {order.studentName || 'Student'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          {order.studentCollegeId ? `ID: ${order.studentCollegeId}` : order.studentEmail}
                        </span>
                      </td>

                      {/* Items */}
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          {(order.items || []).map((it, i) => (
                            <span key={i} style={{ display: 'block' }}>
                              • {it.name} <strong style={{ color: 'var(--color-forest)' }}>× {it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-forest)' }}>
                          ₹{order.totalAmount}
                        </strong>
                      </td>

                      {/* Payment */}
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block' }}>
                          {order.paymentMethod}
                        </span>
                        <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.68rem', marginTop: '3px' }}>
                          {order.paymentStatus}
                        </span>

                        {/* Verify Cash Action Button */}
                        {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => handleVerifyCash(order.orderId)}
                            className="btn btn-sm"
                            disabled={isUpdating}
                            style={{
                              marginTop: '6px',
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Banknote size={12} />
                            <span>Verify Cash</span>
                          </button>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td>
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>

                      {/* Timestamp */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Status Dropdown & 1-Click Action */}
                      <td style={{ textAlign: 'right' }}>
                        <TokenStatusDropdown 
                          order={order}
                          onStatusChange={handleAdvanceStatus}
                          isUpdating={isUpdating}
                          compact={false}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
