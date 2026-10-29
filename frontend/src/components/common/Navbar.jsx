import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Clock, 
  History, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu as MenuIcon, 
  X,
  ShieldAlert
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isOwner, isStudent, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      backgroundColor: 'var(--color-white)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand Identity */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-forest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-orange)'
          }}>
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-forest)',
              letterSpacing: '-0.5px'
            }}>
              Campus<span style={{ color: 'var(--color-orange)' }}>Bite</span>
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'var(--color-muted)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '-3px'
            }}>
              Order Smart. Skip Queue.
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '24px'
        }} className="desktop-nav">
          <Link 
            to="/" 
            style={{
              fontWeight: isActive('/') ? '700' : '500',
              color: isActive('/') ? 'var(--color-forest)' : 'var(--color-dark)',
              fontSize: '0.95rem'
            }}
          >
            Home
          </Link>
          <Link 
            to="/menu" 
            style={{
              fontWeight: isActive('/menu') ? '700' : '500',
              color: isActive('/menu') ? 'var(--color-forest)' : 'var(--color-dark)',
              fontSize: '0.95rem'
            }}
          >
            Food Menu
          </Link>

          {isStudent && (
            <>
              <Link 
                to="/orders" 
                style={{
                  fontWeight: isActive('/orders') ? '700' : '500',
                  color: isActive('/orders') ? 'var(--color-forest)' : 'var(--color-dark)',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <History size={16} /> My Orders
              </Link>
              <Link 
                to="/suggestions" 
                style={{
                  fontWeight: isActive('/suggestions') ? '700' : '500',
                  color: isActive('/suggestions') ? 'var(--color-forest)' : 'var(--color-dark)',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={16} /> Suggestions
              </Link>
            </>
          )}

          {isOwner && (
            <Link 
              to="/owner/dashboard" 
              className="badge"
              style={{
                backgroundColor: 'var(--color-forest-light)',
                color: 'var(--color-white)',
                padding: '6px 14px',
                fontSize: '0.85rem'
              }}
            >
              <ShieldAlert size={15} /> Owner Dashboard
            </Link>
          )}
        </nav>

        {/* User / Cart Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Cart Icon (for students/guests) */}
          {!isOwner && (
            <Link 
              to="/cart" 
              aria-label="View Shopping Cart"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-cream)',
                color: 'var(--color-forest)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--color-orange)',
                  color: '#10382C',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}>
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth Controls */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'none', flexDirection: 'column', textAlign: 'right' }} className="user-info-text">
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-forest)' }}>
                  {user?.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  {isOwner ? 'Master Canteen Owner' : `ID: ${user?.studentId || 'Student'}`}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/auth" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-forest)', color: 'var(--color-forest)', fontWeight: '600' }}>
                Sign In / Register
              </Link>
              <Link to="/owner/login" className="btn btn-primary btn-sm owner-login-btn" style={{ display: 'none' }}>
                Owner Portal
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="mobile-menu-btn"
            style={{
              padding: '8px',
              color: 'var(--color-forest)',
              borderRadius: '8px'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderTop: '1px solid var(--color-border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: '600' }}>
            Home
          </Link>
          <Link to="/menu" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: '600' }}>
            Browse Menu
          </Link>
          {isStudent && (
            <>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: '600' }}>
                My Orders & Tokens
              </Link>
              <Link to="/suggestions" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: '600' }}>
                Submit Suggestions
              </Link>
            </>
          )}
          {isOwner && (
            <Link to="/owner/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: '700', color: 'var(--color-forest)' }}>
              Owner Dashboard
            </Link>
          )}
          {!isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                Sign In / Register (Role Portal)
              </Link>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  Student
                </Link>
                <Link to="/owner/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  Owner
                </Link>
              </div>
            </div>
          ) : (
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-danger btn-sm" style={{ marginTop: '10px' }}>
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* Media query styling inline helper */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .user-info-text { display: flex !important; }
          .owner-login-btn { display: inline-flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
