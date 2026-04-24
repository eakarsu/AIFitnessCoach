import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('/api/admin/stats', { headers }),
      axios.get('/api/admin/users', { headers }),
      axios.get('/api/admin/audit-logs', { headers })
    ]).then(([s, u, a]) => { setStats(s.data); setUsers(u.data); setAuditLogs(a.data); })
    .catch(err => console.error(err));
  }, []);

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">🔧 Admin Panel</h2><p className="page-subtitle">System management</p></div></div>
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem'}}>
          {['stats','users','audit'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
        {tab === 'stats' && stats && (
          <div className="card-grid">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="card" style={{cursor:'default',textAlign:'center'}}>
                <div style={{fontSize:'2rem',fontWeight:700,color:'#667eea'}}>{val}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'0.85rem',marginTop:'0.5rem'}}>{key.replace(/([A-Z])/g,' $1').trim()}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'users' && (
          <div className="card" style={{cursor:'default',overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',color:'rgba(255,255,255,0.8)'}}>
              <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                {['ID','Name','Email','Role','Verified','Joined'].map(h=><th key={h} style={{padding:'0.75rem',textAlign:'left',color:'rgba(255,255,255,0.5)',fontSize:'0.8rem',textTransform:'uppercase'}}>{h}</th>)}
              </tr></thead>
              <tbody>{users.map(u=>(
                <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'0.75rem'}}>{u.id}</td>
                  <td style={{padding:'0.75rem'}}>{u.name}</td>
                  <td style={{padding:'0.75rem'}}>{u.email}</td>
                  <td style={{padding:'0.75rem'}}><span style={{background:u.role==='admin'?'rgba(102,126,234,0.2)':'rgba(255,255,255,0.1)',color:u.role==='admin'?'#667eea':'rgba(255,255,255,0.6)',padding:'0.2rem 0.5rem',borderRadius:'10px',fontSize:'0.8rem'}}>{u.role}</span></td>
                  <td style={{padding:'0.75rem'}}>{u.email_verified?'✅':'❌'}</td>
                  <td style={{padding:'0.75rem',fontSize:'0.85rem'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {tab === 'audit' && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {auditLogs.slice(0,50).map(log=>(
              <div key={log.id} className="card" style={{cursor:'default',padding:'0.75rem 1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                    <span style={{background:'rgba(102,126,234,0.2)',color:'#667eea',padding:'0.2rem 0.5rem',borderRadius:'6px',fontSize:'0.75rem',fontWeight:600}}>{log.action}</span>
                    <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.85rem'}}>{log.resource}{log.resource_id?` #${log.resource_id}`:''}</span>
                    <span style={{color:'rgba(255,255,255,0.4)',fontSize:'0.8rem'}}>by {log.user_name||'System'}</span>
                  </div>
                  <span style={{color:'rgba(255,255,255,0.3)',fontSize:'0.8rem'}}>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminPanel;
