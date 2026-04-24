import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function RunningList({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '', distance: 5, duration: 30, pace: '6:00/km', heart_rate_avg: 150, heart_rate_max: 170, elevation_gain: 50, calories: 350, terrain: 'Road', weather: 'Clear', notes: ''
  });

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const response = await axios.get(`/api/running?${params}`);
      setSessions(response.data.data || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) { console.error('Error fetching sessions:', err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); fetchSessions(); }, 300); return () => clearTimeout(timer); }, [search]);

  const handleRowClick = (session) => { setSelectedSession(session); setShowModal(true); setAiAnalysis(session.ai_analysis || null); };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try { await axios.delete(`/api/running/${id}`); setSessions(sessions.filter(s => s.id !== id)); setShowModal(false); }
      catch (err) { console.error(err); }
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({ name: session.name, distance: session.distance, duration: session.duration, pace: session.pace, heart_rate_avg: session.heart_rate_avg, heart_rate_max: session.heart_rate_max, elevation_gain: session.elevation_gain, calories: session.calories, terrain: session.terrain, weather: session.weather, notes: session.notes || '' });
    setShowForm(true); setShowModal(false);
  };

  const handleNewItem = () => {
    setEditingSession(null);
    setFormData({ name: '', distance: 5, duration: 30, pace: '6:00/km', heart_rate_avg: 150, heart_rate_max: 170, elevation_gain: 50, calories: 350, terrain: 'Road', weather: 'Clear', notes: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSession) {
        const response = await axios.put(`/api/running/${editingSession.id}`, formData);
        setSessions(sessions.map(s => s.id === editingSession.id ? response.data : s));
      } else {
        const response = await axios.post('/api/running', { ...formData, user_id: user.id });
        setSessions([response.data, ...sessions]);
      }
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleAiAnalyze = async (session) => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/running/analyze', { ...session, goals: 'Improve pace and endurance' });
      setAiAnalysis(response.data.analysis);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to analyze session.' }); }
    finally { setAiLoading(false); }
  };

  const handleAiSampleTest = async () => {
    setAiLoading(true); setShowModal(false);
    try {
      const response = await axios.post('/api/ai/running/analyze', { distance: 10, duration: 55, pace: '5:30/km', heart_rate_avg: 155, heart_rate_max: 178, elevation_gain: 120, terrain: 'Trail', weather: 'Clear, 18C', goals: 'Improve pace and endurance', notes: 'Felt good throughout the run' });
      setAiAnalysis(response.data.analysis);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to analyze session.' }); }
    finally { setAiLoading(false); }
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#f093fb', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#667eea', marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#38ef7d', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^[-*] /, '')}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{line}</p>;
    });
  };

  if (loading) return <div className="page-container"><div className="loading-screen"><div className="loading-spinner"></div><p>Loading running sessions...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">🏃 AI Running Coach</h2><p className="page-subtitle">Pace optimization powered by AI</p></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleAiSampleTest} className="btn btn-ai" disabled={aiLoading}>{aiLoading ? 'Analyzing...' : 'Test AI with Sample Data'}</button>
            <button onClick={handleNewItem} className="btn btn-primary">+ New Session</button>
          </div>
        </div>

        <div className="search-bar">
          <input className="search-input" placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search running sessions" />
        </div>

        {aiAnalysis && !showModal && (
          <div className="ai-analysis">
            <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Running Analysis</span></div>
            <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
            <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏃</div><h3>No running sessions yet</h3><p>Log your first run</p></div>
        ) : (
          <>
            <div className="card-grid">
              {sessions.map((session) => (
                <div key={session.id} className="card" onClick={() => handleRowClick(session)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleRowClick(session)} aria-label={`View ${session.name}`}>
                  <div className="card-header">
                    <h3 className="card-title">{session.name}</h3>
                    <span className="card-badge" style={{ background: 'rgba(240, 147, 251, 0.2)', color: '#f093fb' }}>{session.terrain}</span>
                  </div>
                  <div className="card-stats">
                    <div className="stat"><span className="stat-value">{session.distance}</span><span className="stat-label">km</span></div>
                    <div className="stat"><span className="stat-value">{session.duration}</span><span className="stat-label">min</span></div>
                    <div className="stat"><span className="stat-value">{session.pace}</span><span className="stat-label">pace</span></div>
                    <div className="stat"><span className="stat-value">{session.calories}</span><span className="stat-label">cal</span></div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Session details">
            <div className="modal-header">
              <h2 className="modal-title">{selectedSession.name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3 className="detail-section-title">Session Details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Distance</span><span className="detail-value">{selectedSession.distance} km</span></div>
                  <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{selectedSession.duration} min</span></div>
                  <div className="detail-item"><span className="detail-label">Pace</span><span className="detail-value">{selectedSession.pace}</span></div>
                  <div className="detail-item"><span className="detail-label">Avg HR</span><span className="detail-value">{selectedSession.heart_rate_avg} bpm</span></div>
                  <div className="detail-item"><span className="detail-label">Max HR</span><span className="detail-value">{selectedSession.heart_rate_max} bpm</span></div>
                  <div className="detail-item"><span className="detail-label">Elevation</span><span className="detail-value">{selectedSession.elevation_gain} m</span></div>
                  <div className="detail-item"><span className="detail-label">Calories</span><span className="detail-value">{selectedSession.calories}</span></div>
                  <div className="detail-item"><span className="detail-label">Terrain</span><span className="detail-value">{selectedSession.terrain}</span></div>
                  <div className="detail-item"><span className="detail-label">Weather</span><span className="detail-value">{selectedSession.weather}</span></div>
                </div>
              </div>
              {selectedSession.notes && (
                <div className="detail-section"><h3 className="detail-section-title">Notes</h3><p style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedSession.notes}</p></div>
              )}
              <button onClick={() => handleAiAnalyze(selectedSession)} className="btn btn-ai" style={{ width: '100%', marginTop: '1rem' }} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'Get AI Coaching Advice'}
              </button>
              {aiAnalysis && (
                <div className="ai-analysis">
                  <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Running Analysis</span></div>
                  <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
                  <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => handleEdit(selectedSession)} className="btn btn-primary">Edit</button>
              <button onClick={() => handleDelete(selectedSession.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Session form">
            <div className="modal-header">
              <h2 className="modal-title">{editingSession ? 'Edit Session' : 'New Session'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Distance (km)</label><input type="number" step="0.1" className="form-input" value={formData.distance} onChange={e => setFormData({ ...formData, distance: parseFloat(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Duration (min)</label><input type="number" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Pace</label><input type="text" className="form-input" value={formData.pace} onChange={e => setFormData({ ...formData, pace: e.target.value })} placeholder="e.g., 5:30/km" /></div>
                  <div className="form-group"><label className="form-label">Calories</label><input type="number" className="form-input" value={formData.calories} onChange={e => setFormData({ ...formData, calories: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Avg Heart Rate</label><input type="number" className="form-input" value={formData.heart_rate_avg} onChange={e => setFormData({ ...formData, heart_rate_avg: parseInt(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Max Heart Rate</label><input type="number" className="form-input" value={formData.heart_rate_max} onChange={e => setFormData({ ...formData, heart_rate_max: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Elevation Gain (m)</label><input type="number" className="form-input" value={formData.elevation_gain} onChange={e => setFormData({ ...formData, elevation_gain: parseInt(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Terrain</label>
                    <select className="form-select" value={formData.terrain} onChange={e => setFormData({ ...formData, terrain: e.target.value })}>
                      <option value="Road">Road</option><option value="Trail">Trail</option><option value="Track">Track</option><option value="Treadmill">Treadmill</option><option value="Mixed">Mixed</option><option value="Sand">Sand</option><option value="Hills">Hills</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Weather</label><input type="text" className="form-input" value={formData.weather} onChange={e => setFormData({ ...formData, weather: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunningList;
