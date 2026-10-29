import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { getSocket, joinOwnerRoom } from '../../services/socket';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import TokenStatusDropdown from '../../components/order/TokenStatusDropdown';
import { exportOrdersToCsv } from '../../services/reportExporter';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Banknote, 
  Users, 
  ArrowRight,
  Flame,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCheck,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [queueSearch, setQueueSearch] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activeRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getActiveOrders()
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (activeRes.success && activeRes.orders) {
        setActiveOrders(activeRes.orders);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    joinOwnerRoom();

    const socket = getSocket();

    const handleNewOrder = (newOrder) => {
      console.log('[Socket.IO Owner Dashboard] New order token received:', newOrder.tokenNumber);
      setActiveOrders(prev => [newOrder, ...prev.filter(o => o.orderId !== newOrder.orderId)]);
      setStats(prev => prev ? { 
        ...prev, 
        activeOrders: (prev.activeOrders || 0) + 1,
        todayOrderCount: (prev.todayOrderCount || 0) + 1,
        totalOrders: (prev.totalOrders || 0) + 1
      } : prev);
      setNotification(`New order received! Token #${newOrder.tokenNumber} for ₹${newOrder.totalAmount} (${newOrder.studentName || 'Student'})`);
      setTimeout(() => setNotification(null), 6000);
    };

    const handleStatusUpdated = (updatedOrder) => {
      console.log('[Socket.IO Owner Dashboard] Status updated for token:', updatedOrder.tokenNumber, updatedOrder.orderStatus);
      setActiveOrders(prev => {
        // If order completed or cancelled, remove from active after a moment or update in place
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.orderStatus)) {
          return prev.filter(o => o.orderId !== updatedOrder.orderId);
        }
        return prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o);
      });
      // Refresh stats to ensure counters reflect completed order
      api.admin.getStats().then(res => {
        if (res.success && res.stats) setStats(res.stats);
      }).catch(() => {});
    };

    const handlePaymentVerified = (updatedOrder) => {
      setActiveOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
      api.admin.getStats().then(res => {
        if (res.success && res.stats) setStats(res.stats);
      }).catch(() => {});
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success && res.order) {
        if (['COMPLETED', 'CANCELLED'].includes(newStatus)) {
          setActiveOrders(prev => prev.filter(o => o.orderId !== orderId));
        } else {
          setActiveOrders(prev => prev.map(o => o.orderId === orderId ? res.order : o));
        }
        setNotification(`Token #${res.order.tokenNumber} status updated to ${newStatus.replace(/_/g, ' ')}!`);
        setTimeout(() => setNotification(null), 4000);
        // Refresh stats
        api.admin.getStats().then(r => { if (r.success) setStats(r.stats); }).catch(() => {});
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyCash = async (orderId) => {
    if (!window.confirm('Confirm that cash payment has been received at the counter?')) return;
    setUpdatingId(orderId);
    try {
      const res = await api.orders.verifyCash(orderId);
      if (res.success && res.order) {
        setActiveOrders(prev => prev.map(o => o.orderId === orderId ? res.order : o));
        setNotification(`Cash payment verified for Token #${res.order.tokenNumber}!`);
        setTimeout(() => setNotification(null), 4000);
        api.admin.getStats().then(r => { if (r.success) setStats(r.stats); }).catch(() => {});
      }
    } catch (err) {
      alert(`Failed to verify cash: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredActiveOrders = activeOrders.filter(o => {
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return (
      o.tokenNumber?.toLowerCase().includes(q) ||
      (o.studentName || '').toLowerCase().includes(q) ||
      o.orderId?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--color-muted)' }}>Querying Amazon DynamoDB for live metrics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            DYNAMODB METRICS • REAL DATABASE METRICS
          </span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)', marginTop: '2px' }}>
            Canteen Operations Overview
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Live performance indicators and kitchen queue statistics.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={() => { setRefreshing(true); fetchDashboardData(); }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={async () => {
              try {
                const res = await api.admin.getAllOrders();
                if (res.success && res.orders) {
                  exportOrdersToCsv(res.orders);
                }
              } catch (err) {
                alert('Failed to download report: ' + err.message);
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', color: '#166534', border: '1.5px solid #BBF7D0', fontWeight: '700' }}
            title="Download full canteen transaction report as CSV spreadsheet"
          >
            <FileSpreadsheet size={15} color="#16A34A" />
            <span>Download Report (CSV)</span>
          </button>
          <Link to="/owner/reports" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <BarChart3 size={15} color="var(--color-orange)" />
            <span>Analytics & Reports</span>
          </Link>
          <Link to="/owner/live-orders" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} />
            <span>Live Kitchen Queue</span>
          </Link>
        </div>
      </div>

      {/* Floating Socket Notification Alert */}
      {notification && (
        <div className="alert alert-success" style={{ marginBottom: '24px', animation: 'fadeIn 200ms ease' }}>
          <Flame size={18} />
          <span style={{ fontWeight: '600' }}>{notification}</span>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Today's Verified Revenue */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>Today's Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
            ₹{stats?.todayRevenue || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '600', marginTop: '4px', display: 'block' }}>
            Verified Paid Orders Only
          </span>
        </div>

        {/* Card 2: Active Orders Queue */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>Active Tokens</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#D97706', fontFamily: 'var(--font-heading)' }}>
            {activeOrders.length || stats?.activeOrders || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
            Awaiting Kitchen Completion
          </span>
        </div>

        {/* Card 3: Today's Total Orders */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>Today's Orders</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', fontFamily: 'var(--font-heading)' }}>
            {stats?.todayOrderCount || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
            All-Time Total: {stats?.totalOrders || 0}
          </span>
        </div>

        {/* Card 4: Pending Cash Payments */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>Pending Cash</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#DC2626', fontFamily: 'var(--font-heading)' }}>
            {stats?.pendingCashPaymentsCount || 0}
          </div>
          <Link to="/owner/payments" style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Verify at counter <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Active Tokens in Kitchen Queue Section */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="var(--color-orange)" />
              <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest)', margin: 0 }}>
                Active Kitchen Token Queue
              </h2>
              <span className="badge" style={{ backgroundColor: 'var(--color-forest)', color: '#fff', fontSize: '0.8rem', fontWeight: '800' }}>
                {activeOrders.length} In Progress
              </span>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Real-time token dispatch. Change any token's dropdown to advance order status and update students live.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Quick Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} color="var(--color-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search token #, student..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', paddingRight: '10px', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
              />
            </div>

            <Link to="/owner/live-orders" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Full Kitchen View</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {filteredActiveOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: 'var(--color-cream)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
            <Clock size={36} color="var(--color-muted)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1.05rem', color: 'var(--color-dark)', marginBottom: '4px' }}>No Active Orders in Queue</h4>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto' }}>
              When a student places an order, their token will appear here instantly via WebSocket. You can update the status directly from the dropdown.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Student Info</th>
                  <th>Items Ordered</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Current Status</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Update Status Dropdown</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveOrders.map(order => {
                  const isUpdating = updatingId === order.orderId;

                  return (
                    <tr key={order.orderId}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '1.15rem',
                          fontWeight: '800',
                          color: 'var(--color-forest)',
                          backgroundColor: 'var(--color-cream)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--color-border)'
                        }}>
                          {order.tokenNumber}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                          {order.orderId}
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>{order.studentName || 'Student'}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>
                          {order.studentCollegeId ? `ID: ${order.studentCollegeId}` : order.studentEmail}
                        </span>
                      </td>

                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ fontSize: '0.84rem' }}>
                          {(order.items || []).map((it, idx) => (
                            <span key={idx} style={{ display: 'block' }}>
                              • {it.name} <strong style={{ color: 'var(--color-forest)' }}>× {it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-forest)' }}>
                          ₹{order.totalAmount}
                        </strong>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block' }}>
                          {order.paymentMethod}
                        </span>
                        <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.66rem', marginTop: '2px' }}>
                          {order.paymentStatus}
                        </span>

                        {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => handleVerifyCash(order.orderId)}
                            className="btn btn-sm"
                            disabled={isUpdating}
                            style={{
                              marginTop: '4px',
                              padding: '2px 7px',
                              fontSize: '0.7rem',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Banknote size={11} />
                            <span>Verify</span>
                          </button>
                        )}
                      </td>

                      <td>
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>

                      <td style={{ fontSize: '0.76rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <TokenStatusDropdown
                          order={order}
                          onStatusChange={handleUpdateStatus}
                          isUpdating={isUpdating}
                          compact={true}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popular Items & Quick Shortcuts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Popular Menu Items */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)' }}>
              Top Selling Food Items
            </h3>
            <Link to="/owner/menu" style={{ fontSize: '0.85rem', color: 'var(--color-orange)', fontWeight: '700' }}>
              Manage Menu
            </Link>
          </div>

          {(!stats?.popularItems || stats.popularItems.length === 0) ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
              No orders placed yet. As students place orders, best sellers will appear here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.popularItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.name}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Category: {item.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', color: 'var(--color-forest)' }}>{item.count} orders</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>₹{item.revenue} revenue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operational Highlights */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', marginBottom: '18px' }}>
            System & Architecture Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-muted)' }}>Database Engine:</span>
              <span className="badge badge-completed">Amazon DynamoDB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-muted)' }}>Real-Time Dispatch:</span>
              <span className="badge badge-ready">Socket.IO Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-muted)' }}>All-Time Revenue (Verified):</span>
              <strong style={{ color: 'var(--color-forest)' }}>₹{stats?.allTimeVerifiedRevenue || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-muted)' }}>Completed Orders:</span>
              <strong>{stats?.completedOrders || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-muted)' }}>Registered Students:</span>
              <strong>{stats?.registeredStudentsCount || 0} students</strong>
            </div>
          </div>

          <div style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '10px'
          }}>
            <Link to="/owner/reports" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center', fontWeight: '700' }}>
              View Analytics & Reports
            </Link>
            <Link to="/owner/settings" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
              Canteen Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
