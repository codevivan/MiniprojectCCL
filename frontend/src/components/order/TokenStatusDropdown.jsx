import React from 'react';
import { ChefHat, CheckCircle2, CheckCheck, XCircle, Clock, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: Clock, bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  { value: 'PREPARING', label: 'Being Prepared', icon: ChefHat, bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: CheckCircle2, bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  { value: 'COMPLETED', label: 'Completed / Picked Up', icon: CheckCheck, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' }
];

export default function TokenStatusDropdown({ order, onStatusChange, isUpdating, compact = false }) {
  const currentStatus = order?.orderStatus || 'ORDER_CONFIRMED';
  const currentConfig = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  const handleSelectChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus && newStatus !== currentStatus && onStatusChange) {
      onStatusChange(order.orderId, newStatus);
    }
  };

  // Helper for 1-click next stage progression
  const getNextStage = () => {
    if (currentStatus === 'ORDER_CONFIRMED') return { next: 'PREPARING', label: 'Start Prep', icon: ChefHat };
    if (currentStatus === 'PREPARING') return { next: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: CheckCircle2 };
    if (currentStatus === 'READY_FOR_PICKUP') return { next: 'COMPLETED', label: 'Mark Picked Up', icon: CheckCheck };
    return null;
  };

  const nextStage = getNextStage();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Interactive Status Dropdown */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={currentStatus}
          onChange={handleSelectChange}
          disabled={isUpdating}
          title="Change token status"
          style={{
            padding: compact ? '4px 28px 4px 10px' : '6px 32px 6px 12px',
            borderRadius: '8px',
            fontSize: compact ? '0.78rem' : '0.84rem',
            fontWeight: '700',
            backgroundColor: currentConfig.bg,
            color: currentConfig.color,
            border: `1.5px solid ${currentConfig.border}`,
            outline: 'none',
            cursor: isUpdating ? 'wait' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            transition: 'all 180ms ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            opacity: isUpdating ? 0.6 : 1
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#111827', fontWeight: '600' }}>
              {opt.value === 'ORDER_CONFIRMED' && '🟡 '}
              {opt.value === 'PREPARING' && '👨‍🍳 '}
              {opt.value === 'READY_FOR_PICKUP' && '🔔 '}
              {opt.value === 'COMPLETED' && '✅ '}
              {opt.value === 'CANCELLED' && '❌ '}
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Chevron Indicator or Spinner */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          color: currentConfig.color
        }}>
          {isUpdating ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* 1-Click Quick Progression Button */}
      {nextStage && (
        <button
          onClick={() => onStatusChange && onStatusChange(order.orderId, nextStage.next)}
          disabled={isUpdating}
          className={`btn btn-sm ${currentStatus === 'PREPARING' ? 'btn-accent' : 'btn-secondary'}`}
          style={{
            padding: compact ? '4px 9px' : '5px 12px',
            fontSize: compact ? '0.74rem' : '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
          title={`Quick advance to ${nextStage.label}`}
        >
          {isUpdating ? <Loader2 size={12} className="spin" /> : <nextStage.icon size={13} />}
          <span>{nextStage.label}</span>
        </button>
      )}

      {currentStatus === 'COMPLETED' && (
        <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          ✓ Done
        </span>
      )}

      {currentStatus === 'CANCELLED' && (
        <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '700' }}>
          Cancelled
        </span>
      )}
    </div>
  );
}
