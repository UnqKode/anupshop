import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTranslation } from '../lib/translations';

export default function Footer() {
    const [lang, setLang] = useState(typeof window !== 'undefined' ? localStorage.getItem('aapnexa_lang') || 'en' : 'en');

    useEffect(() => {
        const handleLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
        window.addEventListener('lang_changed', handleLang);
        return () => window.removeEventListener('lang_changed', handleLang);
    }, []);

    return (
        <>
            <footer className="footer" style={{ paddingBottom: 40 }}>
                <div className="footer-col branding-col">
                    <h4 style={{ 
                        fontFamily: 'var(--font-serif)', 
                        fontSize: '32px', 
                        fontWeight: '800', 
                        textTransform: 'none', 
                        color: 'var(--color-gold)',
                        letterSpacing: '-1px',
                        marginBottom: '15px'
                    }}>Aapnexa</h4>
                    <p style={{ fontFamily: 'var(--font-main)', fontWeight: '700', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{getTranslation(lang, 'about').tag}</p>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', maxWidth: 320 }}>
                        {getTranslation(lang, 'about').p1.replace('{boldStart}', '').replace('{boldEnd}', '')}
                    </p>
                </div>
                <div className="footer-col">
                    <h4>Products</h4>
                    <Link href="/products?category=tshirts">{getTranslation(lang, 'categories').tshirts}</Link>
                    <Link href="/products?category=jeans">{getTranslation(lang, 'categories').jeans}</Link>
                    <Link href="/products">All Products</Link>
                </div>
                <div className="footer-col">
                    <h4>Contact Info</h4>
                    <a href="tel:9608751759"><i className="fa-solid fa-phone"></i> +91 9608751759</a>
                    <a href="mailto:aapnexa@gmail.com"><i className="fa-solid fa-envelope"></i> aapnexa@gmail.com</a>
                    <div className="social-icons">
                        <a href="https://instagram.com/aapnexa" target="_blank" rel="noreferrer"><i className="fa-brands fa-instagram"></i></a>
                    </div>
                </div>
                <div className="footer-col">
                    <h4>About</h4>
                    <Link href="#">{getTranslation(lang, 'about').tag}</Link>
                    <Link href="#">Shipping & Returns</Link>
                    <Link href="#">Privacy Policy</Link>
                </div>
            </footer>

            {/* Amazon-Style Back to Top Bar */}
            <div 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ 
                    background: '#37475a', color: 'white', textAlign: 'center', 
                    padding: '15px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = '#485769'}
                onMouseLeave={e => e.target.style.background = '#37475a'}
            >
                {getTranslation(lang, 'backToTop')}
            </div>

            {/* Amazon-Style Branding & Language Row - High Visibility */}
            <div style={{ 
                background: '#131a22', /* Amazon Navy Dark */
                padding: '40px 20px', 
                borderTop: '1px solid #3a4553', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '25px',
                textAlign: 'center'
            }}>
                {/* Logo with slight glow */}
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{ 
                        fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '900', 
                        color: 'white', letterSpacing: '-0.5px'
                    }}>Aapnexa</div>
                </Link>

                {/* Selectors Row */}
                <div style={{ display:'flex', gap:15, flexWrap:'wrap', justifyContent:'center', alignItems: 'center' }}>
                    <select 
                        onChange={(e) => {
                            localStorage.setItem('aapnexa_lang', e.target.value);
                            window.dispatchEvent(new Event('lang_changed'));
                        }}
                        value={lang}
                        style={{ 
                            background: '#131a22', color: '#fff', border: '1px solid #848688', 
                            borderRadius: '3px', padding: '8px 15px', fontSize: '14px', cursor: 'pointer',
                            outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.borderColor = '#fff'}
                        onMouseLeave={e => e.target.style.borderColor = '#848688'}
                    >
                        <option value="en">🌐 English - EN</option>
                        <option value="hi">हिंदी - HI</option>
                        <option value="bn">বাংলা - BN</option>
                        <option value="mr">मराठी - MR</option>
                        <option value="ta">தமிழ் - TA</option>
                        <option value="te">తెలుగు - TE</option>
                    </select>

                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, 
                        border: '1px solid #848688', borderRadius: '3px', padding: '8px 15px', 
                        color: '#fff', fontSize: '14px', cursor: 'default' 
                    }}>
                        <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India" style={{ width: 20, height: 14, objectFit: 'cover' }} />
                        {getTranslation(lang, 'india')}
                    </div>
                </div>

                {/* Sub Links */}
                <div style={{ display:'flex', gap:25, flexWrap:'wrap', justifyContent:'center', marginTop: 10 }}>
                   {[
                     { key: 'conditions', label: getTranslation(lang, 'conditions') },
                     { key: 'privacy', label: getTranslation(lang, 'privacy') },
                     { key: 'complaints', label: getTranslation(lang, 'complaints') }
                   ].map(item => (
                       <Link key={item.key} href="#" style={{ color: '#ccc', fontSize: 13, textDecoration: 'none' }} 
                       onMouseEnter={e => e.target.style.textDecoration='underline'} onMouseLeave={e => e.target.style.textDecoration='none'}>{item.label}</Link>
                   ))}
                </div>
                
                <div style={{ color: '#888', fontSize: 13, marginTop: 5 }}>
                    © 2024-2026, Aapnexa Luxury Storefront or its affiliates
                </div>
            </div>
            
            {/* Global E-commerce Floating WhatsApp Action */}
            <a href={`https://wa.me/919608751759?text=${encodeURIComponent(getTranslation(lang, 'helpSupport'))}`} target="_blank" rel="noreferrer" className="floating-whatsapp" aria-label="Chat on WhatsApp">
                <i className="fa-brands fa-whatsapp"></i>
            </a>
        </>
    );
}
