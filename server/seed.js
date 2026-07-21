require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_fitness_coach',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const seedData = async () => {
  if (process.env.RESET_DATABASE !== '1' || process.env.SEED_DEMO_DATA !== '1') throw new Error('Set RESET_DATABASE=1 and SEED_DEMO_DATA=1 for destructive demo seed');
  if (!process.env.SEED_DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD.length < 12) throw new Error('SEED_DEMO_PASSWORD must be at least 12 characters');
  try {
    // Clear existing data
    await pool.query('TRUNCATE users, workouts, golf_swings, running_sessions, team_formations, recovery_plans, user_profiles, user_settings, notifications, feedback, file_uploads, audit_logs RESTART IDENTITY CASCADE');

    // Seed users
    const hashedPassword = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD, 12);
    const userResult = await pool.query(
      'INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['demo@fitness.invalid', hashedPassword, 'Demo User', 'admin', true]
    );
    const userId = userResult.rows[0].id;

    // Seed user profile
    await pool.query(
      'INSERT INTO user_profiles (user_id, height, weight, age, fitness_level, gender, goals, injuries, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, 180, 82, 28, 'Intermediate', 'Male', 'Build muscle and improve endurance', 'Minor left knee pain from old injury', true]
    );

    // Seed user settings
    await pool.query(
      'INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, units, timezone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'dark', 'en', true, true, 'metric', 'America/New_York']
    );

    // Seed Workouts (16 items)
    const workouts = [
      { name: 'Full Body HIIT', type: 'HIIT', difficulty: 'Hard', duration: 45, calories: 500, exercises: JSON.stringify([{name: 'Burpees', sets: 3, reps: 15}, {name: 'Mountain Climbers', sets: 3, reps: 20}, {name: 'Jump Squats', sets: 3, reps: 15}]) },
      { name: 'Upper Body Strength', type: 'Strength', difficulty: 'Medium', duration: 60, calories: 350, exercises: JSON.stringify([{name: 'Bench Press', sets: 4, reps: 10}, {name: 'Rows', sets: 4, reps: 12}, {name: 'Shoulder Press', sets: 3, reps: 10}]) },
      { name: 'Lower Body Power', type: 'Strength', difficulty: 'Hard', duration: 55, calories: 400, exercises: JSON.stringify([{name: 'Squats', sets: 4, reps: 8}, {name: 'Deadlifts', sets: 4, reps: 6}, {name: 'Lunges', sets: 3, reps: 12}]) },
      { name: 'Core Blast', type: 'Core', difficulty: 'Medium', duration: 30, calories: 200, exercises: JSON.stringify([{name: 'Planks', sets: 3, reps: '60s'}, {name: 'Russian Twists', sets: 3, reps: 20}, {name: 'Leg Raises', sets: 3, reps: 15}]) },
      { name: 'Cardio Endurance', type: 'Cardio', difficulty: 'Medium', duration: 40, calories: 450, exercises: JSON.stringify([{name: 'Treadmill', sets: 1, reps: '20min'}, {name: 'Cycling', sets: 1, reps: '15min'}, {name: 'Jump Rope', sets: 1, reps: '5min'}]) },
      { name: 'Yoga Flow', type: 'Flexibility', difficulty: 'Easy', duration: 60, calories: 180, exercises: JSON.stringify([{name: 'Sun Salutation', sets: 5, reps: 1}, {name: 'Warrior Poses', sets: 3, reps: '30s each'}, {name: 'Pigeon Pose', sets: 2, reps: '60s each'}]) },
      { name: 'Push Day', type: 'Strength', difficulty: 'Hard', duration: 50, calories: 380, exercises: JSON.stringify([{name: 'Incline Press', sets: 4, reps: 10}, {name: 'Dips', sets: 3, reps: 12}, {name: 'Tricep Extensions', sets: 3, reps: 15}]) },
      { name: 'Pull Day', type: 'Strength', difficulty: 'Hard', duration: 50, calories: 370, exercises: JSON.stringify([{name: 'Pull-ups', sets: 4, reps: 8}, {name: 'Bent Over Rows', sets: 4, reps: 10}, {name: 'Bicep Curls', sets: 3, reps: 12}]) },
      { name: 'Leg Day', type: 'Strength', difficulty: 'Hard', duration: 55, calories: 420, exercises: JSON.stringify([{name: 'Leg Press', sets: 4, reps: 12}, {name: 'Romanian Deadlifts', sets: 4, reps: 10}, {name: 'Calf Raises', sets: 4, reps: 15}]) },
      { name: 'Tabata Training', type: 'HIIT', difficulty: 'Hard', duration: 25, calories: 320, exercises: JSON.stringify([{name: 'Sprints', sets: 8, reps: '20s'}, {name: 'Rest', sets: 8, reps: '10s'}]) },
      { name: 'Functional Fitness', type: 'Functional', difficulty: 'Medium', duration: 45, calories: 380, exercises: JSON.stringify([{name: 'Kettlebell Swings', sets: 4, reps: 15}, {name: 'Box Jumps', sets: 3, reps: 10}, {name: 'Battle Ropes', sets: 3, reps: '30s'}]) },
      { name: 'Morning Stretch', type: 'Flexibility', difficulty: 'Easy', duration: 20, calories: 80, exercises: JSON.stringify([{name: 'Neck Rolls', sets: 2, reps: 10}, {name: 'Shoulder Stretch', sets: 2, reps: '30s'}, {name: 'Hamstring Stretch', sets: 2, reps: '30s'}]) },
      { name: 'Athletic Conditioning', type: 'Conditioning', difficulty: 'Hard', duration: 50, calories: 480, exercises: JSON.stringify([{name: 'Agility Ladder', sets: 4, reps: 1}, {name: 'Cone Drills', sets: 4, reps: 1}, {name: 'Sprint Intervals', sets: 6, reps: '30s'}]) },
      { name: 'CrossFit WOD', type: 'CrossFit', difficulty: 'Hard', duration: 40, calories: 450, exercises: JSON.stringify([{name: 'Thrusters', sets: 3, reps: 15}, {name: 'Pull-ups', sets: 3, reps: 10}, {name: 'Box Jumps', sets: 3, reps: 20}]) },
      { name: 'Bodyweight Basics', type: 'Bodyweight', difficulty: 'Easy', duration: 35, calories: 250, exercises: JSON.stringify([{name: 'Push-ups', sets: 3, reps: 15}, {name: 'Squats', sets: 3, reps: 20}, {name: 'Dips', sets: 3, reps: 10}]) },
      { name: 'Powerlifting Focus', type: 'Strength', difficulty: 'Hard', duration: 75, calories: 400, exercises: JSON.stringify([{name: 'Squat', sets: 5, reps: 5}, {name: 'Bench Press', sets: 5, reps: 5}, {name: 'Deadlift', sets: 5, reps: 5}]) },
    ];

    for (const workout of workouts) {
      await pool.query(
        'INSERT INTO workouts (user_id, name, type, difficulty, duration, calories, exercises) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, workout.name, workout.type, workout.difficulty, workout.duration, workout.calories, workout.exercises]
      );
    }

    // Seed Golf Swings (16 items)
    const golfSwings = [
      { name: 'Driver Practice 1', club_type: 'Driver', swing_speed: 105.5, ball_speed: 155.2, launch_angle: 12.5, spin_rate: 2800, carry_distance: 245.0, total_distance: 268.0, notes: 'Good tempo, slight fade' },
      { name: 'Driver Practice 2', club_type: 'Driver', swing_speed: 108.2, ball_speed: 160.1, launch_angle: 11.8, spin_rate: 2650, carry_distance: 255.0, total_distance: 280.0, notes: 'Better contact, straighter ball flight' },
      { name: '7-Iron Session', club_type: '7-Iron', swing_speed: 85.0, ball_speed: 115.5, launch_angle: 18.2, spin_rate: 6500, carry_distance: 165.0, total_distance: 172.0, notes: 'Consistent strikes' },
      { name: 'Pitching Wedge Work', club_type: 'PW', swing_speed: 75.0, ball_speed: 98.0, launch_angle: 25.0, spin_rate: 8500, carry_distance: 125.0, total_distance: 128.0, notes: 'Working on spin control' },
      { name: '5-Iron Power', club_type: '5-Iron', swing_speed: 90.2, ball_speed: 128.5, launch_angle: 14.5, spin_rate: 4800, carry_distance: 185.0, total_distance: 198.0, notes: 'Good ball striking' },
      { name: '3-Wood Off Tee', club_type: '3-Wood', swing_speed: 98.5, ball_speed: 142.0, launch_angle: 10.5, spin_rate: 3200, carry_distance: 225.0, total_distance: 245.0, notes: 'Reliable fairway finder' },
      { name: 'Sand Wedge Bunker', club_type: 'SW', swing_speed: 65.0, ball_speed: 70.0, launch_angle: 35.0, spin_rate: 9500, carry_distance: 75.0, total_distance: 77.0, notes: 'Bunker practice session' },
      { name: 'Hybrid Long Approach', club_type: 'Hybrid', swing_speed: 92.0, ball_speed: 132.0, launch_angle: 16.0, spin_rate: 4200, carry_distance: 195.0, total_distance: 210.0, notes: 'Great for long par 3s' },
      { name: 'Driver Max Speed', club_type: 'Driver', swing_speed: 112.0, ball_speed: 168.5, launch_angle: 13.2, spin_rate: 2450, carry_distance: 275.0, total_distance: 302.0, notes: 'New personal best!' },
      { name: '9-Iron Accuracy', club_type: '9-Iron', swing_speed: 78.0, ball_speed: 105.0, launch_angle: 22.0, spin_rate: 7800, carry_distance: 140.0, total_distance: 143.0, notes: 'Pin seeking shots' },
      { name: '6-Iron Draw Practice', club_type: '6-Iron', swing_speed: 87.5, ball_speed: 122.0, launch_angle: 16.5, spin_rate: 5500, carry_distance: 175.0, total_distance: 185.0, notes: 'Working on draw shape' },
      { name: 'Lob Wedge Touch', club_type: 'LW', swing_speed: 55.0, ball_speed: 58.0, launch_angle: 40.0, spin_rate: 10500, carry_distance: 55.0, total_distance: 56.0, notes: 'Flop shot practice' },
      { name: '4-Iron Stinger', club_type: '4-Iron', swing_speed: 95.0, ball_speed: 138.0, launch_angle: 8.5, spin_rate: 3800, carry_distance: 200.0, total_distance: 225.0, notes: 'Low punch shot' },
      { name: 'Driver Fade Setup', club_type: 'Driver', swing_speed: 103.0, ball_speed: 152.0, launch_angle: 14.0, spin_rate: 3100, carry_distance: 238.0, total_distance: 258.0, notes: 'Controlled fade for tight fairways' },
      { name: '8-Iron Stock Shot', club_type: '8-Iron', swing_speed: 80.5, ball_speed: 110.0, launch_angle: 20.0, spin_rate: 7200, carry_distance: 150.0, total_distance: 155.0, notes: 'Bread and butter club' },
      { name: 'Gap Wedge Approach', club_type: 'GW', swing_speed: 70.0, ball_speed: 92.0, launch_angle: 27.0, spin_rate: 8800, carry_distance: 110.0, total_distance: 112.0, notes: 'Dialing in 110 yard shots' },
    ];

    for (const swing of golfSwings) {
      await pool.query(
        'INSERT INTO golf_swings (user_id, name, club_type, swing_speed, ball_speed, launch_angle, spin_rate, carry_distance, total_distance, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [userId, swing.name, swing.club_type, swing.swing_speed, swing.ball_speed, swing.launch_angle, swing.spin_rate, swing.carry_distance, swing.total_distance, swing.notes]
      );
    }

    // Seed Running Sessions (16 items)
    const runningSessions = [
      { name: 'Morning Easy Run', distance: 5.0, duration: 30, pace: '6:00/km', heart_rate_avg: 145, heart_rate_max: 160, elevation_gain: 50, calories: 350, terrain: 'Road', weather: 'Sunny', notes: 'Felt great, easy effort' },
      { name: 'Tempo Run', distance: 8.0, duration: 40, pace: '5:00/km', heart_rate_avg: 165, heart_rate_max: 178, elevation_gain: 80, calories: 520, terrain: 'Road', weather: 'Cloudy', notes: 'Pushed the pace, good workout' },
      { name: 'Long Run Sunday', distance: 18.0, duration: 108, pace: '6:00/km', heart_rate_avg: 150, heart_rate_max: 168, elevation_gain: 200, calories: 1200, terrain: 'Mixed', weather: 'Cool', notes: 'Building endurance base' },
      { name: 'Track Intervals', distance: 6.0, duration: 35, pace: '5:50/km', heart_rate_avg: 170, heart_rate_max: 185, elevation_gain: 0, calories: 420, terrain: 'Track', weather: 'Clear', notes: '8x400m at 5K pace' },
      { name: 'Trail Adventure', distance: 12.0, duration: 85, pace: '7:05/km', heart_rate_avg: 155, heart_rate_max: 172, elevation_gain: 450, calories: 850, terrain: 'Trail', weather: 'Sunny', notes: 'Beautiful forest trail' },
      { name: 'Recovery Jog', distance: 4.0, duration: 28, pace: '7:00/km', heart_rate_avg: 130, heart_rate_max: 142, elevation_gain: 20, calories: 260, terrain: 'Road', weather: 'Warm', notes: 'Easy recovery day' },
      { name: 'Hill Repeats', distance: 7.0, duration: 50, pace: '7:08/km', heart_rate_avg: 168, heart_rate_max: 182, elevation_gain: 350, calories: 520, terrain: 'Hills', weather: 'Cloudy', notes: '6x steep hill repeats' },
      { name: 'Fartlek Fun', distance: 8.5, duration: 48, pace: '5:39/km', heart_rate_avg: 162, heart_rate_max: 180, elevation_gain: 100, calories: 580, terrain: 'Park', weather: 'Cool', notes: 'Varied pace throughout' },
      { name: 'Race Pace Practice', distance: 10.0, duration: 45, pace: '4:30/km', heart_rate_avg: 175, heart_rate_max: 188, elevation_gain: 40, calories: 700, terrain: 'Road', weather: 'Perfect', notes: 'Half marathon pace' },
      { name: 'Early Bird 5K', distance: 5.0, duration: 22, pace: '4:24/km', heart_rate_avg: 178, heart_rate_max: 190, elevation_gain: 25, calories: 380, terrain: 'Road', weather: 'Cool', notes: 'Time trial effort' },
      { name: 'Beach Run', distance: 6.5, duration: 42, pace: '6:28/km', heart_rate_avg: 158, heart_rate_max: 170, elevation_gain: 10, calories: 450, terrain: 'Sand', weather: 'Sunny', notes: 'Tough on the sand!' },
      { name: 'Night Run', distance: 7.0, duration: 42, pace: '6:00/km', heart_rate_avg: 148, heart_rate_max: 162, elevation_gain: 60, calories: 480, terrain: 'Road', weather: 'Cool', notes: 'Peaceful evening run' },
      { name: 'Marathon Training', distance: 22.0, duration: 140, pace: '6:22/km', heart_rate_avg: 152, heart_rate_max: 170, elevation_gain: 180, calories: 1500, terrain: 'Road', weather: 'Overcast', notes: 'Long run with last 5K at goal pace' },
      { name: 'Speed Session', distance: 5.5, duration: 28, pace: '5:05/km', heart_rate_avg: 172, heart_rate_max: 188, elevation_gain: 30, calories: 400, terrain: 'Track', weather: 'Warm', notes: '200m repeats' },
      { name: 'Cross Country', distance: 9.0, duration: 58, pace: '6:27/km', heart_rate_avg: 160, heart_rate_max: 175, elevation_gain: 280, calories: 650, terrain: 'Trail', weather: 'Muddy', notes: 'Technical terrain' },
      { name: 'Progressive Run', distance: 10.0, duration: 52, pace: '5:12/km', heart_rate_avg: 165, heart_rate_max: 182, elevation_gain: 70, calories: 700, terrain: 'Road', weather: 'Clear', notes: 'Negative splits achieved' },
    ];

    for (const session of runningSessions) {
      await pool.query(
        'INSERT INTO running_sessions (user_id, name, distance, duration, pace, heart_rate_avg, heart_rate_max, elevation_gain, calories, terrain, weather, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [userId, session.name, session.distance, session.duration, session.pace, session.heart_rate_avg, session.heart_rate_max, session.elevation_gain, session.calories, session.terrain, session.weather, session.notes]
      );
    }

    // Seed Team Formations (16 items)
    const teamFormations = [
      { team_name: 'FC Thunder', sport: 'Soccer', formation: '4-3-3', players: JSON.stringify([{name: 'Alex', position: 'GK'}, {name: 'Ben', position: 'RB'}, {name: 'Chris', position: 'CB'}, {name: 'Dan', position: 'CB'}, {name: 'Ed', position: 'LB'}]), strategy: 'High pressing attacking style' },
      { team_name: 'City Warriors', sport: 'Basketball', formation: '2-3 Zone', players: JSON.stringify([{name: 'Mike', position: 'PG'}, {name: 'James', position: 'SG'}, {name: 'Kevin', position: 'SF'}, {name: 'Tim', position: 'PF'}, {name: 'Chris', position: 'C'}]), strategy: 'Fast break offense with strong defense' },
      { team_name: 'Storm United', sport: 'Soccer', formation: '4-4-2', players: JSON.stringify([{name: 'Tom', position: 'GK'}, {name: 'Jack', position: 'RB'}, {name: 'Luke', position: 'CB'}, {name: 'Mark', position: 'CB'}, {name: 'Steve', position: 'LB'}]), strategy: 'Counter-attacking football' },
      { team_name: 'Red Hawks', sport: 'American Football', formation: 'I-Formation', players: JSON.stringify([{name: 'QB1', position: 'Quarterback'}, {name: 'RB1', position: 'Running Back'}, {name: 'FB1', position: 'Fullback'}, {name: 'WR1', position: 'Wide Receiver'}]), strategy: 'Power running game' },
      { team_name: 'Blue Knights', sport: 'Hockey', formation: '1-2-2', players: JSON.stringify([{name: 'Goalie1', position: 'Goaltender'}, {name: 'Def1', position: 'Left Defense'}, {name: 'Def2', position: 'Right Defense'}, {name: 'Center1', position: 'Center'}]), strategy: 'Defensive neutral zone trap' },
      { team_name: 'Golden Eagles', sport: 'Volleyball', formation: '5-1', players: JSON.stringify([{name: 'Setter1', position: 'Setter'}, {name: 'OH1', position: 'Outside Hitter'}, {name: 'OH2', position: 'Outside Hitter'}, {name: 'MB1', position: 'Middle Blocker'}]), strategy: 'Quick middle attacks' },
      { team_name: 'Panthers FC', sport: 'Soccer', formation: '3-5-2', players: JSON.stringify([{name: 'GK', position: 'Goalkeeper'}, {name: 'CB1', position: 'Center Back'}, {name: 'CB2', position: 'Center Back'}, {name: 'CB3', position: 'Center Back'}]), strategy: 'Wing play with overloads' },
      { team_name: 'Dynamo', sport: 'Basketball', formation: 'Motion Offense', players: JSON.stringify([{name: 'Point', position: 'PG'}, {name: 'Shooter', position: 'SG'}, {name: 'Wing', position: 'SF'}, {name: 'Post', position: 'PF'}, {name: 'Big', position: 'C'}]), strategy: 'Ball movement and screens' },
      { team_name: 'Sharks', sport: 'Rugby', formation: '4-3-3', players: JSON.stringify([{name: 'Fullback', position: 'FB'}, {name: 'Wing1', position: 'RW'}, {name: 'Wing2', position: 'LW'}, {name: 'Center1', position: 'IC'}]), strategy: 'Wide attacking play' },
      { team_name: 'Blazers', sport: 'American Football', formation: 'Shotgun Spread', players: JSON.stringify([{name: 'QB', position: 'Quarterback'}, {name: 'RB', position: 'Running Back'}, {name: 'WR1', position: 'Slot Receiver'}, {name: 'WR2', position: 'Wide Receiver'}]), strategy: 'Air raid passing attack' },
      { team_name: 'Ice Bears', sport: 'Hockey', formation: '2-1-2', players: JSON.stringify([{name: 'G', position: 'Goalie'}, {name: 'LD', position: 'Left Defense'}, {name: 'RD', position: 'Right Defense'}, {name: 'C', position: 'Center'}]), strategy: 'Aggressive forecheck' },
      { team_name: 'Titans', sport: 'Soccer', formation: '4-2-3-1', players: JSON.stringify([{name: 'GK', position: 'Goalkeeper'}, {name: 'RB', position: 'Right Back'}, {name: 'CB1', position: 'Center Back'}, {name: 'CB2', position: 'Center Back'}]), strategy: 'Possession based play' },
      { team_name: 'Lightning', sport: 'Basketball', formation: 'Princeton Offense', players: JSON.stringify([{name: 'PG', position: 'Point Guard'}, {name: 'SG', position: 'Shooting Guard'}, {name: 'SF', position: 'Small Forward'}, {name: 'PF', position: 'Power Forward'}]), strategy: 'Back door cuts and post play' },
      { team_name: 'Wolves', sport: 'Soccer', formation: '5-3-2', players: JSON.stringify([{name: 'GK', position: 'Goalkeeper'}, {name: 'RWB', position: 'Right Wing Back'}, {name: 'CB1', position: 'Center Back'}, {name: 'CB2', position: 'Center Back'}]), strategy: 'Solid defense with wing backs' },
      { team_name: 'Comets', sport: 'Volleyball', formation: '6-2', players: JSON.stringify([{name: 'S1', position: 'Setter'}, {name: 'S2', position: 'Setter'}, {name: 'OH1', position: 'Outside Hitter'}, {name: 'OH2', position: 'Outside Hitter'}]), strategy: 'Always have 3 hitters front row' },
      { team_name: 'Ravens', sport: 'American Football', formation: '3-4 Defense', players: JSON.stringify([{name: 'NT', position: 'Nose Tackle'}, {name: 'DE1', position: 'Defensive End'}, {name: 'DE2', position: 'Defensive End'}, {name: 'ILB1', position: 'Inside Linebacker'}]), strategy: 'Versatile blitz packages' },
    ];

    for (const team of teamFormations) {
      await pool.query(
        'INSERT INTO team_formations (user_id, team_name, sport, formation, players, strategy) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, team.team_name, team.sport, team.formation, team.players, team.strategy]
      );
    }

    // Seed Recovery Plans (16 items)
    const recoveryPlans = [
      { name: 'Post-Marathon Recovery', recovery_type: 'Active Recovery', duration: 7, intensity: 'Light', activities: JSON.stringify(['Light walking', 'Stretching', 'Foam rolling']), nutrition: JSON.stringify({protein: 120, carbs: 250, hydration: '3L'}), sleep_hours: 9.0, notes: 'Focus on rest and nutrition' },
      { name: 'DOMS Relief', recovery_type: 'Muscle Recovery', duration: 3, intensity: 'Light', activities: JSON.stringify(['Light cardio', 'Massage', 'Epsom salt bath']), nutrition: JSON.stringify({protein: 100, carbs: 180, hydration: '2.5L'}), sleep_hours: 8.0, notes: 'Delayed onset muscle soreness protocol' },
      { name: 'Weekly Rest Day', recovery_type: 'Complete Rest', duration: 1, intensity: 'None', activities: JSON.stringify(['Sleep', 'Light stretching', 'Meditation']), nutrition: JSON.stringify({protein: 80, carbs: 150, hydration: '2L'}), sleep_hours: 9.0, notes: 'Full rest day routine' },
      { name: 'Injury Prevention', recovery_type: 'Prehab', duration: 14, intensity: 'Low', activities: JSON.stringify(['Mobility work', 'Strength exercises', 'Balance training']), nutrition: JSON.stringify({protein: 110, carbs: 200, hydration: '2.5L'}), sleep_hours: 8.0, notes: 'Strengthen weak areas' },
      { name: 'Pre-Competition Taper', recovery_type: 'Taper', duration: 10, intensity: 'Reduced', activities: JSON.stringify(['Light training', 'Visualization', 'Carb loading']), nutrition: JSON.stringify({protein: 90, carbs: 300, hydration: '3L'}), sleep_hours: 9.0, notes: 'Preparing for race day' },
      { name: 'Heat Training Recovery', recovery_type: 'Cooling', duration: 2, intensity: 'Light', activities: JSON.stringify(['Cold shower', 'Ice bath', 'Cool down walk']), nutrition: JSON.stringify({protein: 85, carbs: 180, hydration: '4L', electrolytes: true}), sleep_hours: 8.0, notes: 'Recovery after hot weather training' },
      { name: 'Travel Recovery', recovery_type: 'Jet Lag', duration: 3, intensity: 'Light', activities: JSON.stringify(['Light movement', 'Sun exposure', 'Melatonin timing']), nutrition: JSON.stringify({protein: 80, carbs: 170, hydration: '3L'}), sleep_hours: 8.5, notes: 'Adjusting to new timezone' },
      { name: 'Deload Week', recovery_type: 'Active Recovery', duration: 7, intensity: 'Moderate', activities: JSON.stringify(['50% training volume', 'Technique work', 'Mobility']), nutrition: JSON.stringify({protein: 100, carbs: 200, hydration: '2.5L'}), sleep_hours: 8.0, notes: 'Scheduled deload for adaptation' },
      { name: 'Mental Recovery', recovery_type: 'Mental Health', duration: 5, intensity: 'Low', activities: JSON.stringify(['Meditation', 'Nature walks', 'Reading', 'No training']), nutrition: JSON.stringify({protein: 80, carbs: 180, hydration: '2L'}), sleep_hours: 9.0, notes: 'Mental break from intense training' },
      { name: 'Post-Strength Session', recovery_type: 'Muscle Recovery', duration: 2, intensity: 'Light', activities: JSON.stringify(['Protein shake', 'Light cardio', 'Stretching']), nutrition: JSON.stringify({protein: 140, carbs: 220, hydration: '3L'}), sleep_hours: 8.0, notes: 'Quick recovery between sessions' },
      { name: 'Inflammation Control', recovery_type: 'Anti-Inflammatory', duration: 5, intensity: 'Low', activities: JSON.stringify(['Ice therapy', 'Compression', 'Elevation', 'Light movement']), nutrition: JSON.stringify({protein: 100, carbs: 150, hydration: '3L', omega3: true}), sleep_hours: 8.5, notes: 'Reduce systemic inflammation' },
      { name: 'Sleep Optimization', recovery_type: 'Sleep Quality', duration: 14, intensity: 'None', activities: JSON.stringify(['Sleep hygiene', 'No screens before bed', 'Cool room']), nutrition: JSON.stringify({protein: 80, carbs: 150, hydration: '2L', magnesium: true}), sleep_hours: 9.5, notes: 'Improving sleep quality' },
      { name: 'Fascia Release', recovery_type: 'Soft Tissue', duration: 4, intensity: 'Moderate', activities: JSON.stringify(['Foam rolling', 'Lacrosse ball', 'Massage gun', 'Stretching']), nutrition: JSON.stringify({protein: 90, carbs: 170, hydration: '2.5L'}), sleep_hours: 8.0, notes: 'Myofascial release protocol' },
      { name: 'Post-Game Recovery', recovery_type: 'Sport Specific', duration: 2, intensity: 'Light', activities: JSON.stringify(['Cool down', 'Ice bath', 'Compression', 'Nutrition']), nutrition: JSON.stringify({protein: 130, carbs: 280, hydration: '3.5L'}), sleep_hours: 9.0, notes: 'Basketball game recovery' },
      { name: 'Overtraining Recovery', recovery_type: 'Complete Rest', duration: 14, intensity: 'Minimal', activities: JSON.stringify(['No training', 'Light walks', 'Sleep focus', 'Stress reduction']), nutrition: JSON.stringify({protein: 100, carbs: 200, hydration: '2.5L'}), sleep_hours: 10.0, notes: 'Recovering from overtraining syndrome' },
      { name: 'Altitude Adjustment', recovery_type: 'Acclimatization', duration: 7, intensity: 'Reduced', activities: JSON.stringify(['Gradual activity increase', 'Hydration focus', 'Rest']), nutrition: JSON.stringify({protein: 90, carbs: 220, hydration: '4L', iron: true}), sleep_hours: 9.0, notes: 'Adjusting to high altitude training' },
    ];

    for (const plan of recoveryPlans) {
      await pool.query(
        'INSERT INTO recovery_plans (user_id, name, recovery_type, duration, intensity, activities, nutrition, sleep_hours, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [userId, plan.name, plan.recovery_type, plan.duration, plan.intensity, plan.activities, plan.nutrition, plan.sleep_hours, plan.notes]
      );
    }

    // Seed Notifications (15 items)
    const notifications = [
      { type: 'workout', title: 'New Workout Generated', message: 'Your AI-generated Full Body HIIT workout is ready!', link: '/workouts' },
      { type: 'achievement', title: 'Weekly Goal Met!', message: 'You completed 5 workouts this week. Keep it up!', link: '/dashboard' },
      { type: 'reminder', title: 'Time for Recovery', message: 'It has been 3 days since your last rest day. Consider taking a break.', link: '/recovery' },
      { type: 'analysis', title: 'Golf Analysis Ready', message: 'Your swing analysis for Driver Practice is complete.', link: '/golf' },
      { type: 'running', title: 'New Personal Best!', message: 'You set a new 5K personal best of 22:00!', link: '/running' },
      { type: 'team', title: 'Formation Updated', message: 'FC Thunder formation has been optimized by AI.', link: '/team' },
      { type: 'system', title: 'Welcome to AI Fitness Coach', message: 'Start your fitness journey with our AI-powered tools.', link: '/dashboard' },
      { type: 'workout', title: 'Workout Streak!', message: 'You have been working out for 7 days in a row!', link: '/workouts' },
      { type: 'reminder', title: 'Hydration Reminder', message: 'Don\'t forget to drink water! Aim for 3L today.', link: '/recovery' },
      { type: 'analysis', title: 'Running Coach Insight', message: 'Your tempo run pace has improved by 15 seconds this month.', link: '/running' },
      { type: 'achievement', title: 'First Month Complete', message: 'You have been using AI Fitness Coach for 30 days!', link: '/dashboard' },
      { type: 'system', title: 'New Feature Available', message: 'Check out the new progress charts feature!', link: '/progress' },
      { type: 'recovery', title: 'Recovery Plan Complete', message: 'Your Post-Marathon Recovery plan has been completed.', link: '/recovery' },
      { type: 'workout', title: 'Try Something New', message: 'Based on your history, try a Yoga Flow session today.', link: '/workouts' },
      { type: 'reminder', title: 'Weekly Summary Ready', message: 'Your weekly fitness summary is ready to view.', link: '/progress' },
    ];

    for (const notif of notifications) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, read, link) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, notif.type, notif.title, notif.message, Math.random() > 0.5, notif.link]
      );
    }

    // Seed Feedback (15 items)
    const feedbackItems = [
      { type: 'feature', subject: 'Add meal tracking', message: 'It would be great to have a meal/nutrition tracking feature integrated with the recovery plans.', status: 'open' },
      { type: 'bug', subject: 'Golf chart not loading', message: 'The golf swing comparison chart sometimes fails to load on mobile devices.', status: 'in_progress' },
      { type: 'general', subject: 'Great app!', message: 'Really enjoying the AI workout generator. The plans are well structured and challenging.', status: 'closed' },
      { type: 'feature', subject: 'Social features', message: 'Would love to share workouts with friends and compete on leaderboards.', status: 'open' },
      { type: 'bug', subject: 'Timer resets on tab switch', message: 'When switching browser tabs, the workout timer resets to zero.', status: 'open' },
      { type: 'feature', subject: 'Apple Watch integration', message: 'Please add integration with Apple Watch for heart rate monitoring during workouts.', status: 'open' },
      { type: 'general', subject: 'Running coach feedback', message: 'The AI running coach gave me great pacing advice for my half marathon training.', status: 'closed' },
      { type: 'bug', subject: 'Duplicate workout entries', message: 'Sometimes when saving a workout, it creates two copies.', status: 'in_progress' },
      { type: 'feature', subject: 'Custom exercise library', message: 'Allow users to create and save their own custom exercises for workout plans.', status: 'open' },
      { type: 'general', subject: 'Team formation tool', message: 'The team formation optimizer helped our coach plan better strategies.', status: 'closed' },
      { type: 'feature', subject: 'Video analysis', message: 'Add video upload for AI golf swing analysis using computer vision.', status: 'open' },
      { type: 'bug', subject: 'Login issue after password reset', message: 'After resetting my password, I could not log in until clearing browser cache.', status: 'closed' },
      { type: 'feature', subject: 'Workout reminders', message: 'Push notification reminders for scheduled workouts.', status: 'open' },
      { type: 'general', subject: 'Recovery plan accuracy', message: 'The recovery plan suggestions are spot on. Sleep recommendations have helped a lot.', status: 'closed' },
      { type: 'bug', subject: 'Search not finding results', message: 'Searching for "HIIT" workouts returns empty even though I have several.', status: 'open' },
    ];

    for (const fb of feedbackItems) {
      await pool.query(
        'INSERT INTO feedback (user_id, type, subject, message, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, fb.type, fb.subject, fb.message, fb.status]
      );
    }

    // Seed File Uploads (15 items - metadata only, no actual files)
    const fileUploads = [
      { filename: 'progress_jan_front.jpg', original_name: 'front_photo_jan.jpg', mime_type: 'image/jpeg', size: 2048000, category: 'progress_photo', notes: 'January front progress photo' },
      { filename: 'progress_jan_side.jpg', original_name: 'side_photo_jan.jpg', mime_type: 'image/jpeg', size: 1920000, category: 'progress_photo', notes: 'January side progress photo' },
      { filename: 'progress_feb_front.jpg', original_name: 'front_photo_feb.jpg', mime_type: 'image/jpeg', size: 2100000, category: 'progress_photo', notes: 'February front progress photo' },
      { filename: 'workout_plan_q1.pdf', original_name: 'Q1_workout_plan.pdf', mime_type: 'application/pdf', size: 512000, category: 'document', notes: 'Q1 training plan document' },
      { filename: 'meal_prep_guide.pdf', original_name: 'meal_prep.pdf', mime_type: 'application/pdf', size: 768000, category: 'document', notes: 'Meal prep guide for bulking' },
      { filename: 'golf_swing_video_1.mp4', original_name: 'driver_swing.mp4', mime_type: 'video/mp4', size: 15000000, category: 'video', notes: 'Driver swing recording for analysis' },
      { filename: 'running_route_map.png', original_name: 'favorite_route.png', mime_type: 'image/png', size: 890000, category: 'other', notes: 'My favorite 10K running route' },
      { filename: 'progress_feb_side.jpg', original_name: 'side_photo_feb.jpg', mime_type: 'image/jpeg', size: 2050000, category: 'progress_photo', notes: 'February side progress photo' },
      { filename: 'blood_work_results.pdf', original_name: 'lab_results_2024.pdf', mime_type: 'application/pdf', size: 340000, category: 'document', notes: 'Annual blood work results' },
      { filename: 'progress_mar_front.jpg', original_name: 'front_photo_mar.jpg', mime_type: 'image/jpeg', size: 2200000, category: 'progress_photo', notes: 'March front progress photo' },
      { filename: 'team_photo.jpg', original_name: 'fc_thunder_team.jpg', mime_type: 'image/jpeg', size: 3500000, category: 'other', notes: 'FC Thunder team photo' },
      { filename: 'golf_swing_video_2.mp4', original_name: 'iron_swing.mp4', mime_type: 'video/mp4', size: 12000000, category: 'video', notes: '7-Iron swing slow motion' },
      { filename: 'race_certificate.pdf', original_name: '5k_certificate.pdf', mime_type: 'application/pdf', size: 256000, category: 'document', notes: '5K race completion certificate' },
      { filename: 'progress_mar_side.jpg', original_name: 'side_photo_mar.jpg', mime_type: 'image/jpeg', size: 2150000, category: 'progress_photo', notes: 'March side progress photo' },
      { filename: 'stretching_routine.pdf', original_name: 'daily_stretches.pdf', mime_type: 'application/pdf', size: 420000, category: 'document', notes: 'Daily stretching routine reference' },
    ];

    for (const file of fileUploads) {
      await pool.query(
        'INSERT INTO file_uploads (user_id, filename, original_name, mime_type, size, category, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, file.filename, file.original_name, file.mime_type, file.size, file.category, file.notes]
      );
    }

    // Seed Audit Logs (15 items)
    const auditLogs = [
      { action: 'LOGIN', resource: 'auth', details: JSON.stringify({ method: 'email' }), ip: '192.168.1.100' },
      { action: 'CREATE', resource: 'workout', resource_id: 1, details: JSON.stringify({ name: 'Full Body HIIT' }), ip: '192.168.1.100' },
      { action: 'UPDATE', resource: 'workout', resource_id: 1, details: JSON.stringify({ field: 'duration', old: 40, new: 45 }), ip: '192.168.1.100' },
      { action: 'AI_GENERATE', resource: 'workout', details: JSON.stringify({ type: 'Workout Plan' }), ip: '192.168.1.100' },
      { action: 'CREATE', resource: 'golf_swing', resource_id: 1, details: JSON.stringify({ name: 'Driver Practice 1' }), ip: '192.168.1.100' },
      { action: 'AI_ANALYZE', resource: 'golf_swing', resource_id: 1, details: JSON.stringify({ type: 'Swing Analysis' }), ip: '192.168.1.101' },
      { action: 'CREATE', resource: 'running_session', resource_id: 1, details: JSON.stringify({ name: 'Morning Easy Run' }), ip: '192.168.1.100' },
      { action: 'AI_ANALYZE', resource: 'running_session', resource_id: 1, details: JSON.stringify({ type: 'Running Analysis' }), ip: '192.168.1.100' },
      { action: 'UPDATE', resource: 'profile', details: JSON.stringify({ field: 'weight', old: 85, new: 82 }), ip: '192.168.1.100' },
      { action: 'AI_OPTIMIZE', resource: 'team_formation', resource_id: 1, details: JSON.stringify({ type: 'Formation Optimization' }), ip: '192.168.1.102' },
      { action: 'DELETE', resource: 'workout', resource_id: 99, details: JSON.stringify({ name: 'Old Workout' }), ip: '192.168.1.100' },
      { action: 'EXPORT', resource: 'data', details: JSON.stringify({ format: 'csv', type: 'workouts' }), ip: '192.168.1.100' },
      { action: 'UPDATE', resource: 'settings', details: JSON.stringify({ field: 'theme', old: 'light', new: 'dark' }), ip: '192.168.1.100' },
      { action: 'UPLOAD', resource: 'file', resource_id: 1, details: JSON.stringify({ filename: 'progress_jan_front.jpg' }), ip: '192.168.1.100' },
      { action: 'CREATE', resource: 'recovery_plan', resource_id: 1, details: JSON.stringify({ name: 'Post-Marathon Recovery' }), ip: '192.168.1.100' },
    ];

    for (const log of auditLogs) {
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, log.action, log.resource, log.resource_id || null, log.details, log.ip]
      );
    }

    console.log('Seed data inserted successfully!');
    console.log('Demo data seeded with environment-provided credentials.');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await pool.end();
  }
};

seedData();
