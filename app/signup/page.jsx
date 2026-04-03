"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';

const ADMIN_EMAIL = "adminaapnexa@gmail.com";

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) router.replace('/');
    });
    return () => unsub();
  }, [router]);

  const getErrMsg = code => {
    const msgs = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return msgs[code] || 'Signup failed. Please try again.';
  };

  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setError('This email address is reserved for system administration.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Update Firebase Auth profile
      await updateProfile(cred.user, { displayName: fullName.trim() });

      // Write user profile to Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: fullName.trim(),
        email: cred.user.email,
        role: 'customer',
        createdAt: new Date().toISOString(),
      });
      router.replace('/');
    } catch (err) {
      setError(getErrMsg(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Inter,sans-serif' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}*{box-sizing:border-box}body{margin:0}input:focus{outline:none!important}`}</style>

      {/* Left Branding Panel */}
      <div style={{ flex:1, background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:60, color:'white', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', right:'-10%', width:400, height:400, background:'rgba(99,102,241,0.15)', borderRadius:'50%', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-10%', width:350, height:350, background:'rgba(139,92,246,0.12)', borderRadius:'50%', filter:'blur(50px)' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:400, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✨</div>
          <h1 style={{ fontSize:32, fontWeight:800, margin:'0 0 12px', letterSpacing:-1, textTransform:'none' }}>Join Aapnexa</h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:40 }}>Create your account and enjoy exclusive benefits — order tracking, early sale access, and more.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {['📱 Track orders in real-time','🎁 Early access to sales','💬 WhatsApp checkout support'].map(t=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.05)', padding:'12px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'#fafafa' }}>
        <div style={{ width:'100%', maxWidth:400, animation:'fadeUp 0.45s ease both' }}>
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:26, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:-0.5, textTransform:'none' }}>Create your account</h2>
            <p style={{ color:'#94a3b8', fontSize:14, marginTop:8 }}>Join thousands of Aapnexa shoppers</p>
          </div>

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Full Name</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required autoComplete="name"
                placeholder="Rahul Sharma"
                style={{ width:'100%', padding:'12px 16px', border:`1.5px solid ${error && fullName.length < 2 ? '#fca5a5' : '#e2e8f0'}`, borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', background:'white' }}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=error && fullName.length < 2 ? '#fca5a5' : '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                placeholder="you@example.com"
                style={{ width:'100%', padding:'12px 16px', border:`1.5px solid ${error && (email.length<5 || !email.includes('@')) ? '#fca5a5' : '#e2e8f0'}`, borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', background:'white' }}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=error && (email.length<5 || !email.includes('@')) ? '#fca5a5' : '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"
                  placeholder="At least 6 characters"
                  style={{ width:'100%', padding:'12px 48px 12px 16px', border:`1.5px solid ${error && password.length<6 ? '#fca5a5' : '#e2e8f0'}`, borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', background:'white', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=error && password.length<6? '#fca5a5' : '#e2e8f0'}
                />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:13, padding:4 }}>
                  {showPw?'Hide':'Show'}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop:6, display:'flex', gap:4 }}>
                  {[1,2,3].map(lvl=>(
                    <div key={lvl} style={{ flex:1, height:3, borderRadius:3, background: password.length>=lvl*3 ? (password.length>=9?'#059669':password.length>=6?'#d97706':'#dc2626') : '#e2e8f0', transition:'background 0.3s' }} />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'12px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ padding:'14px', borderRadius:10, border:'none', background:loading?'#94a3b8':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', fontWeight:700, fontSize:15, cursor:loading?'not-allowed':'pointer', fontFamily:'Inter,sans-serif', boxShadow:loading?'none':'0 4px 14px rgba(99,102,241,0.35)', marginTop:4, transition:'all 0.2s' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p style={{ fontSize:12, color:'#94a3b8', textAlign:'center', lineHeight:1.5 }}>
              By creating an account, you agree to our terms of service.
            </p>
          </form>

          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10, textAlign:'center' }}>
            <Link href="/login" style={{ fontSize:14, color:'#374151', textDecoration:'none', fontWeight:600 }}>
              Already have an account? <span style={{ color:'#6366f1' }}>Sign in</span>
            </Link>
            <Link href="/" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none' }}>
              Skip for now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
