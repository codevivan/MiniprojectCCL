import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import FoodCard from '../../components/menu/FoodCard';
import { 
  UtensilsCrossed, 
  Clock, 
  Smartphone, 
  FileText, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const FOOD_VARIETY_SLIDES = [
  {
    category: 'Breakfast Specials',
    badge: "CHEF'S SPECIAL",
    badgeColor: 'var(--color-orange)',
    title: 'Crispy Masala Dosa & Hot Medu Vadas',
    desc: 'Golden-brown fermented crepes stuffed with spiced potato masala, served with fresh coconut chutney & sambar.',
    price: '₹35 - ₹60',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'BREAKFAST'
  },
  {
    category: 'Lunch & Thalis',
    badge: 'STUDENT FAVORITE',
    badgeColor: '#10B981',
    title: 'Authentic Veg Thali & Dal Khichdi Meals',
    desc: 'Wholesome balanced campus lunch with aromatic basmati rice, homestyle dal, fresh chapatis, and seasonal sabzi.',
    price: '₹65 - ₹90',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'LUNCH'
  },
  {
    category: 'Mumbai Street Chaat',
    badge: 'HOT & TANGY',
    badgeColor: '#F59E0B',
    title: 'Crispy Pani Puri, Sev Puri & Bhel Puri',
    desc: 'Authentic street food prepared fresh and hygienic. Bursting with tangy tamarind, mint water, and crunchy sev.',
    price: '₹35 - ₹50',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'CHAAT'
  },
  {
    category: 'Grilled Snacks & Rolls',
    badge: 'QUICK BITES',
    badgeColor: '#EC4899',
    title: 'Spiced Paneer Rolls & Cheese Sandwiches',
    desc: 'Loaded toasted sandwiches and buttery Kathi rolls packed with paneer, herbs, and house special chutneys.',
    price: '₹45 - ₹70',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'FAST FOOD'
  },
  {
    category: 'Beverages & Chillers',
    badge: 'COLD & REFRESHING',
    badgeColor: '#3B82F6',
    title: 'South Indian Filter Coffee & Mango Lassi',
    desc: 'Frothed steaming filter kaapi and thick chilled yogurt lassi made fresh to recharge your college day.',
    price: '₹20 - ₹40',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'BEVERAGES'
  },
  {
    category: 'Hot Snacks & Bites',
    badge: 'ALWAYS FRESH',
    badgeColor: '#E11D48',
    title: 'Crispy Samosas, Batata Vada & Steamed Poha',
    desc: 'Piping hot golden snacks with spicy potato filling, served with green mint chutney and fried chilies.',
    price: '₹20 - ₹35',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    categoryFilter: 'SNACKS'
  }
];

export default function LandingPage() {
  const [popularItems, setPopularItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-sliding interval: changes every 2 seconds
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % FOOD_VARIETY_SLIDES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % FOOD_VARIETY_SLIDES.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + FOOD_VARIETY_SLIDES.length) % FOOD_VARIETY_SLIDES.length);

  useEffect(() => {
    Promise.all([
      api.menu.getAll({ availableOnly: 'true' }),
      api.settings.get()
    ])
      .then(([menuRes, settingsRes]) => {
        if (menuRes.success && menuRes.items) {
          // Select 4 popular items across breakfast, lunch, and fast food
          const picks = menuRes.items.filter(it => 
            ['item_bf_dosa', 'item_lu_thali', 'item_ff_pizza', 'item_bv_cold_coffee'].includes(it.itemId)
          );
          setPopularItems(picks.length > 0 ? picks : menuRes.items.slice(0, 4));
        }
        if (settingsRes.success) {
          setSettings(settingsRes.settings);
        }
      })
      .catch(err => console.error('Failed to load landing data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', paddingBottom: '64px' }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--color-forest)',
        color: 'var(--color-white)',
        paddingTop: '64px',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          backgroundColor: 'rgba(38, 118, 83, 0.35)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '48px'
        }}>
          {/* Left Column: Headlines & CTA */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(244, 163, 64, 0.15)',
              border: '1px solid var(--color-orange)',
              color: 'var(--color-orange)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: '700',
              marginBottom: '20px'
            }}>
              <Sparkles size={16} />
              <span>COLLEGE CANTEEN PRE-ORDER SYSTEM</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              fontWeight: '800',
              color: 'var(--color-white)',
              lineHeight: 1.15,
              marginBottom: '18px',
              letterSpacing: '-1px'
            }}>
              Order Smart. <br />
              <span style={{ color: 'var(--color-orange)' }}>Skip the Queue.</span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#D1DBD4',
              lineHeight: 1.6,
              maxWidth: '520px',
              marginBottom: '32px'
            }}>
              Browse freshly prepared breakfast, wholesome thalis, sandwiches, chaat, and coffee. Pre-order from your classroom, track preparation live via Socket.IO, and pick up using your unique token.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
              <Link to="/menu" className="btn btn-accent btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Browse Food Menu <ArrowRight size={18} />
              </Link>
              <Link to="/auth" className="btn btn-secondary btn-lg" style={{ color: 'var(--color-forest)' }}>
                Sign In / Register
              </Link>
            </div>

            {/* Operational Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#B6C7BE' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: settings?.isTemporarilyClosed ? '#EF4444' : '#22C55E' }} />
              <span>
                Canteen Timings: <strong>{settings?.openingHours || '08:00 AM - 06:00 PM'}</strong> (Mon - Sat)
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Food Variety Sliding Showcase */}
          <div style={{ position: 'relative' }}>
            <div 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.15)',
                position: 'relative',
                height: '420px',
                backgroundColor: '#0A261D',
                userSelect: 'none'
              }}
            >
              {/* Sliding Variety Images Container */}
              {FOOD_VARIETY_SLIDES.map((slide, index) => {
                const isActive = index === currentSlide;
                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'scale(1)' : 'scale(1.05)',
                      transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        display: 'block' 
                      }}
                    />
                    {/* Deep gradient overlay for text readability */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(10, 38, 29, 0.95) 0%, rgba(10, 38, 29, 0.55) 40%, transparent 70%)'
                    }} />
                    
                    {/* Slide Text Content */}
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '24px',
                      right: '24px',
                      color: 'var(--color-white)',
                      zIndex: 2
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: slide.badgeColor, color: '#0A261D', fontWeight: '800', letterSpacing: '0.05em', fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px' }}>
                          {slide.badge}
                        </span>
                        <span style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                          backdropFilter: 'blur(8px)',
                          padding: '4px 12px', 
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          color: 'var(--color-white)',
                          letterSpacing: '0.03em'
                        }}>
                          {slide.price}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.35rem', color: 'var(--color-white)', fontWeight: '800', marginBottom: '6px', lineHeight: '1.25' }}>
                        {slide.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#E8F3EE', lineHeight: '1.4', marginBottom: '12px' }}>
                        {slide.desc}
                      </p>
                      <Link 
                        to={`/menu?category=${slide.categoryFilter}`} 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          color: 'var(--color-orange)',
                          textDecoration: 'none'
                        }}
                      >
                        Explore {slide.category} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Navigation Arrows */}
              <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                aria-label="Previous Slide"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '12px',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.45)'}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                aria-label="Next Slide"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.45)'}
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicator Dots */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '24px',
                display: 'flex',
                gap: '6px',
                zIndex: 6
              }}>
                {FOOD_VARIETY_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); setCurrentSlide(i); }}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      width: i === currentSlide ? '22px' : '7px',
                      height: '7px',
                      borderRadius: '9999px',
                      backgroundColor: i === currentSlide ? 'var(--color-orange)' : 'rgba(255, 255, 255, 0.45)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Floating Live Token Card */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-dark)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-fresh-light)',
                color: 'var(--color-fresh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800'
              }}>
                CB
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Active Token Queue
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-forest)' }}>
                  Token #CB-104 • READY
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <h2 style={{ fontSize: '2.1rem', marginBottom: '12px', color: 'var(--color-forest)' }}>
            How CampusBite Works
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1rem' }}>
            A streamlined 4-step workflow engineered to eliminate canteen crowds during rush hours.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              step: '01',
              title: 'Explore Menu',
              desc: 'Select from 6 campus-favorite categories including Breakfast, Lunch Thalis, Chaat, and Beverages.',
              icon: UtensilsCrossed
            },
            {
              step: '02',
              title: 'Place Order & Pay',
              desc: 'Choose from simulated UPI, demo Cards, or select Cash to pay at the counter upon collection.',
              icon: Smartphone
            },
            {
              step: '03',
              title: 'Track Live Token',
              desc: 'Watch preparation in real-time as the canteen staff moves your order from Confirmed to Ready.',
              icon: Clock
            },
            {
              step: '04',
              title: 'Pickup & Receipt',
              desc: 'Show your token at the counter, collect hot food immediately, and download your official PDF receipt.',
              icon: FileText
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step} 
                className="card"
                style={{
                  padding: '28px 24px',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: 'rgba(23, 76, 60, 0.12)',
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-cream)',
                  color: 'var(--color-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px'
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-dark)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Menu Items Preview */}
      <section className="container">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CAMPUS FAVORITES
            </span>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-forest)', marginTop: '4px' }}>
              Popular Canteen Picks
            </h2>
          </div>
          <Link to="/menu" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>View All 28 Menu Items</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid-cols-4">
          {popularItems.map((item) => (
            <FoodCard key={item.itemId} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
