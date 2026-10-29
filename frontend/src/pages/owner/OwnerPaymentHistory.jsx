import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Receipt, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  ShieldCheck 
} from 'lucide-react';

export default function OwnerPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchPayments = async () => {
    try {
      const res = await api.payments.getAll({
        method: methodFilter,
        status: statusFilter
      });
      if (res.success && res.payments) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const handleVerifyCash = async (orderId) => {
    if (!window.confirm('Confirm that cash payment has been collected from the student at the counter?')) return;
    setVerifyingId(orderId);
    try {
      const res = await api.orders.verifyCash(orderId);
      if (res.success) {
        await fetchPayments();
      }
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const filtered = payments.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.transactionRef || '').toLowerCase().includes(q) ||
      (p.orderId || '').toLowerCase().includes(q) ||
      (p.tokenNumber || '').toLowerCase().includes(q) ||
      (p.studentName || '').toLowerCase().includes(q)
    );
  });

  const totalVerifiedRevenue = payments
    .filter(p => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingCashTotal = payments
    .filter(p => p.paymentStatus === 'PENDING' && p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
            Payment History & Cash Verification
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            All simulated transactions and counter cash receipts logged in DynamoDB.
          </p>
        </div>

        <button 
          onClick={fetchPayments} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Sync Payments</span>
        </button>
      </div>

      {/* Summary KPI Mini Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: '600' }}>Verified Paid Revenue</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-forest)', marginTop: '4px' }}>
            ₹{totalVerifiedRevenue}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: '600' }}>Excludes uncollected cash</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: '600' }}>Pending Cash Amount</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
            ₹{pendingCashTotal}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: '600' }}>Awaiting counter settlement</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
            <Search size={16} color="var(--color-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
              placeholder="Search txn ref, order, token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="ALL">All Methods</option>
              <option value="UPI">UPI Only</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="CASH">Cash Only</option>
            </select>

            <select 
              className="form-select" 
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading payment logs...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Receipt size={40} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)' }}>No Payment Records Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Transactions will appear here as soon as orders are confirmed.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Reference</th>
                  <th>Order & Token</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Counter Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.paymentId}>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--color-forest)', backgroundColor: 'var(--color-cream)', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.transactionRef}
                      </code>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-forest)' }}>{p.tokenNumber}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{p.orderId}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.studentName || 'Student'}
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-dark)' }}>₹{p.amount}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {p.paymentMethod}
                    </td>
                    <td>
                      <span className={`badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.paymentMethod === 'CASH' && p.paymentStatus === 'PENDING' ? (
                        <button
                          onClick={() => handleVerifyCash(p.orderId)}
                          disabled={verifyingId === p.orderId}
                          className="btn btn-sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Banknote size={13} />
                          <span>Verify Cash Received</span>
                        </button>
                      ) : p.paymentStatus === 'PAID' ? (
                        <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '700' }}>
                          ✓ Settled
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
