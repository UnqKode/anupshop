"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAdminGuard } from '../../../lib/auth';
import AdminSidebar from '../../../components/AdminSidebar';

export default function AdminOrders() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAdminGuard(router);
  const [collapsed, setCollapsed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'orders'), orderBy('orderDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error("Update Status Error:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  if (authLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Verifying admin access...</div>;
  if (!isAdmin) return null;

  const sidebarW = collapsed ? 68 : 256;

  const STATUS_OPTIONS = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  const getStatusColor = (s) => {
    const status = (s || '').toLowerCase();
    if (status === 'processing') return { bg: '#fef3c7', text: '#d97706' };
    if (status === 'packed') return { bg: '#e0f2fe', text: '#0369a1' };
    if (status === 'shipped') return { bg: '#dbeafe', text: '#2563eb' };
    if (status === 'delivered') return { bg: '#d1fae5', text: '#059669' };
    if (status === 'cancelled') return { bg: '#fee2e2', text: '#dc2626' };
    return { bg: '#f1f5f9', text: '#64748b' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main style={{ marginLeft: sidebarW, flex: 1, padding: '36px 40px', transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>Manage Orders</h1>
          <div style={{ display:'flex', gap:10 }}>
             <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Refresh Data</button>
             <a href="/admin" style={{ padding: '10px 18px', borderRadius: 10, background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Overview Dashboard</a>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Order ID', 'Customer Info', 'Items', 'Final Price', 'Date', 'Status Update'].map(h => (
                   <th key={h} style={{ textAlign:'left', padding:'16px 24px', fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading all orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="6" style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No orders found yet.</td></tr>
              ) : (
                orders.map((order) => {
                  const colors = getStatusColor(order.status);
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                      <td style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>#{order.id.slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{order.userPhone}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{order.userEmail}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                         <div style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{order.productName}</div>
                         <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Size: {order.size} {order.color && `· ${order.color}`}</div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>₹{order.price}</td>
                      <td style={{ padding: '20px 24px', fontSize: 12, color: '#94a3b8' }}>{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <select 
                          value={order.status || 'Processing'} 
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{
                             padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', 
                             background: colors.bg, color: colors.text, fontWeight: 700, fontSize: 12,
                             outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
