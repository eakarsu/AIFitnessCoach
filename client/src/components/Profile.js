import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile', formData, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Error updating profile'); }
  };

  const bmi = profile?.height && profile?.weight ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : null;

  if (!profile) return <div className="page-container"><div className="content"><p style={{color:'rgba(255,255,255,0.7)'}}>Loading profile...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">👤 Profile</h2><p className="page-subtitle">Manage your fitness profile</p></div>
          <button onClick={() => setEditing(!editing)} className="btn btn-primary">{editing ? 'Cancel' : 'Edit Profile'}</button>
        </div>
        {message && <div style={{background:'rgba(56,239,125,0.2)',border:'1px solid rgba(56,239,125,0.5)',color:'#38ef7d',padding:'0.75rem',borderRadius:'8px',marginBottom:'1rem'}}>{message}</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.5rem'}}>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Personal Info</h3>
            <div className="detail-grid">
              {['name','age','gender','fitness_level'].map(field => (
                <div key={field} className="detail-item">
                  <span className="detail-label">{field.replace('_',' ')}</span>
                  {editing ? (
                    field === 'gender' ? <select className="form-select" value={formData[field]||''} onChange={e=>setFormData({...formData,[field]:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>
                    : field === 'fitness_level' ? <select className="form-select" value={formData[field]||''} onChange={e=>setFormData({...formData,[field]:e.target.value})}><option value="">Select</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Elite</option></select>
                    : <input className="form-input" type={field==='age'?'number':'text'} value={formData[field]||''} onChange={e=>setFormData({...formData,[field]:e.target.value})} />
                  ) : <span className="detail-value">{profile[field] || 'Not set'}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Body Metrics</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Height (cm)</span>
                {editing ? <input className="form-input" type="number" value={formData.height||''} onChange={e=>setFormData({...formData,height:e.target.value})} /> : <span className="detail-value">{profile.height ? `${profile.height} cm` : 'Not set'}</span>}
              </div>
              <div className="detail-item">
                <span className="detail-label">Weight (kg)</span>
                {editing ? <input className="form-input" type="number" value={formData.weight||''} onChange={e=>setFormData({...formData,weight:e.target.value})} /> : <span className="detail-value">{profile.weight ? `${profile.weight} kg` : 'Not set'}</span>}
              </div>
              {bmi && <div className="detail-item"><span className="detail-label">BMI</span><span className="detail-value" style={{color: bmi < 18.5 ? '#ffc107' : bmi < 25 ? '#38ef7d' : bmi < 30 ? '#ffc107' : '#ff416c'}}>{bmi}</span></div>}
            </div>
          </div>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Goals & Notes</h3>
            <div className="form-group">
              <span className="detail-label">Fitness Goals</span>
              {editing ? <textarea className="form-textarea" value={formData.goals||''} onChange={e=>setFormData({...formData,goals:e.target.value})} /> : <p style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6}}>{profile.goals || 'No goals set'}</p>}
            </div>
            <div className="form-group">
              <span className="detail-label">Injuries/Limitations</span>
              {editing ? <textarea className="form-textarea" value={formData.injuries||''} onChange={e=>setFormData({...formData,injuries:e.target.value})} /> : <p style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6}}>{profile.injuries || 'None noted'}</p>}
            </div>
          </div>
        </div>
        {editing && <div style={{marginTop:'1.5rem',display:'flex',gap:'1rem',justifyContent:'flex-end'}}><button onClick={()=>setEditing(false)} className="btn btn-secondary">Cancel</button><button onClick={handleSave} className="btn btn-success">Save Changes</button></div>}
      </div>
    </div>
  );
}
export default Profile;
