
import CompleteTrainingExamples from "./CompleteTrainingExamples";
import FormattedAIReport from "./FormattedAIReport";
import React, { useState, useEffect } from 'react';
import api, { aiApi } from '../services/api';

/**
 * Surfaces the 5 advanced (formerly dead-code) AI endpoints from server/routes/aiNew.js
 * behind a tabbed dashboard:
 *   - /api/ai/periodization-plan
 *   - /api/ai/performance-trend
 *   - /api/ai/injury-risk
 *   - /api/ai/nutrition-plan
 *   - /api/ai/team-challenge
 *
 * Each tab renders its own form, calls the matching aiApi method, and shows the
 * markdown-ish AI response with the same renderer used by the legacy lists.
 */
function AIInsights() {

  const [tab, setTab] = useState('periodization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Per-tab form state.
  const [periodForm, setPeriodForm] = useState({ goal: 'Strength gain', duration_weeks: 8, available_days: 4, sports: 'Strength training' });
  const [trendForm, setTrendForm] = useState({ sport: 'running', metric: 'pace' });
  const [nutritionForm, setNutritionForm] = useState({ goal: 'muscle_gain', dietary_restrictions: '', weight_kg: 75, height_cm: 175, age: 30 });
  const [challengeForm, setChallengeForm] = useState({ team_id: '', challenge_type: 'points-based', duration_days: 7 });

  const [teams, setTeams] = useState([]);
  useEffect(() => { api.get('/api/team?limit=100').then(res => setTeams(res.data.data || res.data || [])).catch(() => setTeams([])); }, []);
  const fillExample = (index) => {
    if (tab === 'periodization') setPeriodForm({ goal: ['Build general strength', 'Develop aerobic endurance', 'Consolidate training consistency'][index], duration_weeks: [4, 8, 6][index], available_days: [3, 4, 2][index], sports: ['Strength training', 'Running and cycling', 'Walking and mobility'][index] });
    if (tab === 'trend') setTrendForm({ sport: ['running', 'golf', 'strength'][index], metric: ['pace', 'clubhead speed', 'estimated one-rep maximum'][index] });
    if (tab === 'nutrition') setNutritionForm(current => ({ goal: ['maintenance', 'endurance', 'muscle_gain'][index], dietary_restrictions: current.dietary_restrictions || 'Fictional example: vegetarian preference; confirm actual restrictions and allergies.', weight_kg: [75, 68, 82][index], height_cm: [175, 168, 182][index], age: [30, 40, 35][index] }));
    if (tab === 'challenge') setChallengeForm(current => ({ team_id: current.team_id || String(teams[0]?.id || ''), challenge_type: ['Consistency', 'Activity minutes', 'Recovery habits'][index], duration_days: [7, 14, 10][index] }));
  };

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn();
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'periodization', label: 'Periodization', icon: '🗓️' },
    { id: 'trend', label: 'Performance Trend', icon: '📈' },
    { id: 'injury', label: 'Injury Risk', icon: '⚕️' },
    { id: 'nutrition', label: 'Nutrition Plan', icon: '🥗' },
    { id: 'challenge', label: 'Team Challenge', icon: '🏆' },
  ];

  // Pick the .content / .challenge / etc text out of whichever shape the
  // server returned — these endpoints all wrap their text differently.
  const pickResultText = (data) => {
    if (!data) return null;
    return (
      data?.plan?.content ||
      data?.analysis?.content ||
      data?.assessment?.content ||
      data?.nutrition_plan?.content ||
      data?.challenge?.content ||
      null
    );
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div>
            <h2 className="page-title">🧠 AI Insights</h2>
            <p className="page-subtitle">Advanced AI tools tailored to your training history</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTab(t.id); setResult(null); setError(null); }}
            >
              <span style={{ marginRight: '0.4rem' }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab !== 'injury' && <CompleteTrainingExamples onFill={fillExample} disabled={loading} />}
        {tab === 'challenge' && !challengeForm.team_id && <p role="status">Select a real team from the Team page before generating a challenge.</p>}
        {tab === 'periodization' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Periodization Plan</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Goal</label><input className="form-input" value={periodForm.goal} onChange={e => setPeriodForm({ ...periodForm, goal: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Weeks</label><input type="number" className="form-input" value={periodForm.duration_weeks} onChange={e => setPeriodForm({ ...periodForm, duration_weeks: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Days/Week</label><input type="number" className="form-input" value={periodForm.available_days} onChange={e => setPeriodForm({ ...periodForm, available_days: parseInt(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">Sports</label><input className="form-input" value={periodForm.sports} onChange={e => setPeriodForm({ ...periodForm, sports: e.target.value })} /></div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => aiApi.periodizationPlan(periodForm))}>
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        )}

        {tab === 'trend' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Performance Trend (last 30 days)</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Sport</label>
                <select className="form-select" value={trendForm.sport} onChange={e => setTrendForm({ ...trendForm, sport: e.target.value })}>
                  <option value="running">Running</option>
                  <option value="golf">Golf</option>
                  <option value="strength">Strength</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Metric</label><input className="form-input" value={trendForm.metric} onChange={e => setTrendForm({ ...trendForm, metric: e.target.value })} /></div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => aiApi.performanceTrend(trendForm))}>
              {loading ? 'Analyzing...' : 'Analyze Trend'}
            </button>
          </div>
        )}

        {tab === 'injury' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Injury Risk Assessment</h3>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>Uses your last 14 days of training load.</p>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => aiApi.injuryRisk({}))}>
              {loading ? 'Assessing...' : 'Assess Injury Risk'}
            </button>
          </div>
        )}

        {tab === 'nutrition' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Nutrition Plan</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Goal</label>
                <select className="form-select" value={nutritionForm.goal} onChange={e => setNutritionForm({ ...nutritionForm, goal: e.target.value })}>
                  <option value="weight_loss">Weight loss</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Dietary restrictions</label><input className="form-input" value={nutritionForm.dietary_restrictions} onChange={e => setNutritionForm({ ...nutritionForm, dietary_restrictions: e.target.value })} placeholder="vegetarian, gluten-free..." /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Weight (kg)</label><input type="number" className="form-input" value={nutritionForm.weight_kg} onChange={e => setNutritionForm({ ...nutritionForm, weight_kg: parseFloat(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">Height (cm)</label><input type="number" className="form-input" value={nutritionForm.height_cm} onChange={e => setNutritionForm({ ...nutritionForm, height_cm: parseFloat(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">Age</label><input type="number" className="form-input" value={nutritionForm.age} onChange={e => setNutritionForm({ ...nutritionForm, age: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => aiApi.nutritionPlan(nutritionForm))}>
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        )}

        {tab === 'challenge' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Team Challenge</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Team ID</label><input className="form-input" value={challengeForm.team_id} onChange={e => setChallengeForm({ ...challengeForm, team_id: e.target.value })} placeholder="From the Team page" /></div>
              <div className="form-group"><label className="form-label">Type</label><input className="form-input" value={challengeForm.challenge_type} onChange={e => setChallengeForm({ ...challengeForm, challenge_type: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Days</label><input type="number" className="form-input" value={challengeForm.duration_days} onChange={e => setChallengeForm({ ...challengeForm, duration_days: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <button className="btn btn-ai" disabled={loading || !challengeForm.team_id} onClick={() => run(() => aiApi.teamChallenge(challengeForm))}>
              {loading ? 'Designing...' : 'Design Challenge'}
            </button>
          </div>
        )}

        {error && (
          <div className="ai-analysis" style={{ marginTop: '1.5rem', borderColor: '#ef4444' }}>
            <div className="ai-analysis-header"><span className="ai-icon">⚠️</span><span className="ai-analysis-title">Error</span></div>
            <div className="ai-analysis-content">{error}</div>
          </div>
        )}

        {result && (
          <div className="ai-analysis" style={{ marginTop: '1.5rem' }}>
            <div className="ai-analysis-header"><span className="ai-icon">🤖</span><span className="ai-analysis-title">AI Result</span></div>
            <div className="ai-analysis-content">
              <FormattedAIReport response={pickResultText(result) || result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIInsights;
