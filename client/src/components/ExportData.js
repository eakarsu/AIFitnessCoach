import React, { useState } from 'react';
import axios from 'axios';

function ExportData() {
  const [exporting, setExporting] = useState(null);

  const exportTypes = [
    { key: 'workouts', label: 'Workouts', icon: '🏋️', desc: 'Export all workout data' },
    { key: 'golf', label: 'Golf Swings', icon: '⛳', desc: 'Export golf swing metrics' },
    { key: 'running', label: 'Running Sessions', icon: '🏃', desc: 'Export running data' },
    { key: 'team', label: 'Team Formations', icon: '⚽', desc: 'Export team data' },
    { key: 'recovery', label: 'Recovery Plans', icon: '💤', desc: 'Export recovery plans' },
  ];

  const handleExport = async (type, format) => {
    setExporting(`${type}-${format}`);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/export/${type}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      const blob = format === 'csv' ? new Blob([res.data], { type: 'text/csv' }) : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Export error:', err); }
    finally { setExporting(null); }
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">📥 Export Data</h2><p className="page-subtitle">Download your fitness data</p></div></div>
        <div className="card-grid">
          {exportTypes.map(t => (
            <div key={t.key} className="card" style={{cursor:'default'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>{t.icon}</div>
              <h3 className="card-title">{t.label}</h3>
              <p className="card-content" style={{marginBottom:'1.5rem'}}>{t.desc}</p>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>handleExport(t.key,'csv')} className="btn btn-primary" disabled={exporting===`${t.key}-csv`}>{exporting===`${t.key}-csv`?'Exporting...':'CSV'}</button>
                <button onClick={()=>handleExport(t.key,'json')} className="btn btn-secondary" disabled={exporting===`${t.key}-json`}>{exporting===`${t.key}-json`?'Exporting...':'JSON'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ExportData;
