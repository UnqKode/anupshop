"use client";
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard, { ProductSkeleton } from '../../components/ProductCard';
import { getTranslation } from '../../lib/translations';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initFilter = searchParams.get('category') || searchParams.get('filter') || 'all';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState(initFilter);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(5000); // Max price limit
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    return () => window.removeEventListener('lang_changed', updateLang);
  }, []);

  useEffect(() => {
    setCurrentFilter(initFilter);
  }, [initFilter]);

  useEffect(() => {
    setLoading(true); // Ensure loading resets on mount

    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            console.log("🔥 [DEBUG] Firebase Sync Array:", data); // Requested Console Output
            setProducts(data);
        } catch (e) {
            console.error("Firebase Internal Error:", e);
        } finally {
            setLoading(false); // Strictly resolve loader regardless of error blocks
        }
    }, (err) => {
        console.error("Firebase Snapshot Error:", err);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Guarantee strict casing normalization preventing TypeErrors when processing Admin entries natively
  const safeFilter = currentFilter ? currentFilter.toLowerCase() : 'all';
  const searchQuery = searchParams.get('q') || '';

  let filtered = safeFilter === 'all' 
    ? products 
    : products.filter(p => (p.category || 'uncategorized').toLowerCase() === safeFilter);

  // Apply real-time dynamic text-based Search filtering gracefully intersecting category filters natively
  if (searchQuery.trim() !== '') {
      filtered = filtered.filter(p => p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }

  // Price Filter
  filtered = filtered.filter(p => parseFloat(p.price) <= priceRange);

  // Sorting Logic
  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'price-high') return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'jeans', label: 'Jeans' },
    { id: 'tshirts', label: 'T-Shirts' },
    { id: 'roundneck', label: 'Round Neck' },
    { id: 'shirts', label: 'Shirts' },
    { id: 'pants', label: 'Pants' },
    { id: 'lowers', label: 'Lowers' },
    { id: 'blazers', label: 'Blazers' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'bermuda', label: 'Shorts' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'electronics', label: 'Electronics' },
  ];

  return (
    <div className="fade-in">
      <Navbar />
      
      {/* ── Breadcrumb ── */}
      <div style={{ padding:'16px 40px', fontSize:12, background:'#f9fafb', color:'#94a3b8', fontFamily:'Inter,sans-serif', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', textTransform:'uppercase', fontWeight:600, letterSpacing:0.5 }}>
        <Link href="/" style={{ color:'#94a3b8', textDecoration:'none' }} onMouseEnter={e => e.target.style.color='#111'} onMouseLeave={e => e.target.style.color='#94a3b8'}>{getTranslation(lang, 'home')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize:8, opacity:0.5 }}></i>
        <Link href="/products" style={{ color:'#111', textDecoration:'none' }}>{getTranslation(lang, 'shop')}</Link>
        {safeFilter !== 'all' && (
          <>
            <i className="fa-solid fa-chevron-right" style={{ fontSize:8, opacity:0.5 }}></i>
            <span style={{ color:'#111', fontWeight:800 }}>{getTranslation(lang, 'categories')[safeFilter] || safeFilter.toUpperCase()}</span>
          </>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="mobile-filter-bar" style={{ display: 'none', padding: '15px 20px', background: '#fff', borderBottom: '1px solid #eee', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setShowMobileFilters(true)} style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i> {getTranslation(lang, 'filters')}
        </button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: '1px solid #ddd', padding: '8px', borderRadius: '4px', outline: 'none' }}>
           <option value="newest">{getTranslation(lang, 'newestFirst')}</option>
           <option value="price-low">{getTranslation(lang, 'priceLowHigh')}</option>
           <option value="price-high">{getTranslation(lang, 'priceHighLow')}</option>
        </select>
      </div>

      <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '40px' }}>
        
        {/* ── SIDEBAR FILTERS ── */}
        <aside className={`sidebar-filters ${showMobileFilters ? 'open' : ''}`} style={{ width: '280px', flexShrink: 0 }}>
          <div className="sidebar-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '2px solid #111', paddingBottom: '5px' }}>{getTranslation(lang, 'filters')}</h3>
              {showMobileFilters && (
                <button onClick={() => setShowMobileFilters(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              )}
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getTranslation(lang, 'filters')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                    <input 
                      type="radio" 
                      name="category" 
                      checked={safeFilter === cat.id}
                      onChange={() => setCurrentFilter(cat.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '15px', color: safeFilter === cat.id ? '#111' : '#666', fontWeight: safeFilter === cat.id ? '600' : '400' }}>{getTranslation(lang, 'categories')[cat.id] || cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range</h4>
              <input 
                type="range" 
                min="0" 
                max="5000" 
                step="100"
                value={priceRange} 
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#111' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '14px', fontWeight: '600' }}>
                <span>₹0</span>
                <span style={{ color: '#1a365d', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>Under ₹{priceRange}</span>
              </div>
            </div>

            {/* Sort (Desktop) */}
            <div className="desktop-only" style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getTranslation(lang, 'sortBy')}</h4>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: '#fff', fontSize: '14px' }}
              >
                <option value="newest">{getTranslation(lang, 'newestFirst')}</option>
                <option value="price-low">{getTranslation(lang, 'priceLowHigh')}</option>
                <option value="price-high">{getTranslation(lang, 'priceHighLow')}</option>
              </select>
            </div>
            
            <button 
              onClick={() => { setPriceRange(5000); setCurrentFilter('all'); setSortBy('newest'); }}
              style={{ width: '100%', padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#eee'}
              onMouseOut={(e) => e.target.style.background = '#f5f5f5'}
            >
              {getTranslation(lang, 'resetAll')}
            </button>
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          {/* Active Filters Summary */}
          <div style={{ marginBottom: '32px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <h2 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '42px', 
              fontWeight: '700', 
              margin: '0 0 8px 0', 
              textTransform: 'none', 
              letterSpacing: '-1px' 
            }}>
              {safeFilter === 'all' ? getTranslation(lang, 'home') : getTranslation(lang, 'categories')[safeFilter] || safeFilter.toUpperCase()}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '30px', height: '1.5px', background: 'var(--color-gold)' }}></div>
              <p style={{ color: '#666', margin: 0, fontSize: '14px', fontFamily: 'var(--font-main)', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {getTranslation(lang, 'piecesFound', { count: sortedProducts.length })}
              </p>
            </div>
          </div>

          <div className="product-grid" style={{ minHeight: '300px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' }}>
            {loading ? (
                Array.from({length: 8}).map((_, i) => <ProductSkeleton key={`skeleton-grid-${i}`} />)
            ) : sortedProducts.length === 0 ? (
                <div style={{ padding: '60px 40px', textAlign: 'center', width: '100%', gridColumn: '1 / -1', background: '#f9fafb', borderRadius: '16px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                    <h3 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '700' }}>{getTranslation(lang, 'noResults')}</h3>
                    <p style={{ color: 'gray', maxWidth: '400px', margin: '0 auto' }}>
                        {getTranslation(lang, 'adjustFiltersDesc')}
                    </p>
                    <button onClick={() => { setPriceRange(5000); setCurrentFilter('all'); }} style={{ marginTop: '20px', padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{getTranslation(lang, 'resetAll')}</button>
                </div>
            ) : (
                sortedProducts.map(p => <ProductCard key={p.id} p={p} />)
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .sidebar-filters {
            position: fixed; top: 0; left: -100%; width: 100% !important; height: 100%;
            background: #fff; z-index: 2000; transition: left 0.3s ease;
            overflow-y: auto; padding: 30px;
          }
          .sidebar-filters.open { left: 0; }
          .mobile-filter-bar { display: flex !important; }
          .desktop-only { display: none; }
        }
      `}} />
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p>Loading App...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
