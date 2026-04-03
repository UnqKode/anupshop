import React from 'react';

const TrustItem = ({ icon, title, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'transform 0.2s ease' }}>
    <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{sub}</div>
    </div>
  </div>
);

const TrustBar = ({ lang = 'en' }) => {
  const content = {
    en: [
      { id: 1, icon: '🔄', title: '7-Day Easy Returns', sub: 'No questions asked policy' },
      { id: 2, icon: '🚚', title: 'Free Pan-India Shipping', sub: 'Express delivery in 3-5 days' },
      { id: 3, icon: '🛡️', title: 'Zero-Risk COD', sub: 'Pay after you receive' },
    ],
    hi: [
      { id: 1, icon: '🔄', title: '7-दिन आसान रिटर्न्स', sub: 'बिना किसी सवाल के वापस' },
      { id: 2, icon: '🚚', title: 'फ्री शिपिंग (पूरे भारत)', sub: '3-5 दिनों में डिलीवरी' },
      { id: 3, icon: '🛡️', title: 'जीरो-रिस्क COD', sub: 'सामान मिलने पर पैसे दें' },
    ]
  };

  const activeContent = content[lang] || content.en;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '24px' }}>
      {activeContent.map(item => (
        <TrustItem key={item.id} {...item} />
      ))}
    </div>
  );
};

export default TrustBar;
