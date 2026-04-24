import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function RecoveryList({ user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({ name: '', recovery_type: 'Active Recovery', duration: 3, intensity: 'Light', activities: [], nutrition: {}, sleep_hours: 8, notes: '' });

  const fetchPlans = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const response = await axios.get(`/api/recovery?${params}`);
      setPlans(response.data.data || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) { console.error('Error fetching plans:', err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); fetchPlans(); }, 300); return () => clearTimeout(timer); }, [search]);

  const handleRowClick = (plan) => { setSelectedPlan(plan); setShowModal(true); setAiAnalysis(plan.ai_analysis || null); };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recovery plan?')) {
      try { await axios.delete(`/api/recovery/${id}`); setPlans(plans.filter(p => p.id !== id)); setShowModal(false); }
      catch (err) { console.error(err); }
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, recovery_type: plan.recovery_type, duration: plan.duration, intensity: plan.intensity, activities: plan.activities || [], nutrition: plan.nutrition || {}, sleep_hours: plan.sleep_hours, notes: plan.notes || '' });
    setShowForm(true); setShowModal(false);
  };

  const handleNewItem = () => {
    setEditingPlan(null);
    setFormData({ name: '', recovery_type: 'Active Recovery', duration: 3, intensity: 'Light', activities: [], nutrition: {}, sleep_hours: 8, notes: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        const response = await axios.put(`/api/recovery/${editingPlan.id}`, formData);
        setPlans(plans.map(p => p.id === editingPlan.id ? response.data : p));
      } else {
        const response = await axios.post('/api/recovery', { ...formData, user_id: user.id });
        setPlans([response.data, ...plans]);
      }
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleAiAdvise = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/recovery/advise', {
        activity_type: 'Strength Training', intensity: 'High', duration: 60, muscle_groups: 'Full body',
        current_soreness: 6, sleep_quality: 'Good', stress_level: 'Moderate', goals: 'Quick recovery for next session', user_id: user.id
      });
      setAiAnalysis(response.data.analysis);
      if (response.data.savedRecord) setPlans(prev => [response.data.savedRecord, ...prev]);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to get recovery advice.' }); }
    finally { setAiLoading(false); }
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#00b894', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#667eea', marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#f093fb', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^[-*] /, '')}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{line}</p>;
    });
  };

  if (loading) return <div className="page-container"><div className="loading-screen"><div className="loading-spinner"></div><p>Loading recovery plans...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">💤 AI Recovery Advisor</h2><p className="page-subtitle">Rest and nutrition timing powered by AI</p></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleAiAdvise} className="btn btn-ai" disabled={aiLoading}>{aiLoading ? 'Generating...' : 'Get AI Recovery Advice'}</button>
            <button onClick={handleNewItem} className="btn btn-primary">+ New Plan</button>
          </div>
        </div>

        <div className="search-bar">
          <input className="search-input" placeholder="Search recovery plans..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search recovery plans" />
        </div>

        {aiAnalysis && !showModal && (
          <div className="ai-analysis">
            <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Recovery Recommendation</span></div>
            <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
            <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💤</div><h3>No recovery plans yet</h3><p>Create your first recovery plan or get AI advice</p></div>
        ) : (
          <>
            <div className="card-grid">
              {plans.map((plan) => (
                <div key={plan.id} className="card" onClick={() => handleRowClick(plan)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleRowClick(plan)} aria-label={`View ${plan.name}`}>
                  <div className="card-header">
                    <h3 className="card-title">{plan.name}</h3>
                    <span className="card-badge" style={{ background: 'rgba(0, 184, 148, 0.2)', color: '#00b894' }}>{plan.recovery_type}</span>
                  </div>
                  <div className="card-content"><p>Intensity: {plan.intensity}</p></div>
                  <div className="card-stats">
                    <div className="stat"><span className="stat-value">{plan.duration}</span><span className="stat-label">Days</span></div>
                    <div className="stat"><span className="stat-value">{plan.sleep_hours}</span><span className="stat-label">Sleep (hrs)</span></div>
                    <div className="stat"><span className="stat-value">{plan.activities?.length || 0}</span><span className="stat-label">Activities</span></div>
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

      {showModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Recovery plan details">
            <div className="modal-header">
              <h2 className="modal-title">{selectedPlan.name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3 className="detail-section-title">Recovery Details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Type</span><span className="detail-value">{selectedPlan.recovery_type}</span></div>
                  <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{selectedPlan.duration} days</span></div>
                  <div className="detail-item"><span className="detail-label">Intensity</span><span className="detail-value">{selectedPlan.intensity}</span></div>
                  <div className="detail-item"><span className="detail-label">Sleep</span><span className="detail-value">{selectedPlan.sleep_hours} hours</span></div>
                </div>
              </div>
              {selectedPlan.activities && selectedPlan.activities.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Activities</h3>
                  <ul style={{ marginLeft: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                    {selectedPlan.activities.map((activity, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{activity}</li>)}
                  </ul>
                </div>
              )}
              {selectedPlan.nutrition && Object.keys(selectedPlan.nutrition).length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Nutrition</h3>
                  <div className="detail-grid">
                    {Object.entries(selectedPlan.nutrition).map(([key, value], idx) => (
                      <div key={idx} className="detail-item"><span className="detail-label">{key}</span><span className="detail-value">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {selectedPlan.notes && (
                <div className="detail-section"><h3 className="detail-section-title">Notes</h3><p style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedPlan.notes}</p></div>
              )}
              {aiAnalysis && (
                <div className="ai-analysis">
                  <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Recovery Recommendation</span></div>
                  <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
                  <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => handleEdit(selectedPlan)} className="btn btn-primary">Edit</button>
              <button onClick={() => handleDelete(selectedPlan.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Recovery plan form">
            <div className="modal-header">
              <h2 className="modal-title">{editingPlan ? 'Edit Recovery Plan' : 'New Recovery Plan'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Recovery Type</label>
                    <select className="form-select" value={formData.recovery_type} onChange={e => setFormData({ ...formData, recovery_type: e.target.value })}>
                      <option value="Active Recovery">Active Recovery</option><option value="Complete Rest">Complete Rest</option><option value="Muscle Recovery">Muscle Recovery</option><option value="Mental Health">Mental Health</option><option value="Sleep Quality">Sleep Quality</option><option value="Taper">Taper</option><option value="Prehab">Prehab</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Intensity</label>
                    <select className="form-select" value={formData.intensity} onChange={e => setFormData({ ...formData, intensity: e.target.value })}>
                      <option value="None">None</option><option value="Light">Light</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="Reduced">Reduced</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Duration (days)</label><input type="number" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Sleep Hours</label><input type="number" step="0.5" className="form-input" value={formData.sleep_hours} onChange={e => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })} /></div>
                </div>
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

export default RecoveryList;
