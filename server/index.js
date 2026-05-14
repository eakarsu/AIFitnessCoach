require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Pool } = require('pg');
const logger = require('./utils/logger');
const { generalLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');
const auditLog = require('./middleware/audit');
const { assertOpenRouterConfigured } = require('./utils/openrouter');

// Fail fast in production if critical secrets are missing.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is required in production. Refusing to start.');
    process.exit(1);
  }
}
// Warn (dev) or throw (prod) when OpenRouter is not configured.
try {
  assertOpenRouterConfigured();
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_fitness_coach',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// Make pool available to routes
app.locals.pool = pool;

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const golfRoutes = require('./routes/golf');
const runningRoutes = require('./routes/running');
const teamRoutes = require('./routes/team');
const recoveryRoutes = require('./routes/recovery');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const feedbackRoutes = require('./routes/feedback');
const exportRoutes = require('./routes/export');
const progressRoutes = require('./routes/progress');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const passwordResetRoutes = require('./routes/passwordReset');
const aiNewRoutes = require('./routes/aiNew');

// Audit logging middleware for all write operations
app.use('/api', auditLog);

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/golf', golfRoutes);
app.use('/api/running', runningRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/ai', aiNewRoutes);
// Pass-5 backlog: NEEDS-CREDS wearable + payments stubs, NEEDS-PRODUCT-DECISION marketplace + challenges
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/agentic-coach', require('./routes/agenticCoach'));
app.use('/api/form-analysis', require('./routes/formAnalysis'));
app.use('/api/biometric-ingest', require('./routes/biometricIngest'));
app.use('/api/predictive-performance', require('./routes/predictivePerformance'));
app.use('/api/injury-prediction', require('./routes/injuryPrediction'));
app.use('/api/group-challenges', require('./routes/groupChallenges'));
app.use('/api/recovery-protocols', require('./routes/recoveryProtocols'));

// Enhanced health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    status: 'ok',
    message: 'AI Fitness Coach API is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    database: dbStatus,
    memory: {
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: Origin not allowed' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Something went wrong!',
    type: err.type || 'ServerError',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
