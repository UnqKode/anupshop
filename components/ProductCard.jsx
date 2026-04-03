import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTranslation } from '../lib/translations';

export function ProductSkeleton() {
    return (
        <div className="product-card skeleton-card" style={{ border: 'none', background: '#fff' }}>
            <div className="skeleton-shimmer" style={{ 
                height: '320px', borderRadius: '16px', marginBottom: '15px', 
                background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear'
            }}></div>
            <div style={{ padding: '0 5px' }}>
                <div className="skeleton-shimmer" style={{ height: '18px', width: '85%', marginBottom: '10px', borderRadius: '4px', background: '#f0f0f0' }}></div>
                <div className="skeleton-shimmer" style={{ height: '16px', width: '45%', borderRadius: '4px', background: '#f0f0f0' }}></div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}} />
        </div>
    );
}

export default function ProductCard({ p }) {
  const [lang, setLang] = useState(typeof window !== 'undefined' ? localStorage.getItem('aapnexa_lang') || 'en' : 'en');
  
  const [wishlisted, setWishlisted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const wl = JSON.parse(localStorage.getItem('aapnexa_wishlist') || '[]');
    return wl.includes(p.id);
  });
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const handleLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    window.addEventListener('lang_changed', handleLang);
    return () => window.removeEventListener('lang_changed', handleLang);
  }, []);

  const formatPrice = (num) => {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return `₹0`;
    return `₹${parsed.toLocaleString('en-IN')}`;
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stock === 0) return;

    const cart = JSON.parse(localStorage.getItem('aapnexa_cart')) || [];
    const sizes = p.sizes || ['S', 'M', 'L', 'XL'];
    const defaultSize = sizes.includes('M') ? 'M' : sizes[0];
    const existing = cart.find(item => item.id === p.id && item.size === defaultSize);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ ...p, size: defaultSize, quantity: 1 }); }

    localStorage.setItem('aapnexa_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart_updated'));
    window.dispatchEvent(new Event('open_cart'));

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1400);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wl = JSON.parse(localStorage.getItem('aapnexa_wishlist') || '[]');
    const idx = wl.indexOf(p.id);
    if (idx === -1) { wl.push(p.id); setWishlisted(true); }
    else { wl.splice(idx, 1); setWishlisted(false); }
    localStorage.setItem('aapnexa_wishlist', JSON.stringify(wl));
  };

  const imageSrc = p.image || p.imageUrl || p.img || 'https://placehold.co/600x600?text=No+Image';

  // Badge priority
  const isOutOfStock = p.stock === 0;
  const hasDiscount = p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price);
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  let badge = null;
  if (isOutOfStock) {
    badge = { text: getTranslation(lang, 'soldOut'), bg: '#6b7280', color: '#fff' };
  } else if (hasDiscount) {
    badge = { text: `${discountPct}% ${getTranslation(lang, 'off')}`, bg: '#dc2626', color: '#fff' };
  } else if (p.stock > 0 && p.stock < 10) {
    badge = { text: getTranslation(lang, 'onlyLeft', { n: p.stock }), bg: '#f59e0b', color: '#fff' };
  } else if (p.featured) {
    badge = { text: getTranslation(lang, 'featuredBadge'), bg: '#6366f1', color: '#fff' };
  } else {
    const hash = p.id ? p.id.charCodeAt(0) + p.id.length : 0;
    if (hash % 11 === 0) badge = { text: getTranslation(lang, 'sellingFast'), bg: '#ef4444', color: '#fff' };
  }

  return (
    <Link href={`/product/${p.id}`} className="product-card" style={{ position: 'relative', display: 'block', textDecoration: 'none' }}>
      <div className="product-image-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={imageSrc} alt={p.name || 'Product'} />

        {/* Live Viewing Badge */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 10,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
          padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9'
        }}>
          <span style={{ height: '6px', width: '6px', borderRadius: '50%', background: '#ff4b2b', display: 'inline-block' }}></span>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#111', fontFamily: 'var(--font-main)', letterSpacing: '0.2px' }}>
            {Math.floor(Math.random() * 15) + 5} {getTranslation(lang, 'viewing')}
          </span>
        </div>

        {/* Badge */}
        {badge && (
          <span className={badge.bg === '#ef4444' || badge.bg === '#f59e0b' ? 'urgency-badge' : ''} style={{
            position: 'absolute', top: 12, left: 12, zIndex: 5,
            background: badge.bg === '#dc2626' ? 'rgba(0,0,0,0.85)' : badge.bg, 
            color: '#fff',
            padding: '5px 12px', fontSize: '10px', fontWeight: '800',
            textTransform: 'uppercase', letterSpacing: '2.5px', borderRadius: '0px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1.5px solid rgba(255,255,255,0.1)'
          }}>{badge.text}</span>
        )}

        {/* Wishlist Heart */}
        <button onClick={handleWishlist} style={{
          position: 'absolute', top: 10, right: 10, zIndex: 6,
          background: wishlisted ? '#fff' : 'rgba(255,255,255,0.85)',
          border: 'none', borderRadius: '50%',
          width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'transform 0.2s, background 0.2s',
          color: wishlisted ? '#e11d48' : '#9ca3af',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >{wishlisted ? '♥' : '♡'}</button>

        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ background: '#fff', color: '#111', fontWeight: 800, fontSize: 13, padding: '8px 18px', letterSpacing: 1 }}>{getTranslation(lang, 'soldOut')}</span>
          </div>
        )}

        {/* Quick Add */}
        {!isOutOfStock && (
          <button className="quick-add-btn" onClick={handleQuickAdd} style={{
            background: addedToCart ? '#16a34a' : 'rgba(0,0,0,0.82)',
            transition: 'background 0.3s, bottom 0.3s',
          }}>
            {addedToCart ? `✓ ${getTranslation(lang, 'added')}` : getTranslation(lang, 'quickAdd')}
          </button>
        )}
      </div>

      <div className="product-info" style={{ padding: '16px 8px 8px', textAlign: 'center' }}>
        <h3 className="product-name" style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '18px', 
          fontWeight: '500',
          letterSpacing: '0px',
          textTransform: 'capitalize',
          color: '#111',
          marginBottom: '4px'
        }}>{p.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 }}>
          <span style={{ fontWeight: '800', color: 'var(--color-gold-muted)', fontSize: '15px', fontFamily: 'var(--font-main)' }}>{formatPrice(p.price)}</span>
          {hasDiscount && (
            <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'var(--font-main)' }}>{formatPrice(p.originalPrice)}</span>
          )}
        </div>
        
        {/* ⭐ High-Fidelity Star Rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, background: '#f8fafc', padding: '4px 10px', borderRadius: 99, width: 'fit-content', margin: '10px auto 0', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(star => (
                <span key={star} style={{ color: star <= 4 ? '#f59e0b' : '#cbd5e1', fontSize: 10 }}>★</span>
              ))}
           </div>
           <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>4.8</span>
        </div>
        {/* Sizes preview */}
        {p.sizes && p.sizes.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', opacity: 0.6 }}>
            {p.sizes.slice(0, 4).map(sz => (
              <span key={sz} style={{ fontSize: '9px', fontWeight: '900', color: '#111', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{sz}</span>
            ))}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-soft { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } 100% { transform: scale(1); opacity: 1; } }
        .urgency-badge { animation: pulse-soft 2s infinite ease-in-out; }
      `}} />
    </Link>
  );
}
