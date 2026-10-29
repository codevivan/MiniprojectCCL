import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Star, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle 
} from 'lucide-react';

const CATEGORIES = [
  'Suggested food items',
  'Food quality feedback',
  'Pricing suggestions',
  'Cleanliness suggestions',
  'Service improvement ideas',
  'Other canteen feedback'
];

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [mySuggestions, setMySuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadMySuggestions();
  }, []);

  const loadMySuggestions = async () => {
    try {
      const res = await api.suggestions.getMy();
      if (res.success && res.suggestions) {
        setMySuggestions(res.suggestions);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.suggestions.submit({
        category,
        subject,
        description,
        rating
      });

      if (res.success && res.suggestion) {
        setSuccessMsg('Your feedback has been submitted to the canteen manager. Thank you!');
        setSubject('');
        setDescription('');
        setMySuggestions([res.suggestion, ...mySuggestions]);
      } else {
        setErrorMsg(res.error || 'Failed to submit suggestion.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'IMPLEMENTED') {
      return <span className="badge badge-completed"><CheckCircle2 size={12} /> Implemented</span>;
    }
    if (status === 'REVIEWED') {
      return <span className="badge badge-preparing"><Clock size={12} /> Under Review</span>;
    }
    return <span className="badge badge-confirmed"><HelpCircle size={12} /> New</span>;
  };

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px', maxWidth: '960px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)' }}>
          Student Suggestions & Canteen Feedback
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
          Have ideas for new food items, pricing, or service improvements? Submit your feedback directly to the canteen owner.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'flex-start'
      }}>
        {/* Left Form: Submit New Suggestion */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--color-forest)', marginBottom: '18px' }}>
            Submit Feedback
          </h2>

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Feedback Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Please add Cold Brew or Pav Bhaji"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea 
                className="form-textarea" 
                rows={4}
                placeholder="Explain your suggestion or feedback in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Overall Canteen Rating</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      padding: '4px',
                      color: star <= rating ? 'var(--color-orange)' : '#D1D5DB',
                      transition: 'transform 100ms'
                    }}
                  >
                    <Star size={24} fill={star <= rating ? 'var(--color-orange)' : 'none'} />
                  </button>
                ))}
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginLeft: '6px' }}>
                  ({rating} out of 5 stars)
                </span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '14px' }}
              disabled={submitting}
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Suggestion'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Student's Past Submissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--color-forest)' }}>
            My Submitted Feedback ({mySuggestions.length})
          </h2>

          {loading ? (
            <p style={{ color: 'var(--color-muted)' }}>Loading your suggestions...</p>
          ) : mySuggestions.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <MessageSquare size={36} color="var(--color-muted)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--color-dark)', marginBottom: '4px' }}>No Suggestions Yet</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                Your submitted feedback and administrative review statuses will appear here.
              </p>
            </div>
          ) : (
            mySuggestions.map(s => (
              <div key={s.suggestionId} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
                    {s.category}
                  </span>
                  {getStatusBadge(s.status)}
                </div>

                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-dark)', marginBottom: '6px' }}>
                  {s.subject}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {s.description}
                </p>

                {/* Internal Admin Note if reviewed */}
                {s.adminResponse && (
                  <div style={{
                    backgroundColor: 'var(--color-fresh-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    color: 'var(--color-forest)',
                    marginBottom: '10px',
                    borderLeft: '4px solid var(--color-fresh)'
                  }}>
                    <strong>Owner Response:</strong> {s.adminResponse}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '8px' }}>
                  <span>Submitted {new Date(s.createdAt).toLocaleDateString()}</span>
                  {s.rating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#D97706', fontWeight: '600' }}>
                      <Star size={13} fill="#D97706" /> {s.rating}/5
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
