"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const w = collapsed ? 68 : 256;

  return (
    <aside style={{
      width: w,
      minWidth: w,
      background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)',
      color: 'white',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '4px 0 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '22px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}>🏪</div>
        <div style={{
          overflow: 'hidden', whiteSpace: 'nowrap',
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 0.18s',
          pointerEvents: collapsed ? 'none' : 'auto',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.2 }}>Aapnexa</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>Seller Dashboard</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px',
              borderRadius: 10,
              color: isActive ? '#c7d2fe' : '#94a3b8',
              textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              background: isActive
                ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.12))'
                : 'transparent',
              border: `1px solid ${isActive ? 'rgba(99,102,241,0.28)' : 'transparent'}`,
              overflow: 'hidden', whiteSpace: 'nowrap',
              transition: 'background 0.18s, color 0.18s, border-color 0.18s',
            }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 20 }}>
                {item.icon}
              </span>
              <span style={{
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 0.15s',
                pointerEvents: collapsed ? 'none' : 'auto',
              }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 4px' }} />

        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 12px', borderRadius: 10,
          color: '#64748b', textDecoration: 'none',
          fontSize: 14, fontWeight: 500,
          overflow: 'hidden', whiteSpace: 'nowrap',
          transition: 'color 0.18s',
        }}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}>View Store</span>
        </Link>
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, color: '#64748b',
          cursor: 'pointer', fontSize: 13,
          overflow: 'hidden', whiteSpace: 'nowrap',
          transition: 'background 0.18s, color 0.18s',
        }}>
          <span style={{ flexShrink: 0, fontSize: 14, transition: 'transform 0.28s', display: 'inline-block', transform: collapsed ? 'rotate(180deg)' : 'none' }}>
            ←
          </span>
          <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}>Collapse</span>
        </button>

        {/* Sign out */}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 8, color: '#f87171',
          cursor: 'pointer', fontSize: 13,
          overflow: 'hidden', whiteSpace: 'nowrap',
          transition: 'background 0.18s',
        }}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
