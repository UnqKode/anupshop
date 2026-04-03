"use client";
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useToast } from '../lib/ToastContext';
import { getTranslation } from '../lib/translations';

const ADMIN_EMAIL = "adminaapnexa@gmail.com";

function NavbarContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initFilter = searchParams.get('category') || 'all';
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [user, setUser] = useState(null);
  const [navHidden, setNavHidden] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const lastScrollY = useRef(0);
  
  // Account Dropdown State
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  // More Dropdown State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef(null);

  // Coupon system
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [couponError, setCouponError] = useState('');
  const VALID_COUPONS = { 'AAPNEXA10': 10, 'WELCOME10': 10 };

  // Live Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [allProductsCache, setAllProductsCache] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);

  const [lang, setLang] = useState('en');

  useEffect(() => {
    const updateLang = () => {
      setLang(localStorage.getItem('aapnexa_lang') || 'en');
    };
    updateLang();
    window.addEventListener('lang_changed', updateLang);
    return () => window.removeEventListener('lang_changed', updateLang);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setNavScrolled(y > 10);
          if (y > lastScrollY.current && y > 80) {
            setNavHidden(true); 
          } else {
            setNavHidden(false); 
          }
          lastScrollY.current = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchFocused && allProductsCache.length === 0) {
      const loadProducts = async () => {
        try {
          const snap = await getDocs(collection(db, 'products'));
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllProductsCache(data);
        } catch (e) {
          console.error("Search cache error:", e);
        }
      };
      loadProducts();
    }
  }, [isSearchFocused, allProductsCache.length]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const results = allProductsCache.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 6); 
    setSearchResults(results);
  }, [searchQuery, allProductsCache]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getCart = () => JSON.parse(localStorage.getItem('aapnexa_cart')) || [];
    setCartCount(getCart().reduce((acc, item) => acc + item.quantity, 0));
    setCartItems(getCart());
    const handleStorage = () => {
      const c = getCart();
      setCartCount(c.reduce((acc, item) => acc + item.quantity, 0));
      setCartItems(c);
    };
    const handleOpenCart = () => setShowCart(true);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart_updated', handleStorage);
    window.addEventListener('open_cart', handleOpenCart);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart_updated', handleStorage);
      window.removeEventListener('open_cart', handleOpenCart);
    };
  }, []);

  const handleRemoveItem = (index) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    localStorage.setItem('aapnexa_cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cart_updated'));
  };

  useEffect(() => {
    if (showCart) {
      const saved = localStorage.getItem('aapnexa_coupon');
      if (saved && VALID_COUPONS[saved] && !appliedCoupon) {
        setAppliedCoupon({ code: saved, discount: VALID_COUPONS[saved] });
        setCouponInput(saved);
      }
    }
  }, [showCart]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, discount: VALID_COUPONS[code] });
      localStorage.setItem('aapnexa_coupon', code);
      addToast(`Coupon "${code}" applied successfully!`, 'success');
    } else {
      addToast('Invalid coupon code. Try AAPNEXA10', 'error');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    localStorage.removeItem('aapnexa_coupon');
  };

  const handleQtyChange = (index, delta) => {
    const newItems = [...cartItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    localStorage.setItem('aapnexa_cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const handleCheckoutViaWhatsApp = () => {
    if (cartItems.length === 0) return;
    let billText = `*Aapnexa Cart Checkout (${lang})*\n\n`;
    let subtotal = 0;
    cartItems.forEach((item, i) => {
      billText += `${i+1}. ${item.name} (Size: ${item.size}${item.color ? ', Color: ' + item.color : ''}) - ${item.quantity} x ₹${item.price}\n`;
      subtotal += (item.quantity * parseFloat(item.price));
    });
    if (appliedCoupon) {
      const saving = Math.round(subtotal * appliedCoupon.discount / 100);
      billText += `\n*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}`;
      billText += `\n*Coupon (${appliedCoupon.code}):* -₹${saving.toLocaleString('en-IN')} (${appliedCoupon.discount}% off)`;
      billText += `\n*Total Payable:* ₹${(subtotal - saving).toLocaleString('en-IN')}`;
    } else {
      billText += `\n*Total Amount:* ₹${subtotal.toLocaleString('en-IN')}`;
    }
    billText += `\n\nPlease help me complete my order!`;
    window.location.href = `https://wa.me/919608751759?text=${encodeURIComponent(billText)}`;
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowAccountMenu(false);
    router.push('/');
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const cartDiscount = appliedCoupon ? Math.round(cartSubtotal * appliedCoupon.discount / 100) : 0;
  const cartTotal = cartSubtotal - cartDiscount;

  const isHome = pathname === '/';
  const isProducts = pathname.startsWith('/products') || pathname.startsWith('/product/');
  const isOrders = pathname.startsWith('/orders') || pathname.startsWith('/profile');
  const isLogin = pathname.startsWith('/login') || pathname.startsWith('/signup');

  const statusMap = getTranslation(lang, 'status') || {};

  return (
    <>
      <style>{`
        .navbar-wrap { position: sticky; top: 0; z-index: 100; transform: translateY(0); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s; will-change: transform; backface-visibility: hidden; }
        .navbar-wrap.hidden { transform: translateY(-100%); }
        .navbar-wrap.scrolled .navbar { box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-bottom: 0px; }
        .logo-text { font-family: var(--font-serif); font-weight: 800; font-size: 26px; color: #111; letter-spacing: -0.5px; }
        .nav-search input { font-family: var(--font-main) !important; border:none; outline:none; flex:1; padding:0 15px; font-size:15px; height:48px; }
        .nav-search-container { display:flex; align-items:stretch; background:#fff; border-radius:8px; overflow:hidden; border:2px solid #0f172a; width:100%; height:48px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .search-cat-wrapper { position: relative; display: flex; align-items: center; background: #f3f3f3; border-right: 1px solid #ddd; padding-right: 25px; }
        .search-cat-select { background:transparent; border:none; padding:0 10px 0 15px; font-size:13px; fontWeight:700; color:#444; cursor:pointer; outline:none; height:100%; appearance:none; -webkit-appearance:none; width: auto; z-index: 2; position: relative; }
        .search-cat-wrapper i { position: absolute; right: 10px; font-size: 10px; color: #666; pointer-events: none; z-index: 1; }
        .search-cat-wrapper:hover { background:#e3e3e3; }
        .search-go-btn { background:#febd69; border:none; width:55px; display:flex; align-items:center; justify-content:center; cursor:pointer; height:100%; transition:background 0.2s; }
        .search-go-btn:hover { background:#f3a847; }
        .search-go-btn i { color:#111; font-size:20px; }
        
        /* Sidebar & Global Toggle */
        .nav-all-btn { display: flex; align-items: center; gap: 8px; padding: 0 15px; color: #fff; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; height: 100%; font-size: 14px; }
        .nav-all-btn:hover { border-color: #febd69; }
        .nav-all-btn i { font-size: 20px; }
        
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 5000; animation: fadeIn 0.3s ease; }
        .sidebar { position: fixed; top: 0; left: -365px; width: 365px; max-width: 85vw; height: 100vh; background: #fff; z-index: 5001; transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1); overflow-y: auto; box-shadow: 10px 0 30px rgba(0,0,0,0.2); }
        .sidebar.open { left: 0; }
        .sidebar-header { background: #232f3e; padding: 20px 30px; color: #fff; display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; position: sticky; top: 0; z-index: 10; }
        .sidebar-section-title { padding: 20px 30px 10px; font-size: 15px; font-weight: 800; color: #111; text-transform: uppercase; border-top: 1px solid #eaeded; }
        .sidebar-section-title:first-child { border-top: none; }
        .sidebar-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 30px; color: #444; font-size: 15px; font-weight: 500; text-decoration: none; transition: background 0.2s; cursor: pointer; }
        .sidebar-item:hover { background: #eaeded; }
        .sidebar-close { position: fixed; left: 375px; top: 20px; color: #fff; font-size: 36px; cursor: pointer; z-index: 5002; transition: opacity 0.3s; opacity: 0; pointer-events: none; }
        .sidebar-close.show { opacity: 1; pointer-events: auto; }
        
        .nav-bottom { background: #232f3e; color: #fff; height: 42px; display: flex; align-items: center; gap: 4px; padding: 0 15px; overflow-x: auto; scrollbar-width: none; }
        .nav-bottom::-webkit-scrollbar { display: none; }
        .nav-bottom-item { color: #fff; border: 1px solid transparent; padding: 0 12px; display: flex; align-items: center; height: 100%; fontSize: 13px; fontWeight: 600; whiteSpace: nowrap; cursor: pointer; transition: all 0.2s; }
        .nav-bottom-item:hover { border-color: #fff; }
        .cd-qty-btn { width:32px;height:32px;border-radius:0;border:1px solid #ddd;background:#fff;color:#111;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s; }
        .cd-qty-btn:hover { border-color:#000;background:#000;color:#fff; }
        .mobile-bottom-nav { display:none; }
        .account-dropdown {
          position: absolute; top: 100%; right: 0; background: white; border: 1px solid #f1f5f9; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(15,23,42,0.12); min-width: 200px; padding: 8px 0; z-index: 2000;
          animation: modalPop 0.2s cubic-bezier(0.4, 0, 0.2, 1); margin-top: 10px;
        }
        .account-item {
          display: flex; alignItems: center; gap: 12px; padding: 12px 20px; text-decoration: none;
          color: #334155; font-size: 14px; font-weight: 600; transition: all 0.15s; cursor: pointer;
        }
        .account-item:hover { background: #f8fafc; color: #6366f1; }
        .account-item.logout { color: #dc2626; border-top: 1px solid #f1f5f9; margin-top: 4px; padding-top: 16px; }
        .account-item.logout:hover { background: #fee2e2; }
        
        .nav-account-btn {
          display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; border-radius: 10px;
          transition: all 0.2s; position: relative;
        }
        .nav-account-btn:hover { background: #f1f5f9; }

        @media (max-width: 640px) {
          .mobile-bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 990; background: #050505; padding: 10px 0 env(safe-area-inset-bottom, 10px); box-shadow: 0 -10px 30px rgba(0,0,0,0.3); }
          .mob-nav-item { flex: 1; display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s; }
          .mob-nav-item.active { color:var(--color-gold); }
          .mob-nav-item i { font-size:18px; margin-bottom: 2px; }
          .mob-nav-cart-badge { position:absolute;top:-6px;right:calc(50% - 22px);background:#ff9900;color:#000;font-size:9px;font-weight:900;height:16px;min-width:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid #050505; }
        }
        .cart-icon-wrapper { display: flex; align-items: center; gap: 8px; cursor: pointer; position: relative; padding: 10px; border-radius: 12px; transition: all 0.2s; }
        .cart-icon-wrapper:hover { background: #f1f5f9; }
        .cart-icon-wrapper i { fontSize: 22px; color: #0f172a; }
        .cart-text { font-size: 14px; fontWeight: 800; color: #0f172a; margin-top: 4px; }
        .desktop-cart-badge { position: absolute; top: 2px; left: 24px; background: #ff9900; color: #0f172a; font-size: 10px; font-weight: 900; height: 18px; min-width: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(255, 153, 0, 0.3); }
      `}</style>

      <div className={`navbar-wrap${navHidden ? ' hidden' : ''}${navScrolled ? ' scrolled' : ''}`}>
        <div className="promo-bar">
          <div className="promo-track">
            {getTranslation(lang, 'promo')} &nbsp;&nbsp;|&nbsp;&nbsp; {getTranslation(lang, 'promo')}
          </div>
        </div>
        <nav className="navbar">
          <Link href="/" className="logo-container">
            <img src="/logo.png" alt="Aapnexa Logo" />
            <span className="logo-text">Aapnexa</span>
          </Link>
          
          <div ref={searchWrapperRef} style={{ flexGrow: 1, maxWidth: '800px', margin: '0 40px', position: 'relative' }}>
            <form className="nav-search" onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setIsSearchFocused(false);
                router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }} style={{ position: 'relative', width:'100%' }}>
              <div className="nav-search-container">
                <div className="search-cat-wrapper">
                  <select className="search-cat-select" defaultValue="all" onChange={(e) => {
                    if (e.target.value === 'all') router.push('/products');
                    else router.push(`/products?category=${e.target.value}`);
                  }}>
                    <option value="all">All</option>
                    {['jeans','tshirts','roundneck','shirts','pants','lowers','blazers','hoodies','bermuda','jackets','electronics','sale'].map(cat => (
                      <option key={cat} value={cat}>{getTranslation(lang, 'categories')[cat] || cat.toUpperCase()}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-caret-down"></i>
                </div>
                <input
                  type="text" name="search"
                  autoComplete="off"
                  placeholder={`Search Aapnexa`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                <button type="submit" className="search-go-btn">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>
              </div>
            </form>

            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:8, background:'#fff', borderRadius:16, boxShadow:'0 10px 40px rgba(0,0,0,0.1)', border:'1px solid #f3f4f6', overflow:'hidden', zIndex:1000, animation:'modalPop 0.2s ease' }}>
                {searchResults.length > 0 ? (
                  <div style={{ maxHeight:400, overflowY:'auto' }}>
                    <div style={{ padding:'12px 16px', background:'#f8fafc', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid #f1f5f9' }}>
                      {getTranslation(lang, 'searchSuggested')}
                    </div>
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.id}`}
                        onClick={() => { setIsSearchFocused(false); setSearchQuery(''); }}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', textDecoration:'none', transition:'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={product.image || product.imageUrl || product.img || "https://placehold.co/100"} alt={product.name} style={{ width:40, height:40, borderRadius:8, objectFit:'cover', background:'#f1f5f9' }} />
                        <div style={{ flex:1, overflow:'hidden' }}>
                          <div style={{ fontSize:14, fontWeight:600, color:'#111', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{product.name}</div>
                          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{getTranslation(lang, 'categories')[product.category?.toLowerCase()] || product.category}</div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#f59e0b' }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</div>
                      </Link>
                    ))}
                    <div 
                      onClick={() => { setIsSearchFocused(false); router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`); }}
                      style={{ padding:'12px 16px', textAlign:'center', color:'#6366f1', fontSize:13, fontWeight:600, cursor:'pointer', background:'#f8fafc' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                      {getTranslation(lang, 'searchViewAll', { q: searchQuery })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'30px 20px', textAlign:'center', color:'#6b7280' }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{getTranslation(lang, 'searchNone')}</div>
                    <div style={{ fontSize:12, marginTop:4 }}>{getTranslation(lang, 'searchTry')}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="cart-icon-wrapper" onClick={() => setShowCart(true)}>
              <div style={{ position:'relative' }}>
                <i className="fa-solid fa-cart-shopping"></i>
                <span className="desktop-cart-badge" id="cart-count" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
              </div>
              <span className="cart-text">{getTranslation(lang, 'cart')}</span>
            </div>
            
            {user ? (
              <div ref={accountRef} style={{ position: 'relative' }}>
                <div className="nav-account-btn" onClick={() => setShowAccountMenu(!showAccountMenu)} onMouseEnter={() => setShowAccountMenu(true)}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, boxShadow:'0 2px 8px rgba(99,102,241,0.25)' }}>
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {user.displayName ? user.displayName.split(' ')[0] : 'Account'}
                  </div>
                  <i className={`fa-solid fa-chevron-down`} style={{ fontSize:10, color:'#94a3b8', transition:'transform 0.2s', transform: showAccountMenu ? 'rotate(180deg)' : 'none' }}></i>
                </div>

                {showAccountMenu && (
                  <div className="account-dropdown" onMouseLeave={() => setShowAccountMenu(false)}>
                    <div style={{ padding:'12px 20px', borderBottom:'1px solid #f1f5f9', marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>Logged in as</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginTop:2, overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
                    </div>
                    {user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? (
                      <Link href="/admin" className="account-item" onClick={() => setShowAccountMenu(false)}>
                        <i className="fa-solid fa-gears" style={{ width:16 }}></i> Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link href="/profile" className="account-item" onClick={() => setShowAccountMenu(false)}>
                          <i className="fa-solid fa-user-circle" style={{ width:16 }}></i> My Profile
                        </Link>
                        <Link href="/orders" className="account-item" onClick={() => setShowAccountMenu(false)}>
                          <i className="fa-solid fa-box-open" style={{ width:16 }}></i> My Orders
                        </Link>
                      </>
                    )}
                    <Link href="/track" className="account-item" onClick={() => setShowAccountMenu(false)}>
                       <i className="fa-solid fa-truck-fast" style={{ width:16 }}></i> Track Order
                    </Link>
                    <div className="account-item logout" onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket" style={{ width:16 }}></i> Logout
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" style={{ 
                fontSize: '14px', fontWeight: '800', background:'#0f172a', color:'white', 
                padding:'10px 24px', borderRadius:11, textDecoration:'none', transition:'all 0.2s',
                boxShadow:'0 4px 12px rgba(15,23,42,0.15)', display:'flex', alignItems:'center', gap:10
              }}>
                <i className="fa-regular fa-circle-user" style={{ fontSize:18 }}></i>
                {getTranslation(lang, 'login')}
              </Link>
            )}

            <div ref={moreRef} style={{ position: 'relative' }}>
               <div 
                 className="nav-more-btn" 
                 onClick={() => setShowMoreMenu(!showMoreMenu)} 
                 onMouseEnter={() => setShowMoreMenu(true)}
                 style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'8px 12px', borderRadius:10, transition:'all 0.2s' }}
               >
                  <span style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>{getTranslation(lang, 'navMore')}</span>
                  <i className={`fa-solid fa-chevron-down`} style={{ fontSize:10, color:'#94a3b8', transition:'transform 0.2s', transform: showMoreMenu ? 'rotate(180deg)' : 'none' }}></i>
               </div>

               {showMoreMenu && (
                 <div className="account-dropdown more" onMouseLeave={() => setShowMoreMenu(false)} style={{ minWidth:220 }}>
                    <Link href="/track" className="account-item" onClick={() => setShowMoreMenu(false)}>
                       <i className="fa-solid fa-truck-fast" style={{ width:16 }}></i> {getTranslation(lang, 'trackOrder')}
                    </Link>
                    <a href={`https://wa.me/919608751759?text=${encodeURIComponent("Hello Aapnexa! I'm interested in Business / Bulk Orders.")}`} target="_blank" rel="noopener noreferrer" className="account-item" onClick={() => setShowMoreMenu(false)}>
                       <i className="fa-solid fa-briefcase" style={{ width:16 }}></i> {getTranslation(lang, 'navBulk')}
                    </a>
                    <a href="https://wa.me/919608751759" target="_blank" rel="noopener noreferrer" className="account-item" onClick={() => setShowMoreMenu(false)}>
                       <i className="fa-solid fa-headset" style={{ width:16 }}></i> {getTranslation(lang, 'navSupport')}
                    </a>
                    <Link href="/#about" className="account-item" onClick={() => setShowMoreMenu(false)}>
                       <i className="fa-solid fa-circle-info" style={{ width:16 }}></i> {getTranslation(lang, 'navAbout')}
                    </Link>
                 </div>
               )}
            </div>
          </div>
        </nav>

        <div className="nav-bottom">
          <div className="nav-all-btn" onClick={() => setShowSidebar(true)}>
            <i className="fa-solid fa-bars"></i>
            <span style={{ marginLeft: 6 }}>All</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', height: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['jeans','tshirts','roundneck','shirts','pants','lowers','blazers','hoodies','bermuda','jackets','electronics','sale'].map(catId => (
              <Link 
                key={catId} 
                href={catId === 'all' ? '/products' : `/products?category=${catId}`} 
                className="nav-bottom-item"
                style={{ fontWeight: initFilter === catId ? '700' : '600' }}
              >
                {getTranslation(lang, 'categories')[catId] || catId.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Global Sidebar Drawer */}
      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}
      <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <i className="fa-solid fa-circle-user"></i>
          <span>Hello, {user?.displayName?.split(' ')[0] || 'Sign In'}</span>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section-title">Shop By Category</div>
          {['jeans','tshirts','roundneck','shirts','pants','lowers','blazers','hoodies','bermuda','jackets','electronics','sale'].map(cat => (
            <Link 
              key={cat} 
              href={cat === 'all' ? '/products' : `/products?category=${cat}`}
              className="sidebar-item"
              onClick={() => setShowSidebar(false)}
            >
              <span>{getTranslation(lang, 'categories')[cat] || cat.toUpperCase()}</span>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: 12, color: '#888' }}></i>
            </Link>
          ))}
          
          <div className="sidebar-section-title">Help & Settings</div>
          <Link href="/profile" className="sidebar-item" onClick={() => setShowSidebar(false)}>Your Account</Link>
          <div className="sidebar-item" onClick={() => { setLang(lang === 'english' ? 'hindi' : 'english'); setShowSidebar(false); localStorage.setItem('aapnexa_lang', lang === 'english' ? 'hindi' : 'english'); window.dispatchEvent(new Event('lang_changed')); }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <i className="fa-solid fa-globe"></i>
              <span>{lang === 'english' ? 'Hindi' : 'English'}</span>
            </div>
          </div>
          {user ? (
            <div className="sidebar-item" onClick={handleLogout}>Sign Out</div>
          ) : (
            <Link href="/login" className="sidebar-item" onClick={() => setShowSidebar(false)}>Sign In</Link>
          )}
        </div>
      </div>
      <i className={`fa-solid fa-xmark sidebar-close ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)}></i>

      {showCart && <div className="cart-overlay" onClick={() => setShowCart(false)}></div>}
      <div className={`cart-drawer ${showCart ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2>{getTranslation(lang, 'cart')} ({cartCount})</h2>
          <button className="close-cart-btn" onClick={() => setShowCart(false)}>&times;</button>
        </div>
        <div className="cart-drawer-items">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <i className="fa-solid fa-bag-shopping" style={{ fontSize: 40, marginBottom: 16, display: 'block', color: '#e2e8f0' }}></i>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#374151', marginBottom: 8 }}>{getTranslation(lang, 'cartEmpty')}</div>
              <div style={{ fontSize: 13 }}>{getTranslation(lang, 'cartAddItems')}</div>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div className="cart-drawer-item" key={`${item.id}-${idx}`} style={{ position: 'relative' }}>
                <img src={item.image || item.imageUrl || item.img || "https://placehold.co/100"} alt={item.name} />
                <div className="cd-info" style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ marginBottom: 3 }}>{item.name}</h4>
                  <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>Size: <b>{item.size}</b>{item.color && <> · Color: <b>{item.color}</b></>}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="cd-qty-btn" onClick={() => handleQtyChange(idx, -1)}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="cd-qty-btn" onClick={() => handleQtyChange(idx, +1)}>+</button>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: '#111' }}>₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button className="cd-remove-btn" title="Remove" onClick={() => handleRemoveItem(idx)} style={{ alignSelf: 'flex-start', marginLeft: 8 }}><i className="fa-solid fa-trash-can"></i></button>
              </div>
            ))
          )}
        </div>
        <div className="cart-drawer-footer">
          <div style={{ marginBottom:12 }}>
            {appliedCoupon ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#059669', fontSize:14 }}>🏷</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#059669' }}>{appliedCoupon.code} applied!</div>
                    <div style={{ fontSize:11, color:'#065f46' }}>You save ₹{cartDiscount.toLocaleString('en-IN')} ({appliedCoupon.discount}% off)</div>
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} style={{ background:'none', border:'none', color:'#6b7280', fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:6 }}>
                <input
                  type="text" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder={getTranslation(lang, 'couponPlaceholder')}
                  style={{ flex:1, padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', letterSpacing:0.5 }}
                />
                <button onClick={handleApplyCoupon} style={{ padding:'9px 14px', background:'#111', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}>{getTranslation(lang, 'apply')}</button>
              </div>
            )}
          </div>
          {appliedCoupon && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6b7280', marginBottom:6, padding:'0 2px' }}>
              <span>{getTranslation(lang, 'subtotal')}</span>
              <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {appliedCoupon && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#059669', fontWeight:600, marginBottom:6, padding:'0 2px' }}>
              <span>{getTranslation(lang, 'discount')} ({appliedCoupon.discount}%)</span>
              <span>-₹{cartDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="cd-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', marginBottom: '20px', borderTop: '2px solid #111', paddingTop: '15px', color: '#111', fontFamily: 'var(--font-main)', letterSpacing: '-0.5px' }}>
            <span>{getTranslation(lang, 'total')} {appliedCoupon ? getTranslation(lang, 'payable') : ''}</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <button className="cart-checkout-btn" disabled={cartItems.length === 0} onClick={handleCheckoutViaWhatsApp} style={{ width: '100%', background: 'var(--color-gold)', color: '#000', border: 'none', padding: '20px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(212, 175, 55, 0.2)' }}>
            <i className="fa-brands fa-whatsapp" style={{ fontSize: '20px' }}></i>
            {getTranslation(lang, 'buyNow')}
          </button>
        </div>
      </div>

      <nav className="mobile-bottom-nav">
        <Link href="/" className={`mob-nav-item${isHome ? ' active' : ''}`}><i className="fa-solid fa-house"></i>{getTranslation(lang, 'home')}</Link>
        <Link href="/products" className={`mob-nav-item${isProducts ? ' active' : ''}`}><i className="fa-solid fa-shirt"></i>{getTranslation(lang, 'shop')}</Link>
        <div className="mob-nav-item" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowCart(true)}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <i className="fa-solid fa-cart-shopping" style={{ fontSize: 20 }}></i>
            {cartCount > 0 && <span className="mob-nav-cart-badge">{cartCount}</span>}
          </div>
          {getTranslation(lang, 'cart')}
        </div>
        <Link href="/track" className={`mob-nav-item${pathname === '/track' ? ' active' : ''}`}><i className="fa-solid fa-truck-fast"></i>{getTranslation(lang, 'trackOrder')}</Link>
        <Link href={user ? '/profile' : '/login'} className={`mob-nav-item${isOrders || isLogin ? ' active' : ''}`}>
          <i className="fa-solid fa-user"></i>
          {user ? (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? getTranslation(lang, 'admin') : 'Account') : getTranslation(lang, 'login')}
        </Link>
      </nav>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="navbar"></nav>}>
      <NavbarContent />
    </Suspense>
  );
}
