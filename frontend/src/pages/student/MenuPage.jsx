import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import FoodCard from '../../components/menu/FoodCard';
import { useCart } from '../../context/CartContext';
import { 
  Search, 
  ShoppingBag, 
  ArrowRight, 
  UtensilsCrossed, 
  Sparkles,
  SlidersHorizontal,
  X,
  RefreshCw,
  Coffee,
  Flame,
  Utensils,
  CupSoda,
  Cake,
  Pizza
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'BREAKFAST',
  'CHAAT',
  'LUNCH',
  'BEVERAGES',
  'DESSERTS',
  'FAST FOOD'
];

const CATEGORY_META = {
  ALL: { label: 'All Items', icon: '🍽️', desc: 'Browse the complete canteen menu' },
  BREAKFAST: { label: 'Breakfast', icon: '☕', desc: 'Fresh South Indian & homestyle morning starters' },
  CHAAT: { label: 'Chaat Corner', icon: '🌶️', desc: 'Crispy, tangy, and sweet Mumbai street chaats' },
  LUNCH: { label: 'Lunch Meals', icon: '🍛', desc: 'Hearty wholesome thalis, pulao, dal chawal & rotis' },
  BEVERAGES: { label: 'Beverages', icon: '🥤', desc: 'Hot masala chai, filter coffee, coolers & lassi' },
  DESSERTS: { label: 'Desserts', icon: '🍰', desc: 'Warm fudgy brownies, ice creams & truffle pastries' },
  'FAST FOOD': { label: 'Fast Food', icon: '🥪', desc: 'Grilled sandwiches, burgers, frankies & pizzas' }
};

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price_asc', 'price_desc', 'prep_time'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { itemCount, subtotal } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  // Normalize initial category from URL parameters
  useEffect(() => {
    const rawCat = searchParams.get('category');
    if (rawCat) {
      const up = rawCat.toUpperCase().trim();
      if (up === 'CHAT' || up === 'CHAAT') setSelectedCategory('CHAAT');
      else if (up === 'BEVERAGE' || up === 'BEVERAGES') setSelectedCategory('BEVERAGES');
      else if (up === 'DESSERT' || up === 'DESSERTS') setSelectedCategory('DESSERTS');
      else if (up === 'FASTFOOD' || up === 'FAST FOOD') setSelectedCategory('FAST FOOD');
      else if (up === 'BREAKFAST') setSelectedCategory('BREAKFAST');
      else if (up === 'LUNCH') setSelectedCategory('LUNCH');
      else setSelectedCategory('ALL');
    }
  }, [searchParams]);

  // Load all items once on initial load to calculate category badges and fallback
  useEffect(() => {
    api.menu.getAll({})
      .then(res => {
        if (res && res.success && Array.isArray(res.items)) {
          setAllItems(res.items);
          if (selectedCategory === 'ALL' && !searchQuery) {
            setItems(res.items);
          }
        }
      })
      .catch(err => {
        console.error('Failed to pre-fetch all menu items:', err);
      });
  }, []);

  // Fetch filtered items whenever selectedCategory or searchQuery changes
  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, searchQuery]);

  const fetchMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.menu.getAll(params);
      if (res && res.success && Array.isArray(res.items)) {
        setItems(res.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load menu items:', err);
      setError('Failed to load menu items. Please check if the server is running.');
      // Local fallback to allItems if available
      if (allItems.length > 0) {
        let fallback = [...allItems];
        if (selectedCategory !== 'ALL') {
          fallback = fallback.filter(it => {
            const c = (it.category || '').toUpperCase().trim();
            if (selectedCategory === 'CHAAT') return c === 'CHAAT' || c === 'CHAT';
            if (selectedCategory === 'BEVERAGES') return c === 'BEVERAGES' || c === 'BEVERAGE';
            if (selectedCategory === 'DESSERTS') return c === 'DESSERTS' || c === 'DESSERT';
            return c === selectedCategory;
          });
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          fallback = fallback.filter(it => 
            it.name.toLowerCase().includes(q) || 
            (it.description && it.description.toLowerCase().includes(q))
          );
        }
        setItems(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate count for each category pill
  const getCategoryCount = (cat) => {
    const list = allItems.length > 0 ? allItems : items;
    if (cat === 'ALL') return list.length;
    return list.filter(it => {
      const c = (it.category || '').toUpperCase().trim();
      if (cat === 'CHAAT') return c === 'CHAAT' || c === 'CHAT';
      if (cat === 'BEVERAGES') return c === 'BEVERAGES' || c === 'BEVERAGE';
      if (cat === 'DESSERTS') return c === 'DESSERTS' || c === 'DESSERT';
      if (cat === 'FAST FOOD') return c === 'FAST FOOD' || c === 'FASTFOOD';
      return c === cat;
    }).length;
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    // Update query param cleanly
    if (cat === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat.toLowerCase() });
    }
  };

  // Sort items based on active selector
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'prep_time') return (a.prepTimeMinutes || 10) - (b.prepTimeMinutes || 10);
    return a.name.localeCompare(b.name);
  });

  const activeMeta = CATEGORY_META[selectedCategory] || CATEGORY_META.ALL;

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      {/* Header Banner */}
      <div style={{
        marginBottom: '28px',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, #174C3C 0%, #10382C 100%)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-white)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decorative Element */}
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-25px',
          fontSize: '9rem',
          opacity: 0.08,
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          {activeMeta.icon}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-orange)', marginBottom: '8px' }}>
          <Sparkles size={18} />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
            DAILY FRESH PRE-ORDER MENU
          </span>
        </div>

        <h1 style={{ fontSize: '2.3rem', color: 'var(--color-white)', marginBottom: '8px', fontWeight: '800' }}>
          Campus Canteen Menu {activeMeta.icon}
        </h1>

        <p style={{ color: '#D1DBD4', fontSize: '0.96rem', maxWidth: '720px', lineHeight: 1.5 }}>
          Freshly prepared in our college kitchen. Choose your favorites from Breakfast, Chaat, Lunch, Beverages, Desserts, and Fast Food. Order now for zero-wait token pickup!
        </p>

        {/* Quick Stats Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: '#A3B8AD' }}>Total Delicacies: </span>
            <strong style={{ color: 'var(--color-orange)', fontWeight: '700' }}>{allItems.length || items.length} Items</strong>
          </div>
          <div>
            <span style={{ color: '#A3B8AD' }}>Kitchen Status: </span>
            <strong style={{ color: '#10B981', fontWeight: '700' }}>● Live & Accepting Orders</strong>
          </div>
          <div>
            <span style={{ color: '#A3B8AD' }}>Pickup Counter: </span>
            <strong style={{ color: 'var(--color-white)', fontWeight: '700' }}>Express Token Queue</strong>
          </div>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        backgroundColor: 'var(--color-white)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search Input with Clear Button */}
        <div style={{
          position: 'relative',
          flex: '1 1 320px',
          maxWidth: '440px'
        }}>
          <Search 
            size={18} 
            color="var(--color-muted)" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input 
            type="text" 
            className="form-input"
            style={{ paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '14px', backgroundColor: 'var(--color-bg)' }}
            placeholder="Search by name: Idli, Thali, Pani Puri, Cold Coffee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SlidersHorizontal size={16} color="var(--color-forest)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-dark)' }}>Sort by:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem', backgroundColor: 'var(--color-bg)' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Alphabetical (A - Z)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="prep_time">Fastest Prep Time</option>
          </select>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '14px',
        marginBottom: '28px',
        scrollbarWidth: 'thin'
      }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const meta = CATEGORY_META[cat] || { label: cat, icon: '🍽️' };
          const count = getCategoryCount(cat);

          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: isSelected ? '700' : '600',
                fontSize: '0.88rem',
                backgroundColor: isSelected ? 'var(--color-forest)' : 'var(--color-white)',
                color: isSelected ? 'var(--color-white)' : 'var(--color-dark)',
                border: `1.5px solid ${isSelected ? 'var(--color-forest)' : 'var(--color-border)'}`,
                boxShadow: isSelected ? '0 4px 12px rgba(23, 76, 60, 0.2)' : 'none',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 160ms ease'
              }}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSelected ? 'var(--color-orange)' : 'var(--color-border-subtle)',
                color: isSelected ? '#10382C' : 'var(--color-muted)',
                fontWeight: '800'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Notice if any */}
      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9rem'
        }}>
          <span>{error}</span>
          <button 
            onClick={fetchMenu}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Category Section Header when specific category selected */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '18px',
        paddingBottom: '10px',
        borderBottom: '2px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-forest)', margin: 0, fontWeight: '700' }}>
            {activeMeta.label}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            ({sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'} available)
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)', display: 'none', md: 'block' }}>
          {activeMeta.desc}
        </p>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '3.5px solid var(--color-forest)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Loading delicious campus items from DynamoDB...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <UtensilsCrossed size={48} color="var(--color-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-dark)', marginBottom: '8px' }}>No Food Items Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {searchQuery 
              ? `No items matched "${searchQuery}" in ${activeMeta.label}. Try searching for something else or clearing filters.`
              : `No items available under ${activeMeta.label}. Check other categories!`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary btn-sm"
              >
                Clear Search Query
              </button>
            )}
            <button 
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setSearchParams({}); }}
              className="btn btn-primary btn-sm"
            >
              Show All Menu Items
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-cols-4">
          {sortedItems.map((item) => (
            <FoodCard key={item.itemId} item={item} />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar if items in cart */}
      {itemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-forest)',
          color: 'var(--color-white)',
          padding: '14px 26px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 90,
          border: '2px solid var(--color-orange)',
          animation: 'slideUp 250ms ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-orange)',
              color: '#10382C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '0.9rem'
            }}>
              {itemCount}
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#D1DBD4', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Pre-Order Cart
              </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--color-white)' }}>
                ₹{subtotal}
              </strong>
            </div>
          </div>

          <Link to="/cart" className="btn btn-accent btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
            <span>Review & Checkout</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
