const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter, extractCaloriesFromText } = require('../utils/openrouter');

// AI Workout Generator
router.post('/workout/generate', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { fitnessLevel, goals, duration, equipment, focusAreas } = req.body;
  const user_id = req.user.id;

  const systemPrompt = `You are an expert fitness coach and workout designer. Create detailed, safe, and effective workout plans.
  Always include warm-up and cool-down. Format your response as a structured workout plan with:
  - Workout name
  - Total duration
  - Difficulty level
  - Equipment needed
  - Warm-up exercises (3-5 minutes)
  - Main workout (sets, reps, rest periods)
  - Cool-down stretches
  - Tips for proper form
  - Estimated calories burned`;

  const prompt = `Create a personalized workout plan with the following requirements:
  - Fitness Level: ${fitnessLevel || 'Intermediate'}
  - Goals: ${goals || 'General fitness'}
  - Duration: ${duration || 45} minutes
  - Available Equipment: ${equipment || 'Full gym'}
  - Focus Areas: ${focusAreas || 'Full body'}

  Please provide a complete, detailed workout plan.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Workout Plan',
      generatedAt: new Date().toISOString(),
      parameters: { fitnessLevel, goals, duration, equipment, focusAreas },
      content: response
    };

    // Extract calories burned from AI text — falls back to a sensible default
    // based on duration if the model didn't print a number we could match.
    const extracted = extractCaloriesFromText(response);
    const caloriesEstimate = extracted != null
      ? extracted
      : Math.max(50, Math.round((duration || 45) * 7));

    // Save AI-generated workout to database
    const saved = await pool.query(
      'INSERT INTO workouts (user_id, name, type, difficulty, duration, calories, ai_generated, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [user_id, `AI Workout - ${goals || 'General fitness'}`, focusAreas || 'Full body', fitnessLevel || 'Intermediate', duration || 45, caloriesEstimate, true, JSON.stringify(analysis)]
    );

    res.json({
      success: true,
      analysis,
      savedRecord: saved.rows[0]
    });
  } catch (err) {
    console.error('AI Workout Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate workout', details: err.message });
  }
});

// AI Golf Swing Analyzer
router.post('/golf/analyze', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes } = req.body;

  const systemPrompt = `You are an expert PGA golf instructor and swing analyst. Analyze golf swing data and provide:
  - Technical assessment of the swing metrics
  - Comparison to tour averages
  - Specific areas for improvement
  - Drills and exercises to improve
  - Equipment recommendations if applicable
  Format your response in clear sections with actionable advice.`;

  const prompt = `Analyze this golf swing data:
  - Club: ${club_type}
  - Swing Speed: ${swing_speed} mph
  - Ball Speed: ${ball_speed} mph
  - Launch Angle: ${launch_angle}°
  - Spin Rate: ${spin_rate} rpm
  - Carry Distance: ${carry_distance} yards
  - Total Distance: ${total_distance} yards
  - Player Notes: ${notes || 'None'}

  Provide a comprehensive swing analysis with specific recommendations for improvement.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Golf Swing Analysis',
      generatedAt: new Date().toISOString(),
      metrics: { club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance },
      content: response
    };

    if (id) {
      await pool.query(
        'UPDATE golf_swings SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI Golf Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze golf swing', details: err.message });
  }
});

// AI Running Coach - Pace Optimization
router.post('/running/analyze', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, terrain, weather, goals, notes } = req.body;

  const systemPrompt = `You are an expert running coach specializing in pace optimization and training plans. Analyze running data and provide:
  - Performance assessment
  - Pace zone analysis (easy, tempo, threshold, interval)
  - Heart rate zone evaluation
  - Training recommendations
  - Race predictions based on current fitness
  - Weekly training structure suggestions
  Format your response with clear sections and actionable training advice.`;

  const prompt = `Analyze this running session:
  - Distance: ${distance} km
  - Duration: ${duration} minutes
  - Average Pace: ${pace}
  - Average Heart Rate: ${heart_rate_avg} bpm
  - Max Heart Rate: ${heart_rate_max} bpm
  - Elevation Gain: ${elevation_gain} m
  - Terrain: ${terrain}
  - Weather: ${weather}
  - Runner's Goals: ${goals || 'Improve overall fitness'}
  - Notes: ${notes || 'None'}

  Provide pace optimization advice and training recommendations.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Running Analysis',
      generatedAt: new Date().toISOString(),
      sessionData: { distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, terrain, weather },
      content: response
    };

    if (id) {
      await pool.query(
        'UPDATE running_sessions SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI Running Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze running session', details: err.message });
  }
});

// AI Team Formation Optimizer
router.post('/team/optimize', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, team_name, sport, formation, players, strategy, opponent, notes } = req.body;

  const systemPrompt = `You are an expert sports tactician and team formation specialist. Analyze team compositions and provide:
  - Formation analysis and effectiveness
  - Player positioning recommendations
  - Tactical adjustments
  - Strengths and weaknesses assessment
  - Counter-strategies for opponents
  - Set piece suggestions
  - Substitution patterns
  Format your response with clear tactical diagrams descriptions and actionable strategies.`;

  const prompt = `Optimize this team formation:
  - Team: ${team_name}
  - Sport: ${sport}
  - Current Formation: ${formation}
  - Players: ${JSON.stringify(players)}
  - Current Strategy: ${strategy}
  - Opponent: ${opponent || 'Unknown'}
  - Additional Notes: ${notes || 'None'}

  Provide formation optimization suggestions and tactical recommendations.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Team Formation Optimization',
      generatedAt: new Date().toISOString(),
      teamData: { team_name, sport, formation, strategy },
      content: response
    };

    if (id) {
      await pool.query(
        'UPDATE team_formations SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI Team Optimization Error:', err);
    res.status(500).json({ error: 'Failed to optimize team formation', details: err.message });
  }
});

// AI Recovery Advisor
router.post('/recovery/advise', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { activity_type, intensity, duration, muscle_groups, current_soreness, sleep_quality, stress_level, goals, notes } = req.body;
  const user_id = req.user.id;

  const systemPrompt = `You are an expert sports recovery specialist and physical therapist. Provide comprehensive recovery advice including:
  - Recovery timeline assessment
  - Active recovery recommendations
  - Nutrition guidance for recovery
  - Sleep optimization tips
  - Stretching and mobility routines
  - When to return to training
  - Warning signs to watch for
  - Supplements that may help (with disclaimers)
  Format your response with clear, actionable recovery protocols.`;

  const prompt = `Create a recovery plan based on:
  - Recent Activity: ${activity_type}
  - Intensity Level: ${intensity}
  - Duration: ${duration} minutes
  - Muscle Groups Used: ${muscle_groups || 'Full body'}
  - Current Soreness Level (1-10): ${current_soreness || 5}
  - Sleep Quality: ${sleep_quality || 'Average'}
  - Stress Level: ${stress_level || 'Moderate'}
  - Recovery Goals: ${goals || 'Quick recovery for next session'}
  - Notes: ${notes || 'None'}

  Provide a comprehensive recovery plan with nutrition and rest recommendations.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Recovery Plan',
      generatedAt: new Date().toISOString(),
      parameters: { activity_type, intensity, duration, muscle_groups, current_soreness, sleep_quality, stress_level },
      content: response
    };

    const saved = await pool.query(
      'INSERT INTO recovery_plans (user_id, name, recovery_type, duration, intensity, sleep_hours, notes, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [user_id, `AI Recovery - ${activity_type || 'General'}`, activity_type || 'Active Recovery', duration || 3, intensity || 'Light', 8, notes || '', JSON.stringify(analysis)]
    );

    res.json({
      success: true,
      analysis,
      savedRecord: saved.rows[0]
    });
  } catch (err) {
    console.error('AI Recovery Advice Error:', err);
    res.status(500).json({ error: 'Failed to generate recovery advice', details: err.message });
  }
});

// AI Nutrition Recommender
router.post('/nutrition/recommend', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const {
    age,
    sex,
    weight_kg,
    height_cm,
    activity_level,
    goal,
    dietary_restrictions,
    allergies,
    cuisine_preferences,
    notes,
  } = req.body;
  const user_id = req.user.id;

  const systemPrompt = `You are a registered dietitian and certified sports nutritionist. Generate a personalized daily nutrition plan.
Always respect dietary restrictions and allergies. Include macro targets (kcal, protein, carbs, fat),
hydration, meal timing relative to workouts, and 3 example daily meal plans with portion guidance.
Add a brief disclaimer that this is general guidance and not a medical prescription.`;

  const prompt = `Build a daily nutrition recommendation for:
- Age: ${age || 'unspecified'}
- Sex: ${sex || 'unspecified'}
- Weight (kg): ${weight_kg || 'unspecified'}
- Height (cm): ${height_cm || 'unspecified'}
- Activity level: ${activity_level || 'moderate'}
- Goal: ${goal || 'maintenance'}
- Dietary restrictions: ${dietary_restrictions || 'none'}
- Allergies: ${allergies || 'none'}
- Cuisine preferences: ${cuisine_preferences || 'flexible'}
- Notes: ${notes || 'none'}

Provide:
1. Estimated daily calories (kcal)
2. Macros (g protein / g carbs / g fat) and rationale
3. 3 example meal plans (breakfast/lunch/dinner/snacks) with portions
4. Hydration target (L/day)
5. Pre/post workout fueling guidance
6. Brief disclaimer`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    const analysis = {
      type: 'Nutrition Plan',
      generatedAt: new Date().toISOString(),
      parameters: { age, sex, weight_kg, height_cm, activity_level, goal, dietary_restrictions, allergies },
      estimatedCaloriesKcal: extractCaloriesFromText ? extractCaloriesFromText(response) : null,
      content: response,
    };

    // Best-effort persistence; ignore if no nutrition_plans table.
    try {
      await pool.query(
        'INSERT INTO nutrition_plans (user_id, goal, content, created_at) VALUES ($1, $2, $3, NOW())',
        [user_id, goal || 'maintenance', JSON.stringify(analysis)]
      );
    } catch (e) {
      // Table may not exist yet; analysis still returned.
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI Nutrition Recommend Error:', err);
    res.status(500).json({ error: 'Failed to generate nutrition plan', details: err.message });
  }
});

// AI Injury Prevention
router.post('/injury/prevent', authenticateToken, async (req, res) => {
  const {
    sport,
    weekly_volume_hours,
    recent_intensity,
    history_of_injuries,
    age,
    asymmetries,
    notes,
  } = req.body;

  const systemPrompt = `You are a sports physical therapist. Recommend injury prevention strategies tailored to the athlete's sport,
volume, and injury history. Include screening tests, mobility/strength priorities, load management, and red flags.
Add a disclaimer to seek a professional for current pain or significant past injury.`;

  const prompt = `Generate an injury-prevention plan for:
- Sport: ${sport || 'general fitness'}
- Weekly training volume (hours): ${weekly_volume_hours || 'unspecified'}
- Recent intensity: ${recent_intensity || 'moderate'}
- Past injuries: ${history_of_injuries || 'none'}
- Age: ${age || 'unspecified'}
- Known asymmetries: ${asymmetries || 'none'}
- Notes: ${notes || 'none'}

Return a structured plan with: top risks, screening tests, weekly mobility routine, strengthening priorities,
load-management rules, and warning signs.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    res.json({
      success: true,
      analysis: {
        type: 'Injury Prevention Plan',
        generatedAt: new Date().toISOString(),
        parameters: { sport, weekly_volume_hours, history_of_injuries, age },
        content: response,
      },
    });
  } catch (err) {
    console.error('AI Injury Prevent Error:', err);
    res.status(500).json({ error: 'Failed to generate injury-prevention plan', details: err.message });
  }
});

// AI Form Correction (text-only)
// Mechanical text-mode counterpart to a vision-based form correction pipeline.
// Accepts an exercise name + free-form symptoms / cues / video frame description
// and returns structured form cues + corrective drills + safety flags.
router.post('/form-correct', authenticateToken, async (req, res) => {
  const {
    exercise,
    experience_level,
    symptoms,
    self_description,
    equipment,
    notes,
  } = req.body;

  const systemPrompt = `You are a certified strength & conditioning coach and movement specialist.
The user CANNOT upload video — base your analysis on their text description.
Return clear, structured advice with:
- Likely form errors implied by the symptoms / description
- Specific corrective cues (1 sentence each)
- 3 corrective drills (name, sets x reps, focus)
- Safety red flags that warrant stopping or consulting a clinician
- A short disclaimer that this is general guidance, not medical advice.
Keep tone supportive, body-neutral, and avoid diagnosing injuries.`;

  const prompt = `Provide form-correction advice for:
- Exercise: ${exercise || 'unspecified'}
- Experience level: ${experience_level || 'intermediate'}
- Symptoms or pain points: ${symptoms || 'none reported'}
- User description of the movement: ${self_description || 'not provided'}
- Equipment: ${equipment || 'standard'}
- Notes: ${notes || 'none'}

Return sections: Likely Errors, Cues, Corrective Drills, Red Flags, Disclaimer.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    res.json({
      success: true,
      analysis: {
        type: 'Form Correction (text)',
        generatedAt: new Date().toISOString(),
        parameters: { exercise, experience_level, equipment },
        content: response,
      },
    });
  } catch (err) {
    const msg = err && err.message ? err.message : '';
    if (/OPENROUTER_API_KEY/i.test(msg)) {
      return res.status(503).json({ error: 'AI provider not configured', details: msg });
    }
    console.error('AI Form Correct Error:', err);
    res.status(500).json({ error: 'Failed to generate form-correction advice', details: msg });
  }
});

// AI Motivation / Accountability messages
router.post('/motivation', authenticateToken, async (req, res) => {
  const { mood, recent_progress, upcoming_goal, channel = 'short', tone = 'encouraging' } = req.body;

  const systemPrompt = `You are a positive, evidence-based fitness coach. Generate motivational, non-toxic, body-neutral
messages tailored to the user's mood and goals. Avoid shaming language and avoid medical claims.`;

  const prompt = `Create a ${channel === 'short' ? '1-3 sentence' : '1 paragraph'} motivational message in a ${tone} tone for a user.
Mood: ${mood || 'neutral'}
Recent progress: ${recent_progress || 'unspecified'}
Upcoming goal: ${upcoming_goal || 'general fitness'}

Also provide 3 short, concrete actions they can take today.`;

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    res.json({
      success: true,
      message: response,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI Motivation Error:', err);
    res.status(500).json({ error: 'Failed to generate motivational message', details: err.message });
  }
});

module.exports = router;
