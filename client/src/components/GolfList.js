import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function GolfList({ user }) {
  const [swings, setSwings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSwing, setSelectedSwing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSwing, setEditingSwing] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    club_type: 'Driver',
    swing_speed: 100,
    ball_speed: 150,
    launch_angle: 12,
    spin_rate: 2800,
    carry_distance: 250,
    total_distance: 275,
    notes: ''
  });

  const fetchSwings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const response = await axios.get(`/api/golf?${params}`);
      setSwings(response.data.data || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching swings:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSwings(); }, [fetchSwings]);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); fetchSwings(); }, 300); return () => clearTimeout(timer); }, [search]);

  const handleRowClick = (swing) => {
    setSelectedSwing(swing);
    setShowModal(true);
    setAiAnalysis(swing.ai_analysis || null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this swing?')) {
      try {
        await axios.delete(`/api/golf/${id}`);
        setSwings(swings.filter(s => s.id !== id));
        setShowModal(false);
      } catch (err) {
        console.error('Error deleting swing:', err);
      }
    }
  };

  const handleEdit = (swing) => {
    setEditingSwing(swing);
    setFormData({
      name: swing.name,
      club_type: swing.club_type,
      swing_speed: swing.swing_speed,
      ball_speed: swing.ball_speed,
      launch_angle: swing.launch_angle,
      spin_rate: swing.spin_rate,
      carry_distance: swing.carry_distance,
      total_distance: swing.total_distance,
      notes: swing.notes || ''
    });
    setShowForm(true);
    setShowModal(false);
  };

  const handleNewItem = () => {
    setEditingSwing(null);
    setFormData({
      name: '',
      club_type: 'Driver',
      swing_speed: 100,
      ball_speed: 150,
      launch_angle: 12,
      spin_rate: 2800,
      carry_distance: 250,
      total_distance: 275,
      notes: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSwing) {
        const response = await axios.put(`/api/golf/${editingSwing.id}`, formData);
        setSwings(swings.map(s => s.id === editingSwing.id ? response.data : s));
      } else {
        const response = await axios.post('/api/golf', { ...formData, user_id: user.id });
        setSwings([response.data, ...swings]);
      }
      setShowForm(false);
    } catch (err) {
      console.error('Error saving swing:', err);
    }
  };

  const handleAiAnalyze = async (swing) => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/golf/analyze', swing);
      setAiAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Error analyzing swing:', err);
      setAiAnalysis({ error: true, content: 'Failed to analyze swing. Please check your API key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSampleTest = async () => {
    setAiLoading(true);
    setShowModal(false);
    try {
      const response = await axios.post('/api/ai/golf/analyze', {
        club_type: 'Driver',
        swing_speed: 105,
        ball_speed: 155,
        launch_angle: 11.5,
        spin_rate: 2700,
        carry_distance: 260,
        total_distance: 285,
        notes: 'Slight fade, looking to add distance'
      });
      setAiAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Error analyzing swing:', err);
      setAiAnalysis({ error: true, content: 'Failed to analyze swing. Please check your API key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('```')) return null;
      if (line.startsWith('# ')) return <h2 key={index} style={{ color: '#11998e', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={index} style={{ color: '#38ef7d', marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={index} style={{ color: '#667eea', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^[-*] /, '')}</li>;
      if (line.match(/^\d+\./)) return <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.trim() === '') return <br key={index} />;
      return <p key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{line}</p>;
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading golf swings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div>
            <h2 className="page-title">⛳ AI Golf Swing Analyzer</h2>
            <p className="page-subtitle">Form correction powered by AI</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleAiSampleTest} className="btn btn-ai" disabled={aiLoading}>
              {aiLoading ? 'Analyzing...' : 'Test AI with Sample Data'}
            </button>
            <button onClick={handleNewItem} className="btn btn-primary">+ New Swing</button>
          </div>
        </div>

        <div className="search-bar">
          <input className="search-input" placeholder="Search swings..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search golf swings" />
        </div>

        {aiAnalysis && !showModal && (
          <div className="ai-analysis">
            <div className="ai-analysis-header">
              <span className="ai-icon">🤖</span>
              <span className="ai-analysis-title">AI Golf Swing Analysis</span>
            </div>
            <div className="ai-analysis-content">
              {renderAiContent(aiAnalysis.content)}
            </div>
            <div className="ai-analysis-meta">
              Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}
            </div>
          </div>
        )}

        {swings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⛳</div>
            <h3>No golf swings yet</h3>
            <p>Record your first swing data</p>
          </div>
        ) : (
          <>
            <div className="card-grid">
              {swings.map((swing) => (
                <div key={swing.id} className="card" onClick={() => handleRowClick(swing)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleRowClick(swing)} aria-label={`View ${swing.name}`}>
                  <div className="card-header">
                    <h3 className="card-title">{swing.name}</h3>
                    <span className="card-badge" style={{ background: 'rgba(17, 153, 142, 0.2)', color: '#11998e' }}>
                      {swing.club_type}
                    </span>
                  </div>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">{swing.swing_speed}</span>
                      <span className="stat-label">Swing (mph)</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{swing.ball_speed}</span>
                      <span className="stat-label">Ball (mph)</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{swing.carry_distance}</span>
                      <span className="stat-label">Carry (yds)</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{swing.total_distance}</span>
                      <span className="stat-label">Total (yds)</span>
                    </div>
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

      {showModal && selectedSwing && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Swing details">
            <div className="modal-header">
              <h2 className="modal-title">{selectedSwing.name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3 className="detail-section-title">Swing Metrics</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Club Type</span><span className="detail-value">{selectedSwing.club_type}</span></div>
                  <div className="detail-item"><span className="detail-label">Swing Speed</span><span className="detail-value">{selectedSwing.swing_speed} mph</span></div>
                  <div className="detail-item"><span className="detail-label">Ball Speed</span><span className="detail-value">{selectedSwing.ball_speed} mph</span></div>
                  <div className="detail-item"><span className="detail-label">Launch Angle</span><span className="detail-value">{selectedSwing.launch_angle}°</span></div>
                  <div className="detail-item"><span className="detail-label">Spin Rate</span><span className="detail-value">{selectedSwing.spin_rate} rpm</span></div>
                  <div className="detail-item"><span className="detail-label">Carry Distance</span><span className="detail-value">{selectedSwing.carry_distance} yds</span></div>
                  <div className="detail-item"><span className="detail-label">Total Distance</span><span className="detail-value">{selectedSwing.total_distance} yds</span></div>
                </div>
              </div>
              {selectedSwing.notes && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Notes</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedSwing.notes}</p>
                </div>
              )}
              <button onClick={() => handleAiAnalyze(selectedSwing)} className="btn btn-ai" style={{ width: '100%', marginTop: '1rem' }} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'Get AI Swing Analysis'}
              </button>
              {aiAnalysis && (
                <div className="ai-analysis">
                  <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Swing Analysis</span></div>
                  <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
                  <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => handleEdit(selectedSwing)} className="btn btn-primary">Edit</button>
              <button onClick={() => handleDelete(selectedSwing.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Swing form">
            <div className="modal-header">
              <h2 className="modal-title">{editingSwing ? 'Edit Swing' : 'New Swing'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Club Type</label>
                    <select className="form-select" value={formData.club_type} onChange={e => setFormData({ ...formData, club_type: e.target.value })}>
                      <option value="Driver">Driver</option><option value="3-Wood">3-Wood</option><option value="5-Wood">5-Wood</option><option value="Hybrid">Hybrid</option>
                      <option value="3-Iron">3-Iron</option><option value="4-Iron">4-Iron</option><option value="5-Iron">5-Iron</option><option value="6-Iron">6-Iron</option>
                      <option value="7-Iron">7-Iron</option><option value="8-Iron">8-Iron</option><option value="9-Iron">9-Iron</option>
                      <option value="PW">PW</option><option value="GW">GW</option><option value="SW">SW</option><option value="LW">LW</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Swing Speed (mph)</label><input type="number" step="0.1" className="form-input" value={formData.swing_speed} onChange={e => setFormData({ ...formData, swing_speed: parseFloat(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Ball Speed (mph)</label><input type="number" step="0.1" className="form-input" value={formData.ball_speed} onChange={e => setFormData({ ...formData, ball_speed: parseFloat(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Launch Angle (°)</label><input type="number" step="0.1" className="form-input" value={formData.launch_angle} onChange={e => setFormData({ ...formData, launch_angle: parseFloat(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Spin Rate (rpm)</label><input type="number" className="form-input" value={formData.spin_rate} onChange={e => setFormData({ ...formData, spin_rate: parseInt(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Carry Distance (yds)</label><input type="number" step="0.1" className="form-input" value={formData.carry_distance} onChange={e => setFormData({ ...formData, carry_distance: parseFloat(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Total Distance (yds)</label><input type="number" step="0.1" className="form-input" value={formData.total_distance} onChange={e => setFormData({ ...formData, total_distance: parseFloat(e.target.value) })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Add any notes about this swing..." /></div>
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

export default GolfList;
