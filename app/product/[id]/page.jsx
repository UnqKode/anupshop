"use client";
import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, query, where, limit } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProductCard, { ProductSkeleton } from '../../../components/ProductCard';
import Link from 'next/link';
import { useToast } from '../../../lib/ToastContext';
import { getTranslation } from '../../../lib/translations';
import TrustBar from '../../../components/TrustBar';
import ReviewSection from '../../../components/ReviewSection';

const RecentlyViewed = dynamic(() => import('../../../components/RecentlyViewed'), { ssr: false });

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// 📐 High-Fidelity T-Shirt Measurement SVG
const SizeGuideIcon = () => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'auto' }}>
    <path d="M100 100 L140 80 L260 80 L300 100 L340 140 L300 180 L280 180 L280 340 L120 340 L120 180 L100 180 L60 140 Z" fill="#f1f5f9" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M150 83 Q200 100 250 83" stroke="#6366f1" strokeWidth="2.5" fill="none" />
    {/* Chest (A) */}
    <path d="M120 190 L280 190" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M120 185 V195 M280 185 V195" stroke="#ef4444" strokeWidth="2" />
    <text x="200" y="210" textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="800">A (Chest)</text>
    {/* Length (B) */}
    <path d="M160 80 V340" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M155 80 H165 M155 340 H165" stroke="#2563eb" strokeWidth="2" />
    <text x="145" y="210" textAnchor="middle" fill="#2563eb" fontSize="14" fontWeight="800" transform="rotate(-90 145 210)">B (Length)</text>
  </svg>
);

export default function ProductDetail() {
  const router = useRouter();
  const { addToast } = useToast();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // ── Checkout States ──
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [cartAdded, setCartAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [savedCoupon, setSavedCoupon] = useState(null);
  const [couponEnabled, setCouponEnabled] = useState(false);
  const VALID_COUPONS = { 'AAPNEXA10': 10, 'WELCOME10': 10 };
  const [viewers, setViewers] = useState(0);
  const [dispatchTimer, setDispatchTimer] = useState('00:00:00');
  
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    return () => window.removeEventListener('lang_changed', updateLang);
  }, []);

  // Dispatch Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const dispatchTime = new Date();
      dispatchTime.setHours(17, 0, 0); 
      if (now > dispatchTime) dispatchTime.setDate(dispatchTime.getDate() + 1);
      const diff = dispatchTime - now;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setDispatchTimer(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setViewers(Math.floor(Math.random() * 26) + 8);
    const interval = setInterval(() => {
      setViewers(v => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(4, Math.min(50, v + delta));
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!params.id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', params.id));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          const sizes = data.sizes || ['S','M','L','XL'];
          setSelectedSize(sizes.includes('M') ? 'M' : sizes[0]);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadProduct();
    if (params.id) {
       const recent = JSON.parse(localStorage.getItem('aapnexa_recent') || '[]');
       const filtered = [params.id, ...recent.filter(rid => rid !== params.id)].slice(0, 10);
       localStorage.setItem('aapnexa_recent', JSON.stringify(filtered));
    }
  }, [params.id]);

  const deliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 5); 
    return d.toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short' });
  })();

  useEffect(() => {
    if (!product?.category) return;
    async function loadRelated() {
      try {
        const q = query(collection(db, 'products'), where('category', '==', product.category), limit(8));
        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.id !== product.id)
          .slice(0, 6);
        setRelatedProducts(data);
      } catch (e) { console.error(e); }
    }
    loadRelated();
  }, [product]);

  useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
      setMainImage(product.colors[0].image);
    } else {
      setMainImage(product?.image || product?.imageUrl || null);
    }
  }, [product]);

  useEffect(() => {
    if (auth.currentUser?.email) setOrderEmail(auth.currentUser.email);
    const saved = localStorage.getItem('aapnexa_coupon');
    if (saved && VALID_COUPONS[saved]) setSavedCoupon({ code: saved, discount: VALID_COUPONS[saved] });
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    const cartProduct = { ...product, image: mainImage || product.image };
    if (selectedColor) cartProduct.color = selectedColor.name;
    const cart = JSON.parse(localStorage.getItem('aapnexa_cart')) || [];
    const existing = cart.find(item => item.id === product.id && item.size === selectedSize && item.color === cartProduct.color);
    if (existing) { existing.quantity += 1; } else { cart.push({ ...cartProduct, size: selectedSize, quantity: 1 }); }
    localStorage.setItem('aapnexa_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart_updated'));
    window.dispatchEvent(new Event('open_cart'));
    addToast(`${product.name} added to cart!`, 'success');
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handleOrderSubmit = async e => {
    if (e) e.preventDefault();
    setOrderError('');
    if (!customerName || customerName.length < 2) { setOrderError('Please enter your full name.'); return; }
    if (!orderEmail.includes('@')) { setOrderError('Enter a valid email address.'); return; }
    if (orderPhone.replace(/\D/g,'').length < 10) { setOrderError('Enter a valid 10-digit phone number.'); return; }
    if (!houseNo || !street || !city || !state || pincode.length !== 6) { setOrderError('Please fill all address fields.'); return; }

    setOrderLoading(true);
    const adminPhone = '919608751759';
    const colorInfo = selectedColor ? ` | Color: ${selectedColor.name}` : '';
    const currentOrigin = window.location.origin;
    const productURL = `${currentOrigin}/product/${params.id}`;
    const imgURL = mainImage || product.image || product.imageUrl || '';
    const activeCoupon = couponEnabled ? savedCoupon : null;
    const basePrice = parseFloat(product.price);
    const couponDiscount = activeCoupon ? Math.round(basePrice * activeCoupon.discount / 100) : 0;
    const finalPrice = basePrice - couponDiscount;

    let msg = `*🚀 NEW DIRECT ORDER — AAPNEXA* 🛍️`;
    msg += `\n\n*📦 PRODUCT PHOTO:* ${imgURL}`;
    msg += `\n\n*👤 CUSTOMER DETAIL:*`;
    msg += `\n*Name:* ${customerName}`;
    msg += `\n*Phone:* ${orderPhone}`;
    msg += `\n*Email:* ${orderEmail}`;
    msg += `\n\n*🏠 DELIVERY ADDRESS:*`;
    msg += `\n${houseNo}, ${street}`;
    if (landmark) msg += `\n*Landmark:* ${landmark}`;
    msg += `\n${city}, ${state} - ${pincode}`;
    msg += `\n\n*📦 ITEM DETAILS:*`;
    msg += `\n*Item:* ${product.name}`;
    msg += `\n*Size:* ${selectedSize}${colorInfo}`;
    msg += `\n*Price:* ₹${finalPrice.toLocaleString('en-IN')}`;
    msg += `\n\n*🔗 PRODUCT LINK:* ${productURL}`;
    msg += `\n\n_New order received from store. Please process for delivery._`;

    try {
      const orderDate = new Date().toISOString();
      const deliveryDatePlan = new Date();
      deliveryDatePlan.setDate(deliveryDatePlan.getDate() + 7);
      await addDoc(collection(db, 'orders'), {
        customerName, userEmail: orderEmail, userPhone: orderPhone,
        address: { houseNo, street, landmark, city, state, pincode },
        productName: product.name, price: finalPrice,
        originalPrice: basePrice, coupon: activeCoupon?.code || '',
        size: selectedSize, color: selectedColor?.name || '',
        id: params.id, orderDate, deliveryDate: deliveryDatePlan.toISOString(), status: 'Processing',
      });
      addToast("Order info saved! Opening WhatsApp...", "success");
    } catch (err) { console.error('Order write error:', err); }
    finally {
      setOrderLoading(false);
      window.location.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
      setShowOrderModal(false);
    }
  };

  const sizes = product?.sizes || ['S','M','L','XL'];

  if (loading) return <div className="fade-in"><Navbar /><p style={{padding:'80px 40px', textAlign:'center', color:'#94a3b8'}}>Loading product…</p><Footer /></div>;
  if (!product) return <div className="fade-in"><Navbar /><p style={{padding:'80px 40px', textAlign:'center', color:'#94a3b8'}}>Product not found.</p><Footer /></div>;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <div className="fade-in">
      <style>{`
        * { box-sizing: border-box; }
        @keyframes modalIn { from{opacity:0;transform:scale(0.96);translateY(10px)} to{opacity:1;transform:scale(1);translateY(0)} }
        .size-btn-pd:hover { border-color:#6366f1!important; color:#6366f1!important; }
        .mobile-sticky-bar { 
          display: none; position: fixed; bottom: 64px; left: 0; right: 0; 
          background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); 
          padding: 12px 20px; border-top: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 -8px 30px rgba(0,0,0,0.1); z-index: 900;
          align-items: center; justify-content: space-between; animation: slideUp 0.4s ease;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 768px) { .mobile-sticky-bar { display: flex; } }
        .checkout-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; background: white; -webkit-appearance: none; }
        .checkout-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .checkout-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
        .pulse-view { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
      `}</style>
      <Navbar />

      <div style={{ padding:'16px 40px', fontSize:12, background:'#f9fafb', color:'#94a3b8', fontFamily:'Inter,sans-serif', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', textTransform:'uppercase', fontWeight:600, letterSpacing:0.5 }}>
        <Link href="/" style={{ color:'#94a3b8', textDecoration:'none' }}>{getTranslation(lang, 'home')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize:8, opacity:0.5 }}></i>
        <Link href="/products" style={{ color:'#94a3b8', textDecoration:'none' }}>{getTranslation(lang, 'shop')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize:8, opacity:0.5 }}></i>
        <span style={{ color:'#111', fontWeight:800 }}>{product.name}</span>
      </div>

      <div style={{ display:'flex', gap:60, padding:'40px 40px', maxWidth:1200, margin:'0 auto', flexWrap:'wrap', fontFamily:'Inter,sans-serif' }}>
        <div style={{ flex:1, minWidth:300 }}>
          <div style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#f8fafc', aspectRatio:'3/4' }}>
            <img src={mainImage || product.image || product.imageUrl} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            {hasDiscount && <div style={{ position:'absolute', top:14, left:14, background:'#dc2626', color:'white', fontSize:12, fontWeight:800, padding:'5px 12px', borderRadius:99 }}>{discountPct}% OFF</div>}
          </div>
          {product.colors?.length > 0 && (
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <div onClick={() => { setMainImage(product.image); setSelectedColor(null); }} style={{ width:60, height:74, borderRadius:10, overflow:'hidden', cursor:'pointer', border: !selectedColor ? '2.5px solid #2563eb' : '2px solid #e2e8f0' }}>
                <img src={product.image} alt="Default" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              {product.colors.map((c, i) => (
                <div key={i} onClick={() => { setSelectedColor(c); setMainImage(c.image); }} style={{ width:60, height:74, borderRadius:10, overflow:'hidden', cursor:'pointer', border: selectedColor?.name===c.name ? '2.5px solid #2563eb' : '2px solid #e2e8f0' }}>
                  <img src={c.image} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:300 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.08)', padding:'4px 10px', borderRadius:99, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>{product.category}</div>
          <h1 style={{ fontSize:32, fontWeight:900, color:'#0f172a', margin:'0 0 8px', lineHeight:1.1, textTransform:'capitalize', letterSpacing:'-1px' }}>{product.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <span style={{ fontSize:13, color:'#059669', fontWeight:700, background:'#d1fae5', padding:'4px 12px', borderRadius:99, display:'flex', alignItems:'center' }}>
              <span className="pulse-view"></span> {getTranslation(lang, 'viewersCount18')}
            </span>
            <span style={{ fontSize:13, color:'#dc2626', fontWeight:700, background:'#fee2e2', padding:'4px 12px', borderRadius:99 }}>{getTranslation(lang, 'sellingFastBadge')}</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:36, fontWeight:900, color:'#0f172a' }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
            {hasDiscount && <span style={{ fontSize:18, color:'#9ca3af', textDecoration:'line-through' }}>₹{parseFloat(product.originalPrice).toLocaleString('en-IN')}</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12, background: '#f8fafc', padding: '4px 12px', borderRadius: 99, border: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', gap: 1 }}>
                  {[1,2,3,4,5].map(starValue => (
                    <span key={starValue} style={{ color: starValue <= 4 ? '#f59e0b' : '#cbd5e1', fontSize: 13 }}>★</span>
                  ))}
               </div>
               <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>4.8 / 5.0</span>
            </div>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.08)', border:'1.5px solid rgba(245,158,11,0.3)', padding:'6px 14px', borderRadius:10, marginBottom:22 }}>
             <span style={{ fontSize:16 }}>🎁</span>
             <span style={{ fontSize:11, fontWeight:800, color:'#92400e', letterSpacing:1.5, textTransform:'uppercase' }}>Combo Deal: Buy 2 Get 10% Extra Off</span>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:16, padding:16, border:'1px solid #e2e8f0', marginBottom:24 }}>
             <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:18 }}>📦</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{getTranslation(lang, 'dispatchToday', { time: dispatchTimer })}</span>
             </div>
             <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>🚚</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#059669' }}>{getTranslation(lang, 'getItBy', { date: deliveryDate })}</span>
             </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:15, fontWeight:800 }}>Select Size</span>
              <button onClick={() => setShowSizeGuide(true)} style={{ background:'none', border:'none', color:'#6366f1', fontWeight:700, cursor:'pointer', fontSize:14 }}>📐 Size Intelligence</button>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {sizes.map(sz => (
                <button key={sz} className="size-btn-pd" onClick={() => setSelectedSize(sz)} style={{
                  minWidth:54, height:54, borderRadius:12, cursor:'pointer', fontWeight:800, fontSize:15,
                  border:`2px solid ${selectedSize===sz?'#0f172a':'#e2e8f0'}`,
                  background: selectedSize===sz ? '#0f172a' : 'white',
                  color: selectedSize===sz ? 'white' : '#0f172a',
                  transition:'all 0.2s'
                }}>{sz}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <button onClick={handleAddToCart} style={{ flex:1.2, height:58, fontWeight:800, borderRadius:14, cursor:'pointer', background: cartAdded?'#059669':'white', color: cartAdded?'white':'#0f172a', border: '2.5px solid #0f172a', fontSize:16 }}>{cartAdded ? '✓ Added' : 'Add to Bag'}</button>
            <button onClick={() => { setShowOrderModal(true); setCheckoutStep(1); }} style={{ flex:1.8, height:58, background:'#0f172a', color:'white', border:'none', fontWeight:800, borderRadius:14, cursor:'pointer', fontSize:16, boxShadow:'0 10px 25px rgba(15,23,42,0.15)' }}>⚡ Confirm Order via WhatsApp</button>
          </div>
          <TrustBar lang={lang} />
          <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
               <i className="fa-solid fa-medal" style={{ color:'#6366f1' }}></i>
               <span style={{ fontSize:14, fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>Engineering Modern Minimalism</span>
            </div>
            <p style={{ color:'#64748b', fontSize:15, lineHeight:1.8, whiteSpace:'pre-line', marginBottom:28 }}>{product.description}</p>

            <div style={{ background:'#f8fafc', borderRadius:16, padding:24, border:'1px solid #f1f5f9' }}>
               <h4 style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', color:'#0f172a', marginBottom:18, letterSpacing:2 }}>Craftsmanship & Care</h4>
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  {[
                    { i:'fa-shirt', t:'100% Super-Combed Cotton', s:'Breathable & Premium' },
                    { i:'fa-arrows-to-circle', t:'Pre-Shrunk Fabric', s:'Fits perfect, forever' },
                    { i:'fa-droplet-slash', t:'Sustainable Dyes', s:'No fading, ever' },
                    { i:'fa-temperature-arrow-down', t:'Machine Wash Cold', s:'Easy maintenance' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                       <i className={`fa-solid ${item.i}`} style={{ color:'#6366f1', fontSize:14, marginTop:3 }}></i>
                       <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>{item.t}</div>
                          <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>{item.s}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <ReviewSection productId={params.id} lang={lang} />
      </div>

      <RecentlyViewed currentId={params.id} />
      <Footer />

      {/* ── Multi-Step Checkout Modal ── */}
      {showOrderModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }} onClick={() => setShowOrderModal(false)}>
          <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:480, maxHeight:'min(95vh, 800px)', overflowY:'auto', animation:'modalIn 0.3s cubic-bezier(0.8,0,0.2,1)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'24px 32px', borderBottom:'1px solid #f1f5f9', background:'#fafbfc' }}>
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                <img src={mainImage || product.image || product.imageUrl} style={{ width:60, height:75, borderRadius:10, objectFit:'cover' }} alt={product.name} />
                <div style={{ flex:1 }}>
                   <div style={{ fontSize:12, fontWeight:800, color:'#6366f1', textTransform:'uppercase' }}>{getTranslation(lang, 'orderSummary')}</div>
                   <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'2px 0' }}>{product.name}</h3>
                   <div style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{selectedSize} · ₹{parseFloat(product.price).toLocaleString('en-IN')}</div>
                </div>
                <button onClick={() => setShowOrderModal(false)} style={{ background:'none', border:'none', fontSize:24, color:'#94a3b8', cursor:'pointer' }}>×</button>
              </div>
            </div>
            <div style={{ height:4, background:'#f1f5f9', width:'100%' }}><div style={{ height:'100%', background:'#6366f1', width: checkoutStep === 1 ? '50%' : '100%', transition:'width 0.4s ease' }} /></div>
            <div style={{ padding:'32px' }}>
              {checkoutStep === 1 ? (
                <div className="fade-in">
                  <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Information</h2>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:24 }}>Customer details bharein order shuru karne ke liye.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    <div><label className="checkout-label">Pura Naam</label><input className="checkout-input" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Rahul" /></div>
                    <div><label className="checkout-label">Email</label><input className="checkout-input" type="email" value={orderEmail} onChange={e => setOrderEmail(e.target.value)} placeholder="rahul@example.com" /></div>
                    <div><label className="checkout-label">WhatsApp Number</label><input className="checkout-input" type="tel" value={orderPhone} onChange={e => setOrderPhone(e.target.value.replace(/\D/g,''))} placeholder="9876543210" /></div>
                    {orderError && <div style={{ color:'#dc2626', fontSize:13, fontWeight:600, background:'#fef2f2', padding:'10px', borderRadius:8 }}>⚠️ {orderError}</div>}
                    <button onClick={() => { if(customerName.length<2 || !orderEmail.includes('@') || orderPhone.length<10) { setOrderError('Details sahi bharein.'); return; } setOrderError(''); setCheckoutStep(2); }} style={{ marginTop:12, padding:'15px', background:'#0f172a', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }}>Shipping Address Chunein →</button>
                  </div>
                </div>
              ) : (
                <div className="fade-in">
                  <button onClick={() => setCheckoutStep(1)} style={{ background:'none', border:'none', color:'#6366f1', fontWeight:700, cursor:'pointer', fontSize:13, marginBottom:16 }}>← Back</button>
                  <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:24 }}>Delivery Address</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div><label className="checkout-label">Makan No. / Gali</label><input className="checkout-input" type="text" value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="123, Model Town" /></div>
                    <div><label className="checkout-label">Colony / Area</label><input className="checkout-input" type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Civil Lines" /></div>
                    <div style={{ display:'flex', gap:12 }}>
                      <div style={{ flex:1 }}><label className="checkout-label">Pincode</label><input className="checkout-input" type="text" maxLength="6" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g,''))} placeholder="110001" /></div>
                      <div style={{ flex:1.5 }}><label className="checkout-label">City</label><input className="checkout-input" type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Delhi" /></div>
                    </div>
                    <div><label className="checkout-label">State</label><select className="checkout-input" value={state} onChange={e => setState(e.target.value)}><option value="">Select State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    {orderError && <div style={{ color:'#dc2626', fontSize:13, fontWeight:600, background:'#fef2f2', padding:'10px', borderRadius:8 }}>⚠️ {orderError}</div>}
                    <button onClick={handleOrderSubmit} disabled={orderLoading} style={{ marginTop:12, padding:'16px', background:'#25D366', color:'white', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:orderLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>{orderLoading ? 'Saving...' : 'Confirm Order via WhatsApp'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Visual Size Guide Modal FIX (Inlined SVG) ── */}
      {showSizeGuide && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(8px)' }} onClick={() => setShowSizeGuide(false)}>
          <div style={{ background:'white', borderRadius:24, padding:32, width:'100%', maxWidth:700, maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
               <h2 style={{ fontSize:24, fontWeight:900, color:'#0f172a' }}>📐 Finding Your Perfect Fit</h2>
               <button onClick={() => setShowSizeGuide(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer' }}>×</button>
            </div>
            
            <div style={{ display:'flex', gap:32, flexWrap:'wrap', marginBottom:32 }}>
               <div style={{ flex:1, minWidth:280, background:'#f8fafc', borderRadius:16, padding:20, border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <SizeGuideIcon />
                  <p style={{ fontSize:12, color:'#64748b', textAlign:'center', marginTop:12, fontWeight:600 }}>T-shirt measurement guide for (A) Chest and (B) Length.</p>
               </div>
               <div style={{ flex:1.2, minWidth:280 }}>
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 8px' }}>
                    <thead><tr style={{ textAlign:'left', color:'#94a3b8', fontSize:12, fontWeight:800, textTransform:'uppercase' }}><th style={{ padding:'0 12px' }}>Size</th><th style={{ padding:'0 12px' }}>Chest (A)</th><th style={{ padding:'0 12px' }}>Length (B)</th></tr></thead>
                    <tbody>
                      {[['S','38"','27"'],['M','40"','28"'],['L','42"','29"'],['XL','44"','30"']].map(([s,c,l], i) => (
                        <tr key={i} style={{ background: i%2===0 ? '#f8fafc' : 'white' }}>
                          <td style={{ padding:14, borderRadius:'12px 0 0 12px', fontWeight:800, border:'1px solid #f1f5f9', borderRight:0 }}>{s}</td>
                          <td style={{ padding:14, border:'1px solid #f1f5f9', borderLeft:0, borderRight:0 }}>{c}</td>
                          <td style={{ padding:14, borderRadius:'0 12px 12px 0', border:'1px solid #f1f5f9', borderLeft:0, fontWeight:600 }}>{l}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
            <div style={{ background:'#fffbeb', padding:20, borderRadius:16, border:'1px solid #fef3c7', fontSize:14, color:'#92400e', lineHeight:1.6 }}>
               <span style={{ fontSize:20, marginRight:8 }}>💡</span>
               <strong>Pro-Tip:</strong> Apne ghar par kisi favorite fitting t-shirt ko naapein (Flat rakh kar) aur table se match karein. Aapnexa sizes hamesha premium modern fit dete hain.
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bar */}
      <div className="mobile-sticky-bar">
        <div>
          <div style={{ fontSize:10, color:'#1e293b', fontWeight:800 }}>BEST PRICE</div>
          <div style={{ fontSize:20, fontWeight:900 }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</div>
        </div>
        <button onClick={() => { setShowOrderModal(true); setCheckoutStep(1); }} style={{ background:'#0f172a', color:'white', padding:'12px 28px', borderRadius:14, fontWeight:800, border:'none', fontSize:15 }}>Confirm Order ⚡</button>
      </div>

      <style>{` .fade-in { animation: fadeIn 0.4s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
}
