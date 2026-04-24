require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const setupDatabase = async () => {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'ai_fitness_coach']
    );

    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'ai_fitness_coach'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (err) {
    if (err.code !== '42P04') {
      console.error('Error creating database:', err);
    }
  } finally {
    await adminPool.end();
  }

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_fitness_coach',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await pool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add new columns to users if they don't exist
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

      -- Workouts table
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        difficulty VARCHAR(50),
        duration INTEGER,
        calories INTEGER,
        exercises JSONB,
        ai_generated BOOLEAN DEFAULT FALSE,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

      -- Golf Swings table
      CREATE TABLE IF NOT EXISTS golf_swings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        club_type VARCHAR(100),
        swing_speed DECIMAL(5,2),
        ball_speed DECIMAL(5,2),
        launch_angle DECIMAL(5,2),
        spin_rate INTEGER,
        carry_distance DECIMAL(5,2),
        total_distance DECIMAL(5,2),
        notes TEXT,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Running Sessions table
      CREATE TABLE IF NOT EXISTS running_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        distance DECIMAL(5,2),
        duration INTEGER,
        pace VARCHAR(20),
        heart_rate_avg INTEGER,
        heart_rate_max INTEGER,
        elevation_gain INTEGER,
        calories INTEGER,
        terrain VARCHAR(100),
        weather VARCHAR(100),
        notes TEXT,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Team Formations table
      CREATE TABLE IF NOT EXISTS team_formations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        team_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100),
        formation VARCHAR(100),
        players JSONB,
        strategy TEXT,
        notes TEXT,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Recovery Plans table
      CREATE TABLE IF NOT EXISTS recovery_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        recovery_type VARCHAR(100),
        duration INTEGER,
        intensity VARCHAR(50),
        activities JSONB,
        nutrition JSONB,
        sleep_hours DECIMAL(3,1),
        notes TEXT,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User Profiles table
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        height DECIMAL,
        weight DECIMAL,
        age INTEGER,
        fitness_level VARCHAR(50),
        gender VARCHAR(20),
        goals TEXT,
        injuries TEXT,
        avatar_url TEXT,
        onboarding_complete BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User Settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        theme VARCHAR(20) DEFAULT 'dark',
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        units VARCHAR(10) DEFAULT 'metric',
        timezone VARCHAR(50) DEFAULT 'UTC',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50),
        title VARCHAR(255),
        message TEXT,
        read BOOLEAN DEFAULT false,
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Feedback table
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- File Uploads table
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        filename VARCHAR(255),
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        size INTEGER,
        category VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit Logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100),
        resource VARCHAR(100),
        resource_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
};

setupDatabase().then(() => {
  console.log('Database setup complete');
  process.exit(0);
}).catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
