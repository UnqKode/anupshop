"use client";
import { useState, useEffect } from 'react';

const buyers = [
  { name: "Anup", city: "Patna", item: "Slim Fit T-Shirt", time: "2 mins ago" },
  { name: "Vikash", city: "Delhi", item: "Classic Denim", time: "5 mins ago" },
  { name: "Karan", city: "Mumbai", item: "Oxford Shirt", time: "1 min ago" },
  { name: "Rahul", city: "Bangalore", item: "Stretch Jeans", time: "8 mins ago" },
  { name: "Arjun", city: "Pune", item: "Activewear Set", time: "3 mins ago" },
  { name: "Siddharth", city: "Lucknow", item: "Signature Blazer", time: "12 mins ago" }
];

export default function SocialProof() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
      setCurrent(randomBuyer);
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    // Initial delay
    const initialDelay = setTimeout(showNotification, 8000);

    // Repeat every 25 seconds
    const interval = setInterval(showNotification, 25000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  if (!current) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '20px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '16px 22px',
      borderRadius: '0px', // Sharp luxury edges or 4px
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-120%)',
      pointerEvents: 'none',
      maxWidth: '320px',
      fontFamily: 'var(--font-main)'
    }}>
      <div style={{ 
        width: 44, height: 44, background: '#111', 
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-gold)', fontSize: '20px', flexShrink: 0,
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}>
        <i className="fa-solid fa-bag-shopping"></i>
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '0.5px' }}>
          {current.name.toUpperCase()} <span style={{ fontWeight: 400, color: '#666' }}>FROM</span> {current.city.toUpperCase()}
        </div>
        <div style={{ fontSize: '12px', color: '#444', marginTop: '4px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          acquired the <span style={{ fontWeight: '700', color: '#111' }}>{current.item}</span>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--color-gold-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>
          {current.time}
        </div>
      </div>
      
      {/* Verified Luxury Badge */}
      <div style={{ position: 'absolute', top: -8, left: -8, background: 'var(--color-gold)', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <i className="fa-solid fa-check"></i>
      </div>
    </div>
  );
}
