import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function TeamList({ user }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({ team_name: '', sport: 'Soccer', formation: '4-3-3', players: [], strategy: '', notes: '' });

  const fetchTeams = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const response = await axios.get(`/api/team?${params}`);
      setTeams(response.data.data || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) { console.error('Error fetching teams:', err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); fetchTeams(); }, 300); return () => clearTimeout(timer); }, [search]);

  const handleRowClick = (team) => { setSelectedTeam(team); setShowModal(true); setAiAnalysis(team.ai_analysis || null); };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this formation?')) {
      try { await axios.delete(`/api/team/${id}`); setTeams(teams.filter(t => t.id !== id)); setShowModal(false); }
      catch (err) { console.error(err); }
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({ team_name: team.team_name, sport: team.sport, formation: team.formation, players: team.players || [], strategy: team.strategy || '', notes: team.notes || '' });
    setShowForm(true); setShowModal(false);
  };

  const handleNewItem = () => {
    setEditingTeam(null);
    setFormData({ team_name: '', sport: 'Soccer', formation: '4-3-3', players: [], strategy: '', notes: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        const response = await axios.put(`/api/team/${editingTeam.id}`, formData);
        setTeams(teams.map(t => t.id === editingTeam.id ? response.data : t));
      } else {
        const response = await axios.post('/api/team', { ...formData, user_id: user.id });
        setTeams([response.data, ...teams]);
      }
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleAiOptimize = async (team) => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/team/optimize', { ...team, opponent: 'Unknown opponent' });
      setAiAnalysis(response.data.analysis);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to optimize formation.' }); }
    finally { setAiLoading(false); }
  };

  const handleAiSampleTest = async () => {
    setAiLoading(true); setShowModal(false);
    try {
      const response = await axios.post('/api/ai/team/optimize', {
        team_name: 'FC United', sport: 'Soccer', formation: '4-3-3',
        players: [
          { name: 'Alex Smith', position: 'GK' }, { name: 'Jordan Lee', position: 'RB' },
          { name: 'Sam Wilson', position: 'CB' }, { name: 'Chris Taylor', position: 'CB' },
          { name: 'Morgan Brown', position: 'LB' }, { name: 'Casey Davis', position: 'CDM' },
          { name: 'Riley Johnson', position: 'CM' }, { name: 'Jamie White', position: 'CM' },
          { name: 'Drew Martinez', position: 'RW' }, { name: 'Blake Thomas', position: 'ST' },
          { name: 'Quinn Harris', position: 'LW' }
        ],
        strategy: 'High pressing, possession-based attacking play', opponent: 'City Rivals FC'
      });
      setAiAnalysis(response.data.analysis);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to optimize formation.' }); }
    finally { setAiLoading(false); }
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#ff6b6b', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#667eea', marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#38ef7d', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^[-*] /, '')}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{line}</p>;
    });
  };

  if (loading) return <div className="page-container"><div className="loading-screen"><div className="loading-spinner"></div><p>Loading team formations...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">⚽ AI Team Formation Optimizer</h2><p className="page-subtitle">Sports lineup optimization powered by AI</p></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleAiSampleTest} className="btn btn-ai" disabled={aiLoading}>{aiLoading ? 'Optimizing...' : 'Test AI with Sample Data'}</button>
            <button onClick={handleNewItem} className="btn btn-primary">+ New Formation</button>
          </div>
        </div>

        <div className="search-bar">
          <input className="search-input" placeholder="Search formations..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search team formations" />
        </div>

        {aiAnalysis && !showModal && (
          <div className="ai-analysis">
            <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Team Formation Optimization</span></div>
            <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
            <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⚽</div><h3>No team formations yet</h3><p>Create your first team formation</p></div>
        ) : (
          <>
            <div className="card-grid">
              {teams.map((team) => (
                <div key={team.id} className="card" onClick={() => handleRowClick(team)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleRowClick(team)} aria-label={`View ${team.team_name}`}>
                  <div className="card-header">
                    <h3 className="card-title">{team.team_name}</h3>
                    <span className="card-badge" style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}>{team.sport}</span>
                  </div>
                  <div className="card-content"><p>Formation: {team.formation}</p><p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{team.strategy}</p></div>
                  <div className="card-stats">
                    <div className="stat"><span className="stat-value">{team.players?.length || 0}</span><span className="stat-label">Players</span></div>
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

      {showModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Formation details">
            <div className="modal-header">
              <h2 className="modal-title">{selectedTeam.team_name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3 className="detail-section-title">Formation Details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Sport</span><span className="detail-value">{selectedTeam.sport}</span></div>
                  <div className="detail-item"><span className="detail-label">Formation</span><span className="detail-value">{selectedTeam.formation}</span></div>
                </div>
              </div>
              {selectedTeam.strategy && (
                <div className="detail-section"><h3 className="detail-section-title">Strategy</h3><p style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedTeam.strategy}</p></div>
              )}
              {selectedTeam.players && selectedTeam.players.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Players</h3>
                  <div className="detail-grid">
                    {selectedTeam.players.map((player, idx) => (
                      <div key={idx} className="detail-item"><span className="detail-value">{player.name}</span><span className="detail-label">{player.position}</span></div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => handleAiOptimize(selectedTeam)} className="btn btn-ai" style={{ width: '100%', marginTop: '1rem' }} disabled={aiLoading}>
                {aiLoading ? 'Optimizing...' : 'Get AI Formation Optimization'}
              </button>
              {aiAnalysis && (
                <div className="ai-analysis">
                  <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Formation Optimization</span></div>
                  <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
                  <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => handleEdit(selectedTeam)} className="btn btn-primary">Edit</button>
              <button onClick={() => handleDelete(selectedTeam.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Formation form">
            <div className="modal-header">
              <h2 className="modal-title">{editingTeam ? 'Edit Formation' : 'New Formation'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Team Name</label><input type="text" className="form-input" value={formData.team_name} onChange={e => setFormData({ ...formData, team_name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Sport</label>
                    <select className="form-select" value={formData.sport} onChange={e => setFormData({ ...formData, sport: e.target.value })}>
                      <option value="Soccer">Soccer</option><option value="Basketball">Basketball</option><option value="American Football">American Football</option><option value="Hockey">Hockey</option><option value="Volleyball">Volleyball</option><option value="Rugby">Rugby</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Formation</label><input type="text" className="form-input" value={formData.formation} onChange={e => setFormData({ ...formData, formation: e.target.value })} placeholder="e.g., 4-3-3" /></div>
                </div>
                <div className="form-group"><label className="form-label">Strategy</label><textarea className="form-textarea" value={formData.strategy} onChange={e => setFormData({ ...formData, strategy: e.target.value })} placeholder="Describe your team's strategy..." /></div>
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

export default TeamList;
