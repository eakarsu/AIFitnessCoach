import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function WorkoutList({ user }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({ name: '', type: 'Strength', difficulty: 'Medium', duration: 45, calories: 300, exercises: [] });

  const fetchWorkouts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const response = await axios.get(`/api/workouts?${params}`);
      setWorkouts(response.data.data || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) { console.error('Error fetching workouts:', err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); fetchWorkouts(); }, 300); return () => clearTimeout(timer); }, [search]);

  const handleRowClick = (workout) => { setSelectedWorkout(workout); setShowModal(true); setAiAnalysis(workout.ai_analysis || null); };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try { await axios.delete(`/api/workouts/${id}`); setWorkouts(workouts.filter(w => w.id !== id)); setShowModal(false); }
      catch (err) { console.error(err); }
    }
  };

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setFormData({ name: workout.name, type: workout.type, difficulty: workout.difficulty, duration: workout.duration, calories: workout.calories, exercises: workout.exercises || [] });
    setShowForm(true); setShowModal(false);
  };

  const handleNewItem = () => { setEditingWorkout(null); setFormData({ name: '', type: 'Strength', difficulty: 'Medium', duration: 45, calories: 300, exercises: [] }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorkout) {
        const response = await axios.put(`/api/workouts/${editingWorkout.id}`, formData);
        setWorkouts(workouts.map(w => w.id === editingWorkout.id ? response.data : w));
      } else {
        const response = await axios.post('/api/workouts', { ...formData, user_id: user.id });
        setWorkouts([response.data, ...workouts]);
      }
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/workout/generate', { fitnessLevel: 'Intermediate', goals: 'Build strength and endurance', duration: 45, equipment: 'Full gym', focusAreas: 'Full body', user_id: user.id });
      setAiAnalysis(response.data.analysis);
      if (response.data.savedRecord) setWorkouts(prev => [response.data.savedRecord, ...prev]);
    } catch (err) { setAiAnalysis({ error: true, content: 'Failed to generate workout.' }); }
    finally { setAiLoading(false); }
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#667eea', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#f093fb', marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#38ef7d', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^[-*] /, '')}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{line.replace(/\*\*/g, '')}</p>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{line}</p>;
    });
  };

  if (loading) return <div className="page-container"><div className="loading-screen"><div className="loading-spinner"></div><p>Loading workouts...</p></div></div>;

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div><h2 className="page-title">🏋️ AI Workout Generator</h2><p className="page-subtitle">Custom exercise plans powered by AI</p></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleAiGenerate} className="btn btn-ai" disabled={aiLoading}>{aiLoading ? 'Generating...' : 'Generate AI Workout'}</button>
            <button onClick={handleNewItem} className="btn btn-primary">+ New Workout</button>
          </div>
        </div>

        <div className="search-bar">
          <input className="search-input" placeholder="Search workouts..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search workouts" />
        </div>

        {aiAnalysis && !showModal && (
          <div className="ai-analysis">
            <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Generated Workout Plan</span></div>
            <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
            <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
          </div>
        )}

        {workouts.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏋️</div><h3>No workouts yet</h3><p>Create your first workout or generate one with AI</p></div>
        ) : (
          <>
            <div className="card-grid">
              {workouts.map((workout) => (
                <div key={workout.id} className="card" onClick={() => handleRowClick(workout)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleRowClick(workout)} aria-label={`View ${workout.name}`}>
                  <div className="card-header">
                    <h3 className="card-title">{workout.name}</h3>
                    <span className={`card-badge ${workout.difficulty?.toLowerCase()}`}>{workout.difficulty}</span>
                  </div>
                  <div className="card-content"><p>Type: {workout.type}</p></div>
                  <div className="card-stats">
                    <div className="stat"><span className="stat-value">{workout.duration}</span><span className="stat-label">Minutes</span></div>
                    <div className="stat"><span className="stat-value">{workout.calories}</span><span className="stat-label">Calories</span></div>
                    <div className="stat"><span className="stat-value">{workout.exercises?.length || 0}</span><span className="stat-label">Exercises</span></div>
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

      {showModal && selectedWorkout && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Workout details">
            <div className="modal-header">
              <h2 className="modal-title">{selectedWorkout.name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3 className="detail-section-title">Workout Details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Type</span><span className="detail-value">{selectedWorkout.type}</span></div>
                  <div className="detail-item"><span className="detail-label">Difficulty</span><span className="detail-value">{selectedWorkout.difficulty}</span></div>
                  <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{selectedWorkout.duration} min</span></div>
                  <div className="detail-item"><span className="detail-label">Calories</span><span className="detail-value">{selectedWorkout.calories}</span></div>
                </div>
              </div>
              {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Exercises</h3>
                  {selectedWorkout.exercises.map((exercise, idx) => (
                    <div key={idx} className="detail-item" style={{ marginBottom: '0.5rem' }}>
                      <span className="detail-value">{exercise.name}</span>
                      <span className="detail-label">{exercise.sets} sets x {exercise.reps} reps</span>
                    </div>
                  ))}
                </div>
              )}
              {aiAnalysis && (
                <div className="ai-analysis">
                  <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Analysis</span></div>
                  <div className="ai-analysis-content">{renderAiContent(aiAnalysis.content)}</div>
                  <div className="ai-analysis-meta">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => handleEdit(selectedWorkout)} className="btn btn-primary">Edit</button>
              <button onClick={() => handleDelete(selectedWorkout.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Workout form">
            <div className="modal-header">
              <h2 className="modal-title">{editingWorkout ? 'Edit Workout' : 'New Workout'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="Strength">Strength</option><option value="HIIT">HIIT</option><option value="Cardio">Cardio</option><option value="Flexibility">Flexibility</option><option value="Core">Core</option><option value="CrossFit">CrossFit</option></select></div>
                  <div className="form-group"><label className="form-label">Difficulty</label><select className="form-select" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Duration (minutes)</label><input type="number" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} /></div>
                  <div className="form-group"><label className="form-label">Calories</label><input type="number" className="form-input" value={formData.calories} onChange={e => setFormData({ ...formData, calories: parseInt(e.target.value) })} /></div>
                </div>
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

export default WorkoutList;
