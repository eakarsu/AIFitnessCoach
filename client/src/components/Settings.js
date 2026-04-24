import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings({ onThemeToggle, theme }) {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
      setSettings(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings', { ...settings, ...updates }, { headers: { Authorization: `Bearer ${token}` } });
      setSettings({ ...settings, ...updates });
      setMessage('Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Error saving settings'); }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) { setMessage('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { setMessage('Password must be at least 6 characters'); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/settings/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.response?.data?.error || 'Error changing password'); }
  };

  if (!settings) return <div className="page-container"><div className="content"><p style={{color:'rgba(255,255,255,0.7)'}}>Loading settings...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">⚙️ Settings</h2><p className="page-subtitle">Customize your experience</p></div></div>
        {message && <div style={{background:message.includes('Error')||message.includes('match')||message.includes('must')?'rgba(255,65,108,0.2)':'rgba(56,239,125,0.2)',border:`1px solid ${message.includes('Error')||message.includes('match')||message.includes('must')?'rgba(255,65,108,0.5)':'rgba(56,239,125,0.5)'}`,color:message.includes('Error')||message.includes('match')||message.includes('must')?'#ff416c':'#38ef7d',padding:'0.75rem',borderRadius:'8px',marginBottom:'1rem'}}>{message}</div>}
        <div style={{display:'grid',gap:'1.5rem',maxWidth:'800px'}}>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Appearance</h3>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <div><span className="detail-label">Theme</span><p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.85rem'}}>Switch between dark and light mode</p></div>
              <button onClick={() => { onThemeToggle(); handleSave({ theme: theme === 'dark' ? 'light' : 'dark' }); }} className="btn btn-secondary">{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</button>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div><span className="detail-label">Units</span><p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.85rem'}}>Measurement units</p></div>
              <select className="form-select" style={{width:'auto'}} value={settings.units} onChange={e=>handleSave({units:e.target.value})}><option value="metric">Metric (kg, km)</option><option value="imperial">Imperial (lbs, mi)</option></select>
            </div>
          </div>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Notifications</h3>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <div><span className="detail-label">Push Notifications</span></div>
              <label style={{position:'relative',width:'50px',height:'26px',cursor:'pointer'}}>
                <input type="checkbox" checked={settings.notifications_enabled} onChange={e=>handleSave({notifications_enabled:e.target.checked})} style={{display:'none'}} />
                <span style={{position:'absolute',inset:0,background:settings.notifications_enabled?'#667eea':'rgba(255,255,255,0.2)',borderRadius:'13px',transition:'0.3s'}}></span>
                <span style={{position:'absolute',left:settings.notifications_enabled?'26px':'2px',top:'2px',width:'22px',height:'22px',background:'white',borderRadius:'50%',transition:'0.3s'}}></span>
              </label>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div><span className="detail-label">Email Notifications</span></div>
              <label style={{position:'relative',width:'50px',height:'26px',cursor:'pointer'}}>
                <input type="checkbox" checked={settings.email_notifications} onChange={e=>handleSave({email_notifications:e.target.checked})} style={{display:'none'}} />
                <span style={{position:'absolute',inset:0,background:settings.email_notifications?'#667eea':'rgba(255,255,255,0.2)',borderRadius:'13px',transition:'0.3s'}}></span>
                <span style={{position:'absolute',left:settings.email_notifications?'26px':'2px',top:'2px',width:'22px',height:'22px',background:'white',borderRadius:'50%',transition:'0.3s'}}></span>
              </label>
            </div>
          </div>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Change Password</h3>
            <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-input" value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords,confirmPassword:e.target.value})} /></div></div>
            <button onClick={handleChangePassword} className="btn btn-primary" style={{marginTop:'0.5rem'}}>Change Password</button>
          </div>
          <div className="card" style={{cursor:'default'}}>
            <h3 className="detail-section-title">Language & Timezone</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Language</label><select className="form-select" value={settings.language} onChange={e=>handleSave({language:e.target.value})}><option value="en">English</option><option value="es">Español</option></select></div>
              <div className="form-group"><label className="form-label">Timezone</label><select className="form-select" value={settings.timezone} onChange={e=>handleSave({timezone:e.target.value})}><option value="UTC">UTC</option><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option><option value="Europe/London">London</option></select></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Settings;
