"use client";
import { useState, useEffect, useRef } from 'react';

const sliderImages = [
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1600' },
    { url: 'https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?auto=compress&cs=tinysrgb&w=1600' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68624d5517?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1600' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600' }
];

import { getTranslation } from '../lib/translations';

export default function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lang, setLang] = useState(typeof window !== 'undefined' ? localStorage.getItem('aapnexa_lang') || 'en' : 'en');

    useEffect(() => {
        const handleLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
        window.addEventListener('lang_changed', handleLang);
        return () => window.removeEventListener('lang_changed', handleLang);
    }, []);

    const slidesText = getTranslation(lang, 'heroSlides') || [];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="hero-slider" id="heroSlider">
            <div className="slides-container" style={{ transform: `translateX(-${currentIndex * 100}%)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {sliderImages.map((slide, i) => {
                    const slideData = slidesText[i] || { text: "Aapnexa Premium", sub: "Quality Guaranteed" };
                    return (
                        <div className="slide" key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${slide.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                            <div style={{ 
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)', 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                padding: '0 20px', textAlign: 'center', zIndex: 2 
                            }}>
                                <div style={{ maxWidth: '800px', animation: 'fadeInUp 1s ease both' }}>
                                    <h2 style={{ 
                                        color: '#ffffff', 
                                        fontSize: 'clamp(2.5rem, 9vw, 5.5rem)', 
                                        fontWeight: '300', 
                                        letterSpacing: '-1px', 
                                        margin: 0, 
                                        lineHeight: 1.1, 
                                        fontFamily: 'Outfit, sans-serif',
                                        textShadow: '0 4px 30px rgba(0,0,0,0.3)'
                                    }}>
                                        {slideData.text.split(' ').map((word, idx) => (
                                            <span key={idx} style={idx === 0 ? { fontWeight: '900' } : {}}>{word} </span>
                                        ))}
                                    </h2>
                                    <p style={{ 
                                        color: '#fff', 
                                        fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', 
                                        marginTop: '24px', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '6px', 
                                        fontWeight: '500',
                                        opacity: 0.9
                                    }}>{slideData.sub}</p>
                                    <div style={{ marginTop: 40, display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                        <button onClick={() => window.location.href='/products'} style={{ background: '#fff', color: '#111', border: 'none', padding: '18px 45px', fontSize: '13px', fontWeight: '800', borderRadius: '50px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', transition:'all 0.3s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>Shop Now</button>
                                        <button onClick={() => window.location.href='/products?category=sale'} style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '16px 45px', fontSize: '13px', fontWeight: '800', borderRadius: '50px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', transition:'all 0.3s' }}>View Sale</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .hero-slider .slider-btn { background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); border-radius: 50%; width: 50px; height: 50px; color: #fff; transition: all 0.3s; }
                .hero-slider .slider-btn:hover { background: #fff; color: #111; }
                .slider-dots .dot { width: 12px; height: 12px; background: rgba(255,255,255,0.3); border: 2px solid transparent; transition: all 0.3s; }
                .slider-dots .dot.active { background: #fff; transform: scale(1.3); }
            `}} />
            <button className="slider-btn prev-btn" onClick={() => setCurrentIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1))}>
                <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="slider-btn next-btn" onClick={() => setCurrentIndex((prev) => (prev + 1) % sliderImages.length)}>
                <i className="fa-solid fa-chevron-right"></i>
            </button>
            <div className="slider-dots">
                {sliderImages.map((_, i) => (
                    <div 
                        key={i} 
                        className={`dot ${i === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(i)}
                    ></div>
                ))}
            </div>
        </header>
    );
}
