import React, { useState } from 'react';
import axios from 'axios';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contact', formData);
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) { setError('Failed to send message. Please try again.'); }
  };

  const faqs = [
    { q: 'How does AI workout generation work?', a: 'Our AI uses Claude to analyze your fitness level, goals, and available equipment to create personalized workout plans.' },
    { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption, secure password hashing, and JWT authentication to protect your data.' },
    { q: 'Can I export my fitness data?', a: 'Yes! Visit the Export page to download your data in CSV or JSON format.' },
    { q: 'How accurate are AI recommendations?', a: 'AI recommendations are based on fitness science principles but should not replace professional medical or coaching advice.' },
  ];

  return (
    <div className="page-container">
      <div className="content" style={{maxWidth:'900px'}}>
        <div className="page-header"><div><h2 className="page-title">📞 Contact & Support</h2><p className="page-subtitle">We are here to help</p></div></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Send a Message</h3>
            {sent ? (
              <div style={{textAlign:'center',padding:'2rem'}}><div style={{fontSize:'3rem',marginBottom:'1rem'}}>✅</div><h3 style={{color:'#38ef7d'}}>Message Sent!</h3><p style={{color:'rgba(255,255,255,0.6)'}}>We'll get back to you soon.</p><button onClick={()=>setSent(false)} className="btn btn-primary" style={{marginTop:'1rem'}}>Send Another</button></div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <p style={{color:'#ff416c',marginBottom:'1rem'}}>{error}</p>}
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={formData.subject} onChange={e=>setFormData({...formData,subject:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" value={formData.message} onChange={e=>setFormData({...formData,message:e.target.value})} required /></div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            )}
          </div>
          <div>
            <div className="card" style={{cursor:'default'}}>
              <h3 className="detail-section-title">FAQ</h3>
              {faqs.map((faq, i) => (
                <div key={i} style={{marginBottom:'1.25rem',paddingBottom:'1.25rem',borderBottom:i<faqs.length-1?'1px solid rgba(255,255,255,0.08)':'none'}}>
                  <h4 style={{color:'white',marginBottom:'0.5rem',fontSize:'0.95rem'}}>{faq.q}</h4>
                  <p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.9rem',lineHeight:1.6}}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Contact;
