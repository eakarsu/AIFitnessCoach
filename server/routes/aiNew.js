const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../utils/openrouter');

// POST /api/ai/periodization-plan
router.post('/periodization-plan', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { goal, duration_weeks, available_days, sports } = req.body;
  const user_id = req.user.id;

  if (!goal || !duration_weeks || !available_days) {
    return res.status(400).json({ error: 'goal, duration_weeks, and available_days are required' });
  }

  try {
    const workoutsResult = await pool.query(
      'SELECT name, type, difficulty, duration, calories, created_at FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [user_id]
    );
    const recoveryResult = await pool.query(
      'SELECT name, recovery_type, duration, intensity, created_at FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [user_id]
    );

    const recentWorkouts = workoutsResult.rows;
    const recentRecovery = recoveryResult.rows;

    const systemPrompt = `You are an expert strength and conditioning coach specializing in periodization planning.
    Create structured multi-week training plans using sound periodization principles (linear, undulating, or block periodization).
    Format your response as a structured plan with:
    - Overview and goals
    - Weekly breakdown (each week with focus, volume, intensity)
    - Key workouts per phase
    - Deload weeks
    - Progress markers and testing points`;

    const prompt = `Create a ${duration_weeks}-week periodization plan for an athlete with:
    - Primary Goal: ${goal}
    - Available Training Days per Week: ${available_days}
    - Sports/Activities: ${sports || 'General fitness'}

    Recent training history (last 10 workouts):
    ${recentWorkouts.length > 0 ? JSON.stringify(recentWorkouts, null, 2) : 'No recent workout history available'}

    Recent recovery data:
    ${recentRecovery.length > 0 ? JSON.stringify(recentRecovery, null, 2) : 'No recent recovery data available'}

    Provide a detailed periodization plan tailored to this athlete's history and goals.`;

    const response = await callOpenRouter(prompt, systemPrompt);

    const planContent = {
      type: 'Periodization Plan',
      generatedAt: new Date().toISOString(),
      parameters: { goal, duration_weeks, available_days, sports },
      content: response
    };

    const saved = await pool.query(
      'INSERT INTO workouts (user_id, name, type, difficulty, duration, calories, ai_generated, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [user_id, `AI Periodization Plan - ${goal}`, 'Periodization', 'Intermediate', duration_weeks * 7 * 24 * 60, 0, true, JSON.stringify(planContent)]
    );

    res.json({ success: true, plan: planContent, savedRecord: saved.rows[0] });
  } catch (err) {
    console.error('AI Periodization Plan Error:', err);
    res.status(500).json({ error: 'Failed to generate periodization plan', details: err.message });
  }
});

// POST /api/ai/performance-trend
router.post('/performance-trend', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { sport, metric } = req.body;
  const user_id = req.user.id;

  if (!sport || !metric) {
    return res.status(400).json({ error: 'sport and metric are required' });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let sessionsData = [];

    if (sport.toLowerCase().includes('running')) {
      const result = await pool.query(
        'SELECT distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, terrain, date FROM running_sessions WHERE user_id = $1 AND date >= $2 ORDER BY date ASC',
        [user_id, thirtyDaysAgo]
      );
      sessionsData = result.rows;
    } else if (sport.toLowerCase().includes('golf')) {
      const result = await pool.query(
        'SELECT club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, date FROM golf_swings WHERE user_id = $1 AND date >= $2 ORDER BY date ASC',
        [user_id, thirtyDaysAgo]
      );
      sessionsData = result.rows;
    } else {
      const result = await pool.query(
        'SELECT name, type, difficulty, duration, calories, created_at FROM workouts WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at ASC',
        [user_id, thirtyDaysAgo]
      );
      sessionsData = result.rows;
    }

    const systemPrompt = `You are an expert performance analyst and sports scientist. Analyze training data to identify trends, plateaus, and breakthrough opportunities.
    Provide:
    - Performance trend summary (improving/plateau/declining)
    - Key metrics analysis
    - Identified plateaus and their duration
    - Breakthrough opportunities and how to achieve them
    - Recommended adjustments to training
    - Predicted timeline for performance improvements`;

    const prompt = `Analyze performance trends for the following data:
    - Sport/Activity: ${sport}
    - Key Metric to Analyze: ${metric}
    - Time Period: Last 30 days

    Session Data (${sessionsData.length} sessions):
    ${sessionsData.length > 0 ? JSON.stringify(sessionsData, null, 2) : 'No sessions recorded in the last 30 days'}

    Identify performance trends, plateaus, and breakthrough opportunities. Provide specific, actionable insights.`;

    const response = await callOpenRouter(prompt, systemPrompt);

    res.json({
      success: true,
      analysis: {
        type: 'Performance Trend Analysis',
        generatedAt: new Date().toISOString(),
        parameters: { sport, metric, period: '30 days' },
        sessionCount: sessionsData.length,
        content: response
      }
    });
  } catch (err) {
    console.error('AI Performance Trend Error:', err);
    res.status(500).json({ error: 'Failed to analyze performance trend', details: err.message });
  }
});

// POST /api/ai/injury-risk
router.post('/injury-risk', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const user_id = req.user.id;

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const workoutsResult = await pool.query(
      'SELECT name, type, difficulty, duration, calories, created_at FROM workouts WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC',
      [user_id, fourteenDaysAgo]
    );
    const runningResult = await pool.query(
      'SELECT distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, terrain, date FROM running_sessions WHERE user_id = $1 AND date >= $2 ORDER BY date DESC',
      [user_id, fourteenDaysAgo]
    );
    const golfResult = await pool.query(
      'SELECT club_type, swing_speed, carry_distance, total_distance, date FROM golf_swings WHERE user_id = $1 AND date >= $2 ORDER BY date DESC',
      [user_id, fourteenDaysAgo]
    );
    const recoveryResult = await pool.query(
      'SELECT name, recovery_type, duration, intensity, sleep_hours, created_at FROM recovery_plans WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC',
      [user_id, fourteenDaysAgo]
    );

    const workouts = workoutsResult.rows;
    const runningSessions = runningResult.rows;
    const golfSessions = golfResult.rows;
    const recoveryPlans = recoveryResult.rows;

    const totalSessions = workouts.length + runningSessions.length + golfSessions.length;
    const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalRunningKm = runningSessions.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);

    const systemPrompt = `You are an expert sports medicine physician and injury prevention specialist.
    Analyze training load data to assess injury risk and provide prevention recommendations.
    Your assessment must include:
    - Overall injury risk level (1-10 scale, where 10 is highest risk)
    - Muscle groups at highest risk and why
    - Training load analysis (volume, intensity, recovery balance)
    - Specific injury types to watch for
    - Immediate prevention recommendations
    - Recovery adjustments needed
    - Warning signs to monitor
    Always recommend consulting a medical professional for actual injuries.`;

    const prompt = `Assess injury risk based on 14 days of training data:

    Training Summary:
    - Total sessions: ${totalSessions}
    - Total workout time: ${totalWorkoutMinutes} minutes
    - Total running distance: ${totalRunningKm.toFixed(1)} km
    - Golf sessions: ${golfSessions.length}

    Workout Details (last 14 days):
    ${workouts.length > 0 ? JSON.stringify(workouts, null, 2) : 'No workouts recorded'}

    Running Sessions:
    ${runningSessions.length > 0 ? JSON.stringify(runningSessions, null, 2) : 'No running sessions recorded'}

    Golf Sessions:
    ${golfSessions.length > 0 ? JSON.stringify(golfSessions, null, 2) : 'No golf sessions recorded'}

    Recovery Data:
    ${recoveryPlans.length > 0 ? JSON.stringify(recoveryPlans, null, 2) : 'No recovery plans recorded'}

    Provide a comprehensive injury risk assessment with specific muscle groups, risk score (1-10), and prevention recommendations.`;

    const response = await callOpenRouter(prompt, systemPrompt);

    res.json({
      success: true,
      assessment: {
        type: 'Injury Risk Assessment',
        generatedAt: new Date().toISOString(),
        period: '14 days',
        trainingLoad: {
          totalSessions,
          totalWorkoutMinutes,
          totalRunningKm: parseFloat(totalRunningKm.toFixed(1)),
          golfSessions: golfSessions.length
        },
        content: response
      }
    });
  } catch (err) {
    console.error('AI Injury Risk Error:', err);
    res.status(500).json({ error: 'Failed to assess injury risk', details: err.message });
  }
});

// POST /api/ai/nutrition-plan
router.post('/nutrition-plan', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const user_id = req.user.id;
  const { goal, dietary_restrictions, weight_kg, height_cm, age } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'goal is required (e.g., weight_loss, muscle_gain, endurance)' });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const workoutsResult = await pool.query(
      'SELECT name, type, duration, calories, difficulty, created_at FROM workouts WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 10',
      [user_id, sevenDaysAgo]
    );
    const runningResult = await pool.query(
      'SELECT distance, duration, pace, date FROM running_sessions WHERE user_id = $1 AND date >= $2 ORDER BY date DESC LIMIT 7',
      [user_id, sevenDaysAgo]
    );

    const totalCaloriesBurned = workoutsResult.rows.reduce((s, w) => s + (w.calories || 0), 0);
    const totalRunningKm = runningResult.rows.reduce((s, r) => s + (parseFloat(r.distance) || 0), 0);

    const systemPrompt = `You are an expert sports nutritionist and registered dietitian.
Create a personalized meal plan that complements training load and supports performance goals.
Your nutrition plan must include:
- Daily calorie target and macronutrient breakdown (protein/carbs/fats in grams)
- Pre-workout meal recommendations
- Post-workout recovery nutrition
- 3-day sample meal plan with specific foods and portions
- Hydration guidelines
- Key supplements to consider (evidence-based only)
- Foods to emphasize and avoid
Format your response clearly with sections and specific recommendations.`;

    const prompt = `Create a personalized nutrition plan:
Goal: ${goal}
Dietary restrictions: ${dietary_restrictions || 'None specified'}
Weight: ${weight_kg ? weight_kg + ' kg' : 'Not provided'}
Height: ${height_cm ? height_cm + ' cm' : 'Not provided'}
Age: ${age || 'Not provided'}

Training load (last 7 days):
- Workouts completed: ${workoutsResult.rows.length}
- Estimated calories burned from workouts: ${totalCaloriesBurned} kcal
- Running distance: ${totalRunningKm.toFixed(1)} km

Recent workouts: ${workoutsResult.rows.length > 0 ? JSON.stringify(workoutsResult.rows.map(w => ({ type: w.type, duration: w.duration, calories: w.calories, difficulty: w.difficulty }))) : 'No recent workouts'}

Please provide a comprehensive, actionable nutrition plan calibrated to this training load.`;

    const response = await callOpenRouter(prompt, systemPrompt);

    const saved = await pool.query(
      `INSERT INTO recovery_plans (user_id, name, recovery_type, duration, intensity, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, `AI Nutrition Plan - ${goal}`, 'nutrition', 0, 'low', response]
    );

    res.json({
      success: true,
      nutrition_plan: {
        id: saved.rows[0].id,
        goal,
        dietary_restrictions: dietary_restrictions || null,
        training_context: {
          workouts_last_7_days: workoutsResult.rows.length,
          calories_burned: totalCaloriesBurned,
          running_km: parseFloat(totalRunningKm.toFixed(1)),
        },
        content: response,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('AI Nutrition Plan Error:', err);
    res.status(500).json({ error: 'Failed to generate nutrition plan', details: err.message });
  }
});

// POST /api/ai/team-challenge
router.post('/team-challenge', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const user_id = req.user.id;
  const { team_id, challenge_type, duration_days } = req.body;

  if (!team_id) {
    return res.status(400).json({ error: 'team_id is required' });
  }

  try {
    const teamResult = await pool.query(
      'SELECT * FROM team_formations WHERE id = $1 AND user_id = $2',
      [team_id, user_id]
    );
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teamResult.rows[0];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const teamWorkouts = await pool.query(
      `SELECT u.email, COUNT(w.id) as workout_count, AVG(w.duration) as avg_duration, SUM(w.calories) as total_calories
       FROM workouts w
       JOIN users u ON w.user_id = u.id
       WHERE w.created_at >= $1
       GROUP BY u.email LIMIT 20`,
      [sevenDaysAgo]
    );

    const systemPrompt = `You are an expert fitness coach specializing in team motivation and competitive challenges.
Design an engaging team fitness challenge that motivates members through friendly competition.
The challenge must include:
- Challenge name and description
- Scoring system (point values for different activities)
- Weekly milestones and targets
- Team vs individual scoring rules
- 5 specific workout tasks for the challenge period
- How to track and submit scores
- Achievement badges (3 tiers: bronze/silver/gold criteria)
- Motivational framework to keep engagement high`;

    const prompt = `Design a ${duration_days || 7}-day team fitness challenge:
Team: ${team.name || 'Team ' + team.id}
Sport/Focus: ${team.sport || team.formation_type || challenge_type || 'General Fitness'}
Challenge type: ${challenge_type || 'points-based'}
Number of active members (recent 7 days): ${teamWorkouts.rows.length}

Member activity summary:
${teamWorkouts.rows.length > 0 ? JSON.stringify(teamWorkouts.rows) : 'No recent workout data — design for mixed fitness levels'}

Create a motivating challenge that works for teams of varied fitness levels.
The scoring should reward consistency over raw performance.`;

    const response = await callOpenRouter(prompt, systemPrompt);

    await pool.query(
      'UPDATE team_formations SET ai_analysis = $1 WHERE id = $2',
      [JSON.stringify({ challenge: response, generatedAt: new Date().toISOString() }), team_id]
    );

    res.json({
      success: true,
      challenge: {
        team_id,
        team_name: team.name || 'Team ' + team.id,
        duration_days: duration_days || 7,
        challenge_type: challenge_type || 'points-based',
        content: response,
        generatedAt: new Date().toISOString(),
        participants: teamWorkouts.rows.length,
      },
    });
  } catch (err) {
    console.error('AI Team Challenge Error:', err);
    res.status(500).json({ error: 'Failed to generate team challenge', details: err.message });
  }
});

// POST /api/ai/performance-projection
// Pass-5 backlog: predictive performance projections from training history.
// PRODUCT-DECISION: when wearable data is unavailable we fall back to the
// last 30 workouts + recovery plans only — does not need wearable creds.
router.post('/performance-projection', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { horizon_weeks = 8, target_metric = 'general_fitness' } = req.body || {};
  const user_id = req.user.id;

  try {
    const workouts = await pool.query(
      `SELECT name, type, difficulty, duration, calories, created_at
       FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [user_id]
    );
    const recovery = await pool.query(
      `SELECT recovery_type, duration, intensity, created_at
       FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [user_id]
    );

    const systemPrompt = `You are a sports scientist who builds projection models from training history.
Return strict JSON: {
  "current_baseline": {"metric": "...", "value": N, "unit": "..."},
  "projection_curve": [{"week": N, "projected_value": N, "confidence": "low|medium|high"}],
  "key_drivers": ["..."],
  "risk_factors": ["..."],
  "training_recommendations": ["..."],
  "disclaimer": "..."
}.  No prose outside JSON.`;
    const prompt = `Project ${target_metric} for the next ${horizon_weeks} weeks.

Recent workouts (${workouts.rows.length}):
${JSON.stringify(workouts.rows, null, 2)}

Recent recovery data (${recovery.rows.length}):
${JSON.stringify(recovery.rows, null, 2)}`;

    const response = await callOpenRouter(prompt, systemPrompt);
    res.json({
      success: true,
      projection: {
        target_metric,
        horizon_weeks: parseInt(horizon_weeks),
        content: response,
        generatedAt: new Date().toISOString(),
        sample_size: workouts.rows.length,
      },
    });
  } catch (err) {
    const msg = err && err.message ? err.message : '';
    if (/OPENROUTER_API_KEY/i.test(msg)) {
      return res.status(503).json({ error: 'AI provider not configured', missing: 'OPENROUTER_API_KEY' });
    }
    console.error('AI Performance Projection Error:', err);
    res.status(500).json({ error: 'Failed to generate projection', details: msg });
  }
});

module.exports = router;
