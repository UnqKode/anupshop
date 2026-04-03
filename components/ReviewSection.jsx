import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getTranslation } from '../lib/translations';

const StarRating = ({ rating, setRating, interactive = false }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        onClick={() => interactive && setRating(star)}
        style={{
          fontSize: interactive ? 24 : 14,
          cursor: interactive ? 'pointer' : 'default',
          color: star <= rating ? '#f59e0b' : '#cbd5e1',
          transition: 'transform 0.1s'
        }}
        onMouseEnter={e => interactive && (e.currentTarget.style.transform = 'scale(1.2)')}
        onMouseLeave={e => interactive && (e.currentTarget.style.transform = 'scale(1)')}
      >
        ★
      </span>
    ))}
  </div>
);

const ReviewSection = ({ productId, lang = 'en' }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // ── Photo Upload State ──
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    } catch (e) {
      console.error("Reviews fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `reviews/${productId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => reject(error), 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName || !comment) return;
    setSubmitting(true);
    
    try {
      let reviewImageUrl = '';
      if (imageFile) {
        reviewImageUrl = await uploadImage(imageFile);
      }

      await addDoc(collection(db, 'reviews'), {
        productId,
        userName,
        rating,
        comment,
        reviewImageUrl,
        createdAt: serverTimestamp(),
      });
      
      setUserName('');
      setComment('');
      setRating(5);
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      setShowForm(false);
      fetchReviews();
    } catch (e) {
      console.error("Submit error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 60, padding: '40px 0', borderTop: '1px solid #f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>{getTranslation(lang, 'reviews')}</h2>
          <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'} for this product
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: '#fff',
            border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14,
            boxShadow: '0 10px 20px rgba(15,23,42,0.1)'
          }}
        >
          {showForm ? 'Close' : getTranslation(lang, 'writeReview')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 32, borderRadius: 20, marginBottom: 40, border: '1px solid #f1f5f9', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>{getTranslation(lang, 'ratingLabel')}</label>
            <StarRating rating={rating} setRating={setRating} interactive />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>{getTranslation(lang, 'nameLabel')}</label>
              <input
                required
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Rahul"
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>{getTranslation(lang, 'commentLabel')}</label>
            <textarea
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Love the quality..."
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', minHeight: 100 }}
            />
          </div>

          {/* ── Photo Capture UI ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>{getTranslation(lang, 'addPhoto')}</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
            
            {imagePreview ? (
              <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 16, overflow: 'hidden', border: '2px solid #6366f1' }}>
                <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}
                >×</button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{ width: 60, height: 60, borderRadius: 16, border: '2px dashed #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#94a3b8' }}
              >
                <i className="fa-solid fa-camera"></i>
              </button>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{getTranslation(lang, 'uploading', { n: uploadProgress })}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '16px 32px', borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', width: '100%' }}
          >
            {submitting ? 'Sending...' : getTranslation(lang, 'submitReview')}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>{getTranslation(lang, 'noReviews')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {reviews.map((rev) => (
            <div key={rev.id} style={{ padding: '32px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{rev.userName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{rev.createdAt?.toDate().toLocaleDateString()}</div>
                </div>
                <StarRating rating={rev.rating} />
              </div>
              <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15, margin: '0 0 16px' }}>{rev.comment}</p>
              
              {rev.reviewImageUrl && (
                <div 
                  onClick={() => setExpandedImage(rev.reviewImageUrl)}
                  style={{ width: 100, height: 100, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'transform 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img src={rev.reviewImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox Modal ── */}
      {expandedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setExpandedImage(null)}>
           <img src={expandedImage} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
           <button style={{ position: 'absolute', top: 30, right: 30, background: 'none', border: 'none', color: '#fff', fontSize: 40, cursor: 'pointer' }}>×</button>
        </div>
      )}

      <style>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
};

export default ReviewSection;
