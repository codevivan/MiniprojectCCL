import React from 'react';
import { useCart } from '../../context/CartContext';
import { Clock, Plus, Minus, Check, AlertCircle } from 'lucide-react';

export default function FoodCard({ item }) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.itemId === item.itemId);
  const isAvailable = item.isAvailable !== false;

  return (
    <div 
      className="card" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        opacity: isAvailable ? 1 : 0.72,
        position: 'relative'
      }}
    >
      {/* Food Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        backgroundColor: '#EAE6DD'
      }}>
        <img 
          src={item.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'} 
          alt={item.name} 
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 300ms ease'
          }}
          onError={(e) => {
            // Prevent infinite fallback loop
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';
          }}
          onMouseEnter={(e) => {
            if (isAvailable) e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1.0)';
          }}
        />

        {/* Category Pill */}
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(23, 76, 60, 0.85)',
          color: 'var(--color-white)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.72rem',
          fontWeight: '700',
          letterSpacing: '0.5px',
          backdropFilter: 'blur(4px)'
        }}>
          {item.category}
        </span>

        {/* Availability Badge */}
        {!isAvailable && (
          <span style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#DC2626',
            color: 'var(--color-white)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: '700'
          }}>
            Sold Out
          </span>
        )}
      </div>

      {/* Card Content */}
      <div style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{
            fontSize: '1.15rem',
            fontWeight: '700',
            color: 'var(--color-dark)',
            lineHeight: 1.3
          }}>
            {item.name}
          </h3>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: '800',
            color: 'var(--color-forest)',
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            marginLeft: '8px'
          }}>
            ₹{item.price}
          </span>
        </div>

        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-muted)',
          lineHeight: 1.5,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {item.description}
        </p>

        {/* Bottom Bar: Prep Time & Add Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border-subtle)',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.78rem',
            color: 'var(--color-muted)',
            fontWeight: '500'
          }}>
            <Clock size={14} color="var(--color-orange)" />
            <span>~{item.prepTimeMinutes || 10} mins</span>
          </div>

          <div>
            {!isAvailable ? (
              <button 
                disabled 
                className="btn btn-secondary btn-sm"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                Unavailable
              </button>
            ) : cartItem ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-fresh-light)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px',
                border: '1px solid var(--color-fresh)'
              }}>
                <button 
                  onClick={() => updateQuantity(item.itemId, cartItem.quantity - 1)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-forest)'
                  }}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span style={{
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  color: 'var(--color-forest)',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {cartItem.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.itemId, cartItem.quantity + 1)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-forest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-white)'
                  }}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addItem(item)}
                className="btn btn-accent btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
