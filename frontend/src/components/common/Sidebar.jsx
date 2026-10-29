import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Flame, 
  Utensils, 
  Receipt, 
  BarChart3, 
  Users, 
  MessageSquareQuote, 
  Settings, 
  LogOut,
  UtensilsCrossed,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  const navItems = [
    { to: '/owner/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/owner/live-orders', label: 'Live Orders Queue', icon: Flame },
    { to: '/owner/menu', label: 'Menu Management', icon: Utensils },
    { to: '/owner/payments', label: 'Payment History', icon: Receipt },
    { to: '/owner/reports', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/owner/students', label: 'Student Accounts', icon: Users },
    { to: '/owner/suggestions', label: 'Suggestions Review', icon: MessageSquareQuote },
    { to: '/owner/settings', label: 'Canteen Settings', icon: Settings }
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--color-forest)',
      color: 'var(--color-white)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-orange)',
            color: '#10382C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-white)' }}>
              Campus<span style={{ color: 'var(--color-orange)' }}>Bite</span>
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#B6C7BE', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Owner Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/owner/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-white)' : '#B6C7BE',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.9rem',
                transition: 'all 150ms ease'
              })}
            >
              <Icon size={18} color="var(--color-orange)" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div style={{ margin: '14px 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

        <a 
          href="/" 
          target="_blank" 
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md)',
            color: '#B6C7BE',
            fontSize: '0.85rem'
          }}
        >
          <ExternalLink size={16} />
          <span>View Student Site</span>
        </a>
      </nav>

      {/* Owner User Footnote */}
      <div style={{
        padding: '18px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: 'rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-white)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.name || 'Canteen Master'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#9BB1A5' }}>
              Authorized Owner
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            title="Sign Out of Owner Dashboard"
            style={{
              color: '#F87171',
              padding: '8px',
              borderRadius: '6px',
              transition: 'background-color 150ms'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
