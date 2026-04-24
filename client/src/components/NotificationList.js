import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const deleteNotif = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const typeIcons = { workout: '🏋️', achievement: '🏆', reminder: '⏰', analysis: '🤖', running: '🏃', team: '⚽', system: '💡', recovery: '💤' };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">🔔 Notifications</h2><p className="page-subtitle">{notifications.filter(n=>!n.read).length} unread</p></div>
          <button onClick={markAllRead} className="btn btn-secondary">Mark All Read</button>
        </div>
        {notifications.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {notifications.map(n => (
              <div key={n.id} className="card" style={{cursor:'pointer',opacity:n.read?0.7:1,borderLeft:n.read?'':'3px solid #667eea'}} onClick={()=>{markRead(n.id);if(n.link)navigate(n.link);}}>
                <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  <span style={{fontSize:'1.5rem'}}>{typeIcons[n.type]||'📌'}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <h4 style={{color:'white',fontWeight:n.read?400:600}}>{n.title}</h4>
                      <span style={{color:'rgba(255,255,255,0.4)',fontSize:'0.8rem'}}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.9rem',marginTop:'0.25rem'}}>{n.message}</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteNotif(n.id);}} className="btn btn-secondary" style={{padding:'0.4rem 0.6rem',fontSize:'0.8rem'}}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default NotificationList;
