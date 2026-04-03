"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getTranslation } from '../../lib/translations';

function TrackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initInput = searchParams.get('q') || '';
  const [input, setInput] = useState(initInput);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang(localStorage.getItem('aapnexa_lang') || 'en');
      const handleLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
      window.addEventListener('lang_changed', handleLang);
      return () => window.removeEventListener('lang_changed', handleLang);
    }
  }, []);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setSearched(true);
    setOrders([]);

    try {
      const qText = input.trim().toLowerCase();
      const ordersRef = collection(db, 'orders');
      
      const qEmail = query(ordersRef, where('userEmail', '==', qText), orderBy('orderDate', 'desc'), limit(5));
      const snapEmail = await getDocs(qEmail);
      
      const qPhone = query(ordersRef, where('userPhone', '==', qText), orderBy('orderDate', 'desc'), limit(5));
      const snapPhone = await getDocs(qPhone);

      const combined = [];
      const ids = new Set();
      
      [...snapEmail.docs, ...snapPhone.docs].forEach(doc => {
        if (!ids.has(doc.id)) {
          combined.push({ id: doc.id, ...doc.data() });
          ids.add(doc.id);
        }
      });

      combined.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(combined);
      
      if (combined.length === 0) {
        setError(getTranslation(lang, 'noOrders'));
      }
      
      router.replace(`/track?q=${encodeURIComponent(input)}`);
    } catch (err) {
      console.error("Tracking Error:", err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initInput) handleTrack();
  }, []);

  const getStatusStep = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'processing' || s === 'placed') return 1;
    if (s === 'packed') return 2;
    if (s === 'shipped' || s === 'transit') return 3;
    if (s === 'delivered') return 4;
    return 1;
  };

  const statusMap = getTranslation(lang, 'status');
  const steps = [
    { label: statusMap.placed, icon: '🛒', desc: 'Saman confirm ho gaya hai!' },
    { label: statusMap.packed, icon: '📦', desc: 'Humaari team packing kar rahi hai.' },
    { label: statusMap.transit, icon: '🚚', desc: 'Order raste mein hai.' },
    { label: statusMap.delivered, icon: '✅', desc: 'Order mil gaya hai!' }
  ];

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      
      <style>{`
        @keyframes statusPulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .active-step { animation: statusPulse 2s infinite; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 850, margin: '60px auto', padding: '0 25px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
           <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Secure Tracking Portal</div>
           <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>{getTranslation(lang, 'trackOrder')}</h1>
           <p style={{ color: '#64748b', fontSize: 17, marginTop: 10 }}>Aapne jo email ya phone kharidte waqt diya tha, wahi enter karein.</p>
        </div>

        <form onSubmit={handleTrack} style={{ 
          display: 'flex', gap: 14, background: 'white', padding: 14, borderRadius: 24, 
          boxShadow: '0 20px 50px rgba(15,23,42,0.08)', border: '1.5px solid #f1f5f9', marginBottom: 60,
          flexWrap: 'wrap'
        }}>
          <input 
            type="text" value={input} onChange={e => setInput(e.target.value)} 
            placeholder={getTranslation(lang, 'trackPlaceholder')}
            style={{ 
              flex: 1, border: 'none', outline: 'none', padding: '14px 24px', 
              fontSize: 16, fontFamily: 'Inter, sans-serif', minWidth: 260, borderRadius: 16,
              background: '#f8fafc', fontWeight: 600
            }}
          />
          <button type="submit" disabled={loading} style={{ 
            padding: '16px 36px', background: '#0f172a', color: 'white', border: 'none', 
            borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            boxShadow: '0 8px 20px rgba(15,23,42,0.15)'
          }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : getTranslation(lang, 'trackCTA')}
          </button>
        </form>

        {searched && !loading && (
          <div className="fade-in">
            {error ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: 44, marginBottom: 20 }}>🔎</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#1e293b', marginBottom: 8 }}>Order nahi mila!</div>
                <p style={{ color: '#64748b', maxWidth: 400, margin: '0 auto' }}>Kripya apna phone number ya email dobara check karein.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 40 }}>
                {orders.map(order => {
                  const currentStep = getStatusStep(order.status);
                  const displayStatus = order.status ? (statusMap[order.status.toLowerCase()] || order.status) : statusMap.placed;
                  const orderDateFormatted = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

                  return (
                    <div key={order.id} style={{ 
                      background: 'white', borderRadius: 32, padding: '40px', 
                      boxShadow: '0 4px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {/* Premium Badge */}
                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#22c55e', color: 'white', fontSize: 11, fontWeight: 900, padding: '8px 24px', borderRadius: '0 0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>Verified Order</div>
                      
                      <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{orderDateFormatted}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>{displayStatus}</h2>
                           <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '6px 14px', borderRadius: 99 }}>#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 20, padding: 24, background: 'rgba(99,102,241,0.03)', borderRadius: 24, marginBottom: 44, border: '1px solid rgba(99,102,241,0.08)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{order.productName}</div>
                          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500 }}>Size: {order.size} {order.color && `· Color: ${order.color}`}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>₹{order.price}</div>
                           <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Free Delivery</div>
                        </div>
                      </div>

                      {/* Visual Timeline Upgrade */}
                      <div style={{ position: 'relative', marginBottom: 20 }}>
                         <div style={{ 
                            position: 'absolute', top: 22, left: '6%', right: '6%', height: 6, 
                            background: '#f1f5f9', borderRadius: 99, zIndex: 0 
                         }} />
                         <div style={{ 
                            position: 'absolute', top: 22, left: '6%', zIndex: 1,
                            width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 88)}%`,
                            height: 6, background: '#6366f1', borderRadius: 99, 
                            transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 0 15px rgba(99,102,241,0.4)'
                         }} />

                         <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                            {steps.map((step, i) => {
                               const isActive = i + 1 <= currentStep;
                               const isCurrent = i + 1 === currentStep;
                               return (
                                 <div key={i} style={{ width: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className={isCurrent ? "active-step" : ""} style={{ 
                                       width: 50, height: 50, borderRadius: 16, 
                                       background: isActive ? '#6366f1' : 'white',
                                       border: `3px solid ${isActive ? '#6366f1' : '#e2e8f0'}`,
                                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                                       fontSize: 22, position: 'relative', transition: 'all 0.5s ease'
                                    }}>
                                       {step.icon}
                                       {isActive && !isCurrent && (
                                          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, background: '#22c55e', borderRadius: '50%', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                             <i className="fa-solid fa-check" style={{ fontSize: 8, color: 'white' }}></i>
                                          </div>
                                       )}
                                    </div>
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                       <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#0f172a' : '#94a3b8' }}>{step.label}</div>
                                       {isCurrent && <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 }}>{step.desc}</div>}
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </div>

                      <div style={{ marginTop: 44, borderTop: '1px solid #f1f5f9', paddingTop: 24, textAlign: 'center' }}>
                         <a href="https://wa.me/919608751759" target="_blank" rel="noreferrer" style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', 
                            background: '#f8fafc', borderRadius: 14, color: '#0f172a', fontWeight: 800, 
                            fontSize: 14, textDecoration: 'none', border: '1.5px solid #e2e8f0',
                            transition: 'all 0.2s'
                         }}>
                            <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: 18 }}></i>
                            Bhai, Order help chahiye? Chat karein.
                         </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div>Loading tracking...</div>}>
      <TrackContent />
    </Suspense>
  );
}
