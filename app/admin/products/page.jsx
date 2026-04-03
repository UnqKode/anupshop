"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAdminGuard } from '../../../lib/auth';
import AdminSidebar from '../../../components/AdminSidebar';

const CATEGORIES = ['jeans','tshirts','roundneck','shirts','pants','lowers','blazers','hoodies','bermuda','jackets','electronics','sale'];
const ALL_SIZES = ['XS','S','M','L','XL','XXL'];

const EMPTY_COLOR = { name: '', image: '' };
const DEFAULT_COLORS = Array.from({ length: 10 }, () => ({ ...EMPTY_COLOR }));
const EMPTY_FORM = { name: '', category: 'jeans', price: '', originalPrice: '', image: '', description: '', sizes: ['S','M','L','XL'], stock: '', featured: false, colors: DEFAULT_COLORS };

export default function AdminProducts() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAdminGuard(router);
  const [collapsed, setCollapsed] = useState(false);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, 'products'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setProducts(data);
    });
    return () => unsub();
  }, [isAdmin]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleSize = sz => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(sz) ? f.sizes.filter(s => s !== sz) : [...f.sizes, sz],
    }));
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setPanelOpen(true); };
  const openEdit = p => {
    const existingColors = p.colors || [];
    // Pad up to 10 slots
    const paddedColors = [
      ...existingColors,
      ...Array.from({ length: Math.max(0, 10 - existingColors.length) }, () => ({ ...EMPTY_COLOR })),
    ];
    setForm({
      name: p.name || '', category: p.category || 'jeans',
      price: p.price || '', originalPrice: p.originalPrice || '',
      image: p.image || '', description: p.description || '',
      sizes: p.sizes || ['S','M','L','XL'],
      stock: p.stock ?? '', featured: p.featured || false,
      colors: paddedColors,
    });
    setEditingId(p.id);
    setPanelOpen(true);
  };

  // Color variant helpers
  const addColor = () => setForm(f => ({ ...f, colors: [...f.colors, { ...EMPTY_COLOR }] }));
  const removeColor = i => setForm(f => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }));
  const updateColor = (i, field, val) => setForm(f => ({ ...f, colors: f.colors.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));
  const closePanel = () => { setPanelOpen(false); setTimeout(() => { setForm(EMPTY_FORM); setEditingId(null); }, 300); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price) || 0,
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        image: form.image.trim(),
        description: form.description.trim(),
        sizes: form.sizes,
        stock: form.stock !== '' ? parseInt(form.stock) : null,
        featured: form.featured,
        colors: form.colors.filter(c => c.name && c.image),
      };
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
        showToast('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), { ...payload, createdAt: new Date().toISOString() });
        showToast('Product added to catalog!');
      }
      closePanel();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast('Product removed.');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const sidebarW = collapsed ? 68 : 256;

  const filteredProducts = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (authLoading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f1f5f9' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        @keyframes slideInRight { from{transform:translateX(100%);}to{transform:translateX(0);} }
        @keyframes slideOutRight { from{transform:translateX(0);}to{transform:translateX(100%);} }
        @keyframes toastIn { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .prod-row:hover { background: #f8fafc !important; }
        .admin-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        .size-btn:hover { border-color: #6366f1 !important; color: #6366f1 !important; }
      `}</style>

      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#dc2626' : '#059669',
          padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'toastIn 0.3s ease',
        }}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>
      )}

      <main style={{
        marginLeft: sidebarW, flex: 1, padding: '36px 40px',
        transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
        animation: 'fadeSlideUp 0.4s ease both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: -0.5, textTransform: 'none' }}>Product Catalog</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{products.length} products · {products.filter(p=>p.featured).length} featured</p>
          </div>
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" placeholder="🔍  Search products…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input"
            style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, width: 260, outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>

        {/* Products Table */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Product','Category','Price','Stock','Sizes','Featured','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 18px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, background: '#fafafa', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#cbd5e1', fontSize: 14 }}>
                  {search || filterCat !== 'all' ? 'No products match your filters.' : 'No products yet. Click "Add Product" to get started.'}
                </td></tr>
              ) : filteredProducts.map(p => (
                <tr key={p.id} className="prod-row" style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src={p.image} alt={p.name} style={{ width: 52, height: 64, objectFit: 'cover', borderRadius: 8, background: '#f1f5f9', flexShrink: 0 }} onError={e => { e.target.src = 'https://placehold.co/52x64?text=?'; }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', textTransform: 'capitalize' }}>{p.name}</div>
                      {p.originalPrice && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Was ₹{p.originalPrice}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, fontSize: 15, color: '#0f172a' }}>₹{p.price}</td>
                  <td style={{ padding: '12px 18px' }}>
                    {p.stock != null
                      ? <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: p.stock > 10 ? '#d1fae5' : p.stock > 0 ? '#fef3c7' : '#fee2e2', color: p.stock > 10 ? '#059669' : p.stock > 0 ? '#d97706' : '#dc2626', fontSize: 12, fontWeight: 700 }}>{p.stock > 0 ? p.stock + ' left' : 'Out of stock'}</span>
                      : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#64748b' }}>{(p.sizes || ['S','M','L','XL']).join(', ')}</td>
                  <td style={{ padding: '12px 18px' }}>
                    {p.featured ? <span style={{ color: '#f59e0b', fontSize: 18 }}>★</span> : <span style={{ color: '#e2e8f0', fontSize: 18 }}>☆</span>}
                  </td>
                  <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(p)} style={{ padding: '7px 14px', marginRight: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.15s' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '7px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Slide-Over Overlay */}
      {panelOpen && <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, backdropFilter: 'blur(3px)' }} />}

      {/* Slide-Over Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 560, maxWidth: '95vw',
        background: 'white', zIndex: 201,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Panel Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'none', letterSpacing: -0.3 }}>
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>Fill in the details below</p>
          </div>
          <button onClick={closePanel} style={{ background: '#f1f5f9', border: 'none', borderRadius: 9, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#64748b' }}>
            ×
          </button>
        </div>

        {/* Panel Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Image URL + Preview */}
          <div>
            <label style={lblStyle}>Product Image URL</label>
            <input className="admin-input" type="url" value={form.image} onChange={e => handleFormChange('image', e.target.value)} required placeholder="https://…" style={inputStyle} />
            {form.image && (
              <div style={{ marginTop: 10, position: 'relative', borderRadius: 10, overflow: 'hidden', height: 180, background: '#f1f5f9' }}>
                <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = 'https://placehold.co/560x180?text=Invalid+URL'; }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>PREVIEW</div>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label style={lblStyle}>Product Name</label>
            <input className="admin-input" type="text" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required placeholder="e.g. Slim Fit Black Jeans" style={inputStyle} />
          </div>

          {/* Category */}
          <div>
            <label style={lblStyle}>Category</label>
            <select value={form.category} onChange={e => handleFormChange('category', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>

          {/* Price Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lblStyle}>Selling Price (₹)</label>
              <input className="admin-input" type="number" min="1" step="0.01" value={form.price} onChange={e => handleFormChange('price', e.target.value)} required placeholder="799" style={inputStyle} />
            </div>
            <div>
              <label style={lblStyle}>Original Price (₹) <span style={{ fontWeight: 400, color: '#94a3b8' }}>optional</span></label>
              <input className="admin-input" type="number" min="0" step="0.01" value={form.originalPrice} onChange={e => handleFormChange('originalPrice', e.target.value)} placeholder="1299" style={inputStyle} />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label style={lblStyle}>Stock Quantity <span style={{ fontWeight: 400, color: '#94a3b8' }}>optional</span></label>
            <input className="admin-input" type="number" min="0" value={form.stock} onChange={e => handleFormChange('stock', e.target.value)} placeholder="e.g. 50" style={inputStyle} />
          </div>

          {/* Sizes */}
          <div>
            <label style={lblStyle}>Available Sizes</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {ALL_SIZES.map(sz => (
                <button key={sz} type="button" className="size-btn" onClick={() => toggleSize(sz)} style={{
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${form.sizes.includes(sz) ? '#6366f1' : '#e2e8f0'}`,
                  background: form.sizes.includes(sz) ? 'rgba(99,102,241,0.08)' : 'white',
                  color: form.sizes.includes(sz) ? '#6366f1' : '#64748b',
                  fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                }}>{sz}</button>
              ))}
            </div>
          </div>

          {/* Featured */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fafafa', borderRadius: 10, border: '1.5px solid #e2e8f0', cursor: 'pointer' }} onClick={() => handleFormChange('featured', !form.featured)}>
            <div style={{
              width: 42, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
              background: form.featured ? '#6366f1' : '#e2e8f0', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, left: form.featured ? 21 : 3,
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Featured Product</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Appears prominently on the homepage</div>
            </div>
          </div>

          {/* Color Variants */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...lblStyle, marginBottom: 0 }}>Colour Variants <span style={{ fontWeight: 400, color: '#94a3b8' }}>optional</span></label>
              <button type="button" onClick={addColor} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #6366f1', background: 'rgba(99,102,241,0.07)', color: '#6366f1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Colour</button>
            </div>
            {form.colors.length === 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: '10px 0' }}>No variants yet. Click "+ Add Colour" to add same product in different colours.</div>
            )}
            {form.colors.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <input
                  className="admin-input" type="text" placeholder="Colour name (e.g. Red)" value={c.name}
                  onChange={e => updateColor(i, 'name', e.target.value)}
                  style={{ ...inputStyle, padding: '8px 12px' }}
                />
                <input
                  className="admin-input" type="url" placeholder="Image URL for this colour" value={c.image}
                  onChange={e => updateColor(i, 'image', e.target.value)}
                  style={{ ...inputStyle, padding: '8px 12px' }}
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {c.image && <img src={c.image} alt={c.name} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }} onError={e => { e.target.style.display='none'; }} />}
                  <button type="button" onClick={() => removeColor(i)} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label style={lblStyle}>Description</label>
            <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} rows={4} required placeholder="Describe the product — material, fit, care instructions…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add to Catalog'}
            </button>
            <button type="button" onClick={closePanel} style={{
              padding: '14px 20px', borderRadius: 10,
              background: '#f1f5f9', border: 'none', color: '#64748b',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lblStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', background: 'white', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
