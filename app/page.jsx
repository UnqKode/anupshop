"use client";
import React, { useEffect, useState, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroSlider from '../components/HeroSlider';
import ProductCard, { ProductSkeleton } from '../components/ProductCard';
import Link from 'next/link';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getTranslation } from '../lib/translations';

// ── Editorial slides — one per category ──
const EDITORIAL_SLIDES = [
  {
    tag: 'New Season Drop',
    title: 'PREMIUM\nDENIM JEANS',
    sub: 'Slim fit, stretch comfort — crafted for the modern Indian man.',
    cta: 'Shop Jeans',
    href: '/products?category=jeans',
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1400&auto=format&fit=crop',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
  },
  {
    tag: 'Everyday Essentials',
    title: 'CLASSIC\nT-SHIRTS',
    sub: 'Pure cotton tees — cool, breathable, and always in style.',
    cta: 'Explore Tees',
    href: '/products?category=tshirts',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    accent: '#10b981',
    bg: 'linear-gradient(135deg,#111 0%,#1a2e1a 100%)',
  },
  {
    tag: 'Effortless Style',
    title: 'ROUND NECK\nLOOKBOOK',
    sub: 'Your go-to comfort wear for weekends and beyond.',
    cta: 'Shop Now',
    href: '/products?category=roundneck',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1400&auto=format&fit=crop',
    accent: '#a78bfa',
    bg: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',
  },
  {
    tag: 'Office to Evening',
    title: 'SIGNATURE\nSHIRTS',
    sub: 'Sharp, structured, statement-making. From boardroom to bar.',
    cta: 'Browse Shirts',
    href: '/products?category=shirts',
    img: 'https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?auto=compress&cs=tinysrgb&w=1400',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg,#0c1a2e 0%,#0e4976 100%)',
  },
  {
    tag: 'All-Day Comfort',
    title: 'RELAXED\nPANTS',
    sub: 'Tailored drape, all-day ease — the perfect everyday trouser.',
    cta: 'Shop Pants',
    href: '/products?category=pants',
    img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1400&auto=format&fit=crop',
    accent: '#fb923c',
    bg: 'linear-gradient(135deg,#1c1309 0%,#3d2c10 100%)',
  },
  {
    tag: 'Chill Zone',
    title: 'JOGGERS &\nLOWERS',
    sub: 'Ultra-soft fabric, elastic waistband — perfect for home and gym.',
    cta: 'Shop Lowers',
    href: '/products?category=lowers',
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=1400&auto=format&fit=crop',
    accent: '#34d399',
    bg: 'linear-gradient(135deg,#052e16 0%,#14532d 100%)',
  },
  {
    tag: 'Business Class',
    title: 'PREMIUM\nBLAZERS',
    sub: 'Command the room. Structured blazers for every occasion.',
    cta: 'Shop Blazers',
    href: '/products?category=blazers',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1400&auto=format&fit=crop',
    accent: '#e879f9',
    bg: 'linear-gradient(135deg,#1a0533 0%,#3b0764 100%)',
  },
  {
    tag: 'Winter Ready',
    title: 'HOODIES &\nSWEATSHIRTS',
    sub: 'Cozy meets cool. Thick fleece hoodie collection now live.',
    cta: 'Shop Hoodies',
    href: '/products?category=hoodies',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1400&auto=format&fit=crop',
    accent: '#f87171',
    bg: 'linear-gradient(135deg,#1c0a0a 0%,#450a0a 100%)',
  },
  {
    tag: 'Summer Collection',
    title: 'SHORTS &\nBERMUDAS',
    sub: 'Light, breezy, and ready for the heat. Made for Indian summers.',
    cta: 'Shop Shorts',
    href: '/products?category=bermuda',
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1400&auto=format&fit=crop',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg,#1c1700 0%,#453a00 100%)',
  },
  {
    tag: 'Stay Warm',
    title: 'JACKETS &\nSHACKETS',
    sub: 'From denim shackets to puffer jackets — layer up in style.',
    cta: 'Shop Jackets',
    href: '/products?category=jackets',
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop',
    accent: '#60a5fa',
    bg: 'linear-gradient(135deg,#0a1628 0%,#1e3a5f 100%)',
  },
  {
    tag: 'Future Tech',
    title: 'MODERN\nELECTRONICS',
    sub: 'Precision engineered gadgets — elevating your digital lifestyle.',
    cta: 'Explore Tech',
    href: '/products?category=electronics',
    img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1400&auto=format&fit=crop',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const [editorialIdx, setEditorialIdx] = useState(0);
  const [editorialFading, setEditorialFading] = useState(false);
  const [lang, setLang] = useState(typeof window !== 'undefined' ? localStorage.getItem('aapnexa_lang') || 'en' : 'en');

  useEffect(() => {
    const handleLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    window.addEventListener('lang_changed', handleLang);
    return () => window.removeEventListener('lang_changed', handleLang);
  }, []);

  // Firestore products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setFeatured(data.slice(0, 500));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Robust Scroll-to-Top on mount & refresh
  useEffect(() => {
    // Immediate scroll
    window.scrollTo(0, 0);
    // Secondary scroll after content loads to prevent jumps
    const timer = setTimeout(() => window.scrollTo(0, 0), 100);
    return () => clearTimeout(timer);
  }, [loading]);

  // Product card auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 270, behavior: 'smooth' });
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Editorial banner auto-slide every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEditorialFading(true);
      setTimeout(() => {
        setEditorialIdx(prev => (prev + 1) % EDITORIAL_SLIDES.length);
        setEditorialFading(false);
      }, 420);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (i) => {
    if (i === editorialIdx) return;
    setEditorialFading(true);
    setTimeout(() => { setEditorialIdx(i); setEditorialFading(false); }, 420);
  };

  const slide = EDITORIAL_SLIDES[editorialIdx];

  const [backToTop, setBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);
  const [portalEl, setPortalEl] = useState(null);
  const newsletterRef = useRef(null);
  const COUPON_CODE = 'AAPNEXA10';

  // Portal element for modal (renders outside fade-in stacking context)
  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubLoading(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        subscribedAt: serverTimestamp(),
        coupon: COUPON_CODE,
      });
    } catch (err) {
      console.error('Subscriber save error:', err);
    } finally {
      localStorage.setItem('aapnexa_coupon', COUPON_CODE);
      setSubLoading(false);
      setSubscribed(true);
      // Scroll to newsletter section so coupon is fully visible
      setTimeout(() => {
        newsletterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2200);
  };

  const handleShopNow = () => {
    window.location.href = '/products';
  };

  // Scroll reveal using IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [featured]);

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => setBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fade-in">
      <style dangerouslySetInnerHTML={{ __html: `
        .reveal { opacity:0; transform:translateY(30px); transition:opacity 0.65s ease,transform 0.65s ease; }
        .reveal.visible { opacity:1; transform:none; }
        .reveal-delay-1 { transition-delay:0.1s; }
        .reveal-delay-2 { transition-delay:0.2s; }
        .reveal-delay-3 { transition-delay:0.3s; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        .back-to-top:hover { background:#111!important; }
        .newsletter-input:focus { outline:none; border-color:#f59e0b!important; }
        .newsletter-btn:hover { background:#e8920a!important; }
        /* Coupon modal animations */
        @keyframes modalPop { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(320px) rotate(720deg);opacity:0} }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 12px rgba(245,158,11,0)} }
        @keyframes couponReveal { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        
        /* Premium Marquee & Review Cards */
        @keyframes scrollMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-container { overflow:hidden; white-space:nowrap; border-top:1.5px solid #111; border-bottom:1.5px solid #111; padding:20px 0; background:#fff; display:flex; margin-bottom: 60px; }
        .marquee-content { display:inline-flex; animation:scrollMarquee 25s linear infinite; align-items:center; }
        .marquee-text { font-size:clamp(2rem, 4vw, 3rem); font-weight:900; text-transform:uppercase; letter-spacing:-1px; padding:0 30px; color:#111; font-family:'Inter',sans-serif; }
        .marquee-star { color:#f59e0b; font-size:clamp(1.5rem, 3vw, 2.5rem); }
        
        .hide-scroll::-webkit-scrollbar { display:none; }
        .hide-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        
        .ugc-card { position:relative; border-radius:16px; overflow:hidden; flex:0 0 auto; width:85vw; max-width:400px; height:500px; scroll-snap-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.08); transition:transform 0.5s cubic-bezier(0.2,0.8,0.2,1); }
        .ugc-card:hover { transform:scale(0.98); }
        @media(min-width:768px) { .ugc-card { width:400px; } }
        
        .coupon-code-box { animation: pulseGlow 2s ease infinite; }
        .coupon-copy-btn:hover { transform:scale(1.04)!important; }
        .modal-shop-btn:hover { background:#e8920a!important; }
      `}} />
      <Navbar />
      <HeroSlider />

      {/* ── High-Status Trust Banner ── */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0, borderTop: '1px solid #111', borderBottom: '1px solid #111', background: '#111', color: '#fff'
      }} className="why-us-grid">
        {[
          { icon: 'fa-truck-fast', key: 'delivery' },
          { icon: 'fa-rotate-left', key: 'returns' },
          { icon: 'fa-shield-halved', key: 'secure' },
          { icon: 'fa-certificate', key: 'quality' },
        ].map((item, i) => {
          const trans = getTranslation(lang, 'whyUs')[item.key];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '28px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <i className={`fa-solid ${item.icon}`} style={{ fontSize: 24, color: '#f59e0b' }}></i>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{trans.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: 0.5 }}>{trans.sub}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Shop by Category ── */}
      <section className="categories-section" style={{ padding: '80px 20px', background: 'var(--color-pearl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(32px, 5vw, 52px)', 
            fontWeight: '700', 
            color: '#111', 
            letterSpacing: '-1px',
            textTransform: 'none',
            marginBottom: '10px'
          }}>{getTranslation(lang, 'collectionTitle')}</h2>
          <div style={{ width: '40px', height: '2px', background: 'var(--color-gold)', margin: '0 auto' }}></div>
        </div>
        <div className="cat-grid">
          {[
            { id: 'jeans', label: 'JEANS', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop' },
            { id: 'tshirts', label: 'T-SHIRTS', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=800&auto=format&fit=crop' },
            { id: 'roundneck', label: 'ROUND NECK', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop' },
            { id: 'shirts', label: 'SHIRTS', img: 'https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { id: 'pants', label: 'PANTS', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop' },
            { id: 'lowers', label: 'LOWERS', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=800&auto=format&fit=crop' },
            { id: 'blazers', label: 'BLAZERS', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop' },
            { id: 'hoodies', label: 'HOODIES & SWEATSHIRTS', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
            { id: 'bermuda', label: 'BERMUDA', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop' },
            { id: 'jackets', label: 'JACKETS & SHACKETS', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop' },
            { id: 'electronics', label: 'ELECTRONICS', img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop' },
          ].map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.id}`} className="cat-card">
              <img src={cat.img} alt={getTranslation(lang, 'categories')[cat.id]} />
              <div className="cat-title-pill">{getTranslation(lang, 'categories')[cat.id]}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FULL-BLEED CATEGORY SLIDER ── */}
      <style>{`
        @keyframes edSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes edImgZoom {
          from { transform: scale(1.06); }
          to   { transform: scale(1); }
        }
        .ed-content-tag  { animation: edSlideUp 0.5s 0.05s ease both; }
        .ed-content-h2   { animation: edSlideUp 0.5s 0.18s ease both; }
        .ed-content-sub  { animation: edSlideUp 0.5s 0.30s ease both; }
        .ed-content-cta  { animation: edSlideUp 0.5s 0.42s ease both; }
        .ed-bg-img       { animation: edImgZoom 6s ease both; }
        .ed-arrow:hover  { background: rgba(255,255,255,0.28) !important; }
        .ed-dot-btn      { border: none; cursor: pointer; transition: all 0.22s ease; padding: 0; }
      `}</style>

      <section style={{
        position: 'relative',
        height: '70vh',
        minHeight: 420,
        maxHeight: 620,
        overflow: 'hidden',
        display: 'block',
      }}>
        {/* Full-bleed background image — one per slide, z-indexed behind */}
        {EDITORIAL_SLIDES.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              opacity: i === editorialIdx ? 1 : 0,
              transition: 'opacity 0.7s ease',
              zIndex: 0,
            }}
          >
            <img
              src={s.img}
              alt={s.title}
              className={i === editorialIdx ? 'ed-bg-img' : ''}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                display: 'block',
              }}
            />
          </div>
        ))}

        {/* Cinematic gradient overlay — left heavy, right transparent */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.08) 100%)',
        }} />

        {/* Accent colour tint on left edge */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: slide.accent, zIndex: 2,
          transition: 'background 0.5s',
        }} />

        {/* ── Text Content ── */}
        <div
          key={`ed-copy-${editorialIdx}`}
          style={{
            position: 'absolute', zIndex: 3,
            left: 0, top: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 60px',
            maxWidth: 640,
            opacity: editorialFading ? 0 : 1,
            transition: 'opacity 0.25s',
          }}
        >
          {/* Counter */}
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 4, color: 'rgba(255,255,255,0.45)',
            marginBottom: 18, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: slide.accent, fontWeight: 800, fontSize: 13 }}>
              {String(editorialIdx + 1).padStart(2, '0')}
            </span>
            <span style={{ letterSpacing: 2 }}>—</span>
            <span>{String(EDITORIAL_SLIDES.length).padStart(2, '0')}</span>
            <span style={{ marginLeft: 8, letterSpacing: 3 }}>{slide.tag.toUpperCase()}</span>
          </div>

          {/* Big headline */}
          <h2 className="ed-content-h2" style={{
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.0,
            color: '#fff',
            margin: '0 0 20px',
            textTransform: 'uppercase',
            letterSpacing: -2,
            whiteSpace: 'pre-line',
            textShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>{getTranslation(lang, 'categories')[slide.href.split('=')[1]] || slide.title}</h2>

          {/* Accent underline */}
          <div style={{
            width: 56, height: 3,
            background: slide.accent,
            marginBottom: 20,
            transition: 'background 0.5s',
          }} />

          {/* Sub */}
          <p className="ed-content-sub" style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.72)',
            marginBottom: 36,
            fontWeight: 400,
            lineHeight: 1.7,
            maxWidth: 440,
          }}>{slide.sub}</p>

          {/* CTA Button */}
          <div className="ed-content-cta" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href={slide.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px',
              background: slide.accent,
              color: '#000',
              fontWeight: 800, fontSize: 13,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textDecoration: 'none',
              border: 'none',
              transition: 'opacity 0.2s',
            }}>
              {slide.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link href="/products" style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.35)',
              paddingBottom: 2,
            }}>{getTranslation(lang, 'shopNow')} →</Link>
          </div>
        </div>

        {/* ── Bottom bar: dots + category name ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
          display: 'flex', alignItems: 'center',
          padding: '0 60px 28px',
          gap: 6,
        }}>
          {EDITORIAL_SLIDES.map((s, i) => (
            <button
              key={i}
              className="ed-dot-btn"
              onClick={() => goToSlide(i)}
              style={{
                height: 3,
                width: i === editorialIdx ? 40 : 16,
                borderRadius: 99,
                background: i === editorialIdx ? slide.accent : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* ── Arrow Buttons ── */}
        <button
          className="ed-arrow"
          onClick={() => goToSlide((editorialIdx - 1 + EDITORIAL_SLIDES.length) % EDITORIAL_SLIDES.length)}
          style={{
            position: 'absolute', right: 68, bottom: 18, zIndex: 4,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', width: 42, height: 42, borderRadius: '50%',
            fontSize: 19, cursor: 'pointer', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>‹</button>
        <button
          className="ed-arrow"
          onClick={() => goToSlide((editorialIdx + 1) % EDITORIAL_SLIDES.length)}
          style={{
            position: 'absolute', right: 18, bottom: 18, zIndex: 4,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', width: 42, height: 42, borderRadius: '50%',
            fontSize: 19, cursor: 'pointer', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>›</button>
      </section>

      {/* ── Latest Collection Slider ── */}
      {featured.length > 0 && (
        <section className="categories-section" style={{ paddingTop:'20px', paddingBottom:'80px', backgroundColor:'#fafafa', borderTop:'1px solid #eee', overflow:'hidden' }}>
          <div style={{ width:'100%', margin:'0 auto', textAlign:'center' }}>
            <h2 className="section-title" style={{ marginBottom:'40px', textTransform:'uppercase', color:'#1a365d' }}>
              {getTranslation(lang, 'latestTitle')}
            </h2>
            <div className="home-slider-container" ref={sliderRef}>
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <div className="slider-item" key={`skeleton-${i}`}><ProductSkeleton /></div>
                ))
              ) : (() => {
                let items = [...featured];
                while (items.length < 300) items = [...items, ...featured];
                return items.map((p, idx) => (
                  <div className="slider-item" key={`slide-clone-${p.id}-${idx}`}>
                    <ProductCard p={p} />
                  </div>
                ));
              })()}
            </div>
            <div style={{ textAlign:'center', marginTop:'50px' }}>
              <Link href="/products" className="btn" style={{ background:'black', color:'white', padding:'15px 40px', fontSize:'16px' }}>
                {getTranslation(lang, 'shopFull')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Premium Editorial Reviews ── */}
      <section style={{ backgroundColor:'#f9f9f9', padding:'80px 0', borderTop:'1px solid #eaeaea' }}>
        <div style={{ textAlign:'center', marginBottom:40, padding:'0 20px' }}>
          <div style={{ display:'inline-block', fontSize:12, fontWeight:800, letterSpacing:4, color:'#f59e0b', marginBottom:12, textTransform:'uppercase' }}>{getTranslation(lang, 'theVerdict')}</div>
          <h2 style={{ fontSize:'clamp(36px, 6vw, 64px)', fontWeight:900, color:'#111', margin:'0 0 16px', letterSpacing:'-2px', textTransform:'uppercase', lineHeight:1 }}>
            {getTranslation(lang, 'spottedInAapnexa')}
          </h2>
          <p style={{ color:'#666', fontSize:16, maxWidth:600, margin:'0 auto' }}>{getTranslation(lang, 'spottedSub')}</p>
        </div>

        {/* Scrolling Typography Marquee */}
        <div className="marquee-container">
          <div className="marquee-content">
            {getTranslation(lang, 'marquee').map((text, i) => (
              <Fragment key={i}>
                <span className="marquee-text">{text}</span><span className="marquee-star">✦</span>
              </Fragment>
            ))}
            {getTranslation(lang, 'marquee').map((text, i) => (
              <Fragment key={i + 10}>
                <span className="marquee-text">{text}</span><span className="marquee-star">✦</span>
              </Fragment>
            ))}
          </div>
        </div>

        {/* UGC (User Generated Content) Cards - Horizontal Scroll */}
        <div className="hide-scroll" style={{ display:'flex', gap:30, overflowX:'auto', padding:'0 5vw 60px 5vw', scrollSnapType:'x mandatory' }}>
          {[
            {
              bg: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
              name: 'Karan S.',
              handle: '@karan_styles',
              text: 'The fabric feels so premium. Definitely my new go-to for casual outings. Fits like a dream.',
              item: 'Slim Fit T-Shirt'
            },
            {
              bg: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80',
              name: 'Vikash M.',
              handle: '@vikash.fits',
              text: 'Quality is unmatched at this price point. Fast shipping and the COD option via WhatsApp is super convenient.',
              item: 'Classic Denim'
            },
            {
              bg: 'https://images.unsplash.com/photo-1550614000-4b95d4ed7dd6?w=600&q=80',
              name: 'Rahul T.',
              handle: '@rahul_threads',
              text: 'Ordered the combo and was blown away. The clothes don’t shrink or fade after washing. 10/10.',
              item: 'Everyday Essentials'
            },
            {
              bg: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=600&q=80',
              name: 'Arjun P.',
              handle: '@arjun.vibes',
              text: 'Aapnexa completely changed my wardrobe setup. Minimalist, clean, and perfectly tailored.',
              item: 'Oxford Shirt'
            }
          ].map((r, idx) => (
            <div key={idx} className="ugc-card">
              {/* Background Lifestyle Image */}
              <div style={{ position:'absolute', inset:0, background:`url(${r.bg}) center/cover no-repeat` }} />
              
              {/* Dark Overlay Gradient for text readability */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)' }} />

              {/* Glassmorphism Review Overlay */}
              <div style={{ position:'absolute', bottom:24, left:24, right:24, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.2)', padding:'24px', borderRadius:'16px', color:'#fff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800 }}>{r.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{r.handle}</div>
                  </div>
                  <div style={{ color:'#f59e0b', fontSize:14, letterSpacing:2 }}>★★★★★</div>
                </div>
                <p style={{ fontSize:14, lineHeight:1.6, margin:'0 0 16px', color:'rgba(255,255,255,0.95)', fontStyle:'italic' }}>
                  &quot;{r.text}&quot;
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
                  <i className="fa-solid fa-bag-shopping" style={{ color:'#fff' }}></i>
                  <span>Purchased: {r.item}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter Signup ── */}
      <section ref={newsletterRef} className="reveal" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', padding:'70px 40px', textAlign:'center', transition:'all 0.5s ease' }}>
        <div style={{ maxWidth:580, margin:'0 auto' }}>
          {!subscribed ? (
            /* ── Form View ── */
            <>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:99, padding:'6px 16px', marginBottom:20 }}>
                <span style={{ fontSize:14 }}>🎁</span>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'#f59e0b', textTransform:'uppercase' }}>Exclusive Members Deal</span>
              </div>
              <h2 style={{ fontSize:32, fontWeight:900, color:'#fff', margin:'0 0 14px', letterSpacing:-0.5, textTransform:'uppercase', lineHeight:1.1 }}>{getTranslation(lang, 'newsletter').title}</h2>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:15, marginBottom:36, lineHeight:1.7 }}>{getTranslation(lang, 'newsletter').sub}</p>
              <form onSubmit={handleSubscribe} style={{ display:'flex', gap:10, maxWidth:480, margin:'0 auto', flexWrap:'wrap' }}>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={getTranslation(lang, 'newsletter').placeholder}
                  className="newsletter-input"
                  style={{ flex:1, padding:'15px 20px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:15, fontFamily:'Inter,sans-serif', minWidth:220 }}
                />
                <button type="submit" disabled={subLoading} className="newsletter-btn" style={{ padding:'15px 28px', background:'#f59e0b', color:'#000', border:'none', borderRadius:12, fontWeight:800, fontSize:14, cursor:subLoading?'not-allowed':'pointer', letterSpacing:0.5, fontFamily:'Inter,sans-serif', transition:'background 0.2s', whiteSpace:'nowrap', opacity:subLoading?0.7:1 }}>
                  {subLoading ? getTranslation(lang, 'searching') : getTranslation(lang, 'newsletter').cta}
                </button>
              </form>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:18 }}>No spam · Unsubscribe anytime · Coupon shown instantly</p>
            </>
          ) : (
            /* ── Coupon Reveal (in-place) ── */
            <div style={{ animation:'couponReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
              {/* Confetti row */}
              <div style={{ fontSize:28, marginBottom:12, letterSpacing:8 }}>🎉 🎊 🎉</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:4, color:'#f59e0b', marginBottom:10, textTransform:'uppercase' }}>{getTranslation(lang, 'newsletter').successTitle}</div>
              <h2 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 6px', lineHeight:1.1, textTransform:'uppercase', letterSpacing:-0.5 }}>{getTranslation(lang, 'newsletter').successTitle}</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:28, lineHeight:1.6 }}>{getTranslation(lang, 'newsletter').successSub}</p>

              {/* Coupon Box */}
              <div style={{
                display:'inline-block', background:'rgba(245,158,11,0.08)',
                border:'2px solid #f59e0b', borderRadius:16, padding:'20px 36px',
                marginBottom:18, animation:'pulseGlow 2s ease infinite',
                minWidth:280,
              }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600, letterSpacing:2, marginBottom:6, textTransform:'uppercase' }}>Your Code</div>
                <div style={{ fontSize:38, fontWeight:900, color:'#f59e0b', letterSpacing:10, fontFamily:'monospace', marginBottom:14 }}>{COUPON_CODE}</div>
                <button
                  onClick={copyCoupon}
                  style={{
                    padding:'10px 28px', borderRadius:8,
                    background: couponCopied ? '#10b981' : '#f59e0b',
                    color: couponCopied ? '#fff' : '#000',
                    border:'none', fontWeight:800, fontSize:13,
                    cursor:'pointer', transition:'all 0.2s',
                    letterSpacing:0.5, fontFamily:'Inter,sans-serif',
                    display:'inline-flex', alignItems:'center', gap:6,
                  }}
                >
                  {couponCopied ? <>✓ {getTranslation(lang, 'newsletter').copied}</> : <>📋 {getTranslation(lang, 'newsletter').copyCode}</>}
                </button>
              </div>

              {/* Steps */}
              <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap', marginBottom:24 }}>
                {[['1','Add to Cart'],['2','Paste code in cart'],['3','Save 10%!']].map(([n,t]) => (
                  <div key={n} style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.5)', fontSize:13 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(245,158,11,0.15)', border:'1px solid #f59e0b', color:'#f59e0b', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{n}</div>
                    {t}
                  </div>
                ))}
              </div>

              <button onClick={handleShopNow} style={{ padding:'13px 36px', background:'#f59e0b', color:'#000', border:'none', borderRadius:12, fontWeight:800, fontSize:14, cursor:'pointer', letterSpacing:0.5, fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}>
                {getTranslation(lang, 'newsletter').shopNow} →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* old modal removed - coupon now shows inline in section above */}

      {/* ── About Aapnexa ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        padding: '80px 40px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {/* Logo / Brand mark */}
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 5, color: '#f59e0b', marginBottom: 20, textTransform: 'uppercase' }}>
            {getTranslation(lang, 'about').tag}
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, margin: '0 0 24px', textTransform: 'uppercase', lineHeight: 1.1 }}>
            {getTranslation(lang, 'about').title}
          </h2>
          <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.85, marginBottom: 28, fontWeight: 400 }}>
            {getTranslation(lang, 'about').p1.split('{boldStart}').map((part, i) => {
              if (i === 0) return part;
              const [bold, rest] = part.split('{boldEnd}');
              return (
                <span key={i}>
                  <strong style={{ color: '#fff' }}>{bold}</strong>
                  {rest}
                </span>
              );
            })}
          </p>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.85, marginBottom: 40, fontWeight: 400 }}>
            {getTranslation(lang, 'about').p2}
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 36 }}>
            {getTranslation(lang, 'about').stats.map((stat, i) => (
              <div key={i} style={{
                flex: '1 1 140px', padding: '20px 24px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', letterSpacing: -1 }}>{stat.num}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 500, letterSpacing: 0.3 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 44, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{
              display: 'inline-block', padding: '14px 32px',
              background: '#f59e0b', color: '#000',
              fontWeight: 800, fontSize: 14, letterSpacing: 1,
              textTransform: 'uppercase', textDecoration: 'none', borderRadius: 6,
            }}>{getTranslation(lang, 'about').cta}</Link>
            <a href="https://wa.me/919608751759" target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
              background: '#25D366', color: '#fff',
              fontWeight: 800, fontSize: 14, letterSpacing: 1,
              textTransform: 'uppercase', textDecoration: 'none', borderRadius: 6,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.87 9.87 0 00-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374A9.86 9.86 0 012.006 11.9C2.006 6.45 6.44 2 11.893 2c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              {getTranslation(lang, 'about').chat}
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Back to Top Button ── */}
      {backToTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          style={{
            position:'fixed', bottom:80, right:20, zIndex:500,
            width:44, height:44, borderRadius:'50%',
            background:'#111', color:'#fff', border:'none',
            fontSize:18, cursor:'pointer',
            boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.2s, transform 0.2s',
            animation:'fadeIn 0.3s ease',
          }}
          title="Back to top"
        >↑</button>
      )}
    </div>
  );
}
