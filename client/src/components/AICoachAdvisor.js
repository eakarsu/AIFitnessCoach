
import CompleteTrainingExamples from "./CompleteTrainingExamples";
import FormattedAIReport from "./FormattedAIReport";
import React, { useState } from 'react';
import api from '../services/api';

/**
 * Surfaces the 3 new advisor endpoints added to server/routes/ai.js:
 *   - POST /api/ai/nutrition/recommend
 *   - POST /api/ai/injury/prevent
 *   - POST /api/ai/motivation
 *
 * Mirrors AIInsights.js styling (tabs / form-row / btn-ai / ai-analysis).
 */
function AICoachAdvisor() {

  const [tab, setTab] = useState('nutrition');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [nutritionForm, setNutritionForm] = useState({
    goal: 'muscle_gain',
    dietary_restrictions: '',
    activity_level: 'moderate',
    weight_kg: 75,
    height_cm: 175,
    age: 30,
    sex: 'unspecified',
  });

  const [injuryForm, setInjuryForm] = useState({
    sport: 'running',
    history: '',
    weekly_volume: '',
    notes: '',
  });

  const [motivationForm, setMotivationForm] = useState({
    mood: 'low',
    context: '',
    goal: 'consistency',
  });

  const [formCorrectForm, setFormCorrectForm] = useState({
    exercise: 'squat',
    experience_level: 'intermediate',
    symptoms: '',
    self_description: '',
    equipment: 'barbell',
    notes: '',
  });

  const fillExample = (index) => {
    if (tab === 'nutrition') setNutritionForm(current => ({ goal: ['maintenance', 'endurance', 'muscle_gain'][index], dietary_restrictions: current.dietary_restrictions || 'Fictional example: vegetarian preference; confirm actual restrictions and allergies.', activity_level: ['light', 'moderate', 'vigorous'][index], weight_kg: [75, 68, 82][index], height_cm: [175, 168, 182][index], age: [30, 40, 35][index], sex: 'unspecified' }));
    if (tab === 'injury') setInjuryForm(current => ({ sport: ['running', 'cycling', 'strength'][index], history: current.history || 'Fictional example: injury history has not been verified. Ask for actual history before personalized advice.', weekly_volume: ['3 hours per week', '4 hours per week', '2 hours per week'][index], notes: current.notes || 'Fictional training review. Identify evidence needed, stop-exercise red flags and qualified clinician follow-up; do not infer clearance.' }));
    if (tab === 'motivation') setMotivationForm({ mood: ['okay', 'good', 'low'][index], goal: ['consistency', 'enjoyment', 'recovery'][index], context: ['Fictional example: returning to a routine after a busy workweek.', 'Fictional example: planning a social walk with a friend.', 'Fictional example: scheduling rest after several active days.'][index] });
    if (tab === 'form') setFormCorrectForm(current => ({ exercise: ['squat', 'deadlift', 'push-up'][index], experience_level: ['beginner', 'intermediate', 'beginner'][index], symptoms: current.symptoms || 'Fictional example: pain symptoms have not been confirmed; ask before suggesting a correction.', self_description: current.self_description || 'Fictional movement description: tempo becomes uneven on the final repetition. Request observation before confirming a technique issue.', equipment: ['bodyweight', 'barbell', 'bodyweight'][index], notes: current.notes || 'Draft educational cues only; preserve actual symptoms and seek qualified assessment for pain.' }));
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
    { id: 'nutrition', label: 'Nutrition Recommend', icon: '🥗' },
    { id: 'injury', label: 'Injury Prevention', icon: '⚕️' },
    { id: 'motivation', label: 'Motivation', icon: '💪' },
    { id: 'form', label: 'Form Correct (Text)', icon: '🧍' },
  ];

  const pickResultText = (data) => {
    if (!data) return null;
    return (
      data?.plan?.content ||
      data?.recommendation?.content ||
      data?.assessment?.content ||
      data?.message?.content ||
      data?.content ||
      data?.text ||
      null
    );
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header">
          <div>
            <h2 className="page-title">🤖 AI Coach Advisor</h2>
            <p className="page-subtitle">Personalized nutrition, injury prevention, and motivation</p>
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

        <CompleteTrainingExamples onFill={fillExample} disabled={loading} />
        {tab === 'nutrition' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Daily Nutrition Recommendation</h3>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
              Generate macro-balanced daily plan with hydration and disclaimer.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Goal</label>
                <select className="form-select" value={nutritionForm.goal} onChange={(e) => setNutritionForm({ ...nutritionForm, goal: e.target.value })}>
                  <option value="weight_loss">Weight loss</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Activity level</label>
                <select className="form-select" value={nutritionForm.activity_level} onChange={(e) => setNutritionForm({ ...nutritionForm, activity_level: e.target.value })}>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="vigorous">Vigorous</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Dietary restrictions</label>
                <input className="form-input" value={nutritionForm.dietary_restrictions} onChange={(e) => setNutritionForm({ ...nutritionForm, dietary_restrictions: e.target.value })} placeholder="vegetarian, gluten-free..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-input" value={nutritionForm.weight_kg} onChange={(e) => setNutritionForm({ ...nutritionForm, weight_kg: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" className="form-input" value={nutritionForm.height_cm} onChange={(e) => setNutritionForm({ ...nutritionForm, height_cm: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={nutritionForm.age} onChange={(e) => setNutritionForm({ ...nutritionForm, age: parseInt(e.target.value, 10) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Sex</label>
                <select className="form-select" value={nutritionForm.sex} onChange={(e) => setNutritionForm({ ...nutritionForm, sex: e.target.value })}>
                  <option value="unspecified">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => api.post('/api/ai/nutrition/recommend', nutritionForm))}>
              {loading ? 'Generating...' : 'Generate Recommendation'}
            </button>
          </div>
        )}

        {tab === 'injury' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Injury Prevention Plan</h3>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
              Sport-specific screening tests, mobility, load management, red flags.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sport</label>
                <select className="form-select" value={injuryForm.sport} onChange={(e) => setInjuryForm({ ...injuryForm, sport: e.target.value })}>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="swimming">Swimming</option>
                  <option value="strength">Strength training</option>
                  <option value="golf">Golf</option>
                  <option value="soccer">Soccer</option>
                  <option value="basketball">Basketball</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Weekly volume</label>
                <input className="form-input" value={injuryForm.weekly_volume} onChange={(e) => setInjuryForm({ ...injuryForm, weekly_volume: e.target.value })} placeholder="e.g. 30 km, 5 sessions" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Injury history</label>
                <textarea className="form-input" rows={2} value={injuryForm.history} onChange={(e) => setInjuryForm({ ...injuryForm, history: e.target.value })} placeholder="Previous injuries, surgeries, niggles..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={injuryForm.notes} onChange={(e) => setInjuryForm({ ...injuryForm, notes: e.target.value })} placeholder="Anything else the coach should know" />
              </div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => api.post('/api/ai/injury/prevent', { ...injuryForm, weekly_volume_hours: injuryForm.weekly_volume, history_of_injuries: injuryForm.history }))}>
              {loading ? 'Building plan...' : 'Build Prevention Plan'}
            </button>
          </div>
        )}

        {tab === 'motivation' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Daily Motivation</h3>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
              Short, body-neutral motivational message with 3 actionable steps.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mood</label>
                <select className="form-select" value={motivationForm.mood} onChange={(e) => setMotivationForm({ ...motivationForm, mood: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="okay">Okay</option>
                  <option value="good">Good</option>
                  <option value="great">Great</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goal focus</label>
                <select className="form-select" value={motivationForm.goal} onChange={(e) => setMotivationForm({ ...motivationForm, goal: e.target.value })}>
                  <option value="consistency">Consistency</option>
                  <option value="recovery">Recovery</option>
                  <option value="performance">Performance</option>
                  <option value="weight_management">Weight management</option>
                  <option value="enjoyment">Enjoyment</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Context (optional)</label>
                <textarea className="form-input" rows={2} value={motivationForm.context} onChange={(e) => setMotivationForm({ ...motivationForm, context: e.target.value })} placeholder="What's going on today?" />
              </div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => api.post('/api/ai/motivation', motivationForm))}>
              {loading ? 'Drafting...' : 'Get Motivation'}
            </button>
          </div>
        )}

        {tab === 'form' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Text-Mode Form Correction</h3>
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
              Describe how the movement feels — get likely errors, cues, drills, and red flags. Video upload not required.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Exercise</label>
                <input className="form-input" value={formCorrectForm.exercise} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, exercise: e.target.value })} placeholder="back squat, deadlift, push-up..." />
              </div>
              <div className="form-group">
                <label className="form-label">Experience level</label>
                <select className="form-select" value={formCorrectForm.experience_level} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, experience_level: e.target.value })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipment</label>
                <input className="form-input" value={formCorrectForm.equipment} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, equipment: e.target.value })} placeholder="barbell, bodyweight, kettlebell..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Symptoms / pain points</label>
                <textarea className="form-input" rows={2} value={formCorrectForm.symptoms} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, symptoms: e.target.value })} placeholder="lower-back pinch at the bottom, knees cave inward..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Describe the movement</label>
                <textarea className="form-input" rows={3} value={formCorrectForm.self_description} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, self_description: e.target.value })} placeholder="I feel my heels lift, chest drops forward..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={formCorrectForm.notes} onChange={(e) => setFormCorrectForm({ ...formCorrectForm, notes: e.target.value })} placeholder="Anything else..." />
              </div>
            </div>
            <button className="btn btn-ai" disabled={loading} onClick={() => run(() => api.post('/api/ai/form-correct', formCorrectForm))}>
              {loading ? 'Analyzing...' : 'Get Form Cues'}
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

export default AICoachAdvisor;
