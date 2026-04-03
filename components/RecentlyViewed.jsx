"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductCard from './ProductCard';
import { getTranslation } from '../lib/translations';

export default function RecentlyViewed({ currentId }) {
    const [products, setProducts] = useState([]);
    const [lang, setLang] = useState('en');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
        updateLang();
        window.addEventListener('lang_changed', updateLang);
        return () => window.removeEventListener('lang_changed', updateLang);
    }, []);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const recentIds = JSON.parse(localStorage.getItem('aapnexa_recent') || '[]')
                                   .filter(id => id !== currentId)
                                   .slice(0, 8);
                
                if (recentIds.length === 0) {
                    setLoading(false);
                    return;
                }

                const q = query(collection(db, 'products'), where('__name__', 'in', recentIds));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Sort by the order in 'recentIds' to preserve the most recent
                const sorted = recentIds.map(id => data.find(p => p.id === id)).filter(Boolean);
                setProducts(sorted);
            } catch (err) {
                console.error("Recently Viewed Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, [currentId]);

    if (loading || products.length === 0) return null;

    return (
        <section style={{ padding: '60px 40px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <h2 style={{ 
                    fontFamily: 'var(--font-serif)', 
                    fontSize: '28px', 
                    fontWeight: '800', 
                    marginBottom: '32px',
                    color: '#0f172a',
                    letterSpacing: '-0.5px'
                }}>
                    {getTranslation(lang, 'recentlyViewed')}
                </h2>
                
                {/* Custom horizontal scroll with hide-scroll class */}
                <div className="product-grid hide-scroll" style={{ 
                    display: 'flex', 
                    gap: '24px', 
                    overflowX: 'auto', 
                    paddingBottom: '20px',
                    scrollSnapType: 'x mandatory'
                }}>
                    {products.map(product => (
                        <div key={product.id} style={{ minWidth: '280px', scrollSnapAlign: 'start' }}>
                            <ProductCard p={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
