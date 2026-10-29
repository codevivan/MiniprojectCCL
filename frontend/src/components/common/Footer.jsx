import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Cloud, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-forest-dark)',
      color: 'var(--color-cream)',
      paddingTop: '48px',
      paddingBottom: '24px',
      marginTop: 'auto',
      borderTop: '3px solid var(--color-orange)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          marginBottom: '36px'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10382C'
              }}>
                <UtensilsCrossed size={20} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--color-white)' }}>
                Campus<span style={{ color: 'var(--color-orange)' }}>Bite</span>
              </span>
            </div>
            <p style={{ color: '#A3B1A8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Cloud-Based Canteen Pre-Order & Token Management System. Order your favorite meals ahead of time, pay with simulated payments, and track preparation live.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#D1DBD4' }}>
              <Cloud size={14} color="var(--color-orange)" />
              <span>AWS Cloud Computing Lab (CCL) Mini-Project</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '14px' }}>Student Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/menu" style={{ color: '#C2CCC5', transition: 'color 150ms' }}>Today's Canteen Menu</Link></li>
              <li><Link to="/cart" style={{ color: '#C2CCC5' }}>Shopping Cart & Pre-Order</Link></li>
              <li><Link to="/orders" style={{ color: '#C2CCC5' }}>Live Token Tracking</Link></li>
              <li><Link to="/suggestions" style={{ color: '#C2CCC5' }}>Suggestions & Feedback</Link></li>
            </ul>
          </div>

          {/* Administration & Staff */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '14px' }}>Canteen Management</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/auth" style={{ color: '#C2CCC5' }}>Role Portal (Sign In / Register)</Link></li>
              <li><Link to="/owner/login" style={{ color: '#C2CCC5' }}>Owner Portal Sign In</Link></li>
              <li><Link to="/owner/register" style={{ color: '#C2CCC5' }}>Owner Registration</Link></li>
              <li>
                <span style={{ color: '#8A978E', fontSize: '0.85rem' }}>
                  Hours: 8:00 AM – 6:00 PM (Mon–Sat)
                </span>
              </li>
            </ul>
          </div>

          {/* AWS Cloud Architecture Overview */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '14px' }}>AWS Cloud Stack</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Amazon EC2', 'DynamoDB', 'Amazon S3', 'Amazon Cognito', 'AWS Lambda', 'CloudWatch', 'Amazon VPC', 'AWS IAM'].map(service => (
                <span 
                  key={service} 
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#E0E7E2',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  {service}
                </span>
              ))}
            </div>
            <p style={{ color: '#8A978E', fontSize: '0.78rem', marginTop: '12px' }}>
              Architected for least-privilege security and scalable token dispatch.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.82rem',
          color: '#8A978E'
        }}>
          <div>
            © {new Date().getFullYear()} CampusBite. Built for College Cloud Computing Lab.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Simulated Payment Engine</span>
            <span>•</span>
            <span>DynamoDB Single/Multi Table Store</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
