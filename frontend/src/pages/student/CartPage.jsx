import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  ShieldCheck,
  UtensilsCrossed 
} from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const maxPrepTime = items.reduce((max, i) => Math.max(max, i.prepTimeMinutes || 10), 10);

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '90px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-cream)',
            color: 'var(--color-forest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px'
          }}>
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Looks like you haven't added any delicious food items yet. Check out today's freshly prepared canteen menu!
          </p>
          <Link to="/menu" className="btn btn-primary">
            <UtensilsCrossed size={18} />
            <span>Explore Canteen Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Link to="/menu" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
          <ArrowLeft size={16} /> Back to Menu
        </Link>
      </div>

      <h1 style={{ fontSize: '2.2rem', color: 'var(--color-forest)', marginBottom: '28px' }}>
        Your Canteen Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'flex-start'
      }}>
        {/* Items List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item) => (
            <div 
              key={item.itemId} 
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              {/* Item Thumbnail */}
              <img 
                src={item.imageUrl} 
                alt={item.name}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover'
                }}
              />

              {/* Item Details */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-dark)' }}>
                  {item.name}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-forest)', fontWeight: '700', marginTop: '2px' }}>
                  ₹{item.price} each
                </div>
              </div>

              {/* Quantity Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-cream)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px',
                border: '1px solid var(--color-border)'
              }}>
                <button 
                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                  style={{
                    width: '26px',
                    height: '26px',
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
                <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                  {item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                  style={{
                    width: '26px',
                    height: '26px',
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

              {/* Subtotal & Delete */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-forest)' }}>
                  ₹{item.price * item.quantity}
                </div>
                <button 
                  onClick={() => removeItem(item.itemId)}
                  style={{
                    marginTop: '6px',
                    color: '#EF4444',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Remove from cart"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <Link to="/menu" className="btn btn-secondary btn-sm">
              + Add More Items
            </Link>
            <button 
              onClick={clearCart} 
              style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: '600' }}
            >
              Clear Entire Cart
            </button>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="card" style={{ padding: '24px 28px', backgroundColor: 'var(--color-white)' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest)', marginBottom: '18px' }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
              <span>Items Total ({itemCount}):</span>
              <span style={{ fontWeight: '700', color: 'var(--color-dark)' }}>₹{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
              <span>Canteen Packaging:</span>
              <span style={{ fontWeight: '700', color: '#16A34A' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
              <span>Taxes / Campus Surcharge:</span>
              <span style={{ fontWeight: '700', color: '#16A34A' }}>₹0.00</span>
            </div>

            <div style={{
              borderTop: '1px dashed var(--color-border)',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline'
            }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-dark)' }}>
                Final Amount:
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
                ₹{subtotal}
              </span>
            </div>
          </div>

          {/* Prep time estimate notice */}
          <div style={{
            backgroundColor: 'var(--color-cream)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '22px'
          }}>
            <Clock size={18} color="var(--color-orange)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
              Estimated preparation time: <strong>~{maxPrepTime} mins</strong> from order placement.
            </span>
          </div>

          <button 
            onClick={handleCheckoutClick}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={18} />
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: '12px' }}>
            Prices and totals are verified securely by the backend server before token assignment.
          </p>
        </div>
      </div>
    </div>
  );
}
