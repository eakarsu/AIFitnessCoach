const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const authValidation = {
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidation
  ],
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters'),
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    handleValidation
  ]
};

const workoutValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('type').optional().trim().isLength({ max: 100 }),
    body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
    body('duration').optional().isInt({ min: 1, max: 600 }),
    body('calories').optional().isInt({ min: 0, max: 10000 }),
    handleValidation
  ]
};

const golfValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('club_type').optional().trim().isLength({ max: 100 }),
    body('swing_speed').optional().isFloat({ min: 0, max: 200 }),
    body('ball_speed').optional().isFloat({ min: 0, max: 300 }),
    body('launch_angle').optional().isFloat({ min: -10, max: 60 }),
    body('spin_rate').optional().isInt({ min: 0, max: 15000 }),
    body('carry_distance').optional().isFloat({ min: 0, max: 400 }),
    body('total_distance').optional().isFloat({ min: 0, max: 500 }),
    handleValidation
  ]
};

const runningValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('distance').optional().isFloat({ min: 0, max: 200 }),
    body('duration').optional().isInt({ min: 1, max: 1440 }),
    body('heart_rate_avg').optional().isInt({ min: 30, max: 250 }),
    body('heart_rate_max').optional().isInt({ min: 30, max: 250 }),
    body('elevation_gain').optional().isInt({ min: 0, max: 10000 }),
    body('calories').optional().isInt({ min: 0, max: 10000 }),
    handleValidation
  ]
};

const teamValidation = {
  create: [
    body('team_name').trim().isLength({ min: 1, max: 255 }).withMessage('Team name is required'),
    body('sport').optional().trim().isLength({ max: 100 }),
    body('formation').optional().trim().isLength({ max: 100 }),
    handleValidation
  ]
};

const recoveryValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('recovery_type').optional().trim().isLength({ max: 100 }),
    body('duration').optional().isInt({ min: 1, max: 365 }),
    body('intensity').optional().trim().isLength({ max: 50 }),
    body('sleep_hours').optional().isFloat({ min: 0, max: 24 }),
    handleValidation
  ]
};

const profileValidation = {
  update: [
    body('height').optional().isFloat({ min: 0, max: 300 }),
    body('weight').optional().isFloat({ min: 0, max: 500 }),
    body('age').optional().isInt({ min: 1, max: 150 }),
    body('fitness_level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Elite']),
    body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
    handleValidation
  ]
};

const feedbackValidation = {
  create: [
    body('type').isIn(['bug', 'feature', 'general']).withMessage('Valid type is required'),
    body('subject').trim().isLength({ min: 1, max: 255 }).withMessage('Subject is required'),
    body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required'),
    handleValidation
  ]
};

module.exports = {
  authValidation,
  workoutValidation,
  golfValidation,
  runningValidation,
  teamValidation,
  recoveryValidation,
  profileValidation,
  feedbackValidation,
  handleValidation
};
