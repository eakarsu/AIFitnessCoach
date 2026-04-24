import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Feedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'general', subject: '', message: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/feedback', { headers: { Authorization: `Bearer ${token}` } });
      setFeedbackList(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/feedback', formData, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Feedback submitted successfully!');
      setShowForm(false);
      setFormData({ type: 'general', subject: '', message: '' });
      fetchFeedback();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Error submitting feedback'); }
  };

  const deleteFeedback = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/feedback/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setFeedbackList(feedbackList.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  const typeColors = { bug: '#ff416c', feature: '#667eea', general: '#38ef7d', contact: '#ffc107' };
  const statusColors = { open: '#ffc107', in_progress: '#667eea', closed: '#38ef7d' };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">💬 Feedback</h2><p className="page-subtitle">Help us improve</p></div>
          <button onClick={()=>setShowForm(!showForm)} className="btn btn-primary">{showForm?'Cancel':'+ New Feedback'}</button>
        </div>
        {message && <div style={{background:'rgba(56,239,125,0.2)',border:'1px solid rgba(56,239,125,0.5)',color:'#38ef7d',padding:'0.75rem',borderRadius:'8px',marginBottom:'1rem'}}>{message}</div>}
        {showForm && (
          <div className="card" style={{cursor:'default',marginBottom:'1.5rem'}}>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}><option value="general">General</option><option value="bug">Bug Report</option><option value="feature">Feature Request</option></select></div>
              <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={formData.subject} onChange={e=>setFormData({...formData,subject:e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" value={formData.message} onChange={e=>setFormData({...formData,message:e.target.value})} required /></div>
              <button type="submit" className="btn btn-primary">Submit Feedback</button>
            </form>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {feedbackList.map(f => (
            <div key={f.id} className="card" style={{cursor:'default'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                  <span style={{background:`${typeColors[f.type]}22`,color:typeColors[f.type],padding:'0.2rem 0.6rem',borderRadius:'12px',fontSize:'0.75rem',fontWeight:600}}>{f.type}</span>
                  <h4 style={{color:'white'}}>{f.subject}</h4>
                </div>
                <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                  <span style={{background:`${statusColors[f.status]}22`,color:statusColors[f.status],padding:'0.2rem 0.6rem',borderRadius:'12px',fontSize:'0.75rem'}}>{f.status}</span>
                  <button onClick={()=>deleteFeedback(f.id)} className="btn btn-secondary" style={{padding:'0.3rem 0.5rem',fontSize:'0.75rem'}}>×</button>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.9rem'}}>{f.message}</p>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'0.8rem',marginTop:'0.5rem',display:'block'}}>{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default Feedback;
