import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ChefHat, 
  UtensilsCrossed, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Receipt,
  UserPlus,
  LogIn
} from 'lucide-react';

export default function WelcomeAuthPage() {
  return (
    <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px', maxWidth: '1080px' }}>
      {/* Top Banner */}
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 44px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(23, 76, 60, 0.08)',
          color: 'var(--color-forest)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '14px',
          letterSpacing: '0.5px'
        }}>
          <UtensilsCrossed size={16} color="var(--color-orange)" />
          <span>CAMPUSBITE AUTHENTICATION PORTAL</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--color-forest)', lineHeight: 1.2 }}>
          Choose Your Campus Role
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', marginTop: '8px', lineHeight: 1.5 }}>
          Sign in or create an account to access role-specific canteen ordering, live token tracking, or kitchen administrative controls.
        </p>
      </div>

      {/* Two Role Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        {/* Card 1: Student Portal */}
        <div 
          className="card"
          style={{
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '6px solid var(--color-forest)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-fresh-light)',
              color: 'var(--color-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={32} />
            </div>
            <span className="badge badge-completed" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              STUDENT ROLE
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
            Student Portal
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Pre-order hot food ahead of lunch break, receive an atomic queue token, and track real-time kitchen preparation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
            {[
              'Browse all 28 fresh breakfast, lunch, and snack items',
              'Simulate fast payments via UPI, Cards, or Cash at counter',
              'Receive unique daily pickup token numbers (CB-101)',
              'Watch live order stepper update in real time via WebSocket',
              'Download official computer-generated PDF receipts'
            ].map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} color="var(--color-fresh)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-dark)' }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <Link 
              to="/login" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogIn size={18} />
              <span>Student Sign In</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              to="/register" 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <UserPlus size={18} />
              <span>Create Student Account</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Canteen Owner Portal */}
        <div 
          className="card"
          style={{
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '6px solid var(--color-orange)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-orange-light)',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ChefHat size={32} />
            </div>
            <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '0.75rem', padding: '6px 12px' }}>
              ADMINISTRATIVE ROLE
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
            Canteen Owner Portal
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Manage the kitchen dispatch queue, advance order stages, verify counter cash, and configure menu availability.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
            {[
              'Live kitchen orders queue with instant status advance',
              'Verify cash payments collected at collection counter',
              'Full menu management CRUD and instant stock toggle',
              'Real DynamoDB analytics: Verified revenue & popular dishes',
              'Manage canteen operating hours & broadcast announcements'
            ].map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem' }}>
                <ShieldCheck size={16} color="var(--color-orange)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-dark)' }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <Link 
              to="/owner/login" 
              className="btn btn-accent btn-lg" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogIn size={18} />
              <span>Owner Sign In</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              to="/owner/register" 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <UserPlus size={18} />
              <span>Create Owner Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
