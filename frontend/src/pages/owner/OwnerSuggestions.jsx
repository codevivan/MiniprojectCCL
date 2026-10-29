import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  MessageSquareQuote, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Star, 
  RefreshCw, 
  Send 
} from 'lucide-react';

export default function OwnerSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [responseInputs, setResponseInputs] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const fetchSuggestions = async () => {
    try {
      const res = await api.suggestions.getAll({
        status: statusFilter,
        category: categoryFilter
      });
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
        const map = {};
        res.suggestions.forEach(s => {
          map[s.suggestionId] = s.adminResponse || '';
        });
        setResponseInputs(map);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter, categoryFilter]);

  const handleUpdateStatus = async (suggestionId, newStatus) => {
    setUpdatingId(suggestionId);
    try {
      const adminNote = responseInputs[suggestionId] || null;
      const res = await api.suggestions.updateStatus(suggestionId, newStatus, adminNote);
      if (res.success && res.suggestion) {
        setSuggestions(prev => prev.map(s => s.suggestionId === suggestionId ? res.suggestion : s));
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
            Student Suggestions & Feedback Review
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Review student comments, change implementation status, and publish responses.
          </p>
        </div>

        <button 
          onClick={fetchSuggestions} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Sync Feedback</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <select 
            className="form-select" 
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Review Statuses</option>
            <option value="NEW">NEW</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="IMPLEMENTED">IMPLEMENTED</option>
          </select>

          <select 
            className="form-select" 
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Suggested food items">Suggested food items</option>
            <option value="Food quality feedback">Food quality feedback</option>
            <option value="Pricing suggestions">Pricing suggestions</option>
            <option value="Cleanliness suggestions">Cleanliness suggestions</option>
            <option value="Service improvement ideas">Service improvement ideas</option>
            <option value="Other canteen feedback">Other canteen feedback</option>
          </select>
        </div>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading feedback submissions...</p>
      ) : suggestions.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <MessageSquareQuote size={40} color="var(--color-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)' }}>No Suggestions Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            No student feedback matches the selected filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {suggestions.map(s => {
            const isUpdating = updatingId === s.suggestionId;

            return (
              <div key={s.suggestionId} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
                      {s.category}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--color-dark)', marginTop: '2px' }}>
                      {s.subject}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {s.status === 'IMPLEMENTED' && <span className="badge badge-completed"><CheckCircle2 size={12} /> Implemented</span>}
                    {s.status === 'REVIEWED' && <span className="badge badge-preparing"><Clock size={12} /> Reviewed</span>}
                    {s.status === 'NEW' && <span className="badge badge-confirmed"><HelpCircle size={12} /> New Submission</span>}
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--color-dark)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {s.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--color-muted)', paddingBottom: '14px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span>From: <strong>{s.studentName || 'Student'}</strong> ({s.studentEmail}) • {new Date(s.createdAt).toLocaleDateString()}</span>
                  {s.rating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: '700' }}>
                      <Star size={14} fill="#D97706" /> {s.rating}/5 Stars
                    </span>
                  )}
                </div>

                {/* Owner Response and Status Modification Area */}
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', display: 'block', marginBottom: '4px' }}>
                      Management Response Note (Visible to Student):
                    </label>
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      placeholder="e.g. Added to next week's menu trial! Thanks for the suggestion."
                      value={responseInputs[s.suggestionId] || ''}
                      onChange={(e) => setResponseInputs({ ...responseInputs, [s.suggestionId]: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateStatus(s.suggestionId, 'REVIEWED')}
                      disabled={isUpdating}
                      className="btn btn-secondary btn-sm"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(s.suggestionId, 'IMPLEMENTED')}
                      disabled={isUpdating}
                      className="btn btn-primary btn-sm"
                    >
                      Mark Implemented
                    </button>
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
