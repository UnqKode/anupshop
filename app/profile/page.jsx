"use client";
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../lib/ToastContext';
import { getTranslation } from '../../lib/translations';

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const updateLang = () => setLang(localStorage.getItem('aapnexa_lang') || 'en');
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setFullName(currentUser.displayName || '');
        await fetchProfileData(currentUser.uid);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      window.removeEventListener('lang_changed', updateLang);
    };
  }, [router]);

  async function fetchProfileData(uid) {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.fullName || auth.currentUser.displayName || '');
        setPhone(data.phone || '');
        setGender(data.gender || '');
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) return addToast('Name is required', 'error');
    
    setSaving(true);
    try {
      // Update Firebase Auth
      await updateProfile(auth.currentUser, { displayName: fullName.trim() });
      
      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        gender: gender,
        email: auth.currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '120px 20px', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
      </div>
      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
      <Footer />
    </div>
  );

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', display: 'flex', gap: 30, flexWrap: 'wrap' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: 280, flexShrink: 0 }}>
           <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                 {fullName ? fullName[0].toUpperCase() : user?.email[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                 <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Hello,</div>
                 <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{fullName || 'User'}</div>
              </div>
           </div>

           <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#6366f1', fontWeight: 800, fontSize: 13, background: 'rgba(99,102,241,0.03)', display: 'flex', alignItems: 'center', gap: 12 }}>
                 <i className="fa-solid fa-user"></i> {getTranslation(lang, 'profileSettings') || 'ACCOUNT SETTINGS'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#1e293b', background: '#f8fafc', borderLeft: '4px solid #6366f1' }}>Personal Information</div>
                 <Link href="/orders" style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#64748b', textDecoration: 'none', borderLeft: '4px solid transparent', transition: 'all 0.2s' }}>My Orders</Link>
                 <div style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Manage Addresses</div>
                 
                 {/* Help & Business */}
                 <div style={{ padding: '14px 24px', marginTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Help & Business</div>
                 <a href="https://wa.me/919608751759" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-headset"></i> {getTranslation(lang, 'navSupport')}
                 </a>
                 <a href={`https://wa.me/919608751759?text=${encodeURIComponent("Hello Aapnexa! I'm interested in Business / Bulk Orders.")}`} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-briefcase"></i> {getTranslation(lang, 'navBulk')}
                 </a>

                 <div style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#dc2626', borderTop: '1px solid #f1f5f9', cursor: 'pointer', marginTop: 10 }} onClick={() => auth.signOut()}>Logout</div>
              </div>
           </div>
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, minWidth: 320 }}>
           <div style={{ background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 4px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 32 }}>Personal Information</h2>
              
              <form onSubmit={handleSave} style={{ display: 'grid', gap: 24 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                    <div>
                       <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Full Name</label>
                       <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required 
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none', transition: 'all 0.2s' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Email Address</label>
                       <input type="email" value={user?.email || ''} disabled 
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #f1f5f9', fontSize: 15, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                       />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                    <div>
                       <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Mobile Number</label>
                       <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit phone number"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none' }}
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Gender</label>
                       <div style={{ display: 'flex', gap: 12 }}>
                          {['Male', 'Female', 'Other'].map(g => (
                             <button key={g} type="button" onClick={() => setGender(g)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${gender === g ? '#6366f1' : '#f1f5f9'}`, background: gender === g ? 'rgba(99,102,241,0.05)' : 'white', color: gender === g ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>{g}</button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div style={{ marginTop: 20, paddingTop: 30, borderTop: '1px solid #f1f5f9' }}>
                    <button type="submit" disabled={saving} style={{ padding: '16px 40px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 10px 25px rgba(15,23,42,0.15)', transition: 'all 0.2s', width: 'fit-content' }}>
                       {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save Changes'}
                    </button>
                 </div>
              </form>
           </div>

           <div style={{ background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 4px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', marginTop: 30 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>Security</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Account secure rakhne ke liye password update karein.</p>
              <button style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>Change Password</button>
           </div>
        </div>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Footer />
    </div>
  );
}
