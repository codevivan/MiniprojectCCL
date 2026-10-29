import React from 'react';
import { Clock, ChefHat, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: Clock },
  { key: 'PREPARING', label: 'Preparing Meal', icon: ChefHat },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: CheckCircle2 },
  { key: 'COMPLETED', label: 'Order Completed', icon: CheckCheck }
];

export default function OrderTracker({ orderStatus }) {
  if (orderStatus === 'CANCELLED') {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#FEF2F2',
        border: '1.5px solid #FCA5A5',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: '#991B1B'
      }}>
        <XCircle size={32} />
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#991B1B' }}>Order Has Been Cancelled</h4>
          <p style={{ fontSize: '0.875rem', marginTop: '2px' }}>
            This order was cancelled by the canteen administration or student.
          </p>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex(s => s.key === orderStatus);
  const currentStep = stepIndex === -1 ? 0 : stepIndex;

  return (
    <div style={{
      padding: '24px 20px',
      backgroundColor: 'var(--color-white)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Continuous connector line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '30px',
          right: '30px',
          height: '4px',
          backgroundColor: '#E5E7EB',
          zIndex: 1
        }}>
          {/* Active filled line */}
          <div style={{
            height: '100%',
            backgroundColor: 'var(--color-forest)',
            width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
            transition: 'width 400ms ease-in-out'
          }} />
        </div>

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;
          const StepIcon = step.icon;

          return (
            <div 
              key={step.key} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 2,
                flex: 1
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: isDone ? 'var(--color-forest)' : 'var(--color-white)',
                border: `3px solid ${isDone ? 'var(--color-forest)' : '#D1D5DB'}`,
                color: isDone ? 'var(--color-white)' : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCurrent ? '0 0 0 5px rgba(38, 118, 83, 0.2)' : 'none',
                transition: 'all 300ms ease'
              }} className={isCurrent ? 'pulse' : ''}>
                <StepIcon size={20} />
              </div>

              <span style={{
                marginTop: '10px',
                fontSize: '0.8rem',
                fontWeight: isCurrent ? '800' : isDone ? '600' : '500',
                color: isDone ? 'var(--color-forest)' : 'var(--color-muted)',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
