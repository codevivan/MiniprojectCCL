import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Search, RefreshCw, ShoppingBag } from 'lucide-react';

export default function OwnerStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await api.admin.getStudents();
      if (res.success && res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
            Registered Student Accounts
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Operational directory of students who place canteen pre-orders. Private credentials strictly redacted.
          </p>
        </div>

        <button 
          onClick={fetchStudents} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} color="var(--color-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            placeholder="Search by student name, roll ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading students directory...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Users size={40} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)' }}>No Registered Students Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            When students register via the student portal, their profile summary will appear here.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll / Student ID</th>
                  <th>College Email</th>
                  <th>Account Created</th>
                  <th>Total Orders Placed</th>
                  <th>Verified Spend (₹)</th>
                  <th style={{ textAlign: 'right' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.userId}>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-dark)' }}>{s.name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.85rem', color: 'var(--color-forest)', backgroundColor: 'var(--color-cream)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.studentId || 'N/A'}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {s.email}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge badge-confirmed" style={{ fontSize: '0.75rem' }}>
                        {s.orderCount} orders
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-forest)' }}>₹{s.totalSpent}</strong>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      {s.lastOrder ? new Date(s.lastOrder).toLocaleDateString() : 'No orders yet'}
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
