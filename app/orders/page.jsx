"use client";
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getTranslation } from '../../lib/translations';

export default function MyOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        setIsAuthenticated(true);
        await fetchOrders(user.email);
      }
    });
    return () => {
      unsubscribe();
      window.removeEventListener('lang_changed', updateLang);
    };
  }, [router]);

  async function fetchOrders(email) {
    try {
      const q = query(collection(db, "orders"), where("userEmail", "==", email));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { bg: '#d1fae5', text: '#059669', icon: '✅' };
    if (s === 'shipped' || s === 'transit') return { bg: '#dbeafe', text: '#2563eb', icon: '🚚' };
    if (s === 'packed') return { bg: '#fef3c7', text: '#d97706', icon: '📦' };
    return { bg: '#f1f5f9', text: '#475569', icon: '⏳' };
  };

  if (!isAuthenticated || loading) return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '120px 20px', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
        <p style={{ fontWeight: 600, color: '#64748b' }}>Aapki purani orders load ho rahi hain...</p>
      </div>
      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
      <Footer />
    </div>
  );

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '60px 20px', maxWidth: 900, margin: '0 auto', minHeight: '70vh' }}>
        
        <div style={{ marginBottom: 40 }}>
           <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{getTranslation(lang, 'ordersTitle') || 'My Orders'}</h1>
           <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>{orders.length} orders found in your history.</p>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🛍️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Abhi tak koi order nahi hai!</h3>
            <p style={{ color: '#64748b', marginBottom: 30 }}>Kripya kuch kharidari karein aur yahan track karein.</p>
            <Link href="/products" style={{ background: '#0f172a', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>Shop Now</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {orders.map(order => {
              const status = getStatusStyle(order.status);
              return (
                <div key={order.id} style={{ 
                  background: 'white', borderRadius: 20, padding: 24, 
                  border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  display: 'flex', gap: 20, flexWrap: 'wrap', transition: 'transform 0.2s',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ width: 80, height: 100, borderRadius: 12, background: '#f8fafc', flexShrink: 0, overflow: 'hidden' }}>
                    <img src={order.img || "https://placehold.co/100x120?text=Product"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={order.productName} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                       <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Order #{order.id.slice(-6).toUpperCase()}</div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{order.productName}</h3>
                          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Size: {order.size} {order.color && `· ${order.color}`}</div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>₹{order.price.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{formatDate(order.orderDate)}</div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: status.bg, padding: '6px 14px', borderRadius: 99, color: status.text, fontWeight: 800, fontSize: 12 }}>
                          <span>{status.icon}</span> {order.status || 'Processing'}
                       </div>
                       
                       <Link href={`/track?q=${order.id}`} style={{ 
                          fontSize: 13, fontWeight: 800, color: '#6366f1', textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: 6
                       }}>
                          Track Order <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }}></i>
                       </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Footer />
    </div>
  );
}
