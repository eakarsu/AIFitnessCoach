const express = require('express');
const router = express.Router();
const https = require('https');

// OpenRouter API call helper
const callOpenRouter = async (prompt, systemPrompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 10000,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Fitness Coach'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content);
          } else if (parsed.error) {
            reject(new Error(parsed.error.message || 'API Error'));
          } else {
            resolve(responseData);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
};

// AI Workout Generator
router.post('/workout/generate', async (req, res) => {
  const pool = req.app.locals.pool;
  const { fitnessLevel, goals, duration, equipment, focusAreas, user_id } = req.body;

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

    // Save AI-generated workout to database
    const saved = await pool.query(
      'INSERT INTO workouts (user_id, name, type, difficulty, duration, calories, ai_generated, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [user_id || 1, `AI Workout - ${goals || 'General fitness'}`, focusAreas || 'Full body', fitnessLevel || 'Intermediate', duration || 45, 0, true, JSON.stringify(analysis)]
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
router.post('/golf/analyze', async (req, res) => {
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

    // Save AI analysis to database if we have an existing record
    if (id) {
      await pool.query(
        'UPDATE golf_swings SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('AI Golf Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze golf swing', details: err.message });
  }
});

// AI Running Coach - Pace Optimization
router.post('/running/analyze', async (req, res) => {
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

    // Save AI analysis to database if we have an existing record
    if (id) {
      await pool.query(
        'UPDATE running_sessions SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('AI Running Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze running session', details: err.message });
  }
});

// AI Team Formation Optimizer
router.post('/team/optimize', async (req, res) => {
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

    // Save AI analysis to database if we have an existing record
    if (id) {
      await pool.query(
        'UPDATE team_formations SET ai_analysis = $1 WHERE id = $2',
        [JSON.stringify(analysis), id]
      );
    }

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('AI Team Optimization Error:', err);
    res.status(500).json({ error: 'Failed to optimize team formation', details: err.message });
  }
});

// AI Recovery Advisor
router.post('/recovery/advise', async (req, res) => {
  const pool = req.app.locals.pool;
  const { activity_type, intensity, duration, muscle_groups, current_soreness, sleep_quality, stress_level, goals, notes, user_id } = req.body;

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

    // Save AI-generated recovery plan to database
    const saved = await pool.query(
      'INSERT INTO recovery_plans (user_id, name, recovery_type, duration, intensity, sleep_hours, notes, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [user_id || 1, `AI Recovery - ${activity_type || 'General'}`, activity_type || 'Active Recovery', duration || 3, intensity || 'Light', 8, notes || '', JSON.stringify(analysis)]
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

module.exports = router;
