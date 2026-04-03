"use client";
import React, { useState, useEffect } from 'react';
import { getTranslation } from '../lib/translations';

export default function FloatingSupport() {
  const [lang, setLang] = useState('en');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    return () => window.removeEventListener('lang_changed', updateLang);
  }, []);

  useEffect(() => {
    // Show tooltip after 5 seconds to grab attention, then hide
    const timer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = "919608751759";
  const message = encodeURIComponent("Hello Aapnexa! I need some help with my order.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="floating-support-container" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    }}>
      {/* Tooltip */}
      <div style={{
        background: '#1e293b',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        opacity: showTooltip ? 1 : 0,
        transform: showTooltip ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
        position: 'relative'
      }}>
        {getTranslation(lang, 'chatWithUs')}
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          right: '20px',
          width: '12px',
          height: '12px',
          background: '#1e293b',
          transform: 'rotate(45deg)'
        }}></div>
      </div>

      {/* Button */}
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          width: '60px',
          height: '60px',
          background: '#25D366',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '32px',
          boxShadow: '0 12px 40px rgba(37, 211, 102, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'auto',
          border: '4px solid #fff'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          setShowTooltip(true);
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          setShowTooltip(false);
        }}
      >
        <i className="fa-brands fa-whatsapp"></i>
        
        {/* Rapid Notification Pulse */}
        <span style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '18px',
          height: '18px',
          background: '#ff4b2b',
          borderRadius: '50%',
          border: '3px solid #fff',
          animation: 'pulse-ping 2s infinite'
        }}></span>
      </a>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ping {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 75, 43, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 75, 43, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 75, 43, 0); }
        }
        @media (max-width: 768px) {
          .floating-support-container { bottom: 90px !important; right: 20px !important; }
        }
      `}} />
    </div>
  );
}
