"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAdminGuard } from '../../lib/auth';
import AdminSidebar from '../../components/AdminSidebar';

function StatCard({ label, value, sub, gradient, icon, loading }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '24px 28px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', gap: 18,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        width: 52, height: 52, flexShrink: 0,
        background: gradient,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5, fontFamily: 'Inter, sans-serif', textTransform: 'none' }}>
          {loading ? '—' : value}
        </div>
        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAdminGuard(router);
  const [collapsed, setCollapsed] = useState(false);

  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // if (!isAdmin) return;

    const unsub1 = onSnapshot(collection(db, 'products'), snap => {
      setStats(s => ({ ...s, products: snap.size }));
    });

    const unsub2 = onSnapshot(collection(db, 'orders'), snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const revenue = orders.reduce((acc, o) => acc + (parseFloat(o.price) || 0), 0);
      const pending = orders.filter(o => o.status === 'Processing').length;
      const delivered = orders.filter(o => o.status === 'Delivered').length;
      orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setStats(s => ({ ...s, orders: orders.length, revenue, pending, delivered }));
      setRecentOrders(orders.slice(0, 8));
      setDataLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, [isAdmin]);

  const sidebarW = collapsed ? 68 : 256;

  if (authLoading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Verifying access…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // if (!isAdmin) return null;

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const STATUS_STYLE = {
    Processing: { background: '#fef3c7', color: '#d97706' },
    Shipped: { background: '#dbeafe', color: '#2563eb' },
    Delivered: { background: '#d1fae5', color: '#059669' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f1f5f9' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:none; } }
        .dash-fade { animation: fadeSlideUp 0.4s ease both; }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className="dash-fade" style={{
        marginLeft: sidebarW, flex: 1,
        minHeight: '100vh', padding: '36px 40px',
        transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: -0.5, textTransform: 'none' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{today}</p>
          </div>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10,
            background: 'white', color: '#374151',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            View Store
          </a>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 36 }}>
          <StatCard label="Total Products" value={stats.products} sub="In your catalog" icon="👕" gradient="linear-gradient(135deg,#667eea,#764ba2)" loading={dataLoading} />
          <StatCard label="Total Orders" value={stats.orders} sub="All time" icon="📦" gradient="linear-gradient(135deg,#f093fb,#f5576c)" loading={dataLoading} />
          <StatCard label="Gross Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} sub="From all orders" icon="💰" gradient="linear-gradient(135deg,#4facfe,#00f2fe)" loading={dataLoading} />
          <StatCard label="Pending Orders" value={stats.pending} sub="Awaiting dispatch" icon="⏳" gradient="linear-gradient(135deg,#43e97b,#38f9d7)" loading={dataLoading} />
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 36, flexWrap: 'wrap' }}>
          <a href="/admin/products" style={{
            padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
            fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
            background: '#6366f1', color: 'white',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'transform 0.18s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            + Add Product
          </a>
          <a href="/admin/orders" style={{
            padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
            fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
            background: 'white', color: '#0f172a', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'transform 0.18s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            📦 Manage Orders & Status
          </a>
        </div>

        {/* Recent Orders Table */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'none', letterSpacing: 0 }}>Recent Orders</h2>
            <a href="/admin/orders" style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Customer', 'Product', 'Price', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} style={{ padding: '14px 20px' }}>
                          <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: j === 0 ? 140 : j === 1 ? 110 : 60, animation: 'pulse 1.5s ease infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: '#cbd5e1', fontSize: 14 }}>No orders yet.</td></tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.userEmail}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{order.productName}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>₹{order.price}</td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8' }}>{fmtDate(order.orderDate)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700,
                          ...(STATUS_STYLE[order.status] || { background: '#f1f5f9', color: '#64748b' }),
                        }}>{order.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
